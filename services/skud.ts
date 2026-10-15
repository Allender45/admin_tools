// services/skud.ts
// Интеграция со СКУД «Орион Про» (Болид) напрямую через MS SQL.
//
// Принцип: при создании сотрудника пишем две строки —
//   pList  — карточка сотрудника (ФИО, телефон, должность, отдел, компания);
//   pMark  — ключ (код карты + уровень доступа).
// Ядро опроса Орион Про само подхватывает новые строки из базы
// и записывает ключи в контроллеры в течение ~1 минуты (проверено
// экспериментально 05.10.2026, в т.ч. физическим проходом по карте).
// Удаление строки из pMark так же автоматически стирает ключ из контроллеров.
//
// Формат поля pMark.CodeP (разобран и подтверждён побайтно на реальных картах):
//   байт 0x08 (длина кода) + 8 байт кода в ОБРАТНОМ порядке,
//   каждый байт 0x00 заменён парой байт 0xFE 0x01.
//   Пример: карта AE003E007CA46101 -> 08 01 61 A4 7C FE 01 3E FE 01 AE.
//
// Подключение настраивается через .env:
//   SKUD_SQL_SERVER=SRVORION
//   SKUD_SQL_INSTANCE=SQLSERVER2012
//   SKUD_SQL_DB=bolid
//   SKUD_SQL_USER=sa
//   SKUD_SQL_PASSWORD=...
//   SKUD_DEFAULT_COMPANY_ID=2     (компания в Орионе, если не указана явно)
//   SKUD_DEFAULT_ACCESS_LEVEL=11  (уровень доступа; 11 = все 4 двери, 10 = AP 1,2)

import os from 'os'
import sql from 'mssql'

// Собственный тип ошибки, чтобы в API отличать сбои СКУД от багов кода
export class SkudError extends Error {}

const config: sql.config = {
    server: process.env.SKUD_SQL_SERVER ?? 'SRVORION',
    database: process.env.SKUD_SQL_DB ?? 'bolid',
    user: process.env.SKUD_SQL_USER ?? 'sa',
    password: process.env.SKUD_SQL_PASSWORD ?? '',
    options: {
        instanceName: process.env.SKUD_SQL_INSTANCE ?? 'SQLSERVER2012',
        encrypt: false,               // SQL Server 2012 Express, локальная сеть
        trustServerCertificate: true,
    },
    pool: { max: 4, min: 0, idleTimeoutMillis: 30000 },
    requestTimeout: 30000,
}

const DEFAULT_COMPANY_ID = Number(process.env.SKUD_DEFAULT_COMPANY_ID ?? 2)
const DEFAULT_ACCESS_LEVEL = Number(process.env.SKUD_DEFAULT_ACCESS_LEVEL ?? 11)

let poolPromise: Promise<sql.ConnectionPool> | null = null

function getPool(): Promise<sql.ConnectionPool> {
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(config).connect().catch((e) => {
            poolPromise = null // следующий вызов попробует подключиться заново
            throw new SkudError(`СКУД: нет соединения с SQL (${(e as Error).message})`)
        })
    }
    return poolPromise
}

// Упаковка 16-значного hex-кода карты в вид для pMark.CodeP.
// Возвращает hex-строку для вставки как CONVERT(varchar(50), 0x....).
export function packCardCode(cardHex: string): string {
    const hex = cardHex.trim().toUpperCase()
    if (!/^[0-9A-F]{16}$/.test(hex)) {
        throw new SkudError(`СКУД: код карты должен быть ровно 16 hex-символов, получено «${cardHex}»`)
    }
    const bytes: number[] = []
    for (let i = 0; i < 8; i++) bytes.push(parseInt(hex.slice(i * 2, i * 2 + 2), 16))
    bytes.reverse()
    const out: number[] = [0x08]
    for (const b of bytes) {
        if (b === 0x00) out.push(0xfe, 0x01)
        else out.push(b)
    }
    return out.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join('')
}

