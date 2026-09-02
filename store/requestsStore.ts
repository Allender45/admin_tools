import { create } from 'zustand'
import type { Requests, User, Department, Workplace } from '@prisma/client'

export type RequestWithRelations = Requests & {
    author: User
    department: Department | null
    workplace: Workplace
}

type RequestsStore = {
    requests: RequestWithRelations[]
    loading: boolean
    loaded: boolean
    error: string | null
    fetchRequests: () => Promise<void>
    reset: () => void
}

export const useRequestsStore = create<RequestsStore>((set, get) => ({
    requests: [],
    loading: false,
    loaded: false,
    error: null,

    fetchRequests: async () => {
        if (get().loaded) return
        set({ loading: true, error: null })
        try {
            const res = await fetch('/api/requests')
            const data = await res.json()
            set({ requests: data.requests ?? [], loaded: true })
        } catch (error) {
            console.error('[fetchRequests]', error)
            set({ error: 'Ошибка соединения' })
        } finally {
            set({ loading: false })
        }
    },

    reset: () => set({ requests: [], loaded: false, loading: false, error: null }),
}))