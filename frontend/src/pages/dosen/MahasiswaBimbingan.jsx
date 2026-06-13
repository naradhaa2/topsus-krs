import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar        from '../../components/Sidebar'
import LoadingSpinner from '../../components/LoadingSpinner'
import api            from '../../services/api'

export default function MahasiswaBimbingan() {
  const [data,      setData]      = useState([])
  const [filtered,  setFiltered]  = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search,    setSearch]    = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/dosen/mahasiswa-bimbingan')
      .then((r) => { const d = r.data.data ?? []; setData(d); setFiltered(d) })
      .catch(() => toast.error('Gagal memuat data mahasiswa bimbingan'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!search) { setFiltered(data); return }
    const q = search.toLowerCase()
    setFiltered(data.filter((m) => m.nama.toLowerCase().includes(q) || m.nim.toLowerCase().includes(q)))
  }, [search, data])

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <main className="md:ml-60 p-4 md:p-6 pt-16 md:pt-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Mahasiswa Bimbingan</h1>
        <p className="text-slate-500 text-sm mb-6">Total {data.length} mahasiswa dalam bimbingan Anda. Klik baris untuk melihat detail KRS.</p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau NIM..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {isLoading ? <LoadingSpinner /> : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['NIM', 'Nama', 'Jurusan', 'Semester', 'Jumlah MK', 'Total SKS', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        {search ? 'Tidak ada mahasiswa yang cocok' : 'Belum ada mahasiswa bimbingan'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => navigate(`/dosen/bimbingan/${m.id}`)}
                        className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.nim}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{m.nama}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{m.jurusan}</td>
                        <td className="px-4 py-3 text-slate-600">Sem {m.semester}</td>
                        <td className="px-4 py-3 text-slate-600">{m.ringkasan_krs?.jumlah_mk ?? 0} MK</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            (m.ringkasan_krs?.total_sks ?? 0) > 0
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {m.ringkasan_krs?.total_sks ?? 0} SKS
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          <ChevronRight className="w-4 h-4" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
