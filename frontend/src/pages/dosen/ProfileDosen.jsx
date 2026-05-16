import { useEffect, useState } from 'react'
import { User, Hash, Mail, Phone, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar        from '../../components/Sidebar'
import LoadingSpinner from '../../components/LoadingSpinner'
import api            from '../../services/api'

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
    </div>
  )
}

export default function ProfileDosen() {
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get('/api/dosen/profile')
      .then((r) => setProfile(r.data.data))
      .catch(() => toast.error('Gagal memuat profil'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <main className="md:ml-60 p-4 md:p-6 pt-16 md:pt-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Profil Dosen</h1>

        {isLoading ? <LoadingSpinner /> : profile ? (
          <div className="max-w-2xl">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              {/* Avatar + nama */}
              <div className="flex items-center gap-5 mb-8 pb-6 border-b border-slate-100">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-10 h-10 text-blue-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{profile.nama}</h2>
                  <p className="text-slate-500 text-sm mt-1">NIDN: {profile.nidn}</p>
                </div>
              </div>

              {/* Detail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoCard icon={Mail}     label="Email"       value={profile.email} />
                <InfoCard icon={Phone}    label="No. Telepon" value={profile.no_telp || '–'} />
                <InfoCard icon={Hash}     label="NIDN"        value={profile.nidn} />
                <InfoCard icon={Calendar} label="Bergabung"   value={
                  profile.created_at
                    ? new Date(profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                    : '–'
                } />
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
