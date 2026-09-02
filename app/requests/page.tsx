'use client'

import { useEffect, useMemo, useState } from 'react'
import { DataTable, UserForm, WorkplaceForm, RequestForm, AdminLayout } from '@/components'
import type { DataTableColumn } from '@/components'
import { useRequestsStore } from '@/store'
import type { RequestWithRelations } from '@/store'
import { Modal } from '@/containers'
import type { User, Workplace } from '@prisma/client'

export default function RequestsPage() {
    const { requests, loading, fetchRequests, reset } = useRequestsStore()
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [selectedWorkplace, setSelectedWorkplace] = useState<Workplace | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<RequestWithRelations | null>(null)

    useEffect(() => {
        fetchRequests()
    }, [])

    const tableData = useMemo(() => requests.map(r => ({
        ...r,
        authorName: [r.author.lastName, r.author.firstName, r.author.middleName].filter(Boolean).join(' '),
        departmentName: r.department?.name ?? '—',
        workplaceNumber: r.workplace?.number ?? '—',
        createdAtFormatted: new Date(r.createdAt).toLocaleString('ru'),
    })), [requests])

    const authorOptions = useMemo(() =>
            [...new Set(tableData.map(r => r.authorName))].map(n => ({ label: n, value: n })),
        [tableData])

    const departmentOptions = useMemo(() =>
            [...new Set(tableData.map(r => r.departmentName))].map(n => ({ label: n, value: n })),
        [tableData])

    const columns = useMemo<DataTableColumn<Record<string, unknown>>[]>(() => [
        { key: 'id', title: '#', width: '60px', sortable: true },
        {
            key: 'status', title: 'Статус', width: '110px',
            filterable: true, filterType: 'select',
            filterOptions: [
                { label: 'Активна', value: 'true' },
                { label: 'Закрыта', value: 'false' },
            ],
            render: (v) => (
                <span className={`badge ${v ? 'text-bg-success' : 'text-bg-secondary'}`}>
                    {v ? 'Активна' : 'Закрыта'}
                </span>
            ),
        },
        {
            key: 'authorName', title: 'Автор', width: '200px', sortable: true,
            filterable: true, filterType: 'select',
            filterOptions: authorOptions,
            render: (v, row) => (
                <button type="button" className="btn btn-link p-0 text-decoration-none"
                        onClick={(e) => {
                            e.stopPropagation()
                            setSelectedUser(row.author as User)
                        }}>
                    {String(v)}
                </button>
            ),
        },
        {
            key: 'workplaceNumber', title: 'Рабочее место', width: '140px', sortable: true,
            render: (v, row) => (
                <button type="button" className="btn btn-link p-0 text-decoration-none"
                        onClick={(e) => {
                            e.stopPropagation()
                            setSelectedWorkplace(row.workplace as Workplace)
                        }}>
                    {String(v)}
                </button>
            ),
        },
        {
            key: 'contactPhone', title: 'Телефон', width: '170px', filterable: true,
            render: (v) => (
                <a href={`https://t.me/+7${v}`} target="_blank" onClick={(e) => e.stopPropagation()}>
                    <i className="bi bi-telegram me-1"></i>{String(v)}
                </a>
            ),
        },
        { key: 'createdAtFormatted', title: 'Создана', width: '160px', sortable: true },
    ], [authorOptions, departmentOptions])

    function handleClose() {
        setSelectedUser(null)
        setSelectedWorkplace(null)
    }

    function handleSaved() {
        setSelectedRequest(null)
        reset()
        fetchRequests()
    }

    return (
        <AdminLayout>
            {loading
                ? <div className="text-center text-muted py-4">Загрузка...</div>
                : <DataTable
                    columns={columns}
                    data={tableData}
                    title="Заявки"
                    exportFilename="requests"
                    defaultHiddenCols={['comments', 'id']}
                    onRowClick={(row) => setSelectedRequest(row as unknown as RequestWithRelations)}
                />
            }

            <Modal isOpen={!!selectedUser} onClose={handleClose} title="Редактировать сотрудника">
                {selectedUser && (
                    <UserForm key={selectedUser.id} initialData={selectedUser}
                              onSuccess={handleClose} onCancel={handleClose} />
                )}
            </Modal>

            <Modal isOpen={!!selectedWorkplace} onClose={handleClose} title="Редактировать рабочее место">
                {selectedWorkplace && (
                    <WorkplaceForm key={selectedWorkplace.id} initialData={selectedWorkplace}
                                   onSuccess={handleClose} onCancel={handleClose} />
                )}
            </Modal>

            <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)}
                   title={`Заявка #${selectedRequest?.id}`}>
                {selectedRequest && (
                    <RequestForm key={selectedRequest.id} initialData={selectedRequest}
                                 onSuccess={handleSaved} onCancel={() => setSelectedRequest(null)} />
                )}
            </Modal>
        </AdminLayout>
    )
}