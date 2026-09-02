import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/db'

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

        const user = await prisma.user.create({
            data: {
                lastName: body.lastName.trim(),
                firstName: body.firstName.trim(),
                middleName: str(body.middleName),
                photo: str(body.photo),
                phone: str(body.phone),
                skudPass: str(body.skudPass),
                comments: str(body.comments),
                crmId: num(body.crmId),
                isActive: body.isActive === 'on' || body.isActive === true,
                departmentId: num(body.departmentId),
                positionId: num(body.positionId),
                workplaceId: num(body.workplaceId),
            },
        })

        return NextResponse.json({ user }, { status: 201 })
    } catch (error) {
        console.error('[POST /api/users]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}