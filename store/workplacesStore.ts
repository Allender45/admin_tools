import { create } from 'zustand'
import type { Workplace } from '@prisma/client'

type WorkplacesStore = {
    workplaces: Workplace[]
    loading: boolean
    loaded: boolean
    error: string | null
    fetchWorkplaces: () => Promise<void>
    reset: () => void
}

export const useWorkplacesStore = create<WorkplacesStore>((set, get) => ({
    workplaces: [],
    loading: false,
    loaded: false,
    error: null,

    fetchWorkplaces: async () => {
        if (get().loaded) return
        set({ loading: true, error: null })
        try {
            const res = await fetch('/api/workplaces')
            const data = await res.json()
            set({ workplaces: data.workplaces ?? [], loaded: true })
        } catch (error) {
            console.error('[fetchWorkplaces]', error)
            set({ error: 'Ошибка соединения' })
        } finally {
            set({ loading: false })
        }
    },

    reset: () => set({ workplaces: [], loaded: false, loading: false, error: null }),
}))