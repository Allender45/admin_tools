import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
    const workplaces = await prisma.workplace.findMany({
        orderBy: { id: 'asc' },
    })
    return NextResponse.json({ workplaces })
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        if (!body.number) {
            return NextResponse.json({ error: 'Номер обязателен' }, { status: 400 })
        }

        const exists = await prisma.workplace.findUnique({ where: { number: body.number } })
        if (exists) {
            return NextResponse.json({ error: 'Номер уже занят' }, { status: 409 })
        }

        const str = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)
        const num = (v: unknown) => (v !== '' && v != null ? Number(v) : null)

        const workplace = await prisma.workplace.create({
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

        return NextResponse.json({ workplace }, { status: 201 })
    } catch (error) {
        console.error('[POST /api/workplaces]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}