import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Layout         from '../../components/Layout'
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
  const barColor = totalSKS >= MAX_SKS ? 'bg-danger' : totalSKS >= 20 ? 'bg-warning' : 'bg-primary'

  if (isLoading) return (
    <Layout><div className="container-xl py-4"><LoadingSpinner /></div></Layout>
  )

  return (
    <Layout>
      <div className="container-xl py-4">
        <div className="mb-4">
          <h5 className="fw-bold mb-1">Kartu Rencana Studi</h5>
          {profile && (
            <p className="text-muted mb-0">
              {profile.nama} · {profile.nim} · {profile.jurusan} · Semester {profile.semester}
            </p>
          )}
        </div>

        <div className="row g-4">
          {/* Grid MK */}
          <div className="col-lg-8">
            <p className="text-muted mb-3 fw-medium">Pilih mata kuliah yang akan diambil semester ini:</p>
            <div className="row g-3">
              {availableMK.map((mk) => {
                const isSelected = selectedKode.has(mk.kode)
                const existing   = selectedKrs.find((m) => m.kode === mk.kode)
                return (
                  <div key={mk.kode} className="col-sm-6 col-xl-4">
                    <div onClick={() => toggleMK(mk)} className={`mk-card card h-100${isSelected ? ' selected' : ''}`}>
                      <div className="card-body p-3">
                        <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                          <div className="overflow-hidden">
                            <div className="text-muted mb-1" style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>{mk.kode}</div>
                            <div className="fw-semibold lh-sm">{mk.nama}</div>
                          </div>
                          {isSelected && <i className="ti ti-circle-check text-primary flex-shrink-0 f-20" />}
                        </div>
                        <div className="d-flex align-items-center justify-content-between">
                          <span className={`badge rounded-pill fw-semibold ${isSelected ? 'badge-light-primary' : 'bg-light text-muted'}`}>
                            {mk.sks} SKS
                          </span>
                          {existing?.nilai && (
                            <span className="fw-bold text-success" style={{ fontSize: '0.75rem' }}>
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
            <div className="card sticky-top" style={{ top: 72 }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <i className="ti ti-book text-primary" />
                  <span className="fw-semibold">Ringkasan KRS</span>
                </div>

                {/* SKS progress */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted fw-medium">Total SKS</span>
                    <span className={`fw-bold ${totalSKS >= MAX_SKS ? 'text-danger' : ''}`}>
                      {totalSKS} / {MAX_SKS}
                    </span>
                  </div>
                  <div className="progress" style={{ height: 10 }}>
                    <div className={`progress-bar ${barColor}`} style={{ width: `${pct}%`, transition: 'width 0.3s' }} />
                  </div>
                  {totalSKS >= MAX_SKS && (
                    <div className="text-danger mt-1 fw-medium" style={{ fontSize: '0.75rem' }}>
                      Batas SKS maksimal tercapai!
                    </div>
                  )}
                </div>

                {/* List MK terpilih */}
                <div style={{ maxHeight: 220, overflowY: 'auto' }} className="mb-4">
                  {selectedKrs.length === 0 ? (
                    <p className="text-center text-muted py-4">Belum ada MK dipilih</p>
                  ) : selectedKrs.map((mk) => (
                    <div
                      key={mk.kode}
                      className="d-flex align-items-center justify-content-between py-2"
                      style={{ borderBottom: '1px solid var(--bs-border-color)' }}
                    >
                      <span className="text-truncate me-2">{mk.nama}</span>
                      <span className="flex-shrink-0 text-muted" style={{ fontSize: '0.78rem' }}>{mk.sks} SKS</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--bs-border-color)', paddingTop: 16 }}>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted">Jumlah MK</span>
                    <span className="fw-semibold">{selectedKrs.length} mata kuliah</span>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || selectedKrs.length === 0}
                    className="btn btn-primary w-100"
                  >
                    {isSaving ? (
                      <><span className="spinner-border spinner-border-sm me-2" />Menyimpan...</>
                    ) : (
                      <><i className="ti ti-device-floppy me-1" />Simpan KRS</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
