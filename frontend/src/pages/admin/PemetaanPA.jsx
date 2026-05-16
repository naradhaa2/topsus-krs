import { useState, useEffect } from 'react'
import { Users, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar      from '../../components/Sidebar'
import LoadingSpinner from '../../components/LoadingSpinner'
import api          from '../../services/api'

export default function PemetaanPA() {
  const [dosenList,    setDosenList]    = useState([])
  const [mhsList,      setMhsList]      = useState([])
  const [selectedDosen, setSelectedDosen] = useState(null)
  const [selectedMhs,  setSelectedMhs]  = useState([])
  const [isLoading,    setIsLoading]    = useState(true)
  const [isAssigning,  setIsAssigning]  = useState(false)

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const [dosenRes, mhsRes] = await Promise.all([
        api.get('/api/admin/dosen',     { params: { per_page: 100 } }),
        api.get('/api/admin/mahasiswa', { params: { per_page: 100 } }),
      ])
      setDosenList(dosenRes.data.data.dosen    ?? [])
      setMhsList  (mhsRes.data.data.mahasiswa  ?? [])
    } catch { toast.error('Gagal memuat data') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const toggleMhs = (id) =>
    setSelectedMhs((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const handleAssign = async () => {
    if (!selectedDosen) { toast.error('Pilih dosen terlebih dahulu'); return }
    if (!selectedMhs.length) { toast.error('Pilih minimal satu mahasiswa'); return }
    setIsAssigning(true)
    try {
      await Promise.all(
        selectedMhs.map((id) => api.put(`/api/admin/mahasiswa/${id}/dosen-pa`, { dosen_id: selectedDosen.id }))
      )
      toast.success(`${selectedMhs.length} mahasiswa berhasil di-assign ke ${selectedDosen.nama}`)
      setSelectedMhs([])
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal melakukan assign') }
    finally { setIsAssigning(false) }
  }

  const handleReassign = async (mhsId, dosenId) => {
    if (!dosenId) return
    try {
      await api.put(`/api/admin/mahasiswa/${mhsId}/dosen-pa`, { dosen_id: dosenId })
      toast.success('Dosen PA berhasil diubah')
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal mengubah dosen PA') }
  }

  if (isLoading) return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <main className="md:ml-60 pt-16 md:pt-6 flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </main>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <main className="md:ml-60 p-4 md:p-6 pt-16 md:pt-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Pemetaan Dosen PA</h1>
        <p className="text-slate-500 text-sm mb-6">Assign atau ubah dosen pembimbing akademik untuk mahasiswa</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel dosen */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4" /> Dosen ({dosenList.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Klik untuk memilih, lalu assign mahasiswa</p>
            </div>

            <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-80">
              {dosenList.map((d) => {
                const count  = mhsList.filter((m) => m.dosen_pa_id === d.id).length
                const active = selectedDosen?.id === d.id
                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDosen((prev) => prev?.id === d.id ? null : d)}
                    className={`p-4 cursor-pointer flex items-center justify-between transition-colors ${
                      active ? 'bg-blue-50 border-l-4 border-blue-700' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{d.nama}</p>
                      <p className="text-xs text-slate-400">{d.nidn}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
                      {count} mhs
                    </span>
                  </div>
                )
              })}
            </div>

            {selectedDosen && selectedMhs.length > 0 && (
              <div className="p-4 border-t border-slate-200">
                <button
                  onClick={handleAssign}
                  disabled={isAssigning}
                  className="w-full py-2 bg-blue-700 text-white rounded-xl text-sm font-medium hover:bg-blue-800 disabled:opacity-60 transition-colors"
                >
                  {isAssigning
                    ? 'Menyimpan...'
                    : `Assign ${selectedMhs.length} mhs → ${selectedDosen.nama}`}
                </button>
              </div>
            )}
          </div>

          {/* Panel mahasiswa */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Mahasiswa ({mhsList.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedDosen ? `Centang untuk assign ke ${selectedDosen.nama}` : 'Ubah PA langsung via dropdown'}
              </p>
            </div>

            <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-96">
              {mhsList.map((m) => {
                const hasPA    = !!m.dosen_pa_id
                const isSelected = selectedMhs.includes(m.id)
                return (
                  <div key={m.id} className="p-3 flex items-center gap-3">
                    {selectedDosen && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMhs(m.id)}
                        className="w-4 h-4 accent-blue-700 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800 truncate">{m.nama}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          hasPA ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {hasPA ? 'Ada PA' : 'Belum'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{m.nim} · {m.jurusan}</p>
                    </div>
                    <select
                      value={m.dosen_pa_id ?? ''}
                      onChange={(e) => handleReassign(m.id, e.target.value)}
                      className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-shrink-0 max-w-36"
                    >
                      <option value="">-- Pilih PA --</option>
                      {dosenList.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
