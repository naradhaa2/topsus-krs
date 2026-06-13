export default function Table({ columns, data, onEdit, onDelete, isLoading, emptyMessage = 'Tidak ada data' }) {
  const hasActions = onEdit || onDelete

  if (isLoading) {
    return (
      <div className="card table-card p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton-row mb-2" />
        ))}
      </div>
    )
  }

  return (
    <div className="card table-card">
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              {hasActions && <th>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="text-center py-5 text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : (row[col.key] ?? '-')}
                    </td>
                  ))}
                  {hasActions && (
                    <td>
                      <div className="d-flex gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="btn btn-sm badge-light-primary border-0"
                            style={{ borderRadius: 6, fontSize: '0.78rem' }}
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="btn btn-sm badge-light-danger border-0"
                            style={{ borderRadius: 6, fontSize: '0.78rem' }}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
