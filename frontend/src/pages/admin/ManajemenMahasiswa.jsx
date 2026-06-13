import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Sidebar    from '../../components/Sidebar'
import Table      from '../../components/Table'
import Modal      from '../../components/Modal'
import api        from '../../services/api'

const JURUSAN   = ['Teknik Informatika', 'Sistem Informasi']
const INIT_FORM = { nama: '', nim: '', email: '', password: '', jurusan: 'Teknik Informatika', semester: 1 }

function validate(form, isEdit) {
  const e = {}
  if (!form.nama.trim())  e.nama  = 'Nama wajib diisi'
  if (!form.nim.trim())   e.nim   = 'NIM wajib diisi'
  if (!form.email.trim()) e.email = 'Email wajib diisi'
  else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Format email tidak valid'
  if (!isEdit && !form.password)   e.password = 'Password wajib diisi'
  if (form.password && form.password.length < 6) e.password = 'Password minimal 6 karakter'
  const sem = Number(form.semester)
  if (!sem || sem < 1 || sem > 14) e.semester = 'Semester 1–14'
  return e
}

export default function ManajemenMahasiswa() {
  const [data,       setData]       = useState([])
  const [dosenList,  setDosenList]  = useState([])
  const [isLoading,  setIsLoading]  = useState(true)
  const [search,     setSearch]     = useState('')
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total,      setTotal]      = useState(0)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editData,   setEditData]   = useState(null)
  const [form,       setForm]       = useState(INIT_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [isSaving,   setIsSaving]   = useState(false)

  const fetchDosen = () =>
    api.get('/api/admin/dosen', { params: { per_page: 100 } })
      .then((r) => setDosenList(r.data.data.dosen ?? []))
      .catch(() => {})

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = { page, per_page: 10 }
      if (search) params.search = search
      const r = await api.get('/api/admin/mahasiswa', { params })
      const { mahasiswa, total, pages } = r.data.data
      setData(mahasiswa ?? [])
      setTotal(total)
      setTotalPages(pages)
    } catch { toast.error('Gagal memuat data mahasiswa') }
    finally { setIsLoading(false) }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchDosen() }, [])

  const handleSearch = (value) => { setSearch(value); setPage(1) }

  const openCreate = () => { setEditData(null); setForm(INIT_FORM); setFormErrors({}); setModalOpen(true) }
  const openEdit   = (row) => {
    setEditData(row)
    setForm({ nama: row.nama, nim: row.nim, email: row.email, password: '', jurusan: row.jurusan, semester: row.semester })
    setFormErrors({}); setModalOpen(true)
  }

  const handleSubmit = async () => {
    const errs = validate(form, !!editData)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setIsSaving(true)
    try {
      const payload = { ...form, semester: Number(form.semester) }
      if (!payload.password) delete payload.password
      if (editData) {
        await api.put(`/api/admin/mahasiswa/${editData.id}`, payload)
        toast.success('Data mahasiswa berhasil diupdate')
      } else {
        await api.post('/api/admin/mahasiswa', payload)
        toast.success('Mahasiswa berhasil ditambahkan')
      }
      setModalOpen(false); fetchData()
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal menyimpan data') }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus mahasiswa "${row.nama}"? Tindakan ini tidak dapat dibatalkan.`)) return
    try {
      await api.delete(`/api/admin/mahasiswa/${row.id}`)
      toast.success('Mahasiswa berhasil dihapus'); fetchData()
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal menghapus mahasiswa') }
  }

  const setF  = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setFormErrors((er) => ({ ...er, [key]: '' })) }

  const columns = [
    { key: 'nim',     label: 'NIM' },
    { key: 'nama',    label: 'Nama' },
    { key: 'jurusan', label: 'Jurusan' },
    { key: 'semester', label: 'Semester', render: (r) => `Sem ${r.semester}` },
    { key: 'dosen_pa', label: 'Dosen PA', render: (r) => {
      if (!r.dosen_pa_id) return <span className="badge badge-light-danger">Belum ada</span>
      const d = dosenList.find((x) => x.id === r.dosen_pa_id)
      return <span className="text-muted">{d?.nama ?? '–'}</span>
    }},
  ]

  return (
    <div className="pc-container">
      <Sidebar />
      <main className="pc-content">
        <div className="page-header">
          <div>
            <h1>Manajemen Mahasiswa</h1>
            <p className="sub mb-0">Total {total} mahasiswa terdaftar</p>
          </div>
          <button onClick={openCreate} className="btn btn-primary">
            <i className="ti ti-plus me-1" />Tambah Mahasiswa
          </button>
        </div>

        {/* Search */}
        <div className="card mb-3">
          <div className="card-body py-2 px-3">
            <div className="search-input-wrap">
              <span className="s-icon"><i className="ti ti-search" /></span>
              <input
                type="text"
                className="form-control border-0 shadow-none"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Cari nama atau NIM..."
              />
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          data={data}
          onEdit={openEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
          emptyMessage="Tidak ada mahasiswa ditemukan"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex align-items-center justify-content-between mt-3">
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>Halaman {page} dari {totalPages}</span>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                style={{ borderRadius: 8 }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Sebelumnya
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                style={{ borderRadius: 8 }}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editData ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}
          onSubmit={handleSubmit}
          isLoading={isSaving}
        >
          <div className="mb-3">
            <label className="form-label fw-medium" style={{ fontSize: '0.875rem' }}>Nama Lengkap</label>
            <input className={`form-control${formErrors.nama ? ' is-invalid' : ''}`} value={form.nama} onChange={setF('nama')} placeholder="Nama lengkap mahasiswa" style={{ borderRadius: 8 }} />
            {formErrors.nama && <div className="invalid-feedback">{formErrors.nama}</div>}
          </div>
          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label fw-medium" style={{ fontSize: '0.875rem' }}>NIM</label>
              <input className={`form-control${formErrors.nim ? ' is-invalid' : ''}`} value={form.nim} onChange={setF('nim')} placeholder="NIM" style={{ borderRadius: 8 }} />
              {formErrors.nim && <div className="invalid-feedback">{formErrors.nim}</div>}
            </div>
            <div className="col-6">
              <label className="form-label fw-medium" style={{ fontSize: '0.875rem' }}>Semester</label>
              <input type="number" min="1" max="14" className={`form-control${formErrors.semester ? ' is-invalid' : ''}`} value={form.semester} onChange={setF('semester')} style={{ borderRadius: 8 }} />
              {formErrors.semester && <div className="invalid-feedback">{formErrors.semester}</div>}
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-medium" style={{ fontSize: '0.875rem' }}>Email</label>
            <input type="email" className={`form-control${formErrors.email ? ' is-invalid' : ''}`} value={form.email} onChange={setF('email')} placeholder="email@example.com" style={{ borderRadius: 8 }} />
            {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
          </div>
          <div className="mb-3">
            <label className="form-label fw-medium" style={{ fontSize: '0.875rem' }}>
              Password {editData && <span className="fw-normal text-muted">(kosongkan jika tidak diubah)</span>}
            </label>
            <input type="password" className={`form-control${formErrors.password ? ' is-invalid' : ''}`} value={form.password} onChange={setF('password')} placeholder="••••••••" style={{ borderRadius: 8 }} />
            {formErrors.password && <div className="invalid-feedback">{formErrors.password}</div>}
          </div>
          <div className="mb-1">
            <label className="form-label fw-medium" style={{ fontSize: '0.875rem' }}>Jurusan</label>
            <select className={`form-select${formErrors.jurusan ? ' is-invalid' : ''}`} value={form.jurusan} onChange={setF('jurusan')} style={{ borderRadius: 8 }}>
              {JURUSAN.map((j) => <option key={j}>{j}</option>)}
            </select>
          </div>
        </Modal>
      </main>
    </div>
  )
}
