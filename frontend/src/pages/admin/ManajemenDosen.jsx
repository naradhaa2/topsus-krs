import { useState, useEffect, useCallback } from 'react'
import { Plus, Search } from 'lucide-react'
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

  const handleSearch = (value) => {
    setSearch(value)
    setPage(1)
  }

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
  const iCls = (key) => `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors[key] ? 'border-red-400' : 'border-slate-300'}`

  const columns = [
    { key: 'nidn',    label: 'NIDN' },
    { key: 'nama',    label: 'Nama' },
    { key: 'email',   label: 'Email' },
    { key: 'no_telp', label: 'No. Telp', render: (r) => r.no_telp || '–' },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <main className="md:ml-60 p-4 md:p-6 pt-16 md:pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Manajemen Dosen</h1>
            <p className="text-slate-500 text-sm mt-1">Total {total} dosen terdaftar</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors">
            <Plus className="w-4 h-4" /> Tambah Dosen
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Cari nama atau NIDN..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>

        <Table columns={columns} data={data} onEdit={openEdit} onDelete={handleDelete} isLoading={isLoading} emptyMessage="Tidak ada dosen ditemukan" />

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500">Halaman {page} dari {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50">Sebelumnya</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50">Selanjutnya</button>
            </div>
          </div>
        )}

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
          title={editData ? 'Edit Dosen' : 'Tambah Dosen'}
          onSubmit={handleSubmit} isLoading={isSaving}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
              <input className={iCls('nama')} value={form.nama} onChange={setF('nama')} placeholder="Nama lengkap dosen" />
              {formErrors.nama && <p className="text-red-500 text-xs mt-1">{formErrors.nama}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">NIDN</label>
              <input className={iCls('nidn')} value={form.nidn} onChange={setF('nidn')} placeholder="Nomor Induk Dosen Nasional" />
              {formErrors.nidn && <p className="text-red-500 text-xs mt-1">{formErrors.nidn}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" className={iCls('email')} value={form.email} onChange={setF('email')} placeholder="email@example.com" />
              {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password {editData && <span className="font-normal text-slate-400">(kosongkan jika tidak diubah)</span>}
              </label>
              <input type="password" className={iCls('password')} value={form.password} onChange={setF('password')} placeholder="••••••••" />
              {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">No. Telepon <span className="font-normal text-slate-400">(opsional)</span></label>
              <input className={iCls('no_telp')} value={form.no_telp} onChange={setF('no_telp')} placeholder="08xxxxxxxxxx" />
            </div>
          </div>
        </Modal>
      </main>
    </div>
  )
}
