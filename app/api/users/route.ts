import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/db'
import { createAdUser, AdError, AdUserResult } from '@/services/ad'

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

        // === ШАГ 1: AD. Если ошибка — в базу НЕ пишем ===
        let adResult: AdUserResult
        // Для AD форматируем телефон: 10 цифр -> +7 (XXX) XXX-XX-XX
        const digits = phone?.replace(/\D/g, '') ?? null
        const adPhone = digits && digits.length === 10
            ? `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`
            : phone
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
                adLogin: adResult.login,
            },
        })

        // tempPassword возвращается один раз — показать в интерфейсе!
        return NextResponse.json({ user, ad: adResult }, { status: 201 })
    } catch (error) {
        console.error('[POST /api/users]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}