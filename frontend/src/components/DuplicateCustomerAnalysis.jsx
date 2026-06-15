import { useState } from 'react'

export default function DuplicateCustomerAnalysis({ duplicateAnalysis }) {
  const data = duplicateAnalysis ?? []
  const [isExpanded, setIsExpanded] = useState(false)

  // ── No duplicates ────────────────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#1e293b',
          marginTop: 0,
          marginBottom: '16px',
        }}>
          Duplicate Customer Analysis
        </h2>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '20px 24px',
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '12px',
        }}>
          <span style={{ fontSize: '24px' }}>✓</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: '#15803d', fontSize: '15px' }}>
              No Duplicate Customer IDs Detected
            </p>
            <p style={{ margin: '4px 0 0', color: '#166534', fontSize: '13px' }}>
              All customer IDs are unique. Dataset passed the duplicate check.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const totalOccurrences = data.reduce((sum, row) => sum + row.occurrences, 0)

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '24px',
    }}>
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <h2 style={{
        fontSize: '20px',
        fontWeight: 600,
        color: '#1e293b',
        marginTop: 0,
        marginBottom: '20px',
      }}>
        Duplicate Customer Analysis
      </h2>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        <div style={{
          flex: 1,
          minWidth: '140px',
          padding: '14px 16px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
        }}>
          <p style={{
            margin: '0 0 4px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Duplicate Customer IDs
          </p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#c2410c' }}>
            {data.length.toLocaleString()}
          </p>
        </div>

        <div style={{
          flex: 1,
          minWidth: '140px',
          padding: '14px 16px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
        }}>
          <p style={{
            margin: '0 0 4px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Total Duplicate Occurrences
          </p>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>
            {totalOccurrences.toLocaleString()}
          </p>
        </div>
      </div>

      {/* ── Toggle Button ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600,
          color: '#2563eb',
          marginBottom: '16px',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
      >
        {isExpanded
          ? 'Hide Duplicate Customers ▲'
          : `Show Duplicate Customers (${data.length.toLocaleString()}) ▼`}
      </button>

      {/* ── Table (collapsible) ───────────────────────────────────────────── */}
      {isExpanded && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Customer ID', 'Occurrences'].map((h) => (
                    <th key={h} style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: '#64748b',
                      fontSize: '12px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={row.customer_id} style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                  }}>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        type="button"
                        onClick={() => console.log(row.customer_id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: '#2563eb',
                          fontWeight: 600,
                          fontSize: '14px',
                          textDecoration: 'underline',
                          textUnderlineOffset: '3px',
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
                        onMouseLeave={(e) => e.target.style.color = '#2563eb'}
                      >
                        {row.customer_id}
                      </button>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '28px',
                          height: '28px',
                          padding: '0 8px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: row.occurrences >= 5 ? '#fef2f2' : '#fff7ed',
                          color:      row.occurrences >= 5 ? '#b91c1c' : '#c2410c',
                          border:     `1px solid ${row.occurrences >= 5 ? '#fca5a5' : '#fdba74'}`,
                        }}>
                          {row.occurrences}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                          {row.occurrences >= 5 ? 'Critical' : 'occurrences'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{
            margin: '16px 0 0',
            fontSize: '12px',
            color: '#94a3b8',
            fontStyle: 'italic',
          }}>
            Click a Customer ID to inspect duplicate records.
          </p>
        </>
      )}
    </div>
  )
}