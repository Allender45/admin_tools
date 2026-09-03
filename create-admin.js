require('dotenv/config')
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const passwordHash = await bcrypt.hash('master123!', 10)

    const admin = await prisma.admin.create({
        data: {
            username: 'Master',
            displayName: 'Бервинов Максим',
            passwordHash,
        }
    })

    console.log('Создан администратор:', admin.id, admin.username)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())