import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import prisma from '@/lib/db'

const fetchAdmins = unstable_cache(
    async () => prisma.admin.findMany({ orderBy: { id: 'asc' } }),
    ['admins-list'],
    { revalidate: 300, tags: ['admins'] }
)

export const getAdmins = cache(fetchAdmins)