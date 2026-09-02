'use client'

import { useEffect, useState } from 'react'
import { useDepartmentsStore, usePcTypesStore } from '@/store'
import type { Workplace } from '@prisma/client'

interface WorkplaceFormProps {
    initialData?: Workplace | null
    onSuccess: () => void
    onCancel: () => void
}

export default function WorkplaceForm({ initialData, onSuccess, onCancel }: WorkplaceFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { departments, fetchDepartments } = useDepartmentsStore()
    const { pcTypes, fetchPcTypes } = usePcTypesStore()

    useEffect(() => {
        fetchDepartments()
        fetchPcTypes()
    }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const form = new FormData(e.currentTarget)
        const body = Object.fromEntries(form.entries())

        const res = initialData
            ? await fetch(`/api/workplaces/${initialData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            : await fetch('/api/workplaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

        const data = await res.json()
        setLoading(false)

        if (!res.ok) { setError(data.error); return }

        onSuccess()
    }

    const textField = (name: keyof Workplace, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
        <div className="col-md-4">
            <label className="form-label">{label}</label>
            <input name={name} type="text" className="form-control"
                   defaultValue={(initialData?.[name] as string | null) ?? ''} {...extra} />
        </div>
    )

    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-body">
                {error && <div className="alert alert-danger py-2">{error}</div>}

                <div className="row g-3 mb-2">
                    {textField('number', 'Номер *', { required: true })}
                    <div className="col-md-4">
                        <label className="form-label">Отдел</label>
                        <select name="departmentId" className="form-select"
                                defaultValue={initialData?.departmentId ?? ''}>
                            <option value="">—</option>
                            {departments.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                </div>

                <p className="text-muted small text-uppercase mb-2">Компьютер</p>
                <div className="row g-3 mb-2">
                    <div className="col-md-4">
                        <label className="form-label">Тип</label>
                        <select name="pcTypeId" className="form-select"
                                defaultValue={initialData?.pcTypeId ?? ''}>
                            <option value="">—</option>
                            {pcTypes.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                    {textField('processor', 'Процессор')}
                    {textField('ram', 'ОЗУ')}
                    {textField('storage', 'Накопитель')}
                    {textField('monitor', 'Монитор')}
                    {textField('monitor2', 'Монитор2')}
                </div>

                <p className="text-muted small text-uppercase mb-2">Периферия</p>
                <div className="row g-3 mb-2">
                    {textField('keyboard', 'Клавиатура')}
                    {textField('mouse', 'Мышь')}
                    {textField('headphones', 'Наушники')}
                </div>

                <div className="row g-3 mb-2">
                    {textField('ipAddress', 'IP адрес')}
                </div>

                <div className="mb-1">
                    <label className="form-label">Комментарии</label>
                    <textarea name="comments" className="form-control" rows={2}
                              defaultValue={initialData?.comments ?? ''} />
                </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Сохранение...' : initialData ? 'Сохранить' : 'Создать'}
                </button>
            </div>
        </form>
    )
}