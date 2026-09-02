import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { signSession } from '@/lib/session'

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json()

        if (!username || !password) {
            return NextResponse.json({ error: 'Введите логин и пароль' }, { status: 400 })
        }

        const admin = await prisma.admin.findUnique({ where: { username } })

        if (!admin || !admin.isActive) {
            return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 })
        }

        const match = await bcrypt.compare(password, admin.passwordHash)
        if (!match) {
            return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 })
        }

        const response = NextResponse.json({
            message: 'Вход выполнен',
            admin: { id: admin.id, username: admin.username, displayName: admin.displayName },
        })

        response.cookies.set('session', await signSession(String(admin.id)), {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 8,
            sameSite: 'lax',
        })

        return response
    } catch (error) {
        console.error('[login]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}