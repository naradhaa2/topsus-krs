import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login               from './pages/Login'
import NotFound            from './pages/NotFound'
import Dashboard           from './pages/admin/Dashboard'
import ManajemenMahasiswa  from './pages/admin/ManajemenMahasiswa'
import ManajemenDosen      from './pages/admin/ManajemenDosen'
import PemetaanPA          from './pages/admin/PemetaanPA'
import ProfileMahasiswa    from './pages/mahasiswa/ProfileMahasiswa'
import KRS                 from './pages/mahasiswa/KRS'
import ProfileDosen        from './pages/dosen/ProfileDosen'
import MahasiswaBimbingan  from './pages/dosen/MahasiswaBimbingan'
import DetailBimbingan     from './pages/dosen/DetailBimbingan'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/mahasiswa" element={<ProtectedRoute allowedRoles={['admin']}><ManajemenMahasiswa /></ProtectedRoute>} />
          <Route path="/admin/dosen"     element={<ProtectedRoute allowedRoles={['admin']}><ManajemenDosen /></ProtectedRoute>} />
          <Route path="/admin/pemetaan-pa" element={<ProtectedRoute allowedRoles={['admin']}><PemetaanPA /></ProtectedRoute>} />

          <Route path="/mahasiswa/profile" element={<ProtectedRoute allowedRoles={['mahasiswa']}><ProfileMahasiswa /></ProtectedRoute>} />
          <Route path="/mahasiswa/krs"     element={<ProtectedRoute allowedRoles={['mahasiswa']}><KRS /></ProtectedRoute>} />

          <Route path="/dosen/profile"           element={<ProtectedRoute allowedRoles={['dosen']}><ProfileDosen /></ProtectedRoute>} />
          <Route path="/dosen/bimbingan"         element={<ProtectedRoute allowedRoles={['dosen']}><MahasiswaBimbingan /></ProtectedRoute>} />
          <Route path="/dosen/bimbingan/:id"     element={<ProtectedRoute allowedRoles={['dosen']}><DetailBimbingan /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
