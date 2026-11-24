import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/db'
import { createAdUser, AdError } from '@/services/ad'
import { createSkudUser, findSkudPersonByCard, SkudError, SkudConflictError } from '@/services/skud'
import { deactivatePreviousSkudOwner } from '@/services/users'

export async function GET() {
    const users = await prisma.user.findMany({
        orderBy: { id: 'asc' },
    })
    return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        if (!body.lastName || !body.firstName) {
            return NextResponse.json({ error: 'Фамилия и имя обязательны' }, { status: 400 })
        }

        const str = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)
        const num = (v: unknown) => (v !== '' && v != null ? Number(v) : null)

        const lastName = body.lastName.trim()
        const firstName = body.firstName.trim()
        const middleName = str(body.middleName)
        const phone = str(body.phone)
        const departmentId = num(body.departmentId)
        const positionId = num(body.positionId)

        // Выводимое имя: «Имя О. Фамилия», инициалы: «И.О.»
        const middleInitial = middleName ? `${middleName[0].toUpperCase()}.` : ''
        const displayName = `${firstName} ${middleInitial} ${lastName}`
        const initials = `${firstName[0].toUpperCase()}.${middleInitial}`
        const description = middleName
            ? `${lastName} ${firstName} ${middleName}`
            : `${lastName} ${firstName}`

        const [department, position] = await Promise.all([
            departmentId ? prisma.department.findUnique({ where: { id: departmentId } }) : null,
            positionId ? prisma.position.findUnique({ where: { id: positionId } }) : null,
        ])

        const digits = phone?.replace(/\D/g, '') ?? null
        const adPhone = digits && digits.length === 10
            ? `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`
            : phone

        // === ШАГ 0: СКУД. Если пропуск указан — проверяем, не занят ли он,
        // ДО создания учётки в AD (иначе повторный сабмит после подтверждения
        // упрётся в уже созданный логин). Занят — 409, фронт спросит
        // подтверждение и повторит запрос с reassignSkud: true ===
        const skudPass = str(body.skudPass)
        const reassignSkud = body.reassignSkud === true || body.reassignSkud === 'on'
        if (skudPass && !reassignSkud) {
            try {
                const owner = await findSkudPersonByCard(skudPass)
                if (owner) {
                    return NextResponse.json(
                        {
                            error: `Пропуск уже закреплён за ${owner.ownerName}`,
                            conflict: 'skud_card',
                            ownerName: owner.ownerName,
                        },
                        { status: 409 },
                    )
                }
            } catch (e) {
                if (e instanceof SkudError) {
                    return NextResponse.json({ error: `Не удалось проверить пропуск в СКУД: ${e.message}` }, { status: 502 })
                }
                throw e
            }
        }

        // === ШАГ 1: AD. Только если включён переключатель «AD пользователь».
        // Если ошибка — в базу НЕ пишем ===
        const adUser = body.adUser === 'on' || body.adUser === true
        let adResult = null
        if (adUser) {
            try {
                adResult = await createAdUser({
                    lastName, firstName, middleName,
                    displayName, description, initials,
                    phone: adPhone, title: position?.name ?? null, department: department?.name ?? null,
                })
            } catch (e) {
                if (e instanceof AdError) {
                    return NextResponse.json({ error: `Не удалось создать учётку в AD: ${e.message}` }, { status: 502 })
                }
                throw e
            }
        }

        // === ШАГ 1.5: СКУД. Только если заполнено поле «Пропуск СКУД» ===
        let skudResult = null
        if (skudPass) {
            try {
                skudResult = await createSkudUser({
                    lastName, firstName, middleName,
                    cardCode: skudPass,
                    phone,
                    photoUrl: str(body.photo),
                    positionName: position?.name ?? null,
                    departmentName: department?.name ?? null,
                }, { allowReassign: reassignSkud })
            } catch (e) {
                if (e instanceof SkudConflictError) {
                    // Гонка: карту успели выдать между пре-проверкой и записью
                    return NextResponse.json(
                        { error: e.message, conflict: 'skud_card', ownerName: e.ownerName },
                        { status: 409 },
                    )
                }
                if (e instanceof SkudError) {
                    return NextResponse.json({ error: `Не удалось создать сотрудника в СКУД: ${e.message}` }, { status: 502 })
                }
                throw e
            }
        }

        // === ШАГ 2: AD создан — запись в базе ===
        const user = await prisma.user.create({
            data: {
                lastName, firstName, middleName,
                photo: str(body.photo),
                phone,
                skudPass: str(body.skudPass),
                comments: str(body.comments),
                crmId: num(body.crmId),
                isActive: body.isActive === 'on' || body.isActive === true,
                departmentId,
                positionId,
                workplaceId: num(body.workplaceId),
                adLogin: adResult?.login ?? null,
                skudPersonId: skudResult?.personId ?? null,
            },
        })

        // === ШАГ 3: подтверждённая перевыдача — деактивируем прежнего владельца ===
        let deactivated = null
        if (skudPass && reassignSkud) {
            deactivated = await deactivatePreviousSkudOwner(skudPass, user.id)
        }

        // tempPassword возвращается один раз — показать в интерфейсе!
        return NextResponse.json({ user, ad: adResult, skud: skudResult, deactivated }, { status: 201 })
    } catch (error) {
        console.error('[POST /api/users]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}