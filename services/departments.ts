import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import prisma from '@/lib/db'

const fetchDepartments = unstable_cache(
    async () => prisma.department.findMany({ orderBy: { id: 'asc' } }),
    ['departments-list'],
    { revalidate: 300, tags: ['departments'] }
)

export const getDepartments = cache(fetchDepartments)