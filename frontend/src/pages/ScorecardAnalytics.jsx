import { useState, useEffect, useRef } from 'react'
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Legend
} from 'recharts'

import ScoreBandValidationChart from '../components/ScoreBandValidationChart'
import PDDecileValidationChart from '../components/PDDecileValidationChart'
import InsightsPanel from '../components/InsightsPanel'

function EmptyState({ icon, message }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', gap: '10px', marginTop: '16px' }}>
      <span style={{ fontSize: '36px', opacity: 0.4 }}>{icon}</span>
      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{message}</p>
    </div>
  )
}

export default function ScorecardAnalytics({ analysisResult, setAnalysisResult }) {
  const [history, setHistory] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Sync history when analysisResult changes (e.g. from Dashboard upload)
  useEffect(() => {
    if (analysisResult?.history) {
      setHistory(analysisResult.history)
    } else {
      // Fallback fetch
      fetch('http://localhost:8000/monitoring-history')
        .then(res => res.json())
        .then(data => { if (data.history) setHistory(data.history) })
        .catch(err => console.error("Failed to fetch history", err))
    }
  }, [analysisResult])

  // Smartly calculate what the next quarter should be
  const currentQNum = history.length > 0 ? history.length : 1
  const nextQuarterLabel = `Q${currentQNum + 1}`

  const handleUploadNextQuarter = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('quarter_label', nextQuarterLabel)

    try {
      const res = await fetch('http://localhost:8000/upload-quarter', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.history) {
        setHistory(data.history)
        // This instantly updates all the top charts to the new quarter!
        if (setAnalysisResult) setAnalysisResult(data)
      }
    } catch (err) {
      alert('Upload failed. Ensure backend is running.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // If no data is loaded at all, prompt them to start at the dashboard
  if (!analysisResult) {
    return (
      <main className="dashboard-main analytics-page">
        <EmptyState icon="📊" message="Upload your initial dataset on the Dashboard to view Scorecard Analytics" />
      </main>
    )
  }

  // ── Existing Deep Dive Calculations ──
  const scoreBandData = analysisResult.score_band_analysis || []
  const pdDecileData = analysisResult.pd_decile_analysis || []
  const noData = 'Run an analysis from the Dashboard to view this chart'

  const totalCustomers = scoreBandData.reduce((sum, item) => sum + (item.customer_count || 0), 0)
  const totalDecileCustomers = pdDecileData.reduce((sum, item) => sum + (item.customer_count || 0), 0)

  const scoreBandRows = scoreBandData.map((item) => ({
    scoreBand: item.score_band,
    customerCount: item.customer_count || 0,
    avgPd: item.average_pd || 0,
    actualBadRate: item.actual_bad_rate || 0,
    portfolioPct: totalCustomers ? ((item.customer_count || 0) / totalCustomers) * 100 : 0,
  }))

  const decileRows = pdDecileData.map((item) => ({
    decile: item.decile,
    avgPd: item.average_pd || 0,
    actualBadRate: item.actual_bad_rate || 0,
    customerCount: item.customer_count || 0,
  }))

  const cumulativeLift = pdDecileData.map((item, index) => {
    const cumulativeCustomers = pdDecileData.slice(0, index + 1).reduce((sum, row) => sum + (row.customer_count || 0), 0)
    const cumulativeBadRate = pdDecileData.slice(0, index + 1).reduce((sum, row) => sum + ((row.actual_bad_rate || 0) * (row.customer_count || 0)), 0) / Math.max(cumulativeCustomers, 1)
    return {
      decile: `D${index + 1}`,
      cumulativeCustomers,
      cumulativeBadRate,
      cumulativeShare: totalDecileCustomers ? (cumulativeCustomers / totalDecileCustomers) * 100 : 0,
    }
  }).filter((item) => item.cumulativeCustomers > 0)

  // ── Trend Calculations ──
  const latestQ = history[history.length - 1]
  const prevQ = history.length > 1 ? history[history.length - 2] : null
  const getTrend = (current, previous) => {
    if (!prevQ || current == null || previous == null) return null
    const diff = current - previous
    return { value: diff, isPositive: diff > 0 }
  }

  return (
    <main className="dashboard-main analytics-page">
      
      {/* ── TOP SECTION: DEEP DIVE (CURRENT QUARTER) ── */}
      <section className="card analytics-header-card" style={{ marginBottom: '24px' }}>
        <div className="card-header analytics-header">
          <div>
            <h2 style={{ fontSize: '24px', color: '#0f172a' }}>Scorecard Snapshot (Deep Dive)</h2>
            <p style={{ color: '#64748b' }}>Detailed validation metrics for the currently loaded quarter.</p>
          </div>
          {latestQ && (
            <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '6px 16px', borderRadius: '20px', fontWeight: 600, fontSize: '14px', border: '1px solid #bfdbfe' }}>
              Currently Viewing: {latestQ.quarter}
            </div>
          )}
        </div>
      </section>

      <section className="analytics-grid analytics-grid--compact">
        <article className="card analytics-card">
          <div className="card-header analytics-card__header">
            <div><h2>Scorecard Foundation</h2><p>Compact methodology cards.</p></div>
          </div>
          <div className="methodology-card">
            <div className="methodology-item"><span>Base Score</span><strong>600</strong></div>
            <div className="methodology-item"><span>PDO</span><strong>20</strong></div>
            <div className="methodology-item"><span>Odds Relationship</span><strong>2× shift per 20 pts</strong></div>
            <div className="methodology-item"><span>Formula</span><strong>600 + 20 × log₂(Odds)</strong></div>
          </div>
        </article>

        <article className="card analytics-card analytics-card--small">
          <div className="card-header analytics-card__header">
            <div><h2>PDO Interpretation</h2><p>For risk review.</p></div>
          </div>
          <div className="pdo-card">
            <strong>PDO = 20</strong>
            <p>+20 Score = Half Default Odds</p>
            <p>-20 Score = Double Default Odds</p>
          </div>
        </article>
      </section>

      <section className="card analytics-card">
        <div className="card-header analytics-card__header">
          <div><h2>Score Distribution</h2></div>
        </div>
        {scoreBandData.length > 0 ? <ScoreBandValidationChart scoreBandData={scoreBandData} /> : <EmptyState icon="📊" message={noData} />}
      </section>

      <section className="analytics-grid analytics-grid--compact">
        <article className="card analytics-card">
          <div className="card-header analytics-card__header">
            <div><h2>PD Decile Validation</h2></div>
          </div>
          {pdDecileData.length > 0 ? <PDDecileValidationChart pdDecileData={pdDecileData} /> : <EmptyState icon="📐" message={noData} />}
        </article>

        <article className="card analytics-card">
          <div className="card-header analytics-card__header">
            <div><h2>Decile Lift Table</h2></div>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Decile</th><th>Avg PD</th><th>Actual Bad Rate</th><th>Customer Count</th></tr>
              </thead>
              <tbody>
                {decileRows.map((row) => (
                  <tr key={row.decile}>
                    <td>{row.decile}</td><td>{row.avgPd.toFixed(4)}</td><td>{row.actualBadRate.toFixed(2)}%</td><td>{row.customerCount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>


      {/* ── BOTTOM SECTION: QUARTERLY COMPARISON ── */}
      <div style={{ marginTop: '56px', paddingTop: '40px', borderTop: '2px dashed #cbd5e1' }}>
        
        {/* Comparison Header & Upload Control */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '24px', color: '#0f172a', margin: '0 0 8px 0' }}>Quarterly Comparison & Trend</h2>
            <p style={{ color: '#64748b', margin: 0 }}>Upload consecutive quarters to monitor model degradation (Concept Drift) over time.</p>
          </div>
          <div>
            <input type="file" ref={fileInputRef} onChange={handleUploadNextQuarter} style={{ display: 'none' }} accept=".csv,.xlsx" />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading} 
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            >
              {isUploading ? 'Processing...' : `+ Upload ${nextQuarterLabel} Data to Compare`}
            </button>
          </div>
        </div>

        {/* Trend Charts */}
        {history.length > 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
            
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
                <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Accounts (Latest)</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>{latestQ.total_accounts.toLocaleString()}</div>
              </div>

              <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
                <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Average PD</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>{(latestQ.avg_pd * 100).toFixed(2)}%</div>
                {prevQ && (
                  <span style={{ fontSize: '12px', fontWeight: 600, color: getTrend(latestQ.avg_pd, prevQ.avg_pd).isPositive ? '#ef4444' : '#10b981' }}>
                    {getTrend(latestQ.avg_pd, prevQ.avg_pd).isPositive ? '↑' : '↓'} {Math.abs(getTrend(latestQ.avg_pd, prevQ.avg_pd).value * 100).toFixed(2)}% vs Prev
                  </span>
                )}
              </div>

              <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
                <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Actual Default Rate</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>{(latestQ.default_rate * 100).toFixed(2)}%</div>
                {prevQ && (
                  <span style={{ fontSize: '12px', fontWeight: 600, color: getTrend(latestQ.default_rate, prevQ.default_rate).isPositive ? '#ef4444' : '#10b981' }}>
                    {getTrend(latestQ.default_rate, prevQ.default_rate).isPositive ? '↑' : '↓'} {Math.abs(getTrend(latestQ.default_rate, prevQ.default_rate).value * 100).toFixed(2)}% vs Prev
                  </span>
                )}
              </div>

              <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
                <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Gini Coefficient</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>{latestQ.gini.toFixed(3)}</div>
                {prevQ && (
                  <span style={{ fontSize: '12px', fontWeight: 600, color: getTrend(latestQ.gini, prevQ.gini).isPositive ? '#10b981' : '#ef4444' }}>
                    {getTrend(latestQ.gini, prevQ.gini).isPositive ? '↑' : '↓'} {Math.abs(getTrend(latestQ.gini, prevQ.gini).value).toFixed(3)} vs Prev
                  </span>
                )}
              </div>
            </div>

            {/* Line Charts */}
            <div style={{ display: 'flex', gap: '24px' }}>
              <div className="card" style={{ flex: 1, padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Model Degradation (Gini & AUC)</h3>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="quarter" />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="gini" stroke="#2563eb" strokeWidth={3} name="Gini" />
                      <Line type="monotone" dataKey="auc" stroke="#8b5cf6" strokeWidth={3} name="AUC" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card" style={{ flex: 1, padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Macroeconomic Trend (Default Rate)</h3>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="quarter" />
                      <YAxis tickFormatter={(tick) => `${(tick * 100).toFixed(0)}%`} />
                      <Tooltip formatter={(value) => `${(value * 100).toFixed(2)}%`} />
                      <Legend />
                      <Line type="monotone" dataKey="default_rate" stroke="#ef4444" strokeWidth={3} name="Actual Default Rate" />
                      <Line type="monotone" dataKey="avg_pd" stroke="#f59e0b" strokeWidth={3} name="Predicted PD" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <EmptyState icon="📈" message={`Upload ${nextQuarterLabel} Data to generate comparison trend lines.`} />
        )}
      </div>

    </main>
  )
}