import { useEffect, useRef } from 'react'
import { Modal as BsModal } from 'bootstrap'

export default function Modal({ isOpen, onClose, title, children, onSubmit, isLoading }) {
  const modalRef = useRef(null)
  const bsModal  = useRef(null)

  useEffect(() => {
    if (modalRef.current && !bsModal.current) {
      bsModal.current = new BsModal(modalRef.current, { backdrop: 'static', keyboard: true })
      modalRef.current.addEventListener('hidden.bs.modal', onClose)
    }
  }, [])

  useEffect(() => {
    if (!bsModal.current) return
    if (isOpen) {
      bsModal.current.show()
    } else {
      bsModal.current.hide()
    }
  }, [isOpen])

  return (
    <div ref={modalRef} className="modal fade animate-fadeIn" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content" style={{ borderRadius: 14, border: 'none' }}>
          <div className="modal-header" style={{ borderBottom: '1px solid #e7eaee' }}>
            <h5 className="modal-title fw-semibold" style={{ fontSize: '0.95rem' }}>{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">{children}</div>

          {onSubmit && (
            <div className="modal-footer" style={{ borderTop: '1px solid #e7eaee' }}>
              <button
                type="button"
                className="btn btn-light"
                onClick={onClose}
                style={{ borderRadius: 8, fontSize: '0.875rem' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onSubmit}
                disabled={isLoading}
                style={{ borderRadius: 8, fontSize: '0.875rem' }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Menyimpan...
                  </>
                ) : 'Simpan'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
