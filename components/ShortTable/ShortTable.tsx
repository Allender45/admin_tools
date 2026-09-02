'use client'

interface Column {
    label: string
    width?: string
}

interface ShortTableProps {
    title?: string
    columns: Column[]
    rows: React.ReactNode[][]
    onAdd?: () => void
    onDelete?: (index: number) => void
    onEdit?: (index: number) => void
}

export default function ShortTable({title, columns, rows, onAdd, onDelete, onEdit}: ShortTableProps) {
    return (
        <div className="card mb-4">
            {(title || onAdd) && (
                <div className="card-header d-flex align-items-center">
                    {title && <h3 className="card-title mb-0">{title}</h3>}
                    {onAdd && (
                        <button onClick={onAdd} className="btn btn-primary btn-sm ms-auto">
                            <i className="bi bi-plus-lg me-1"></i>Добавить
                        </button>
                    )}
                </div>
            )}
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead>
                        <tr>
                            {columns.map((col, i) => (
                                <th key={i} style={col.width ? {width: col.width} : undefined}>
                                    {col.label}
                                </th>
                            ))}
                            {(onDelete || onEdit) && (
                                <th className="text-center">Действия</th>
                            )}
                        </tr>
                        </thead>
                        <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center text-muted py-3">
                                    Нет данных
                                </td>
                            </tr>
                        ) : (
                            rows.map((cells, i) => (
                                <tr key={i} className="align-middle">
                                    {cells.map((cell, j) => (
                                        <td key={j}>{cell}</td>
                                    ))}
                                    {(onDelete || onEdit) && (
                                        <td>
                                            <div className="d-flex gap-2 justify-content-center">
                                                {onEdit && (
                                                    <button onClick={() => onEdit(i)} className="btn btn-outline-info btn-sm" title="Редактировать">
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button onClick={() => onDelete(i)} className="btn btn-outline-danger btn-sm" title="Удалить">
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}