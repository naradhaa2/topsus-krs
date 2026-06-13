import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ADMIN_MENU = [
  { path: '/admin/dashboard',   label: 'Dashboard',        icon: 'ti ti-layout-dashboard' },
  { path: '/admin/mahasiswa',   label: 'Mahasiswa',        icon: 'ti ti-user-student' },
  { path: '/admin/dosen',       label: 'Dosen',            icon: 'ti ti-users' },
  { path: '/admin/pemetaan-pa', label: 'Pemetaan PA',      icon: 'ti ti-affiliate' },
]

const DOSEN_MENU = [
  { path: '/dosen/profile',   label: 'Profil Saya',         icon: 'ti ti-user-circle' },
  { path: '/dosen/bimbingan', label: 'Mahasiswa Bimbingan', icon: 'ti ti-users' },
]

function NavItem({ path, label, icon, onClick }) {
  const location = useLocation()
  const active = location.pathname === path
  return (
    <li className={`pc-item${active ? ' active' : ''}`}>
      <Link to={path} onClick={onClick} className="pc-link">
        <span className="pc-micon"><i className={icon} /></span>
        <span className="pc-mtext">{label}</span>
      </Link>
    </li>
  )
}

function SidebarBody({ menu, onLinkClick }) {
  const { user, logout } = useAuth()
  const initial = user?.nama?.charAt(0)?.toUpperCase() ?? 'U'

  return (
    <div className="navbar-wrapper">
      {/* Brand header */}
      <div className="m-header">
        <a href="#" className="b-brand text-primary">
          <div className="avtar avtar-s bg-primary me-2">
            <i className="ti ti-book f-16 text-white" />
          </div>
          <span className="fw-bold" style={{ color: 'inherit', fontSize: '1rem' }}>Sistem KRS</span>
        </a>
      </div>

      <div className="navbar-content">
        {/* User card */}
        <div className="card pc-user-card">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="avtar avtar-s bg-light-primary">
                  <span className="f-16 fw-bold text-primary">{initial}</span>
                </div>
              </div>
              <div className="flex-grow-1 ms-3 me-2">
                <h6 className="mb-0 text-truncate" style={{ maxWidth: 130 }}>{user?.nama}</h6>
                <small className="text-capitalize text-muted">{user?.role}</small>
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <ul className="pc-navbar">
          <li className="pc-item pc-caption">
            <label>Menu Utama</label>
          </li>
          {menu.map((item) => (
            <NavItem key={item.path} {...item} onClick={onLinkClick} />
          ))}
        </ul>

        {/* Logout card at bottom */}
        <div className="card pc-user-card mt-3">
          <div className="card-body">
            <button
              onClick={logout}
              className="btn btn-light-danger w-100 d-flex align-items-center justify-content-center gap-2"
            >
              <i className="ti ti-logout" />
              Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { user } = useAuth()
  const [mobOpen, setMobOpen] = useState(false)
  const menu = user?.role === 'admin' ? ADMIN_MENU : DOSEN_MENU

  // add/remove body class for Able Pro JS hook
  useEffect(() => {
    if (mobOpen) {
      document.body.classList.add('mob-sidebar-active')
    } else {
      document.body.classList.remove('mob-sidebar-active')
    }
    return () => document.body.classList.remove('mob-sidebar-active')
  }, [mobOpen])

  return (
    <>
      {/* Sidebar */}
      <nav className={`pc-sidebar${mobOpen ? ' mob-sidebar-active' : ''}`}>
        <SidebarBody menu={menu} onLinkClick={() => setMobOpen(false)} />
      </nav>

      {/* Mobile backdrop */}
      {mobOpen && (
        <div
          className="pc-menu-overlay"
          onClick={() => setMobOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1024 }}
        />
      )}

      {/* Mobile hamburger (visible only on small screens) */}
      <header className="pc-header d-flex d-md-none align-items-center" style={{ paddingLeft: 16 }}>
        <button
          className="pc-head-link ms-0 border-0 bg-transparent"
          onClick={() => setMobOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <i className="ti ti-menu-2 f-20" />
        </button>
        <span className="fw-bold ms-3" style={{ fontSize: '0.95rem', color: '#1d2630' }}>Sistem KRS</span>
      </header>
    </>
  )
}
