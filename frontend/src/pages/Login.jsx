import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, BookOpen, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const ROLES = ['mahasiswa', 'dosen', 'admin']
const ROLE_HOME = {
  admin:     '/admin/dashboard',
  mahasiswa: '/mahasiswa/profile',
  dosen:     '/dosen/profile',
}

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [role, setRole]       = useState('mahasiswa')
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email wajib diisi'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Format email tidak valid'
    if (!form.password) e.password = 'Password wajib diisi'
    else if (form.password.length < 6) e.password = 'Password minimal 6 karakter'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setIsLoading(true)
    try {
      const user = await login(form.email, form.password, role)
      toast.success(`Selamat datang, ${user.nama || 'Admin'}!`)
      navigate(ROLE_HOME[role])
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login gagal. Periksa email dan password.')
    } finally {
      setIsLoading(false)
    }
  }

  const setF = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((er) => ({ ...er, [key]: '' }))
  }

  const inputCls = (key) =>
    `w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      errors[key] ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
    }`

  return (
    <div className="min-h-screen flex">
      {/* Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-800 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-sm text-center">
          <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
            <BookOpen className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Sistem KRS</h1>
          <p className="text-blue-200 text-lg leading-relaxed">
            Kelola Kartu Rencana Studi dengan mudah, cepat, dan terintegrasi.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-3">
            {['Admin', 'Mahasiswa', 'Dosen'].map((r) => (
              <div key={r} className="bg-blue-700/60 rounded-xl py-3 px-4 text-sm font-semibold">
                {r}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Sistem KRS</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Masuk ke Akun</h2>
            <p className="text-slate-500 text-sm mb-6">Pilih role dan masukkan kredensial Anda</p>

            {/* Role tabs */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-6 gap-1">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); setErrors({}) }}
                  className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    role === r ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={setF('email')}
                  placeholder="nama@example.com"
                  className={inputCls('email')}
                  autoComplete="email"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={setF('password')}
                    placeholder="••••••••"
                    className={`${inputCls('password')} pr-10`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-700 text-white rounded-xl font-medium text-sm hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Masuk...</> : 'Masuk'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
