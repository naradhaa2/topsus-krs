export default function LoadingSpinner({ fullscreen = false }) {
  const spinner = (
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-700 border-t-transparent" />
  )
  if (fullscreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        {spinner}
      </div>
    )
  }
  return <div className="flex items-center justify-center py-16">{spinner}</div>
}
