import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

const ROLE_HOME = {
  admin:     '/admin/dashboard',
  mahasiswa: '/mahasiswa/profile',
  dosen:     '/dosen/profile',
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) return <LoadingSpinner fullscreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={ROLE_HOME[user?.role] ?? '/login'} replace />
  }

  return children
}
