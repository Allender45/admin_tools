'use client'

import { useState } from 'react'
import type { PcType } from '@prisma/client'

interface PcTypeFormProps {
    onSuccess: () => void
    onCancel: () => void
    pcType?: PcType
}

export default function PcTypeForm({ onSuccess, onCancel, pcType }: PcTypeFormProps) {
    const isEdit = !!pcType
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const form = new FormData(e.currentTarget)
        const body = { name: form.get('name') }
        const method = isEdit ? 'PATCH' : 'POST'
        const url = isEdit ? `/api/pcTypes/${pcType!.id}` : '/api/pcTypes'

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        const data = await res.json()
        setLoading(false)

        if (!res.ok) { setError(data.error); return }

        onSuccess()
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-body">
                {error && <div className="alert alert-danger py-2">{error}</div>}
                <div className="mb-3">
                    <label className="form-label">Название</label>
                    <input name="name" type="text" className="form-control" required defaultValue={pcType?.name ?? ''} />
                </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
                </button>
            </div>
        </form>
    )
}