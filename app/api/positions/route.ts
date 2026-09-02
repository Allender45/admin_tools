import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
    const positions = await prisma.position.findMany({ orderBy: { id: 'asc' } })
    return NextResponse.json({ positions })
}

export async function POST(req: NextRequest) {
    try {
        const { name } = await req.json()

        if (!name) {
            return NextResponse.json({ error: 'Название обязательно' }, { status: 400 })
        }

        const exists = await prisma.position.findUnique({ where: { name } })
        if (exists) {
            return NextResponse.json({ error: 'Название уже занято' }, { status: 409 })
        }

        const position = await prisma.position.create({
            data: { name },
        })

        return NextResponse.json({ position }, { status: 201 })
    } catch (error) {
        console.error('[POST /api/positions]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}