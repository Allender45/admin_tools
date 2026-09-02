'use client'

import { useEffect, useState } from 'react'
import { useDepartmentsStore, usePositionsStore, useWorkplacesStore } from '@/store'
import type { User } from '@prisma/client'

interface UserFormProps {
    initialData?: User | null
    onSuccess: () => void
    onCancel: () => void
}

export default function UserForm({ initialData, onSuccess, onCancel }: UserFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { departments, fetchDepartments } = useDepartmentsStore()
    const { positions, fetchPositions } = usePositionsStore()
    const { workplaces, fetchWorkplaces } = useWorkplacesStore()
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photo ?? null)
    const [phoneDigits, setPhoneDigits] = useState(() =>
        (initialData?.phone ?? '').replace(/\D/g, '').replace(/^[78]/, '').slice(0, 10)
    )
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        fetchDepartments()
        fetchPositions()
        fetchWorkplaces()
    }, [])

    function formatPhone(digits: string): string {
        if (!digits) return ''
        return '+7' + digits
    }

    function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
        setPhoneDigits(e.target.value.replace(/\D/g, '').replace(/^[78]/, '').slice(0, 10))
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const formEl = e.currentTarget

        let photo: string | null = initialData?.photo ?? null
        if (photoFile) {
            const fd = new FormData()
            fd.append('file', photoFile)
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
            const uploadData = await uploadRes.json()
            if (!uploadRes.ok) { setError(uploadData.error); setLoading(false); return }
            photo = uploadData.url
        }

        const form = new FormData(formEl)
        const body = { ...Object.fromEntries(form.entries()), photo }

        const res = initialData
            ? await fetch(`/api/users/${initialData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            : await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

        const data = await res.json()
        setLoading(false)

        if (!res.ok) { setError(data.error); return }

        onSuccess()
    }

    async function handleDelete() {
        if (!initialData) return
        if (!confirm(`Удалить сотрудника ${initialData.lastName} ${initialData.firstName}?`)) return

        setDeleting(true)
        const res = await fetch(`/api/users/${initialData.id}`, { method: 'DELETE' })
        const data = await res.json()
        setDeleting(false)

        if (!res.ok) { setError(data.error); return }

        onSuccess()
    }

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null
        setPhotoFile(file)
        setPhotoPreview(file ? URL.createObjectURL(file) : null)
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-body">
                {error && <div className="alert alert-danger py-2">{error}</div>}

                <div className="mb-4">
                    {photoPreview
                        && <img src={photoPreview} alt="" width={'100%'}
                                style={{ borderRadius: '10%', objectFit: 'cover' }} />
                    }
                </div>

                <div className="row g-3 mb-2">
                    <div className="col-md-4">
                        <label className="form-label">Фамилия *</label>
                        <input name={'lastName'} type="text" className="form-control"
                               defaultValue={(initialData?.['lastName'] as string | number | null) ?? ''} />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Имя *</label>
                        <input name={'firstName'} type="text" className="form-control"
                               defaultValue={(initialData?.['firstName'] as string | number | null) ?? ''} />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Отчество</label>
                        <input name={'middleName'} type="text" className="form-control"
                               defaultValue={(initialData?.['middleName'] as string | number | null) ?? ''} />
                    </div>
                </div>

                <div className="row g-3 mb-2">
                    <div className="col-md-4">
                        <label className="form-label">Отдел</label>
                        <select name="departmentId" className="form-select" defaultValue={initialData?.departmentId ?? ''}>
                        <option value="">—</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Должность</label>
                        <select name="positionId" className="form-select" defaultValue={initialData?.positionId ?? ''}>
                            <option value="">—</option>
                            {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Рабочее место</label>
                        <select name="workplaceId" className="form-select" defaultValue={initialData?.workplaceId ?? ''}>
                            <option value="">—</option>
                            {workplaces.map(w => <option key={w.id} value={w.id}>{w.number}</option>)}
                        </select>
                    </div>
                </div>

                <div className="row g-3 mb-2">
                    <div className="col-md-4">
                        <label className="form-label">Телефон</label>
                        <input type="text" className="form-control" placeholder="+7 (___) ___-__-__"
                               value={formatPhone(phoneDigits)} onChange={handlePhoneChange} />
                        <input type="hidden" name="phone" value={phoneDigits} />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Пропуск СКУД</label>
                        <input name={'skudPass'} type="text" className="form-control"
                               defaultValue={(initialData?.['skudPass'] as string | number | null) ?? ''} />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">CRM ID</label>
                        <input name={'crmId'} type="text" className="form-control"
                               defaultValue={(initialData?.['crmId'] as string | number | null) ?? ''} />
                    </div>
                </div>

                <div className="mb-2">
                    <label className="form-label">Комментарии</label>
                    <textarea name="comments" className="form-control" rows={2} defaultValue={initialData?.comments ?? ''} />
                </div>

                <div className="mb-2">
                    <label className="form-label">Фото</label>
                        <input type="file" className="form-control" accept="image/jpeg,image/png,image/webp"
                               onChange={handlePhotoChange} />
                </div>

                <div className="form-check">
                    <input name="isActive" type="checkbox" className="form-check-input" id="userIsActive" defaultChecked={initialData ? initialData.isActive : true} />
                    <label className="form-check-label" htmlFor="userIsActive">Активен</label>
                </div>
            </div>
            <div className="modal-footer">
                {initialData && (
                    <button type="button" className="btn btn-outline-danger me-auto"
                            onClick={handleDelete} disabled={deleting || loading}>
                        <i className="bi bi-trash me-1"></i>{deleting ? 'Удаление...' : 'Удалить'}
                    </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Сохранение...' : initialData ? 'Сохранить' : 'Создать'}
                </button>
            </div>
        </form>
    )
}