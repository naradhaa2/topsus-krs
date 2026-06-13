import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Sidebar        from '../../components/Sidebar'
import PageHeader     from '../../components/PageHeader'
import LoadingSpinner from '../../components/LoadingSpinner'
import api            from '../../services/api'

function InfoCard({ icon, label, value }) {
  return (
    <div className="p-3 rounded-3 bg-body-tertiary border">
      <div className="d-flex align-items-center gap-2 mb-1">
        <i className={`${icon} text-muted`} style={{ fontSize: '0.85rem' }} />
        <span className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{label}</span>
      </div>
      <p className="fw-semibold mb-0 text-truncate">{value}</p>
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
      <div className="pc-content">
        <PageHeader title="Profil Dosen" />

        {isLoading ? <LoadingSpinner /> : profile ? (
          <div style={{ maxWidth: 640 }}>
            <div className="card">
              <div className="card-body p-4 p-md-5">
                {/* Avatar + nama */}
                <div className="d-flex align-items-center gap-4 mb-4 pb-4 border-bottom">
                  <div className="avtar avtar-xl bg-light-primary flex-shrink-0" style={{ width: 76, height: 76 }}>
                    <i className="ti ti-user f-36" />
                  </div>
                  <div>
                    <h4 className="fw-bold mb-1">{profile.nama}</h4>
                    <p className="text-muted mb-0">NIDN: {profile.nidn}</p>
                  </div>
                </div>

                {/* Detail grid */}
                <div className="row g-3">
                  <div className="col-sm-6"><InfoCard icon="ti ti-mail"     label="Email"       value={profile.email} /></div>
                  <div className="col-sm-6"><InfoCard icon="ti ti-phone"    label="No. Telepon" value={profile.no_telp || '–'} /></div>
                  <div className="col-sm-6"><InfoCard icon="ti ti-hash"     label="NIDN"        value={profile.nidn} /></div>
                  <div className="col-sm-6"><InfoCard icon="ti ti-calendar" label="Bergabung"   value={
                    profile.created_at
                      ? new Date(profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '–'
                  } /></div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
