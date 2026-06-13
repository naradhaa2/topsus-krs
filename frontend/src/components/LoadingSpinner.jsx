export default function LoadingSpinner({ fullscreen = false }) {
  const spinner = (
    <div
      className="spinner-border"
      role="status"
      style={{ color: 'var(--pc-primary)', width: '2.5rem', height: '2.5rem' }}
    >
      <span className="visually-hidden">Loading...</span>
    </div>
  )

  if (fullscreen) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '100vh', background: '#f3f5f7' }}
      >
        {spinner}
      </div>
    )
  }

  return (
    <div className="d-flex align-items-center justify-content-center py-5">
      {spinner}
    </div>
  )
}
