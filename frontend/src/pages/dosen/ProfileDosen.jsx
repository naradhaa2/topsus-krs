import { useEffect, useState } from 'react'
import { User, Hash, Mail, Phone, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar        from '../../components/Sidebar'
import LoadingSpinner from '../../components/LoadingSpinner'
import api            from '../../services/api'

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="p-3 rounded-3" style={{ background: '#f8f9fa', border: '1px solid #e7eaee' }}>
      <div className="d-flex align-items-center gap-2 mb-1">
        <Icon size={13} color="#8996a4" />
        <span style={{ fontSize: '0.72rem', color: '#5b6b79', fontWeight: 500 }}>{label}</span>
      </div>
      <p className="fw-semibold mb-0 text-truncate" style={{ fontSize: '0.875rem', color: '#1d2630' }}>{value}</p>
    </div>
  )
}

export default function ProfileDosen() {
  const [profile,   setProfile]   = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get('/api/dosen/profile')
      .then((r) => setProfile(r.data.data))
      .catch(() => toast.error('Gagal memuat profil'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="pc-container">
      <Sidebar />
      <main className="pc-content">
        <div className="page-header">
          <h1>Profil Dosen</h1>
        </div>

        {isLoading ? <LoadingSpinner /> : profile ? (
          <div style={{ maxWidth: 640 }}>
            <div className="card" style={{ border: 'none', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
              <div className="card-body p-4 p-md-5">
                {/* Avatar + nama */}
                <div
                  className="d-flex align-items-center gap-4 mb-4 pb-4"
                  style={{ borderBottom: '1px solid #e7eaee' }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 76, height: 76, background: 'rgba(70,128,255,0.1)', borderRadius: '50%' }}
                  >
                    <User size={34} color="#4680ff" />
                  </div>
                  <div>
                    <h2 className="fw-bold mb-1" style={{ fontSize: '1.3rem', color: '#1d2630' }}>{profile.nama}</h2>
                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>NIDN: {profile.nidn}</p>
                  </div>
                </div>

                {/* Detail grid */}
                <div className="row g-3">
                  <div className="col-sm-6"><InfoCard icon={Mail}     label="Email"       value={profile.email} /></div>
                  <div className="col-sm-6"><InfoCard icon={Phone}    label="No. Telepon" value={profile.no_telp || '–'} /></div>
                  <div className="col-sm-6"><InfoCard icon={Hash}     label="NIDN"        value={profile.nidn} /></div>
                  <div className="col-sm-6"><InfoCard icon={Calendar} label="Bergabung"   value={
                    profile.created_at
                      ? new Date(profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '–'
                  } /></div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
