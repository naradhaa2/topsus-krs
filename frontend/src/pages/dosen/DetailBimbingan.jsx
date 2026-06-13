import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar        from '../../components/Sidebar'
import LoadingSpinner from '../../components/LoadingSpinner'
import api            from '../../services/api'

function InfoItem({ label, value }) {
  return (
    <div className="p-3 rounded-3" style={{ background: '#f8f9fa', border: '1px solid #f0f1f3' }}>
      <div style={{ fontSize: '0.72rem', color: '#5b6b79', marginBottom: 2 }}>{label}</div>
      <div className="fw-semibold" style={{ fontSize: '0.875rem', color: '#1d2630' }}>{value}</div>
    </div>
  )
}

export default function DetailBimbingan() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [data,      setData]      = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/dosen/mahasiswa-bimbingan/${id}`)
      .then((r) => setData(r.data.data))
      .catch((err) => {
        toast.error(err.response?.data?.error || 'Gagal memuat detail mahasiswa')
        navigate('/dosen/bimbingan')
      })
      .finally(() => setIsLoading(false))
  }, [id])

  return (
    <div className="pc-container">
      <Sidebar />
      <main className="pc-content">
        <button
          onClick={() => navigate('/dosen/bimbingan')}
          className="btn btn-sm btn-light d-flex align-items-center gap-2 mb-4"
          style={{ borderRadius: 8, fontSize: '0.85rem', color: '#5b6b79' }}
        >
          <ArrowLeft size={15} /> Kembali ke Daftar Bimbingan
        </button>

        {isLoading ? <LoadingSpinner /> : data ? (
          <>
            {/* Card info mahasiswa */}
            <div className="card mb-4" style={{ border: 'none', borderRadius: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 52, height: 52, background: 'rgba(70,128,255,0.1)', borderRadius: '50%' }}
                  >
                    <User size={24} color="#4680ff" />
                  </div>
                  <div>
                    <h2 className="fw-bold mb-0" style={{ fontSize: '1.1rem', color: '#1d2630' }}>{data.nama}</h2>
                    <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>{data.nim} · {data.jurusan}</p>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-6 col-sm-3"><InfoItem label="Email"     value={data.email} /></div>
                  <div className="col-6 col-sm-3"><InfoItem label="Jurusan"   value={data.jurusan} /></div>
                  <div className="col-6 col-sm-3"><InfoItem label="Semester"  value={`Semester ${data.semester}`} /></div>
                  <div className="col-6 col-sm-3"><InfoItem label="Total SKS" value={`${data.krs?.total_sks ?? 0} SKS`} /></div>
                </div>
              </div>
            </div>

            {/* Tabel KRS */}
            <div className="card table-card">
              <div
                className="card-header d-flex align-items-center gap-2"
                style={{ background: '#f8f9fa', borderBottom: '1px solid #e7eaee' }}
              >
                <BookOpen size={15} color="#4680ff" />
                <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                  KRS — {data.krs?.jumlah_mk ?? 0} Mata Kuliah
                </span>
              </div>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Kode MK</th>
                      <th>Nama Mata Kuliah</th>
                      <th>SKS</th>
                      <th>Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.krs?.mata_kuliah ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-5 text-muted">
                          Mahasiswa belum memilih mata kuliah
                        </td>
                      </tr>
                    ) : (
                      data.krs.mata_kuliah.map((mk) => (
                        <tr key={mk.kode}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#5b6b79' }}>{mk.kode}</td>
                          <td style={{ color: '#1d2630' }}>{mk.nama}</td>
                          <td style={{ color: '#5b6b79' }}>{mk.sks} SKS</td>
                          <td>
                            {mk.nilai ? (
                              <span className="badge badge-light-success rounded-pill fw-bold" style={{ fontSize: '0.78rem' }}>
                                {mk.nilai}
                              </span>
                            ) : (
                              <span className="text-muted" style={{ fontSize: '0.82rem' }}>Belum ada</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8f9fa', borderTop: '2px solid #e7eaee' }}>
                      <td colSpan={2} className="fw-semibold" style={{ padding: '12px 16px', color: '#5b6b79' }}>Total</td>
                      <td className="fw-bold" style={{ padding: '12px 16px', color: '#4680ff' }}>{data.krs?.total_sks ?? 0} SKS</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
