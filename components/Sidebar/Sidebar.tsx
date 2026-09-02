'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
    { href: '/dashboard', icon: 'bi-speedometer', label: 'Дашборд' },
    { href: '/users', icon: 'bi-people-fill', label: 'Пользователи' },
    { href: '/workplaces', icon: 'bi-pc-display', label: 'Рабочие места' },
    { href: '/settings', icon: 'bi-box-seam-fill', label: 'Настройки' },
    { href: '/requests', icon: 'bi-headset', label: 'Заявки' },
    { href: '/tasks', icon: 'bi-list-task', label: 'Задачи' },
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
            <div className="sidebar-brand">
                <Link href="/dashboard" className="">
                    <img src="/raz_logo_white.png" alt="Logo" className="opacity-75 shadow object-contain max-h-14" />
                </Link>
            </div>
            <div className="sidebar-wrapper">
                <nav className="mt-2" aria-label="Main navigation">
                    <ul className="nav sidebar-menu flex-column" data-lte-toggle="treeview" data-accordion="false">
                        {navItems.map(({ href, icon, label }) => (
                            <li key={href} className="nav-item">
                                <Link href={href} className={`nav-link ${pathname.startsWith(href) ? 'active' : ''}`}>
                                    <i className={`nav-icon bi ${icon}`}></i>
                                    <p>{label}</p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </aside>
    )
}