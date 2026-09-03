import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
    const requests = await prisma.requests.findMany({
        orderBy: { id: 'desc' },
        include: {
            author: true,
            department: true,
            workplace: true,
        },
    })
    return NextResponse.json({ requests })
}

function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '')
    return digits.length >= 10 ? digits.slice(-10) : digits
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = req.headers.get('x-api-key')
        if (!process.env.BOT_API_KEY || apiKey !== process.env.BOT_API_KEY) {
            return NextResponse.json({ error: 'Недействительный API-ключ' }, { status: 401 })
        }

        const body = await req.json()
        const { workplaceNumber, description, contactPhone, phone, lastName, firstName, middleName } = body

        if (!workplaceNumber || !description || !contactPhone || !phone || !lastName || !firstName) {
            return NextResponse.json(
                { error: 'Обязательные поля: workplaceNumber, description, contactPhone, phone, lastName, firstName' },
                { status: 400 }
            )
        }

        const workplace = await prisma.workplace.findUnique({
            where: { number: String(workplaceNumber).trim() },
        })

        const normalizedPhone = normalizePhone(String(phone))
        const trimmedLastName = String(lastName).trim()
        const trimmedFirstName = String(firstName).trim()
        const trimmedMiddleName = middleName ? String(middleName).trim() : null

        const users = await prisma.user.findMany({
            where: { phone: { not: null } },
        })
        const existingAuthor = users.find(u => normalizePhone(u.phone!) === normalizedPhone)

        let author
        if (existingAuthor) {
            const needsUpdate =
                existingAuthor.lastName !== trimmedLastName ||
                existingAuthor.firstName !== trimmedFirstName ||
                existingAuthor.middleName !== trimmedMiddleName ||
                existingAuthor.phone !== normalizedPhone

            author = needsUpdate
                ? await prisma.user.update({
                    where: { id: existingAuthor.id },
                    data: {
                        lastName: trimmedLastName,
                        firstName: trimmedFirstName,
                        middleName: trimmedMiddleName,
                        phone: normalizedPhone,
                    },
                })
                : existingAuthor
        } else {
            author = await prisma.user.create({
                data: {
                    lastName: trimmedLastName,
                    firstName: trimmedFirstName,
                    middleName: trimmedMiddleName,
                    phone: normalizedPhone,
                },
            })
        }

        const request = await prisma.requests.create({
            data: {
                authorId: author.id,
                workplaceId: workplace?.id,
                workplaceNumber: String(workplaceNumber).trim(),
                description: String(description).trim(),
                contactPhone: normalizePhone(String(contactPhone)),
                departmentId: author.departmentId,
            },
        })

        return NextResponse.json({ request }, { status: 201 })
    } catch (error) {
        console.error('[POST /api/requests]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}