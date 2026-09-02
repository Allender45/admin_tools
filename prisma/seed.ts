import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const [it, accounting, sales, hr] = await Promise.all([
        prisma.department.upsert({ where: { name: 'ИТ-отдел' },    update: {}, create: { name: 'ИТ-отдел' } }),
        prisma.department.upsert({ where: { name: 'Бухгалтерия' }, update: {}, create: { name: 'Бухгалтерия' } }),
        prisma.department.upsert({ where: { name: 'Отдел продаж' },update: {}, create: { name: 'Отдел продаж' } }),
        prisma.department.upsert({ where: { name: 'HR' },          update: {}, create: { name: 'HR' } }),
    ])

    const [dev, sysadmin, chiefAcc, acc, salesMgr, hrMgr] = await Promise.all([
        prisma.position.upsert({ where: { name: 'Разработчик' },             update: {}, create: { name: 'Разработчик' } }),
        prisma.position.upsert({ where: { name: 'Системный администратор' }, update: {}, create: { name: 'Системный администратор' } }),
        prisma.position.upsert({ where: { name: 'Главный бухгалтер' },       update: {}, create: { name: 'Главный бухгалтер' } }),
        prisma.position.upsert({ where: { name: 'Бухгалтер' },               update: {}, create: { name: 'Бухгалтер' } }),
        prisma.position.upsert({ where: { name: 'Менеджер по продажам' },    update: {}, create: { name: 'Менеджер по продажам' } }),
        prisma.position.upsert({ where: { name: 'HR-менеджер' },             update: {}, create: { name: 'HR-менеджер' } }),
    ])

    const existing = await prisma.user.count()
    if (existing === 0) {
        await prisma.user.createMany({
            data: [
                { lastName: 'Иванов',   firstName: 'Иван',    middleName: 'Иванович',     phone: '+7 900 100-01-01', departmentId: it.id,         positionId: dev.id },
                { lastName: 'Петрова',  firstName: 'Анна',    middleName: 'Сергеевна',    phone: '+7 900 200-02-02', departmentId: it.id,         positionId: sysadmin.id },
                { lastName: 'Сидоров',  firstName: 'Михаил',  middleName: 'Александрович', phone: '+7 900 300-03-03', departmentId: accounting.id, positionId: chiefAcc.id },
                { lastName: 'Козлова',  firstName: 'Елена',   middleName: 'Владимировна',  phone: '+7 900 400-04-04', departmentId: accounting.id, positionId: acc.id },
                { lastName: 'Новиков',  firstName: 'Дмитрий', middleName: 'Петрович',      phone: '+7 900 500-05-05', departmentId: sales.id,      positionId: salesMgr.id },
                { lastName: 'Морозова', firstName: 'Ольга',   middleName: 'Николаевна',    phone: '+7 900 600-06-06', departmentId: sales.id,      positionId: salesMgr.id },
                { lastName: 'Волков',   firstName: 'Андрей',  middleName: 'Игоревич',      phone: '+7 900 700-07-07', departmentId: it.id,         positionId: dev.id },
                { lastName: 'Соколова', firstName: 'Мария',   middleName: 'Дмитриевна',    phone: '+7 900 800-08-08', departmentId: hr.id,         positionId: hrMgr.id },
                { lastName: 'Попов',    firstName: 'Сергей',  middleName: 'Анатольевич',   phone: '+7 900 900-09-09', departmentId: sales.id,      positionId: salesMgr.id, isActive: false },
                { lastName: 'Лебедева', firstName: 'Наталья', middleName: 'Викторовна',    phone: '+7 901 000-10-10', departmentId: accounting.id, positionId: acc.id },
            ],
        })
        console.log('Создано 10 пользователей')
    } else {
        console.log(`Пропуск: уже есть ${existing} пользователей`)
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())