import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import Sidebar from '../../components/Sidebar'
import Table   from '../../components/Table'
import Modal   from '../../components/Modal'
import api     from '../../services/api'

const INIT_FORM = { nama: '', nidn: '', email: '', password: '', no_telp: '' }

function validate(form, isEdit) {
  const e = {}
  if (!form.nama.trim())  e.nama  = 'Nama wajib diisi'
  if (!form.nidn.trim())  e.nidn  = 'NIDN wajib diisi'
  if (!form.email.trim()) e.email = 'Email wajib diisi'
  else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Format email tidak valid'
  if (!isEdit && !form.password) e.password = 'Password wajib diisi'
  if (form.password && form.password.length < 6) e.password = 'Password minimal 6 karakter'
  return e
}

export default function ManajemenDosen() {
  const [data,       setData]       = useState([])
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

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = { page, per_page: 10 }
      if (search) params.search = search
      const r = await api.get('/api/admin/dosen', { params })
      const { dosen, total, pages } = r.data.data
      setData(dosen)
      setTotal(total)
      setTotalPages(pages)
    } catch { toast.error('Gagal memuat data dosen') }
    finally { setIsLoading(false) }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = (value) => { setSearch(value); setPage(1) }

  const openCreate = () => { setEditData(null); setForm(INIT_FORM); setFormErrors({}); setModalOpen(true) }
  const openEdit   = (row) => {
    setEditData(row)
    setForm({ nama: row.nama, nidn: row.nidn, email: row.email, password: '', no_telp: row.no_telp ?? '' })
    setFormErrors({}); setModalOpen(true)
  }

  const handleSubmit = async () => {
    const errs = validate(form, !!editData)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setIsSaving(true)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (editData) {
        await api.put(`/api/admin/dosen/${editData.id}`, payload)
        toast.success('Data dosen berhasil diupdate')
      } else {
        await api.post('/api/admin/dosen', payload)
        toast.success('Dosen berhasil ditambahkan')
      }
      setModalOpen(false); fetchData()
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal menyimpan data') }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus dosen "${row.nama}"?`)) return
    try {
      await api.delete(`/api/admin/dosen/${row.id}`)
      toast.success('Dosen berhasil dihapus'); fetchData()
    } catch (err) { toast.error(err.response?.data?.error || 'Gagal menghapus dosen') }
  }

  const setF = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setFormErrors((er) => ({ ...er, [key]: '' })) }

  const columns = [
    { key: 'nidn',    label: 'NIDN' },
    { key: 'nama',    label: 'Nama' },
    { key: 'email',   label: 'Email' },
    { key: 'no_telp', label: 'No. Telp', render: (r) => r.no_telp || '–' },
  ]

  return (
    <div className="pc-container">
      <Sidebar />
      <main className="pc-content">
        <div className="page-header">
          <div>
            <h1>Manajemen Dosen</h1>
            <p className="sub mb-0">Total {total} dosen terdaftar</p>
          </div>
          <button onClick={openCreate} className="btn btn-primary">
            <i className="ti ti-plus me-1" />Tambah Dosen
          </button>
        </div>

        <div className="card mb-3">
          <div className="card-body py-2 px-3">
            <div className="search-input-wrap">
              <span className="s-icon"><i className="ti ti-search" /></span>
              <input
                type="text"
                className="form-control border-0 shadow-none"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Cari nama atau NIDN..."
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
          emptyMessage="Tidak ada dosen ditemukan"
        />

        {totalPages > 1 && (
          <div className="d-flex align-items-center justify-content-between mt-3">
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>Halaman {page} dari {totalPages}</span>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Sebelumnya</button>
              <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Selanjutnya</button>
            </div>
          </div>
        )}

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editData ? 'Edit Dosen' : 'Tambah Dosen'}
          onSubmit={handleSubmit}
          isLoading={isSaving}
        >
          <div className="mb-3">
            <label className="form-label fw-medium" style={{ fontSize: '0.875rem' }}>Nama Lengkap</label>
            <input className={`form-control${formErrors.nama ? ' is-invalid' : ''}`} value={form.nama} onChange={setF('nama')} placeholder="Nama lengkap dosen" style={{ borderRadius: 8 }} />
            {formErrors.nama && <div className="invalid-feedback">{formErrors.nama}</div>}
          </div>
          <div className="mb-3">
            <label className="form-label fw-medium" style={{ fontSize: '0.875rem' }}>NIDN</label>
            <input className={`form-control${formErrors.nidn ? ' is-invalid' : ''}`} value={form.nidn} onChange={setF('nidn')} placeholder="Nomor Induk Dosen Nasional" style={{ borderRadius: 8 }} />
            {formErrors.nidn && <div className="invalid-feedback">{formErrors.nidn}</div>}
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
            <label className="form-label fw-medium" style={{ fontSize: '0.875rem' }}>No. Telepon <span className="fw-normal text-muted">(opsional)</span></label>
            <input className="form-control" value={form.no_telp} onChange={setF('no_telp')} placeholder="08xxxxxxxxxx" style={{ borderRadius: 8 }} />
          </div>
        </Modal>
      </main>
    </div>
  )
}
