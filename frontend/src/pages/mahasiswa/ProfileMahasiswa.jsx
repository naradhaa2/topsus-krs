import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Navbar         from '../../components/Navbar'
import LoadingSpinner from '../../components/LoadingSpinner'
import api            from '../../services/api'

function InfoRow({ icon, label, value }) {
  return (
    <div className="d-flex align-items-center gap-3 p-3 rounded-3 bg-body-tertiary">
      <div className="avtar avtar-s bg-light-primary flex-shrink-0">
        <i className={icon} />
      </div>
      <div className="overflow-hidden">
        <div className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{label}</div>
        <div className="fw-semibold text-truncate">{value}</div>
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
    <div className="mhs-container">
      <Navbar />
      <div className="container-lg py-4">
        <h5 className="fw-bold mb-4">Profil Saya</h5>

        {isLoading ? <LoadingSpinner /> : profile ? (
          <div className="row g-4">
            {/* Info mahasiswa */}
            <div className="col-md-6">
              <div className="card">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="avtar avtar-xl bg-light-primary">
                      <i className="ti ti-user f-28" />
                    </div>
                    <div>
                      <div className="fw-bold f-16">{profile.nama}</div>
                      <div className="text-muted">{profile.nim}</div>
                    </div>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    <InfoRow icon="ti ti-school"    label="Jurusan"  value={profile.jurusan} />
                    <InfoRow icon="ti ti-book"      label="Semester" value={`Semester ${profile.semester}`} />
                    <InfoRow icon="ti ti-mail"      label="Email"    value={profile.email} />
                  </div>
                </div>
              </div>
            </div>

            {/* Info dosen PA */}
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-2 mb-4">
                    <i className="ti ti-user text-primary" />
                    <span className="fw-semibold">Dosen Pembimbing Akademik</span>
                  </div>
                  {profile.dosen_pa ? (
                    <div className="d-flex flex-column gap-2">
                      <InfoRow icon="ti ti-user"  label="Nama"     value={profile.dosen_pa.nama} />
                      <InfoRow icon="ti ti-hash"  label="NIDN"     value={profile.dosen_pa.nidn} />
                      <InfoRow icon="ti ti-mail"  label="Email"    value={profile.dosen_pa.email} />
                      <InfoRow icon="ti ti-phone" label="No. Telp" value={profile.dosen_pa.no_telp || '–'} />
                    </div>
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center py-4 text-muted text-center">
                      <i className="ti ti-user f-36 mb-2 opacity-25" />
                      <p className="mb-1">Belum ada dosen PA yang assigned</p>
                      <p className="mb-0" style={{ fontSize: '0.78rem' }}>Hubungi admin untuk proses penentuan PA</p>
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