export interface SkudUserInput {
    lastName: string
    firstName: string
    middleName: string | null
    cardCode: string            // 16 hex-символов, как показывает АБД/UProg
    phone?: string | null
    positionName?: string | null   // должность — ищем/создаём в справочнике PPost
    departmentName?: string | null // отдел — ищем/создаём в справочнике PDivision
    companyName?: string | null    // компания — ищем/создаём в PCompany; если нет — SKUD_DEFAULT_COMPANY_ID
    accessLevel?: number           // уровень доступа Ориона; по умолчанию SKUD_DEFAULT_ACCESS_LEVEL
}

export interface SkudUserResult {
    personId: number    // pList.ID
    keyId: number       // pMark.ID
    ownerName: string   // «Фамилия И. О.» — как отображается в Орионе
    reassignedFrom?: string  // если карта была у другого сотрудника — его OwnerName
}

// «Фамилия И. О.» — формат OwnerName в Орионе
function buildOwnerName(lastName: string, firstName: string, middleName: string | null): string {
    let s = lastName.trim()
    if (firstName.trim()) s += ` ${firstName.trim()[0].toUpperCase()}.`
    if (middleName?.trim()) s += ` ${middleName.trim()[0].toUpperCase()}.`
    return s
}

// Найти запись справочника по имени; если нет — создать. Возвращает ID.
// Именно так поступает АБД, когда оператор вводит новую должность/отдел.
// ВАЖНО: каждый запрос — новый sql.Request, т.к. Request накапливает параметры.
async function lookupOrCreateRef(
    tx: sql.Transaction,
    table: 'PPost' | 'PDivision' | 'PCompany',
    name: string,
): Promise<number> {
    const trimmed = name.trim()
    const found = await new sql.Request(tx)
        .input('nm', sql.NVarChar(100), trimmed)
        .query(`SELECT ID FROM ${table} WHERE Name = @nm`)
    if (found.recordset.length > 0) return found.recordset[0].ID as number

    const created = await new sql.Request(tx)
        .input('nm', sql.NVarChar(100), trimmed)
        .query(`
            DECLARE @id INT;
            SELECT @id = ISNULL(MAX(ID), 0) + 1 FROM ${table};
            INSERT INTO ${table} (ID, Name) VALUES (@id, @nm);
            SELECT @id AS id;
        `)
    return created.recordset[0].id as number
}

