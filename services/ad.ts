// services/ad.ts
// Интеграция с Active Directory.
// Принцип: с машины, где работает Next.js, открываем WinRM-сессию на контроллер
// домена (AD_HOST) под служебной учёткой (AD_USER) и выполняем там командлеты
// модуля ActiveDirectory. Кириллица и кавычки между процессами передаются
// только через -EncodedCommand (base64 UTF-16LE) — иначе ломается.

import { execFile } from 'child_process'
import { promisify } from 'util'
import { randomInt } from 'crypto'

const execFileAsync = promisify(execFile)

// Настройки подключения (из .env, значения по умолчанию — под raz.local)
const AD_HOST = process.env.AD_HOST ?? '38.217.66.12'
const AD_USER = process.env.AD_USER ?? 'RAZ\\svc-admintools'
const AD_PASSWORD = process.env.AD_PASSWORD ?? ''

// Куда создавать пользователей
const AD_OU = 'OU=Managers,OU=raz,DC=raz,DC=local'
const AD_DOMAIN = 'raz.local'

// Таймаут одного вызова
const EXEC_TIMEOUT_MS = 30000

// Собственный тип ошибки, чтобы в API отличать сбои AD от багов кода
export class AdError extends Error {}

export interface AdUserInput {
    lastName: string
    firstName: string
    middleName: string | null
    displayName: string   // «Имя О. Фамилия»
    description: string   // полное ФИО
    initials: string      // «И.О.»
    phone: string | null
    title: string | null
    department: string | null
}

export interface AdUserResult {
    login: string        // реальный логин (мог получить суффикс при коллизии)
    tempPassword: string // временный пароль — показываем один раз
}

// Логин: «Фамилия» + первая буква имени + первая буква отчества («ЕфимоваАС»).
// Без отчества — «КозьминА». Формат существующих учёток домена (ВоронковAA).
export function generateAdLogin(lastName: string, firstName: string, middleName: string | null): string {
    const first = (s: string | null | undefined) =>
        s && s.trim() !== '' ? s.trim()[0].toUpperCase() : ''
    return `${lastName.trim()}${first(firstName)}${first(middleName)}`
}

// Временный пароль: 7 символов, цифры + латиница (политика: min 7, complexity off).
// Исключены похожие символы (l/1, O/0). Криптостойкий ГПСЧ.
export function generateTempPassword(length = 7): string {
    const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ'
    const digits = '23456789'
    const all = letters + digits
    const pick = (set: string) => set[randomInt(set.length)]
    const chars = [pick(letters), pick(digits)]
    for (let i = chars.length; i < length; i++) chars.push(pick(all))
    // Тасование Фишера–Йейтса на crypto
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomInt(i + 1)
        ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }
    return chars.join('')
}

// Экранирование строки для вставки в PowerShell в одинарных кавычках
const psq = (s: string) => `'${s.replace(/'/g, "''")}'`

// Скрипт, который выполнится НА КОНТРОЛЛЕРЕ ДОМЕНА.
// Одна поездка: проверка занятости логина + создание учётки.
// Скрипт, который выполнится НА КОНТРОЛЛЕРЕ ДОМЕНА.
// Одна поездка: проверка занятости логина + создание учётки.
// Скрипт, который выполнится НА КОНТРОЛЛЕРЕ ДОМЕНА.
// Одна поездка: проверка занятости логина и CN + создание учётки.
function buildRemoteScript(p: AdUserInput & { password: string }): string {
    const phoneArg = p.phone ? ` -OfficePhone ${psq(p.phone)}` : ''

    return `
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Import-Module ActiveDirectory

# Логин занят? Подбираем суффикс: ЕфимоваАС -> ЕфимоваАС2 -> ...
$login = ${psq(generateAdLogin(p.lastName, p.firstName, p.middleName))}
$base = $login
$n = 2
while (Get-ADUser -Filter "sAMAccountName -eq '$login'") {
    $login = "$base$n"
    $n++
}

# CN обязан быть уникальным в OU (тёзки!): Иван И. Иванов -> "Иван И. Иванов 2" -> ...
# DisplayName при этом остаётся исходным — он не обязан быть уникальным.
$name = ${psq(p.displayName)}
$baseName = $name
$m = 2
while (Get-ADObject -Filter "Name -eq '$name'" -SearchBase '${AD_OU}') {
    $name = "$baseName $m"
    $m++
}

$secPass = ConvertTo-SecureString ${psq(p.password)} -AsPlainText -Force

New-ADUser -Name $name -SamAccountName $login -UserPrincipalName "$login@${AD_DOMAIN}" -Path '${AD_OU}' -AccountPassword $secPass -Enabled $true -ChangePasswordAtLogon $true -DisplayName ${psq(p.displayName)} -GivenName ${psq(p.firstName)} -Surname ${psq(p.lastName)} -Initials ${psq(p.initials)} -Description ${psq(p.description)} -Title ${psq(p.title ?? '')} -Department ${psq(p.department ?? '')} ${phoneArg}

# Возвращаем фактический логин (мог отличаться из-за суффикса)
$login
`
}

// Полный скрипт для запуска на машине приложения:
// PSCredential -> WinRM-сессия на DC -> удалённый скрипт как ScriptBlock.
function buildOuterScript(remoteScript: string): string {
    return `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$sec = ConvertTo-SecureString ${psq(AD_PASSWORD)} -AsPlainText -Force
$cred = New-Object PSCredential(${psq(AD_USER)}, $sec)
$remote = [ScriptBlock]::Create(@'
${remoteScript}
'@)
Invoke-Command -ComputerName ${psq(AD_HOST)} -Credential $cred -ScriptBlock $remote
`
}

// Точка входа: создать учётку в AD.
export async function createAdUser(input: AdUserInput): Promise<AdUserResult> {
    const tempPassword = generateTempPassword()
    const remoteScript = buildRemoteScript({ ...input, password: tempPassword })
    const outerScript = buildOuterScript(remoteScript)

    // ВЕСЬ внешний скрипт в base64 (UTF-16LE) — передача без потерь
    // кавычек и кириллицы
    const encoded = Buffer.from(outerScript, 'utf16le').toString('base64')

    try {
        const { stdout } = await execFileAsync(
            'powershell.exe',
            ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
            { timeout: EXEC_TIMEOUT_MS, windowsHide: true },
        )
        const login = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean).pop()
        if (!login) throw new Error('пустой ответ от DC')
        return { login, tempPassword }
    } catch (e) {
        const stderr = (e as { stderr?: string }).stderr ?? ''
        const detail = stderr.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(-6).join(' | ')
        throw new AdError(detail ? `AD: ${detail}` : 'AD: сбой подключения или таймаут')
    }
}