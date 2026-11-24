import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { resetAdPassword, generateTempPassword, AdError } from '@/services/ad'

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

        const body = await req.json().catch(() => ({}))
        let password = typeof body?.password === 'string' ? body.password : ''

        // Пароль не передан — режим «выдать временный»: генерируем сами,
        // ставим флаг обязательной смены при первом входе и возвращаем
        // пароль один раз в ответе.
        const tempMode = password === ''
        if (tempMode) {
            password = generateTempPassword()
        } else if (password.length < 7) {
            // Политика домена: минимум 7 символов (см. services/ad.ts)
            return NextResponse.json({ error: 'Пароль должен быть не короче 7 символов' }, { status: 400 })
        }

        try {
            await resetAdPassword(existing.adLogin, password, tempMode)
        } catch (e) {
            if (e instanceof AdError) {
                return NextResponse.json({ error: `Не удалось сменить пароль: ${e.message}` }, { status: 502 })
            }
            throw e
        }

        return NextResponse.json(tempMode ? { success: true, tempPassword: password } : { success: true })
    } catch (error) {
        console.error('[POST /api/users/:id/password]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}