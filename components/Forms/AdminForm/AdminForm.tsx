'use client'

import { useState } from 'react'
import { Admin } from '@/store'

interface AdminFormProps {
    onSuccess: () => void
    onCancel: () => void
    admin?: Admin
}

export default function AdminForm({ onSuccess, onCancel, admin  }: AdminFormProps) {
    const isEdit = !!admin
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const form = new FormData(e.currentTarget)

        const url = isEdit ? `/api/admins/${admin!.id}` : '/api/admins'
        const method = isEdit ? 'PATCH' : 'POST'
        const body = isEdit
            ? {
                displayName: form.get('displayName'),
                isActive: (e.currentTarget.elements.namedItem('isActive') as HTMLInputElement)?.checked,
                password: form.get('password') || undefined,
            }
            : {
                username: form.get('username'),
                displayName: form.get('displayName'),
                password: form.get('password'),
            }

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
                    <label className="form-label">Логин</label>
                    <input name="username" type="text" className="form-control"
                           defaultValue={admin?.username ?? ''}
                           disabled={isEdit} required={!isEdit} />
                </div>
                <div className="mb-3">
                    <label className="form-label">Отображаемое имя</label>
                    <input name="displayName" type="text" className="form-control"
                           defaultValue={admin?.displayName ?? ''} />
                </div>
                <div className="mb-3">
                    <label className="form-label">
                        Пароль {isEdit && <span className="text-muted">(необязательно)</span>}
                    </label>
                    <input name="password" type="password" className="form-control"
                           required={!isEdit} />
                </div>
                {isEdit && (
                    <div className="form-check">
                        <input name="isActive" type="checkbox" className="form-check-input"
                               id="isActive" defaultChecked={admin!.isActive} />
                        <label className="form-check-label" htmlFor="isActive">Активен</label>
                    </div>
                )}
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