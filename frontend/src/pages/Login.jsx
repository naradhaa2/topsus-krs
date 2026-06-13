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
const ROLE_LABEL = {
  mahasiswa: 'Mahasiswa',
  dosen:     'Dosen',
  admin:     'Admin',
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
              <div className="text-center mb-3">
                <a href="#">
                  <div className="d-inline-flex align-items-center gap-2">
                    <div className="avtar avtar-s bg-primary">
                      <i className="ti ti-book f-18 text-white" />
                    </div>
                    <span className="f-w-700 f-20">Sistem KRS</span>
                  </div>
                </a>
              </div>

              {/* Role selector (sebagai pengganti social login) */}
              <div className="d-grid my-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRole(r); setErrors({}) }}
                    className={`btn mt-0 ${role === r ? 'btn-primary' : 'bg-light text-muted border-0'}`}
                    style={{ borderRadius: 8 }}
                  >
                    <i className={`ti ${r === 'mahasiswa' ? 'ti-user-graduate' : r === 'dosen' ? 'ti-users' : 'ti-shield-check'} me-2`} />
                    Masuk sebagai {ROLE_LABEL[r]}
                  </button>
                ))}
              </div>

              {/* Separator */}
              <div className="saprator my-3">
                <span>ATAU</span>
              </div>

              <h4 className="text-center f-w-500 mb-3">Masuk dengan email</h4>

              <form onSubmit={handleSubmit} noValidate>
                {/* Email */}
                <div className="form-group mb-3">
                  <input
                    type="email"
                    className={`form-control${errors.email ? ' is-invalid' : ''}`}
                    value={form.email}
                    onChange={setF('email')}
                    placeholder="Email Address"
                    autoComplete="email"
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                {/* Password */}
                <div className="form-group mb-3">
                  <div className="input-group">
                    <input
                      type={showPass ? 'text' : 'password'}
                      className={`form-control${errors.password ? ' is-invalid' : ''}`}
                      value={form.password}
                      onChange={setF('password')}
                      placeholder="Password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      tabIndex={-1}
                      onClick={() => setShowPass((v) => !v)}
                    >
                      <i className={`ti ${showPass ? 'ti-eye-off' : 'ti-eye'}`} />
                    </button>
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                  </div>
                </div>

                <div className="d-grid mt-4">
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading
                      ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Masuk...</>
                      : 'Masuk'}
                  </button>
                </div>
              </form>

              <div className="d-flex justify-content-between align-items-end mt-4">
                <h6 className="f-w-500 mb-0 text-muted">
                  Role terpilih: <span className="text-primary text-capitalize f-w-700">{ROLE_LABEL[role]}</span>
                </h6>
                <a href="#" className="link-primary" onClick={(e) => e.preventDefault()}>Bantuan?</a>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
