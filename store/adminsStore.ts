import { create } from 'zustand'

export type Admin = {
    id: number
    username: string
    displayName: string | null
    isActive: boolean
    createdAt: string
}

type AdminsStore = {
    admins: Admin[]
    loading: boolean
    error: string | null
    loaded: boolean
    fetchAdmins: () => Promise<void>
    reset: () => void
}

export const useAdminsStore = create<AdminsStore>((set, get) => ({
    admins: [],
    loading: false,
    error: null,
    loaded: false,

    fetchAdmins: async () => {
        if (get().loaded) return
        set({ loading: true, error: null })
        try {
            const res = await fetch('/api/admins')
            const data = await res.json()
            if (!res.ok) { set({ error: data.error ?? 'Ошибка' }); return }
            set({ admins: data.admins, loaded: true })
        } catch {
            set({ error: 'Ошибка соединения' })
        } finally {
            set({ loading: false })
        }
    },

    reset: () => set({ admins: [], loaded: false, loading: false, error: null }),
}))