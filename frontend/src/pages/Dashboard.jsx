import { useRef, useState } from 'react'
import { uploadDataset } from '../services/api'

import RocChart from '../components/RocChart'
import RiskDistributionChart from '../components/RiskDistributionChart'
import ConfusionMatrix from '../components/ConfusionMatrix'
import PlaceholderCard from '../components/PlaceholderCard'
import RiskGauge from '../components/RiskGauge'
import PDDistributionChart from '../components/PDDistributionChart'
import InsightsPanel from '../components/InsightsPanel'

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toFixed(1)}%`
}

function formatMetric(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toFixed(3)
}

function formatCount(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString()
}

function getPortfolioHealth(badPct) {
  if (badPct == null || Number.isNaN(Number(badPct))) return { label: '—', cls: '' }
  const pct = Number(badPct)
  if (pct < 5)   return { label: 'Good',     cls: 'status-valid'    }
  if (pct <= 15) return { label: 'Moderate', cls: 'status-moderate' }
  return               { label: 'High',     cls: 'status-invalid'  }
}

function getMetricBadge(key, value) {
  if (value == null || Number.isNaN(Number(value))) return null
  const v = Number(value)

  const rules = {
    auc: [
      { threshold: 0.8, label: 'Excellent', cls: 'badge-excellent' },
      { threshold: 0.7, label: 'Good',      cls: 'badge-good'      },
      { threshold: 0.6, label: 'Fair',      cls: 'badge-fair'      },
      { threshold: -Infinity, label: 'Poor', cls: 'badge-poor'     },
    ],
    gini: [
      { threshold: 0.6, label: 'Excellent', cls: 'badge-excellent' },
      { threshold: 0.4, label: 'Good',      cls: 'badge-good'      },
      { threshold: 0.2, label: 'Fair',      cls: 'badge-fair'      },
      { threshold: -Infinity, label: 'Poor', cls: 'badge-poor'     },
    ],
    kappa: [
      { threshold: 0.6, label: 'Strong',   cls: 'badge-excellent' },
      { threshold: 0.4, label: 'Moderate', cls: 'badge-good'      },
      { threshold: 0.2, label: 'Fair',     cls: 'badge-fair'      },
      { threshold: -Infinity, label: 'Weak', cls: 'badge-poor'    },
    ],
    accuracy: [
      { threshold: 0.8, label: 'Good', cls: 'badge-good' },
      { threshold: -Infinity, label: 'Fair', cls: 'badge-fair' },
    ],
  }

  const tiers = rules[key]
  if (!tiers) return null

  const match = tiers.find(t => v >= t.threshold)
  return match ?? null
}

function calculateKsScore(rocData) {
  if (!rocData?.fpr || !rocData?.tpr) return null

  const fpr = rocData.fpr.map(Number)
  const tpr = rocData.tpr.map(Number)
  if (!fpr.length || !tpr.length) return null

  let ks = 0
  for (let i = 0; i < fpr.length; i += 1) {
    ks = Math.max(ks, Math.abs(tpr[i] - fpr[i]))
  }

  return Number.isFinite(ks) ? ks * 100 : null
}

export default function Dashboard({ analysisResult, setAnalysisResult }) {
  const fileInputRef = useRef(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // ── Threshold state ──────────────────────────────────────────────────────
  const [predictionThreshold, setPredictionThreshold] = useState(0.5)
  const [goodThreshold, setGoodThreshold] = useState(0.3)
  const [badThreshold, setBadThreshold] = useState(0.7)
  // ────────────────────────────────────────────────────────────────────────

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setErrorMessage('')
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRunAnalysis = async () => {
    if (!selectedFile) {
      setErrorMessage('Please upload a CSV or XLSX file first.')
      return
    }
    setIsAnalyzing(true)
    setErrorMessage('')
    try {
      const data = await uploadDataset(
        selectedFile,
        predictionThreshold,
        goodThreshold,
        badThreshold
      )
      setAnalysisResult(data)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to run analysis.'
      setErrorMessage(message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const validationReport = analysisResult?.validation_report
  const metrics = analysisResult?.metrics
  const segmentSummary = analysisResult?.segment_summary
  const scorecardData = analysisResult?.scorecard_data || []
  const pdValues = analysisResult?.pd_values || []

  const totalCustomers = segmentSummary?.reduce((sum, s) => sum + (s.customer_count ?? 0), 0) ?? null
  const avgPortfolioPD = segmentSummary?.length
    ? segmentSummary.reduce((sum, s) => sum + (s.average_pd ?? 0) * (s.customer_count ?? 0), 0) / (totalCustomers || 1)
    : null
  const defaultRate = scorecardData.length
    ? scorecardData.filter((row) => Number(row.actual_default) === 1).length / scorecardData.length
    : null
  const ksScore = calculateKsScore(analysisResult?.roc_data)
  const getPct = (cat) => segmentSummary?.find((s) => s.risk_category === cat)?.percentage ?? null
  const goodPct = getPct('Good')
  const moderatePct = getPct('Moderate')
  const badPct = getPct('Bad')
  const health = getPortfolioHealth(badPct)
  const highestRiskSegment = segmentSummary?.reduce((max, item) =>
    (item.customer_count ?? 0) > (max.customer_count ?? 0) ? item : max
  , segmentSummary[0] || null)

  const validationStatusLabel = validationReport?.validation_status ? 'Valid' : 'Invalid'

  const riskMixRows = (segmentSummary || []).map((segment) => ({
    segment: segment.risk_category,
    customerCount: segment.customer_count ?? 0,
    pct: segment.percentage ?? 0,
    avgPd: segment.average_pd ?? 0,
  }))

  const pdBuckets = Array.from({ length: 10 }, (_, index) => {
    const lower = index * 10
    const upper = lower + 10
    const bucketValues = pdValues.filter((value) => value >= lower / 100 && value < upper / 100)
    const count = bucketValues.length
    return {
      label: `${lower}-${upper}%`,
      count,
      share: pdValues.length ? (count / pdValues.length) * 100 : 0,
    }
  })

  const riskExposure = [
    { label: 'High Risk Customers', value: segmentSummary?.find((item) => item.risk_category === 'Bad')?.customer_count ?? 0, tone: 'danger' },
    { label: 'Moderate Risk Customers', value: segmentSummary?.find((item) => item.risk_category === 'Moderate')?.customer_count ?? 0, tone: 'warning' },
    { label: 'Low Risk Customers', value: segmentSummary?.find((item) => item.risk_category === 'Good')?.customer_count ?? 0, tone: 'success' },
  ]

  const insightsItems = [
    `Average PD is ${formatMetric(avgPortfolioPD)}% across the current portfolio.`,
    `The largest customer exposure sits in ${highestRiskSegment?.risk_category ?? 'the current'} segment.`,
    `Default rate is ${defaultRate != null ? formatPercent(defaultRate * 100) : '—'}, which is the key monitor for portfolio risk.`,
    `AUC of ${metrics?.auc != null ? Number(metrics.auc).toFixed(3) : '—'} supports model ranking quality for credit review.`,
    `KS score of ${ksScore != null ? `${ksScore.toFixed(1)}%` : '—'} indicates the current separation strength.`,
  ].slice(0, 5)

  return (
    <main className="dashboard-main">

      {/* ── Upload Card (only before analysis) ───────────────────────────── */}
      {!isAnalyzing && !analysisResult && (
        <div className="dashboard-row">
          <section className="card dashboard-col">
            <div className="card-header">
              <h2>Data Upload</h2>
              <p>Upload a credit portfolio file to begin analysis.</p>
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
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
              >
                {isAnalyzing && <span className="spinner" aria-hidden="true" />}
                {isAnalyzing ? 'Running Analysis...' : 'Run Analysis'}
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
        </div>
      )}

      {/* ── Loading state ─────────────────────────────────────────────────── */}
      {isAnalyzing && (
        <div className="loading-banner" role="status" aria-live="polite">
          <span className="spinner spinner-lg" aria-hidden="true" />
          <span>Processing dataset and generating insights...</span>
        </div>
      )}

      {/* ── Placeholder ──────────────────────────────────────────────────── */}
      {!analysisResult && !isAnalyzing && (
        <div className="placeholder-state">
          <div className="placeholder-icon" aria-hidden="true">📊</div>
          <h2 className="placeholder-title">No analysis available</h2>
          <p className="placeholder-body">
            Upload a CSV/XLSX file and click <strong>Run Analysis</strong> to
            generate credit risk insights.
          </p>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {analysisResult && (
        <>
          <section className="card dashboard-hero dashboard-hero--compact">
            <div className="card-header dashboard-hero__header">
              <div>
                <h2>Credit Risk Dashboard</h2>
                <p>Key model validation indicators and portfolio risk summary.</p>
              </div>
            </div>

            <div className="kpi-grid executive-kpi-grid">
              <article className="kpi-card">
                <span className="kpi-label">Total Customers</span>
                <strong className="kpi-value">{formatCount(totalCustomers)}</strong>
                <span className="kpi-hint kpi-hint--neutral">Portfolio size for review</span>
              </article>
              <article className="kpi-card">
                <span className="kpi-label">Average PD</span>
                <strong className="kpi-value">{formatMetric(avgPortfolioPD)}</strong>
                <span className="kpi-hint kpi-hint--neutral">Expected default likelihood</span>
              </article>
              <article className="kpi-card">
                <span className="kpi-label">Default Rate</span>
                <strong className="kpi-value">{defaultRate != null ? formatPercent(defaultRate * 100) : '—'}</strong>
                <span className="kpi-hint kpi-hint--warning">Observed bad rate</span>
              </article>
              <article className="kpi-card">
                <span className="kpi-label">AUC</span>
                <strong className="kpi-value">{metrics?.auc != null ? Number(metrics.auc).toFixed(3) : '—'}</strong>
                <span className="kpi-hint kpi-hint--positive">Ranking quality</span>
              </article>
              <article className="kpi-card">
                <span className="kpi-label">KS Score</span>
                <strong className="kpi-value">{ksScore != null ? `${ksScore.toFixed(1)}%` : '—'}</strong>
                <span className="kpi-hint kpi-hint--neutral">Separation strength</span>
              </article>
              <article className="kpi-card">
                <span className="kpi-label">Precision</span>
                <strong className="kpi-value">{metrics?.precision != null ? Number(metrics.precision).toFixed(3) : '—'}</strong>
                <span className="kpi-hint kpi-hint--neutral">Positive predictive power</span>
              </article>
              <article className="kpi-card">
                <span className="kpi-label">Recall</span>
                <strong className="kpi-value">{metrics?.recall != null ? Number(metrics.recall).toFixed(3) : '—'}</strong>
                <span className="kpi-hint kpi-hint--neutral">Capture of true defaults</span>
              </article>
              <article className="kpi-card">
                <span className="kpi-label">F1 Score</span>
                <strong className="kpi-value">{metrics?.f1_score != null ? Number(metrics.f1_score).toFixed(3) : '—'}</strong>
                <span className="kpi-hint kpi-hint--neutral">Balance of precision and recall</span>
              </article>
            </div>
          </section>

          <div className="dashboard-grid dashboard-grid--two">
            <section className="card dashboard-panel">
              <div className="card-header dashboard-panel__header">
                <div>
                  <h2>Risk Segment Distribution</h2>
                  <p>Customer mix across Good, Moderate, and Bad segments.</p>
                </div>
              </div>
              {segmentSummary && segmentSummary.length > 0 ? (
                <RiskDistributionChart segmentSummary={segmentSummary} />
              ) : <PlaceholderCard title="Risk Distribution" />}
            </section>

            <section className="card dashboard-panel">
              <div className="card-header dashboard-panel__header">
                <div>
                  <h2>Risk Gauge</h2>
                  <p>Portfolio health overview based on current PD levels.</p>
                </div>
              </div>
              <RiskGauge pdValues={pdValues} />
            </section>
          </div>

          <section className="card dashboard-panel">
            <div className="card-header dashboard-panel__header">
              <div>
                <h2>Portfolio Risk Mix</h2>
                <p>Exposure by risk band for management review.</p>
              </div>
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Segment</th>
                    <th>Customer Count</th>
                    <th>%</th>
                    <th>Avg PD</th>
                  </tr>
                </thead>
                <tbody>
                  {riskMixRows.map((row) => (
                    <tr key={row.segment}>
                      <td>{row.segment}</td>
                      <td>{formatCount(row.customerCount)}</td>
                      <td>{formatPercent(row.pct)}</td>
                      <td>{formatMetric(row.avgPd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="dashboard-grid dashboard-grid--two">
            <section className="card dashboard-panel">
              <div className="card-header dashboard-panel__header">
                <div>
                  <h2>ROC Curve</h2>
                  <p>Model ranking performance for default prediction.</p>
                </div>
              </div>
              {analysisResult?.roc_data ? (
                <RocChart rocData={analysisResult.roc_data} auc={analysisResult.metrics?.auc} />
              ) : <PlaceholderCard title="ROC Curve" />}
            </section>

            <section className="card dashboard-panel">
              <div className="card-header dashboard-panel__header">
                <div>
                  <h2>Confusion Matrix</h2>
                  <p>Observed outcomes for the current model threshold.</p>
                </div>
              </div>
              {analysisResult?.confusion_matrix ? (
                <ConfusionMatrix
                  tn={analysisResult.confusion_matrix.tn}
                  fp={analysisResult.confusion_matrix.fp}
                  fn={analysisResult.confusion_matrix.fn}
                  tp={analysisResult.confusion_matrix.tp}
                />
              ) : <PlaceholderCard title="Confusion Matrix" />}
            </section>
          </div>

          <div className="dashboard-grid dashboard-grid--two">
            <section className="card dashboard-panel">
              <div className="card-header dashboard-panel__header">
                <div>
                  <h2>PD Distribution</h2>
                  <p>Spread of predicted default probabilities across customers.</p>
                </div>
              </div>
              {pdValues.length > 0 ? <PDDistributionChart pdValues={pdValues} /> : <PlaceholderCard title="PD Distribution" />}
            </section>

            <section className="card dashboard-panel">
              <div className="card-header dashboard-panel__header">
                <div>
                  <h2>PD Bucket Analysis</h2>
                  <p>Customer count and portfolio share by PD band.</p>
                </div>
              </div>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>PD Bucket</th>
                      <th>Customer Count</th>
                      <th>Portfolio %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pdBuckets.map((bucket) => (
                      <tr key={bucket.label}>
                        <td>{bucket.label}</td>
                        <td>{formatCount(bucket.count)}</td>
                        <td>{formatPercent(bucket.share)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="dashboard-grid dashboard-grid--two">
            <section className="card dashboard-panel">
              <div className="card-header dashboard-panel__header">
                <div>
                  <h2>Risk Concentration Analysis</h2>
                  <p>Horizontal bars show exposure concentration across risk bands.</p>
                </div>
              </div>
              <div className="risk-bars">
                {riskExposure.map((item) => (
                  <div key={item.label} className="risk-bar-row">
                    <div className="risk-bar-meta">
                      <strong>{item.label}</strong>
                      <span>{formatCount(item.value)}</span>
                    </div>
                    <div className="risk-bar-track">
                      <div
                        className={`risk-bar-fill risk-bar-fill--${item.tone}`}
                        style={{ width: `${Math.max(8, (item.value / Math.max(totalCustomers || 1, 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card dashboard-panel dashboard-panel--compact">
              <div className="card-header dashboard-panel__header">
                <div>
                  <h2>Executive Insights</h2>
                  <p>Rule-based review notes reserved for future AI integration.</p>
                </div>
              </div>
              <InsightsPanel
                title="Current Risk Summary"
                description="This component is ready for future AI-generated credit review commentary."
                items={insightsItems}
                tone="neutral"
              />
            </section>
          </div>

          <section className="card dashboard-panel">
            <div className="card-header dashboard-panel__header">
              <div>
                <h2>Performance Metrics Summary</h2>
                <p>Concise metrics table for model validation and executive review.</p>
              </div>
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Business View</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Accuracy</td><td>{metrics?.accuracy != null ? Number(metrics.accuracy).toFixed(3) : '—'}</td><td>Overall classification fit</td></tr>
                  <tr><td>Precision</td><td>{metrics?.precision != null ? Number(metrics.precision).toFixed(3) : '—'}</td><td>Positive case reliability</td></tr>
                  <tr><td>Recall</td><td>{metrics?.recall != null ? Number(metrics.recall).toFixed(3) : '—'}</td><td>Risk case capture</td></tr>
                  <tr><td>F1 Score</td><td>{metrics?.f1_score != null ? Number(metrics.f1_score).toFixed(3) : '—'}</td><td>Balanced model quality</td></tr>
                  <tr><td>AUC</td><td>{metrics?.auc != null ? Number(metrics.auc).toFixed(3) : '—'}</td><td>Ranking power</td></tr>
                  <tr><td>KS</td><td>{ksScore != null ? `${ksScore.toFixed(1)}%` : '—'}</td><td>Separation strength</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="card dashboard-panel">
            <div className="card-header dashboard-panel__header">
              <div>
                <p className="eyebrow">ANALYSIS CONTROLS</p>
                <h2>Portfolio Calibration</h2>
                <p>Fine-tune the scoring thresholds used for the credit risk view.</p>
              </div>
            </div>

            <div className="summary-grid dashboard-control-grid">
              <div className="summary-item">
                <label className="summary-label" htmlFor="prediction-threshold">Prediction Threshold</label>
                <input id="prediction-threshold" type="number" min="0" max="1" step="0.01" value={predictionThreshold} onChange={(e) => setPredictionThreshold(Number(e.target.value))} className="threshold-input" />
              </div>
              <div className="summary-item">
                <label className="summary-label" htmlFor="good-threshold">Good Threshold</label>
                <input id="good-threshold" type="number" min="0" max="1" step="0.01" value={goodThreshold} onChange={(e) => setGoodThreshold(Number(e.target.value))} className="threshold-input" />
              </div>
              <div className="summary-item">
                <label className="summary-label" htmlFor="bad-threshold">Bad Threshold</label>
                <input id="bad-threshold" type="number" min="0" max="1" step="0.01" value={badThreshold} onChange={(e) => setBadThreshold(Number(e.target.value))} className="threshold-input" />
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button type="button" className="btn btn-primary" onClick={handleRunAnalysis} disabled={isAnalyzing || !selectedFile}>
                {isAnalyzing && <span className="spinner" aria-hidden="true" />}
                {isAnalyzing ? 'Running Analysis...' : 'Recalculate Results'}
              </button>
            </div>
          </section>

        </>
      )}
    </main>
  )
}