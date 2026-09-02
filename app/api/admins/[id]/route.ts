import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const { displayName, isActive, password } = await req.json()

        const data: Record<string, unknown> = {}
        if (displayName !== undefined) data.displayName = displayName || null
        if (isActive !== undefined) data.isActive = isActive
        if (password) data.passwordHash = await bcrypt.hash(password, 10)

        const admin = await prisma.admin.update({ where: { id: Number(id) }, data })
        return NextResponse.json({ admin })
    } catch (error) {
        console.error('[PATCH /api/admins/[id]]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await prisma.admin.delete({ where: { id: Number(id) } })
        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('[DELETE /api/admins/[id]]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}