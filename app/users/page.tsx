'use client'

import { useEffect, useMemo, useState } from 'react'
import { DataTable, UserForm, AdminLayout } from '@/components'
import type { DataTableColumn } from '@/components'
import { useUsersStore, useDepartmentsStore, usePositionsStore, useWorkplacesStore } from '@/store'
import { Modal } from '@/containers'
import type { User } from '@prisma/client'

export default function UsersPage() {
    const { users, loading, fetchUsers, reset } = useUsersStore()
    const { departments, fetchDepartments } = useDepartmentsStore()
    const { positions, fetchPositions } = usePositionsStore()
    const { workplaces, fetchWorkplaces } = useWorkplacesStore()
    const [modalOpen, setModalOpen] = useState(false)
    const [selected, setSelected] = useState<User | null>(null)

    const departmentNames = useMemo(() => new Map(departments.map(d => [d.id, d.name])), [departments])
    const positionNames = useMemo(() => new Map(positions.map(p => [p.id, p.name])), [positions])
    const workplaceNumbers = useMemo(() => new Map(workplaces.map(w => [w.id, w.number])), [workplaces])

    useEffect(() => {
        fetchUsers()
        fetchDepartments()
        fetchPositions()
        fetchWorkplaces()
    }, [])

    function handleSaved() {
        setModalOpen(false)
        setSelected(null)
        reset()
        fetchUsers()
    }

    function handleClose() {
        setModalOpen(false)
        setSelected(null)
    }

    const columns = useMemo<DataTableColumn<Record<string, unknown>>[]>(() => [
        { key: 'id', title: '#', width: '60px', sortable: true },
        {
            key: 'photo', title: 'Фото', width: '60px',
            render: (v) => v
                ? <img src={String(v)} alt="" width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                : <i className="bi bi-person-circle fs-4 text-muted"></i>,
        },
        {
            key: 'fullName',
            title: 'ФИО',
            sortable: true,
            filterable: true,
            render: (v) => String(v),
        },
        {
            key: 'phone',
            title: 'Телефон',
            width: '170px',
            filterable: true,
            render: (v) => (
                <a href={`https://t.me/+7${v}`} target="_blank" onClick={(e) => e.stopPropagation()}><i className="bi bi-telegram me-1"></i>7{String(v)}</a>
            ),
        },
        {
            key: 'department', title: 'Отдел', width: '170px', sortable: true,
            filterable: true, filterType: 'select',
            filterOptions: departments.filter(d => d.name).map(d => ({ label: d.name!, value: d.name! })),
        },
        {
            key: 'position', title: 'Должность', width: '200px', sortable: true,
            filterable: true, filterType: 'select',
            filterOptions: positions.map(p => ({ label: p.name!, value: p.name! })),
        },
        { key: 'workplace', title: 'Рабочее место', width: '140px', sortable: true },
        { key: 'skudPass', title: 'Пропуск СКУД', width: '140px', filterable: true },
        { key: 'crmId', title: 'CRM ID', width: '90px', sortable: true },
        { key: 'comments', title: 'Комментарии' },
        {
            key: 'isActive', title: 'Статус', width: '110px',
            filterable: true, filterType: 'select',
            filterOptions: [
                { label: 'Активен', value: 'true' },
                { label: 'Отключён', value: 'false' },
            ],
            render: (v) => (
                <span className={`badge ${v ? 'text-bg-success' : 'text-bg-secondary'}`}>
                {v ? 'Активен' : 'Отключён'}
            </span>
            ),
        },
        { key: 'createdAt', title: 'Добавлен', width: '130px', sortable: true },
    ], [departments, positions])

    const tableData = useMemo(() => users.map(u => ({
        ...u,
        fullName: [u.lastName, u.firstName, u.middleName].filter(Boolean).join(' '),
        department: (u.departmentId != null && departmentNames.get(u.departmentId)) || '—',
        position: (u.positionId != null && positionNames.get(u.positionId)) || '—',
        workplace: (u.workplaceId != null && workplaceNumbers.get(u.workplaceId)) || '—',
    })), [users, departmentNames, positionNames, workplaceNumbers])

    return (
        <AdminLayout>
            {loading
                ? <div className="text-center text-muted py-4">Загрузка...</div>
                : <DataTable
                    columns={columns}
                    data={tableData}
                    title="Сотрудники"
                    exportFilename="users"
                    defaultHiddenCols={['photo', 'skudPass', 'crmId', 'comments', 'createdAt', 'department', 'isActive', 'position', 'id']}
                    onAdd={() => { setSelected(null); setModalOpen(true) }}
                    onRowClick={(row) => { setSelected(row as unknown as User); setModalOpen(true) }}
                />
            }

            <Modal isOpen={modalOpen} onClose={handleClose}
                   title={selected ? 'Редактировать сотрудника' : 'Новый сотрудник'}>
                <UserForm key={selected?.id ?? 'new'} initialData={selected}
                          onSuccess={handleSaved} onCancel={handleClose} />
            </Modal>
        </AdminLayout>
    )
}