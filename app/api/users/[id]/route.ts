import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { setAdUserEnabled, deleteAdUser, AdError } from '@/services/ad'
import { replaceSkudCard, createSkudUser, deleteSkudCards, SkudError } from '@/services/skud'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        const body = await req.json()

        if (!body.lastName || !body.firstName) {
            return NextResponse.json({ error: 'Фамилия и имя обязательны' }, { status: 400 })
        }

        const str = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)
        const num = (v: unknown) => (v !== '' && v != null ? Number(v) : null)

        const isActive = body.isActive === 'on' || body.isActive === true

        // === ШАГ 1: AD. Статус изменился — блокируем/разблокируем учётку.
        // Сбой AD = базу не трогаем, форма покажет текст ошибки ===
        if (existing.adLogin && existing.isActive !== isActive) {
            try {
                await setAdUserEnabled(existing.adLogin, isActive)
            } catch (e) {
                if (e instanceof AdError) {
                    return NextResponse.json({ error: `Не удалось изменить учётку в AD: ${e.message}` }, { status: 502 })
                }
                throw e
            }
        }

        // === ШАГ 1.5: СКУД. Пропуск изменился — обновляем ключ в Орионе ===
        const newSkudPass = str(body.skudPass)?.toUpperCase() ?? null
        const oldSkudPass = existing.skudPass?.trim().toUpperCase() ?? null
        let skudPersonId = existing.skudPersonId

        if (newSkudPass !== oldSkudPass) {
            try {
                if (skudPersonId != null) {
                    if (newSkudPass) {
                        // Замена карты: replaceSkudCard удалит старые ключи
                        // (ядро сотрёт их из контроллеров) и добавит новый
                        await replaceSkudCard(skudPersonId, newSkudPass)
                    } else {
                        // Поле пропуска очистили — удаляем ключи из Ориона
                        await deleteSkudCards(skudPersonId)
                        skudPersonId = null
                    }
                } else if (newSkudPass) {
                    // В Орионе сотрудника ещё нет (старая запись) — создаём
                    const departmentId = num(body.departmentId)
                    const positionId = num(body.positionId)
                    const [department, position] = await Promise.all([
                        departmentId ? prisma.department.findUnique({ where: { id: departmentId } }) : null,
                        positionId ? prisma.position.findUnique({ where: { id: positionId } }) : null,
                    ])
                    const r = await createSkudUser({
                        lastName: body.lastName.trim(),
                        firstName: body.firstName.trim(),
                        middleName: str(body.middleName),
                        cardCode: newSkudPass,
                        phone: str(body.phone),
                        positionName: position?.name ?? null,
                        departmentName: department?.name ?? null,
                    })
                    skudPersonId = r.personId
                }
            } catch (e) {
                if (e instanceof SkudError) {
                    return NextResponse.json({ error: `Не удалось обновить пропуск в СКУД: ${e.message}` }, { status: 502 })
                }
                throw e
            }
        }

        // === ШАГ 2: база ===
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                lastName: body.lastName.trim(),
                firstName: body.firstName.trim(),
                middleName: str(body.middleName),
                photo: str(body.photo),
                phone: str(body.phone),
                skudPass: newSkudPass,
                skudPersonId,
                comments: str(body.comments),
                crmId: num(body.crmId),
                isActive,
                departmentId: num(body.departmentId),
                positionId: num(body.positionId),
                workplaceId: num(body.workplaceId),
            },
        })

        return NextResponse.json({ user })
    } catch (error) {
        console.error('[PUT /api/users/:id]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        // === ШАГ 1: AD. Сбой = запись в базе остаётся, удаление можно повторить ===
        if (existing.adLogin) {
            try {
                await deleteAdUser(existing.adLogin)
            } catch (e) {
                if (e instanceof AdError) {
                    return NextResponse.json({ error: `Не удалось удалить учётку в AD: ${e.message}` }, { status: 502 })
                }
                throw e
            }
        }

        // === ШАГ 1.5: СКУД. Удаляем ключи — ядро сотрёт их из контроллеров ===
        if (existing.skudPersonId != null) {
            try {
                await deleteSkudCards(existing.skudPersonId)
            } catch (e) {
                if (e instanceof SkudError) {
                    return NextResponse.json({ error: `Не удалось удалить ключи в СКУД: ${e.message}` }, { status: 502 })
                }
                throw e
            }
        }

        // === ШАГ 2: база ===
        await prisma.user.delete({ where: { id: userId } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[DELETE /api/users/:id]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}