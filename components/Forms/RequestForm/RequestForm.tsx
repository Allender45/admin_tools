'use client'

import { useState } from 'react'
import type { RequestWithRelations } from '@/store'

interface RequestFormProps {
    initialData: RequestWithRelations
    onSuccess: () => void
    onCancel: () => void
}

export default function RequestForm({ initialData, onSuccess, onCancel }: RequestFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const authorName = [initialData.author.lastName, initialData.author.firstName, initialData.author.middleName]
        .filter(Boolean).join(' ')

    async function save(closeRequest: boolean) {
        setError(null)
        setLoading(true)

        const comments = (document.getElementById('requestComments') as HTMLTextAreaElement).value
        const body: { comments: string; status?: boolean } = { comments }
        if (closeRequest) body.status = false

        const res = await fetch(`/api/requests/${initialData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        const data = await res.json()
        setLoading(false)

        if (!res.ok) { setError(data.error); return }

        onSuccess()
    }

    return (
        <form onSubmit={(e) => { e.preventDefault(); save(false) }}>
            <div className="modal-body">
                {error && <div className="alert alert-danger py-2">{error}</div>}

                <div className="row g-3 mb-2">
                    <div className="col-md-6">
                        <label className="form-label">Автор</label>
                        <input type="text" className="form-control" value={authorName} disabled />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Рабочее место</label>
                        <input type="text" className="form-control" value={initialData.workplace.number} disabled />
                    </div>
                </div>

                <div className="row g-3 mb-2">
                    <div className="col-md-6">
                        <label className="form-label">Телефон</label>
                        <input type="text" className="form-control" value={initialData.contactPhone} disabled />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Отдел</label>
                        <input type="text" className="form-control" value={initialData.department?.name ?? '—'} disabled />
                    </div>
                </div>

                <div className="mb-2">
                    <label className="form-label">Описание проблемы</label>
                    <textarea className="form-control" rows={3} value={initialData.description} disabled />
                </div>

                <div className="mb-2">
                    <label className="form-label">Комментарий</label>
                    <textarea id="requestComments" name="comments" className="form-control" rows={3}
                              defaultValue={initialData.comments ?? ''} />
                </div>
            </div>
            <div className="modal-footer">
                {initialData.status && (
                    <button type="button" className="btn btn-outline-danger me-auto"
                            onClick={() => save(true)} disabled={loading}>
                        <i className="bi bi-check-circle me-1"></i>Закрыть заявку
                    </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
            </div>
        </form>
    )
}