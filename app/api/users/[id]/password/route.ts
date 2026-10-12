import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { resetAdPassword, AdError } from '@/services/ad'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const userId = Number(id)

        if (isNaN(userId)) {
            return NextResponse.json({ error: 'Некорректный id' }, { status: 400 })
        }

        const existing = await prisma.user.findUnique({ where: { id: userId } })
        if (!existing) {
            return NextResponse.json({ error: 'Сотрудник не найден' }, { status: 404 })
        }
        if (!existing.adLogin) {
            return NextResponse.json({ error: 'У сотрудника нет учётки AD' }, { status: 400 })
        }

        const body = await req.json()
        const password = typeof body.password === 'string' ? body.password : ''

        // Политика домена: минимум 7 символов (см. services/ad.ts)
        if (password.length < 7) {
            return NextResponse.json({ error: 'Пароль должен быть не короче 7 символов' }, { status: 400 })
        }

        try {
            await resetAdPassword(existing.adLogin, password)
        } catch (e) {
            if (e instanceof AdError) {
                return NextResponse.json({ error: `Не удалось сменить пароль: ${e.message}` }, { status: 502 })
            }
            throw e
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[POST /api/users/:id/password]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}