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
    <nav className="bg-blue-800 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-bold">Sistem KRS</span>
        </div>

        {/* Menu */}
        <div className="flex items-center gap-1">
          {MENU.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-blue-600' : 'hover:bg-blue-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </div>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-tight">{user?.nama}</p>
            <p className="text-xs text-blue-300">Mahasiswa</p>
          </div>
          <button onClick={logout} className="p-2 hover:bg-blue-700 rounded-lg transition-colors" title="Keluar">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  )
}
