import { useEffect, useState } from 'react'
import { CheckCircle2, Save, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar         from '../../components/Navbar'
import LoadingSpinner from '../../components/LoadingSpinner'
import api            from '../../services/api'

const MAX_SKS = 24

export default function KRS() {
  const [availableMK, setAvailableMK] = useState([])
  const [selectedKrs, setSelectedKrs] = useState([])
  const [profile,     setProfile]     = useState(null)
  const [isLoading,   setIsLoading]   = useState(true)
  const [isSaving,    setIsSaving]    = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/api/mahasiswa/mata-kuliah-tersedia'),
      api.get('/api/mahasiswa/krs'),
      api.get('/api/mahasiswa/profile'),
    ])
      .then(([mkRes, krsRes, profileRes]) => {
        setAvailableMK(mkRes.data.data)
        setSelectedKrs(krsRes.data.data.mata_kuliah ?? [])
        setProfile(profileRes.data.data)
      })
      .catch(() => toast.error('Gagal memuat data KRS'))
      .finally(() => setIsLoading(false))
  }, [])

  const selectedKode = new Set(selectedKrs.map((mk) => mk.kode))

  const totalSKS = availableMK
    .filter((mk) => selectedKode.has(mk.kode))
    .reduce((s, mk) => s + mk.sks, 0)

  const toggleMK = (mk) => {
    if (selectedKode.has(mk.kode)) {
      setSelectedKrs((prev) => prev.filter((m) => m.kode !== mk.kode))
    } else {
      if (totalSKS + mk.sks > MAX_SKS) {
        toast.error(`Total SKS akan menjadi ${totalSKS + mk.sks} — melebihi batas ${MAX_SKS} SKS`)
        return
      }
      setSelectedKrs((prev) => [...prev, { kode: mk.kode, nama: mk.nama, sks: mk.sks, nilai: null }])
    }
  }

  const handleSave = async () => {
    if (!window.confirm('Simpan KRS yang dipilih?')) return
    setIsSaving(true)
    try {
      await api.put('/api/mahasiswa/krs', { mata_kuliah: selectedKrs })
      toast.success('KRS berhasil disimpan!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan KRS')
    } finally {
      setIsSaving(false)
    }
  }

  const pct      = Math.min(100, Math.round((totalSKS / MAX_SKS) * 100))
  const barColor = totalSKS >= MAX_SKS ? 'bg-red-500' : totalSKS >= 20 ? 'bg-amber-500' : 'bg-blue-600'

  if (isLoading) return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-6xl mx-auto p-6"><LoadingSpinner /></main>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Kartu Rencana Studi</h1>
          {profile && (
            <p className="text-slate-500 text-sm mt-1">
              {profile.nama} · {profile.nim} · {profile.jurusan} · Semester {profile.semester}
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Grid MK */}
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-3">Pilih mata kuliah yang akan diambil semester ini:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {availableMK.map((mk) => {
                const isSelected = selectedKode.has(mk.kode)
                const existing   = selectedKrs.find((m) => m.kode === mk.kode)
                return (
                  <div
                    key={mk.kode}
                    onClick={() => toggleMK(mk)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'border-blue-700 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-slate-400 mb-0.5">{mk.kode}</p>
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{mk.nama}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-700 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {mk.sks} SKS
                      </span>
                      {existing?.nilai && (
                        <span className="text-xs font-bold text-emerald-600">Nilai: {existing.nilai}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ringkasan SKS */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-4">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" /> Ringkasan KRS
              </h2>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 font-medium">Total SKS</span>
                  <span className={`font-bold ${totalSKS >= MAX_SKS ? 'text-red-600' : 'text-slate-800'}`}>
                    {totalSKS} / {MAX_SKS}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className={`h-3 rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                {totalSKS >= MAX_SKS && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">Batas SKS maksimal tercapai!</p>
                )}
              </div>

              {/* List MK terpilih */}
              <div className="space-y-1.5 mb-5 max-h-60 overflow-y-auto">
                {selectedKrs.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">Belum ada MK dipilih</p>
                ) : (
                  selectedKrs.map((mk) => (
                    <div key={mk.kode} className="flex items-center justify-between text-sm py-1 border-b border-slate-50">
                      <span className="text-slate-700 flex-1 mr-2 truncate">{mk.nama}</span>
                      <span className="text-slate-400 flex-shrink-0 text-xs">{mk.sks} SKS</span>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Jumlah MK</span>
                  <span className="font-semibold text-slate-800">{selectedKrs.length} mata kuliah</span>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving || selectedKrs.length === 0}
                  className="w-full py-2.5 bg-blue-700 text-white rounded-xl text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isSaving ? 'Menyimpan...' : <><Save className="w-4 h-4" /> Simpan KRS</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
