import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout'
import PageHeader     from '../../components/PageHeader'
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
    <Layout>
        <PageHeader title="Mahasiswa Bimbingan" subtitle={`Total ${data.length} mahasiswa — klik baris untuk detail KRS`} />

        {/* Search */}
        <div className="card mb-3">
          <div className="card-body py-2 px-3">
            <div className="search-input-wrap">
              <span className="s-icon"><i className="ti ti-search" /></span>
              <input
                type="text"
                className="form-control border-0 shadow-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau NIM..."
              />
            </div>
          </div>
        </div>

        {isLoading ? <LoadingSpinner /> : (
          <div className="card table-card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    {['NIM', 'Nama', 'Jurusan', 'Semester', 'Jumlah MK', 'Total SKS', ''].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        {search ? 'Tidak ada mahasiswa yang cocok' : 'Belum ada mahasiswa bimbingan'}
                      </td>
                    </tr>
                  ) : filtered.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => navigate(`/dosen/bimbingan/${m.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#5b6b79' }}>{m.nim}</td>
                      <td className="fw-medium" style={{ color: '#1d2630' }}>{m.nama}</td>
                      <td style={{ fontSize: '0.82rem', color: '#5b6b79' }}>{m.jurusan}</td>
                      <td style={{ color: '#5b6b79' }}>Sem {m.semester}</td>
                      <td style={{ color: '#5b6b79' }}>{m.ringkasan_krs?.jumlah_mk ?? 0} MK</td>
                      <td>
                        <span
                          className={`badge rounded-pill fw-semibold ${
                            (m.ringkasan_krs?.total_sks ?? 0) > 0 ? 'badge-light-primary' : ''
                          }`}
                          style={(m.ringkasan_krs?.total_sks ?? 0) === 0 ? { background: '#f3f5f7', color: '#5b6b79', fontSize: '0.75rem' } : { fontSize: '0.75rem' }}
                        >
                          {m.ringkasan_krs?.total_sks ?? 0} SKS
                        </span>
                      </td>
                      <td className="text-muted"><i className="ti ti-chevron-right" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </Layout>
  )
}
