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
    isOpen ? bsModal.current.show() : bsModal.current.hide()
  }, [isOpen])

  return (
    <div ref={modalRef} className="modal fade animate-fadeIn" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">{children}</div>
          {onSubmit && (
            <div className="modal-footer">
              <button type="button" className="btn btn-light-secondary" onClick={onClose}>
                Batal
              </button>
              <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={isLoading}>
                {isLoading
                  ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Menyimpan...</>
                  : <><i className="ti ti-device-floppy me-1" />Simpan</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
