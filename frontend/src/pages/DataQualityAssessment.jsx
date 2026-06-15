
import { useRef, useState } from 'react'
import { uploadDataQuality } from '../services/api'
import MissingValueAnalysis from '../components/MissingValueAnalysis'
import DuplicateCustomerAnalysis from '../components/DuplicateCustomerAnalysis'

function formatCount(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString()
}

const SEVERITY_STYLES = {
  Critical: { background: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
  High:     { background: '#fff7ed', color: '#c2410c', border: '#fdba74' },
  Medium:   { background: '#fefce8', color: '#a16207', border: '#fde047' },
  Low:      { background: '#f0fdf4', color: '#15803d', border: '#86efac' },
}

function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Low
  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 700,
      background: s.background,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {severity}
    </span>
  )
}
function GroupedIssueCard({ title, severity, summary, details }) {
  const [open, setOpen] = useState(false)
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Low
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{title}</span>
          <SeverityBadge severity={severity} />
          <span style={{ color: '#64748b', fontSize: '13px' }}>{summary}</span>
        </div>
        <button type="button" onClick={() => setOpen(p => !p)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#2563eb' }}>
          {open ? 'Hide Details ▲' : 'Show Details ▼'}
        </button>
      </div>
      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column' }}>{details}</div>
        </div>
      )}
    </div>
  )
}

