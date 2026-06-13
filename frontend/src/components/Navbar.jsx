import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const MENU = [
  { path: '/mahasiswa/profile', label: 'Profil',  icon: 'ti ti-user-circle' },
  { path: '/mahasiswa/krs',     label: 'KRS',     icon: 'ti ti-books' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <nav className="mhs-topbar">
      {/* Brand */}
      <a href="#" className="brand">
        <div className="avtar avtar-s">
          <i className="ti ti-book f-16" />
        </div>
        Sistem KRS
      </a>

      {/* Nav links */}
      <div className="d-flex align-items-center gap-1 ms-3">
        {MENU.map(({ path, label, icon }) => {
          const active = location.pathname === path
          return (
            <Link key={path} to={path} className={`mhs-nav-link${active ? ' active' : ''}`}>
              <i className={icon} />
              {label}
            </Link>
          )
        })}
      </div>

      {/* User + logout */}
      <div className="d-flex align-items-center gap-2 ms-auto">
        <div className="d-none d-sm-block text-end">
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{user?.nama}</div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>Mahasiswa</div>
        </div>
        <button
          onClick={logout}
          className="avtar avtar-s btn-link-danger ms-1"
          title="Keluar"
          style={{ border: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', borderRadius: 8 }}
        >
          <i className="ti ti-logout f-18 text-white" />
        </button>
      </div>
    </nav>
  )
}
