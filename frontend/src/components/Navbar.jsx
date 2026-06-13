import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BookOpen, LogOut, User, FileText } from 'lucide-react'

const MENU = [
  { path: '/mahasiswa/profile', label: 'Profil', icon: User },
  { path: '/mahasiswa/krs',     label: 'KRS',    icon: FileText },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <nav className="mhs-navbar">
      {/* Brand */}
      <Link to="/mahasiswa/profile" className="brand">
        <div className="brand-icon">
          <BookOpen size={17} />
        </div>
        Sistem KRS
      </Link>

      {/* Menu links */}
      <div className="d-flex align-items-center gap-1 ms-3">
        {MENU.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <Link key={path} to={path} className={`mhs-nav-link${active ? ' active' : ''}`}>
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </div>

      {/* User info + logout */}
      <div className="d-flex align-items-center gap-2 ms-auto">
        <div className="d-none d-sm-block text-end">
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{user?.nama}</div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>Mahasiswa</div>
        </div>
        <button
          onClick={logout}
          className="btn btn-sm"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8 }}
          title="Keluar"
        >
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  )
}
