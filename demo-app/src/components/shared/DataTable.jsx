export default function DataTable({ headers = [], rows = [] }) {
  if (!headers.length) return null

  return (
    <div className="data-table-wrapper" role="region" aria-label="Data table" tabIndex={0}>
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th key={i} scope="col">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ textAlign: 'center', padding: '24px', color: '#999' }}>
                No data available
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
