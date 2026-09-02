import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const workplaceId = Number(id)

        if (isNaN(workplaceId)) {
            return NextResponse.json({ error: 'Некорректный id' }, { status: 400 })
        }

        const body = await req.json()

        if (!body.number) {
            return NextResponse.json({ error: 'Номер обязателен' }, { status: 400 })
        }

        const exists = await prisma.workplace.findFirst({
            where: { number: body.number, NOT: { id: workplaceId } },
        })
        if (exists) {
            return NextResponse.json({ error: 'Номер уже занят' }, { status: 409 })
        }

        const str = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)
        const num = (v: unknown) => (v !== '' && v != null ? Number(v) : null)

        const workplace = await prisma.workplace.update({
            where: { id: workplaceId },
            data: {
                number: body.number.trim(),
                pcTypeId: num(body.pcTypeId),
                processor: str(body.processor),
                ram: str(body.ram),
                storage: str(body.storage),
                monitor: str(body.monitor),
                monitor2: str(body.monitor2),
                keyboard: str(body.keyboard),
                mouse: str(body.mouse),
                headphones: str(body.headphones),
                ipAddress: str(body.ipAddress),
                comments: str(body.comments),
                departmentId: num(body.departmentId),
            },
        })

        return NextResponse.json({ workplace })
    } catch (error) {
        console.error('[PUT /api/workplaces/:id]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}