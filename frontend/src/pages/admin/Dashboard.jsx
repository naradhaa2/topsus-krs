import { useState, useEffect } from 'react'
import { GraduationCap, Users, BookOpen, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar from '../../components/Sidebar'
import StatCard from '../../components/StatCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../services/api'

export default function Dashboard() {
  const [stats, setStats]     = useState(null)
  const [dosenDist, setDosenDist] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/dashboard'),
      api.get('/api/admin/dosen', { params: { per_page: 100 } }),
      api.get('/api/admin/mahasiswa', { params: { per_page: 100 } }),
    ])
      .then(([dashRes, dosenRes, mhsRes]) => {
        setStats(dashRes.data.data)
        const dosenList = dosenRes.data.data.dosen ?? []
        const mhsList   = mhsRes.data.data.mahasiswa ?? []
        setDosenDist(
          dosenList.map((d) => ({
            nama:  d.nama,
            nidn:  d.nidn,
            total: mhsList.filter((m) => m.dosen_pa_id === d.id).length,
          })).sort((a, b) => b.total - a.total)
        )
      })
      .catch(() => toast.error('Gagal memuat data dashboard'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <main className="md:ml-60 p-4 md:p-6 pt-16 md:pt-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

        {isLoading ? <LoadingSpinner /> : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <StatCard title="Total Mahasiswa" value={stats?.total_mahasiswa ?? 0}    icon={GraduationCap} color="blue" />
              <StatCard title="Total Dosen"     value={stats?.total_dosen ?? 0}        icon={Users}         color="emerald" />
              <StatCard title="Rata-rata SKS"   value={stats?.rata_rata_sks ?? 0}      icon={BookOpen}      color="amber" subtitle="per mahasiswa" />
              <StatCard title="Jumlah Jurusan"  value={stats?.distribusi_jurusan?.length ?? 0} icon={BarChart2} color="rose" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribusi per jurusan */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-800 mb-5">Mahasiswa per Jurusan</h2>
                <div className="space-y-4">
                  {stats?.distribusi_jurusan?.map((item) => {
                    const pct = stats.total_mahasiswa > 0
                      ? Math.round((item.total / stats.total_mahasiswa) * 100)
                      : 0
                    return (
                      <div key={item.jurusan}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-700 font-medium">{item.jurusan}</span>
                          <span className="text-slate-500">{item.total} mhs ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Distribusi per dosen PA */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200">
                  <h2 className="font-semibold text-slate-800">Mahasiswa per Dosen PA</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Dosen</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">NIDN</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Jumlah Bimbingan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dosenDist.map((d, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-800">{d.nama}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{d.nidn}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${d.total > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                              {d.total} mahasiswa
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
