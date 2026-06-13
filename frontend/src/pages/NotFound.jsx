import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div
      className="d-flex align-items-center justify-content-center p-4"
      style={{ minHeight: '100vh', background: '#f3f5f7' }}
    >
      <div className="text-center">
        <div
          className="d-flex align-items-center justify-content-center mx-auto mb-4"
          style={{ width: 80, height: 80, background: 'rgba(220,38,38,0.1)', borderRadius: '50%' }}
        >
          <AlertCircle size={38} color="#dc2626" />
        </div>
        <h1 className="fw-black mb-2" style={{ fontSize: '5rem', color: '#1d2630', lineHeight: 1 }}>404</h1>
        <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>Halaman tidak ditemukan</p>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-primary d-inline-flex align-items-center gap-2"
          style={{ borderRadius: 10, padding: '10px 24px' }}
        >
          <ArrowLeft size={16} /> Kembali
        </button>
      </div>
    </div>
  )
}
