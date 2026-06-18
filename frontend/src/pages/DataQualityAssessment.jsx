import { useRef, useState } from 'react'
import { uploadDataQuality } from '../services/api'
import MissingValueAnalysis from '../components/MissingValueAnalysis'
import DuplicateCustomerAnalysis from '../components/DuplicateCustomerAnalysis'
import InsightsPanel from '../components/InsightsPanel' 
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ZAxis, Cell } from 'recharts'

function formatCount(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString()
}

const SEVERITY_STYLES = {
  Critical: { background: '#fef2f2', color: '#b91c1c', border: '#fca5a5', bar: '#ef4444' },
  High:     { background: '#fff7ed', color: '#c2410c', border: '#fdba74', bar: '#f97316' },
  Medium:   { background: '#fefce8', color: '#a16207', border: '#fde047', bar: '#eab308' },
  Low:      { background: '#f0fdf4', color: '#15803d', border: '#86efac', bar: '#22c55e' },
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

// Custom Tooltip for the Scatter Plot
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '13px' }}>
        <strong style={{ color: '#0f172a', display: 'block', marginBottom: '6px' }}>Feature: {data.name}</strong>
        <span style={{ color: '#475569', display: 'block' }}>Anomalies: <strong>{data.count.toLocaleString()}</strong></span>
        <span style={{ color: '#475569', display: 'block' }}>Impact: <strong>{data.x}%</strong> of portfolio</span>
      </div>
    );
  }
  return null;
};

