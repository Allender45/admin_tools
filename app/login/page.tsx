'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        document.body.className = 'login-page bg-body-secondary'
        return () => { document.body.className = '' }
    }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const form = new FormData(e.currentTarget)
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: form.get('username'),
                password: form.get('password'),
            }),
        })

        const data = await res.json()
        setLoading(false)

        if (!res.ok) { setError(data.error); return }

        router.push('/dashboard')
    }

    return (
        <>

            <main className="login-box">
                <div className="card card-outline card-primary">
                    <div className="card-header">

                        {/* Logo */}
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 w-[80%] m-auto">
                                    <img src="/raz_logo_white.png" alt="logo" />
                            </div>
                        </div>

                        <a href="#" className="link-dark text-center link-offset-2 link-opacity-100 link-opacity-50-hover d-block">
                            <h1 className="mb-0 text-white"><b>Admin</b> Tools</h1>
                        </a>
                    </div>
                    <div className="card-body login-card-body">
                        <p className="login-box-msg">Введите данные для входа</p>

                        {error && (
                            <div className="alert alert-danger py-2 mb-2">{error}</div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="input-group mb-1">
                                <div className="form-floating">
                                    <input id="username" name="username" type="text" className="form-control" placeholder="" required />
                                    <label htmlFor="username">Логин</label>
                                </div>
                                <div className="input-group-text">
                                    <span className="bi bi-person"></span>
                                </div>
                            </div>
                            <div className="input-group mb-1">
                                <div className="form-floating">
                                    <input id="password" name="password" type="password" className="form-control" placeholder="" required />
                                    <label htmlFor="password">Пароль</label>
                                </div>
                                <div className="input-group-text">
                                    <span className="bi bi-lock-fill"></span>
                                </div>
                            </div>
                            <div className="row mt-2">
                                <div className="col-4 ms-auto">
                                    <div className="d-grid gap-2">
                                        <button type="submit" className="btn btn-primary" disabled={loading}>
                                            {loading ? '...' : 'Войти'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </>
    )
}