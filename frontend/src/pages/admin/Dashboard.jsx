import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import Sidebar     from '../../components/Sidebar'
import PageHeader  from '../../components/PageHeader'
import StatCard    from '../../components/StatCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../services/api'

const CHART_COLORS = ['#4680ff', '#2ca87f', '#e58a00', '#dc2626', '#3ec9d6', '#673ab7']

export default function Dashboard() {
  const [stats,    setStats]    = useState(null)
  const [dosenDist, setDosenDist] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/dashboard'),
      api.get('/api/admin/dosen',     { params: { per_page: 100 } }),
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

  if (isLoading) {
    return (
      <div className="pc-container">
        <Sidebar />
        <div className="pc-content pt-5"><LoadingSpinner /></div>
      </div>
    )
  }

  const chartData = stats?.distribusi_jurusan?.map((item) => ({
    name:  item.jurusan,
    total: item.total,
  })) ?? []

  return (
    <div className="pc-container">
      <Sidebar />
      <div className="pc-content">
        <PageHeader title="Dashboard" subtitle="Ringkasan data Sistem KRS" />

        {/* Stat cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-xl-3">
            <StatCard title="Total Mahasiswa" value={stats?.total_mahasiswa ?? 0}            tablerIcon="ti ti-user-graduate" color="blue" />
          </div>
          <div className="col-6 col-xl-3">
            <StatCard title="Total Dosen"     value={stats?.total_dosen ?? 0}                tablerIcon="ti ti-users"         color="emerald" />
          </div>
          <div className="col-6 col-xl-3">
            <StatCard title="Rata-rata SKS"   value={stats?.rata_rata_sks ?? 0}              tablerIcon="ti ti-book"          color="amber" subtitle="per mahasiswa" />
          </div>
          <div className="col-6 col-xl-3">
            <StatCard title="Jumlah Jurusan"  value={stats?.distribusi_jurusan?.length ?? 0} tablerIcon="ti ti-chart-bar"     color="rose" />
          </div>
        </div>

        <div className="row g-4">
          {/* Bar chart — distribusi per jurusan */}
          <div className="col-lg-6">
            <div className="card chart-card h-100">
              <div className="card-header">Mahasiswa per Jurusan</div>
              <div className="card-body">
                {chartData.length === 0 ? (
                  <p className="text-muted text-center py-4">Belum ada data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7eaee" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5b6b79' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#5b6b79' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e7eaee', fontSize: 13 }}
                        formatter={(v) => [v, 'Mahasiswa']}
                      />
                      <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {/* Progress bar detail */}
                <div className="mt-3">
                  {stats?.distribusi_jurusan?.map((item) => {
                    const pct = stats.total_mahasiswa > 0
                      ? Math.round((item.total / stats.total_mahasiswa) * 100)
                      : 0
                    return (
                      <div key={item.jurusan} className="mb-3">
                        <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.825rem' }}>
                          <span className="fw-medium" style={{ color: '#1d2630' }}>{item.jurusan}</span>
                          <span className="text-muted">{item.total} mhs ({pct}%)</span>
                        </div>
                        <div className="progress">
                          <div
                            className="progress-bar"
                            style={{ width: `${pct}%`, background: 'var(--pc-primary)', borderRadius: '50rem' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Table — distribusi per dosen PA */}
          <div className="col-lg-6">
            <div className="card chart-card h-100">
              <div className="card-header">Mahasiswa per Dosen PA</div>
              <div className="table-responsive">
                <table className="table table-hover mb-0" style={{ fontSize: '0.875rem' }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#f8f9fa', color: '#5b6b79', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 16px', borderBottom: '1px solid #e7eaee' }}>Dosen</th>
                      <th style={{ background: '#f8f9fa', color: '#5b6b79', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 16px', borderBottom: '1px solid #e7eaee' }}>NIDN</th>
                      <th style={{ background: '#f8f9fa', color: '#5b6b79', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 16px', borderBottom: '1px solid #e7eaee' }}>Bimbingan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dosenDist.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-4 text-muted">Belum ada data</td></tr>
                    ) : dosenDist.map((d, i) => (
                      <tr key={i}>
                        <td className="fw-medium" style={{ padding: '12px 16px', color: '#1d2630' }}>{d.nama}</td>
                        <td style={{ padding: '12px 16px', color: '#5b6b79', fontSize: '0.8rem' }}>{d.nidn}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            className={`badge rounded-pill fw-semibold ${d.total > 0 ? 'badge-light-primary' : 'badge-light-warning'}`}
                            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                          >
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
        </div>
      </div>
    </div>
  )
}
