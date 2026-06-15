const RISK_LEVELS = [
    {
      label: 'Low Risk',
      minPD: 0,
      maxPD: 0.20,
      color: '#15803d',
      background: '#f0fdf4',
      border: '#86efac',
      explanation:
        'Portfolio demonstrates strong credit quality. The majority of customers '
        + 'have a low probability of default, indicating a healthy and well-managed '
        + 'credit portfolio.',
    },
    {
      label: 'Moderate Risk',
      minPD: 0.20,
      maxPD: 0.40,
      color: '#a16207',
      background: '#fefce8',
      border: '#fde047',
      explanation:
        'Portfolio shows moderate credit risk. A noticeable portion of customers '
        + 'carry elevated default probability. Consider tightening credit policies '
        + 'and monitoring high-risk segments closely.',
    },
    {
      label: 'Elevated Risk',
      minPD: 0.40,
      maxPD: 0.60,
      color: '#c2410c',
      background: '#fff7ed',
      border: '#fdba74',
      explanation:
        'Portfolio is under elevated stress. A significant share of customers '
        + 'present high default probability. Immediate review of risk exposure and '
        + 'provisioning levels is recommended.',
    },
    {
      label: 'High Risk',
      minPD: 0.60,
      maxPD: 1.01,
      color: '#b91c1c',
      background: '#fef2f2',
      border: '#fca5a5',
      explanation:
        'Portfolio is at high risk of significant credit losses. Urgent action '
        + 'is required including portfolio restructuring, increased provisions, and '
        + 'potential suspension of new credit approvals in affected segments.',
    },
  ]
  
  function getRiskLevel(averagePD) {
    return RISK_LEVELS.find((r) => averagePD >= r.minPD && averagePD < r.maxPD) || RISK_LEVELS[3]
  }
  
  function GaugeBar({ averagePD }) {
    const pct = Math.min(Math.max(averagePD * 100, 0), 100)
  
    const segments = [
      { label: 'Low',      color: '#22c55e', width: 20 },
      { label: 'Moderate', color: '#eab308', width: 20 },
      { label: 'Elevated', color: '#f97316', width: 20 },
      { label: 'High',     color: '#ef4444', width: 40 },
    ]
  
    return (
      <div style={{ marginTop: '24px', marginBottom: '8px' }}>
        {/* Track */}
        <div style={{
          position: 'relative',
          height: '14px',
          borderRadius: '999px',
          overflow: 'hidden',
          display: 'flex',
          border: '1px solid #e2e8f0',
        }}>
          {segments.map((seg) => (
            <div key={seg.label} style={{ width: `${seg.width}%`, background: seg.color, opacity: 0.25 }} />
          ))}
  
          {/* Fill */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${pct}%`,
            background: `linear-gradient(90deg, #22c55e, #eab308, #f97316, #ef4444)`,
            borderRadius: '999px',
            transition: 'width 0.6s ease',
          }} />
  
          {/* Needle marker */}
          <div style={{
            position: 'absolute',
            top: '-3px',
            left: `calc(${pct}% - 4px)`,
            width: '8px',
            height: '20px',
            background: '#0f172a',
            borderRadius: '3px',
            border: '2px solid #ffffff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            transition: 'left 0.6s ease',
          }} />
        </div>
  
        {/* Scale labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '6px',
          fontSize: '11px',
          color: '#94a3b8',
          fontWeight: 600,
        }}>
          <span>0%</span>
          <span>20%</span>
          <span>40%</span>
          <span>60%</span>
          <span>100%</span>
        </div>
      </div>
    )
  }
  
  export default function RiskGauge({ pdValues }) {
    if (!pdValues?.length) return null
  
    const averagePD = pdValues.reduce((sum, v) => sum + v, 0) / pdValues.length
    const risk = getRiskLevel(averagePD)
  
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        marginTop: '24px',
        height: '100%',
        boxSizing: 'border-box',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#1e293b',
          marginTop: 0,
          marginBottom: '20px',
        }}>
          Risk Gauge
        </h2>
  
        {/* Risk Level Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '999px',
          background: risk.background,
          border: `1px solid ${risk.border}`,
          marginBottom: '20px',
        }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: risk.color,
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: '15px',
            fontWeight: 700,
            color: risk.color,
          }}>
            {risk.label}
          </span>
        </div>
  
        {/* Stats row */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '8px',
          flexWrap: 'wrap',
        }}>
          <div style={{
            flex: 1,
            padding: '14px 16px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            minWidth: '120px',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Average PD
            </p>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: risk.color }}>
              {(averagePD * 100).toFixed(2)}%
            </p>
          </div>
  
          <div style={{
            flex: 1,
            padding: '14px 16px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            minWidth: '120px',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Customers Assessed
            </p>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
              {pdValues.length.toLocaleString()}
            </p>
          </div>
        </div>
  
        {/* Gauge bar */}
        <GaugeBar averagePD={averagePD} />
  
        {/* Explanation */}
        <div style={{
          marginTop: '20px',
          padding: '14px 16px',
          background: risk.background,
          border: `1px solid ${risk.border}`,
          borderRadius: '12px',
        }}>
          <p style={{
            margin: 0,
            fontSize: '13px',
            color: '#475569',
            lineHeight: 1.7,
          }}>
            {risk.explanation}
          </p>
        </div>
      </div>
    )
  }