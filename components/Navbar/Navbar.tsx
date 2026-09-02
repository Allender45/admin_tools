'use client'

import { useRouter } from 'next/navigation'

interface NavbarProps {
    adminName: string
}

export default function Navbar({ adminName }: NavbarProps) {
    const router = useRouter()

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    return (
        <nav className="app-header navbar navbar-expand bg-body">
            <div className="container-fluid">
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <a className="nav-link" data-lte-toggle="sidebar" href="#" role="button" aria-label="Toggle sidebar">
                            <i className="bi bi-list"></i>
                        </a>
                    </li>
                </ul>
                <ul className="navbar-nav ms-auto">
                    <li className="nav-item dropdown user-menu">
                        <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                            <i className="bi bi-person-circle me-1"></i>
                            <span className="d-none d-md-inline">{adminName}</span>
                        </a>
                        <ul className="dropdown-menu dropdown-menu-lg dropdown-menu-end">
                            <li className="user-footer">
                                <button onClick={handleLogout} className="btn btn-outline-danger w-100">
                                    <i className="bi bi-box-arrow-right me-2"></i>Выйти
                                </button>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </nav>
    )
}