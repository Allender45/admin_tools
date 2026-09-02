import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { unsignSession } from '@/lib/session'
import prisma from '@/lib/db'

export async function GET() {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value
    const adminId = session ? await unsignSession(session) : null

    if (!adminId) return NextResponse.json({ admin: null }, { status: 401 })

    const admin = await prisma.admin.findUnique({ where: { id: Number(adminId) } })
    return NextResponse.json({ admin })
}