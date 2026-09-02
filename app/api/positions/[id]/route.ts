import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const { name } = await req.json()

        const data: Record<string, unknown> = {}
        if (name !== undefined) data.name = name || null

        const position = await prisma.position.update({ where: { id: Number(id) }, data })
        return NextResponse.json({ position })
    } catch (error) {
        console.error('[PATCH /api/position/[id]]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await prisma.position.delete({ where: { id: Number(id) } })
        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('[DELETE /api/position/[id]]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}