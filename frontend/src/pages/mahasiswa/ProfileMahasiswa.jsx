import { useEffect, useState } from 'react'
import { User, BookOpen, GraduationCap, Phone, Mail, Hash } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar         from '../../components/Navbar'
import LoadingSpinner from '../../components/LoadingSpinner'
import api            from '../../services/api'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: '#f8f9fa' }}>
      <div
        className="d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: 34, height: 34, background: '#fff', border: '1px solid #e7eaee', borderRadius: 8 }}
      >
        <Icon size={15} color="#8996a4" />
      </div>
      <div className="overflow-hidden">
        <div style={{ fontSize: '0.72rem', color: '#5b6b79', fontWeight: 500 }}>{label}</div>
        <div className="fw-semibold text-truncate" style={{ fontSize: '0.875rem', color: '#1d2630' }}>{value}</div>
      </div>
    </div>
  )
}

export default function ProfileMahasiswa() {
  const [profile,   setProfile]   = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get('/api/mahasiswa/profile')
      .then((r) => setProfile(r.data.data))
      .catch(() => toast.error('Gagal memuat profil'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="mhs-container" style={{ background: '#f3f5f7' }}>
      <Navbar />
      <div className="container-lg py-4">
        <h1 className="fw-bold mb-4" style={{ fontSize: '1.3rem', color: '#1d2630' }}>Profil Saya</h1>

        {isLoading ? <LoadingSpinner /> : profile ? (
          <div className="row g-4">
            {/* Info mahasiswa */}
            <div className="col-md-6">
              <div className="card" style={{ border: 'none', borderRadius: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div
                      className="d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 60, height: 60, background: 'rgba(70,128,255,0.1)', borderRadius: '50%' }}
                    >
                      <User size={28} color="#4680ff" />
                    </div>
                    <div>
                      <div className="fw-bold" style={{ fontSize: '1.1rem', color: '#1d2630' }}>{profile.nama}</div>
                      <div style={{ fontSize: '0.8rem', color: '#5b6b79' }}>{profile.nim}</div>
                    </div>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    <InfoRow icon={GraduationCap} label="Jurusan"  value={profile.jurusan} />
                    <InfoRow icon={BookOpen}      label="Semester" value={`Semester ${profile.semester}`} />
                    <InfoRow icon={Mail}          label="Email"    value={profile.email} />
                  </div>
                </div>
              </div>
            </div>

            {/* Info dosen PA */}
            <div className="col-md-6">
              <div className="card h-100" style={{ border: 'none', borderRadius: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-2 mb-4">
                    <User size={15} color="#4680ff" />
                    <span className="fw-semibold" style={{ fontSize: '0.95rem', color: '#1d2630' }}>Dosen Pembimbing Akademik</span>
                  </div>
                  {profile.dosen_pa ? (
                    <div className="d-flex flex-column gap-2">
                      <InfoRow icon={User}  label="Nama"     value={profile.dosen_pa.nama} />
                      <InfoRow icon={Hash}  label="NIDN"     value={profile.dosen_pa.nidn} />
                      <InfoRow icon={Mail}  label="Email"    value={profile.dosen_pa.email} />
                      <InfoRow icon={Phone} label="No. Telp" value={profile.dosen_pa.no_telp || '–'} />
                    </div>
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center py-4 text-muted text-center">
                      <User size={40} className="mb-2 opacity-25" />
                      <p className="mb-1" style={{ fontSize: '0.875rem' }}>Belum ada dosen PA yang assigned</p>
                      <p style={{ fontSize: '0.78rem' }}>Hubungi admin untuk proses penentuan PA</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