function GroupedRecCard({ index, title, severity, summary, bullets, details }) {
  const [open, setOpen] = useState(false)
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Low
  return (
    <div style={{ padding: '16px 18px', border: '1px solid #e2e8f0', borderLeft: `4px solid ${s.border}`, borderRadius: '12px', background: '#f8fafc' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{index}</span>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{title}</span>
          <SeverityBadge severity={severity} />
          <span style={{ color: '#64748b', fontSize: '13px' }}>{summary}</span>
        </div>
        <button type="button" onClick={() => setOpen(p => !p)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#2563eb' }}>
          {open ? 'Hide Details ▲' : 'Show Details ▼'}
        </button>
      </div>
      <ul style={{ margin: '0 0 0 8px', padding: '0 0 0 16px', color: '#475569', fontSize: '13px', lineHeight: 1.8 }}>
        {bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
      {open && (
        <div style={{ marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Per-Record Details</p>
          {details}
        </div>
      )}
    </div>
  )
}
export default function DataQualityAssessment() {
  const fileInputRef = useRef(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setErrorMessage('')
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRunAssessment = async () => {
    if (!selectedFile) {
      setErrorMessage('Please upload a CSV or XLSX file first.')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const data = await uploadDataQuality(selectedFile)
      setResult(data)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Assessment failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const report       = result?.data_quality_report
  const issueLog     = result?.issue_log     ?? []
  const recommendations = result?.recommendations ?? []
  // ── Group issue log ──────────────────────────────────────────────────────
  const missingValueIssues    = issueLog.filter(i => i.issue === 'Missing Values')
  const duplicateIssues       = issueLog.filter(i => i.issue === 'Duplicate Customer Record')
  const otherIssues           = issueLog.filter(i => i.issue !== 'Missing Values' && i.issue !== 'Duplicate Customer Record')

  const missingRecs    = recommendations.filter(r => r.issue === 'Missing Values')
  const duplicateRecs  = recommendations.filter(r => r.issue === 'Duplicate Customer Record')
  const otherRecs      = recommendations.filter(r => r.issue !== 'Missing Values' && r.issue !== 'Duplicate Customer Record')

  const highestSeverity = (items) => {
    const order = { High: 3, Medium: 2, Low: 1, Critical: 4 }
    return items.reduce((best, i) => (order[i.severity] ?? 0) > (order[best] ?? 0) ? i.severity : best, items[0]?.severity ?? 'Low')
  }
  return (
    <main className="dashboard-main">

      {/* ── Upload Section ───────────────────────────────────────────────── */}
      {!isLoading && !result && (
        <section className="card">
          <div className="card-header">
            <h2>Data Quality Assessment</h2>
            <p>Upload a credit portfolio file to assess data quality.</p>
          </div>

          <div className="upload-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              className="file-input"
            />
            <button type="button" className="btn btn-secondary" onClick={handleUploadClick}>
              Choose File
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunAssessment}
              disabled={isLoading}
            >
              {isLoading && <span className="spinner" aria-hidden="true" />}
              {isLoading ? 'Running Assessment...' : 'Run Assessment'}
            </button>
          </div>

          {errorMessage && (
            <div className="error-banner" role="alert">
              {errorMessage}
            </div>
          )}

          <p className="upload-hint">
            {selectedFile
              ? `Selected file: ${selectedFile.name}`
              : 'Supported formats: CSV, XLSX'}
          </p>
        </section>
      )}

      {/* ── Loading State ────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="loading-banner" role="status" aria-live="polite">
          <span className="spinner spinner-lg" aria-hidden="true" />
          <span>Running data quality assessment...</span>
        </div>
      )}

      {/* ── Placeholder ──────────────────────────────────────────────────── */}
      {!result && !isLoading && (
        <div className="placeholder-state">
          <div className="placeholder-icon" aria-hidden="true">🔍</div>
          <h2 className="placeholder-title">No assessment available</h2>
          <p className="placeholder-body">
            Upload a CSV/XLSX file and click <strong>Run Assessment</strong> to
            generate a data quality report.
          </p>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {result && (
        <>

          {/* ── Dataset Profile ───────────────────────────────────────────── */}
          <section className="card">
            <div className="card-header">
              <h2>Dataset Profile</h2>
              <p>Structural overview for: <strong>{selectedFile?.name}</strong></p>
            </div>

            <div className="summary-grid" style={{ marginTop: '1.5rem' }}>
              <div className="summary-item">
                <span className="summary-label">Total Rows</span>
                <strong>{formatCount(result?.dataset_profile?.total_rows)}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Columns</span>
                <strong>{formatCount(result?.dataset_profile?.total_columns)}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Numeric Columns</span>
                <strong>{formatCount(result?.dataset_profile?.numeric_columns)}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Categorical Columns</span>
                <strong>{formatCount(result?.dataset_profile?.categorical_columns)}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Columns With Missing Values</span>
                <strong>{formatCount(result?.missing_value_analysis?.length ?? 0)}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Duplicate Customer IDs</span>
                <strong>{formatCount(result?.duplicate_analysis?.length ?? 0)}</strong>
              </div>
            </div>
            {/* Re-run controls */}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                className="file-input"
              />
              <button type="button" className="btn btn-secondary" onClick={handleUploadClick}>
                Choose File
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRunAssessment}
                disabled={isLoading || !selectedFile}
              >
                {isLoading && <span className="spinner" aria-hidden="true" />}
                {isLoading ? 'Running Assessment...' : 'Re-run Assessment'}
              </button>
              {selectedFile && (
                <span className="upload-hint" style={{ margin: 0 }}>
                  {selectedFile.name}
                </span>
              )}
            </div>

            {errorMessage && (
              <div className="error-banner" role="alert" style={{ marginTop: '1rem' }}>
                {errorMessage}
              </div>
            )}
          </section>
          {/* ── Missing Value Analysis ────────────────────────────────────── */}
          {result?.missing_value_analysis && (
            <MissingValueAnalysis
              missingValueAnalysis={result.missing_value_analysis}
            />
          )}
          {/* ── Duplicate Customer Analysis ───────────────────────────────── */}
          {result?.duplicate_analysis && (
            <DuplicateCustomerAnalysis
              duplicateAnalysis={result.duplicate_analysis}
            />
          )}
          {/* ── Issue Log ─────────────────────────────────────────────────── */}
          <section className="card">
            <div className="card-header">
              <h2>Issue Log</h2>
              <p>Automatically detected data quality issues.</p>
            </div>

            {issueLog.length === 0 ? (
              <p style={{ marginTop: '1.5rem', color: '#15803d', fontWeight: 600, fontSize: '0.95rem' }}>
                ✓ No issues detected. Dataset passed all quality checks.
              </p>
            ) : (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* Missing Values group */}
                {missingValueIssues.length > 0 && (
                  <GroupedIssueCard
                    title="Missing Values"
                    severity={highestSeverity(missingValueIssues)}
                    summary={`Affected Columns: ${missingValueIssues.length}`}
                    details={missingValueIssues.map(i => (
                      <div key={i.column} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9', gap: '12px' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{i.column}</span>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#64748b', fontSize: '12px' }}>{i.missing_count?.toLocaleString()} missing ({i.missing_percentage}%)</span>
                          <SeverityBadge severity={i.severity} />
                        </div>
                      </div>
                    ))}
                  />
                )}

                {/* Duplicate Customer Records group */}
                {duplicateIssues.length > 0 && (
                  <GroupedIssueCard
                    title="Duplicate Customer Records"
                    severity={highestSeverity(duplicateIssues)}
                    summary={`Affected Customer IDs: ${duplicateIssues.length}`}
                    details={duplicateIssues.map(i => (
                      <div key={i.customer_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9', gap: '12px' }}>
                        <span style={{ fontWeight: 600, color: '#2563eb', fontSize: '13px' }}>{i.customer_id}</span>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#64748b', fontSize: '12px' }}>{i.occurrences} occurrences</span>
                          <SeverityBadge severity={i.severity} />
                        </div>
                      </div>
                    ))}
                  />
                )}

                {/* Other issues (unchanged, one per row) */}
                {otherIssues.map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{item.issue}</p>
                      <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>{item.detail}</p>
                    </div>
                    <div style={{ flexShrink: 0 }}><SeverityBadge severity={item.severity} /></div>
                  </div>
                ))}

              </div>
            )}
          </section>

          {/* ── Remediation Recommendations ───────────────────────────────── */}
          <section className="card">
            <div className="card-header">
              <h2>Remediation Recommendations</h2>
              <p>Suggested actions to resolve detected issues.</p>
            </div>

            {recommendations.length === 0 ? (
              <p style={{ marginTop: '1.5rem', color: '#15803d', fontWeight: 600, fontSize: '0.95rem' }}>
                ✓ No recommendations. Dataset is clean and ready for analysis.
              </p>
            ) : (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Missing Values grouped recommendation */}
                {missingRecs.length > 0 && (
                  <GroupedRecCard
                    index={1}
                    title="Missing Values"
                    severity={highestSeverity(missingRecs)}
                    summary={`Affected Columns: ${missingRecs.length}`}
                    bullets={[
                      'Apply mean or median imputation for numeric columns.',
                      'Use the most frequent value or "Unknown" for categorical columns.',
                      'Exclude columns where the missing rate exceeds 40%.',
                      'Investigate upstream data pipelines for root cause.',
                    ]}
                    details={missingRecs.map(r => (
                      <div key={r.column} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{r.column} <SeverityBadge severity={r.severity} /></p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '12px' }}>{r.recommendation}</p>
                      </div>
                    ))}
                  />
                )}

                {/* Duplicate Customer Records grouped recommendation */}
                {duplicateRecs.length > 0 && (
                  <GroupedRecCard
                    index={missingRecs.length > 0 ? 2 : 1}
                    title="Duplicate Customer Records"
                    severity={highestSeverity(duplicateRecs)}
                    summary={`Affected Customers: ${duplicateRecs.length}`}
                    bullets={[
                      'Retain the most recent record per customer ID.',
                      'Remove all other duplicate records before modelling.',
                      'Investigate the data ingestion pipeline to prevent recurrence.',
                      'Implement a uniqueness constraint on the Customer ID column.',
                    ]}
                    details={duplicateRecs.map(r => (
                      <div key={r.customer_id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#2563eb', fontSize: '13px' }}>{r.customer_id}</p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '12px' }}>{r.recommendation}</p>
                      </div>
                    ))}
                  />
                )}

                {/* Other recommendations */}
                {otherRecs.map((item, index) => {
                  const s = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.Low
                  return (
                    <div key={index} style={{ padding: '16px 18px', border: '1px solid #e2e8f0', borderLeft: `4px solid ${s.border}`, borderRadius: '12px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{index + 1}</span>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{item.issue}</span>
                        <SeverityBadge severity={item.severity} />
                      </div>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.7 }}>{item.recommendation}</p>
                    </div>
                  )
                })}

              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}