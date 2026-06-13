import { useState, useEffect } from 'react'
import { Users, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar        from '../../components/Sidebar'
import LoadingSpinner from '../../components/LoadingSpinner'
import api            from '../../services/api'

export default function PemetaanPA() {
  const [dosenList,     setDosenList]     = useState([])
  const [mhsList,       setMhsList]       = useState([])
  const [selectedDosen, setSelectedDosen] = useState(null)
  const [selectedMhs,   setSelectedMhs]   = useState([])
  const [isLoading,     setIsLoading]     = useState(true)
  const [isAssigning,   setIsAssigning]   = useState(false)

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const [dosenRes, mhsRes] = await Promise.all([
        api.get('/api/admin/dosen',     { params: { per_page: 100 } }),
        api.get('/api/admin/mahasiswa', { params: { per_page: 100 } }),
      ])
      setDosenList(dosenRes.data.data.dosen   ?? [])
      setMhsList  (mhsRes.data.data.mahasiswa ?? [])
    } catch { toast.error('Gagal memuat data') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const toggleMhs = (id) =>
    setSelectedMhs((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const handleAssign = async () => {
    if (!selectedDosen)      { toast.error('Pilih dosen terlebih dahulu'); return }
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

  return (
    <div className="pc-container">
      <Sidebar />
      <main className="pc-content">
        <div className="page-header">
          <div>
            <h1>Pemetaan Dosen PA</h1>
            <p className="sub mb-0">Assign atau ubah dosen pembimbing akademik untuk mahasiswa</p>
          </div>
        </div>

        {isLoading ? <LoadingSpinner /> : (
          <div className="row g-4">
            {/* Panel dosen */}
            <div className="col-lg-6">
              <div className="card" style={{ border: 'none', borderRadius: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div className="card-header d-flex align-items-center gap-2" style={{ background: '#f8f9fa', borderBottom: '1px solid #e7eaee' }}>
                  <Users size={15} className="text-muted" />
                  <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Dosen ({dosenList.length})</span>
                  <small className="text-muted ms-1">— klik untuk memilih</small>
                </div>

                <div className="list-group list-group-flush" style={{ maxHeight: 340, overflowY: 'auto' }}>
                  {dosenList.map((d) => {
                    const count  = mhsList.filter((m) => m.dosen_pa_id === d.id).length
                    const active = selectedDosen?.id === d.id
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedDosen((prev) => prev?.id === d.id ? null : d)}
                        className="list-group-item list-group-item-action d-flex align-items-center justify-content-between"
                        style={{
                          borderLeft: active ? '3px solid var(--pc-primary)' : '3px solid transparent',
                          background: active ? 'rgba(70,128,255,0.06)' : '',
                          padding: '12px 16px',
                        }}
                      >
                        <div className="text-start">
                          <div className="fw-medium" style={{ fontSize: '0.875rem', color: '#1d2630' }}>{d.nama}</div>
                          <div style={{ fontSize: '0.75rem', color: '#5b6b79' }}>{d.nidn}</div>
                        </div>
                        <span className="badge badge-light-primary rounded-pill" style={{ fontSize: '0.75rem' }}>
                          {count} mhs
                        </span>
                      </button>
                    )
                  })}
                </div>

                {selectedDosen && selectedMhs.length > 0 && (
                  <div className="card-footer" style={{ borderTop: '1px solid #e7eaee', background: '#fff' }}>
                    <button
                      onClick={handleAssign}
                      disabled={isAssigning}
                      className="btn btn-primary w-100"
                      style={{ borderRadius: 8 }}
                    >
                      {isAssigning
                        ? <><span className="spinner-border spinner-border-sm me-2" />Menyimpan...</>
                        : `Assign ${selectedMhs.length} mhs → ${selectedDosen.nama}`}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Panel mahasiswa */}
            <div className="col-lg-6">
              <div className="card" style={{ border: 'none', borderRadius: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div className="card-header d-flex align-items-center gap-2" style={{ background: '#f8f9fa', borderBottom: '1px solid #e7eaee' }}>
                  <UserCheck size={15} className="text-muted" />
                  <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Mahasiswa ({mhsList.length})</span>
                  <small className="text-muted ms-1">
                    — {selectedDosen ? `centang untuk assign ke ${selectedDosen.nama}` : 'ubah PA via dropdown'}
                  </small>
                </div>

                <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                  {mhsList.map((m) => {
                    const hasPA      = !!m.dosen_pa_id
                    const isSelected = selectedMhs.includes(m.id)
                    return (
                      <div
                        key={m.id}
                        className="d-flex align-items-center gap-3 px-3 py-2"
                        style={{ borderBottom: '1px solid #f3f5f7' }}
                      >
                        {selectedDosen && (
                          <input
                            type="checkbox"
                            className="form-check-input flex-shrink-0"
                            checked={isSelected}
                            onChange={() => toggleMhs(m.id)}
                            style={{ accentColor: 'var(--pc-primary)', marginTop: 0 }}
                          />
                        )}
                        <div className="flex-grow-1 overflow-hidden">
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="fw-medium" style={{ fontSize: '0.875rem', color: '#1d2630' }}>{m.nama}</span>
                            <span
                              className={`badge rounded-pill ${hasPA ? 'badge-light-success' : 'badge-light-danger'}`}
                              style={{ fontSize: '0.7rem' }}
                            >
                              {hasPA ? 'Ada PA' : 'Belum'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#5b6b79' }}>{m.nim} · {m.jurusan}</div>
                        </div>
                        <select
                          value={m.dosen_pa_id ?? ''}
                          onChange={(e) => handleReassign(m.id, e.target.value)}
                          className="form-select form-select-sm flex-shrink-0"
                          style={{ borderRadius: 6, fontSize: '0.78rem', maxWidth: 150 }}
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
          </div>
        )}
      </main>
    </div>
  )
}
