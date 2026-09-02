import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
    const pcTypes = await prisma.pcType.findMany({ orderBy: { id: 'asc' } })
    return NextResponse.json({ pcTypes })
}

export async function POST(req: NextRequest) {
    try {
        const { name } = await req.json()

        if (!name) {
            return NextResponse.json({ error: 'Название обязательно' }, { status: 400 })
        }

        const exists = await prisma.pcType.findUnique({ where: { name } })
        if (exists) {
            return NextResponse.json({ error: 'Название уже занято' }, { status: 409 })
        }

        const pcType = await prisma.pcType.create({
            data: { name },
        })

        return NextResponse.json({ pcType }, { status: 201 })
    } catch (error) {
        console.error('[POST /api/pcTypes]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}