import { useState, useEffect, useCallback } from 'react'
import { Plus, Search } from 'lucide-react'
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
      setData(mahasiswa)
      setTotal(total)
      setTotalPages(pages)
    } catch { toast.error('Gagal memuat data mahasiswa') }
    finally { setIsLoading(false) }
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchDosen() }, [])

  const handleSearch = (value) => {
    setSearch(value)
    setPage(1)
  }

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
  const iCls  = (key) => `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors[key] ? 'border-red-400' : 'border-slate-300'}`

  const columns = [
    { key: 'nim',     label: 'NIM' },
    { key: 'nama',    label: 'Nama' },
    { key: 'jurusan', label: 'Jurusan' },
    { key: 'semester', label: 'Semester', render: (r) => `Sem ${r.semester}` },
    { key: 'dosen_pa', label: 'Dosen PA', render: (r) => {
      if (!r.dosen_pa_id) return <span className="text-xs text-red-500 font-medium">Belum ada</span>
      const d = dosenList.find((x) => x.id === r.dosen_pa_id)
      return <span className="text-xs text-slate-600">{d?.nama ?? '–'}</span>
    }},
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <main className="md:ml-60 p-4 md:p-6 pt-16 md:pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Manajemen Mahasiswa</h1>
            <p className="text-slate-500 text-sm mt-1">Total {total} mahasiswa terdaftar</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors">
            <Plus className="w-4 h-4" /> Tambah Mahasiswa
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Cari nama atau NIM..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>

        <Table columns={columns} data={data} onEdit={openEdit} onDelete={handleDelete} isLoading={isLoading} emptyMessage="Tidak ada mahasiswa ditemukan" />

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
          title={editData ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}
          onSubmit={handleSubmit} isLoading={isSaving}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
              <input className={iCls('nama')} value={form.nama} onChange={setF('nama')} placeholder="Nama lengkap mahasiswa" />
              {formErrors.nama && <p className="text-red-500 text-xs mt-1">{formErrors.nama}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NIM</label>
                <input className={iCls('nim')} value={form.nim} onChange={setF('nim')} placeholder="NIM" />
                {formErrors.nim && <p className="text-red-500 text-xs mt-1">{formErrors.nim}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                <input type="number" min="1" max="14" className={iCls('semester')} value={form.semester} onChange={setF('semester')} />
                {formErrors.semester && <p className="text-red-500 text-xs mt-1">{formErrors.semester}</p>}
              </div>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Jurusan</label>
              <select className={iCls('jurusan')} value={form.jurusan} onChange={setF('jurusan')}>
                {JURUSAN.map((j) => <option key={j}>{j}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  )
}
