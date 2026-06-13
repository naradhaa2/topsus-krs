export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div className="page-block">
        <div className="row align-items-center">
          <div className="col-md-12">
            <ul className="breadcrumb">
              <li className="breadcrumb-item"><a href="#">Home</a></li>
              <li className="breadcrumb-item active" aria-current="page">{title}</li>
            </ul>
          </div>
          <div className="col-md-12">
            <div className="page-header-title d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-0">{title}</h2>
                {subtitle && <p className="text-muted mb-0 mt-1">{subtitle}</p>}
              </div>
              {action && <div>{action}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
