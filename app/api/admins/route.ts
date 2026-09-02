import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

export async function GET() {
    const admins = await prisma.admin.findMany({ orderBy: { id: 'asc' } })
    return NextResponse.json({ admins })
}

export async function POST(req: NextRequest) {
    try {
        const { username, displayName, password } = await req.json()

        if (!username || !password) {
            return NextResponse.json({ error: 'Логин и пароль обязательны' }, { status: 400 })
        }

        const exists = await prisma.admin.findUnique({ where: { username } })
        if (exists) {
            return NextResponse.json({ error: 'Логин уже занят' }, { status: 409 })
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const admin = await prisma.admin.create({
            data: { username, displayName: displayName || null, passwordHash },
        })

        return NextResponse.json({ admin }, { status: 201 })
    } catch (error) {
        console.error('[POST /api/admins]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}