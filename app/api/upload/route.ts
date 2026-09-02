import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const ALLOWED: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file')

        if (!(file instanceof File)) {
            return NextResponse.json({ error: 'Файл не передан' }, { status: 400 })
        }

        const ext = ALLOWED[file.type]
        if (!ext) {
            return NextResponse.json({ error: 'Допустимы только JPEG, PNG или WebP' }, { status: 400 })
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'Файл больше 5 МБ' }, { status: 400 })
        }

        const filename = `${randomUUID()}${ext}`
        const dir = path.join(process.cwd(), 'public', 'uploads')
        await mkdir(dir, { recursive: true })
        await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()))

        return NextResponse.json({ url: `/uploads/${filename}` })
    } catch (error) {
        console.error('[POST /api/upload]', error)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}