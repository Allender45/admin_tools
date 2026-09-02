import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const requestId = Number(id)

        if (isNaN(requestId)) {
            return NextResponse.json({ error: 'Некорректный id' }, { status: 400 })
        }

        const body = await req.json()

        const request = await prisma.requests.update({
            where: { id: requestId },
            data: {
                comments: typeof body.comments === 'string' && body.comments.trim() !== ''
                    ? body.comments.trim()
                    : null,
                ...(body.status !== undefined ? { status: Boolean(body.status) } : {}),
            },
        })

        return NextResponse.json({ request })
    } catch (error) {
        console.error('[PUT /api/requests/:id]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}