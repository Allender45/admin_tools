import { NextRequest, NextResponse } from 'next/server'
import { unsignSession } from '@/lib/session'

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    if (pathname.startsWith('/api/auth') || pathname === '/login') {
        return NextResponse.next()
    }

    // Приём заявок от бота — авторизация по x-api-key в самом роуте
    if (pathname === '/api/requests' && req.method === 'POST') {
        return NextResponse.next()
    }

    const cookie = req.cookies.get('session')?.value
    const adminId = cookie ? await unsignSession(cookie) : null

    if (!adminId) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2)$).*)'],
}