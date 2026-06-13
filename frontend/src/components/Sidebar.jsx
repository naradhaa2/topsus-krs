import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  BookOpen, LogOut, Menu,
  LayoutDashboard, GraduationCap, Users, Network, User,
} from 'lucide-react'

const ADMIN_MENU = [
  { path: '/admin/dashboard',   label: 'Dashboard',        icon: LayoutDashboard },
  { path: '/admin/mahasiswa',   label: 'Mahasiswa',        icon: GraduationCap },
  { path: '/admin/dosen',       label: 'Dosen',            icon: Users },
  { path: '/admin/pemetaan-pa', label: 'Pemetaan PA',      icon: Network },
]

const DOSEN_MENU = [
  { path: '/dosen/profile',   label: 'Profil',              icon: User },
  { path: '/dosen/bimbingan', label: 'Mahasiswa Bimbingan', icon: Users },
]

function SidebarContent({ menu, onLinkClick }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <>
      {/* Brand */}
      <div className="m-header">
        <div className="brand-icon">
          <BookOpen size={18} />
        </div>
        <span className="brand-name">Sistem KRS</span>
      </div>

      {/* Nav */}
      <div className="navbar-content">
        <ul className="pc-navbar">
          <li className="pc-caption">Menu</li>
          {menu.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <li key={path} className={`pc-item${active ? ' active' : ''}`}>
                <Link to={path} onClick={onLinkClick} className={`pc-link${active ? ' active' : ''}`}>
                  <Icon size={16} />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* User + Logout */}
      <div className="sidebar-user">
        <div className="d-flex align-items-center gap-2 px-2 py-1 mb-2">
          <div className="brand-icon" style={{ width: 32, height: 32, borderRadius: 6, fontSize: '0.75rem' }}>
            {user?.nama?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="overflow-hidden">
            <div className="user-name">{user?.nama}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button onClick={logout} className="btn-logout">
          <LogOut size={15} />
          Keluar
        </button>
      </div>
    </>
  )
}

export default function Sidebar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const menu = user?.role === 'admin' ? ADMIN_MENU : DOSEN_MENU

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${open ? ' show' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <nav className={`pc-sidebar${open ? ' mob-open' : ''}`}>
        <SidebarContent menu={menu} onLinkClick={() => setOpen(false)} />
      </nav>

      {/* Mobile toggle button (rendered inside pc-header by pages, passed via context/prop) */}
      {/* We expose the toggle via a global button at top-left on mobile */}
      <button
        className="mob-toggle position-fixed"
        style={{ top: 14, left: 16, zIndex: 1040 }}
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>
    </>
  )
}
