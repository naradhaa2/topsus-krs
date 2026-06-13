const colorMap = {
  blue:    { bg: 'bg-light-primary', text: 'text-primary'  },
  emerald: { bg: 'bg-light-success', text: 'text-success'  },
  amber:   { bg: 'bg-light-warning', text: 'text-warning'  },
  rose:    { bg: 'bg-light-danger',  text: 'text-danger'   },
  info:    { bg: 'bg-light-info',    text: 'text-info'     },
}

export default function StatCard({ title, value, tablerIcon, color = 'blue', subtitle, trend }) {
  const { bg, text } = colorMap[color] ?? colorMap.blue

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex align-items-center">
          <div className="flex-shrink-0">
            <div className={`avtar avtar-s ${bg}`}>
              <i className={`${tablerIcon ?? 'ti ti-chart-bar'} f-24 ${text}`} />
            </div>
          </div>
          <div className="flex-grow-1 ms-3">
            <h6 className="mb-0">{title}</h6>
          </div>
        </div>
        <div className="bg-body p-3 mt-3 rounded">
          <div className="row align-items-center">
            <div className="col-8">
              <h3 className="mb-1 f-w-700">{value}</h3>
              {subtitle && (
                <p className={`mb-0 ${text}`} style={{ fontSize: '0.8rem' }}>
                  <i className="ti ti-arrow-up-right me-1" />{subtitle}
                </p>
              )}
            </div>
            <div className="col-4 text-end">
              <div className={`avtar avtar-xs ${bg}`}>
                <i className={`${tablerIcon ?? 'ti ti-chart-bar'} ${text}`} style={{ fontSize: '12px' }} />
              </div>
            </div>
          </div>
          {trend && (
            <p className={`mb-0 mt-2 ${text}`} style={{ fontSize: '0.8rem' }}>
              <i className="ti ti-trending-up me-1" />{trend}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