function GroupedIssueCard({ title, severity, summary, details }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{title}</span>
          <SeverityBadge severity={severity} />
          <span style={{ color: '#64748b', fontSize: '13px' }}>{summary}</span>
        </div>
        <button 
          type="button" 
          onClick={() => setOpen(p => !p)} 
          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#2563eb' }}
        >
          {open ? 'Hide Details \u25B2' : 'Show Details \u25BC'}
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
        <button 
          type="button" 
          onClick={() => setOpen(p => !p)} 
          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#2563eb' }}
        >
          {open ? 'Hide Details \u25B2' : 'Show Details \u25BC'}
        </button>
      </div>
      <ul style={{ margin: '0 0 0 8px', padding: '0 0 0 16px', color: '#475569', fontSize: '13px', lineHeight: 1.8 }}>
        {bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
      {open && details && details.length > 0 && (
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
  
  const [viewMode, setViewMode] = useState('rules') 
  const [showOutlierTable, setShowOutlierTable] = useState(false) // State to toggle the full table

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

  const resultData   = result?.data || result
  const issueLog     = resultData?.issue_log     ?? []
  const recommendations = resultData?.recommendations ?? []
  
  const mockAIAssessment = {
    executive_summary: "The portfolio exhibits high risk due to a systemic duplication failure and extreme value outliers which threaten model integrity.",
    business_impacts: [
      "Extreme outliers detected in numeric limits. Retaining these records un-capped will artificially skew the KS statistic and overall portfolio Gini coefficient.",
      "Dropping the 'LIMIT_BAL' feature due to missingness will severely degrade model predictive power.",
      "Systemic duplication pattern indicates a pipeline JOIN error rather than manual entry errors."
    ],
    ai_recommendations: [
      {
        column: "EDUCATION",
        strategy: "Stratified Mode Imputation",
        justification: "As a categorical demographic feature, mean imputation is mathematically invalid. Impute using KNN stratified by AGE to preserve demographic fairness."
      },
      {
        column: "LIMIT_BAL",
        strategy: "Apply Upper Cap (99th Percentile)",
        justification: "Massive outliers detected. Dropping these rows removes 2% of total data. Apply the suggested upper cap to normalize the distribution without losing behavioral history."
      }
    ]
  }
  
  const aiAssessment = resultData?.ai_assessment || mockAIAssessment;

  const missingValueIssues    = issueLog.filter(i => i.issue === 'Missing Values')
  const duplicateIssues       = issueLog.filter(i => i.issue === 'Duplicate Identifier Record' || i.issue === 'Duplicate Customer Record')
  const otherIssues           = issueLog.filter(i => i.issue !== 'Missing Values' && i.issue !== 'Duplicate Identifier Record' && i.issue !== 'Duplicate Customer Record')

  const missingRecs    = recommendations.filter(r => r.issue === 'Missing Values')
  const duplicateRecs  = recommendations.filter(r => r.issue === 'Duplicate Customer Record' || r.issue === 'Duplicate Identifier Record')
  const otherRecs      = recommendations.filter(r => r.issue !== 'Missing Values' && r.issue !== 'Duplicate Customer Record' && r.issue !== 'Duplicate Identifier Record')

  const highestSeverity = (items) => {
    const order = { High: 3, Medium: 2, Low: 1, Critical: 4 }
    return items.reduce((best, i) => (order[i.severity] ?? 0) > (order[best] ?? 0) ? i.severity : best, items[0]?.severity ?? 'Low')
  }

  let currentCardIndex = 1;
  
  const debugPayloadForLLM = {
    profile: resultData?.dataset_profile,
    missing_data: resultData?.missing_value_analysis,
    outliers_detected: resultData?.outlier_analysis?.slice(0, 5), 
    duplicates_sample: resultData?.duplicate_analysis?.slice(0, 5)
  };

  const scatterData = resultData?.outlier_analysis?.map(d => ({
    name: d.column,
    x: d.outlier_percentage, 
    count: d.outlier_count,
    fill: d.outlier_percentage > 5 ? '#ef4444' : d.outlier_percentage > 1 ? '#f97316' : '#22c55e'
  })).reverse() || [];

  return (
    <main className="dashboard-main">

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

      {isLoading && (
        <div className="loading-banner" role="status" aria-live="polite">
          <span className="spinner spinner-lg" aria-hidden="true" />
          <span>Running data quality assessment...</span>
        </div>
      )}

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

      {result && (
        <>
          <section className="card">
            <div className="card-header">
              <h2>Dataset Profile</h2>
              <p>Structural overview for: <strong>{selectedFile?.name}</strong></p>
            </div>

            <div className="summary-grid" style={{ marginTop: '1.5rem' }}>
              <div className="summary-item">
                <span className="summary-label">Total Rows</span>
                <strong>{formatCount(resultData?.dataset_profile?.total_rows)}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Columns</span>
                <strong>{formatCount(resultData?.dataset_profile?.total_columns)}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Numeric Columns</span>
                <strong>{formatCount(resultData?.dataset_profile?.numeric_columns)}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Categorical Columns</span>
                <strong>{formatCount(resultData?.dataset_profile?.categorical_columns)}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Columns With Missing Values</span>
                <strong>{formatCount(resultData?.missing_value_analysis?.length ?? 0)}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Duplicate Customer IDs</span>
                <strong>{formatCount(resultData?.duplicate_analysis?.length ?? 0)}</strong>
              </div>
            </div>

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

          {resultData?.missing_value_analysis && (
            <MissingValueAnalysis
              missingValueAnalysis={resultData.missing_value_analysis}
            />
          )}

          {resultData?.duplicate_analysis && (
            <DuplicateCustomerAnalysis
              duplicateAnalysis={resultData.duplicate_analysis}
            />
          )}

          {resultData?.outlier_analysis && resultData.outlier_analysis.length > 0 && (
            <section className="card">
              <div className="card-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ margin: 0 }}>Statistical Outlier Assessment</h2>
                  <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #cbd5e1' }}>Z-Score &gt; 3.0</span>
                </div>
                <p style={{ marginTop: '6px' }}>Identified mathematical anomalies and calculated official capping thresholds for risk mitigation.</p>
              </div>

              {/* ── FEATURE RISK SCATTER PLOT ───────────────────────────── */}
              <div style={{ padding: '24px 0', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 24px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portfolio Anomaly Spread</h3>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}/> Safe (&lt;1%)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }}/> Warning (1-5%)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}/> Danger (&gt;5%)</span>
                  </div>
                </div>
                
                <div style={{ width: '100%', height: `${Math.max(scatterData.length * 40, 250)}px` }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                      <XAxis type="number" dataKey="x" name="Impact" unit="%" axisLine={{ stroke: '#cbd5e1' }} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} />
                      <YAxis type="category" dataKey="name" name="Feature" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                      <ZAxis type="number" dataKey="count" range={[60, 250]} name="Anomalies" />
                      
                      <ReferenceArea x1={0} x2={1} fill="#dcfce7" fillOpacity={0.2} />
                      <ReferenceArea x1={1} x2={5} fill="#ffedd5" fillOpacity={0.2} />
                      <ReferenceArea x1={5} x2={Math.max(10, ...scatterData.map(d => d.x))} fill="#fee2e2" fillOpacity={0.2} />
                      
                      <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                      
                      <Scatter data={scatterData}>
                        {scatterData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── TOGGLE BUTTON FOR ENTIRE TABLE ───────────────────── */}
              <div style={{ padding: '12px 24px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => setShowOutlierTable(!showOutlierTable)}
                  style={{ 
                    background: '#ffffff', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '8px', 
                    padding: '8px 24px', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    color: '#334155', 
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#ffffff'}
                >
                  {showOutlierTable ? 'Hide Detailed Data Table ▲' : 'View Detailed Data Table ▼'}
                </button>
              </div>

              {/* ── DETAILED DATA TABLE (Hidden by default, no individual dropdowns) ─────────────── */}
              {showOutlierTable && (
                <div style={{ overflowX: 'auto', borderTop: '1px solid #e2e8f0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#ffffff', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px' }}>
                        <th style={{ padding: '14px 16px', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>Target Feature</th>
                        <th style={{ padding: '14px 16px', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>Anomaly Count</th>
                        <th style={{ padding: '14px 16px', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>Portfolio Impact (% of Total)</th>
                        <th style={{ padding: '14px 16px', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>Suggested Lower Floor (1st Pctl)</th>
                        <th style={{ padding: '14px 16px', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>Suggested Upper Cap (99th Pctl)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultData.outlier_analysis.map((outlier, idx) => {
                        const sev = outlier.outlier_percentage > 5 ? 'High' : outlier.outlier_percentage > 1 ? 'Medium' : 'Low';
                        const barColor = SEVERITY_STYLES[sev].bar;
                        const fillPercentage = Math.min((outlier.outlier_percentage / 10) * 100, 100);

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                            
                            <td style={{ padding: '16px', fontWeight: 700, color: '#0f172a' }}>
                              {outlier.column}
                            </td>
                            
                            <td style={{ padding: '16px', color: '#0f172a', fontWeight: 500 }}>
                              {outlier.outlier_count.toLocaleString()} records
                            </td>
                            
                            <td style={{ padding: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <SeverityBadge severity={sev} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexGrow: 1, maxWidth: '120px' }}>
                                  <span style={{ fontWeight: 600, color: '#475569', minWidth: '35px' }}>{outlier.outlier_percentage}%</span>
                                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${fillPercentage}%`, height: '100%', background: barColor, borderRadius: '3px' }} />
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            <td style={{ padding: '16px' }}>
                              <span style={{ background: '#f1f5f9', color: '#334155', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', border: '1px solid #e2e8f0' }}>
                                ≥ {outlier.suggested_cap_lower.toLocaleString()}
                              </span>
                            </td>
                            
                            <td style={{ padding: '16px' }}>
                              <span style={{ background: '#f1f5f9', color: '#334155', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', border: '1px solid #e2e8f0' }}>
                                ≤ {outlier.suggested_cap_upper.toLocaleString()}
                              </span>
                            </td>
                            
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', padding: '6px', background: '#e2e8f0', borderRadius: '12px', width: 'fit-content' }}>
              <button
                onClick={() => setViewMode('rules')}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: viewMode === 'rules' ? '#ffffff' : 'transparent', fontWeight: viewMode === 'rules' ? 700 : 500, color: viewMode === 'rules' ? '#0f172a' : '#64748b', cursor: 'pointer', boxShadow: viewMode === 'rules' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s', fontSize: '14px' }}
              >
                Standard Rule-Based Report
              </button>
              <button
                onClick={() => setViewMode('ai')}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: viewMode === 'ai' ? '#ffffff' : 'transparent', fontWeight: viewMode === 'ai' ? 700 : 500, color: viewMode === 'ai' ? '#2563eb' : '#64748b', cursor: 'pointer', boxShadow: viewMode === 'ai' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s', fontSize: '14px' }}
              >
                Agent-Based Report
              </button>
            </div>
          </div>

          {viewMode === 'rules' ? (
            <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
              <section className="card">
                <div className="card-header">
                  <h2>Issue Log</h2>
                  <p>Automatically detected data quality issues via deterministic rules.</p>
                </div>

                {issueLog.length === 0 ? (
                  <p style={{ marginTop: '1.5rem', color: '#15803d', fontWeight: 600, fontSize: '0.95rem' }}>✓ No issues detected. Dataset passed all quality checks.</p>
                ) : (
                  <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {missingValueIssues.length > 0 && (
                      <GroupedIssueCard title="Missing Values" severity={highestSeverity(missingValueIssues)} summary={`Affected Columns: ${missingValueIssues.length}`} details={missingValueIssues.map((i, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9', gap: '12px' }}>
                            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{i.column}</span>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                              <span style={{ color: '#64748b', fontSize: '12px' }}>{i.missing_count?.toLocaleString()} missing ({i.missing_percentage}%)</span>
                              <SeverityBadge severity={i.severity} />
                            </div>
                          </div>
                        ))}
                      />
                    )}
                    {duplicateIssues.length > 0 && (
                      <GroupedIssueCard title="Duplicate Identifier Records" severity={highestSeverity(duplicateIssues)} summary={`Affected Records: ${duplicateIssues.length}`} details={duplicateIssues.map((i, index) => (
                          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9', gap: '12px' }}>
                            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{i.detail || i.customer_id || `Row Duplicate #${index + 1}`}</span>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                              <span style={{ color: '#64748b', fontSize: '12px' }}>Duplicate Record</span>
                              <SeverityBadge severity={i.severity} />
                            </div>
                          </div>
                        ))}
                      />
                    )}
                    {otherIssues.map((item, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                        <div><p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{item.issue}</p><p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>{item.detail}</p></div>
                        <div style={{ flexShrink: 0 }}><SeverityBadge severity={item.severity} /></div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="card">
                <div className="card-header">
                  <h2>Remediation Recommendations</h2>
                  <p>Suggested static actions to resolve detected issues.</p>
                </div>

                {recommendations.length === 0 ? (
                  <p style={{ marginTop: '1.5rem', color: '#15803d', fontWeight: 600, fontSize: '0.95rem' }}>✓ No recommendations. Dataset is clean and ready for analysis.</p>
                ) : (
                  <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {missingRecs.length > 0 && (() => {
                      const idx = currentCardIndex++;
                      return (
                        <GroupedRecCard index={idx} title="Missing Values" severity={highestSeverity(missingRecs)} summary={`Affected Columns: ${missingRecs.length}`} bullets={['Apply mean or median imputation for numeric columns.', 'Use the most frequent value or "Unknown" for categorical columns.', 'Exclude columns where the missing rate exceeds 40%.', 'Investigate upstream data pipelines for root cause.']} details={missingRecs.map((r, idx2) => (
                            <div key={idx2} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                              <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{r.column || 'Unknown Column'} <SeverityBadge severity={r.severity} /></p>
                              <p style={{ margin: 0, color: '#475569', fontSize: '12px' }}>{r.recommendation}</p>
                            </div>
                          ))}
                        />
                      );
                    })()}
                    {duplicateRecs.length > 0 && (() => {
                      const idx = currentCardIndex++;
                      return (
                        <GroupedRecCard index={idx} title="Duplicate Customer Records" severity={highestSeverity(duplicateRecs)} summary={`Affected Records: ${duplicateRecs.length}`} bullets={['Retain the most recent record per customer ID.', 'Remove all other duplicate records before modelling.', 'Investigate the data ingestion pipeline to prevent recurrence.', 'Implement a uniqueness constraint on the Customer ID column.']} details={duplicateRecs.map((r, idx2) => (
                            <div key={idx2} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                              <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#2563eb', fontSize: '13px' }}>{r.customer_id || r.column || `Duplicate Item #${idx2 + 1}`} <SeverityBadge severity={r.severity} /></p>
                              <p style={{ margin: 0, color: '#475569', fontSize: '12px' }}>{r.recommendation}</p>
                            </div>
                          ))}
                        />
                      );
                    })()}
                    {otherRecs.map((item, index) => {
                      const s = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.Low;
                      const idx = currentCardIndex++;
                      return (
                        <div key={index} style={{ padding: '16px 18px', border: '1px solid #e2e8f0', borderLeft: `4px solid ${s.border}`, borderRadius: '12px', background: '#f8fafc' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx}</span>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{item.issue || 'Data Issue'}</span>
                            <SeverityBadge severity={item.severity} />
                          </div>
                          <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.7 }}>{item.recommendation}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s ease-in-out', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* <section className="card" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
                <div className="card-header" style={{ borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
                  <h2 style={{ color: '#ffffff', margin: 0 }}>⚙️ Debugger: Live LLM Input Payload</h2>
                  <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '13px' }}>This is the exact compressed JSON context fed to the AI Agent.</p>
                </div>
                <pre style={{ margin: '16px 0 0', padding: '16px', background: '#1e293b', borderRadius: '8px', overflowX: 'auto', fontSize: '13px', fontFamily: 'monospace', color: '#34d399' }}>
                  {JSON.stringify(debugPayloadForLLM, null, 2)}
                </pre>
              </section> */}

              <InsightsPanel title="Context-Aware Risk Assessment" description={aiAssessment.executive_summary} items={aiAssessment.business_impacts} tone="warning" />

              <section className="card">
                <div className="card-header">
                  <h2>✨ Context-Aware Remediation Strategies</h2>
                  <p>Semantic business logic generated by the Model Risk AI Agent.</p>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {aiAssessment.ai_recommendations.map((rec, idx) => (
                    <div key={idx} style={{ padding: '16px 20px', border: '1px solid #e2e8f0', borderLeft: `4px solid #3b82f6`, borderRadius: '12px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>{rec.column}</span>
                        <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>{rec.strategy}</span>
                      </div>
                      <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.7 }}><strong style={{ color: '#0f172a' }}>Justification:</strong> {rec.justification}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </main>
  )
}

// import { useRef, useState } from 'react'
// import { uploadDataQuality } from '../services/api'
// import MissingValueAnalysis from '../components/MissingValueAnalysis'
// import DuplicateCustomerAnalysis from '../components/DuplicateCustomerAnalysis'
// import InsightsPanel from '../components/InsightsPanel' 

// function formatCount(value) {
//   if (value == null || Number.isNaN(Number(value))) return '—'
//   return Number(value).toLocaleString()
// }

// const SEVERITY_STYLES = {
//   Critical: { background: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
//   High:     { background: '#fff7ed', color: '#c2410c', border: '#fdba74' },
//   Medium:   { background: '#fefce8', color: '#a16207', border: '#fde047' },
//   Low:      { background: '#f0fdf4', color: '#15803d', border: '#86efac' },
// }

// function SeverityBadge({ severity }) {
//   const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Low
//   return (
//     <span style={{
//       padding: '3px 10px',
//       borderRadius: '999px',
//       fontSize: '12px',
//       fontWeight: 700,
//       background: s.background,
//       color: s.color,
//       border: `1px solid ${s.border}`,
//       whiteSpace: 'nowrap',
//     }}>
//       {severity}
//     </span>
//   )
// }

// function GroupedIssueCard({ title, severity, summary, details }) {
//   const [open, setOpen] = useState(false)
//   return (
//     <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', overflow: 'hidden' }}>
//       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', flexWrap: 'wrap', gap: '10px' }}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
//           <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{title}</span>
//           <SeverityBadge severity={severity} />
//           <span style={{ color: '#64748b', fontSize: '13px' }}>{summary}</span>
//         </div>
//         <button 
//           type="button" 
//           onClick={() => setOpen(p => !p)} 
//           style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#2563eb' }}
//         >
//           {open ? 'Hide Details \u25B2' : 'Show Details \u25BC'}
//         </button>
//       </div>
//       {open && (
//         <div style={{ padding: '0 16px 14px', borderTop: '1px solid #e2e8f0' }}>
//           <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column' }}>{details}</div>
//         </div>
//       )}
//     </div>
//   )
// }

// function GroupedRecCard({ index, title, severity, summary, bullets, details }) {
//   const [open, setOpen] = useState(false)
//   const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Low
//   return (
//     <div style={{ padding: '16px 18px', border: '1px solid #e2e8f0', borderLeft: `4px solid ${s.border}`, borderRadius: '12px', background: '#f8fafc' }}>
//       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
//           <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{index}</span>
//           <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{title}</span>
//           <SeverityBadge severity={severity} />
//           <span style={{ color: '#64748b', fontSize: '13px' }}>{summary}</span>
//         </div>
//         <button 
//           type="button" 
//           onClick={() => setOpen(p => !p)} 
//           style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#2563eb' }}
//         >
//           {open ? 'Hide Details \u25B2' : 'Show Details \u25BC'}
//         </button>
//       </div>
//       <ul style={{ margin: '0 0 0 8px', padding: '0 0 0 16px', color: '#475569', fontSize: '13px', lineHeight: 1.8 }}>
//         {bullets.map((b, i) => <li key={i}>{b}</li>)}
//       </ul>
//       {open && details && details.length > 0 && (
//         <div style={{ marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
//           <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Per-Record Details</p>
//           {details}
//         </div>
//       )}
//     </div>
//   )
// }

// export default function DataQualityAssessment() {
//   const fileInputRef = useRef(null)

//   const [selectedFile, setSelectedFile] = useState(null)
//   const [result, setResult] = useState(null)
//   const [isLoading, setIsLoading] = useState(false)
//   const [errorMessage, setErrorMessage] = useState('')
  
//   // ── AI Toggle State ──────────────────────────────────────────────────
//   const [viewMode, setViewMode] = useState('rules') // 'rules' | 'ai'

//   const handleFileChange = (e) => {
//     const file = e.target.files?.[0] ?? null
//     setSelectedFile(file)
//     setErrorMessage('')
//   }

//   const handleUploadClick = () => {
//     fileInputRef.current?.click()
//   }

//   const handleRunAssessment = async () => {
//     if (!selectedFile) {
//       setErrorMessage('Please upload a CSV or XLSX file first.')
//       return
//     }

//     setIsLoading(true)
//     setErrorMessage('')

//     try {
//       const data = await uploadDataQuality(selectedFile)
//       setResult(data)
//     } catch (error) {
//       setErrorMessage(error instanceof Error ? error.message : 'Assessment failed.')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const resultData   = result?.data || result
//   const issueLog     = resultData?.issue_log     ?? []
//   const recommendations = resultData?.recommendations ?? []
  
//   // ── Mock AI Data for Demo (Fallback if backend doesn't send ai_assessment yet) ──
//   const mockAIAssessment = {
//     executive_summary: "The portfolio exhibits high risk due to a systemic duplication failure and extreme value outliers which threaten model integrity.",
//     business_impacts: [
//       "Extreme outliers detected in numeric limits. Retaining these records un-capped will artificially skew the KS statistic and overall portfolio Gini coefficient.",
//       "Dropping the 'LIMIT_BAL' feature due to missingness will severely degrade model predictive power.",
//       "Systemic duplication pattern indicates a pipeline JOIN error rather than manual entry errors."
//     ],
//     ai_recommendations: [
//       {
//         column: "EDUCATION",
//         strategy: "Stratified Mode Imputation",
//         justification: "As a categorical demographic feature, mean imputation is mathematically invalid. Impute using KNN stratified by AGE to preserve demographic fairness."
//       },
//       {
//         column: "LIMIT_BAL",
//         strategy: "Apply Upper Cap (99th Percentile)",
//         justification: "Massive outliers detected. Dropping these rows removes 2% of total data. Apply the suggested upper cap to normalize the distribution without losing behavioral history."
//       }
//     ]
//   }
  
//   const aiAssessment = resultData?.ai_assessment || mockAIAssessment;

//   const missingValueIssues    = issueLog.filter(i => i.issue === 'Missing Values')
//   const duplicateIssues       = issueLog.filter(i => i.issue === 'Duplicate Identifier Record' || i.issue === 'Duplicate Customer Record')
//   const otherIssues           = issueLog.filter(i => i.issue !== 'Missing Values' && i.issue !== 'Duplicate Identifier Record' && i.issue !== 'Duplicate Customer Record')

//   const missingRecs    = recommendations.filter(r => r.issue === 'Missing Values')
//   const duplicateRecs  = recommendations.filter(r => r.issue === 'Duplicate Customer Record' || r.issue === 'Duplicate Identifier Record')
//   const otherRecs      = recommendations.filter(r => r.issue !== 'Missing Values' && r.issue !== 'Duplicate Customer Record' && r.issue !== 'Duplicate Identifier Record')

//   const highestSeverity = (items) => {
//     const order = { High: 3, Medium: 2, Low: 1, Critical: 4 }
//     return items.reduce((best, i) => (order[i.severity] ?? 0) > (order[best] ?? 0) ? i.severity : best, items[0]?.severity ?? 'Low')
//   }

//   let currentCardIndex = 1;
  
//   // ── Debug Payload with OUTLIERS Added ────────────────────────────────
//   const debugPayloadForLLM = {
//     profile: resultData?.dataset_profile,
//     missing_data: resultData?.missing_value_analysis,
//     outliers_detected: resultData?.outlier_analysis?.slice(0, 5), // Passes only the worst 5 outliers to the AI
//     duplicates_sample: resultData?.duplicate_analysis?.slice(0, 5)
//   };

//   return (
//     <main className="dashboard-main">

//       {/* ── Upload Section ───────────────────────────────────────────────── */}
//       {!isLoading && !result && (
//         <section className="card">
//           <div className="card-header">
//             <h2>Data Quality Assessment</h2>
//             <p>Upload a credit portfolio file to assess data quality.</p>
//           </div>

//           <div className="upload-actions">
//             <input
//               ref={fileInputRef}
//               type="file"
//               accept=".csv,.xlsx"
//               onChange={handleFileChange}
//               className="file-input"
//             />
//             <button type="button" className="btn btn-secondary" onClick={handleUploadClick}>
//               Choose File
//             </button>
//             <button
//               type="button"
//               className="btn btn-primary"
//               onClick={handleRunAssessment}
//               disabled={isLoading}
//             >
//               {isLoading && <span className="spinner" aria-hidden="true" />}
//               {isLoading ? 'Running Assessment...' : 'Run Assessment'}
//             </button>
//           </div>

//           {errorMessage && (
//             <div className="error-banner" role="alert">
//               {errorMessage}
//             </div>
//           )}

//           <p className="upload-hint">
//             {selectedFile
//               ? `Selected file: ${selectedFile.name}`
//               : 'Supported formats: CSV, XLSX'}
//           </p>
//         </section>
//       )}

//       {/* ── Loading State ────────────────────────────────────────────────── */}
//       {isLoading && (
//         <div className="loading-banner" role="status" aria-live="polite">
//           <span className="spinner spinner-lg" aria-hidden="true" />
//           <span>Running data quality assessment...</span>
//         </div>
//       )}

//       {/* ── Placeholder ──────────────────────────────────────────────────── */}
//       {!result && !isLoading && (
//         <div className="placeholder-state">
//           <div className="placeholder-icon" aria-hidden="true">🔍</div>
//           <h2 className="placeholder-title">No assessment available</h2>
//           <p className="placeholder-body">
//             Upload a CSV/XLSX file and click <strong>Run Assessment</strong> to
//             generate a data quality report.
//           </p>
//         </div>
//       )}

//       {/* ── Results ──────────────────────────────────────────────────────── */}
//       {result && (
//         <>
//           {/* ── Dataset Profile (Always visible) ─────────────────────────── */}
//           <section className="card">
//             <div className="card-header">
//               <h2>Dataset Profile</h2>
//               <p>Structural overview for: <strong>{selectedFile?.name}</strong></p>
//             </div>

//             <div className="summary-grid" style={{ marginTop: '1.5rem' }}>
//               <div className="summary-item">
//                 <span className="summary-label">Total Rows</span>
//                 <strong>{formatCount(resultData?.dataset_profile?.total_rows)}</strong>
//               </div>
//               <div className="summary-item">
//                 <span className="summary-label">Total Columns</span>
//                 <strong>{formatCount(resultData?.dataset_profile?.total_columns)}</strong>
//               </div>
//               <div className="summary-item">
//                 <span className="summary-label">Numeric Columns</span>
//                 <strong>{formatCount(resultData?.dataset_profile?.numeric_columns)}</strong>
//               </div>
//               <div className="summary-item">
//                 <span className="summary-label">Categorical Columns</span>
//                 <strong>{formatCount(resultData?.dataset_profile?.categorical_columns)}</strong>
//               </div>
//               <div className="summary-item">
//                 <span className="summary-label">Columns With Missing Values</span>
//                 <strong>{formatCount(resultData?.missing_value_analysis?.length ?? 0)}</strong>
//               </div>
//               <div className="summary-item">
//                 <span className="summary-label">Duplicate Customer IDs</span>
//                 <strong>{formatCount(resultData?.duplicate_analysis?.length ?? 0)}</strong>
//               </div>
//             </div>

//             {/* Re-run controls */}
//             <div style={{ marginTop: '1.5rem', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept=".csv,.xlsx"
//                 onChange={handleFileChange}
//                 className="file-input"
//               />
//               <button type="button" className="btn btn-secondary" onClick={handleUploadClick}>
//                 Choose File
//               </button>
//               <button
//                 type="button"
//                 className="btn btn-primary"
//                 onClick={handleRunAssessment}
//                 disabled={isLoading || !selectedFile}
//               >
//                 {isLoading && <span className="spinner" aria-hidden="true" />}
//                 {isLoading ? 'Running Assessment...' : 'Re-run Assessment'}
//               </button>
//               {selectedFile && (
//                 <span className="upload-hint" style={{ margin: 0 }}>
//                   {selectedFile.name}
//                 </span>
//               )}
//             </div>

//             {errorMessage && (
//               <div className="error-banner" role="alert" style={{ marginTop: '1rem' }}>
//                 {errorMessage}
//               </div>
//             )}
//           </section>

//           {/* ── Missing Value Analysis (Always Visible) ───────────────────── */}
//           {resultData?.missing_value_analysis && (
//             <MissingValueAnalysis
//               missingValueAnalysis={resultData.missing_value_analysis}
//             />
//           )}

//           {/* ── Duplicate Customer Analysis (Always Visible) ──────────────── */}
//           {resultData?.duplicate_analysis && (
//             <DuplicateCustomerAnalysis
//               duplicateAnalysis={resultData.duplicate_analysis}
//             />
//           )}

//           {/* ── NEW: Statistical Outlier Analysis (Always Visible) ────────── */}
//           {resultData?.outlier_analysis && resultData.outlier_analysis.length > 0 && (
//             <section className="card">
//               <div className="card-header">
//                 <h2>Statistical Outliers (Z-Score &gt; 3)</h2>
//                 <p>Identified numerical anomalies and calculated capping thresholds (1st / 99th percentiles).</p>
//               </div>
//               <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
//                 <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
//                   <thead>
//                     <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
//                       <th style={{ padding: '12px 16px', fontWeight: 600 }}>Feature</th>
//                       <th style={{ padding: '12px 16px', fontWeight: 600 }}>Outliers Count</th>
//                       <th style={{ padding: '12px 16px', fontWeight: 600 }}>% of Total</th>
//                       <th style={{ padding: '12px 16px', fontWeight: 600 }}>Lower Cap (1st)</th>
//                       <th style={{ padding: '12px 16px', fontWeight: 600 }}>Upper Cap (99th)</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {resultData.outlier_analysis.map((outlier, idx) => {
//                       const sev = outlier.outlier_percentage > 5 ? 'High' : outlier.outlier_percentage > 1 ? 'Medium' : 'Low';
//                       return (
//                         <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
//                           <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{outlier.column}</td>
//                           <td style={{ padding: '12px 16px', color: '#b91c1c', fontWeight: 600 }}>{outlier.outlier_count.toLocaleString()}</td>
//                           <td style={{ padding: '12px 16px' }}>
//                             <SeverityBadge severity={sev} />
//                             <span style={{ marginLeft: '8px', color: '#64748b' }}>{outlier.outlier_percentage}%</span>
//                           </td>
//                           <td style={{ padding: '12px 16px', color: '#475569' }}>{outlier.suggested_cap_lower.toLocaleString()}</td>
//                           <td style={{ padding: '12px 16px', color: '#475569' }}>{outlier.suggested_cap_upper.toLocaleString()}</td>
//                         </tr>
//                       )
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </section>
//           )}

//           {/* ── THE TOGGLE SWITCH ────────────────────────────────────────── */}
//           <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px', marginBottom: '16px' }}>
//             <div style={{ 
//                 display: 'flex', 
//                 gap: '8px', 
//                 padding: '6px', 
//                 background: '#e2e8f0', 
//                 borderRadius: '12px', 
//                 width: 'fit-content' 
//             }}>
//               <button
//                 onClick={() => setViewMode('rules')}
//                 style={{
//                   padding: '10px 20px',
//                   borderRadius: '8px',
//                   border: 'none',
//                   background: viewMode === 'rules' ? '#ffffff' : 'transparent',
//                   fontWeight: viewMode === 'rules' ? 700 : 500,
//                   color: viewMode === 'rules' ? '#0f172a' : '#64748b',
//                   cursor: 'pointer',
//                   boxShadow: viewMode === 'rules' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
//                   transition: 'all 0.2s',
//                   fontSize: '14px'
//                 }}
//               >
//                 Standard Rule-Based Report
//               </button>
//               <button
//                 onClick={() => setViewMode('ai')}
//                 style={{
//                   padding: '10px 20px',
//                   borderRadius: '8px',
//                   border: 'none',
//                   background: viewMode === 'ai' ? '#ffffff' : 'transparent',
//                   fontWeight: viewMode === 'ai' ? 700 : 500,
//                   color: viewMode === 'ai' ? '#2563eb' : '#64748b',
//                   cursor: 'pointer',
//                   boxShadow: viewMode === 'ai' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
//                   transition: 'all 0.2s',
//                   fontSize: '14px'
//                 }}
//               >
//                 ✨ AI Agent Assessment
//               </button>
//             </div>
//           </div>

//           {/* ── RENDER BASED ON TOGGLE ───────────────────────────────────── */}
//           {viewMode === 'rules' ? (
//             <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
//               {/* ── Standard Issue Log ────────────────────────────────────── */}
//               <section className="card">
//                 <div className="card-header">
//                   <h2>Issue Log</h2>
//                   <p>Automatically detected data quality issues via deterministic rules.</p>
//                 </div>

//                 {issueLog.length === 0 ? (
//                   <p style={{ marginTop: '1.5rem', color: '#15803d', fontWeight: 600, fontSize: '0.95rem' }}>
//                     ✓ No issues detected. Dataset passed all quality checks.
//                   </p>
//                 ) : (
//                   <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>

//                     {/* Missing Values group */}
//                     {missingValueIssues.length > 0 && (
//                       <GroupedIssueCard
//                         title="Missing Values"
//                         severity={highestSeverity(missingValueIssues)}
//                         summary={`Affected Columns: ${missingValueIssues.length}`}
//                         details={missingValueIssues.map((i, idx) => (
//                           <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9', gap: '12px' }}>
//                             <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{i.column}</span>
//                             <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
//                               <span style={{ color: '#64748b', fontSize: '12px' }}>{i.missing_count?.toLocaleString()} missing ({i.missing_percentage}%)</span>
//                               <SeverityBadge severity={i.severity} />
//                             </div>
//                           </div>
//                         ))}
//                       />
//                     )}

//                     {/* Duplicate Identifier Records group */}
//                     {duplicateIssues.length > 0 && (
//                       <GroupedIssueCard
//                         title="Duplicate Identifier Records"
//                         severity={highestSeverity(duplicateIssues)}
//                         summary={`Affected Records: ${duplicateIssues.length}`}
//                         details={duplicateIssues.map((i, index) => (
//                           <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9', gap: '12px' }}>
//                             <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
//                               {i.detail || i.customer_id || `Row Duplicate #${index + 1}`}
//                             </span>
//                             <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
//                               <span style={{ color: '#64748b', fontSize: '12px' }}>Duplicate Record</span>
//                               <SeverityBadge severity={i.severity} />
//                             </div>
//                           </div>
//                         ))}
//                       />
//                     )}

//                     {/* Other issues */}
//                     {otherIssues.map((item, index) => (
//                       <div key={index} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
//                         <div>
//                           <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{item.issue}</p>
//                           <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>{item.detail}</p>
//                         </div>
//                         <div style={{ flexShrink: 0 }}><SeverityBadge severity={item.severity} /></div>
//                       </div>
//                     ))}

//                   </div>
//                 )}
//               </section>

//               {/* ── Standard Remediation Recommendations ──────────────────── */}
//               <section className="card">
//                 <div className="card-header">
//                   <h2>Remediation Recommendations</h2>
//                   <p>Suggested static actions to resolve detected issues.</p>
//                 </div>

//                 {recommendations.length === 0 ? (
//                   <p style={{ marginTop: '1.5rem', color: '#15803d', fontWeight: 600, fontSize: '0.95rem' }}>
//                     ✓ No recommendations. Dataset is clean and ready for analysis.
//                   </p>
//                 ) : (
//                   <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>

//                     {/* Missing Values grouped recommendation */}
//                     {missingRecs.length > 0 && (() => {
//                       const idx = currentCardIndex++;
//                       return (
//                         <GroupedRecCard
//                           index={idx}
//                           title="Missing Values"
//                           severity={highestSeverity(missingRecs)}
//                           summary={`Affected Columns: ${missingRecs.length}`}
//                           bullets={[
//                             'Apply mean or median imputation for numeric columns.',
//                             'Use the most frequent value or "Unknown" for categorical columns.',
//                             'Exclude columns where the missing rate exceeds 40%.',
//                             'Investigate upstream data pipelines for root cause.',
//                           ]}
//                           details={missingRecs.map((r, idx2) => (
//                             <div key={idx2} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
//                               <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
//                                 {r.column || 'Unknown Column'} <SeverityBadge severity={r.severity} />
//                               </p>
//                               <p style={{ margin: 0, color: '#475569', fontSize: '12px' }}>{r.recommendation}</p>
//                             </div>
//                           ))}
//                         />
//                       );
//                     })()}

//                     {/* Duplicate Customer Records grouped recommendation */}
//                     {duplicateRecs.length > 0 && (() => {
//                       const idx = currentCardIndex++;
//                       return (
//                         <GroupedRecCard
//                           index={idx}
//                           title="Duplicate Customer Records"
//                           severity={highestSeverity(duplicateRecs)}
//                           summary={`Affected Records: ${duplicateRecs.length}`}
//                           bullets={[
//                             'Retain the most recent record per customer ID.',
//                             'Remove all other duplicate records before modelling.',
//                             'Investigate the data ingestion pipeline to prevent recurrence.',
//                             'Implement a uniqueness constraint on the Customer ID column.',
//                           ]}
//                           details={duplicateRecs.map((r, idx2) => (
//                             <div key={idx2} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
//                               <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#2563eb', fontSize: '13px' }}>
//                                 {r.customer_id || r.column || `Duplicate Item #${idx2 + 1}`} <SeverityBadge severity={r.severity} />
//                               </p>
//                               <p style={{ margin: 0, color: '#475569', fontSize: '12px' }}>{r.recommendation}</p>
//                             </div>
//                           ))}
//                         />
//                       );
//                     })()}

//                     {/* Other recommendations */}
//                     {otherRecs.map((item, index) => {
//                       const s = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.Low;
//                       const idx = currentCardIndex++;
//                       return (
//                         <div key={index} style={{ padding: '16px 18px', border: '1px solid #e2e8f0', borderLeft: `4px solid ${s.border}`, borderRadius: '12px', background: '#f8fafc' }}>
//                           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
//                             <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx}</span>
//                             <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{item.issue || 'Data Issue'}</span>
//                             <SeverityBadge severity={item.severity} />
//                           </div>
//                           <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.7 }}>{item.recommendation}</p>
//                         </div>
//                       )
//                     })}

//                   </div>
//                 )}
//               </section>
//             </div>
//           ) : (
//             <div style={{ animation: 'fadeIn 0.3s ease-in-out', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
//               {/* ── ⚙️ LIVE LLM PAYLOAD DEBUGGER ───────────────────────────── */}
//               <section className="card" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
//                 <div className="card-header" style={{ borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
//                   <h2 style={{ color: '#ffffff', margin: 0 }}>⚙️ Debugger: Live LLM Input Payload</h2>
//                   <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '13px' }}>This is the exact compressed JSON context fed to the AI Agent.</p>
//                 </div>
//                 <pre style={{ 
//                   margin: '16px 0 0', 
//                   padding: '16px', 
//                   background: '#1e293b', 
//                   borderRadius: '8px', 
//                   overflowX: 'auto',
//                   fontSize: '13px',
//                   fontFamily: 'monospace',
//                   color: '#34d399'
//                 }}>
//                   {JSON.stringify(debugPayloadForLLM, null, 2)}
//                 </pre>
//               </section>

//               {/* ── AI Executive Summary ───────────────────────────────────── */}
//               <InsightsPanel 
//                 title="Context-Aware Risk Assessment" 
//                 description={aiAssessment.executive_summary}
//                 items={aiAssessment.business_impacts}
//                 tone="warning"
//               />

//               {/* ── AI Context-Aware Recommendations ───────────────────────── */}
//               <section className="card">
//                 <div className="card-header">
//                   <h2>✨ Context-Aware Remediation Strategies</h2>
//                   <p>Semantic business logic generated by the Model Risk AI Agent.</p>
//                 </div>
                
//                 <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
//                   {aiAssessment.ai_recommendations.map((rec, idx) => (
//                     <div key={idx} style={{ 
//                       padding: '16px 20px', 
//                       border: '1px solid #e2e8f0', 
//                       borderLeft: `4px solid #3b82f6`, 
//                       borderRadius: '12px', 
//                       background: '#f8fafc' 
//                     }}>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
//                         <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>{rec.column}</span>
//                         <span style={{ 
//                           padding: '4px 12px', 
//                           borderRadius: '999px', 
//                           fontSize: '12px', 
//                           fontWeight: 700, 
//                           background: '#eff6ff', 
//                           color: '#2563eb', 
//                           border: '1px solid #bfdbfe' 
//                         }}>
//                           {rec.strategy}
//                         </span>
//                       </div>
//                       <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: 1.7 }}>
//                         <strong style={{ color: '#0f172a' }}>Justification:</strong> {rec.justification}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               </section>

//             </div>
//           )}

//         </>
//       )}
//     </main>
//   )
// }


