'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '@/components/AdminLayout/AdminLayout'
import { DataTable, WorkplaceForm } from '@/components'
import type { DataTableColumn } from '@/components'
import { Modal } from '@/containers'
import { useWorkplacesStore } from '@/store'
import type { Workplace } from '@prisma/client'

export default function WorkplacesPage() {
    const { workplaces, loading, fetchWorkplaces, reset } = useWorkplacesStore()
    const [modalOpen, setModalOpen] = useState(false)
    const [selected, setSelected] = useState<Workplace | null>(null)

    useEffect(() => {
        fetchWorkplaces()
    }, [])

    const columns = useMemo<DataTableColumn<Record<string, unknown>>[]>(() => [
        { key: 'number', title: 'Номер', width: '140px', sortable: true, filterable: true },
        { key: 'ipAddress', title: 'IP адрес', width: '160px', sortable: true, filterable: true },
    ], [])

    function handleSaved() {
        setModalOpen(false)
        setSelected(null)
        reset()
        fetchWorkplaces()
    }

    function handleClose() {
        setModalOpen(false)
        setSelected(null)
    }

    return (
        <AdminLayout>
            {loading
                ? <div className="text-center text-muted py-4">Загрузка...</div>
                : <DataTable
                    columns={columns}
                    data={workplaces as unknown as Record<string, unknown>[]}
                    title="Рабочие места"
                    exportFilename="workplaces"
                    onAdd={() => { setSelected(null); setModalOpen(true) }}
                    onRowClick={(row) => { setSelected(row as unknown as Workplace); setModalOpen(true) }}
                />
            }

            <Modal isOpen={modalOpen} onClose={handleClose}
                   title={selected ? 'Редактировать рабочее место' : 'Новое рабочее место'}>
                <WorkplaceForm key={selected?.id ?? 'new'} initialData={selected}
                               onSuccess={handleSaved} onCancel={handleClose} />
            </Modal>
        </AdminLayout>
    )
}