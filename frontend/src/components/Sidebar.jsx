import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  BookOpen, LogOut, Menu, X,
  LayoutDashboard, GraduationCap, Users, Network, User,
} from 'lucide-react'

const ADMIN_MENU = [
  { path: '/admin/dashboard',   label: 'Dashboard',        icon: LayoutDashboard },
  { path: '/admin/mahasiswa',   label: 'Mahasiswa',        icon: GraduationCap },
  { path: '/admin/dosen',       label: 'Dosen',            icon: Users },
  { path: '/admin/pemetaan-pa', label: 'Pemetaan PA',      icon: Network },
]

const DOSEN_MENU = [
  { path: '/dosen/profile',    label: 'Profil',              icon: User },
  { path: '/dosen/bimbingan',  label: 'Mahasiswa Bimbingan', icon: Users },
]

function SidebarContent({ menu, onLinkClick }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="flex flex-col h-full bg-blue-800 text-white">
      {/* Logo */}
      <div className="p-5 border-b border-blue-700 flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <span className="font-bold text-lg">Sistem KRS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {menu.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? 'bg-blue-600 text-white' : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t border-blue-700">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-semibold text-white truncate">{user?.nama}</p>
          <p className="text-xs text-blue-300 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-blue-100 hover:bg-blue-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const menu = user?.role === 'admin' ? ADMIN_MENU : DOSEN_MENU

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-blue-800 text-white rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 md:hidden transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent menu={menu} onLinkClick={() => setOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-60 z-30">
        <SidebarContent menu={menu} onLinkClick={() => {}} />
      </aside>
    </>
  )
}
