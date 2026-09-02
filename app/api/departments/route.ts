import {NextRequest, NextResponse} from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
    const departments = await prisma.department.findMany({ orderBy: { id: 'asc' } })
    return NextResponse.json({ departments })
}

export async function POST(req: NextRequest) {
    try {
        const { name } = await req.json()

        if (!name) {
            return NextResponse.json({ error: 'Название обязательно' }, { status: 400 })
        }

        const exists = await prisma.department.findUnique({ where: { name } })
        if (exists) {
            return NextResponse.json({ error: 'Название уже занято' }, { status: 409 })
        }

        const department = await prisma.department.create({
            data: { name },
        })

        return NextResponse.json({ department }, { status: 201 })
    } catch (error) {
        console.error('[POST /api/departments]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}