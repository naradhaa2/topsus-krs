// color → Able Pro avtar bg class + text color class
const colorMap = {
  blue:    { bg: 'bg-light-primary',  text: 'text-primary'  },
  emerald: { bg: 'bg-light-success',  text: 'text-success'  },
  amber:   { bg: 'bg-light-warning',  text: 'text-warning'  },
  rose:    { bg: 'bg-light-danger',   text: 'text-danger'   },
  info:    { bg: 'bg-light-info',     text: 'text-info'     },
}

export default function StatCard({ title, value, icon: Icon, tablerIcon, color = 'blue', subtitle, trend }) {
  const { bg, text } = colorMap[color] ?? colorMap.blue

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex align-items-center">
          <div className="flex-shrink-0">
            <div className={`avtar avtar-s ${bg}`}>
              {tablerIcon
                ? <i className={`${tablerIcon} f-20 ${text}`} />
                : Icon
                  ? <Icon size={20} className={text} />
                  : null}
            </div>
          </div>
          <div className="flex-grow-1 ms-3">
            <h6 className="mb-0">{title}</h6>
          </div>
        </div>
        <div className="bg-body p-3 mt-3 rounded">
          <div className="mt-1 row align-items-center">
            <div className="col-12">
              <h4 className="mb-1">{value}</h4>
              {subtitle && <p className={`mb-0 ${text}`} style={{ fontSize: '0.8rem' }}>{subtitle}</p>}
              {trend  && <p className={`mb-0 ${text}`} style={{ fontSize: '0.8rem' }}><i className="ti ti-arrow-up-right" /> {trend}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
