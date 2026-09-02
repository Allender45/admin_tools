'use client'

import { useState, useMemo } from 'react'

export interface DataTableColumn<T = Record<string, unknown>> {
    key: string
    title: string
    width?: string
    sortable?: boolean
    filterable?: boolean
    filterType?: 'input' | 'select'
    filterOptions?: { label: string; value: string }[]
    render?: (value: unknown, row: T) => React.ReactNode
}

interface DataTableProps<T extends Record<string, unknown>> {
    columns: DataTableColumn<T>[]
    data: T[]
    title?: string
    defaultPageSize?: number
    defaultHiddenCols?: string[]
    onAdd?: () => void
    onRowClick?: (row: T) => void
    exportFilename?: string
}

export default function DataTable<T extends Record<string, unknown>>({
                                                                         columns, data, title, defaultPageSize = 10, onAdd, onRowClick, exportFilename = 'data', defaultHiddenCols
                                                                     }: DataTableProps<T>) {
    const [search, setSearch] = useState('')
    const [sortKey, setSortKey] = useState<string | null>(null)
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(defaultPageSize)
    const [showSettings, setShowSettings] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set(defaultHiddenCols))
    const [colFilters, setColFilters] = useState<Record<string, string>>({})

    const visibleColumns = columns.filter(c => !hiddenCols.has(c.key))
    const activeFilterCount = Object.values(colFilters).filter(Boolean).length

    function toggleCol(key: string) {
        setHiddenCols(prev => {
            const next = new Set(prev)
            next.has(key) ? next.delete(key) : next.add(key)
            return next
        })
    }

    function setColFilter(key: string, value: string) {
        setColFilters(prev => ({ ...prev, [key]: value }))
        setPage(1)
    }

    const filtered = useMemo(() => {
        let result = data
        if (search) {
            const q = search.toLowerCase()
            result = result.filter(row =>
                Object.values(row).some(v => v != null && String(v).toLowerCase().includes(q))
            )
        }
        for (const [key, val] of Object.entries(colFilters)) {
            if (!val) continue
            const col = columns.find(c => c.key === key)
            if (col?.filterType === 'select') {
                result = result.filter(row => String(row[key] ?? '') === val)
            } else {
                const q = val.toLowerCase()
                result = result.filter(row => String(row[key] ?? '').toLowerCase().includes(q))
            }
        }
        return result
    }, [data, search, colFilters, columns])

    const sorted = useMemo(() => {
        if (!sortKey) return filtered
        return [...filtered].sort((a, b) => {
            const cmp = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), 'ru')
            return sortDir === 'asc' ? cmp : -cmp
        })
    }, [filtered, sortKey, sortDir])

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
    const curPage = Math.min(page, totalPages)
    const paginated = sorted.slice((curPage - 1) * pageSize, curPage * pageSize)

    function handleSort(key: string, sortable?: boolean) {
        if (!sortable) return
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortKey(key); setSortDir('asc') }
        setPage(1)
    }

    function handleSearch(v: string) { setSearch(v); setPage(1) }

    function download(content: string, filename: string, type: string) {
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(new Blob([content], { type })),
            download: filename,
        })
        a.click()
        URL.revokeObjectURL(a.href)
    }

    function exportCSV() {
        const headers = visibleColumns.map(c => `"${c.title}"`).join(',')
        const rows = filtered.map(row =>
            visibleColumns.map(c => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
        )
        download([headers, ...rows].join('\n'), `${exportFilename}.csv`, 'text/csv')
    }

    function exportJSON() {
        download(
            JSON.stringify(filtered.map(row => Object.fromEntries(visibleColumns.map(c => [c.key, row[c.key]]))), null, 2),
            `${exportFilename}.json`, 'application/json'
        )
    }

    const pageNums = getPageNumbers(curPage, totalPages)

    return (
        <>
            <div className="card">

                {title && (
                    <div className="card-header d-flex align-items-center gap-1 me-2">
                        <h3 className="mb-0">{title}</h3>
                        <button
                            className="btn btn-link btn-sm p-0 ms-1 text-muted"
                            title="Настройки таблицы"
                            onClick={() => setShowSettings(true)}
                        >
                            <i className="bi bi-gear fs-6"></i>
                        </button>
                    </div>
                )}
                <div className="card-header d-flex align-items-center gap-2 flex-wrap">


                    <div className="input-group input-group-sm me-auto" style={{ maxWidth: '300px' }}>
                        <span className="input-group-text"><i className="bi bi-search"></i></span>
                        <input type="text" className="form-control" placeholder="Поиск..."
                               value={search} onChange={e => handleSearch(e.target.value)} />
                        {search && (
                            <button className="btn btn-outline-secondary" onClick={() => handleSearch('')}>
                                <i className="bi bi-x"></i>
                            </button>
                        )}
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            className={`btn btn-sm ${showFilters ? 'btn-secondary' : 'btn-outline-secondary'}`}
                            title="Фильтры по колонкам"
                            onClick={() => setShowFilters(f => !f)}
                        >
                            <i className="bi bi-funnel me-1"></i>Фильтры
                            {activeFilterCount > 0 && (
                                <span className="badge text-bg-danger ms-1">{activeFilterCount}</span>
                            )}
                        </button>
                        {!title && (
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                title="Настройки таблицы"
                                onClick={() => setShowSettings(true)}
                            >
                                <i className="bi bi-gear"></i>
                            </button>
                        )}
                        {onAdd && (
                            <button onClick={onAdd} className="btn btn-primary btn-sm">
                                <i className="bi bi-plus-lg me-1"></i>Добавить
                            </button>
                        )}
                    </div>
                </div>

                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead>
                            <tr>
                                {visibleColumns.map(col => (
                                    <th key={col.key}
                                        style={{ width: col.width, whiteSpace: 'nowrap', cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}
                                        onClick={() => handleSort(col.key, col.sortable)}
                                    >
                                        {col.title}
                                        {col.sortable && (
                                            <i className={`bi ms-1 small ${sortKey === col.key ? (sortDir === 'asc' ? 'bi-sort-up' : 'bi-sort-down') : 'bi-arrow-down-up opacity-25'}`}></i>
                                        )}
                                    </th>
                                ))}
                            </tr>
                            {showFilters && (
                                <tr>
                                    {visibleColumns.map(col => (
                                        <th key={col.key} className="p-1">
                                            {col.filterable && col.filterType === 'select' ? (
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={colFilters[col.key] ?? ''}
                                                    onChange={e => setColFilter(col.key, e.target.value)}
                                                >
                                                    <option value="">Все</option>
                                                    {col.filterOptions?.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            ) : col.filterable ? (
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Фильтр..."
                                                    value={colFilters[col.key] ?? ''}
                                                    onChange={e => setColFilter(col.key, e.target.value)}
                                                />
                                            ) : null}
                                        </th>
                                    ))}
                                </tr>
                            )}
                            </thead>
                            <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={visibleColumns.length} className="text-center text-muted py-4">
                                        {search || activeFilterCount ? 'Ничего не найдено' : 'Нет данных'}
                                    </td>
                                </tr>
                            ) : paginated.map((row, i) => (
                                <tr key={i} className="align-middle"
                                    style={onRowClick ? { cursor: 'pointer' } : undefined}
                                    onClick={() => onRowClick?.(row)}>
                                    {visibleColumns.map(col => (
                                        <td key={col.key}>
                                            {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card-footer d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2 small text-muted">
                        {sorted.length === 0 ? 'Нет записей' : `${(curPage - 1) * pageSize + 1}–${Math.min(curPage * pageSize, sorted.length)} из ${sorted.length}`}
                        <select className="form-select form-select-sm" style={{ width: 'auto' }}
                                value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}>
                            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} на стр.</option>)}
                        </select>
                    </div>
                    {totalPages > 1 && (
                        <nav><ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${curPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setPage(1)}>«</button>
                            </li>
                            <li className={`page-item ${curPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setPage(p => p - 1)}>‹</button>
                            </li>
                            {pageNums.map((n, i) => n === '...'
                                ? <li key={`e${i}`} className="page-item disabled"><span className="page-link">…</span></li>
                                : <li key={n} className={`page-item ${curPage === n ? 'active' : ''}`}>
                                    <button className="page-link" onClick={() => setPage(n as number)}>{n}</button>
                                </li>
                            )}
                            <li className={`page-item ${curPage === totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setPage(p => p + 1)}>›</button>
                            </li>
                            <li className={`page-item ${curPage === totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setPage(totalPages)}>»</button>
                            </li>
                        </ul></nav>
                    )}
                </div>
            </div>

            {showSettings && (
                <>
                    <div className="modal-backdrop fade show" onClick={() => setShowSettings(false)} />
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        <i className="bi bi-gear me-2"></i>Настройки таблицы
                                    </h5>
                                    <button type="button" className="btn-close" onClick={() => setShowSettings(false)} />
                                </div>
                                <div className="modal-body">
                                    <p className="text-muted small text-uppercase mb-2">Видимость колонок</p>
                                    <div className="d-flex flex-column gap-2 mb-4">
                                        {columns.map(col => (
                                            <div key={col.key} className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    role="switch"
                                                    id={`col-vis-${col.key}`}
                                                    checked={!hiddenCols.has(col.key)}
                                                    onChange={() => toggleCol(col.key)}
                                                />
                                                <label className="form-check-label" htmlFor={`col-vis-${col.key}`}>
                                                    {col.title}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-muted small text-uppercase mb-2">Экспорт</p>
                                    <div className="d-flex gap-2">
                                        <button onClick={exportCSV} className="btn btn-outline-secondary btn-sm">
                                            <i className="bi bi-filetype-csv me-1"></i>Скачать CSV
                                        </button>
                                        <button onClick={exportJSON} className="btn btn-outline-secondary btn-sm">
                                            <i className="bi bi-filetype-json me-1"></i>Скачать JSON
                                        </button>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary btn-sm" onClick={() => setShowSettings(false)}>
                                        Закрыть
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (current > 3) pages.push('...')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
    if (current < total - 2) pages.push('...')
    pages.push(total)
    return pages
}