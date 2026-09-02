'use client'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null

    return (
        <>
            <div className="modal fade show d-block" tabIndex={-1} role="dialog" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{title}</h5>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>
                        {children}
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"/>
        </>
    )
}