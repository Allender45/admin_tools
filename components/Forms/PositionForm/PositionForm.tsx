'use client'

import { useState } from 'react'
import { Position } from '@/store'

interface PositionFormProps {
    onSuccess: () => void
    onCancel: () => void
    position?: Position
}

export default function PositionForm({ onSuccess, onCancel, position }: PositionFormProps) {
    const isEdit = !!position
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const form = new FormData(e.currentTarget)
        const url = isEdit ? `/api/positions/${position!.id}` : '/api/positions'
        const method = isEdit ? 'PATCH' : 'POST'
        const body = {name: form.get('name')}

        const res = await fetch(url, {
            method: method,
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
                    <input name="name" type="text" className="form-control" required defaultValue={position?.name ?? ''} />
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