// Создать сотрудника и привязать карту доступа.
// Две вставки в одной транзакции: pList + pMark.
export async function createSkudUser(input: SkudUserInput): Promise<SkudUserResult> {
    const packed = packCardCode(input.cardCode)
    const ownerName = buildOwnerName(input.lastName, input.firstName, input.middleName ?? null)
    const accessLevel = input.accessLevel ?? DEFAULT_ACCESS_LEVEL

    const pool = await getPool()
    const tx = new sql.Transaction(pool)
    await tx.begin()

    try {
        // Карта уже кому-то выдана? Если да — перевыдаём:
        // отвязываем от прежнего владельца и привязываем к новому.
        // Всё в одной транзакции: при сбое ниже откатится и это удаление.
        let reassignedFrom: string | undefined
        const dup = await new sql.Request(tx).query(`
            SELECT ID, Owner, OwnerName FROM pMark
            WHERE CONVERT(varbinary(64), CodeP) = 0x${packed}
        `)
        if (dup.recordset.length > 0) {
            const old = dup.recordset[0] as { ID: number; Owner: number; OwnerName: string }
            reassignedFrom = old.OwnerName
            console.warn(`[SKUD] перевыдача карты ${input.cardCode}: была у «${old.OwnerName}» (pList ID=${old.Owner})`)
            await new sql.Request(tx)
                .input('kid', sql.Int, old.ID)
                .query('DELETE FROM pMark WHERE ID = @kid')
        }

        // Справочники: должность / отдел / компания
        const postId = input.positionName ? await lookupOrCreateRef(tx, 'PPost', input.positionName) : 0
        const sectionId = input.departmentName ? await lookupOrCreateRef(tx, 'PDivision', input.departmentName) : 0
        const companyId = input.companyName
            ? await lookupOrCreateRef(tx, 'PCompany', input.companyName)
            : DEFAULT_COMPANY_ID

        const now = new Date()
        const finish = new Date(now)
        finish.setFullYear(finish.getFullYear() + 73)
        finish.setHours(23, 59, 59, 0)

        const workstation = os.hostname()
        const noDate = new Date('1899-12-30T00:00:00') // «пустая» дата в Орионе

        // Карточка сотрудника (pList). Набор полей скопирован со строк,
        // которые создаёт АБД (проверено на ID=340..344).
        const person = await new sql.Request(tx)
            .input('ln', sql.NVarChar(50), input.lastName.trim())
            .input('fn', sql.NVarChar(50), input.firstName.trim())
            .input('mn', sql.NVarChar(50), (input.middleName ?? '').trim())
            .input('phone', sql.NVarChar(50), (input.phone ?? '').trim())
            .input('company', sql.Int, companyId)
            .input('section', sql.Int, sectionId)
            .input('post', sql.Int, postId)
            .input('noDate', sql.DateTime, noDate)
            .input('ws', sql.NVarChar(50), workstation)
            .query(`
                DECLARE @id INT;
                SELECT @id = ISNULL(MAX(ID), 0) + 1 FROM pList;
                INSERT INTO pList (
                    ID, Name, FirstName, MidName, Status, WorkPhone, HomePhone, BirthDate, Address,
                    Company, Section, Post, Schedule, Spack, TabNumber, GrStatus, ChangeTime, IndexForContactId,
                    status_list, EmailList, INN, ReasonToBlackList, TypeDocum, SexGuest, DokumSeries, DokumNumber,
                    DateDocument, KodPodr, Kem, DateDocumentEnd, birthplace, ROOMID, OperatorID, Workstation,
                    AlcoholCheck, IDGROUPEXIT
                ) VALUES (
                    @id, @ln, @fn, @mn, 6, @phone, '', @noDate, '',
                    @company, @section, @post, 0, 128, '', 0, GETDATE(), 0,
                    0, '', '', '', 0, 0, '', '',
                    @noDate, '', '', @noDate, '', 0, 1, @ws,
                    0, 0
                );
                SELECT @id AS id;
            `)
        const personId = person.recordset[0].id as number

        // Ключ доступа (pMark). Набор полей скопирован со строки,
        // которую создаёт АБД (проверено на ID=383).
        const key = await new sql.Request(tx)
            .input('owner', sql.Int, personId)
            .input('ownerName', sql.NVarChar(30), ownerName)
            .input('grp', sql.Int, accessLevel)
            .input('start', sql.DateTime, now)
            .input('finish', sql.DateTime, finish)
            .input('ws2', sql.NVarChar(50), workstation)
            .query(`
                DECLARE @kid INT;
                SELECT @kid = ISNULL(MAX(ID), 0) + 1 FROM pMark;
                INSERT INTO pMark (
                    ID, Gtype, GTypeCodeAdd, Config, CodeP, CodePAdd, Status, Owner, OwnerName,
                    GrStatus, GroupID, Start, Finish, IndexForContactId, OperatorID, Workstation,
                    ChangeTime, TimeOfCreation
                ) VALUES (
                    @kid, 4, 0, 128, CONVERT(varchar(50), 0x${packed}), '', 63232, @owner, @ownerName,
                    1, @grp, @start, @finish, 0, 1, @ws2,
                    GETDATE(), GETDATE()
                );
                SELECT @kid AS id;
            `)
        const keyId = key.recordset[0].id as number

        await tx.commit()
        return { personId, keyId, ownerName, reassignedFrom }
    } catch (e) {
        await tx.rollback().catch(() => {})
        if (e instanceof SkudError) throw e
        throw new SkudError(`СКУД: ошибка записи в базу (${(e as Error).message})`)
    }
}

