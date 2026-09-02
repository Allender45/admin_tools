import { create } from 'zustand'
import type { PcType } from '@prisma/client'

type pcTypesStore = {
    pcTypes: PcType[]
    loading: boolean
    loaded: boolean
    fetchPcTypes: () => Promise<void>
    reset: () => void
    error: string | null
}

export const usePcTypesStore = create<pcTypesStore>((set, get) => ({
    pcTypes: [],
    loading: false,
    loaded: false,
    error: null,

    fetchPcTypes: async () => {
        if (get().loaded) return
        set({ loading: true })
        try {
            const res = await fetch('/api/pcTypes')
            const data = await res.json()
            set({ pcTypes: data.pcTypes ?? [], loaded: true })
        } catch (error) {
            console.error('[fetchPcTypes]', error)
        } finally {
            set({ loading: false })
        }
    },

    reset: () => set({ pcTypes: [], loaded: false, loading: false, error: null }),
}))