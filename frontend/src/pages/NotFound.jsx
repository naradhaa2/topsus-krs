import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-7xl font-black text-slate-800 mb-2">404</h1>
        <p className="text-slate-500 text-lg mb-8">Halaman tidak ditemukan</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 text-white rounded-xl font-medium hover:bg-blue-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </div>
    </div>
  )
}
