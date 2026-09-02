'use client'

import {useEffect, useState} from 'react'
import {AdminLayout, ShortTable, AdminForm, DepartmentForm, PositionForm, PcTypeForm} from '@/components'
import {Modal} from '@/containers'
import {useAdminsStore, useDepartmentsStore, usePositionsStore, Admin, usePcTypesStore} from '@/store'
import type { Department, PcType, Position  } from '@prisma/client'

export default function SettingsPage() {
    const {admins,loading: adminsLoading,loaded: adminsLoaded,fetchAdmins,reset: resetAdmins} = useAdminsStore()
    const {departments,loading: departmentsLoading,loaded: departmentsLoaded,fetchDepartments,reset: resetDepartments} = useDepartmentsStore()
    const {positions,loading: positionsLoading,loaded: positionsLoaded,fetchPositions,reset: resetPositions} = usePositionsStore()
    const [adminModalOpen, setAdminModalOpen] = useState(false)
    const [departmentModalOpen, setDepartmentModalOpen] = useState(false)
    const [positionModalOpen, setPositionModalOpen] = useState(false)
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
    const [editingPosition, setEditingPosition] = useState<Position | null>(null)
    const {pcTypes, fetchPcTypes, reset: resetPcTypes} = usePcTypesStore()
    const [pcTypeModalOpen, setPcTypeModalOpen] = useState(false)
    const [editingPcType, setEditingPcType] = useState<PcType | null>(null)

    const adminsRows = admins.map(a => [
        a.id,
        a.displayName ?? '—',
        <span className={`badge ${a.isActive ? 'text-bg-success' : 'text-bg-secondary'}`}>
            {a.isActive ? 'Активен' : 'Отключён'}
        </span>,
        new Date(a.createdAt).toLocaleDateString('ru-RU'),
    ])

    const departmentsRows = departments.map(a => [
        a.id,
        a.name ?? '—',
    ])

    const positionsRows = positions.map(a => [
        a.id,
        a.name ?? '—',
    ])

    const pcTypesRows = pcTypes.map(t => [t.id, t.name ?? '—'])

    function handlePcTypeCreated() {
        setPcTypeModalOpen(false)
        resetPcTypes()
        fetchPcTypes()
    }

    function handlePcTypeEdited() {
        setEditingPcType(null)
        resetPcTypes()
        fetchPcTypes()
    }

    async function handleDeletePcType(index: number) {
        const t = pcTypes[index]
        if (!confirm(`Удалить "${t.name}"?`)) return
        await fetch(`/api/pcTypes/${t.id}`, { method: 'DELETE' })
        resetPcTypes()
        fetchPcTypes()
    }

    useEffect(
        () => {
            fetchAdmins()
            fetchDepartments()
            fetchPositions()
            fetchPcTypes()
        },
        [])

    function handleAdminCreated() {
        setAdminModalOpen(false)
        resetAdmins()
        fetchAdmins()
    }

    async function handleDeleteAdmin(index: number) {
        const a = admins[index]
        if (!confirm(`Удалить "${a.displayName ?? a.username}"?`)) return
        await fetch(`/api/admins/${a.id}`, { method: 'DELETE' })
        resetAdmins()
        fetchAdmins()
    }

    async function handleDeleteDepartment(index: number) {
        const a = departments[index]
        if (!confirm(`Удалить "${a.name}"?`)) return
        await fetch(`/api/departments/${a.id}`, { method: 'DELETE' })
        resetDepartments()
        fetchDepartments()
    }

    async function handleDeletePosition(index: number) {
        const a = positions[index]
        if (!confirm(`Удалить "${a.name}"?`)) return
        await fetch(`/api/positions/${a.id}`, { method: 'DELETE' })
        resetPositions()
        fetchPositions()
    }

    function handleAdminEdited() {
        setEditingAdmin(null)
        resetAdmins()
        fetchAdmins()
    }

    function handleDepartmentEdited() {
        setEditingDepartment(null)
        resetDepartments()
        fetchDepartments()
    }

    function handleDepartmentCreated() {
        setDepartmentModalOpen(false)
        resetDepartments()
        fetchDepartments()
    }

    function handlePositionCreated() {
        setPositionModalOpen(false)
        resetPositions()
        fetchPositions()
    }

    function handlePositionEdited() {
        setEditingPosition(null)
        resetPositions()
        fetchPositions()
    }

    return (
        <AdminLayout>
            <ShortTable
                rows={adminsRows}
                columns={[
                    {label: '#', width: '50px'},
                    {label: 'Имя'},
                    {label: 'Статус', width: '100px'},
                    {label: 'Создан', width: '120px'},
                ]}
                title={"Администраторы"}
                onAdd={() => setAdminModalOpen(true)}
                onEdit={(i) => setEditingAdmin(admins[i])}
                onDelete={handleDeleteAdmin}
            />
            <ShortTable
                rows={departmentsRows}
                columns={[
                    {label: '#', width: '50px'},
                    {label: 'Название'},
                ]}
                title={"Отделы"}
                onAdd={() => setDepartmentModalOpen(true)}
                onDelete={handleDeleteDepartment}
                onEdit={(i) => setEditingDepartment(departments[i])}
            />

            <ShortTable
                rows={positionsRows}
                columns={[
                    {label: '#', width: '50px'},
                    {label: 'Название'},
                ]}
                title={"Должности"}
                onAdd={() => setPositionModalOpen(true)}
                onDelete={handleDeletePosition}
                onEdit={(i) => setEditingPosition(positions[i])}
            />

            <ShortTable
                rows={pcTypesRows}
                columns={[
                    {label: '#', width: '50px'},
                    {label: 'Название'},
                ]}
                title="Типы компьютеров"
                onAdd={() => setPcTypeModalOpen(true)}
                onDelete={handleDeletePcType}
                onEdit={(i) => setEditingPcType(pcTypes[i])}
            />

            <Modal isOpen={adminModalOpen} onClose={() => setAdminModalOpen(false)} title="Новый администратор">
                <AdminForm onSuccess={handleAdminCreated} onCancel={() => setAdminModalOpen(false)}/>
            </Modal>

            <Modal isOpen={!!editingAdmin} onClose={() => setEditingAdmin(null)} title="Редактировать администратора">
                {editingAdmin && (
                    <AdminForm admin={editingAdmin} onSuccess={handleAdminEdited} onCancel={() => setEditingAdmin(null)} />
                )}
            </Modal>

            <Modal isOpen={departmentModalOpen} onClose={() => setDepartmentModalOpen(false)} title="Новый отдел">
                <DepartmentForm onSuccess={handleDepartmentCreated} onCancel={() => setDepartmentModalOpen(false)}/>
            </Modal>

            <Modal isOpen={!!editingDepartment} onClose={() => setEditingAdmin(null)} title="Редактировать отдел">
                {editingDepartment && (
                    <DepartmentForm department={editingDepartment} onSuccess={handleDepartmentEdited} onCancel={() => setEditingDepartment(null)} />
                )}
            </Modal>

            <Modal isOpen={positionModalOpen} onClose={() => setPositionModalOpen(false)} title="Новая должность">
                <PositionForm onSuccess={handlePositionCreated} onCancel={() => setPositionModalOpen(false)}/>
            </Modal>

            <Modal isOpen={!!editingPosition} onClose={() => setEditingPosition(null)} title="Редактировать должность">
                {editingPosition && (
                    <PositionForm position={editingPosition} onSuccess={handlePositionEdited} onCancel={() => setEditingPosition(null)} />
                )}
            </Modal>

            <Modal isOpen={pcTypeModalOpen} onClose={() => setPcTypeModalOpen(false)} title="Новый тип компьютера">
                <PcTypeForm onSuccess={handlePcTypeCreated} onCancel={() => setPcTypeModalOpen(false)}/>
            </Modal>

            <Modal isOpen={!!editingPcType} onClose={() => setEditingPcType(null)} title="Редактировать тип компьютера">
                {editingPcType && (
                    <PcTypeForm pcType={editingPcType} onSuccess={handlePcTypeEdited} onCancel={() => setEditingPcType(null)} />
                )}
            </Modal>
        </AdminLayout>
    )
}