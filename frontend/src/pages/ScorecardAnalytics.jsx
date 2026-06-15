import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import ScoreBandValidationChart from '../components/ScoreBandValidationChart'
import PDDecileValidationChart from '../components/PDDecileValidationChart'
import InsightsPanel from '../components/InsightsPanel'

function EmptyState({ icon, message }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 16px',
      background: '#f8fafc',
      borderRadius: '12px',
      border: '1px dashed #cbd5e1',
      gap: '10px',
      marginTop: '16px',
    }}>
      <span style={{ fontSize: '36px', opacity: 0.4 }}>{icon}</span>
      <p style={{
        margin: 0,
        fontSize: '13px',
        fontWeight: 600,
        color: '#94a3b8',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>
        {message}
      </p>
    </div>
  )
}

export default function ScorecardAnalytics({ analysisResult }) {
  const scoreBandData = analysisResult?.score_band_analysis || []
  const pdDecileData = analysisResult?.pd_decile_analysis || []
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

  const cumulativeLift = pdDecileData
    .map((item, index) => {
      const cumulativeCustomers = pdDecileData
        .slice(0, index + 1)
        .reduce((sum, row) => sum + (row.customer_count || 0), 0)
      const cumulativeBadRate = pdDecileData
        .slice(0, index + 1)
        .reduce((sum, row) => sum + ((row.actual_bad_rate || 0) * (row.customer_count || 0)), 0) / Math.max(cumulativeCustomers, 1)

      return {
        decile: `D${index + 1}`,
        cumulativeCustomers,
        cumulativeBadRate,
        cumulativeShare: totalDecileCustomers ? (cumulativeCustomers / totalDecileCustomers) * 100 : 0,
      }
    })
    .filter((item) => item.cumulativeCustomers > 0)

  const validationNotes = [
    'Calibration observation: the score-band chart should show a clear separation between safer and weaker customer groups.',
    'Ranking observation: PD deciles should move upward from Decile 1 to Decile 10, confirming model ordering quality.',
    'Segment observation: the score distribution and decile tables provide a practical basis for validation meetings and committee review.',
    'Recommendation: use the tables below as the exact evidence set for risk review discussions and model validation sign-off.',
  ]

  return (
    <main className="dashboard-main analytics-page">
      <section className="card analytics-header-card">
        <div className="card-header analytics-header">
          <div>
            <h2>Scorecard Analytics</h2>
            <p>Credit score distribution, PD decile validation, and compact scorecard interpretation.</p>
          </div>
        </div>
      </section>

      <section className="analytics-grid analytics-grid--compact">
        <article className="card analytics-card">
          <div className="card-header analytics-card__header">
            <div>
              <h2>Scorecard Foundation</h2>
              <p>Compact methodology cards for validation and review discussions.</p>
            </div>
          </div>
          <div className="methodology-card">
            <div className="methodology-item"><span>Base Score</span><strong>600</strong></div>
            <div className="methodology-item"><span>PDO</span><strong>20</strong></div>
            <div className="methodology-item"><span>Odds Relationship</span><strong>2× odds shift for every 20-point move</strong></div>
            <div className="methodology-item"><span>Score Formula</span><strong>600 + 20 × log₂(Odds)</strong></div>
          </div>
        </article>

        <article className="card analytics-card analytics-card--small">
          <div className="card-header analytics-card__header">
            <div>
              <h2>PDO Interpretation</h2>
              <p>Compact scorecard interpretation for risk review.</p>
            </div>
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
          <div>
            <h2>Score Distribution</h2>
            <p>Primary scorecard validation chart for customer count and actual bad rate by score band.</p>
          </div>
        </div>
        {scoreBandData.length > 0
          ? <ScoreBandValidationChart scoreBandData={scoreBandData} />
          : <EmptyState icon="📊" message={noData} />}
      </section>

      <section className="card analytics-card">
        <div className="card-header analytics-card__header">
          <div>
            <h2>Score Band Table</h2>
            <p>Exact numbers behind the score distribution chart for review meetings.</p>
          </div>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Score Band</th>
                <th>Customer Count</th>
                <th>Avg PD</th>
                <th>Actual Bad Rate</th>
                <th>Portfolio %</th>
              </tr>
            </thead>
            <tbody>
              {scoreBandRows.map((row) => (
                <tr key={row.scoreBand}>
                  <td>{row.scoreBand}</td>
                  <td>{row.customerCount.toLocaleString()}</td>
                  <td>{row.avgPd.toFixed(4)}</td>
                  <td>{row.actualBadRate.toFixed(2)}%</td>
                  <td>{row.portfolioPct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="analytics-grid analytics-grid--compact">
        <article className="card analytics-card">
          <div className="card-header analytics-card__header">
            <div>
              <h2>PD Decile Validation</h2>
              <p>Expected monotonic increase from Decile 1 to Decile 10 for model ranking review.</p>
            </div>
          </div>
          {pdDecileData.length > 0
            ? <PDDecileValidationChart pdDecileData={pdDecileData} />
            : <EmptyState icon="📐" message={noData} />}
        </article>

        <article className="card analytics-card">
          <div className="card-header analytics-card__header">
            <div>
              <h2>Decile Lift Table</h2>
              <p>Customer count and default propensity by validation decile.</p>
            </div>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Decile</th>
                  <th>Avg PD</th>
                  <th>Actual Bad Rate</th>
                  <th>Customer Count</th>
                </tr>
              </thead>
              <tbody>
                {decileRows.map((row) => (
                  <tr key={row.decile}>
                    <td>{row.decile}</td>
                    <td>{row.avgPd.toFixed(4)}</td>
                    <td>{row.actualBadRate.toFixed(2)}%</td>
                    <td>{row.customerCount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="card analytics-card">
        <div className="card-header analytics-card__header">
          <div>
            <h2>Model Ranking Quality</h2>
            <p>Simple lift-style view to support model validation discussions and ranking quality reviews.</p>
          </div>
        </div>
        {cumulativeLift.length > 0 ? (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeLift} margin={{ top: 8, right: 18, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="decile" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#2563eb' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#ef4444' }} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="cumulativeShare" stroke="#2563eb" strokeWidth={2.5} name="Cumulative Share (%)" />
                <Line yAxisId="right" type="monotone" dataKey="cumulativeBadRate" stroke="#ef4444" strokeWidth={2.5} name="Cumulative Bad Rate (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyState icon="📈" message={noData} />}
      </section>

      <section className="card analytics-card">
        <div className="card-header analytics-card__header">
          <div>
            <h2>Validation Insights</h2>
            <p>Reusable rule-based insight component for current and future AI-generated validation commentary.</p>
          </div>
        </div>
        <InsightsPanel
          title="Validation Review Notes"
          description="Structured observations for risk managers and model validation teams."
          items={validationNotes}
          tone="neutral"
        />
      </section>
    </main>
  )
}