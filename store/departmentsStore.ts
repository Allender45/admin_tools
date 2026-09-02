import { create } from 'zustand'
import type { Department } from '@prisma/client'

type DepartmentsStore = {
    departments: Department[]
    loading: boolean
    loaded: boolean
    fetchDepartments: () => Promise<void>
    reset: () => void
    error: string | null
}

export const useDepartmentsStore = create<DepartmentsStore>((set, get) => ({
    departments: [],
    loading: false,
    loaded: false,
    error: null,

    fetchDepartments: async () => {
        if (get().loaded) return
        set({ loading: true })
        try {
            const res = await fetch('/api/departments')
            const data = await res.json()
            set({ departments: data.departments ?? [], loaded: true })
        } catch (error) {
            console.error('[fetchDepartments]', error)
        } finally {
            set({ loading: false })
        }
    },

    reset: () => set({ departments: [], loaded: false, loading: false, error: null }),
}))