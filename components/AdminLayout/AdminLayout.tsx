'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar, Navbar } from '@/components'
import Script from 'next/script'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [adminName, setAdminName] = useState('Администратор')
    const router = useRouter()

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => {
                if (res.status === 401) { router.push('/login'); return null }
                return res.json()
            })
            .then(data => {
                if (data?.admin) {
                    setAdminName(data.admin.displayName ?? data.admin.username)
                }
            })
    }, [])

    return (
        <div className="app-wrapper">
            <Navbar adminName={adminName} />
            <Sidebar />
            <main className="app-main">
                <div className="app-content-header">
                    <div className="container-fluid"></div>
                </div>
                <div className="app-content">
                    <div className="container-fluid">
                        {children}
                    </div>
                </div>
            </main>
            <Script src="/js/adminlte.js" strategy="afterInteractive" />
        </div>
    )
}