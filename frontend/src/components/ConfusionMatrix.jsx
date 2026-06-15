export default function ConfusionMatrix({ tn, fp, fn, tp }) {
    if (tn == null && fp == null && fn == null && tp == null) return null;
  
    const cells = [
      {
        label: 'True Negative',
        abbr: 'TN',
        value: tn,
        bg: '#f0fdf4',
        border: '#86efac',
        color: '#15803d',
      },
      {
        label: 'False Positive',
        abbr: 'FP',
        value: fp,
        bg: '#fef2f2',
        border: '#fca5a5',
        color: '#b91c1c',
      },
      {
        label: 'False Negative',
        abbr: 'FN',
        value: fn,
        bg: '#fef2f2',
        border: '#fca5a5',
        color: '#b91c1c',
      },
      {
        label: 'True Positive',
        abbr: 'TP',
        value: tp,
        bg: '#f0fdf4',
        border: '#86efac',
        color: '#15803d',
      },
    ];
  
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        marginTop: '24px',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#1e293b',
          marginTop: 0,
          marginBottom: '20px',
        }}>
          Confusion Matrix
        </h2>
  
        {/* Predicted header */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '6px', minWidth: '320px' }}>
            <thead>
              <tr>
                <th style={{ width: '30%' }} />
                <th
                  colSpan={2}
                  style={{
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#64748b',
                    paddingBottom: '6px',
                    letterSpacing: '0.03em',
                  }}
                >
                  Predicted
                </th>
              </tr>
              <tr>
                <th style={{ width: '30%' }} />
                {['No Default', 'Default'].map((label) => (
                  <th
                    key={label}
                    style={{
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#94a3b8',
                      paddingBottom: '8px',
                      width: '35%',
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
  
            <tbody>
              {[
                { rowLabel: 'No Default', cells: [cells[0], cells[1]], isFirst: true },
                { rowLabel: 'Default',    cells: [cells[2], cells[3]], isFirst: false },
              ].map(({ rowLabel, cells: rowCells, isFirst }) => (
                <tr key={rowLabel}>
                  {/* Actual label — only first row gets the "Actual" super-label */}
                  <td style={{ verticalAlign: 'middle', paddingRight: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isFirst && (
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#64748b',
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                          letterSpacing: '0.03em',
                          marginRight: '4px',
                        }}>
                          Actual
                        </span>
                      )}
                      {!isFirst && <span style={{ width: '20px' }} />}
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#94a3b8',
                      }}>
                        {rowLabel}
                      </span>
                    </div>
                  </td>
  
                  {rowCells.map((cell) => (
                    <td key={cell.abbr} style={{ padding: '4px' }}>
                      <div style={{
                        background: cell.bg,
                        border: `1.5px solid ${cell.border}`,
                        borderRadius: '12px',
                        padding: '20px 12px',
                        textAlign: 'center',
                      }}>
                        <div style={{
                          fontSize: '28px',
                          fontWeight: 700,
                          color: cell.color,
                          lineHeight: 1.1,
                          marginBottom: '6px',
                        }}>
                          {cell.value != null ? Number(cell.value).toLocaleString() : '—'}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: cell.color,
                          marginBottom: '2px',
                        }}>
                          {cell.abbr}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#94a3b8',
                          fontWeight: 500,
                        }}>
                          {cell.label}
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }