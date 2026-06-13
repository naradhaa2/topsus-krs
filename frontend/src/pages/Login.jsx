import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const ROLES = ['mahasiswa', 'dosen', 'admin']
const ROLE_HOME = {
  admin:     '/admin/dashboard',
  mahasiswa: '/mahasiswa/profile',
  dosen:     '/dosen/profile',
}

export default function Login() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [role, setRole]         = useState('mahasiswa')
  const [form, setForm]         = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors]     = useState({})

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

  return (
    <div className="auth-wrapper">
      {/* Left branding panel */}
      <div className="auth-side">
        <div className="text-center" style={{ maxWidth: 340 }}>
          <div
            className="d-flex align-items-center justify-content-center mx-auto mb-4"
            style={{ width: 88, height: 88, background: 'var(--pc-primary)', borderRadius: 20, boxShadow: '0 8px 24px rgba(70,128,255,0.4)' }}
          >
            <BookOpen size={44} color="#fff" />
          </div>
          <h1 className="fw-bold mb-3" style={{ fontSize: '2.2rem' }}>Sistem KRS</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
            Kelola Kartu Rencana Studi dengan mudah, cepat, dan terintegrasi.
          </p>
          <div className="d-flex gap-2 justify-content-center mt-5">
            {['Admin', 'Mahasiswa', 'Dosen'].map((r) => (
              <div
                key={r}
                className="px-3 py-2 rounded-3 fw-semibold"
                style={{ background: 'rgba(255,255,255,0.1)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}
              >
                {r}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-side">
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Mobile logo */}
          <div className="text-center mb-4 d-lg-none">
            <div
              className="d-flex align-items-center justify-content-center mx-auto mb-3"
              style={{ width: 60, height: 60, background: 'var(--pc-sidebar-bg)', borderRadius: 14 }}
            >
              <BookOpen size={28} color="#fff" />
            </div>
            <h2 className="fw-bold" style={{ color: '#1d2630' }}>Sistem KRS</h2>
          </div>

          <div className="card auth-card">
            <div className="card-body p-4">
              <h4 className="fw-bold mb-1" style={{ color: '#1d2630' }}>Masuk ke Akun</h4>
              <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>Pilih role dan masukkan kredensial Anda</p>

              {/* Role tabs */}
              <div className="role-tabs mb-4">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRole(r); setErrors({}) }}
                    className={`role-tab${role === r ? ' active' : ''}`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {/* Email */}
                <div className="mb-3">
                  <label className="form-label fw-medium" style={{ fontSize: '0.875rem' }}>Email</label>
                  <input
                    type="email"
                    className={`form-control${errors.email ? ' is-invalid' : ''}`}
                    value={form.email}
                    onChange={setF('email')}
                    placeholder="nama@example.com"
                    autoComplete="email"
                    style={{ borderRadius: 10 }}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                {/* Password */}
                <div className="mb-4">
                  <label className="form-label fw-medium" style={{ fontSize: '0.875rem' }}>Password</label>
                  <div className="input-group">
                    <input
                      type={showPass ? 'text' : 'password'}
                      className={`form-control${errors.password ? ' is-invalid' : ''}`}
                      value={form.password}
                      onChange={setF('password')}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      style={{ borderRadius: '10px 0 0 10px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      style={{ borderRadius: '0 10px 10px 0' }}
                      onClick={() => setShowPass((v) => !v)}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                  </div>
                </div>

                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary fw-semibold"
                    disabled={isLoading}
                    style={{ borderRadius: 10, padding: '10px' }}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Masuk...
                      </>
                    ) : 'Masuk'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
