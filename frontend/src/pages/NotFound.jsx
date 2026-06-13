import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'var(--bs-body-bg)' }}>
      <div className="text-center">
        <div className="avtar avtar-xl bg-light-danger mx-auto mb-4" style={{ width: 80, height: 80, borderRadius: '50%' }}>
          <i className="ti ti-alert-circle f-36 text-danger" />
        </div>
        <h1 className="f-w-700 mb-2" style={{ fontSize: '5rem', color: 'var(--pc-heading-color, #1d2630)' }}>404</h1>
        <p className="text-muted mb-4 f-16">Halaman tidak ditemukan</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          <i className="ti ti-arrow-left me-2" />Kembali
        </button>
      </div>
    </div>
  )
}
