import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    <div className="auth-main">
      <div className="auth-wrapper v1">
        <div className="auth-form">
          <div className="card my-5">
            <div className="card-body">

              {/* Logo */}
              <div className="text-center mb-4">
                <div className="avtar avtar-xl bg-primary mx-auto mb-3" style={{ width: 64, height: 64, borderRadius: 16 }}>
                  <i className="ti ti-book f-28 text-white" />
                </div>
                <h4 className="mb-0 f-w-700">Sistem KRS</h4>
                <p className="text-muted mt-1">Kartu Rencana Studi</p>
              </div>

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
                <div className="form-group mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control${errors.email ? ' is-invalid' : ''}`}
                    value={form.email}
                    onChange={setF('email')}
                    placeholder="nama@example.com"
                    autoComplete="email"
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                {/* Password */}
                <div className="form-group mb-4">
                  <label className="form-label">Password</label>
                  <div className="input-group">
                    <input
                      type={showPass ? 'text' : 'password'}
                      className={`form-control${errors.password ? ' is-invalid' : ''}`}
                      value={form.password}
                      onChange={setF('password')}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPass((v) => !v)}
                    >
                      <i className={`ti ${showPass ? 'ti-eye-off' : 'ti-eye'}`} />
                    </button>
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                  </div>
                </div>

                <div className="d-grid">
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading
                      ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Masuk...</>
                      : <><i className="ti ti-login me-2" />Masuk</>}
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
