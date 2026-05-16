import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, BookOpen, Mail, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar        from '../../components/Sidebar'
import LoadingSpinner from '../../components/LoadingSpinner'
import api            from '../../services/api'

function InfoItem({ label, value }) {
  return (
    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  )
}

export default function DetailBimbingan() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [data,      setData]      = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/dosen/mahasiswa-bimbingan/${id}`)
      .then((r) => setData(r.data.data))
      .catch((err) => {
        toast.error(err.response?.data?.error || 'Gagal memuat detail mahasiswa')
        navigate('/dosen/bimbingan')
      })
      .finally(() => setIsLoading(false))
  }, [id])

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <main className="md:ml-60 p-4 md:p-6 pt-16 md:pt-6">
        <button
          onClick={() => navigate('/dosen/bimbingan')}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-700 mb-6 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Bimbingan
        </button>

        {isLoading ? <LoadingSpinner /> : data ? (
          <>
            {/* Card info mahasiswa */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-7 h-7 text-blue-700" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">{data.nama}</h1>
                  <p className="text-slate-500 text-sm">{data.nim} · {data.jurusan}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InfoItem label="Email"     value={data.email} />
                <InfoItem label="Jurusan"   value={data.jurusan} />
                <InfoItem label="Semester"  value={`Semester ${data.semester}`} />
                <InfoItem label="Total SKS" value={`${data.krs?.total_sks ?? 0} SKS`} />
              </div>
            </div>

            {/* Tabel KRS */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h2 className="font-semibold text-slate-800">
                  KRS — {data.krs?.jumlah_mk ?? 0} Mata Kuliah
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      {['Kode MK', 'Nama Mata Kuliah', 'SKS', 'Nilai'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-slate-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.krs?.mata_kuliah ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                          Mahasiswa belum memilih mata kuliah
                        </td>
                      </tr>
                    ) : (
                      data.krs.mata_kuliah.map((mk) => (
                        <tr key={mk.kode} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{mk.kode}</td>
                          <td className="px-4 py-3 text-slate-800">{mk.nama}</td>
                          <td className="px-4 py-3 text-slate-600">{mk.sks} SKS</td>
                          <td className="px-4 py-3">
                            {mk.nilai ? (
                              <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                                {mk.nilai}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">Belum ada</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td colSpan={2} className="px-4 py-3 font-semibold text-slate-700">Total</td>
                      <td className="px-4 py-3 font-bold text-blue-700">{data.krs?.total_sks ?? 0} SKS</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
