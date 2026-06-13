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
        setAvailableMK(mkRes.data.data ?? [])
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

  const pct = Math.min(100, Math.round((totalSKS / MAX_SKS) * 100))
  const barColor = totalSKS >= MAX_SKS ? '#dc2626' : totalSKS >= 20 ? '#e58a00' : '#4680ff'

  if (isLoading) return (
    <div className="mhs-container" style={{ background: '#f3f5f7' }}>
      <Navbar />
      <div className="container-xl py-4"><LoadingSpinner /></div>
    </div>
  )

  return (
    <div className="mhs-container" style={{ background: '#f3f5f7' }}>
      <Navbar />
      <div className="container-xl py-4">
        <div className="mb-4">
          <h1 className="fw-bold mb-1" style={{ fontSize: '1.3rem', color: '#1d2630' }}>Kartu Rencana Studi</h1>
          {profile && (
            <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
              {profile.nama} · {profile.nim} · {profile.jurusan} · Semester {profile.semester}
            </p>
          )}
        </div>

        <div className="row g-4">
          {/* Grid MK */}
          <div className="col-lg-8">
            <p className="text-muted mb-3" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
              Pilih mata kuliah yang akan diambil semester ini:
            </p>
            <div className="row g-3">
              {availableMK.map((mk) => {
                const isSelected = selectedKode.has(mk.kode)
                const existing   = selectedKrs.find((m) => m.kode === mk.kode)
                return (
                  <div key={mk.kode} className="col-sm-6 col-xl-4">
                    <div
                      onClick={() => toggleMK(mk)}
                      className="card h-100"
                      style={{
                        border: isSelected ? '2px solid var(--pc-primary)' : '2px solid #e7eaee',
                        borderRadius: 12,
                        boxShadow: isSelected ? '0 2px 8px rgba(70,128,255,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        userSelect: 'none',
                        background: isSelected ? 'rgba(70,128,255,0.04)' : '#fff',
                      }}
                    >
                      <div className="card-body p-3">
                        <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                          <div className="overflow-hidden">
                            <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#8996a4', marginBottom: 2 }}>{mk.kode}</div>
                            <div className="fw-semibold lh-sm" style={{ fontSize: '0.875rem', color: '#1d2630' }}>{mk.nama}</div>
                          </div>
                          {isSelected && <CheckCircle2 size={18} color="#4680ff" className="flex-shrink-0" />}
                        </div>
                        <div className="d-flex align-items-center justify-content-between">
                          <span
                            className={`badge rounded-pill fw-semibold ${isSelected ? 'badge-light-primary' : ''}`}
                            style={!isSelected ? { background: '#f3f5f7', color: '#5b6b79', fontSize: '0.75rem' } : { fontSize: '0.75rem' }}
                          >
                            {mk.sks} SKS
                          </span>
                          {existing?.nilai && (
                            <span className="fw-bold" style={{ fontSize: '0.75rem', color: '#2ca87f' }}>
                              Nilai: {existing.nilai}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ringkasan SKS */}
          <div className="col-lg-4">
            <div className="card sticky-top" style={{ border: 'none', borderRadius: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', top: 80 }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <BookOpen size={15} color="#4680ff" />
                  <span className="fw-semibold" style={{ fontSize: '0.95rem', color: '#1d2630' }}>Ringkasan KRS</span>
                </div>

                {/* SKS progress */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2" style={{ fontSize: '0.875rem' }}>
                    <span className="fw-medium" style={{ color: '#5b6b79' }}>Total SKS</span>
                    <span className="fw-bold" style={{ color: totalSKS >= MAX_SKS ? '#dc2626' : '#1d2630' }}>
                      {totalSKS} / {MAX_SKS}
                    </span>
                  </div>
                  <div className="progress" style={{ height: 10 }}>
                    <div
                      className="progress-bar"
                      style={{ width: `${pct}%`, background: barColor, borderRadius: '50rem', transition: 'width 0.3s' }}
                    />
                  </div>
                  {totalSKS >= MAX_SKS && (
                    <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 6, fontWeight: 500 }}>
                      Batas SKS maksimal tercapai!
                    </div>
                  )}
                </div>

                {/* List MK terpilih */}
                <div style={{ maxHeight: 220, overflowY: 'auto' }} className="mb-4">
                  {selectedKrs.length === 0 ? (
                    <p className="text-center text-muted py-4" style={{ fontSize: '0.85rem' }}>Belum ada MK dipilih</p>
                  ) : selectedKrs.map((mk) => (
                    <div
                      key={mk.kode}
                      className="d-flex align-items-center justify-content-between py-2"
                      style={{ borderBottom: '1px solid #f3f5f7', fontSize: '0.85rem' }}
                    >
                      <span className="text-truncate me-2" style={{ color: '#1d2630' }}>{mk.nama}</span>
                      <span className="flex-shrink-0 text-muted" style={{ fontSize: '0.78rem' }}>{mk.sks} SKS</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid #e7eaee', paddingTop: 16 }}>
                  <div className="d-flex justify-content-between mb-3" style={{ fontSize: '0.875rem' }}>
                    <span className="text-muted">Jumlah MK</span>
                    <span className="fw-semibold" style={{ color: '#1d2630' }}>{selectedKrs.length} mata kuliah</span>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || selectedKrs.length === 0}
                    className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{ borderRadius: 10 }}
                  >
                    {isSaving ? (
                      <><span className="spinner-border spinner-border-sm" />Menyimpan...</>
                    ) : (
                      <><Save size={15} />Simpan KRS</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
