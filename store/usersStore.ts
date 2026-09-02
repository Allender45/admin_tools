import { create } from 'zustand'
import type { User } from '@prisma/client'

type UsersStore = {
    users: User[]
    loading: boolean
    loaded: boolean
    error: string | null
    fetchUsers: () => Promise<void>
    reset: () => void
}

export const useUsersStore = create<UsersStore>((set, get) => ({
    users: [],
    loading: false,
    loaded: false,
    error: null,

    fetchUsers: async () => {
        if (get().loaded) return
        set({ loading: true, error: null })
        try {
            const res = await fetch('/api/users')
            const data = await res.json()
            set({ users: data.users ?? [], loaded: true })
        } catch (error) {
            console.error('[fetchUsers]', error)
            set({ error: 'Ошибка соединения' })
        } finally {
            set({ loading: false })
        }
    },

    reset: () => set({ users: [], loaded: false, loading: false, error: null }),
}))