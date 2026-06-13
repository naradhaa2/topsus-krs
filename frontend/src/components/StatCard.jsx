const iconVariant = {
  blue:    'icon-primary',
  emerald: 'icon-success',
  amber:   'icon-warning',
  rose:    'icon-danger',
  info:    'icon-info',
}

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  return (
    <div className="card stat-card h-100">
      <div className="card-body d-flex align-items-start justify-content-between p-4">
        <div>
          <p className="stat-label mb-1">{title}</p>
          <p className="stat-value mb-0">{value}</p>
          {subtitle && <p className="stat-sub mb-0 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`stat-icon ${iconVariant[color] || 'icon-primary'}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  )
}