// Заменить карту сотруднику: старые ключи удаляются (ядро сотрёт их
// из контроллеров), новая карта добавляется с тем же уровнем доступа,
// что был у первого из старых ключей (иначе — уровень по умолчанию).
export async function replaceSkudCard(personId: number, newCardCode: string): Promise<SkudUserResult> {
    const packed = packCardCode(newCardCode)
    const pool = await getPool()
    const tx = new sql.Transaction(pool)
    await tx.begin()

    try {
        const dup = await new sql.Request(tx).query(`
            SELECT OwnerName FROM pMark WHERE CONVERT(varbinary(64), CodeP) = 0x${packed}
        `)
        if (dup.recordset.length > 0) {
            throw new SkudError(`СКУД: карта ${newCardCode} уже выдана (${dup.recordset[0].OwnerName})`)
        }

        const person = await new sql.Request(tx)
            .input('pid', sql.Int, personId)
            .query(`
                SELECT ID, Name, FirstName, MidName FROM pList WHERE ID = @pid;
                SELECT TOP 1 GroupID FROM pMark WHERE Owner = @pid ORDER BY ID;
            `)
        // mssql возвращает массивы recordsets при нескольких SELECT
        const sets = (person as unknown as { recordsets: Array<Record<string, unknown>[]> }).recordsets
        if (!sets[0] || sets[0].length === 0) throw new SkudError(`СКУД: сотрудник pList ID=${personId} не найден`)
        const p = sets[0][0] as { Name: string; FirstName: string; MidName: string }
        const grp = sets[1] && sets[1].length > 0 ? (sets[1][0] as { GroupID: number }).GroupID : DEFAULT_ACCESS_LEVEL

        await new sql.Request(tx).input('pid', sql.Int, personId).query('DELETE FROM pMark WHERE Owner = @pid')

        const ownerName = buildOwnerName(p.Name, p.FirstName, p.MidName ?? '')
        const now = new Date()
        const finish = new Date(now)
        finish.setFullYear(finish.getFullYear() + 73)
        finish.setHours(23, 59, 59, 0)

        const key = await new sql.Request(tx)
            .input('owner', sql.Int, personId)
            .input('ownerName', sql.NVarChar(30), ownerName)
            .input('grp', sql.Int, grp)
            .input('start', sql.DateTime, now)
            .input('finish', sql.DateTime, finish)
            .input('ws', sql.NVarChar(50), os.hostname())
            .query(`
                DECLARE @kid INT;
                SELECT @kid = ISNULL(MAX(ID), 0) + 1 FROM pMark;
                INSERT INTO pMark (
                    ID, Gtype, GTypeCodeAdd, Config, CodeP, CodePAdd, Status, Owner, OwnerName,
                    GrStatus, GroupID, Start, Finish, IndexForContactId, OperatorID, Workstation,
                    ChangeTime, TimeOfCreation
                ) VALUES (
                    @kid, 4, 0, 128, CONVERT(varchar(50), 0x${packed}), '', 63232, @owner, @ownerName,
                    1, @grp, @start, @finish, 0, 1, @ws,
                    GETDATE(), GETDATE()
                );
                SELECT @kid AS id;
            `)

        await tx.commit()
        return { personId, keyId: key.recordset[0].id as number, ownerName }
    } catch (e) {
        await tx.rollback().catch(() => {})
        if (e instanceof SkudError) throw e
        throw new SkudError(`СКУД: ошибка записи в базу (${(e as Error).message})`)
    }
}

