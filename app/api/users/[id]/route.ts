import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const userId = Number(id)

        if (isNaN(userId)) {
            return NextResponse.json({ error: 'Некорректный id' }, { status: 400 })
        }

        const body = await req.json()

        if (!body.lastName || !body.firstName) {
            return NextResponse.json({ error: 'Фамилия и имя обязательны' }, { status: 400 })
        }

        const str = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)
        const num = (v: unknown) => (v !== '' && v != null ? Number(v) : null)

        const user = await prisma.user.update({
            where: { id: userId },
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

        await prisma.user.delete({ where: { id: userId } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[DELETE /api/users/:id]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}