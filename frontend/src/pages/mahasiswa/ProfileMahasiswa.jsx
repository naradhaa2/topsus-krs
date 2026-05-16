import { useEffect, useState } from 'react'
import { User, BookOpen, GraduationCap, Phone, Mail, Hash } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar         from '../../components/Navbar'
import LoadingSpinner from '../../components/LoadingSpinner'
import api            from '../../services/api'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
      <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  )
}

export default function ProfileMahasiswa() {
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get('/api/mahasiswa/profile')
      .then((r) => setProfile(r.data.data))
      .catch(() => toast.error('Gagal memuat profil'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Profil Saya</h1>

        {isLoading ? <LoadingSpinner /> : profile ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Info mahasiswa */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-blue-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{profile.nama}</h2>
                  <p className="text-slate-500 text-sm">{profile.nim}</p>
                </div>
              </div>
              <div className="space-y-2">
                <InfoRow icon={GraduationCap} label="Jurusan"  value={profile.jurusan} />
                <InfoRow icon={BookOpen}      label="Semester" value={`Semester ${profile.semester}`} />
                <InfoRow icon={Mail}          label="Email"    value={profile.email} />
              </div>
            </div>

            {/* Info dosen PA */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Dosen Pembimbing Akademik
              </h3>
              {profile.dosen_pa ? (
                <div className="space-y-2">
                  <InfoRow icon={User}  label="Nama"    value={profile.dosen_pa.nama} />
                  <InfoRow icon={Hash}  label="NIDN"    value={profile.dosen_pa.nidn} />
                  <InfoRow icon={Mail}  label="Email"   value={profile.dosen_pa.email} />
                  <InfoRow icon={Phone} label="No. Telp" value={profile.dosen_pa.no_telp || '–'} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <User className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">Belum ada dosen PA yang assigned</p>
                  <p className="text-xs mt-1">Hubungi admin untuk proses penentuan PA</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