// Удалить все ключи сотрудника (увольнение / утеря карты).
// Ядро само сотрёт ключи из контроллеров. Карточка сотрудника (pList)
// остаётся — при необходимости её можно удалить в АБД.
// Идемпотентно: ключей нет — считаем успехом.
export async function deleteSkudCards(personId: number): Promise<number> {
    const pool = await getPool()
    const req = new sql.Request(pool)
    const res = await req
        .input('pid', sql.Int, personId)
        .query('DELETE FROM pMark WHERE Owner = @pid; SELECT @@ROWCOUNT AS cnt;')
    return (res.recordset[0] as { cnt: number }).cnt
}

// Найти сотрудника Ориона по коду карты (для сопоставления с admin_tools).
export async function findSkudPersonByCard(cardCode: string): Promise<{ personId: number; ownerName: string } | null> {
    const packed = packCardCode(cardCode)
    const pool = await getPool()
    const res = await new sql.Request(pool).query(`
        SELECT Owner, OwnerName FROM pMark WHERE CONVERT(varbinary(64), CodeP) = 0x${packed}
    `)
    if (res.recordset.length === 0) return null
    return { personId: res.recordset[0].Owner as number, ownerName: res.recordset[0].OwnerName as string }
}

// Добавить ключ СУЩЕСТВующему сотруднику Ориона (реактивация, вторая карта).
// В отличие от createSkudUser карточка сотрудника (pList) не трогается.
export async function createSkudCard(
    personId: number,
    cardCode: string,
    accessLevel?: number,
): Promise<{ keyId: number }> {
    const packed = packCardCode(cardCode)
    const pool = await getPool()
    const tx = new sql.Transaction(pool)
    await tx.begin()

    try {
        const dup = await new sql.Request(tx).query(`
            SELECT OwnerName FROM pMark WHERE CONVERT(varbinary(64), CodeP) = 0x${packed}
        `)
        if (dup.recordset.length > 0) {
            throw new SkudError(`СКУД: карта ${cardCode} уже выдана (${dup.recordset[0].OwnerName})`)
        }

        const person = await new sql.Request(tx)
            .input('pid', sql.Int, personId)
            .query('SELECT Name, FirstName, MidName FROM pList WHERE ID = @pid')
        if (person.recordset.length === 0) {
            throw new SkudError(`СКУД: сотрудник pList ID=${personId} не найден`)
        }
        const p = person.recordset[0]
        const ownerName = buildOwnerName(p.Name, p.FirstName, p.MidName ?? '')

        const now = new Date()
        const finish = new Date(now)
        finish.setFullYear(finish.getFullYear() + 73)
        finish.setHours(23, 59, 59, 0)

        const key = await new sql.Request(tx)
            .input('owner', sql.Int, personId)
            .input('ownerName', sql.NVarChar(30), ownerName)
            .input('grp', sql.Int, accessLevel ?? DEFAULT_ACCESS_LEVEL)
            .input('start', sql.DateTime, now)
            .input('finish', sql.DateTime, finish)
            .input('ws', sql.NVarChar(50), os.hostname())
            .query(`
                DECLARE @kid INT;
                SELECT @kid = ISNULL(MAX(ID), 0) + 1 FROM pMark;
                INSERT INTO pMark (
                    ID, Gtype, GTypeCodeAdd, Config, CodeP, CodePAdd, Status, Owner, OwnerName,
                    GrStatus, GroupID, Start, Finish, IndexForContactId, OperatorID, Workstation,
                    ChangeTime, TimeOfCreation
                ) VALUES (
                    @kid, 4, 0, 128, CONVERT(varchar(50), 0x${packed}), '', 63232, @owner, @ownerName,
                    1, @grp, @start, @finish, 0, 1, @ws,
                    GETDATE(), GETDATE()
                );
                SELECT @kid AS id;
            `)

        await tx.commit()
        return { keyId: key.recordset[0].id as number }
    } catch (e) {
        await tx.rollback().catch(() => {})
        if (e instanceof SkudError) throw e
        throw new SkudError(`СКУД: ошибка записи в базу (${(e as Error).message})`)
    }
}