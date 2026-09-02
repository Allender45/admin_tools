import { create } from 'zustand'
import type { Position } from '@prisma/client'

type PositionsStore = {
    positions: Position[]
    loading: boolean
    loaded: boolean
    fetchPositions: () => Promise<void>
    reset: () => void
    error: string | null
}

export const usePositionsStore = create<PositionsStore>((set, get) => ({
    positions: [],
    loading: false,
    loaded: false,
    error: null,

    fetchPositions: async () => {
        if (get().loaded) return
        set({ loading: true })
        try {
            const res = await fetch('/api/positions')
            const data = await res.json()
            set({ positions: data.positions ?? [], loaded: true })
        } catch (error) {
            console.error('[fetchPositions]', error)
        } finally {
            set({ loading: false })
        }
    },

    reset: () => set({ positions: [], loaded: false, loading: false, error: null }),
}))