import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ADMIN_MENU = [
  { path: '/admin/dashboard',   label: 'Dashboard',        icon: 'ti ti-layout-grid' },
  { path: '/admin/mahasiswa',   label: 'Mahasiswa',        icon: 'ti ti-school' },
  { path: '/admin/dosen',       label: 'Dosen',            icon: 'ti ti-users' },
  { path: '/admin/pemetaan-pa', label: 'Pemetaan PA',      icon: 'ti ti-affiliate' },
]

const DOSEN_MENU = [
  { path: '/dosen/profile',   label: 'Profil Saya',         icon: 'ti ti-user' },
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

export default function Sidebar() {
  const { user, logout } = useAuth()
  const [mobOpen, setMobOpen] = useState(false)
  const menu = user?.role === 'admin' ? ADMIN_MENU : DOSEN_MENU
  const initial = user?.nama?.charAt(0)?.toUpperCase() ?? 'U'

  return (
    <>
      {/* ── Left sidebar ── */}
      <nav className={`pc-sidebar${mobOpen ? ' mob-sidebar-active' : ''}`}>
        <div className="navbar-wrapper">
          <div className="m-header">
            <a href="#" className="b-brand text-primary">
              <div className="avtar avtar-s bg-primary me-2">
                <i className="ti ti-book f-16 text-white" />
              </div>
              <span className="f-w-700">Sistem KRS</span>
            </a>
          </div>

          <div className="navbar-content">
            <div className="card pc-user-card">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="avtar avtar-s bg-light-primary">
                      <span className="f-16 f-w-700 text-primary">{initial}</span>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3 me-2 overflow-hidden">
                    <h6 className="mb-0 text-truncate">{user?.nama}</h6>
                    <small className="text-capitalize text-muted">{user?.role}</small>
                  </div>
                </div>
              </div>
            </div>

            <ul className="pc-navbar">
              <li className="pc-item pc-caption">
                <label>Menu Utama</label>
              </li>
              {menu.map((item) => (
                <NavItem key={item.path} {...item} onClick={() => setMobOpen(false)} />
              ))}
            </ul>

            <div className="card pc-user-card mt-3">
              <div className="card-body">
                <button
                  onClick={logout}
                  className="btn btn-light-danger w-100 d-flex align-items-center justify-content-center gap-2"
                >
                  <i className="ti ti-logout" />Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile backdrop ── */}
      {mobOpen && (
        <div
          className="pc-menu-overlay"
          onClick={() => setMobOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1024 }}
        />
      )}

      {/* ── Top header bar ── */}
      <header className="pc-header">
        <div className="header-wrapper">
          {/* Mobile toggle + desktop collapse */}
          <div className="me-auto pc-mob-drp">
            <ul className="list-unstyled">
              <li className="pc-h-item pc-sidebar-collapse">
                <a href="#" className="pc-head-link ms-0">
                  <i className="ti ti-menu-2" />
                </a>
              </li>
              <li className="pc-h-item pc-sidebar-popup">
                <a
                  href="#"
                  className="pc-head-link ms-0"
                  onClick={(e) => { e.preventDefault(); setMobOpen((o) => !o) }}
                >
                  <i className="ti ti-menu-2" />
                </a>
              </li>
            </ul>
          </div>

          {/* Right — notification + user avatar */}
          <div className="ms-auto">
            <ul className="list-unstyled">
              {/* Notification bell */}
              <li className="pc-h-item">
                <a href="#" className="pc-head-link" onClick={(e) => e.preventDefault()}>
                  <i className="ti ti-bell" />
                </a>
              </li>

              <li className="dropdown pc-h-item header-user-profile">
                <a
                  className="pc-head-link dropdown-toggle arrow-none me-0 d-flex align-items-center gap-2"
                  data-bs-toggle="dropdown"
                  href="#"
                  role="button"
                  data-bs-auto-close="outside"
                  aria-expanded="false"
                >
                  <div className="avtar avtar-s bg-light-primary">
                    <span className="f-14 f-w-700 text-primary">{initial}</span>
                  </div>
                  <span className="d-none d-sm-block">
                    <span className="f-w-600" style={{ fontSize: '0.875rem' }}>{user?.nama}</span>
                    <span className="d-block text-muted text-capitalize" style={{ fontSize: '0.72rem' }}>{user?.role}</span>
                  </span>
                </a>

                <div className="dropdown-menu dropdown-user-profile dropdown-menu-end pc-h-dropdown">
                  <div className="dropdown-header">
                    <h5 className="m-0">Profil</h5>
                  </div>
                  <div className="dropdown-body">
                    <div className="d-flex align-items-center mb-3">
                      <div className="flex-shrink-0">
                        <div className="avtar avtar-s bg-light-primary">
                          <span className="f-16 f-w-700 text-primary">{initial}</span>
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="mb-0">{user?.nama}</h6>
                        <small className="text-muted text-capitalize">{user?.role}</small>
                      </div>
                    </div>
                    <hr className="border-secondary border-opacity-50" />
                    <div className="d-grid">
                      <button className="btn btn-primary" onClick={logout}>
                        <i className="ti ti-logout me-2" />Keluar
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </header>
    </>
  )
}
