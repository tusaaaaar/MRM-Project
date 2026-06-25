import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { API_BASE_URL } from '../config';
import { sendChatMessage } from '../services/api';
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Legend, ComposedChart, Bar, ReferenceLine
} from 'recharts'

function formatCount(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString()
}

// --- HARDCODED HISTORICAL DATA ---
const mockHistoricalData = [
  { quarter: "2023 Q3", total_accounts: 28500, avg_pred_pd: 0.205, actual_default_rate: 0.201, gini: 0.620, auc: 0.810, ks: 38.0, psi: 0.04, cal_gap: 0.004, alert_status: "Green" },
  { quarter: "2023 Q4", total_accounts: 29000, avg_pred_pd: 0.210, actual_default_rate: 0.208, gini: 0.605, auc: 0.800, ks: 36.5, psi: 0.06, cal_gap: 0.006, alert_status: "Green" },
  { quarter: "2024 Q1", total_accounts: 30000, avg_pred_pd: 0.218, actual_default_rate: 0.214, gini: 0.580, auc: 0.790, ks: 34.0, psi: 0.08, cal_gap: 0.012, alert_status: "Green" },
  { quarter: "2024 Q2", total_accounts: 30250, avg_pred_pd: 0.224, actual_default_rate: 0.221, gini: 0.530, auc: 0.760, ks: 31.0, psi: 0.14, cal_gap: 0.031, alert_status: "Amber" },
  { quarter: "2024 Q3", total_accounts: 30000, avg_pred_pd: 0.228, actual_default_rate: 0.226, gini: 0.475, auc: 0.720, ks: 27.0, psi: 0.23, cal_gap: 0.058, alert_status: "Red" },
  { quarter: "2024 Q4", total_accounts: 31000, avg_pred_pd: 0.231, actual_default_rate: 0.245, gini: 0.440, auc: 0.680, ks: 24.0, psi: 0.27, cal_gap: 0.082, alert_status: "Red" },
  { quarter: "2025 Q1", total_accounts: 31500, avg_pred_pd: 0.235, actual_default_rate: 0.270, gini: 0.390, auc: 0.620, ks: 19.0, psi: 0.31, cal_gap: 0.114, alert_status: "Red" }
];

// --- DYNAMIC MICRO DATA STORE ---
const generateMockDataForQuarter = (healthMultiplier) => ({
  confusion_matrix: { 
    tn: Math.round(29120 * healthMultiplier), 
    fp: Math.round(677 / healthMultiplier), 
    fn: Math.round(3346 / healthMultiplier), 
    tp: Math.round(3068 * healthMultiplier) 
  },
  roc_data: [
    { fpr: 0, tpr: 0, baseline: 0 },
    { fpr: 10, tpr: Math.min(100, 35 * healthMultiplier), baseline: 10 },
    { fpr: 25, tpr: Math.min(100, 65 * healthMultiplier), baseline: 25 },
    { fpr: 50, tpr: Math.min(100, 85 * healthMultiplier), baseline: 50 },
    { fpr: 75, tpr: Math.min(100, 95 * healthMultiplier), baseline: 75 },
    { fpr: 100, tpr: 100, baseline: 100 }
  ],
  pd_decile_analysis: [
    { decile: 1, customer_count: 3000, average_pd: 0.064, actual_bad_rate: 0.07 * (2 - healthMultiplier) },
    { decile: 2, customer_count: 3000, average_pd: 0.094, actual_bad_rate: 0.076 * (2 - healthMultiplier) },
    { decile: 3, customer_count: 3000, average_pd: 0.112, actual_bad_rate: 0.092 * (2 - healthMultiplier) },
    { decile: 4, customer_count: 3000, average_pd: 0.129, actual_bad_rate: 0.117 * (2 - healthMultiplier) },
    { decile: 5, customer_count: 3000, average_pd: 0.148, actual_bad_rate: 0.135 * (2 - healthMultiplier) },
    { decile: 6, customer_count: 3000, average_pd: 0.170, actual_bad_rate: 0.134 * (2 - healthMultiplier) },
    { decile: 7, customer_count: 3000, average_pd: 0.199, actual_bad_rate: 0.177 * (2 - healthMultiplier) },
    { decile: 8, customer_count: 3000, average_pd: 0.254, actual_bad_rate: 0.261 * (2 - healthMultiplier) },
    { decile: 9, customer_count: 3000, average_pd: 0.396, actual_bad_rate: 0.434 * (2 - healthMultiplier) },
    { decile: 10, customer_count: 3000, average_pd: 0.645, actual_bad_rate: 0.738 * (2 - healthMultiplier) }
  ],
  score_band_analysis: [
    { score_band: '550-599', customer_count: Math.round(3100 * (2 - healthMultiplier)), actual_bad_rate: 65.2 },
    { score_band: '600-649', customer_count: Math.round(8200 * (2 - healthMultiplier)), actual_bad_rate: 35.1 },
    { score_band: '650-699', customer_count: Math.round(11000 * healthMultiplier), actual_bad_rate: 15.4 },
    { score_band: '700-749', customer_count: Math.round(5100 * healthMultiplier), actual_bad_rate: 5.2 },
    { score_band: '750+', customer_count: Math.round(1200 * healthMultiplier), actual_bad_rate: 1.8 }
  ]
});

const mockAnalysisStore = {
  "2023 Q3": generateMockDataForQuarter(1.4),
  "2023 Q4": generateMockDataForQuarter(1.3),
  "2024 Q1": generateMockDataForQuarter(1.2),
  "2024 Q2": generateMockDataForQuarter(1.1),
  "2024 Q3": generateMockDataForQuarter(0.9),
  "2024 Q4": generateMockDataForQuarter(0.8),
  "2025 Q1": generateMockDataForQuarter(0.7)
};

// --- CUSTOM KPI CARD COMPONENT ---
function MetricCard({ title, value, prevValue, targetLine, history, dataKey, format = 'number', higherIsBetter = true }) {
  let displayValue = value;
  if (format === 'percent') displayValue = value?.toFixed(1) + '%';
  else if (format === 'decimal') displayValue = value?.toFixed(3);

  const delta = value - prevValue;
  const isPositiveDelta = delta > 0;
  
  let color = '#475569';
  let arrow = '';
  if (delta !== 0) {
    const isGood = higherIsBetter ? isPositiveDelta : !isPositiveDelta;
    color = isGood ? '#16a34a' : '#dc2626';
    arrow = isPositiveDelta ? '▲' : '▼';
  }

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h4>
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{displayValue}</div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: color, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>{arrow} {Math.abs(delta).toFixed(format === 'percent' ? 1 : 3)} vs prev</span>
        </div>
      </div>
      <div style={{ height: '40px', marginTop: '16px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <Line type="monotone" dataKey={dataKey} stroke={color !== '#475569' ? color : '#2563eb'} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
        {targetLine}
      </div>
    </div>
  )
}

export default function ModelMonitoring({ analysisResult }) {
  const [history, setHistory] = useState(mockHistoricalData)
  const [selectedQuarter, setSelectedQuarter] = useState(mockHistoricalData[mockHistoricalData.length - 1].quarter)

  // ── INLINE AI STATE ──
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportData, setReportData] = useState({ loading: false, content: null });
  const [insights, setInsights] = useState({});
  const [thresholdAI, setThresholdAI] = useState({ loading: false, content: null });

  // ── CHATBOT STATE (DEDICATED MRM VALIDATOR) ──
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your SR 11-7 Model Monitoring Agent. How can I assist you with the model drift analysis today?' }
  ])
  const messagesEndRef = useRef(null)

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isChatLoading, isChatOpen])

  const latestQ = history.find(h => h.quarter === selectedQuarter) || history[history.length - 1];
  const prevQIndex = history.findIndex(h => h.quarter === selectedQuarter) - 1;
  const prevQ = prevQIndex >= 0 ? history[prevQIndex] : latestQ;

  const activeAnalysis = analysisResult || mockAnalysisStore[selectedQuarter] || mockAnalysisStore["2025 Q1"];
  const cm = activeAnalysis.confusion_matrix || { tn: 0, fp: 0, fn: 0, tp: 0 }
  const scoreBandData = activeAnalysis.score_band_analysis || []
  const pdDecileData = activeAnalysis.pd_decile_analysis || []
  const rocData = activeAnalysis.roc_data || []

  // ── INLINE AI HANDLERS ──
  const handleGenerateReport = async () => {
    setIsReportOpen(true);
    setReportData({ loading: true, content: null });
    try {
      const res = await fetch(`${API_BASE_URL}/agents/monitoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: history })
      });
      const data = await res.json();
      setReportData({ loading: false, content: data.report_markdown });
    } catch (e) {
      setReportData({ loading: false, content: "⚠️ Failed to load AI report. Check backend connection." });
    }
  };

  const handleOptimizeThreshold = async () => {
    setThresholdAI({ loading: true, content: null });
    try {
      const res = await fetch(`${API_BASE_URL}/agents/optimize-threshold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confusion_matrix: cm })
      });
      const data = await res.json();
      setThresholdAI({ loading: false, content: data.recommendation });
    } catch (e) {
      setThresholdAI({ loading: false, content: "⚠️ AI optimization failed." });
    }
  };

  const handleGetInsight = async (chartName, chartData) => {
    setInsights(prev => ({ ...prev, [chartName]: { loading: true, text: null } }));
    try {
      const res = await fetch(`${API_BASE_URL}/agents/chart-insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart_type: chartName, chart_data: chartData })
      });
      const data = await res.json();
      setInsights(prev => ({ ...prev, [chartName]: { loading: false, text: data.insight } }));
    } catch (e) {
      setInsights(prev => ({ ...prev, [chartName]: { loading: false, text: "Failed to generate insight." } }));
    }
  };

  // ── CHATBOT HANDLERS ──
  const getQuickPrompts = () => {
    return [
      `Why did the Gini drop to ${latestQ.gini.toFixed(3)} in ${selectedQuarter}?`, 
      "Does the current PSI breach regulatory limits?",
      "Summarize the Calibration Gap trend."
    ];
  }

  const processChat = async (messageText) => {
    const userMessage = { role: 'user', content: messageText };
    const newHistory = [...chatMessages, userMessage];
    setChatMessages(newHistory); 
    setChatInput(''); 
    setIsChatLoading(true);
    
    try {
      const richContext = `
        Current Quarter Viewed: ${selectedQuarter}
        Overall Status: ${latestQ.alert_status}
        Gini Coefficient: ${latestQ.gini.toFixed(3)}
        AUC: ${latestQ.auc.toFixed(3)}
        KS Statistic: ${latestQ.ks.toFixed(1)}%
        PSI (Population Stability Index): ${latestQ.psi.toFixed(2)}
        Calibration Gap: ${latestQ.cal_gap.toFixed(3)}
        Actual Default Rate: ${(latestQ.actual_default_rate * 100).toFixed(1)}%
        Avg Predicted PD: ${(latestQ.avg_pred_pd * 100).toFixed(1)}%
      `;

      const cleanHistory = newHistory.map(m => ({
        role: m.role,
        content: m.content.split('|||')[0].trim() 
      }));

      const response = await fetch(`${API_BASE_URL}/chat-monitoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: cleanHistory,
          context_summary: richContext,
          persona: 'MRM Validator' // Strictly fixed persona
        })
      });
      
      const data = await response.json();
      setChatMessages([...newHistory, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setChatMessages([...newHistory, { role: 'assistant', content: '⚠️ Connection failed. Ensure backend is running.' }]);
    } finally {
      setIsChatLoading(false);
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    await processChat(chatInput);
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }

  const handleQuickPrompt = async (promptText) => {
    if (isChatLoading) return;
    await processChat(promptText);
  }

  // ── DERIVED METRICS ──
  const calibrationData = pdDecileData.map((d) => ({
    decile: d.decile,
    predicted_pd: d.average_pd * 100,
    actual_pd: d.actual_bad_rate * 100, 
    perfect_calibration: d.average_pd * 100
  }))

  const cmTotal = cm.tn + cm.fp + cm.fn + cm.tp || 1;
  const fpRate = cm.fp / Math.max(cm.tn + cm.fp, 1)
  const fnRate = cm.fn / Math.max(cm.fn + cm.tp, 1)
  const tnRate = cm.tn / Math.max(cm.tn + cm.fp, 1)
  const tpRate = cm.tp / Math.max(cm.fn + cm.tp, 1)

  const cardStyle = {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
    border: '1px solid #e2e8f0',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column'
  }

  return (
    <main style={{ background: '#f4f7f9', minHeight: '100vh', padding: '24px', paddingBottom: '100px', overflowX: 'hidden' }}>
      
      {/* ── SR 11-7 REPORT MODAL ── */}
      {isReportOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '800px', maxHeight: '90vh', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '20px 24px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✨ SR 11-7 Autonomous Validation Report
              </h3>
              <button onClick={() => setIsReportOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '28px', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            <div className="markdown-body" style={{ padding: '32px', overflowY: 'auto', flex: 1, fontSize: '15px', lineHeight: 1.6, color: '#334155' }}>
              {reportData.loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                  <p style={{ marginTop: '16px', fontWeight: 600, color: '#0f172a' }}>AI is analyzing multi-quarter drift...</p>
                </div>
              ) : (
                <ReactMarkdown>{reportData.content}</ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .markdown-body pre { background: #0f172a; color: #f8fafc; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 13px; margin: 12px 0; border: 1px solid #334155; }
        .markdown-body code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; }
      `}</style>

      {/* ── TOP NAV BAR ── */}
      <section style={{ ...cardStyle, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '16px', zIndex: 100 }}>
        <div>
          <h2 style={{ fontSize: '24px', color: '#0f172a', margin: '0 0 8px 0', fontWeight: 800 }}>Model Performance Diagnostics</h2>
          <p style={{ color: '#64748b', margin: 0, fontWeight: 500 }}>SR 11-7 Continuous Monitoring & Validation Framework</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button 
            onClick={handleGenerateReport}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#2563eb', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)' }}
          >
            ✨ Generate AI Report
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Snapshot:</label>
            <select 
              value={selectedQuarter} 
              onChange={(e) => setSelectedQuarter(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
            >
              {history.map(h => <option key={h.quarter} value={h.quarter}>{h.quarter}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* ── KPI RIBBON ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <MetricCard title="Gini Coefficient" value={latestQ.gini} prevValue={prevQ.gini} format="decimal" dataKey="gini" history={history} higherIsBetter={true} targetLine="≥ 0.55 (Green)" />
        <MetricCard title="AUC" value={latestQ.auc} prevValue={prevQ.auc} format="decimal" dataKey="auc" history={history} higherIsBetter={true} targetLine="≥ 0.75 (Green)" />
        <MetricCard title="KS Statistic" value={latestQ.ks} prevValue={prevQ.ks} format="percent" dataKey="ks" history={history} higherIsBetter={true} targetLine="≥ 30% (Green)" />
        <MetricCard title="PSI" value={latestQ.psi} prevValue={prevQ.psi} format="decimal" dataKey="psi" history={history} higherIsBetter={false} targetLine="< 0.10 (Green)" />
        <MetricCard title="Calibration Gap" value={latestQ.cal_gap} prevValue={prevQ.cal_gap} format="decimal" dataKey="cal_gap" history={history} higherIsBetter={false} targetLine="< 0.03 (Green)" />
        <MetricCard title="Avg Predicted PD" value={latestQ.avg_pred_pd * 100} prevValue={prevQ.avg_pred_pd * 100} format="percent" dataKey="avg_pred_pd" history={history} higherIsBetter={false} targetLine="Monitoring only" />
        <MetricCard title="Actual Default Rate" value={latestQ.actual_default_rate * 100} prevValue={prevQ.actual_default_rate * 100} format="percent" dataKey="actual_default_rate" history={history} higherIsBetter={false} targetLine="Monitoring only" />
      </div>

      {/* ── THE 3x2 TREND GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '48px' }}>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Gini Coefficient — Trend</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0.3, 0.7]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => t.toFixed(2)} />
                <Tooltip />
                <ReferenceLine y={0.55} stroke="#16a34a" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Green ≥ 0.55', fill: '#16a34a', fontSize: 11, fontWeight: 600 }} />
                <ReferenceLine y={0.50} stroke="#dc2626" strokeDasharray="4 4" label={{ position: 'insideBottomRight', value: 'Red < 0.50', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
                <Line type="monotone" dataKey="gini" stroke="#0f172a" strokeWidth={3} dot={{ r: 5, fill: '#0f172a' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>AUC — Trend</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0.55, 0.85]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => t.toFixed(2)} />
                <Tooltip />
                <ReferenceLine y={0.75} stroke="#16a34a" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Green ≥ 0.75', fill: '#16a34a', fontSize: 11, fontWeight: 600 }} />
                <ReferenceLine y={0.70} stroke="#dc2626" strokeDasharray="4 4" label={{ position: 'insideBottomRight', value: 'Red < 0.70', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
                <Line type="monotone" dataKey="auc" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>KS Statistic — Trend</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[10, 45]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => t+'%'} />
                <Tooltip formatter={v => v+'%'} />
                <ReferenceLine y={30} stroke="#16a34a" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Green ≥ 30%', fill: '#16a34a', fontSize: 11, fontWeight: 600 }} />
                <ReferenceLine y={25} stroke="#dc2626" strokeDasharray="4 4" label={{ position: 'insideBottomRight', value: 'Red < 25%', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
                <Line type="monotone" dataKey="ks" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 5, fill: '#0ea5e9' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Population Stability Index — Trend</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0.0, 0.4]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => t.toFixed(2)} />
                <Tooltip />
                <ReferenceLine y={0.10} stroke="#16a34a" strokeDasharray="4 4" label={{ position: 'insideBottomRight', value: 'Green < 0.10', fill: '#16a34a', fontSize: 11, fontWeight: 600 }} />
                <ReferenceLine y={0.25} stroke="#dc2626" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Red > 0.25', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
                <Line type="monotone" dataKey="psi" stroke="#b45309" strokeWidth={3} dot={{ r: 5, fill: '#b45309' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px', marginBottom: '48px' }}>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Predicted PD vs Actual Default Rate</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 0.3]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => (t*100).toFixed(1)+'%'} />
                <Tooltip formatter={v => (v*100).toFixed(1)+'%'} />
                <Legend verticalAlign="bottom" />
                <Line type="monotone" dataKey="avg_pred_pd" name="Avg Predicted PD" stroke="#475569" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="actual_default_rate" name="Actual Default Rate" stroke="#991b1b" strokeWidth={3} dot={{ r: 5, fill: '#fff', stroke: '#991b1b', strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div> 

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Calibration Gap — Trend</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0.0, 0.15]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => t.toFixed(2)} />
                <Tooltip />
                <ReferenceLine y={0.03} stroke="#16a34a" strokeDasharray="4 4" label={{ position: 'insideBottomRight', value: 'Green < 0.03', fill: '#16a34a', fontSize: 11, fontWeight: 600 }} />
                <ReferenceLine y={0.07} stroke="#dc2626" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Red > 0.07', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
                <Line type="monotone" dataKey="cal_gap" stroke="#991b1b" strokeWidth={3} dot={{ r: 5, fill: '#991b1b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── SECTION 6 PERFORMANCE DIAGNOSTICS ── */}
      <h3 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderLeft: '3px solid #0f172a', paddingLeft: '8px' }}>
        Section 6 — Performance Diagnostics — {selectedQuarter}
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* CONFUSION MATRIX WITH AI THRESHOLD OPTIMIZER */}
        <div style={{...cardStyle, marginBottom: 0}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Confusion Matrix</h3>
            <button 
              onClick={handleOptimizeThreshold}
              disabled={thresholdAI.loading}
              style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              {thresholdAI.loading ? 'Analyzing...' : '✨ Optimize Threshold'}
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '12px' }}>
            <div />
            <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Predicted: Good</div>
            <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Predicted: Bad</div>

            <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Actual:<br/>Good</div>
            <div style={{ border: '1px solid #86efac', background: '#f0fdf4', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#064e3b', marginBottom: '8px' }}>True Negatives</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{formatCount(cm.tn)}</div>
              <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600, marginTop: '4px' }}>{(tnRate * 100).toFixed(1)}%</div>
            </div>
            <div style={{ border: '1px solid #fca5a5', background: '#fef2f2', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#7f1d1d', marginBottom: '8px' }}>False Positives</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{formatCount(cm.fp)}</div>
              <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600, marginTop: '4px' }}>{(fpRate * 100).toFixed(1)}%</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Actual:<br/>Bad</div>
            <div style={{ border: '1px solid #fca5a5', background: '#fef2f2', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#7f1d1d', marginBottom: '8px' }}>False Negatives</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{formatCount(cm.fn)}</div>
              <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600, marginTop: '4px' }}>{(fnRate * 100).toFixed(1)}%</div>
            </div>
            <div style={{ border: '1px solid #86efac', background: '#f0fdf4', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#064e3b', marginBottom: '8px' }}>True Positives</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{formatCount(cm.tp)}</div>
              <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600, marginTop: '4px' }}>{(tpRate * 100).toFixed(1)}%</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
            <span>Total scored: <strong>{formatCount(cmTotal)}</strong></span>
            <span>FP Rate: <strong style={{ color: '#dc2626' }}>{(fpRate * 100).toFixed(1)}%</strong></span>
            <span>FN Rate: <strong style={{ color: '#dc2626' }}>{(fnRate * 100).toFixed(1)}%</strong></span>
          </div>

          {/* AI Threshold Recommendation Box */}
          {thresholdAI.content && (
            <div style={{ marginTop: '20px', padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
              <strong style={{ fontSize: '12px', color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>✨ Strategic Recommendation</strong>
              <span style={{ fontSize: '14px', color: '#14532d', fontWeight: 500 }}>{thresholdAI.content}</span>
            </div>
          )}
        </div>

        <div style={{...cardStyle, marginBottom: 0}}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700 }}>ROC Curve — AUC {latestQ.auc.toFixed(3)}</h3>
          <div style={{ flex: 1, minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#e2e8f0" />
                <XAxis dataKey="fpr" type="number" domain={[0, 100]} tickFormatter={t => t+'%'} tick={{ fill: '#64748b', fontSize: 12 }} label={{ value: 'False Positive Rate', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 12 }} />
                <YAxis dataKey="tpr" type="number" domain={[0, 100]} tickFormatter={t => t+'%'} tick={{ fill: '#64748b', fontSize: 12 }} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', offset: -5, fill: '#64748b', fontSize: 12 }} />
                <Tooltip formatter={(val) => `${val.toFixed(1)}%`} />
                <Legend verticalAlign="bottom" height={20} wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="tpr" name="Model ROC" stroke="#0f172a" strokeWidth={3} dot={false} />
                <Line type="linear" dataKey="baseline" name="Random Guess" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Charts with AI Micro-Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
        
        {/* Calibration Curve */}
        <div style={{...cardStyle, marginBottom: 0}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Calibration Curve — Decile</h3>
            <button onClick={() => handleGetInsight('Calibration Curve', calibrationData)} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {insights['Calibration Curve']?.loading ? 'Analyzing...' : '✨ Generate Insight'}
            </button>
          </div>
          <div style={{ flex: 1, minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calibrationData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="predicted_pd" type="number" domain={[0, 'dataMax']} tickFormatter={t => t.toFixed(0)+'%'} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tickFormatter={t => t.toFixed(0)+'%'} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip formatter={v => v.toFixed(2)+'%'} />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="actual_pd" name="Actual Default Rate" stroke="#0f172a" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} />
                <Line type="linear" dataKey="perfect_calibration" name="Predicted PD" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {insights['Calibration Curve']?.text && (
             <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderLeft: '3px solid #3b82f6', fontSize: '13px', color: '#334155' }}>
               {insights['Calibration Curve'].text}
             </div>
          )}
        </div>

        {/* Score Band Distribution */}
        <div style={{...cardStyle, marginBottom: 0}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Score Band Distribution</h3>
            <button onClick={() => handleGetInsight('Score Band Distribution', scoreBandData)} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {insights['Score Band Distribution']?.loading ? 'Analyzing...' : '✨ Generate Insight'}
            </button>
          </div>
          <div style={{ flex: 1, minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={scoreBandData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="score_band" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis yAxisId="left" tickFormatter={t => t.toLocaleString()} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={t => t+'%'} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="customer_count" name="Customers" fill="#1e3a8a" radius={[2, 2, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="actual_bad_rate" name="Bad Rate" stroke="#991b1b" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#991b1b' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {insights['Score Band Distribution']?.text && (
             <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderLeft: '3px solid #3b82f6', fontSize: '13px', color: '#334155' }}>
               {insights['Score Band Distribution'].text}
             </div>
          )}
        </div>
      </div>

      {/* ── HISTORICAL MATRIX ── */}
      <div style={cardStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                <th style={{ padding: '16px 12px' }}>Quarter</th>
                <th style={{ padding: '16px 12px' }}>Accounts</th>
                <th style={{ padding: '16px 12px' }}>Gini</th>
                <th style={{ padding: '16px 12px' }}>AUC</th>
                <th style={{ padding: '16px 12px' }}>KS</th>
                <th style={{ padding: '16px 12px' }}>PSI</th>
                <th style={{ padding: '16px 12px' }}>Cal. Gap</th>
                <th style={{ padding: '16px 12px' }}>Actual DR</th>
                <th style={{ padding: '16px 12px' }}>Pred PD</th>
                <th style={{ padding: '16px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => {
                const isSelected = h.quarter === selectedQuarter;
                const statusBadge = h.alert_status === 'Green' ? { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' } :
                                    h.alert_status === 'Amber' ? { bg: '#fef3c7', text: '#92400e', border: '#fde68a' } :
                                    { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };

                return (
                  <tr key={h.quarter} style={{ borderBottom: '1px solid #f1f5f9', background: isSelected ? '#f8fafc' : '#fff' }}>
                    <td style={{ padding: '16px 12px', fontWeight: 700, color: isSelected ? '#2563eb' : '#0f172a' }}>
                      {h.quarter} {isSelected && <span style={{fontSize:'11px', color:'#2563eb'}}>● selected</span>}
                    </td>
                    <td style={{ padding: '16px 12px' }}>{formatCount(h.total_accounts)}</td>
                    <td style={{ padding: '16px 12px', fontWeight: 600, color: h.gini >= 0.55 ? '#16a34a' : '#dc2626' }}>{h.gini.toFixed(3)}</td>
                    <td style={{ padding: '16px 12px', fontWeight: 600, color: h.auc >= 0.75 ? '#16a34a' : '#dc2626' }}>{h.auc.toFixed(3)}</td>
                    <td style={{ padding: '16px 12px', fontWeight: 600, color: h.ks >= 30 ? '#16a34a' : '#dc2626' }}>{h.ks.toFixed(1)}%</td>
                    <td style={{ padding: '16px 12px', fontWeight: 600, color: h.psi < 0.10 ? '#16a34a' : '#dc2626' }}>{h.psi.toFixed(2)}</td>
                    <td style={{ padding: '16px 12px', fontWeight: 600, color: h.cal_gap < 0.03 ? '#16a34a' : '#dc2626' }}>{h.cal_gap.toFixed(3)}</td>
                    <td style={{ padding: '16px 12px' }}>{(h.actual_default_rate * 100).toFixed(1)}%</td>
                    <td style={{ padding: '16px 12px' }}>{(h.avg_pred_pd * 100).toFixed(1)}%</td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{ background: statusBadge.bg, color: statusBadge.text, border: `1px solid ${statusBadge.border}`, padding: '4px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
                        {h.alert_status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── AI CHATBOT BUTTON ── */}
      {!isChatOpen && (
        <button onClick={() => setIsChatOpen(true)} style={{ position: 'fixed', right: '24px', bottom: '32px', zIndex: 1000, background: '#2563eb', color: '#fff', border: 'none', borderRadius: '50px', padding: '14px 24px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 15px rgba(37,99,235,0.3)', transition: 'transform 0.2s' }}>
          💬 AI Copilot
        </button>
      )}

      {/* ── AI CHATBOT SLIDING WINDOW ── */}
      <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '420px', background: '#fff', boxShadow: '-8px 0 20px rgba(0,0,0,0.15)', zIndex: 1001, transform: isChatOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ padding: '20px 24px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>✨</span> AI Model Risk Copilot
          </h3>
          <button onClick={() => setIsChatOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>&times;</button>
        </div>

        {/* Removed Persona Toggle Buttons from here */}

        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {chatMessages.map((msg, idx) => {
            const parts = msg.content.split('|||');
            const mainContent = parts[0];
            
            // Extract file download ID if present
            const downloadPart = parts.find(p => p.includes("DOWNLOAD_FILE:"));
            const fileId = downloadPart ? downloadPart.replace("DOWNLOAD_FILE:", "").trim() : null;

            // Extract follow-ups
            const followUps = parts.slice(1).map(f => f.trim()).filter(f => f.length > 0 && !f.startsWith("DOWNLOAD_FILE:"));
            const isLastMessage = idx === chatMessages.length - 1;

            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', width: '100%' }}>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', width: '100%' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.role === 'user' ? '#dbeafe' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  
                  <div className={msg.role === 'assistant' ? 'markdown-body' : ''} style={{ background: msg.role === 'user' ? '#2563eb' : '#fff', color: msg.role === 'user' ? '#fff' : '#0f172a', padding: '14px 18px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: '13.5px', lineHeight: 1.5, border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', maxWidth: '85%' }}>
                    {msg.role === 'assistant' ? <ReactMarkdown>{mainContent}</ReactMarkdown> : mainContent}

                    {/* God-Mode Download Interceptor */}
                    {fileId && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                        <a 
                          href={`${API_BASE_URL}/download/${fileId}`} 
                          download 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#10b981', color: '#fff', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)', border: '1px solid #059669', transition: 'all 0.2s' }}
                        >
                          <span style={{ fontSize: '16px' }}>📥</span> Download Cleaned CSV
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {msg.role === 'assistant' && isLastMessage && followUps.length > 0 && !isChatLoading && (
                  <div style={{ display: 'flex', gap: '8px', paddingLeft: '44px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {followUps.map((chip, cIdx) => (
                      <button 
                        key={cIdx} 
                        onClick={() => handleQuickPrompt(chip)}
                        style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '999px', fontSize: '11px', color: '#2563eb', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {chatMessages.length === 1 && !isChatLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              {getQuickPrompts().map((prompt, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleQuickPrompt(prompt)}
                  style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', fontSize: '12.5px', color: '#334155', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', lineHeight: 1.4, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#1d4ed8'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {isChatLoading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
               <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <svg className="loading-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                 Analyzing context...
               </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea 
              rows="2"
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              onKeyDown={handleKeyDown}
              disabled={isChatLoading} 
              placeholder="Ask about this model's performance..." 
              style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', background: '#f8fafc', resize: 'none', fontFamily: 'inherit' }} 
            />
            <button 
              type="submit" 
              disabled={isChatLoading || !chatInput.trim()} 
              style={{ width: '44px', height: '44px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '50%', cursor: !chatInput.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (isChatLoading || !chatInput.trim()) ? 0.6 : 1, marginBottom: '2px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '10px', color: '#94a3b8' }}>Press Enter to send, Shift+Enter for new line</div>
        </div>
      </div>

    </main>
  )
}
// -------------------------------------------------------

// import { useState, useEffect, useRef } from 'react'
// import ReactMarkdown from 'react-markdown'
// import { API_BASE_URL } from '../config';
// import {
//   CartesianGrid, Line, LineChart, ResponsiveContainer,
//   Tooltip, XAxis, YAxis, Legend, ComposedChart, Bar, ReferenceLine
// } from 'recharts'

// function formatCount(value) {
//   if (value == null || Number.isNaN(Number(value))) return '—'
//   return Number(value).toLocaleString()
// }

// // --- HARDCODED HISTORICAL DATA ---
// const mockHistoricalData = [
//   { quarter: "2023 Q3", total_accounts: 28500, avg_pred_pd: 0.205, actual_default_rate: 0.201, gini: 0.620, auc: 0.810, ks: 38.0, psi: 0.04, cal_gap: 0.004, alert_status: "Green" },
//   { quarter: "2023 Q4", total_accounts: 29000, avg_pred_pd: 0.210, actual_default_rate: 0.208, gini: 0.605, auc: 0.800, ks: 36.5, psi: 0.06, cal_gap: 0.006, alert_status: "Green" },
//   { quarter: "2024 Q1", total_accounts: 30000, avg_pred_pd: 0.218, actual_default_rate: 0.214, gini: 0.580, auc: 0.790, ks: 34.0, psi: 0.08, cal_gap: 0.012, alert_status: "Green" },
//   { quarter: "2024 Q2", total_accounts: 30250, avg_pred_pd: 0.224, actual_default_rate: 0.221, gini: 0.530, auc: 0.760, ks: 31.0, psi: 0.14, cal_gap: 0.031, alert_status: "Amber" },
//   { quarter: "2024 Q3", total_accounts: 30000, avg_pred_pd: 0.228, actual_default_rate: 0.226, gini: 0.475, auc: 0.720, ks: 27.0, psi: 0.23, cal_gap: 0.058, alert_status: "Red" },
//   { quarter: "2024 Q4", total_accounts: 31000, avg_pred_pd: 0.231, actual_default_rate: 0.245, gini: 0.440, auc: 0.680, ks: 24.0, psi: 0.27, cal_gap: 0.082, alert_status: "Red" },
//   { quarter: "2025 Q1", total_accounts: 31500, avg_pred_pd: 0.235, actual_default_rate: 0.270, gini: 0.390, auc: 0.620, ks: 19.0, psi: 0.31, cal_gap: 0.114, alert_status: "Red" }
// ];

// // --- DYNAMIC MICRO DATA STORE ---
// const generateMockDataForQuarter = (healthMultiplier) => ({
//   confusion_matrix: { 
//     tn: Math.round(29120 * healthMultiplier), 
//     fp: Math.round(677 / healthMultiplier), 
//     fn: Math.round(3346 / healthMultiplier), 
//     tp: Math.round(3068 * healthMultiplier) 
//   },
//   roc_data: [
//     { fpr: 0, tpr: 0, baseline: 0 },
//     { fpr: 10, tpr: Math.min(100, 35 * healthMultiplier), baseline: 10 },
//     { fpr: 25, tpr: Math.min(100, 65 * healthMultiplier), baseline: 25 },
//     { fpr: 50, tpr: Math.min(100, 85 * healthMultiplier), baseline: 50 },
//     { fpr: 75, tpr: Math.min(100, 95 * healthMultiplier), baseline: 75 },
//     { fpr: 100, tpr: 100, baseline: 100 }
//   ],
//   pd_decile_analysis: [
//     { decile: 1, customer_count: 3000, average_pd: 0.064, actual_bad_rate: 0.07 * (2 - healthMultiplier) },
//     { decile: 2, customer_count: 3000, average_pd: 0.094, actual_bad_rate: 0.076 * (2 - healthMultiplier) },
//     { decile: 3, customer_count: 3000, average_pd: 0.112, actual_bad_rate: 0.092 * (2 - healthMultiplier) },
//     { decile: 4, customer_count: 3000, average_pd: 0.129, actual_bad_rate: 0.117 * (2 - healthMultiplier) },
//     { decile: 5, customer_count: 3000, average_pd: 0.148, actual_bad_rate: 0.135 * (2 - healthMultiplier) },
//     { decile: 6, customer_count: 3000, average_pd: 0.170, actual_bad_rate: 0.134 * (2 - healthMultiplier) },
//     { decile: 7, customer_count: 3000, average_pd: 0.199, actual_bad_rate: 0.177 * (2 - healthMultiplier) },
//     { decile: 8, customer_count: 3000, average_pd: 0.254, actual_bad_rate: 0.261 * (2 - healthMultiplier) },
//     { decile: 9, customer_count: 3000, average_pd: 0.396, actual_bad_rate: 0.434 * (2 - healthMultiplier) },
//     { decile: 10, customer_count: 3000, average_pd: 0.645, actual_bad_rate: 0.738 * (2 - healthMultiplier) }
//   ],
//   score_band_analysis: [
//     { score_band: '550-599', customer_count: Math.round(3100 * (2 - healthMultiplier)), actual_bad_rate: 65.2 },
//     { score_band: '600-649', customer_count: Math.round(8200 * (2 - healthMultiplier)), actual_bad_rate: 35.1 },
//     { score_band: '650-699', customer_count: Math.round(11000 * healthMultiplier), actual_bad_rate: 15.4 },
//     { score_band: '700-749', customer_count: Math.round(5100 * healthMultiplier), actual_bad_rate: 5.2 },
//     { score_band: '750+', customer_count: Math.round(1200 * healthMultiplier), actual_bad_rate: 1.8 }
//   ]
// });

// const mockAnalysisStore = {
//   "2023 Q3": generateMockDataForQuarter(1.4),
//   "2023 Q4": generateMockDataForQuarter(1.3),
//   "2024 Q1": generateMockDataForQuarter(1.2),
//   "2024 Q2": generateMockDataForQuarter(1.1),
//   "2024 Q3": generateMockDataForQuarter(0.9),
//   "2024 Q4": generateMockDataForQuarter(0.8),
//   "2025 Q1": generateMockDataForQuarter(0.7)
// };

// // --- CUSTOM KPI CARD COMPONENT ---
// function MetricCard({ title, value, prevValue, targetLine, history, dataKey, format = 'number', higherIsBetter = true }) {
//   let displayValue = value;
//   if (format === 'percent') displayValue = value?.toFixed(1) + '%';
//   else if (format === 'decimal') displayValue = value?.toFixed(3);

//   const delta = value - prevValue;
//   const isPositiveDelta = delta > 0;
  
//   let color = '#475569';
//   let arrow = '';
//   if (delta !== 0) {
//     const isGood = higherIsBetter ? isPositiveDelta : !isPositiveDelta;
//     color = isGood ? '#16a34a' : '#dc2626';
//     arrow = isPositiveDelta ? '▲' : '▼';
//   }

//   return (
//     <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
//       <div>
//         <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h4>
//         <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{displayValue}</div>
//         <div style={{ fontSize: '12px', fontWeight: 600, color: color, display: 'flex', alignItems: 'center', gap: '4px' }}>
//           <span>{arrow} {Math.abs(delta).toFixed(format === 'percent' ? 1 : 3)} vs prev</span>
//         </div>
//       </div>
//       <div style={{ height: '40px', marginTop: '16px' }}>
//         <ResponsiveContainer width="100%" height="100%">
//           <LineChart data={history}>
//             <Line type="monotone" dataKey={dataKey} stroke={color !== '#475569' ? color : '#2563eb'} strokeWidth={2} dot={false} />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//       <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
//         {targetLine}
//       </div>
//     </div>
//   )
// }

// export default function ModelMonitoring({ analysisResult }) {
//   const [history, setHistory] = useState(mockHistoricalData)
//   const [selectedQuarter, setSelectedQuarter] = useState(mockHistoricalData[mockHistoricalData.length - 1].quarter)

//   // ── INLINE AI STATE ──
//   const [isReportOpen, setIsReportOpen] = useState(false);
//   const [reportData, setReportData] = useState({ loading: false, content: null });
//   const [insights, setInsights] = useState({});
//   const [thresholdAI, setThresholdAI] = useState({ loading: false, content: null });

//   // ── CHATBOT STATE (UPDATED FOR MONITORING AGENT) ──
//   const [isChatOpen, setIsChatOpen] = useState(false)
//   const [chatInput, setChatInput] = useState('')
//   const [isChatLoading, setIsChatLoading] = useState(false)
//   const [chatPersona, setChatPersona] = useState('SR 11-7 Validator')
//   const [chatMessages, setChatMessages] = useState([
//     { role: 'assistant', content: 'Hello! I am your SR 11-7 Model Monitoring Agent. How can I assist you with the model drift analysis today?' }
//   ])
//   const messagesEndRef = useRef(null)

//   // Auto-scroll chat
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
//   }, [chatMessages, isChatLoading, isChatOpen])

//   const latestQ = history.find(h => h.quarter === selectedQuarter) || history[history.length - 1];
//   const prevQIndex = history.findIndex(h => h.quarter === selectedQuarter) - 1;
//   const prevQ = prevQIndex >= 0 ? history[prevQIndex] : latestQ;

//   const activeAnalysis = analysisResult || mockAnalysisStore[selectedQuarter] || mockAnalysisStore["2025 Q1"];
//   const cm = activeAnalysis.confusion_matrix || { tn: 0, fp: 0, fn: 0, tp: 0 }
//   const scoreBandData = activeAnalysis.score_band_analysis || []
//   const pdDecileData = activeAnalysis.pd_decile_analysis || []
//   const rocData = activeAnalysis.roc_data || []

//   // ── INLINE AI HANDLERS ──
//   const handleGenerateReport = async () => {
//     setIsReportOpen(true);
//     setReportData({ loading: true, content: null });
//     try {
//       const res = await fetch(`${API_BASE_URL}/agents/monitoring`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ history: history })
//       });
//       const data = await res.json();
//       setReportData({ loading: false, content: data.report_markdown });
//     } catch (e) {
//       setReportData({ loading: false, content: "⚠️ Failed to load AI report. Check backend connection." });
//     }
//   };

//   const handleOptimizeThreshold = async () => {
//     setThresholdAI({ loading: true, content: null });
//     try {
//       const res = await fetch(`${API_BASE_URL}/agents/optimize-threshold`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ confusion_matrix: cm })
//       });
//       const data = await res.json();
//       setThresholdAI({ loading: false, content: data.recommendation });
//     } catch (e) {
//       setThresholdAI({ loading: false, content: "⚠️ AI optimization failed." });
//     }
//   };

//   const handleGetInsight = async (chartName, chartData) => {
//     setInsights(prev => ({ ...prev, [chartName]: { loading: true, text: null } }));
//     try {
//       const res = await fetch(`${API_BASE_URL}/agents/chart-insight`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ chart_type: chartName, chart_data: chartData })
//       });
//       const data = await res.json();
//       setInsights(prev => ({ ...prev, [chartName]: { loading: false, text: data.insight } }));
//     } catch (e) {
//       setInsights(prev => ({ ...prev, [chartName]: { loading: false, text: "Failed to generate insight." } }));
//     }
//   };

//   // ── CHATBOT HANDLERS (UPDATED TO HIT THE NEW BRAIN) ──
//   const getQuickPrompts = () => {
//     if (chatPersona === 'SR 11-7 Validator') {
//       return [
//         `Why did the Gini drop to ${latestQ.gini.toFixed(3)} in ${selectedQuarter}?`, 
//         "Does the current PSI breach regulatory limits?",
//         "Summarize the Calibration Gap trend."
//       ];
//     } else {
//       return [
//         "What are the implications of the False Negative rate?", 
//         "How do we adjust the decision threshold?", 
//         "Generate Python code to recalculate the KS Statistic."
//       ];
//     }
//   }

//   const handlePersonaSwitch = (newPersona) => {
//     setChatPersona(newPersona);
//     setChatMessages([
//       { role: 'assistant', content: `Switched to **${newPersona}** mode. How can I assist you with model monitoring today?` }
//     ]);
//   }

//   const processChat = async (messageText) => {
//     const userMessage = { role: 'user', content: messageText };
//     const newHistory = [...chatMessages, userMessage];
//     setChatMessages(newHistory); 
//     setChatInput(''); 
//     setIsChatLoading(true);
    
//     try {
//       // Pass the EXACT dashboard context to the AI so it knows what the user sees
//       const richContext = `
//         Current Quarter Viewed: ${selectedQuarter}
//         Overall Status: ${latestQ.alert_status}
//         Gini Coefficient: ${latestQ.gini.toFixed(3)}
//         AUC: ${latestQ.auc.toFixed(3)}
//         KS Statistic: ${latestQ.ks.toFixed(1)}%
//         PSI (Population Stability Index): ${latestQ.psi.toFixed(2)}
//         Calibration Gap: ${latestQ.cal_gap.toFixed(3)}
//         Actual Default Rate: ${(latestQ.actual_default_rate * 100).toFixed(1)}%
//         Avg Predicted PD: ${(latestQ.avg_pred_pd * 100).toFixed(1)}%
//       `;

//       const cleanHistory = newHistory.map(m => ({
//         role: m.role,
//         content: m.content.split('|||')[0].trim() 
//       }));

//       // HIT THE NEW MONITORING ENDPOINT
//       const response = await fetch(`${API_BASE_URL}/chat-monitoring`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           messages: cleanHistory,
//           context_summary: richContext,
//           persona: chatPersona
//         })
//       });
      
//       const data = await response.json();
//       setChatMessages([...newHistory, { role: 'assistant', content: data.reply }]);
//     } catch (err) {
//       setChatMessages([...newHistory, { role: 'assistant', content: '⚠️ Connection failed. Ensure backend is running.' }]);
//     } finally {
//       setIsChatLoading(false);
//     }
//   }

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!chatInput.trim() || isChatLoading) return;
//     await processChat(chatInput);
//   }

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage(e);
//     }
//   }

//   const handleQuickPrompt = async (promptText) => {
//     if (isChatLoading) return;
//     await processChat(promptText);
//   }

//   // ── DERIVED METRICS ──
//   const calibrationData = pdDecileData.map((d) => ({
//     decile: d.decile,
//     predicted_pd: d.average_pd * 100,
//     actual_pd: d.actual_bad_rate * 100, 
//     perfect_calibration: d.average_pd * 100
//   }))

//   const cmTotal = cm.tn + cm.fp + cm.fn + cm.tp || 1;
//   const fpRate = cm.fp / Math.max(cm.tn + cm.fp, 1)
//   const fnRate = cm.fn / Math.max(cm.fn + cm.tp, 1)
//   const tnRate = cm.tn / Math.max(cm.tn + cm.fp, 1)
//   const tpRate = cm.tp / Math.max(cm.fn + cm.tp, 1)

//   const cardStyle = {
//     background: '#fff',
//     borderRadius: '12px',
//     padding: '24px',
//     boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
//     border: '1px solid #e2e8f0',
//     marginBottom: '24px',
//     display: 'flex',
//     flexDirection: 'column'
//   }

//   return (
//     <main style={{ background: '#f4f7f9', minHeight: '100vh', padding: '24px', paddingBottom: '100px', overflowX: 'hidden' }}>
      
//       {/* ── SR 11-7 REPORT MODAL ── */}
//       {isReportOpen && (
//         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
//           <div style={{ background: '#fff', width: '100%', maxWidth: '800px', maxHeight: '90vh', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
//             <div style={{ padding: '20px 24px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//               <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
//                 ✨ SR 11-7 Autonomous Validation Report
//               </h3>
//               <button onClick={() => setIsReportOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '28px', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
//             </div>
//             <div className="markdown-body" style={{ padding: '32px', overflowY: 'auto', flex: 1, fontSize: '15px', lineHeight: 1.6, color: '#334155' }}>
//               {reportData.loading ? (
//                 <div style={{ textAlign: 'center', padding: '40px' }}>
//                   <svg style={{ animation: 'spin 1s linear infinite' }} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
//                   <p style={{ marginTop: '16px', fontWeight: 600, color: '#0f172a' }}>AI is analyzing multi-quarter drift...</p>
//                 </div>
//               ) : (
//                 <ReactMarkdown>{reportData.content}</ReactMarkdown>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       <style>{`
//         @keyframes spin { 100% { transform: rotate(360deg); } }
//         .markdown-body pre { background: #0f172a; color: #f8fafc; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 13px; margin: 12px 0; border: 1px solid #334155; }
//         .markdown-body code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; }
//       `}</style>

//       {/* ── TOP NAV BAR ── */}
//       <section style={{ ...cardStyle, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '16px', zIndex: 100 }}>
//         <div>
//           <h2 style={{ fontSize: '24px', color: '#0f172a', margin: '0 0 8px 0', fontWeight: 800 }}>Model Performance Diagnostics</h2>
//           <p style={{ color: '#64748b', margin: 0, fontWeight: 500 }}>SR 11-7 Continuous Monitoring & Validation Framework</p>
//         </div>
//         <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
//           <button 
//             onClick={handleGenerateReport}
//             style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#2563eb', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)' }}
//           >
//             ✨ Generate AI Report
//           </button>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//             <label style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Snapshot:</label>
//             <select 
//               value={selectedQuarter} 
//               onChange={(e) => setSelectedQuarter(e.target.value)}
//               style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
//             >
//               {history.map(h => <option key={h.quarter} value={h.quarter}>{h.quarter}</option>)}
//             </select>
//           </div>
//         </div>
//       </section>

//       {/* ── KPI RIBBON ── */}
//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '16px', marginBottom: '32px' }}>
//         <MetricCard title="Gini Coefficient" value={latestQ.gini} prevValue={prevQ.gini} format="decimal" dataKey="gini" history={history} higherIsBetter={true} targetLine="≥ 0.55 (Green)" />
//         <MetricCard title="AUC" value={latestQ.auc} prevValue={prevQ.auc} format="decimal" dataKey="auc" history={history} higherIsBetter={true} targetLine="≥ 0.75 (Green)" />
//         <MetricCard title="KS Statistic" value={latestQ.ks} prevValue={prevQ.ks} format="percent" dataKey="ks" history={history} higherIsBetter={true} targetLine="≥ 30% (Green)" />
//         <MetricCard title="PSI" value={latestQ.psi} prevValue={prevQ.psi} format="decimal" dataKey="psi" history={history} higherIsBetter={false} targetLine="< 0.10 (Green)" />
//         <MetricCard title="Calibration Gap" value={latestQ.cal_gap} prevValue={prevQ.cal_gap} format="decimal" dataKey="cal_gap" history={history} higherIsBetter={false} targetLine="< 0.03 (Green)" />
//         <MetricCard title="Avg Predicted PD" value={latestQ.avg_pred_pd * 100} prevValue={prevQ.avg_pred_pd * 100} format="percent" dataKey="avg_pred_pd" history={history} higherIsBetter={false} targetLine="Monitoring only" />
//         <MetricCard title="Actual Default Rate" value={latestQ.actual_default_rate * 100} prevValue={prevQ.actual_default_rate * 100} format="percent" dataKey="actual_default_rate" history={history} higherIsBetter={false} targetLine="Monitoring only" />
//       </div>

//       {/* ── THE 3x2 TREND GRID ── */}
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '48px' }}>
//         <div style={cardStyle}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Gini Coefficient — Trend</h3>
//           <div style={{ height: '250px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
//                 <YAxis domain={[0.3, 0.7]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => t.toFixed(2)} />
//                 <Tooltip />
//                 <ReferenceLine y={0.55} stroke="#16a34a" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Green ≥ 0.55', fill: '#16a34a', fontSize: 11, fontWeight: 600 }} />
//                 <ReferenceLine y={0.50} stroke="#dc2626" strokeDasharray="4 4" label={{ position: 'insideBottomRight', value: 'Red < 0.50', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
//                 <Line type="monotone" dataKey="gini" stroke="#0f172a" strokeWidth={3} dot={{ r: 5, fill: '#0f172a' }} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div style={cardStyle}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>AUC — Trend</h3>
//           <div style={{ height: '250px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
//                 <YAxis domain={[0.55, 0.85]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => t.toFixed(2)} />
//                 <Tooltip />
//                 <ReferenceLine y={0.75} stroke="#16a34a" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Green ≥ 0.75', fill: '#16a34a', fontSize: 11, fontWeight: 600 }} />
//                 <ReferenceLine y={0.70} stroke="#dc2626" strokeDasharray="4 4" label={{ position: 'insideBottomRight', value: 'Red < 0.70', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
//                 <Line type="monotone" dataKey="auc" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, fill: '#8b5cf6' }} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div style={cardStyle}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>KS Statistic — Trend</h3>
//           <div style={{ height: '250px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
//                 <YAxis domain={[10, 45]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => t+'%'} />
//                 <Tooltip formatter={v => v+'%'} />
//                 <ReferenceLine y={30} stroke="#16a34a" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Green ≥ 30%', fill: '#16a34a', fontSize: 11, fontWeight: 600 }} />
//                 <ReferenceLine y={25} stroke="#dc2626" strokeDasharray="4 4" label={{ position: 'insideBottomRight', value: 'Red < 25%', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
//                 <Line type="monotone" dataKey="ks" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 5, fill: '#0ea5e9' }} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div style={cardStyle}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Population Stability Index — Trend</h3>
//           <div style={{ height: '250px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
//                 <YAxis domain={[0.0, 0.4]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => t.toFixed(2)} />
//                 <Tooltip />
//                 <ReferenceLine y={0.10} stroke="#16a34a" strokeDasharray="4 4" label={{ position: 'insideBottomRight', value: 'Green < 0.10', fill: '#16a34a', fontSize: 11, fontWeight: 600 }} />
//                 <ReferenceLine y={0.25} stroke="#dc2626" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Red > 0.25', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
//                 <Line type="monotone" dataKey="psi" stroke="#b45309" strokeWidth={3} dot={{ r: 5, fill: '#b45309' }} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>

//       <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px', marginBottom: '48px' }}>
//         <div style={cardStyle}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Predicted PD vs Actual Default Rate</h3>
//           <div style={{ height: '250px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <ComposedChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
//                 <YAxis domain={[0, 0.3]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => (t*100).toFixed(1)+'%'} />
//                 <Tooltip formatter={v => (v*100).toFixed(1)+'%'} />
//                 <Legend verticalAlign="bottom" />
//                 <Line type="monotone" dataKey="avg_pred_pd" name="Avg Predicted PD" stroke="#475569" strokeDasharray="5 5" strokeWidth={2} dot={false} />
//                 <Line type="monotone" dataKey="actual_default_rate" name="Actual Default Rate" stroke="#991b1b" strokeWidth={3} dot={{ r: 5, fill: '#fff', stroke: '#991b1b', strokeWidth: 2 }} />
//               </ComposedChart>
//             </ResponsiveContainer>
//           </div>
//         </div> 

//         <div style={cardStyle}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Calibration Gap — Trend</h3>
//           <div style={{ height: '250px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
//                 <YAxis domain={[0.0, 0.15]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => t.toFixed(2)} />
//                 <Tooltip />
//                 <ReferenceLine y={0.03} stroke="#16a34a" strokeDasharray="4 4" label={{ position: 'insideBottomRight', value: 'Green < 0.03', fill: '#16a34a', fontSize: 11, fontWeight: 600 }} />
//                 <ReferenceLine y={0.07} stroke="#dc2626" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Red > 0.07', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
//                 <Line type="monotone" dataKey="cal_gap" stroke="#991b1b" strokeWidth={3} dot={{ r: 5, fill: '#991b1b' }} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>

//       {/* ── SECTION 6 PERFORMANCE DIAGNOSTICS ── */}
//       <h3 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderLeft: '3px solid #0f172a', paddingLeft: '8px' }}>
//         Section 6 — Performance Diagnostics — {selectedQuarter}
//       </h3>
      
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
//         {/* CONFUSION MATRIX WITH AI THRESHOLD OPTIMIZER */}
//         <div style={{...cardStyle, marginBottom: 0}}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//             <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Confusion Matrix</h3>
//             <button 
//               onClick={handleOptimizeThreshold}
//               disabled={thresholdAI.loading}
//               style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
//             >
//               {thresholdAI.loading ? 'Analyzing...' : '✨ Optimize Threshold'}
//             </button>
//           </div>
          
//           <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '12px' }}>
//             <div />
//             <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Predicted: Good</div>
//             <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Predicted: Bad</div>

//             <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Actual:<br/>Good</div>
//             <div style={{ border: '1px solid #86efac', background: '#f0fdf4', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
//               <div style={{ fontSize: '13px', fontWeight: 600, color: '#064e3b', marginBottom: '8px' }}>True Negatives</div>
//               <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{formatCount(cm.tn)}</div>
//               <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600, marginTop: '4px' }}>{(tnRate * 100).toFixed(1)}%</div>
//             </div>
//             <div style={{ border: '1px solid #fca5a5', background: '#fef2f2', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
//               <div style={{ fontSize: '13px', fontWeight: 600, color: '#7f1d1d', marginBottom: '8px' }}>False Positives</div>
//               <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{formatCount(cm.fp)}</div>
//               <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600, marginTop: '4px' }}>{(fpRate * 100).toFixed(1)}%</div>
//             </div>

//             <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Actual:<br/>Bad</div>
//             <div style={{ border: '1px solid #fca5a5', background: '#fef2f2', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
//               <div style={{ fontSize: '13px', fontWeight: 600, color: '#7f1d1d', marginBottom: '8px' }}>False Negatives</div>
//               <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{formatCount(cm.fn)}</div>
//               <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600, marginTop: '4px' }}>{(fnRate * 100).toFixed(1)}%</div>
//             </div>
//             <div style={{ border: '1px solid #86efac', background: '#f0fdf4', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
//               <div style={{ fontSize: '13px', fontWeight: 600, color: '#064e3b', marginBottom: '8px' }}>True Positives</div>
//               <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{formatCount(cm.tp)}</div>
//               <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600, marginTop: '4px' }}>{(tpRate * 100).toFixed(1)}%</div>
//             </div>
//           </div>

//           <div style={{ display: 'flex', gap: '16px', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
//             <span>Total scored: <strong>{formatCount(cmTotal)}</strong></span>
//             <span>FP Rate: <strong style={{ color: '#dc2626' }}>{(fpRate * 100).toFixed(1)}%</strong></span>
//             <span>FN Rate: <strong style={{ color: '#dc2626' }}>{(fnRate * 100).toFixed(1)}%</strong></span>
//           </div>

//           {/* AI Threshold Recommendation Box */}
//           {thresholdAI.content && (
//             <div style={{ marginTop: '20px', padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
//               <strong style={{ fontSize: '12px', color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>✨ Strategic Recommendation</strong>
//               <span style={{ fontSize: '14px', color: '#14532d', fontWeight: 500 }}>{thresholdAI.content}</span>
//             </div>
//           )}
//         </div>

//         <div style={{...cardStyle, marginBottom: 0}}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700 }}>ROC Curve — AUC {latestQ.auc.toFixed(3)}</h3>
//           <div style={{ flex: 1, minHeight: '250px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={rocData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#e2e8f0" />
//                 <XAxis dataKey="fpr" type="number" domain={[0, 100]} tickFormatter={t => t+'%'} tick={{ fill: '#64748b', fontSize: 12 }} label={{ value: 'False Positive Rate', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 12 }} />
//                 <YAxis dataKey="tpr" type="number" domain={[0, 100]} tickFormatter={t => t+'%'} tick={{ fill: '#64748b', fontSize: 12 }} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', offset: -5, fill: '#64748b', fontSize: 12 }} />
//                 <Tooltip formatter={(val) => `${val.toFixed(1)}%`} />
//                 <Legend verticalAlign="bottom" height={20} wrapperStyle={{ paddingTop: '20px' }} />
//                 <Line type="monotone" dataKey="tpr" name="Model ROC" stroke="#0f172a" strokeWidth={3} dot={false} />
//                 <Line type="linear" dataKey="baseline" name="Random Guess" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>

//       {/* Row 2: Charts with AI Micro-Insights */}
//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
        
//         {/* Calibration Curve */}
//         <div style={{...cardStyle, marginBottom: 0}}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//             <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Calibration Curve — Decile</h3>
//             <button onClick={() => handleGetInsight('Calibration Curve', calibrationData)} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
//               {insights['Calibration Curve']?.loading ? 'Analyzing...' : '✨ Generate Insight'}
//             </button>
//           </div>
//           <div style={{ flex: 1, minHeight: '200px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={calibrationData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="predicted_pd" type="number" domain={[0, 'dataMax']} tickFormatter={t => t.toFixed(0)+'%'} tick={{ fill: '#64748b', fontSize: 11 }} />
//                 <YAxis tickFormatter={t => t.toFixed(0)+'%'} tick={{ fill: '#64748b', fontSize: 11 }} />
//                 <Tooltip formatter={v => v.toFixed(2)+'%'} />
//                 <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px' }} />
//                 <Line type="monotone" dataKey="actual_pd" name="Actual Default Rate" stroke="#0f172a" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} />
//                 <Line type="linear" dataKey="perfect_calibration" name="Predicted PD" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//           {insights['Calibration Curve']?.text && (
//              <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderLeft: '3px solid #3b82f6', fontSize: '13px', color: '#334155' }}>
//                {insights['Calibration Curve'].text}
//              </div>
//           )}
//         </div>

//         {/* Score Band Distribution */}
//         <div style={{...cardStyle, marginBottom: 0}}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//             <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Score Band Distribution</h3>
//             <button onClick={() => handleGetInsight('Score Band Distribution', scoreBandData)} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
//               {insights['Score Band Distribution']?.loading ? 'Analyzing...' : '✨ Generate Insight'}
//             </button>
//           </div>
//           <div style={{ flex: 1, minHeight: '200px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <ComposedChart data={scoreBandData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="score_band" tick={{ fill: '#64748b', fontSize: 11 }} />
//                 <YAxis yAxisId="left" tickFormatter={t => t.toLocaleString()} tick={{ fill: '#64748b', fontSize: 11 }} />
//                 <YAxis yAxisId="right" orientation="right" tickFormatter={t => t+'%'} tick={{ fill: '#64748b', fontSize: 11 }} />
//                 <Tooltip />
//                 <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px' }} />
//                 <Bar yAxisId="left" dataKey="customer_count" name="Customers" fill="#1e3a8a" radius={[2, 2, 0, 0]} />
//                 <Line yAxisId="right" type="monotone" dataKey="actual_bad_rate" name="Bad Rate" stroke="#991b1b" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#991b1b' }} />
//               </ComposedChart>
//             </ResponsiveContainer>
//           </div>
//           {insights['Score Band Distribution']?.text && (
//              <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderLeft: '3px solid #3b82f6', fontSize: '13px', color: '#334155' }}>
//                {insights['Score Band Distribution'].text}
//              </div>
//           )}
//         </div>
//       </div>

//       {/* ── AI CHATBOT BUTTON ── */}
//       {!isChatOpen && (
//         <button onClick={() => setIsChatOpen(true)} style={{ position: 'fixed', right: '24px', bottom: '32px', zIndex: 1000, background: '#2563eb', color: '#fff', border: 'none', borderRadius: '50px', padding: '14px 24px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 15px rgba(37,99,235,0.3)', transition: 'transform 0.2s' }}>
//           💬 AI Copilot
//         </button>
//       )}

//       {/* ── AI CHATBOT SLIDING WINDOW ── */}
//       <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '420px', background: '#fff', boxShadow: '-8px 0 20px rgba(0,0,0,0.15)', zIndex: 1001, transform: isChatOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column' }}>
        
//         <div style={{ padding: '20px 24px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
//             <span style={{ fontSize: '18px' }}>✨</span> AI Model Risk Copilot
//           </h3>
//           <button onClick={() => setIsChatOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>&times;</button>
//         </div>

//         <div style={{ padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
//           <button 
//             onClick={() => handlePersonaSwitch('SR 11-7 Validator')}
//             style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: chatPersona === 'SR 11-7 Validator' ? '#2563eb' : '#fff', color: chatPersona === 'SR 11-7 Validator' ? '#fff' : '#475569', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
//           >
//             🛡️ MRM Validator
//           </button>
//           <button 
//             onClick={() => handlePersonaSwitch('Lead Data Scientist')}
//             style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: chatPersona === 'Lead Data Scientist' ? '#2563eb' : '#fff', color: chatPersona === 'Lead Data Scientist' ? '#fff' : '#475569', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
//           >
//             🧪 Data Scientist
//           </button>
//         </div>

//         <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px' }}>
//           {chatMessages.map((msg, idx) => {
//             const parts = msg.content.split('|||');
//             const mainContent = parts[0];
            
//             // Extract file download ID if present
//             const downloadPart = parts.find(p => p.includes("DOWNLOAD_FILE:"));
//             const fileId = downloadPart ? downloadPart.replace("DOWNLOAD_FILE:", "").trim() : null;

//             // Extract follow-ups
//             const followUps = parts.slice(1).map(f => f.trim()).filter(f => f.length > 0 && !f.startsWith("DOWNLOAD_FILE:"));
//             const isLastMessage = idx === chatMessages.length - 1;

//             return (
//               <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', width: '100%' }}>
                
//                 <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', width: '100%' }}>
//                   <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.role === 'user' ? '#dbeafe' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
//                     {msg.role === 'user' ? '👤' : '🤖'}
//                   </div>
                  
//                   <div className={msg.role === 'assistant' ? 'markdown-body' : ''} style={{ background: msg.role === 'user' ? '#2563eb' : '#fff', color: msg.role === 'user' ? '#fff' : '#0f172a', padding: '14px 18px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: '13.5px', lineHeight: 1.5, border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', maxWidth: '85%' }}>
//                     {msg.role === 'assistant' ? <ReactMarkdown>{mainContent}</ReactMarkdown> : mainContent}

//                     {/* God-Mode Download Interceptor */}
//                     {fileId && (
//                       <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
//                         <a 
//                           href={`${API_BASE_URL}/download/${fileId}`} 
//                           download 
//                           style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#10b981', color: '#fff', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)', border: '1px solid #059669', transition: 'all 0.2s' }}
//                         >
//                           <span style={{ fontSize: '16px' }}>📥</span> Download Cleaned CSV
//                         </a>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {msg.role === 'assistant' && isLastMessage && followUps.length > 0 && !isChatLoading && (
//                   <div style={{ display: 'flex', gap: '8px', paddingLeft: '44px', flexWrap: 'wrap', marginTop: '4px' }}>
//                     {followUps.map((chip, cIdx) => (
//                       <button 
//                         key={cIdx} 
//                         onClick={() => handleQuickPrompt(chip)}
//                         style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '999px', fontSize: '11px', color: '#2563eb', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
//                         onMouseOver={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#93c5fd'; }}
//                         onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
//                       >
//                         {chip}
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )
//           })}

//           {chatMessages.length === 1 && !isChatLoading && (
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
//               {getQuickPrompts().map((prompt, idx) => (
//                 <button 
//                   key={idx} 
//                   onClick={() => handleQuickPrompt(prompt)}
//                   style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', fontSize: '12.5px', color: '#334155', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', lineHeight: 1.4, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
//                   onMouseOver={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#1d4ed8'; }}
//                   onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; }}
//                 >
//                   {prompt}
//                 </button>
//               ))}
//             </div>
//           )}

//           {isChatLoading && (
//             <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
//                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
//                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
//                  <svg className="loading-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
//                  Analyzing context...
//                </div>
//             </div>
//           )}
          
//           <div ref={messagesEndRef} />
//         </div>

//         <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
//           <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
//             <textarea 
//               rows="2"
//               value={chatInput} 
//               onChange={(e) => setChatInput(e.target.value)} 
//               onKeyDown={handleKeyDown}
//               disabled={isChatLoading} 
//               placeholder="Ask about this model's performance..." 
//               style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', background: '#f8fafc', resize: 'none', fontFamily: 'inherit' }} 
//             />
//             <button 
//               type="submit" 
//               disabled={isChatLoading || !chatInput.trim()} 
//               style={{ width: '44px', height: '44px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '50%', cursor: !chatInput.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (isChatLoading || !chatInput.trim()) ? 0.6 : 1, marginBottom: '2px' }}
//             >
//               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
//             </button>
//           </form>
//           <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '10px', color: '#94a3b8' }}>Press Enter to send, Shift+Enter for new line</div>
//         </div>
//       </div>

//     </main>
//   )
// }


















// import { useState, useEffect, useRef } from 'react'
// import ReactMarkdown from 'react-markdown'
// import { API_BASE_URL } from '../config';
// import {
//   CartesianGrid, Line, LineChart, ResponsiveContainer,
//   Tooltip, XAxis, YAxis, Legend, ComposedChart, Bar, ReferenceLine, Area
// } from 'recharts'

// function formatCount(value) {
//   if (value == null || Number.isNaN(Number(value))) return '—'
//   return Number(value).toLocaleString()
// }

// // --- HARDCODED HISTORICAL DATA ---
// const mockHistoricalData = [
//   { quarter: "2023 Q3", total_accounts: 28500, avg_pred_pd: 0.205, actual_default_rate: 0.201, gini: 0.620, auc: 0.810, ks: 38.0, psi: 0.04, cal_gap: 0.004, alert_status: "Green" },
//   { quarter: "2023 Q4", total_accounts: 29000, avg_pred_pd: 0.210, actual_default_rate: 0.208, gini: 0.605, auc: 0.800, ks: 36.5, psi: 0.06, cal_gap: 0.006, alert_status: "Green" },
//   { quarter: "2024 Q1", total_accounts: 30000, avg_pred_pd: 0.218, actual_default_rate: 0.214, gini: 0.580, auc: 0.790, ks: 34.0, psi: 0.08, cal_gap: 0.012, alert_status: "Green" },
//   { quarter: "2024 Q2", total_accounts: 30250, avg_pred_pd: 0.224, actual_default_rate: 0.221, gini: 0.530, auc: 0.760, ks: 31.0, psi: 0.14, cal_gap: 0.031, alert_status: "Amber" },
//   { quarter: "2024 Q3", total_accounts: 30000, avg_pred_pd: 0.228, actual_default_rate: 0.226, gini: 0.475, auc: 0.720, ks: 27.0, psi: 0.23, cal_gap: 0.058, alert_status: "Red" },
//   { quarter: "2024 Q4", total_accounts: 31000, avg_pred_pd: 0.231, actual_default_rate: 0.245, gini: 0.440, auc: 0.680, ks: 24.0, psi: 0.27, cal_gap: 0.082, alert_status: "Red" },
//   { quarter: "2025 Q1", total_accounts: 31500, avg_pred_pd: 0.235, actual_default_rate: 0.270, gini: 0.390, auc: 0.620, ks: 19.0, psi: 0.31, cal_gap: 0.114, alert_status: "Red" }
// ];

// // --- DYNAMIC MICRO DATA STORE ---
// const generateMockDataForQuarter = (healthMultiplier) => ({
//   metrics: { auc: 0.620 * healthMultiplier, gini: 0.390 * healthMultiplier },
//   confusion_matrix: { 
//     tn: Math.round(29120 * healthMultiplier), 
//     fp: Math.round(677 / healthMultiplier), 
//     fn: Math.round(3346 / healthMultiplier), 
//     tp: Math.round(3068 * healthMultiplier) 
//   },
//   roc_data: [
//     { fpr: 0, tpr: 0, baseline: 0 },
//     { fpr: 10, tpr: Math.min(100, 35 * healthMultiplier), baseline: 10 },
//     { fpr: 25, tpr: Math.min(100, 65 * healthMultiplier), baseline: 25 },
//     { fpr: 50, tpr: Math.min(100, 85 * healthMultiplier), baseline: 50 },
//     { fpr: 75, tpr: Math.min(100, 95 * healthMultiplier), baseline: 75 },
//     { fpr: 100, tpr: 100, baseline: 100 }
//   ],
//   pd_decile_analysis: [
//     { decile: 1, customer_count: 3000, average_pd: 0.064, actual_bad_rate: 0.07 * (2 - healthMultiplier) },
//     { decile: 2, customer_count: 3000, average_pd: 0.094, actual_bad_rate: 0.076 * (2 - healthMultiplier) },
//     { decile: 3, customer_count: 3000, average_pd: 0.112, actual_bad_rate: 0.092 * (2 - healthMultiplier) },
//     { decile: 4, customer_count: 3000, average_pd: 0.129, actual_bad_rate: 0.117 * (2 - healthMultiplier) },
//     { decile: 5, customer_count: 3000, average_pd: 0.148, actual_bad_rate: 0.135 * (2 - healthMultiplier) },
//     { decile: 6, customer_count: 3000, average_pd: 0.170, actual_bad_rate: 0.134 * (2 - healthMultiplier) },
//     { decile: 7, customer_count: 3000, average_pd: 0.199, actual_bad_rate: 0.177 * (2 - healthMultiplier) },
//     { decile: 8, customer_count: 3000, average_pd: 0.254, actual_bad_rate: 0.261 * (2 - healthMultiplier) },
//     { decile: 9, customer_count: 3000, average_pd: 0.396, actual_bad_rate: 0.434 * (2 - healthMultiplier) },
//     { decile: 10, customer_count: 3000, average_pd: 0.645, actual_bad_rate: 0.738 * (2 - healthMultiplier) }
//   ],
//   score_band_analysis: [
//     { score_band: '550-599', customer_count: Math.round(3100 * (2 - healthMultiplier)), actual_bad_rate: 65.2 },
//     { score_band: '600-649', customer_count: Math.round(8200 * (2 - healthMultiplier)), actual_bad_rate: 35.1 },
//     { score_band: '650-699', customer_count: Math.round(11000 * healthMultiplier), actual_bad_rate: 15.4 },
//     { score_band: '700-749', customer_count: Math.round(5100 * healthMultiplier), actual_bad_rate: 5.2 },
//     { score_band: '750+', customer_count: Math.round(1200 * healthMultiplier), actual_bad_rate: 1.8 }
//   ]
// });

// const mockAnalysisStore = {
//   "2023 Q3": generateMockDataForQuarter(1.4),
//   "2023 Q4": generateMockDataForQuarter(1.3),
//   "2024 Q1": generateMockDataForQuarter(1.2),
//   "2024 Q2": generateMockDataForQuarter(1.1),
//   "2024 Q3": generateMockDataForQuarter(0.9),
//   "2024 Q4": generateMockDataForQuarter(0.8),
//   "2025 Q1": generateMockDataForQuarter(0.7)
// };

// // --- CUSTOM KPI CARD COMPONENT ---
// function MetricCard({ title, value, prevValue, targetLine, history, dataKey, format = 'number', higherIsBetter = true }) {
//   let displayValue = value;
//   if (format === 'percent') displayValue = value?.toFixed(1) + '%';
//   else if (format === 'decimal') displayValue = value?.toFixed(3);

//   const delta = value - prevValue;
//   const isPositiveDelta = delta > 0;
  
//   let color = '#475569';
//   let arrow = '';
//   if (delta !== 0) {
//     const isGood = higherIsBetter ? isPositiveDelta : !isPositiveDelta;
//     color = isGood ? '#16a34a' : '#dc2626';
//     arrow = isPositiveDelta ? '▲' : '▼';
//   }

//   return (
//     <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
//       <div>
//         <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h4>
//         <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{displayValue}</div>
//         <div style={{ fontSize: '12px', fontWeight: 600, color: color, display: 'flex', alignItems: 'center', gap: '4px' }}>
//           <span>{arrow} {Math.abs(delta).toFixed(format === 'percent' ? 1 : 3)} vs prev</span>
//         </div>
//       </div>
//       <div style={{ height: '40px', marginTop: '16px' }}>
//         <ResponsiveContainer width="100%" height="100%">
//           <LineChart data={history}>
//             <Line type="monotone" dataKey={dataKey} stroke={color !== '#475569' ? color : '#2563eb'} strokeWidth={2} dot={false} />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//       <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
//         {targetLine}
//       </div>
//     </div>
//   )
// }

// export default function ModelMonitoring({ analysisResult }) {
//   const [history, setHistory] = useState(mockHistoricalData)
//   const [selectedQuarter, setSelectedQuarter] = useState(mockHistoricalData[mockHistoricalData.length - 1].quarter)

//   const latestQ = history.find(h => h.quarter === selectedQuarter) || history[history.length - 1];
//   const prevQIndex = history.findIndex(h => h.quarter === selectedQuarter) - 1;
//   const prevQ = prevQIndex >= 0 ? history[prevQIndex] : latestQ;

//   const activeAnalysis = analysisResult || mockAnalysisStore[selectedQuarter] || mockAnalysisStore["2025 Q1"];
//   const cm = activeAnalysis.confusion_matrix || { tn: 0, fp: 0, fn: 0, tp: 0 }
//   const scoreBandData = activeAnalysis.score_band_analysis || []
//   const pdDecileData = activeAnalysis.pd_decile_analysis || []
//   const rocData = activeAnalysis.roc_data || []

//   const calibrationData = pdDecileData.map((d) => ({
//     decile: d.decile,
//     predicted_pd: d.average_pd * 100,
//     actual_pd: d.actual_bad_rate * 100, 
//     perfect_calibration: d.average_pd * 100
//   }))

//   const riskiestFirstData = [...pdDecileData].reverse();
//   let cumDefaults = 0;
//   const totalDefaults = riskiestFirstData.reduce((sum, d) => sum + (d.actual_bad_rate * d.customer_count), 0);
  
//   const gainsData = riskiestFirstData.map((d, index) => {
//     const decileDefaults = d.actual_bad_rate * d.customer_count;
//     cumDefaults += decileDefaults;
//     return {
//       decile: d.decile,
//       pct_portfolio: (index + 1) * 10,
//       model_capture: totalDefaults ? (cumDefaults / totalDefaults) * 100 : 0,
//       random_capture: (index + 1) * 10
//     }
//   })

//   const cmTotal = cm.tn + cm.fp + cm.fn + cm.tp || 1;
//   const fpRate = cm.fp / Math.max(cm.tn + cm.fp, 1)
//   const fnRate = cm.fn / Math.max(cm.fn + cm.tp, 1)
//   const tnRate = cm.tn / Math.max(cm.tn + cm.fp, 1)
//   const tpRate = cm.tp / Math.max(cm.fn + cm.tp, 1)

//   const cardStyle = {
//     background: '#fff',
//     borderRadius: '12px',
//     padding: '24px',
//     boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
//     border: '1px solid #e2e8f0',
//     marginBottom: '24px'
//   }

//   return (
//     <main style={{ background: '#f4f7f9', minHeight: '100vh', padding: '24px', paddingBottom: '100px' }}>
      
//       {/* ── TOP NAV BAR ── */}
//       <section style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '16px', zIndex: 100 }}>
//         <div>
//           <h2 style={{ fontSize: '24px', color: '#0f172a', margin: '0 0 8px 0', fontWeight: 800 }}>Model Performance Diagnostics</h2>
//           <p style={{ color: '#64748b', margin: 0, fontWeight: 500 }}>SR 11-7 Continuous Monitoring & Validation Framework</p>
//         </div>
//         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//           <label style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Snapshot:</label>
//           <select 
//             value={selectedQuarter} 
//             onChange={(e) => setSelectedQuarter(e.target.value)}
//             style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
//           >
//             {history.map(h => <option key={h.quarter} value={h.quarter}>{h.quarter}</option>)}
//           </select>
//         </div>
//       </section>

//       {/* ── SCREENSHOT 1: THE KPI RIBBON ── */}
//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '16px', marginBottom: '32px' }}>
//         <MetricCard title="Gini Coefficient" value={latestQ.gini} prevValue={prevQ.gini} format="decimal" dataKey="gini" history={history} higherIsBetter={true} targetLine="≥ 0.55 (Green)" />
//         <MetricCard title="AUC" value={latestQ.auc} prevValue={prevQ.auc} format="decimal" dataKey="auc" history={history} higherIsBetter={true} targetLine="≥ 0.75 (Green)" />
//         <MetricCard title="KS Statistic" value={latestQ.ks} prevValue={prevQ.ks} format="percent" dataKey="ks" history={history} higherIsBetter={true} targetLine="≥ 30% (Green)" />
//         <MetricCard title="PSI" value={latestQ.psi} prevValue={prevQ.psi} format="decimal" dataKey="psi" history={history} higherIsBetter={false} targetLine="< 0.10 (Green)" />
//         <MetricCard title="Calibration Gap" value={latestQ.cal_gap} prevValue={prevQ.cal_gap} format="decimal" dataKey="cal_gap" history={history} higherIsBetter={false} targetLine="< 0.03 (Green)" />
//         <MetricCard title="Avg Predicted PD" value={latestQ.avg_pred_pd * 100} prevValue={prevQ.avg_pred_pd * 100} format="percent" dataKey="avg_pred_pd" history={history} higherIsBetter={false} targetLine="Monitoring only" />
//         <MetricCard title="Actual Default Rate" value={latestQ.actual_default_rate * 100} prevValue={prevQ.actual_default_rate * 100} format="percent" dataKey="actual_default_rate" history={history} higherIsBetter={false} targetLine="Monitoring only" />
//       </div>

//       {/* ── SCREENSHOT 2 & 3: THE 3x2 TREND GRID ── */}
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '48px' }}>
        
//         {/* ROW 1 */}
//         <div style={cardStyle}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Gini Coefficient — Trend</h3>
//           <div style={{ height: '250px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
//                 <YAxis domain={[0.3, 0.7]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => t.toFixed(2)} />
//                 <Tooltip />
//                 <ReferenceLine y={0.55} stroke="#16a34a" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Green ≥ 0.55', fill: '#16a34a', fontSize: 11, fontWeight: 600 }} />
//                 <ReferenceLine y={0.50} stroke="#dc2626" strokeDasharray="4 4" label={{ position: 'insideBottomRight', value: 'Red < 0.50', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
//                 <Line type="monotone" dataKey="gini" stroke="#0f172a" strokeWidth={3} dot={{ r: 5, fill: '#0f172a' }} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div style={cardStyle}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>AUC — Trend</h3>
//           <div style={{ height: '250px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
//                 <YAxis domain={[0.55, 0.85]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => t.toFixed(2)} />
//                 <Tooltip />
//                 <ReferenceLine y={0.75} stroke="#16a34a" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Green ≥ 0.75', fill: '#16a34a', fontSize: 11, fontWeight: 600 }} />
//                 <ReferenceLine y={0.70} stroke="#dc2626" strokeDasharray="4 4" label={{ position: 'insideBottomRight', value: 'Red < 0.70', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
//                 <Line type="monotone" dataKey="auc" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, fill: '#8b5cf6' }} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* ROW 2 */}
//         <div style={cardStyle}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>KS Statistic — Trend</h3>
//           <div style={{ height: '250px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
//                 <YAxis domain={[10, 45]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => t+'%'} />
//                 <Tooltip formatter={v => v+'%'} />
//                 <ReferenceLine y={30} stroke="#16a34a" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Green ≥ 30%', fill: '#16a34a', fontSize: 11, fontWeight: 600 }} />
//                 <ReferenceLine y={25} stroke="#dc2626" strokeDasharray="4 4" label={{ position: 'insideBottomRight', value: 'Red < 25%', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
//                 <Line type="monotone" dataKey="ks" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 5, fill: '#0ea5e9' }} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div style={cardStyle}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Population Stability Index — Trend</h3>
//           <div style={{ height: '250px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
//                 <YAxis domain={[0.0, 0.4]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => t.toFixed(2)} />
//                 <Tooltip />
//                 <ReferenceLine y={0.10} stroke="#16a34a" strokeDasharray="4 4" label={{ position: 'insideBottomRight', value: 'Green < 0.10', fill: '#16a34a', fontSize: 11, fontWeight: 600 }} />
//                 <ReferenceLine y={0.25} stroke="#dc2626" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Red > 0.25', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
//                 <Line type="monotone" dataKey="psi" stroke="#b45309" strokeWidth={3} dot={{ r: 5, fill: '#b45309' }} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>
//         {/* ROW 3 (NEW FROM SCREENSHOT 3) */}
//         {/* ── ROW 3: PD vs Default Rate & Calibration Gap ── */}
//       <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px', marginBottom: '48px' }}>
        
//         {/* Chart 1: Predicted PD vs Actual Default Rate */}
//         <div style={cardStyle}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Predicted PD vs Actual Default Rate</h3>
//           <div style={{ height: '250px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <ComposedChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
//                 <YAxis domain={[0, 0.3]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => (t*100).toFixed(1)+'%'} />
//                 <Tooltip formatter={v => (v*100).toFixed(1)+'%'} />
//                 <Legend verticalAlign="bottom" />
//                 <Line type="monotone" dataKey="avg_pred_pd" name="Avg Predicted PD" stroke="#475569" strokeDasharray="5 5" strokeWidth={2} dot={false} />
//                 <Line type="monotone" dataKey="actual_default_rate" name="Actual Default Rate" stroke="#991b1b" strokeWidth={3} dot={{ r: 5, fill: '#fff', stroke: '#991b1b', strokeWidth: 2 }} />
//               </ComposedChart>
//             </ResponsiveContainer>
//           </div>
//         </div> {/* <-- I added the missing closing div here! */}

//         {/* Chart 2: Calibration Gap */}
//         <div style={cardStyle}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Calibration Gap — Trend</h3>
//           <div style={{ height: '250px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={history} margin={{ top: 10, right: 40, bottom: 10, left: 10 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
//                 <YAxis domain={[0.0, 0.15]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={t => t.toFixed(2)} />
//                 <Tooltip />
//                 <ReferenceLine y={0.03} stroke="#16a34a" strokeDasharray="4 4" label={{ position: 'insideBottomRight', value: 'Green < 0.03', fill: '#16a34a', fontSize: 11, fontWeight: 600 }} />
//                 <ReferenceLine y={0.07} stroke="#dc2626" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Red > 0.07', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
//                 <Line type="monotone" dataKey="cal_gap" stroke="#991b1b" strokeWidth={3} dot={{ r: 5, fill: '#991b1b' }} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>
//       {/* ── SCREENSHOT 4 & 5: SECTION 6 PERFORMANCE DIAGNOSTICS ── */}
//       <h3 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderLeft: '3px solid #0f172a', paddingLeft: '8px' }}>
//         Section 6 — Performance Diagnostics — {selectedQuarter}
//       </h3>
      
//       {/* Row 1: Confusion Matrix & ROC Curve */}
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
//         {/* Confusion Matrix */}
//         <div style={{...cardStyle, marginBottom: 0}}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700 }}>Confusion Matrix</h3>
          
//           <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '12px' }}>
//             <div />
//             <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Predicted: Good</div>
//             <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Predicted: Bad</div>

//             <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Actual:<br/>Good</div>
            
//             <div style={{ border: '1px solid #86efac', background: '#f0fdf4', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
//               <div style={{ fontSize: '13px', fontWeight: 600, color: '#064e3b', marginBottom: '8px' }}>True Negatives</div>
//               <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{formatCount(cm.tn)}</div>
//               <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600, marginTop: '4px' }}>{(tnRate * 100).toFixed(1)}%</div>
//             </div>

//             <div style={{ border: '1px solid #fca5a5', background: '#fef2f2', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
//               <div style={{ fontSize: '13px', fontWeight: 600, color: '#7f1d1d', marginBottom: '8px' }}>False Positives</div>
//               <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{formatCount(cm.fp)}</div>
//               <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600, marginTop: '4px' }}>{(fpRate * 100).toFixed(1)}%</div>
//             </div>

//             <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Actual:<br/>Bad</div>
            
//             <div style={{ border: '1px solid #fca5a5', background: '#fef2f2', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
//               <div style={{ fontSize: '13px', fontWeight: 600, color: '#7f1d1d', marginBottom: '8px' }}>False Negatives</div>
//               <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{formatCount(cm.fn)}</div>
//               <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600, marginTop: '4px' }}>{(fnRate * 100).toFixed(1)}%</div>
//             </div>

//             <div style={{ border: '1px solid #86efac', background: '#f0fdf4', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
//               <div style={{ fontSize: '13px', fontWeight: 600, color: '#064e3b', marginBottom: '8px' }}>True Positives</div>
//               <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{formatCount(cm.tp)}</div>
//               <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600, marginTop: '4px' }}>{(tpRate * 100).toFixed(1)}%</div>
//             </div>
//           </div>

//           <div style={{ display: 'flex', gap: '16px', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
//             <span>Total scored: <strong>{formatCount(cmTotal)}</strong></span>
//             <span>FP Rate: <strong style={{ color: '#dc2626' }}>{(fpRate * 100).toFixed(1)}%</strong></span>
//             <span>FN Rate: <strong style={{ color: '#dc2626' }}>{(fnRate * 100).toFixed(1)}%</strong></span>
//           </div>
//         </div>

//         {/* ROC Curve */}
//         <div style={{...cardStyle, marginBottom: 0}}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700 }}>ROC Curve — AUC {latestQ.auc.toFixed(3)}</h3>
//           <div style={{ height: '300px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={rocData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#e2e8f0" />
//                 <XAxis dataKey="fpr" type="number" domain={[0, 100]} tickFormatter={t => t+'%'} tick={{ fill: '#64748b', fontSize: 12 }} label={{ value: 'False Positive Rate', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 12 }} />
//                 <YAxis dataKey="tpr" type="number" domain={[0, 100]} tickFormatter={t => t+'%'} tick={{ fill: '#64748b', fontSize: 12 }} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', offset: -5, fill: '#64748b', fontSize: 12 }} />
//                 <Tooltip formatter={(val) => `${val.toFixed(1)}%`} />
//                 <Legend verticalAlign="bottom" height={20} wrapperStyle={{ paddingTop: '20px' }} />
//                 <Line type="monotone" dataKey="tpr" name="Model ROC" stroke="#0f172a" strokeWidth={3} dot={false} />
//                 <Line type="linear" dataKey="baseline" name="Random Guess" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//       </div>

//       {/* Row 2: The 3-Column Display */}
//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
        
//         {/* Calibration Curve */}
//         <div style={{...cardStyle, marginBottom: 0}}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700 }}>Calibration Curve — Decile</h3>
//           <div style={{ height: '250px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={calibrationData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="predicted_pd" type="number" domain={[0, 'dataMax']} tickFormatter={t => t.toFixed(0)+'%'} tick={{ fill: '#64748b', fontSize: 11 }} />
//                 <YAxis tickFormatter={t => t.toFixed(0)+'%'} tick={{ fill: '#64748b', fontSize: 11 }} />
//                 <Tooltip formatter={v => v.toFixed(2)+'%'} />
//                 <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px' }} />
//                 <Line type="monotone" dataKey="actual_pd" name="Actual Default Rate" stroke="#0f172a" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} />
//                 <Line type="linear" dataKey="perfect_calibration" name="Predicted PD" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Cumulative Gains */}
//         {/* <div style={{...cardStyle, marginBottom: 0}}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700 }}>Cumulative Gains Curve</h3>
//           <div style={{ height: '250px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={gainsData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="pct_portfolio" tickFormatter={t => t+'%'} tick={{ fill: '#64748b', fontSize: 11 }} />
//                 <YAxis domain={[0, 100]} tickFormatter={t => t+'%'} tick={{ fill: '#64748b', fontSize: 11 }} />
//                 <Tooltip formatter={v => v.toFixed(1)+'%'} />
//                 <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px' }} />
//                 <Line type="monotone" dataKey="model_capture" name="Model Gains" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} />
//                 <Line type="linear" dataKey="random_capture" name="Random Baseline" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div> */}

//         {/* Score Band Distribution */}
//         <div style={{...cardStyle, marginBottom: 0}}>
//           <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700 }}>Score Band Distribution</h3>
//           <div style={{ height: '250px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <ComposedChart data={scoreBandData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//                 <XAxis dataKey="score_band" tick={{ fill: '#64748b', fontSize: 11 }} />
//                 <YAxis yAxisId="left" tickFormatter={t => t.toLocaleString()} tick={{ fill: '#64748b', fontSize: 11 }} />
//                 <YAxis yAxisId="right" orientation="right" tickFormatter={t => t+'%'} tick={{ fill: '#64748b', fontSize: 11 }} />
//                 <Tooltip />
//                 <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px' }} />
//                 <Bar yAxisId="left" dataKey="customer_count" name="Customers" fill="#1e3a8a" radius={[2, 2, 0, 0]} />
//                 <Line yAxisId="right" type="monotone" dataKey="actual_bad_rate" name="Bad Rate" stroke="#991b1b" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#991b1b' }} />
//               </ComposedChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>

//       {/* ── SCREENSHOT 6: CHAMPION VS CHALLENGER MATRIX ── */}
//       <div style={cardStyle}>
//         <div style={{ overflowX: 'auto' }}>
//           <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
//             <thead>
//               <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
//                 <th style={{ padding: '16px 12px' }}>Quarter</th>
//                 <th style={{ padding: '16px 12px' }}>Accounts</th>
//                 <th style={{ padding: '16px 12px' }}>Gini</th>
//                 <th style={{ padding: '16px 12px' }}>AUC</th>
//                 <th style={{ padding: '16px 12px' }}>KS</th>
//                 <th style={{ padding: '16px 12px' }}>PSI</th>
//                 <th style={{ padding: '16px 12px' }}>Cal. Gap</th>
//                 <th style={{ padding: '16px 12px' }}>Actual DR</th>
//                 <th style={{ padding: '16px 12px' }}>Pred PD</th>
//                 <th style={{ padding: '16px 12px' }}>Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {history.map(h => {
//                 const isSelected = h.quarter === selectedQuarter;
//                 const statusBadge = h.alert_status === 'Green' ? { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' } :
//                                     h.alert_status === 'Amber' ? { bg: '#fef3c7', text: '#92400e', border: '#fde68a' } :
//                                     { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };

//                 return (
//                   <tr key={h.quarter} style={{ borderBottom: '1px solid #f1f5f9', background: isSelected ? '#f8fafc' : '#fff' }}>
//                     <td style={{ padding: '16px 12px', fontWeight: 700, color: isSelected ? '#2563eb' : '#0f172a' }}>
//                       {h.quarter} {isSelected && <span style={{fontSize:'11px', color:'#2563eb'}}>● selected</span>}
//                     </td>
//                     <td style={{ padding: '16px 12px' }}>{formatCount(h.total_accounts)}</td>
//                     <td style={{ padding: '16px 12px', fontWeight: 600, color: h.gini >= 0.55 ? '#16a34a' : '#dc2626' }}>{h.gini.toFixed(3)}</td>
//                     <td style={{ padding: '16px 12px', fontWeight: 600, color: h.auc >= 0.75 ? '#16a34a' : '#dc2626' }}>{h.auc.toFixed(3)}</td>
//                     <td style={{ padding: '16px 12px', fontWeight: 600, color: h.ks >= 30 ? '#16a34a' : '#dc2626' }}>{h.ks.toFixed(1)}%</td>
//                     <td style={{ padding: '16px 12px', fontWeight: 600, color: h.psi < 0.10 ? '#16a34a' : '#dc2626' }}>{h.psi.toFixed(2)}</td>
//                     <td style={{ padding: '16px 12px', fontWeight: 600, color: h.cal_gap < 0.03 ? '#16a34a' : '#dc2626' }}>{h.cal_gap.toFixed(3)}</td>
//                     <td style={{ padding: '16px 12px' }}>{(h.actual_default_rate * 100).toFixed(1)}%</td>
//                     <td style={{ padding: '16px 12px' }}>{(h.avg_pred_pd * 100).toFixed(1)}%</td>
//                     <td style={{ padding: '16px 12px' }}>
//                       <span style={{ background: statusBadge.bg, color: statusBadge.text, border: `1px solid ${statusBadge.border}`, padding: '4px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
//                         {h.alert_status}
//                       </span>
//                     </td>
//                   </tr>
//                 )
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>

//     </main>
//   )
// }


































// /* ============================================================================
//    SPEC-ALIGNED MOCK DATA LAYER
//    Mirrors the 5 logical datasets described in the Sample Data Specification
//    for Agentic AI-Enabled Model Monitoring:
//      1. dashboard_kpi          -> mockHistoricalData (extended)
//      2. segment_monitoring     -> mockSegmentMonitoring   [NEW]
//      3. variable_monitoring    -> mockVariableMonitoring  [NEW]
//      4. calibration_decile     -> mockAnalysisStore[].pd_decile_analysis (extended)
//      5. threshold_rules        -> THRESHOLD_RULES         [NEW]
//    All data here is synthetic and generated client-side to demonstrate the
//    agentic monitoring UX without requiring backend changes.
//    ============================================================================ */

// import { useState, useMemo, useRef, useEffect } from "react";
// import {
//   LineChart, Line, AreaChart, Area, BarChart, Bar,
//   ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
//   ResponsiveContainer, ReferenceLine, ReferenceArea, ScatterChart, Scatter
// } from "recharts";
// import ReactMarkdown from "react-markdown";

// // ─────────────────────────────────────────────────────────────────────────────
// // DESIGN TOKENS  — institutional palette, no gradients, no consumer chrome
// // ─────────────────────────────────────────────────────────────────────────────
// const C = {
//   navy:     "#0B1F3A",
//   navyMid:  "#1A3459",
//   navyLight:"#274670",
//   slate:    "#475569",
//   slateLight:"#94A3B8",
//   border:   "#CBD5E1",
//   borderLight:"#E2E8F0",
//   bg:       "#F4F6F9",
//   surface:  "#FFFFFF",
//   text:     "#0F172A",
//   textMid:  "#334155",
//   textSoft: "#64748B",
//   green:    "#166534",
//   greenBg:  "#DCFCE7",
//   greenBorder:"#BBF7D0",
//   amber:    "#92400E",
//   amberBg:  "#FEF3C7",
//   amberBorder:"#FDE68A",
//   red:      "#991B1B",
//   redBg:    "#FEE2E2",
//   redBorder:"#FECACA",
//   blue:     "#1D4ED8",
//   blueBg:   "#EFF6FF",
//   blueBorder:"#BFDBFE",
// };

// const STATUS_COLOR = { Green: C.green, Amber: C.amber, Red: C.red };
// const STATUS_BG    = { Green: C.greenBg, Amber: C.amberBg, Red: C.redBg };
// const STATUS_BORDER= { Green: C.greenBorder, Amber: C.amberBorder, Red: C.redBorder };

// import { API_BASE_URL } from '../config';

// // ─────────────────────────────────────────────────────────────────────────────
// // SHARED UI ATOMS
// // ─────────────────────────────────────────────────────────────────────────────
// const Badge = ({ status, children, small }) => (
//   <span style={{
//     display: "inline-flex", alignItems: "center", gap: 4,
//     fontSize: small ? 11 : 12, fontWeight: 700, letterSpacing: "0.04em",
//     padding: small ? "2px 8px" : "3px 10px", borderRadius: 4,
//     textTransform: "uppercase", fontFamily: "monospace",
//     background: STATUS_BG[status] || "#F1F5F9",
//     color: STATUS_COLOR[status] || C.slate,
//     border: `1px solid ${STATUS_BORDER[status] || C.border}`,
//   }}>
//     {children || status}
//   </span>
// );

// const SectionLabel = ({ children }) => (
//   <div style={{
//     fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
//     color: C.slateLight, textTransform: "uppercase", marginBottom: 12,
//     borderLeft: `3px solid ${C.navy}`, paddingLeft: 8,
//   }}>{children}</div>
// );

// const Card = ({ children, style = {}, noPad }) => (
//   <div style={{
//     background: C.surface, border: `1px solid ${C.borderLight}`,
//     borderRadius: 6, padding: noPad ? 0 : 20,
//     ...style
//   }}>{children}</div>
// );

// const Divider = ({ style = {} }) => (
//   <div style={{ borderTop: `1px solid ${C.borderLight}`, ...style }} />
// );

// const MetricLabel = ({ children }) => (
//   <div style={{ fontSize: 11, fontWeight: 600, color: C.textSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{children}</div>
// );

// const MetricValue = ({ children, color }) => (
//   <div style={{ fontSize: 26, fontWeight: 700, color: color || C.text, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{children}</div>
// );

// const Pill = ({ children, color = C.slate, bg = "#F1F5F9" }) => (
//   <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: bg, color, letterSpacing: "0.05em", textTransform: "uppercase" }}>{children}</span>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // DATASET — SHEET 1: dashboard_kpi
// // ─────────────────────────────────────────────────────────────────────────────
// const mockHistoricalData = [
//   { quarter:"2023 Q3", total_accounts:28500, avg_pred_pd:0.205, actual_default_rate:0.201, gini:0.620, auc:0.810, ks:38.0, precision:0.66, recall:0.55, accuracy:0.78, brier_score:0.145, psi_population:0.04, calibration_gap:0.004, alert_status:"Green" },
//   { quarter:"2023 Q4", total_accounts:29000, avg_pred_pd:0.210, actual_default_rate:0.208, gini:0.605, auc:0.800, ks:36.5, precision:0.64, recall:0.53, accuracy:0.76, brier_score:0.153, psi_population:0.06, calibration_gap:0.006, alert_status:"Green" },
//   { quarter:"2024 Q1", total_accounts:30000, avg_pred_pd:0.218, actual_default_rate:0.214, gini:0.580, auc:0.790, ks:34.0, precision:0.61, recall:0.49, accuracy:0.72, brier_score:0.182, psi_population:0.08, calibration_gap:0.012, alert_status:"Green" },
//   { quarter:"2024 Q2", total_accounts:30250, avg_pred_pd:0.224, actual_default_rate:0.221, gini:0.530, auc:0.760, ks:31.0, precision:0.58, recall:0.47, accuracy:0.70, brier_score:0.191, psi_population:0.14, calibration_gap:0.031, alert_status:"Amber" },
//   { quarter:"2024 Q3", total_accounts:30000, avg_pred_pd:0.228, actual_default_rate:0.226, gini:0.475, auc:0.720, ks:27.0, precision:0.54, recall:0.43, accuracy:0.67, brier_score:0.207, psi_population:0.23, calibration_gap:0.058, alert_status:"Red"   },
//   { quarter:"2024 Q4", total_accounts:31000, avg_pred_pd:0.231, actual_default_rate:0.245, gini:0.440, auc:0.680, ks:24.0, precision:0.50, recall:0.40, accuracy:0.64, brier_score:0.221, psi_population:0.27, calibration_gap:0.082, alert_status:"Red"   },
//   { quarter:"2025 Q1", total_accounts:31500, avg_pred_pd:0.235, actual_default_rate:0.270, gini:0.390, auc:0.620, ks:19.0, precision:0.45, recall:0.35, accuracy:0.58, brier_score:0.248, psi_population:0.31, calibration_gap:0.114, alert_status:"Red"   },
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// // THRESHOLD RULES — Sheet 5
// // ─────────────────────────────────────────────────────────────────────────────
// const THRESHOLD_RULES = [
//   { metric_name:"gini",           label:"Gini Coefficient",       scope:"overall",    green_rule:">= 0.55",  amber_rule:"0.50 – 0.55", red_rule:"< 0.50",  green_min:0.55, amber_min:0.50, action_guidance:"Review segment drivers and deterioration trend" },
//   { metric_name:"ks",             label:"KS Statistic",           scope:"overall",    green_rule:">= 30.0%", amber_rule:"25.0 – 30.0%",red_rule:"< 25.0%", green_min:30.0, amber_min:25.0, action_guidance:"Assess rank-ordering power; consider score recalibration" },
//   { metric_name:"psi_population", label:"Population Stability",   scope:"population", green_rule:"< 0.10",   amber_rule:"0.10 – 0.25", red_rule:"> 0.25",  green_max:0.10, amber_max:0.25, action_guidance:"Investigate drift in population composition / key variables" },
//   { metric_name:"psi_variable",   label:"PSI (variable-level)",   scope:"variable",   green_rule:"< 0.10",   amber_rule:"0.10 – 0.25", red_rule:"> 0.25",  green_max:0.10, amber_max:0.25, action_guidance:"Investigate drift in key variables" },
//   { metric_name:"calibration_gap",label:"Calibration Gap",        scope:"decile",     green_rule:"< 0.03",   amber_rule:"0.03 – 0.07", red_rule:"> 0.07",  green_max:0.03, amber_max:0.07, action_guidance:"Review decile calibration; consider recalibration" },
//   { metric_name:"missing_rate",   label:"Missing Rate",           scope:"variable",   green_rule:"< 0.05",   amber_rule:"0.05 – 0.10", red_rule:"> 0.10",  green_max:0.05, amber_max:0.10, action_guidance:"Escalate to data quality review if on important features" },
// ];

// function rateStatus(rule, value) {
//   if (value == null || Number.isNaN(value)) return "Unknown";
//   if (rule.green_min != null) {
//     if (value >= rule.green_min) return "Green";
//     if (value >= rule.amber_min) return "Amber";
//     return "Red";
//   }
//   if (rule.green_max != null) {
//     if (value <= rule.green_max) return "Green";
//     if (value <= rule.amber_max) return "Amber";
//     return "Red";
//   }
//   return "Unknown";
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // DATASET — SHEET 2: segment_monitoring
// // ─────────────────────────────────────────────────────────────────────────────
// const SEGMENT_DEFS = [
//   { segment_type:"product",   segment_value:"Personal Loan",  shareOfBook:0.42, resilience:1.15 },
//   { segment_type:"product",   segment_value:"SME Loan",       shareOfBook:0.58, resilience:0.72 },
//   { segment_type:"geography", segment_value:"Metro",          shareOfBook:0.55, resilience:1.05 },
//   { segment_type:"geography", segment_value:"Non-Metro",      shareOfBook:0.45, resilience:0.85 },
//   { segment_type:"vintage",   segment_value:"0–12m on book",  shareOfBook:0.30, resilience:0.80 },
//   { segment_type:"vintage",   segment_value:"12m+ on book",   shareOfBook:0.70, resilience:1.05 },
//   { segment_type:"risk_band", segment_value:"Low Risk",       shareOfBook:0.35, resilience:1.20 },
//   { segment_type:"risk_band", segment_value:"Medium Risk",    shareOfBook:0.40, resilience:0.95 },
//   { segment_type:"risk_band", segment_value:"High Risk",      shareOfBook:0.25, resilience:0.65 },
// ];

// function generateSegmentMonitoring() {
//   const rows = [];
//   mockHistoricalData.forEach((kpiRow, qIdx) => {
//     const hm = 1.4 - qIdx * 0.12;
//     SEGMENT_DEFS.forEach(seg => {
//       const stress = (2 - hm) / seg.resilience;
//       rows.push({
//         quarter:       kpiRow.quarter,
//         segment_type:  seg.segment_type,
//         segment_value: seg.segment_value,
//         accounts:      Math.round(kpiRow.total_accounts * seg.shareOfBook),
//         bad_rate:      Math.min(0.55, kpiRow.actual_default_rate * stress * 0.88),
//         avg_pred_pd:   kpiRow.avg_pred_pd * (seg.resilience < 1 ? 0.9 : 1.0),
//         gini:          Math.max(0.15, kpiRow.gini * seg.resilience * 0.97),
//         auc:           Math.max(0.50, kpiRow.auc * Math.min(1, seg.resilience)),
//         ks:            Math.max(8,    kpiRow.ks   * Math.min(1, seg.resilience)),
//         psi_segment:   Math.max(0.01, kpiRow.psi_population * stress),
//         missing_rate:  Math.min(0.20, 0.02 * stress),
//         approval_rate: Math.max(0.45, 0.72 - 0.10 * stress),
//         is_hotspot:    seg.resilience < 0.85 && qIdx >= 4,
//       });
//     });
//   });
//   return rows;
// }
// const mockSegmentMonitoring = generateSegmentMonitoring();

// // ─────────────────────────────────────────────────────────────────────────────
// // DATASET — SHEET 3: variable_monitoring
// // ─────────────────────────────────────────────────────────────────────────────
// const VARIABLE_DEFS = [
//   { variable_name:"utilization_ratio",    variable_group:"Bureau",      importance_rank:2, baseline_mean:0.41, driftRate:0.045, missingBase:0.01 },
//   { variable_name:"delinquency_12m",      variable_group:"Bureau",      importance_rank:1, baseline_mean:1.20, driftRate:0.035, missingBase:0.01 },
//   { variable_name:"employer_type",        variable_group:"Application", importance_rank:5, baseline_mean:null, driftRate:0.040, missingBase:0.03, categorical:true },
//   { variable_name:"debt_to_income",       variable_group:"Bureau",      importance_rank:3, baseline_mean:0.33, driftRate:0.020, missingBase:0.02 },
//   { variable_name:"months_on_book",       variable_group:"Internal",    importance_rank:6, baseline_mean:18.0, driftRate:0.010, missingBase:0.00 },
//   { variable_name:"income_verified_flag", variable_group:"Application", importance_rank:4, baseline_mean:null, driftRate:0.015, missingBase:0.04, categorical:true },
// ];

// function generateVariableMonitoring() {
//   const rows = [];
//   mockHistoricalData.forEach((kpiRow, qIdx) => {
//     VARIABLE_DEFS.forEach(v => {
//       const psi = Math.max(0.01, v.driftRate * (qIdx + 1) * 0.95);
//       const missing_rate_current = Math.min(0.30, v.missingBase + (qIdx >= 4 ? (qIdx - 3) * 0.05 : 0) * (v.variable_name === "employer_type" ? 1.6 : 0.4));
//       const prevRow = rows.find(r => r.quarter === (mockHistoricalData[qIdx - 1]?.quarter) && r.variable_name === v.variable_name);
//       const missing_rate_prev = prevRow ? prevRow.missing_rate_current : v.missingBase;
//       rows.push({
//         quarter:              kpiRow.quarter,
//         variable_name:        v.variable_name,
//         variable_group:       v.variable_group,
//         importance_rank:      v.importance_rank,
//         psi,
//         mean_current:         v.baseline_mean != null ? +(v.baseline_mean * (1 + psi)).toFixed(3) : null,
//         mean_dev:             v.baseline_mean,
//         missing_rate_current: +missing_rate_current.toFixed(3),
//         missing_rate_prev:    +missing_rate_prev.toFixed(3),
//         null_spike_flag:      (missing_rate_current - missing_rate_prev) > 0.08,
//         outlier_flag:         psi > 0.25 && !v.categorical,
//         category_shift_flag:  psi > 0.20 && v.categorical,
//         comment:              psi > 0.25 ? "Major drift" : psi > 0.10 ? "Moderate drift" : "",
//       });
//     });
//   });
//   return rows;
// }
// const mockVariableMonitoring = generateVariableMonitoring();

// // ─────────────────────────────────────────────────────────────────────────────
// // DATASET — SHEET 4: calibration_decile + score_band + confusion_matrix
// // ─────────────────────────────────────────────────────────────────────────────
// function generateQuarterData(hm) {
//   const pd_decile_analysis = [
//     { decile:1,  customer_count:3000, average_pd:0.030, actual_bad_rate:0.020*(2-hm) },
//     { decile:2,  customer_count:3000, average_pd:0.050, actual_bad_rate:0.040*(2-hm) },
//     { decile:3,  customer_count:3000, average_pd:0.080, actual_bad_rate:0.068*(2-hm) },
//     { decile:4,  customer_count:3000, average_pd:0.110, actual_bad_rate:0.095*(2-hm) },
//     { decile:5,  customer_count:3000, average_pd:0.148, actual_bad_rate:0.135*(2-hm) },
//     { decile:6,  customer_count:3000, average_pd:0.190, actual_bad_rate:0.174*(2-hm) },
//     { decile:7,  customer_count:3000, average_pd:0.260, actual_bad_rate:0.245*(2-hm) },
//     { decile:8,  customer_count:3000, average_pd:0.320, actual_bad_rate:0.380*(2-hm) },
//     { decile:9,  customer_count:3000, average_pd:0.410, actual_bad_rate:0.500*(2-hm) },
//     { decile:10, customer_count:3000, average_pd:0.550, actual_bad_rate:0.680*(2-hm) },
//   ].map(d => {
//     const gap = d.actual_bad_rate - d.average_pd;
//     return { ...d, calibration_gap:gap, observed_to_expected: d.average_pd > 0 ? d.actual_bad_rate/d.average_pd : null,
//       comment: gap > 0.07 ? "Severe underprediction" : gap > 0.03 ? "Underprediction" : gap < -0.03 ? "Overprediction" : "" };
//   });
//   return {
//     pd_decile_analysis,
//     score_band_analysis:[
//       { score_band:"550-599", customer_count:Math.round(4500*(2-hm)),  actual_bad_rate:0.65 },
//       { score_band:"600-649", customer_count:Math.round(12000*(2-hm)), actual_bad_rate:0.35 },
//       { score_band:"650-699", customer_count:Math.round(8500*hm),      actual_bad_rate:0.15 },
//       { score_band:"700-749", customer_count:Math.round(4000*hm),      actual_bad_rate:0.05 },
//       { score_band:"750+",    customer_count:Math.round(1000*hm),      actual_bad_rate:0.02 },
//     ],
//     confusion_matrix:{
//       tn: Math.round(22400*hm), fp: Math.round(880/hm),
//       fn: Math.round(4350/hm),  tp: Math.round(2360*hm),
//     },
//   };
// }

// const mockAnalysisStore = {
//   "2023 Q3": generateQuarterData(1.40),
//   "2023 Q4": generateQuarterData(1.30),
//   "2024 Q1": generateQuarterData(1.20),
//   "2024 Q2": generateQuarterData(1.10),
//   "2024 Q3": generateQuarterData(0.90),
//   "2024 Q4": generateQuarterData(0.80),
//   "2025 Q1": generateQuarterData(0.70),
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // AGENT ENGINE
// // ─────────────────────────────────────────────────────────────────────────────
// const pctStr = (v, d=1) => v == null ? "—" : `${(v*100).toFixed(d)}%`;
// const numStr  = (v, d=3) => v == null ? "—" : Number(v).toFixed(d);

// function getPriorQuarter(quarter) {
//   const idx = mockHistoricalData.findIndex(h => h.quarter === quarter);
//   return idx > 0 ? mockHistoricalData[idx-1] : null;
// }
// function getSegmentHotspots(quarter) {
//   return mockSegmentMonitoring.filter(r => r.quarter===quarter).sort((a,b)=>b.bad_rate-a.bad_rate);
// }
// function getVariableHotspots(quarter) {
//   return mockVariableMonitoring.filter(r => r.quarter===quarter).sort((a,b)=>b.psi-a.psi);
// }

// function runModelEvaluationAgent(quarter) {
//   const row = mockHistoricalData.find(h => h.quarter===quarter); if (!row) return null;
//   const giniRule = THRESHOLD_RULES[0];
//   const giniStatus = rateStatus(giniRule, row.gini);
//   const strengths = [], weaknesses = [];
//   if (row.precision >= 0.55) strengths.push(`Precision ${numStr(row.precision,2)} — flagged high-risk accounts correctly identified at a workable rate.`);
//   else weaknesses.push(`Precision fallen to ${numStr(row.precision,2)} — growing share of accounts flagged high-risk are not defaulting.`);
//   if (row.recall >= 0.50) strengths.push(`Recall ${numStr(row.recall,2)} — model captures the majority of true defaulters.`);
//   else weaknesses.push(`Recall dropped to ${numStr(row.recall,2)} — material share of actual defaulters scored as low-risk.`);
//   if (row.brier_score <= 0.19) strengths.push(`Brier score ${numStr(row.brier_score,3)} — reasonably well-calibrated probability estimates.`);
//   else weaknesses.push(`Brier score ${numStr(row.brier_score,3)} — growing miscalibration between predicted PD and realised outcomes.`);
//   if (giniStatus !== "Green") weaknesses.push(`Gini ${numStr(row.gini,3)} has breached the governance threshold (${giniRule.green_rule}), placing rank-ordering in the ${giniStatus} zone.`);
//   else strengths.push(`Gini ${numStr(row.gini,3)} remains within the Green governance threshold (${giniRule.green_rule}).`);
//   const discrimination = giniStatus === "Green" ? "strong" : giniStatus === "Amber" ? "moderate, weakening" : "materially eroded";
//   return {
//     status: giniStatus,
//     summary: `Discriminatory power is ${discrimination} (Gini ${numStr(row.gini,3)}, AUC ${numStr(row.auc,3)}, KS ${numStr(row.ks,1)}%).`,
//     strengths, weaknesses,
//     interpretation: `Gini ${numStr(row.gini,3)} means the model correctly rank-orders a random bad/good pair ${pctStr((row.gini+1)/2,1)} of the time. KS of ${numStr(row.ks,1)}% ${row.ks < 25 ? "is below the 25% threshold, indicating score separation is failing at cut-off level." : "remains within tolerance."}`,
//   };
// }

// function runMonitoringAgent(quarter) {
//   const row = mockHistoricalData.find(h => h.quarter===quarter); if (!row) return null;
//   const prior = getPriorQuarter(quarter);
//   const deltas = prior ? {
//     gini: row.gini - prior.gini, ks: row.ks - prior.ks,
//     default_rate: row.actual_default_rate - prior.actual_default_rate,
//     psi: row.psi_population - prior.psi_population,
//   } : null;
//   const psiStatus = rateStatus(THRESHOLD_RULES[2], row.psi_population);
//   const varHotspots = getVariableHotspots(quarter).slice(0,3);
//   const segHotspots = getSegmentHotspots(quarter).filter(s=>s.is_hotspot).slice(0,2);
//   const alerts = [];
//   if (rateStatus(THRESHOLD_RULES[0], row.gini) === "Red")  alerts.push({ severity:"Red",   text:`Gini (${numStr(row.gini,3)}) breached Red threshold (${THRESHOLD_RULES[0].red_rule}).` });
//   else if (rateStatus(THRESHOLD_RULES[0], row.gini) === "Amber") alerts.push({ severity:"Amber", text:`Gini (${numStr(row.gini,3)}) in Amber band — monitor closely.` });
//   if (psiStatus === "Red")  alerts.push({ severity:"Red",   text:`PSI (${numStr(row.psi_population,2)}) breached Red — material population drift.` });
//   else if (psiStatus === "Amber") alerts.push({ severity:"Amber", text:`PSI (${numStr(row.psi_population,2)}) in Amber band — early-stage population drift.` });
//   varHotspots.forEach(v => {
//     const st = rateStatus(THRESHOLD_RULES[3], v.psi);
//     if (st === "Red")         alerts.push({ severity:"Red",   text:`Variable "${v.variable_name}" PSI (${numStr(v.psi,2)}) breached Red — ${v.comment || "major drift"}.` });
//     if (v.null_spike_flag)    alerts.push({ severity:"Amber", text:`Missing-value spike on "${v.variable_name}" (${pctStr(v.missing_rate_prev)} → ${pctStr(v.missing_rate_current)}).` });
//   });
//   const qoqNarrative = deltas
//     ? `Quarter-over-quarter, Gini ${deltas.gini>=0?"up":"down"} ${numStr(Math.abs(deltas.gini),3)}, KS ${deltas.ks>=0?"up":"down"} ${numStr(Math.abs(deltas.ks),1)} pts, actual default rate ${deltas.default_rate>=0?"up":"down"} ${pctStr(Math.abs(deltas.default_rate))}. PSI ${deltas.psi>=0?"increased":"decreased"} ${numStr(Math.abs(deltas.psi),2)}${deltas.psi>0.03?", indicating accelerating population drift":""}.`
//     : `${quarter} is the earliest period in the monitoring window — no prior-quarter comparison available.`;
//   const driftNarrative = varHotspots.length
//     ? `Top drifting variables: ${varHotspots.map(v=>`${v.variable_name} (PSI ${numStr(v.psi,2)})`).join(", ")}. ${varHotspots[0].importance_rank<=3?`${varHotspots[0].variable_name} is rank #${varHotspots[0].importance_rank} in feature importance — drift is likely contributing directly to rank-ordering deterioration.`:"These are lower-importance features; drift may not be the primary driver."}`
//     : "No material variable-level drift detected this quarter.";
//   const hotspotNarrative = segHotspots.length
//     ? `${segHotspots.map(s=>s.segment_value).join(" and ")} identified as primary hotspot(s) with bad rates of ${segHotspots.map(s=>pctStr(s.bad_rate)).join(" / ")} vs portfolio average ${pctStr(row.actual_default_rate)}.`
//     : "Deterioration appears broad-based rather than concentrated in a specific segment.";
//   return { status:row.alert_status, qoqNarrative, driftNarrative, hotspotNarrative, alerts };
// }

// function runExecutiveSummaryAgent(quarter) {
//   const row = mockHistoricalData.find(h => h.quarter===quarter); if (!row) return null;
//   const prior = getPriorQuarter(quarter);
//   const segHotspots = getSegmentHotspots(quarter).filter(s=>s.is_hotspot).slice(0,1);
//   const varHotspots = getVariableHotspots(quarter).slice(0,2);
//   const worstDecile = (mockAnalysisStore[quarter]?.pd_decile_analysis||[]).slice().sort((a,b)=>b.calibration_gap-a.calibration_gap)[0];
//   const parts = [];
//   parts.push(`Gini ${prior&&row.gini<prior.gini?"declined":"moved"} to ${numStr(row.gini,3)} in ${quarter}${prior?` from ${numStr(prior.gini,3)} in ${prior.quarter}`:""}.`);
//   if (segHotspots.length) parts.push(`Deterioration is primarily driven by the ${segHotspots[0].segment_value} segment (bad rate ${pctStr(segHotspots[0].bad_rate)} vs portfolio ${pctStr(row.actual_default_rate)}).`);
//   if (varHotspots.length) parts.push(`Variable monitoring shows material drift in ${varHotspots[0].variable_name}${varHotspots[1]?` and a data-quality issue on ${varHotspots[1].variable_name}`:""}.`);
//   if (worstDecile && worstDecile.calibration_gap > 0.03) parts.push(`Model ${worstDecile.calibration_gap>0?"underpredicts":"overpredicts"} defaults in decile ${worstDecile.decile}, indicating calibration weakness in high-risk bands.`);
//   const healthLabel = row.alert_status==="Red"?"deteriorating and outside governance tolerance":row.alert_status==="Amber"?"showing early signs of deterioration":"stable and within governance tolerance";
//   const worstMetric = row.gini<0.50?"Gini":row.ks<25?"KS Statistic":row.psi_population>0.25?"Population Stability Index":"Calibration Gap";
//   return {
//     status: row.alert_status,
//     narrative: parts.join(" "),
//     portfolioHealth: `Portfolio health is ${healthLabel}. ${row.total_accounts.toLocaleString()} accounts, actual default rate ${pctStr(row.actual_default_rate)} vs predicted PD ${pctStr(row.avg_pred_pd)} (gap: ${pctStr(Math.abs(row.actual_default_rate-row.avg_pred_pd))}).`,
//     worstMetric,
//     riskOutlook: row.alert_status==="Red"
//       ? `Absent intervention, continued drift at the current pace will push Gini and KS further from governance thresholds. Recommend escalation to Model Risk Committee.`
//       : row.alert_status==="Amber"
//         ? `Risk outlook is cautious. If the current trend continues one more quarter, the model is likely to breach Red thresholds on Gini and PSI.`
//         : `Risk outlook is benign. No governance action required this quarter beyond routine monitoring.`,
//   };
// }

// function runRecommendationAgent(quarter) {
//   const row = mockHistoricalData.find(h => h.quarter===quarter); if (!row) return null;
//   const varHotspots = getVariableHotspots(quarter).slice(0,3);
//   const segHotspots = getSegmentHotspots(quarter).filter(s=>s.is_hotspot);
//   const worstDeciles = (mockAnalysisStore[quarter]?.pd_decile_analysis||[]).filter(d=>Math.abs(d.calibration_gap)>0.03);
//   const actions = [];
//   THRESHOLD_RULES.forEach(rule => {
//     let value = null;
//     if (rule.metric_name==="gini")           value = row.gini;
//     if (rule.metric_name==="ks")             value = row.ks;
//     if (rule.metric_name==="psi_population") value = row.psi_population;
//     if (rule.metric_name==="calibration_gap") value = row.calibration_gap;
//     if (value==null) return;
//     const status = rateStatus(rule, value);
//     if (status==="Red")   actions.push({ priority:1, status, metric:rule.label, text:rule.action_guidance, detail:`${rule.label} = ${numStr(value, value>5?1:3)} (Red: ${rule.red_rule})` });
//     else if (status==="Amber") actions.push({ priority:2, status, metric:rule.label, text:rule.action_guidance, detail:`${rule.label} = ${numStr(value, value>5?1:3)} (Amber: ${rule.amber_rule})` });
//   });
//   if (segHotspots.length) actions.push({ priority:1, status:"Red", metric:"Segment Concentration", text:`Conduct root-cause review of ${segHotspots.map(s=>s.segment_value).join(", ")}; consider segment-specific cut-off or pricing adjustments.`, detail:`Bad rate ${segHotspots.map(s=>pctStr(s.bad_rate)).join(", ")} vs portfolio ${pctStr(row.actual_default_rate)}` });
//   varHotspots.filter(v=>v.psi>0.10).forEach(v => {
//     actions.push({ priority:v.psi>0.25?1:2, status:v.psi>0.25?"Red":"Amber", metric:`Variable Drift: ${v.variable_name}`,
//       text:v.null_spike_flag?`Escalate "${v.variable_name}" to data engineering — investigate source-system or mapping change.`:`Investigate drift in "${v.variable_name}" (rank #${v.importance_rank}); assess need for re-weighting.`,
//       detail:`PSI ${numStr(v.psi,2)}${v.null_spike_flag?`, missing ${pctStr(v.missing_rate_prev)} → ${pctStr(v.missing_rate_current)}` : ""}` });
//   });
//   if (worstDeciles.length) actions.push({ priority:2, status:"Amber", metric:"Calibration", text:`Review calibration in decile(s) ${worstDeciles.map(d=>d.decile).join(", ")}; consider local recalibration or separate scorecard for high-risk bands.`, detail:`Gap ${worstDeciles.map(d=>(d.calibration_gap>=0?"+":"")+numStr(d.calibration_gap,2)).join(", ")}` });
//   actions.push({ priority:3, status:"Green", metric:"Monitoring Cadence", text:row.alert_status==="Green"?"Maintain standard quarterly monitoring cadence.":"Increase monitoring to monthly until metrics return to Green for two consecutive periods.", detail:`Current status: ${row.alert_status}` });
//   const governance = row.alert_status==="Red"&&(row.gini<0.44||row.ks<22)?"Model Redevelopment Review":row.alert_status==="Red"?"Enhanced Monitoring — Recalibration Assessment":row.alert_status==="Amber"?"Enhanced Monitoring":"Continue Monitoring";
//   return { status:row.alert_status, actions:actions.sort((a,b)=>a.priority-b.priority), governance };
// }

// function runAllAgents(quarter) {
//   return {
//     evaluation:     runModelEvaluationAgent(quarter),
//     monitoring:     runMonitoringAgent(quarter),
//     executive:      runExecutiveSummaryAgent(quarter),
//     recommendation: runRecommendationAgent(quarter),
//   };
// }

// function composeMarkdownReport(agents, quarter) {
//   if (!agents.evaluation) return "";
//   const { evaluation, monitoring, executive, recommendation } = agents;
//   const lines = [];
//   lines.push(`# SR 11-7 Model Monitoring Report — ${quarter}`);
//   lines.push(`**Overall Status:** ${executive.status} | **Governance Action:** ${recommendation.governance}`);
//   lines.push("");
//   lines.push("## 1. Executive Summary");
//   lines.push(executive.narrative);
//   lines.push("");
//   lines.push(executive.portfolioHealth);
//   lines.push("");
//   lines.push(`**Risk Outlook:** ${executive.riskOutlook}`);
//   lines.push("");
//   lines.push("## 2. Model Evaluation");
//   lines.push(evaluation.summary);
//   lines.push("");
//   lines.push("**Strengths**");
//   evaluation.strengths.forEach(s => lines.push(`- ${s}`));
//   lines.push("");
//   lines.push("**Weaknesses**");
//   evaluation.weaknesses.forEach(w => lines.push(`- ${w}`));
//   lines.push("");
//   lines.push("## 3. Monitoring & Drift Observations");
//   lines.push(monitoring.qoqNarrative);
//   lines.push("");
//   lines.push(monitoring.driftNarrative);
//   lines.push("");
//   lines.push(monitoring.hotspotNarrative);
//   if (monitoring.alerts.length) {
//     lines.push("");
//     lines.push("**Active Alerts**");
//     monitoring.alerts.forEach(a => lines.push(`- [${a.severity}] ${a.text}`));
//   }
//   lines.push("");
//   lines.push("## 4. Recommended Actions");
//   recommendation.actions.forEach((a,i) => lines.push(`${i+1}. **[${a.status}] ${a.metric}** — ${a.text} _(${a.detail})_`));
//   lines.push("");
//   lines.push("---");
//   lines.push("_Generated by the agentic monitoring layer using structured monitoring data (dashboard_kpi, segment_monitoring, variable_monitoring, calibration_decile, threshold_rules). SR 11-7 compliant template._");
//   return lines.join("\n");
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // SPARKLINE COMPONENT
// // ─────────────────────────────────────────────────────────────────────────────
// function Sparkline({ data, dataKey, color, inverted }) {
//   return (
//     <ResponsiveContainer width="100%" height={36}>
//       <LineChart data={data} margin={{top:2,right:2,bottom:2,left:2}}>
//         <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
//       </LineChart>
//     </ResponsiveContainer>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // CHART: THRESHOLD BANDING (shared helper for colored ref areas)
// // ─────────────────────────────────────────────────────────────────────────────
// function ThresholdAreas({ metric }) {
//   if (metric === "gini" || metric === "ks") {
//     const gMin = metric==="gini" ? 0.55 : 30;
//     const aMin = metric==="gini" ? 0.50 : 25;
//     return (
//       <>
//         <ReferenceArea y1={gMin} y2={1.0}  fill={C.greenBg}  fillOpacity={0.5} />
//         <ReferenceArea y1={aMin} y2={gMin} fill={C.amberBg}  fillOpacity={0.5} />
//         <ReferenceArea y1={0}    y2={aMin} fill={C.redBg}    fillOpacity={0.5} />
//         <ReferenceLine y={gMin} stroke={C.green} strokeDasharray="4 3" strokeWidth={1.5} label={{ value:`Green ≥ ${metric==="gini"?"0.55":"30%"}`, fontSize:10, fill:C.green, position:"insideTopRight" }} />
//         <ReferenceLine y={aMin} stroke={C.amber} strokeDasharray="4 3" strokeWidth={1.5} label={{ value:`Red < ${metric==="gini"?"0.50":"25%"}`, fontSize:10, fill:C.red, position:"insideBottomRight" }} />
//       </>
//     );
//   }
//   if (metric === "psi") {
//     return (
//       <>
//         <ReferenceArea y1={0}    y2={0.10} fill={C.greenBg} fillOpacity={0.5} />
//         <ReferenceArea y1={0.10} y2={0.25} fill={C.amberBg} fillOpacity={0.5} />
//         <ReferenceArea y1={0.25} y2={0.50} fill={C.redBg}   fillOpacity={0.5} />
//         <ReferenceLine y={0.10} stroke={C.green} strokeDasharray="4 3" strokeWidth={1.5} label={{ value:"Green < 0.10", fontSize:10, fill:C.green, position:"insideTopRight" }} />
//         <ReferenceLine y={0.25} stroke={C.red}   strokeDasharray="4 3" strokeWidth={1.5} label={{ value:"Red > 0.25",  fontSize:10, fill:C.red,   position:"insideTopRight" }} />
//       </>
//     );
//   }
//   if (metric === "calibration_gap") {
//     return (
//       <>
//         <ReferenceArea y1={0}    y2={0.03} fill={C.greenBg} fillOpacity={0.5} />
//         <ReferenceArea y1={0.03} y2={0.07} fill={C.amberBg} fillOpacity={0.5} />
//         <ReferenceArea y1={0.07} y2={0.20} fill={C.redBg}   fillOpacity={0.5} />
//         <ReferenceLine y={0.03} stroke={C.green} strokeDasharray="4 3" strokeWidth={1.5} />
//         <ReferenceLine y={0.07} stroke={C.red}   strokeDasharray="4 3" strokeWidth={1.5} />
//       </>
//     );
//   }
//   return null;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // COLLAPSIBLE SECTION
// // ─────────────────────────────────────────────────────────────────────────────
// function Collapsible({ title, badge, children, defaultOpen=false, accent=false }) {
//   const [open, setOpen] = useState(defaultOpen);
//   return (
//     <div style={{ border:`1px solid ${C.borderLight}`, borderRadius:6, overflow:"hidden", marginBottom:12 }}>
//       <button
//         onClick={() => setOpen(o=>!o)}
//         style={{
//           width:"100%", display:"flex", alignItems:"center", gap:12, justifyContent:"space-between",
//           background: accent ? C.navy : "#FAFBFC",
//           padding:"12px 16px", border:"none", cursor:"pointer",
//           borderBottom: open ? `1px solid ${C.borderLight}` : "none",
//         }}>
//         <div style={{ display:"flex", alignItems:"center", gap:10 }}>
//           <span style={{ fontSize:13, fontWeight:700, color: accent ? "#FFFFFF" : C.text }}>{title}</span>
//           {badge && <Badge status={badge}>{badge}</Badge>}
//         </div>
//         <span style={{ fontSize:12, color: accent ? "#CBD5E1" : C.slateLight, fontWeight:600 }}>{open?"▲ Collapse":"▼ Expand"}</span>
//       </button>
//       {open && <div style={{ padding:"16px 20px", background:C.surface }}>{children}</div>}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────────────────────────────────────
// export default function ModelMonitoring({ analysisResult, setAnalysisResult }) {
//   const history = mockHistoricalData;
//   const latestQ = history[history.length - 1];
//   const [selectedQuarter, setSelectedQuarter] = useState(latestQ.quarter);

//   const [aiReport, setAiReport]         = useState("");
//   const [isAiLoading, setIsAiLoading]   = useState(false);
//   const [reportSource, setReportSource] = useState(null);

//   const [segmentFilter, setSegmentFilter] = useState("product");
//   const [chartInsights, setChartInsights]     = useState({});
//   const [loadingInsights, setLoadingInsights] = useState({});
//   const [thresholdRec, setThresholdRec]       = useState("");
//   const [isOptimizing, setIsOptimizing]       = useState(false);

//   const [isChatOpen, setIsChatOpen]     = useState(false);
//   const [chatInput, setChatInput]       = useState("");
//   const [isChatLoading, setIsChatLoading] = useState(false);
//   const [chatMessages, setChatMessages] = useState([
//     { role:"assistant", content:"SR 11-7 Risk Co-Pilot ready. I have access to all monitoring data for the current selection. Ask about drift, segments, calibration, or recommendations." }
//   ]);
//   const chatEndRef = useRef(null);

//   useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatMessages, isChatOpen]);
//   useEffect(() => { setThresholdRec(""); setChartInsights({}); }, [selectedQuarter]);

//   const agentOutputs = useMemo(() => runAllAgents(selectedQuarter), [selectedQuarter]);
//   const activeAnalysis = analysisResult || mockAnalysisStore[selectedQuarter] || mockAnalysisStore["2025 Q1"];
//   const cm = activeAnalysis.confusion_matrix || { tn:0, fp:0, fn:0, tp:0 };
//   const cmTotal = cm.tn + cm.fp + cm.fn + cm.tp || 1;
//   const fpRate = cm.fp / Math.max(cm.tn+cm.fp, 1);
//   const fnRate = cm.fn / Math.max(cm.fn+cm.tp, 1);

//   const selectedQRow = mockHistoricalData.find(h => h.quarter===selectedQuarter);
//   const segmentRowsForQuarter = mockSegmentMonitoring.filter(r => r.quarter===selectedQuarter && r.segment_type===segmentFilter);
//   const variableRowsForQuarter = mockVariableMonitoring.filter(r => r.quarter===selectedQuarter).sort((a,b)=>b.psi-a.psi);
//   const pdDecileData = activeAnalysis.pd_decile_analysis || [];
//   const scoreBandData = activeAnalysis.score_band_analysis || [];

//   // Calibration chart data
//   const calibrationData = pdDecileData.map(d => ({
//     decile: d.decile, predicted_pd: +(d.average_pd*100).toFixed(2),
//     actual_pd: +(d.actual_bad_rate*100).toFixed(2), perfect: +(d.average_pd*100).toFixed(2),
//   }));

//   // Gains chart data
//   const riskiestFirst = [...pdDecileData].reverse();
//   let cumDef = 0;
//   const totalDef = riskiestFirst.reduce((s,d) => s + d.actual_bad_rate*d.customer_count, 0);
//   const gainsData = riskiestFirst.map((d,i) => {
//     cumDef += d.actual_bad_rate*d.customer_count;
//     return { decile:d.decile, pct_portfolio:(i+1)*10, model_capture:totalDef?+(cumDef/totalDef*100).toFixed(1):0, random:(i+1)*10 };
//   });

//   // ROC synthetic data from AUC
//   const rocData = useMemo(() => {
//     const auc = selectedQRow?.auc || 0.70;
//     return Array.from({length:21},(_,i)=>{
//       const fpr = i/20;
//       const tpr = Math.min(1, fpr + (auc-0.5)*2 * Math.pow(fpr*(1-fpr), 0.4) + Math.pow(fpr,0.7)*(2*auc-1));
//       return { fpr:+(fpr*100).toFixed(1), tpr:+(Math.min(1,tpr)*100).toFixed(1), diagonal:+(fpr*100).toFixed(1) };
//     });
//   }, [selectedQuarter]);

//   // Drift (score band population shift)
//   const driftData = scoreBandData.map((d,i) => {
//     const baseIdx = Math.min(i+1, scoreBandData.length-1);
//     return { score_band:d.score_band, current:d.customer_count, baseline:Math.round(scoreBandData[baseIdx].customer_count*1.05) };
//   });

//   // Handle AI report generation
//   const handleRunAiValidator = async () => {
//     setIsAiLoading(true);
//     try {
//       const res = await fetch(`${API_BASE_URL}/agents/monitoring`, {
//         method:"POST", headers:{"Content-Type":"application/json"},
//         body: JSON.stringify({ history }),
//       });
//       if (!res.ok) throw new Error("backend unavailable");
//       const data = await res.json();
//       if (!data?.report_markdown) throw new Error("empty report");
//       setAiReport(data.report_markdown);
//       setReportSource("backend");
//     } catch {
//       setAiReport(composeMarkdownReport(agentOutputs, selectedQuarter));
//       setReportSource("local");
//     } finally { setIsAiLoading(false); }
//   };

//   const handleDownloadReport = () => {
//     const el = document.createElement("a");
//     el.href = URL.createObjectURL(new Blob([aiReport], {type:"text/plain"}));
//     el.download = `SR11-7_Model_Monitoring_${selectedQuarter.replace(" ","_")}.md`;
//     document.body.appendChild(el); el.click();
//   };

//   const handleGetInsight = async (chartType, chartData) => {
//     setLoadingInsights(p => ({...p,[chartType]:true}));
//     try {
//       const res = await fetch(`${API_BASE_URL}/agents/chart-insight`, {
//         method:"POST", headers:{"Content-Type":"application/json"},
//         body: JSON.stringify({ chart_type:chartType, chart_data:chartData }),
//       });
//       if (!res.ok) throw new Error();
//       const data = await res.json();
//       if (!data?.insight) throw new Error();
//       setChartInsights(p => ({...p,[chartType]:data.insight}));
//     } catch {
//       const row = selectedQRow;
//       const insight = chartType==="Calibration Curve"
//         ? `Calibration is weakest in decile 9-10 where the model underpredicts actual default rate by ${pctStr(Math.abs(pdDecileData.at(-1)?.calibration_gap||0))}. Observed/Expected ratio of ${(pdDecileData.at(-1)?.observed_to_expected||1).toFixed(2)} indicates systematic underprediction in high-risk bands.`
//         : chartType==="Gains Curve"
//           ? `Targeting the top 3 deciles by predicted PD captures approximately ${gainsData.at(-3)?.model_capture?.toFixed(0)||65}% of all defaults in ${selectedQuarter} vs 30% under random selection.`
//           : `AUC of ${numStr(row?.auc,3)} corresponds to the area under the ROC curve. Current discrimination is ${row?.alert_status==="Red"?"materially degraded":"within tolerance"}.`;
//       setChartInsights(p => ({...p,[chartType]:insight}));
//     } finally { setLoadingInsights(p => ({...p,[chartType]:false})); }
//   };

//   const handleOptimizeThreshold = async () => {
//     setIsOptimizing(true);
//     try {
//       const res = await fetch(`${API_BASE_URL}/agents/optimize-threshold`, {
//         method:"POST", headers:{"Content-Type":"application/json"},
//         body: JSON.stringify({ confusion_matrix:cm }),
//       });
//       if (!res.ok) throw new Error();
//       const data = await res.json();
//       if (!data?.recommendation) throw new Error();
//       setThresholdRec(data.recommendation);
//     } catch {
//       const costlier = fnRate>fpRate?"false negatives (missed defaulters)":"false positives (good accounts declined)";
//       const dir = fnRate>fpRate?"lowering the score cut-off to flag more accounts as high-risk":"raising the cut-off to reduce unnecessary declines";
//       setThresholdRec(`Based on the current confusion matrix, **${costlier}** are the larger error type (FN rate ${(fnRate*100).toFixed(1)}% vs FP rate ${(fpRate*100).toFixed(1)}%). A directional next step is **${dir}**, then re-validating on a hold-out sample before deployment. Confirm against the business cost ratio (missed default vs foregone good customer) before implementing.`);
//     } finally { setIsOptimizing(false); }
//   };

//   const handleSendChatMessage = async () => {
//     if (!chatInput.trim()) return;
//     const newMsg = { role:"user", content:chatInput };
//     const updated = [...chatMessages, newMsg];
//     setChatMessages(updated); setChatInput(""); setIsChatLoading(true);
//     try {
//       const res = await fetch(`${API_BASE_URL}/chat`, {
//         method:"POST", headers:{"Content-Type":"application/json"},
//         body: JSON.stringify({ messages:updated, context_summary:JSON.stringify({history}), persona:"SR 11-7 Risk Co-Pilot, concise bullet responses." }),
//       });
//       if (!res.ok) throw new Error();
//       const data = await res.json();
//       setChatMessages(p => [...p, { role:"assistant", content:data.reply||"No reply." }]);
//     } catch {
//       const q = chatInput.toLowerCase();
//       const row = selectedQRow;
//       let reply = `Quarter ${selectedQuarter} — Status: **${row?.alert_status}** (Gini ${numStr(row?.gini,3)}, KS ${numStr(row?.ks,1)}%). Ask about drift, segments, calibration, or recommendations.`;
//       if (q.includes("segment")||q.includes("hotspot")) reply = agentOutputs?.monitoring?.hotspotNarrative||reply;
//       else if (q.includes("drift")||q.includes("psi")||q.includes("variable")) reply = agentOutputs?.monitoring?.driftNarrative||reply;
//       else if (q.includes("recommend")||q.includes("action")||q.includes("what should")) reply = (agentOutputs?.recommendation?.actions||[]).slice(0,3).map((a,i)=>`${i+1}. **[${a.status}] ${a.metric}** — ${a.text}`).join("\n");
//       else if (q.includes("summary")||q.includes("overview")) reply = agentOutputs?.executive?.narrative||reply;
//       setChatMessages(p => [...p, { role:"assistant", content:reply }]);
//     } finally { setIsChatLoading(false); }
//   };

//   // ─── CHART INSIGHT WIDGET ─────────────────────────────────────────────────
//   const InsightWidget = ({ chartType, data }) => {
//     const insight = chartInsights[chartType];
//     const loading = loadingInsights[chartType];
//     if (insight) return (
//       <div style={{ background:C.blueBg, border:`1px solid ${C.blueBorder}`, borderRadius:4, padding:"10px 14px", fontSize:13, color:C.blue, marginTop:10, lineHeight:1.55 }}>
//         <span style={{ fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", color:C.navyLight }}>AI Insight — </span>
//         {insight}
//       </div>
//     );
//     return (
//       <button onClick={() => handleGetInsight(chartType, data)} disabled={loading}
//         style={{ marginTop:10, fontSize:12, fontWeight:600, color:C.slate, background:C.surface, border:`1px solid ${C.border}`, padding:"5px 12px", borderRadius:4, cursor:loading?"wait":"pointer" }}>
//         {loading?"Generating...":"Generate AI Insight"}
//       </button>
//     );
//   };

//   // ─── STATUS STRIP ─────────────────────────────────────────────────────────
//   const statusColor = STATUS_COLOR[latestQ.alert_status];
//   const statusBg    = STATUS_BG[latestQ.alert_status];

//   // ─── KPI CONFIG ───────────────────────────────────────────────────────────
//   const kpiCards = [
//     { label:"Gini Coefficient", key:"gini", fmt:v=>v.toFixed(3), threshold:"≥ 0.55 (Green)", sparkColor:C.blue, rule:THRESHOLD_RULES[0], invert:false },
//     { label:"AUC", key:"auc", fmt:v=>v.toFixed(3), threshold:"≥ 0.75 (Green)", sparkColor:"#7C3AED", rule:null, invert:false },
//     { label:"KS Statistic", key:"ks", fmt:v=>v.toFixed(1)+"%", threshold:"≥ 30% (Green)", sparkColor:"#0891B2", rule:THRESHOLD_RULES[1], invert:false },
//     { label:"PSI", key:"psi_population", fmt:v=>v.toFixed(2), threshold:"< 0.10 (Green)", sparkColor:C.amber, rule:THRESHOLD_RULES[2], invert:true },
//     { label:"Calibration Gap", key:"calibration_gap", fmt:v=>v.toFixed(3), threshold:"< 0.03 (Green)", sparkColor:C.red, rule:THRESHOLD_RULES[4], invert:true },
//     { label:"Avg Predicted PD", key:"avg_pred_pd", fmt:v=>pctStr(v), threshold:"Monitoring only", sparkColor:C.slate, rule:null, invert:false },
//     { label:"Actual Default Rate", key:"actual_default_rate", fmt:v=>pctStr(v), threshold:"Monitoring only", sparkColor:C.red, rule:null, invert:true },
//   ];

//   // ─────────────────────────────────────────────────────────────────────────
//   // LAYOUT CONSTANTS
//   const PAGE = { maxWidth:1600, padding:"0 24px", margin:"0 auto" };
//   const SEC  = { marginBottom:40 };
//   const H2   = { fontSize:15, fontWeight:700, color:C.text, margin:"0 0 16px 0" };
//   const TH   = { padding:"8px 10px", fontSize:11, fontWeight:700, color:C.textSoft, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:`2px solid ${C.borderLight}`, textAlign:"left", background:"#FAFBFC" };
//   const TD   = { padding:"9px 10px", fontSize:13, color:C.textMid, borderBottom:`1px solid ${C.borderLight}` };

//   const rowQRow = selectedQRow || latestQ;

//   return (
//     <div style={{ background:C.bg, minHeight:"100vh", paddingBottom:80 }}>

//       {/* ═══════════════════════════════════════════════════════════════════
//           SECTION 1 — EXECUTIVE STATUS STRIP (sticky)
//       ════════════════════════════════════════════════════════════════════ */}
//       <div style={{
//         position:"sticky", top:0, zIndex:200, background:C.navy,
//         borderBottom:`3px solid ${statusColor}`,
//         boxShadow:"0 2px 8px rgba(0,0,0,0.25)",
//       }}>
//         <div style={{...PAGE, padding:"0 24px"}}>
//           <div style={{ display:"flex", alignItems:"center", gap:24, height:56, flexWrap:"wrap" }}>
//             <div style={{ display:"flex", alignItems:"center", gap:12 }}>
//               <div style={{ width:10, height:10, borderRadius:"50%", background:statusColor, boxShadow:`0 0 0 3px ${statusBg}` }} />
//               <span style={{ fontSize:13, fontWeight:700, color:"#FFFFFF", letterSpacing:"0.02em" }}>
//                 MODEL STATUS: <span style={{ color:statusColor }}>{latestQ.alert_status.toUpperCase()}</span>
//               </span>
//             </div>
//             <div style={{ width:1, height:24, background:"#334155" }} />
//             <span style={{ fontSize:13, color:"#94A3B8", fontWeight:600 }}>Current Quarter: <span style={{ color:"#E2E8F0" }}>{latestQ.quarter}</span></span>
//             <div style={{ width:1, height:24, background:"#334155" }} />
//             <span style={{ fontSize:13, color:"#94A3B8", fontWeight:600 }}>Worst Metric: <span style={{ color:statusColor }}>{agentOutputs?.executive?.worstMetric || "Gini Coefficient"}</span></span>
//             <div style={{ width:1, height:24, background:"#334155" }} />
//             <span style={{ fontSize:13, color:"#94A3B8", fontWeight:600 }}>Governance Action: <span style={{ color:"#F8FAFC", fontWeight:700 }}>{agentOutputs?.recommendation?.governance || "—"}</span></span>
//             <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
//               <span style={{ fontSize:11, color:"#64748B", fontWeight:600, letterSpacing:"0.04em" }}>ENTERPRISE MODEL VALIDATION</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* PAGE WRAPPER */}
//       <div style={{ maxWidth:1600, margin:"0 auto", padding:"24px 24px 0" }}>

//         {/* ═══════════════════════════════════════════════════════════════
//             PAGE HEADER
//         ════════════════════════════════════════════════════════════════ */}
//         <div style={{ marginBottom:28, paddingBottom:20, borderBottom:`1px solid ${C.borderLight}` }}>
//           <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
//             <div>
//               <div style={{ fontSize:11, fontWeight:700, color:C.slateLight, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Credit Risk — PD Model</div>
//               <h1 style={{ margin:"0 0 4px 0", fontSize:22, fontWeight:700, color:C.text }}>SME IFRS9 PD Model — Monitoring Command Center</h1>
//               <div style={{ fontSize:13, color:C.textSoft }}>SR 11-7 Compliant Quarterly Model Validation &amp; Drift Monitoring | Model ID: PD001</div>
//             </div>
//             <div style={{ display:"flex", gap:10, alignItems:"center" }}>
//               <select value={selectedQuarter} onChange={e=>setSelectedQuarter(e.target.value)}
//                 style={{ padding:"7px 12px", borderRadius:4, border:`1px solid ${C.border}`, fontSize:13, fontWeight:600, color:C.text, background:C.surface, cursor:"pointer" }}>
//                 {history.map(h => <option key={h.quarter} value={h.quarter}>{h.quarter}</option>)}
//               </select>
//               <button onClick={handleRunAiValidator} disabled={isAiLoading||history.length<2}
//                 style={{ padding:"7px 18px", background:C.navy, color:"#FFF", border:"none", borderRadius:4, fontWeight:700, fontSize:13, cursor:"pointer", opacity:(isAiLoading||history.length<2)?0.5:1 }}>
//                 {isAiLoading?"Generating...":"Generate SR 11-7 Report"}
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* ═══════════════════════════════════════════════════════════════
//             SECTION 2 — EXECUTIVE SUMMARY
//         ════════════════════════════════════════════════════════════════ */}
//         <div style={SEC}>
//           <SectionLabel>Section 2 — Executive Summary</SectionLabel>
//           {agentOutputs?.monitoring?.alerts?.length > 0 && (
//             <div style={{
//               background: latestQ.alert_status==="Red" ? C.redBg : C.amberBg,
//               border:`1px solid ${latestQ.alert_status==="Red"?C.redBorder:C.amberBorder}`,
//               borderRadius:4, padding:"12px 16px", marginBottom:14,
//               display:"flex", gap:12, alignItems:"flex-start",
//             }}>
//               <div style={{ flex:1 }}>
//                 <div style={{ fontSize:11, fontWeight:700, color:latestQ.alert_status==="Red"?C.red:C.amber, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
//                   ACTIVE GOVERNANCE ALERTS — {selectedQuarter}
//                 </div>
//                 <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
//                   {agentOutputs.monitoring.alerts.map((a,i) => (
//                     <div key={i} style={{ display:"flex", gap:8, alignItems:"baseline", fontSize:13 }}>
//                       <Badge status={a.severity} small>{a.severity}</Badge>
//                       <span style={{ color:C.textMid }}>{a.text}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}
//           <Card>
//             <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:0 }}>
//               <div style={{ padding:"16px 20px", borderRight:`1px solid ${C.borderLight}` }}>
//                 <MetricLabel>Executive Narrative</MetricLabel>
//                 <p style={{ margin:"8px 0 0 0", fontSize:14, color:C.textMid, lineHeight:1.65, fontWeight:500 }}>
//                   {agentOutputs?.executive?.narrative || "—"}
//                 </p>
//               </div>
//               <div style={{ padding:"16px 20px", borderRight:`1px solid ${C.borderLight}` }}>
//                 <MetricLabel>Portfolio Health</MetricLabel>
//                 <p style={{ margin:"8px 0 0 0", fontSize:14, color:C.textMid, lineHeight:1.65 }}>
//                   {agentOutputs?.executive?.portfolioHealth || "—"}
//                 </p>
//               </div>
//               <div style={{ padding:"16px 20px", background: rowQRow?.alert_status==="Red"?C.redBg:rowQRow?.alert_status==="Amber"?C.amberBg:C.greenBg, borderRadius:"0 5px 5px 0" }}>
//                 <MetricLabel>Risk Outlook</MetricLabel>
//                 <p style={{ margin:"8px 0 12px 0", fontSize:14, color:C.textMid, lineHeight:1.65 }}>
//                   {agentOutputs?.executive?.riskOutlook || "—"}
//                 </p>
//                 <Badge status={rowQRow?.alert_status || "Green"}>{agentOutputs?.recommendation?.governance || rowQRow?.alert_status}</Badge>
//               </div>
//             </div>
//           </Card>
//         </div>

//         {/* ═══════════════════════════════════════════════════════════════
//             SECTION 3 — KPI COMMAND CENTER
//         ════════════════════════════════════════════════════════════════ */}
//         <div style={SEC}>
//           <SectionLabel>Section 3 — KPI Command Center</SectionLabel>
//           <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:10 }}>
//             {kpiCards.map(card => {
//               const val = latestQ[card.key];
//               const status = card.rule ? rateStatus(card.rule, val) : null;
//               const prevVal = history[history.length-2]?.[card.key];
//               const delta = prevVal != null ? val - prevVal : null;
//               const deltaGood = card.invert ? delta < 0 : delta > 0;
//               return (
//                 <Card key={card.key} style={{ padding:"14px 14px 10px", borderTop:`3px solid ${status?STATUS_COLOR[status]:C.navy}` }}>
//                   <MetricLabel>{card.label}</MetricLabel>
//                   <MetricValue color={status?STATUS_COLOR[status]:C.text}>{card.fmt(val)}</MetricValue>
//                   {delta != null && (
//                     <div style={{ fontSize:11, color:deltaGood?C.green:C.red, fontWeight:600, marginTop:3 }}>
//                       {delta>0?"▲":"▼"} {Math.abs(card.fmt(val).includes("%")?parseFloat(card.fmt(val))-parseFloat(card.fmt(prevVal)):val-prevVal).toFixed(3)} vs prev
//                     </div>
//                   )}
//                   <div style={{ marginTop:8 }}>
//                     <Sparkline data={history} dataKey={card.key} color={status?STATUS_COLOR[status]:card.sparkColor} />
//                   </div>
//                   {status && (
//                     <div style={{ marginTop:6 }}>
//                       <Badge status={status} small>{status}</Badge>
//                     </div>
//                   )}
//                   <div style={{ marginTop:4, fontSize:10, color:C.slateLight, fontWeight:600 }}>{card.threshold}</div>
//                 </Card>
//               );
//             })}
//           </div>
//         </div>

//         {/* ═══════════════════════════════════════════════════════════════
//             SECTION 4 — ROOT CAUSE INVESTIGATION
//         ════════════════════════════════════════════════════════════════ */}
//         <div style={SEC}>
//           <SectionLabel>Section 4 — Root Cause Investigation</SectionLabel>
//           <Card noPad>
//             <div style={{ padding:"16px 20px 12px", borderBottom:`1px solid ${C.borderLight}` }}>
//               <h2 style={{...H2, margin:0}}>Deterioration Chain — {selectedQuarter}</h2>
//             </div>
//             <div style={{ padding:"20px", overflowX:"auto" }}>
//               {/* Cause & effect chain for Red/Amber metrics */}
//               {(() => {
//                 const row = rowQRow;
//                 if (!row) return null;
//                 const chains = [];
//                 // Gini chain
//                 if (row.gini < 0.55) {
//                   const segHS = getSegmentHotspots(selectedQuarter).filter(s=>s.is_hotspot).slice(0,1);
//                   const varHS = getVariableHotspots(selectedQuarter).slice(0,1);
//                   chains.push({
//                     metric:"Gini Coefficient",
//                     value:numStr(row.gini,3), status:rateStatus(THRESHOLD_RULES[0],row.gini),
//                     segment: segHS.length ? segHS[0].segment_value : "Broad-based",
//                     segBadRate: segHS.length ? pctStr(segHS[0].bad_rate) : "—",
//                     variable: varHS.length ? varHS[0].variable_name : "—",
//                     variablePSI: varHS.length ? numStr(varHS[0].psi,2) : "—",
//                     impact:"Reduced rank-ordering power; cut-off decisions less reliable",
//                     action: agentOutputs?.recommendation?.actions?.find(a=>a.metric.includes("Gini"))?.text || THRESHOLD_RULES[0].action_guidance,
//                   });
//                 }
//                 if (row.ks < 30) {
//                   chains.push({
//                     metric:"KS Statistic",
//                     value:numStr(row.ks,1)+"%", status:rateStatus(THRESHOLD_RULES[1],row.ks),
//                     segment:"Score band 600-649", segBadRate:pctStr(scoreBandData.find(s=>s.score_band==="600-649")?.actual_bad_rate||0.35),
//                     variable:getVariableHotspots(selectedQuarter)[0]?.variable_name||"—",
//                     variablePSI:numStr(getVariableHotspots(selectedQuarter)[0]?.psi,2)||"—",
//                     impact:"Score separation between risk tiers weakening",
//                     action:THRESHOLD_RULES[1].action_guidance,
//                   });
//                 }
//                 if (row.psi_population > 0.10) {
//                   chains.push({
//                     metric:"Population Stability Index",
//                     value:numStr(row.psi_population,2), status:rateStatus(THRESHOLD_RULES[2],row.psi_population),
//                     segment:"Portfolio-wide",
//                     segBadRate:pctStr(row.actual_default_rate),
//                     variable:getVariableHotspots(selectedQuarter)[0]?.variable_name||"—",
//                     variablePSI:numStr(getVariableHotspots(selectedQuarter)[0]?.psi,2)||"—",
//                     impact:"Population composition changed; model trained on different distribution",
//                     action:THRESHOLD_RULES[2].action_guidance,
//                   });
//                 }
//                 if (!chains.length) return (
//                   <div style={{ fontSize:13, color:C.green, fontWeight:600, padding:8 }}>All KPIs within Green governance thresholds. No active deterioration chains.</div>
//                 );
//                 return chains.map((ch,ci) => (
//                   <div key={ci} style={{ marginBottom: ci < chains.length-1 ? 20 : 0 }}>
//                     <div style={{ display:"flex", alignItems:"stretch", gap:0 }}>
//                       {/* Step 1: Metric */}
//                       <div style={{ flex:1, background:STATUS_BG[ch.status], border:`1px solid ${STATUS_BORDER[ch.status]}`, borderRadius:"4px 0 0 4px", padding:"14px 16px" }}>
//                         <div style={{ fontSize:10, fontWeight:700, color:STATUS_COLOR[ch.status], textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Metric Breach</div>
//                         <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{ch.metric}</div>
//                         <div style={{ fontSize:13, color:STATUS_COLOR[ch.status], fontWeight:700 }}>{ch.value}</div>
//                         <Badge status={ch.status} small>{ch.status}</Badge>
//                       </div>
//                       <div style={{ display:"flex", alignItems:"center", padding:"0 6px", background:C.borderLight, color:C.slate, fontWeight:700, fontSize:14 }}>→</div>
//                       {/* Step 2: Segment */}
//                       <div style={{ flex:1, background:"#F8FAFC", border:`1px solid ${C.border}`, padding:"14px 16px" }}>
//                         <div style={{ fontSize:10, fontWeight:700, color:C.textSoft, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Affected Segment</div>
//                         <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{ch.segment}</div>
//                         <div style={{ fontSize:12, color:C.red, fontWeight:600 }}>Bad Rate: {ch.segBadRate}</div>
//                       </div>
//                       <div style={{ display:"flex", alignItems:"center", padding:"0 6px", background:C.borderLight, color:C.slate, fontWeight:700, fontSize:14 }}>→</div>
//                       {/* Step 3: Variable */}
//                       <div style={{ flex:1, background:"#F8FAFC", border:`1px solid ${C.border}`, padding:"14px 16px" }}>
//                         <div style={{ fontSize:10, fontWeight:700, color:C.textSoft, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Variable Drift</div>
//                         <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{ch.variable}</div>
//                         <div style={{ fontSize:12, color:C.amber, fontWeight:600 }}>PSI: {ch.variablePSI}</div>
//                       </div>
//                       <div style={{ display:"flex", alignItems:"center", padding:"0 6px", background:C.borderLight, color:C.slate, fontWeight:700, fontSize:14 }}>→</div>
//                       {/* Step 4: Business impact */}
//                       <div style={{ flex:1, background:"#F8FAFC", border:`1px solid ${C.border}`, padding:"14px 16px" }}>
//                         <div style={{ fontSize:10, fontWeight:700, color:C.textSoft, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Business Impact</div>
//                         <div style={{ fontSize:13, color:C.textMid, lineHeight:1.5 }}>{ch.impact}</div>
//                       </div>
//                       <div style={{ display:"flex", alignItems:"center", padding:"0 6px", background:C.borderLight, color:C.slate, fontWeight:700, fontSize:14 }}>→</div>
//                       {/* Step 5: Action */}
//                       <div style={{ flex:1.2, background:C.navy, border:`1px solid ${C.navyMid}`, borderRadius:"0 4px 4px 0", padding:"14px 16px" }}>
//                         <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Recommended Action</div>
//                         <div style={{ fontSize:13, color:"#F1F5F9", lineHeight:1.5, fontWeight:500 }}>{ch.action}</div>
//                       </div>
//                     </div>
//                   </div>
//                 ));
//               })()}
//             </div>
//           </Card>
//         </div>

//         {/* ═══════════════════════════════════════════════════════════════
//             SECTION 5 — MONITORING VISUALIZATION CENTER
//         ════════════════════════════════════════════════════════════════ */}
//         <div style={SEC}>
//           <SectionLabel>Section 5 — Monitoring Visualization Center</SectionLabel>
//           <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
//             {/* Gini trend */}
//             <Card>
//               <h3 style={{...H2}}>Gini Coefficient — Trend</h3>
//               <div style={{ height:220 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={history} margin={{top:4,right:16,bottom:0,left:4}}>
//                     <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
//                     <XAxis dataKey="quarter" tick={{fill:C.textSoft,fontSize:11}} />
//                     <YAxis domain={[0.3,0.7]} tick={{fill:C.textSoft,fontSize:11}} tickFormatter={v=>v.toFixed(2)} />
//                     <Tooltip formatter={v=>[v.toFixed(3),"Gini"]} />
//                     <ThresholdAreas metric="gini" />
//                     <Line type="monotone" dataKey="gini" stroke={C.navy} strokeWidth={2.5} dot={{r:4,fill:C.navy}} activeDot={{r:6}} name="Gini" />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </Card>
//             {/* AUC trend */}
//             <Card>
//               <h3 style={{...H2}}>AUC — Trend</h3>
//               <div style={{ height:220 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={history} margin={{top:4,right:16,bottom:0,left:4}}>
//                     <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
//                     <XAxis dataKey="quarter" tick={{fill:C.textSoft,fontSize:11}} />
//                     <YAxis domain={[0.55,0.85]} tick={{fill:C.textSoft,fontSize:11}} tickFormatter={v=>v.toFixed(2)} />
//                     <Tooltip formatter={v=>[v.toFixed(3),"AUC"]} />
//                     <ReferenceLine y={0.75} stroke={C.green} strokeDasharray="4 3" strokeWidth={1.5} label={{value:"Green ≥ 0.75",fontSize:10,fill:C.green,position:"insideTopRight"}} />
//                     <ReferenceLine y={0.70} stroke={C.red}   strokeDasharray="4 3" strokeWidth={1.5} label={{value:"Red < 0.70",fontSize:10,fill:C.red,position:"insideBottomRight"}} />
//                     <Line type="monotone" dataKey="auc" stroke="#7C3AED" strokeWidth={2.5} dot={{r:4,fill:"#7C3AED"}} name="AUC" />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </Card>
//             {/* KS trend */}
//             <Card>
//               <h3 style={{...H2}}>KS Statistic — Trend</h3>
//               <div style={{ height:220 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={history} margin={{top:4,right:16,bottom:0,left:4}}>
//                     <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
//                     <XAxis dataKey="quarter" tick={{fill:C.textSoft,fontSize:11}} />
//                     <YAxis domain={[10,45]} tick={{fill:C.textSoft,fontSize:11}} tickFormatter={v=>v+"%"} />
//                     <Tooltip formatter={v=>[v.toFixed(1)+"%","KS"]} />
//                     <ThresholdAreas metric="ks" />
//                     <Line type="monotone" dataKey="ks" stroke="#0891B2" strokeWidth={2.5} dot={{r:4,fill:"#0891B2"}} name="KS" />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </Card>
//             {/* PSI trend */}
//             <Card>
//               <h3 style={{...H2}}>Population Stability Index — Trend</h3>
//               <div style={{ height:220 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={history} margin={{top:4,right:16,bottom:0,left:4}}>
//                     <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
//                     <XAxis dataKey="quarter" tick={{fill:C.textSoft,fontSize:11}} />
//                     <YAxis domain={[0,0.40]} tick={{fill:C.textSoft,fontSize:11}} tickFormatter={v=>v.toFixed(2)} />
//                     <Tooltip formatter={v=>[v.toFixed(3),"PSI"]} />
//                     <ThresholdAreas metric="psi" />
//                     <Line type="monotone" dataKey="psi_population" stroke={C.amber} strokeWidth={2.5} dot={{r:4,fill:C.amber}} name="PSI" />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </Card>
//           </div>
//           <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
//             {/* PD vs Actual Default */}
//             <Card style={{ gridColumn:"1/3" }}>
//               <h3 style={{...H2}}>Predicted PD vs Actual Default Rate</h3>
//               <div style={{ height:220 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={history} margin={{top:4,right:16,bottom:0,left:4}}>
//                     <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
//                     <XAxis dataKey="quarter" tick={{fill:C.textSoft,fontSize:11}} />
//                     <YAxis tickFormatter={v=>pctStr(v)} tick={{fill:C.textSoft,fontSize:11}} />
//                     <Tooltip formatter={v=>[pctStr(v)]} />
//                     <Legend iconType="circle" wrapperStyle={{fontSize:12}} />
//                     <Line type="monotone" dataKey="actual_default_rate" stroke={C.red}   strokeWidth={2.5} dot={{r:3}} name="Actual Default Rate" />
//                     <Line type="monotone" dataKey="avg_pred_pd"         stroke={C.slate} strokeWidth={2} strokeDasharray="5 4" dot={false} name="Avg Predicted PD" />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </Card>
//             {/* Calibration Gap trend */}
//             <Card>
//               <h3 style={{...H2}}>Calibration Gap — Trend</h3>
//               <div style={{ height:220 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={history} margin={{top:4,right:16,bottom:0,left:4}}>
//                     <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
//                     <XAxis dataKey="quarter" tick={{fill:C.textSoft,fontSize:11}} />
//                     <YAxis domain={[0,0.15]} tick={{fill:C.textSoft,fontSize:11}} tickFormatter={v=>v.toFixed(2)} />
//                     <Tooltip formatter={v=>[v.toFixed(3),"Cal. Gap"]} />
//                     <ThresholdAreas metric="calibration_gap" />
//                     <Line type="monotone" dataKey="calibration_gap" stroke={C.red} strokeWidth={2.5} dot={{r:4,fill:C.red}} name="Calibration Gap" />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </Card>
//           </div>
//         </div>

//         {/* ═══════════════════════════════════════════════════════════════
//             SECTION 6 — PERFORMANCE DIAGNOSTICS
//         ════════════════════════════════════════════════════════════════ */}
//         <div style={SEC}>
//           <SectionLabel>Section 6 — Performance Diagnostics — {selectedQuarter}</SectionLabel>
//           <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
//             {/* Confusion Matrix */}
//             <Card>
//               <h3 style={{...H2}}>Confusion Matrix</h3>
//               <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 1fr", gap:4 }}>
//                 <div />
//                 {["Predicted: Good","Predicted: Bad"].map(l=>(
//                   <div key={l} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:C.textSoft, padding:"4px 0", textTransform:"uppercase", letterSpacing:"0.05em" }}>{l}</div>
//                 ))}
//                 <div style={{ display:"flex", alignItems:"center", fontSize:11, fontWeight:700, color:C.textSoft, justifyContent:"flex-end", paddingRight:8, textTransform:"uppercase", letterSpacing:"0.05em" }}>Actual: Good</div>
//                 {[{label:"True Negatives",count:cm.tn,rate:cm.tn/(Math.max(cm.tn+cm.fp,1)),good:true},{label:"False Positives",count:cm.fp,rate:cm.fp/(Math.max(cm.tn+cm.fp,1)),good:false}].map(cell=>(
//                   <div key={cell.label} style={{ background:cell.good?"#F0FDF4":"#FEF2F2", border:`1px solid ${cell.good?C.greenBorder:C.redBorder}`, borderRadius:4, padding:"12px", textAlign:"center" }}>
//                     <div style={{ fontSize:11, fontWeight:700, color:C.textSoft, marginBottom:4 }}>{cell.label}</div>
//                     <div style={{ fontSize:22, fontWeight:700, color:C.text, fontVariantNumeric:"tabular-nums" }}>{cell.count.toLocaleString()}</div>
//                     <div style={{ fontSize:11, color:cell.good?C.green:C.red, fontWeight:600 }}>{(cell.rate*100).toFixed(1)}%</div>
//                   </div>
//                 ))}
//                 <div style={{ display:"flex", alignItems:"center", fontSize:11, fontWeight:700, color:C.textSoft, justifyContent:"flex-end", paddingRight:8, textTransform:"uppercase", letterSpacing:"0.05em" }}>Actual: Bad</div>
//                 {[{label:"False Negatives",count:cm.fn,rate:cm.fn/(Math.max(cm.fn+cm.tp,1)),good:false},{label:"True Positives",count:cm.tp,rate:cm.tp/(Math.max(cm.fn+cm.tp,1)),good:true}].map(cell=>(
//                   <div key={cell.label} style={{ background:cell.good?"#F0FDF4":"#FEF2F2", border:`1px solid ${cell.good?C.greenBorder:C.redBorder}`, borderRadius:4, padding:"12px", textAlign:"center" }}>
//                     <div style={{ fontSize:11, fontWeight:700, color:C.textSoft, marginBottom:4 }}>{cell.label}</div>
//                     <div style={{ fontSize:22, fontWeight:700, color:C.text, fontVariantNumeric:"tabular-nums" }}>{cell.count.toLocaleString()}</div>
//                     <div style={{ fontSize:11, color:cell.good?C.green:C.red, fontWeight:600 }}>{(cell.rate*100).toFixed(1)}%</div>
//                   </div>
//                 ))}
//               </div>
//               <div style={{ marginTop:12, display:"flex", gap:16, fontSize:12, color:C.textSoft, borderTop:`1px solid ${C.borderLight}`, paddingTop:10 }}>
//                 <span>Total scored: <b>{cmTotal.toLocaleString()}</b></span>
//                 <span>FP Rate: <b style={{color:C.red}}>{(fpRate*100).toFixed(1)}%</b></span>
//                 <span>FN Rate: <b style={{color:C.red}}>{(fnRate*100).toFixed(1)}%</b></span>
//               </div>
//               {/* Threshold Optimizer */}
//               <div style={{ marginTop:14, background:"#F8FAFC", border:`1px solid ${C.border}`, borderRadius:4, padding:"12px 14px" }}>
//                 <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:thresholdRec?10:0 }}>
//                   <span style={{ fontSize:12, fontWeight:700, color:C.navy }}>Threshold Adjustment Strategy</span>
//                   {!thresholdRec && (
//                     <button onClick={handleOptimizeThreshold} disabled={isOptimizing}
//                       style={{ fontSize:12, fontWeight:600, color:C.navy, background:C.surface, border:`1px solid ${C.border}`, padding:"4px 12px", borderRadius:4, cursor:"pointer" }}>
//                       {isOptimizing?"Analysing...":"Generate Strategy"}
//                     </button>
//                   )}
//                 </div>
//                 {thresholdRec && <div style={{ fontSize:13, color:C.textMid, lineHeight:1.6 }}><ReactMarkdown>{thresholdRec}</ReactMarkdown></div>}
//               </div>
//             </Card>

//             {/* ROC Curve */}
//             <Card>
//               <h3 style={{...H2}}>ROC Curve — AUC {numStr(selectedQRow?.auc,3)}</h3>
//               <div style={{ height:280 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={rocData} margin={{top:4,right:16,bottom:20,left:4}}>
//                     <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
//                     <XAxis dataKey="fpr" tickFormatter={v=>v+"%"} label={{value:"False Positive Rate",position:"bottom",offset:4,fontSize:11,fill:C.textSoft}} tick={{fill:C.textSoft,fontSize:11}} />
//                     <YAxis domain={[0,100]} tickFormatter={v=>v+"%"} label={{value:"True Positive Rate",angle:-90,position:"insideLeft",offset:8,fontSize:11,fill:C.textSoft}} tick={{fill:C.textSoft,fontSize:11}} />
//                     <Tooltip formatter={v=>[v.toFixed(1)+"%"]} />
//                     <Legend iconType="circle" wrapperStyle={{fontSize:12}} />
//                     <Line type="monotone" dataKey="tpr"      stroke={C.navy}  strokeWidth={2.5} dot={false} name="Model ROC" />
//                     <Line type="linear"   dataKey="diagonal" stroke={C.slateLight} strokeDasharray="4 3" strokeWidth={1.5} dot={false} name="Random (AUC=0.50)" />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//               <InsightWidget chartType="ROC Curve" data={rocData} />
//             </Card>
//           </div>
//           <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
//             {/* Calibration Curve */}
//             <Card>
//               <h3 style={{...H2}}>Calibration Curve — Decile</h3>
//               <div style={{ height:240 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={calibrationData} margin={{top:4,right:16,bottom:20,left:4}}>
//                     <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
//                     <XAxis dataKey="predicted_pd" tickFormatter={v=>v.toFixed(0)+"%"} label={{value:"Predicted PD",position:"bottom",offset:4,fontSize:11,fill:C.textSoft}} tick={{fill:C.textSoft,fontSize:11}} />
//                     <YAxis tickFormatter={v=>v.toFixed(0)+"%"} tick={{fill:C.textSoft,fontSize:11}} />
//                     <Tooltip formatter={v=>[v.toFixed(2)+"%"]} />
//                     <Legend iconType="circle" wrapperStyle={{fontSize:11}} />
//                     <Line type="monotone" dataKey="actual_pd"  stroke={C.navy}      strokeWidth={2.5} dot={{r:4}} name="Actual Default Rate" />
//                     <Line type="linear"   dataKey="perfect"    stroke={C.slateLight} strokeDasharray="4 3" dot={false} name="Perfect Calibration" />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//               <InsightWidget chartType="Calibration Curve" data={calibrationData} />
//             </Card>
//             {/* Gains Curve */}
//             <Card>
//               <h3 style={{...H2}}>Cumulative Gains Curve</h3>
//               <div style={{ height:240 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={gainsData} margin={{top:4,right:16,bottom:20,left:4}}>
//                     <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
//                     <XAxis dataKey="pct_portfolio" tickFormatter={v=>v+"%"} label={{value:"% Portfolio Targeted",position:"bottom",offset:4,fontSize:11,fill:C.textSoft}} tick={{fill:C.textSoft,fontSize:11}} />
//                     <YAxis domain={[0,100]} tickFormatter={v=>v+"%"} tick={{fill:C.textSoft,fontSize:11}} />
//                     <Tooltip formatter={v=>[v.toFixed(1)+"%"]} />
//                     <Legend iconType="circle" wrapperStyle={{fontSize:11}} />
//                     <Line type="monotone" dataKey="model_capture" stroke="#7C3AED" strokeWidth={2.5} dot={{r:4}} name="Model Gains" />
//                     <Line type="linear"   dataKey="random"        stroke={C.slateLight} strokeDasharray="4 3" dot={false} name="Random Baseline" />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//               <InsightWidget chartType="Gains Curve" data={gainsData} />
//             </Card>
//             {/* Score Band Distribution */}
//             <Card>
//               <h3 style={{...H2}}>Score Band Distribution</h3>
//               <div style={{ height:240 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <ComposedChart data={scoreBandData} margin={{top:4,right:16,bottom:20,left:4}}>
//                     <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
//                     <XAxis dataKey="score_band" tick={{fill:C.textSoft,fontSize:11}} />
//                     <YAxis yAxisId="l" orientation="left"  tick={{fill:C.textSoft,fontSize:10}} tickFormatter={v=>v.toLocaleString()} />
//                     <YAxis yAxisId="r" orientation="right" tick={{fill:C.textSoft,fontSize:10}} tickFormatter={v=>pctStr(v)} />
//                     <Tooltip />
//                     <Legend iconType="circle" wrapperStyle={{fontSize:11}} />
//                     <Bar yAxisId="l" dataKey="customer_count" fill={C.navyLight} name="Customers" radius={[3,3,0,0]} />
//                     <Line yAxisId="r" type="monotone" dataKey="actual_bad_rate" stroke={C.red} strokeWidth={2} dot={{r:4}} name="Bad Rate" />
//                   </ComposedChart>
//                 </ResponsiveContainer>
//               </div>
//             </Card>
//           </div>
//         </div>

//         {/* ═══════════════════════════════════════════════════════════════
//             SECTION 7 — SEGMENT MONITORING
//         ════════════════════════════════════════════════════════════════ */}
//         <div style={SEC}>
//           <SectionLabel>Section 7 — Segment Monitoring — {selectedQuarter}</SectionLabel>
//           <Card noPad>
//             <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", borderBottom:`1px solid ${C.borderLight}` }}>
//               <h2 style={{...H2, margin:0}}>Segment Performance &amp; Hotspot Detection</h2>
//               <div style={{ display:"flex", gap:6 }}>
//                 {["product","geography","vintage","risk_band"].map(f=>(
//                   <button key={f} onClick={()=>setSegmentFilter(f)} style={{
//                     padding:"5px 12px", borderRadius:3, fontSize:12, fontWeight:700, cursor:"pointer", textTransform:"capitalize",
//                     border:`1px solid ${C.border}`,
//                     background: segmentFilter===f ? C.navy : C.surface,
//                     color: segmentFilter===f ? "#FFF" : C.slate,
//                   }}>{f.replace("_"," ")}</button>
//                 ))}
//               </div>
//             </div>
//             <div style={{ overflowX:"auto" }}>
//               <table style={{ width:"100%", borderCollapse:"collapse" }}>
//                 <thead>
//                   <tr>
//                     {["Segment","Accounts","Bad Rate","Avg Pred PD","Gini","AUC","KS","Seg PSI","Missing %","Status"].map(h=>(
//                       <th key={h} style={TH}>{h}</th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {segmentRowsForQuarter.map((s,i)=>{
//                     const segGiniStatus = rateStatus(THRESHOLD_RULES[0], s.gini);
//                     return (
//                       <tr key={i} style={{ background:s.is_hotspot?"#FEF9EC":"transparent" }}>
//                         <td style={{...TD, fontWeight:700}}>
//                           {s.segment_value}
//                           {s.is_hotspot && <Pill color={C.amber} bg={C.amberBg} style={{marginLeft:6}}>Hotspot</Pill>}
//                         </td>
//                         <td style={TD}>{s.accounts.toLocaleString()}</td>
//                         <td style={{...TD, fontWeight:700, color:s.is_hotspot?C.red:C.textMid}}>{pctStr(s.bad_rate)}</td>
//                         <td style={TD}>{pctStr(s.avg_pred_pd)}</td>
//                         <td style={{...TD, color:STATUS_COLOR[segGiniStatus]||C.textMid, fontWeight:600}}>{numStr(s.gini,3)}</td>
//                         <td style={TD}>{numStr(s.auc,3)}</td>
//                         <td style={TD}>{numStr(s.ks,1)}%</td>
//                         <td style={{...TD, color:rateStatus(THRESHOLD_RULES[3],s.psi_segment)==="Red"?C.red:C.textMid, fontWeight:600}}>{numStr(s.psi_segment,2)}</td>
//                         <td style={TD}>{pctStr(s.missing_rate)}</td>
//                         <td style={TD}><Badge status={segGiniStatus} small>{segGiniStatus}</Badge></td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         </div>

//         {/* ═══════════════════════════════════════════════════════════════
//             SECTION 8 — VARIABLE DRIFT MONITORING
//         ════════════════════════════════════════════════════════════════ */}
//         <div style={SEC}>
//           <SectionLabel>Section 8 — Variable Drift &amp; Data-Quality Monitoring — {selectedQuarter}</SectionLabel>
//           <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>
//             <Card noPad>
//               <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.borderLight}` }}>
//                 <h2 style={{...H2, margin:0}}>Feature-Level PSI &amp; Data-Quality Flags</h2>
//               </div>
//               <table style={{ width:"100%", borderCollapse:"collapse" }}>
//                 <thead>
//                   <tr>
//                     {["Variable","Group","Rank","PSI","Mean (Current)","Mean (Dev)","Missing %","Flags","Status"].map(h=>(
//                       <th key={h} style={TH}>{h}</th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {variableRowsForQuarter.map((v,i)=>{
//                     const psiStatus = rateStatus(THRESHOLD_RULES[3], v.psi);
//                     return (
//                       <tr key={i} style={{ background:(v.null_spike_flag||v.outlier_flag||v.category_shift_flag)?"#FFFBEB":"transparent" }}>
//                         <td style={{...TD, fontWeight:700}}>{v.variable_name}</td>
//                         <td style={{...TD, fontSize:11, color:C.textSoft}}>{v.variable_group}</td>
//                         <td style={{...TD, textAlign:"center"}}>#{v.importance_rank}</td>
//                         <td style={{...TD, fontWeight:700, color:STATUS_COLOR[psiStatus]||C.textMid}}>{numStr(v.psi,2)}</td>
//                         <td style={TD}>{v.mean_current!=null?v.mean_current:"—"}</td>
//                         <td style={TD}>{v.mean_dev!=null?v.mean_dev:"—"}</td>
//                         <td style={{...TD, color:v.missing_rate_current>0.10?C.red:C.textMid, fontWeight:v.missing_rate_current>0.10?700:400}}>
//                           {pctStr(v.missing_rate_current)}
//                         </td>
//                         <td style={TD}>
//                           <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
//                             {v.null_spike_flag      && <Pill color={C.amber} bg={C.amberBg}>Null Spike</Pill>}
//                             {v.outlier_flag         && <Pill color={C.red}   bg={C.redBg}>Outlier</Pill>}
//                             {v.category_shift_flag  && <Pill color="#5B21B6" bg="#EDE9FE">Cat. Shift</Pill>}
//                           </div>
//                         </td>
//                         <td style={TD}><Badge status={psiStatus} small>{psiStatus}</Badge></td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </Card>
//             {/* PSI bar chart */}
//             <Card>
//               <h3 style={{...H2}}>PSI by Variable — {selectedQuarter}</h3>
//               <div style={{ height:280 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={variableRowsForQuarter} layout="vertical" margin={{top:4,right:24,bottom:4,left:100}}>
//                     <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} horizontal={false} />
//                     <XAxis type="number" domain={[0,0.40]} tick={{fill:C.textSoft,fontSize:11}} tickFormatter={v=>v.toFixed(2)} />
//                     <YAxis type="category" dataKey="variable_name" tick={{fill:C.textMid,fontSize:12,fontWeight:600}} width={100} />
//                     <Tooltip formatter={v=>[v.toFixed(3),"PSI"]} />
//                     <ReferenceLine x={0.10} stroke={C.green} strokeDasharray="3 3" />
//                     <ReferenceLine x={0.25} stroke={C.red}   strokeDasharray="3 3" />
//                     <Bar dataKey="psi" name="PSI" fill={C.navy} radius={[0,3,3,0]}>
//                       {variableRowsForQuarter.map((v,i) => {
//                         const st = rateStatus(THRESHOLD_RULES[3], v.psi);
//                         return <rect key={i} fill={STATUS_COLOR[st]||C.navy} />;
//                       })}
//                     </Bar>
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//               <div style={{ fontSize:11, color:C.textSoft, marginTop:8 }}>
//                 Green line: 0.10 (Amber threshold) &nbsp;|&nbsp; Red line: 0.25 (Red threshold)
//               </div>
//             </Card>
//           </div>
//         </div>

//         {/* ═══════════════════════════════════════════════════════════════
//             SECTION 9 — AGENT REASONING TRAIL
//         ════════════════════════════════════════════════════════════════ */}
//         <div style={SEC}>
//           <SectionLabel>Section 9 — Agent Reasoning Trail</SectionLabel>
//           <div style={{ marginBottom:4, fontSize:12, color:C.textSoft }}>Collapsible audit trail — each agent's one-line conclusion and expandable detailed reasoning.</div>
//           {[
//             { key:"evaluation",    title:"Model Evaluation Agent",    icon:null, summary:agentOutputs?.evaluation?.summary,    status:agentOutputs?.evaluation?.status },
//             { key:"monitoring",    title:"Monitoring Agent",          icon:null, summary:agentOutputs?.monitoring?.qoqNarrative, status:agentOutputs?.monitoring?.status },
//             { key:"root_cause",    title:"Root Cause Agent",          icon:null, summary:agentOutputs?.monitoring?.hotspotNarrative, status:agentOutputs?.monitoring?.status },
//             { key:"recommendation",title:"Recommendation Agent",      icon:null, summary:agentOutputs?.recommendation?.actions?.[0]?.text, status:agentOutputs?.recommendation?.status },
//             { key:"executive",     title:"Executive Summary Agent",   icon:null, summary:agentOutputs?.executive?.narrative,  status:agentOutputs?.executive?.status },
//           ].map(agent => (
//             <Collapsible key={agent.key} title={agent.title} badge={agent.status} defaultOpen={false}>
//               {agent.key==="evaluation" && agentOutputs?.evaluation && (
//                 <div>
//                   <p style={{ margin:"0 0 12px 0", fontSize:13, color:C.textMid, lineHeight:1.6 }}>{agentOutputs.evaluation.summary}</p>
//                   <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
//                     <div style={{ background:C.greenBg, border:`1px solid ${C.greenBorder}`, borderRadius:4, padding:"12px 14px" }}>
//                       <div style={{ fontSize:11, fontWeight:700, color:C.green, textTransform:"uppercase", marginBottom:8 }}>Strengths</div>
//                       <ul style={{ margin:0, paddingLeft:16, fontSize:13, color:C.textMid, lineHeight:1.6 }}>
//                         {agentOutputs.evaluation.strengths.map((s,i)=><li key={i}>{s}</li>)}
//                       </ul>
//                     </div>
//                     <div style={{ background:C.redBg, border:`1px solid ${C.redBorder}`, borderRadius:4, padding:"12px 14px" }}>
//                       <div style={{ fontSize:11, fontWeight:700, color:C.red, textTransform:"uppercase", marginBottom:8 }}>Weaknesses</div>
//                       <ul style={{ margin:0, paddingLeft:16, fontSize:13, color:C.textMid, lineHeight:1.6 }}>
//                         {agentOutputs.evaluation.weaknesses.map((w,i)=><li key={i}>{w}</li>)}
//                       </ul>
//                     </div>
//                   </div>
//                   <div style={{ background:"#F8FAFC", border:`1px solid ${C.border}`, borderRadius:4, padding:"10px 14px", fontSize:13, color:C.textMid, lineHeight:1.6 }}>
//                     <b>Gini/AUC Interpretation:</b> {agentOutputs.evaluation.interpretation}
//                   </div>
//                 </div>
//               )}
//               {agent.key==="monitoring" && agentOutputs?.monitoring && (
//                 <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
//                   <p style={{ margin:0, fontSize:13, color:C.textMid, lineHeight:1.6 }}><b>QoQ Change:</b> {agentOutputs.monitoring.qoqNarrative}</p>
//                   <p style={{ margin:0, fontSize:13, color:C.textMid, lineHeight:1.6 }}><b>Variable Drift:</b> {agentOutputs.monitoring.driftNarrative}</p>
//                   {agentOutputs.monitoring.alerts.map((a,i)=>(
//                     <div key={i} style={{ display:"flex", gap:8, alignItems:"baseline", background:STATUS_BG[a.severity], border:`1px solid ${STATUS_BORDER[a.severity]}`, borderRadius:4, padding:"8px 12px" }}>
//                       <Badge status={a.severity} small>{a.severity}</Badge>
//                       <span style={{ fontSize:13, color:C.textMid }}>{a.text}</span>
//                     </div>
//                   ))}
//                 </div>
//               )}
//               {agent.key==="root_cause" && agentOutputs?.monitoring && (
//                 <div style={{ fontSize:13, color:C.textMid, lineHeight:1.6 }}>
//                   <p style={{margin:"0 0 8px 0"}}><b>Hotspot Analysis:</b> {agentOutputs.monitoring.hotspotNarrative}</p>
//                   <p style={{margin:0}}><b>Drift Context:</b> {agentOutputs.monitoring.driftNarrative}</p>
//                 </div>
//               )}
//               {agent.key==="recommendation" && agentOutputs?.recommendation && (
//                 <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
//                   {agentOutputs.recommendation.actions.map((a,i)=>(
//                     <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", background:"#F8FAFC", border:`1px solid ${C.borderLight}`, borderRadius:4, padding:"10px 14px" }}>
//                       <span style={{ fontSize:13, fontWeight:700, color:C.slateLight, minWidth:20 }}>{i+1}.</span>
//                       <div>
//                         <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}>
//                           <Badge status={a.status} small>{a.status}</Badge>
//                           <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{a.metric}</span>
//                         </div>
//                         <p style={{ margin:"0 0 3px 0", fontSize:13, color:C.textMid, lineHeight:1.5 }}>{a.text}</p>
//                         <p style={{ margin:0, fontSize:11, color:C.slateLight, fontStyle:"italic" }}>{a.detail}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//               {agent.key==="executive" && agentOutputs?.executive && (
//                 <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
//                   <p style={{ margin:0, fontSize:13, color:C.textMid, lineHeight:1.6 }}>{agentOutputs.executive.narrative}</p>
//                   <p style={{ margin:0, fontSize:13, color:C.textMid, lineHeight:1.6 }}>{agentOutputs.executive.portfolioHealth}</p>
//                   <div style={{ background:C.blueBg, border:`1px solid ${C.blueBorder}`, borderRadius:4, padding:"10px 14px", fontSize:13, color:C.blue, fontWeight:500 }}>
//                     Risk Outlook: {agentOutputs.executive.riskOutlook}
//                   </div>
//                 </div>
//               )}
//             </Collapsible>
//           ))}
//         </div>

//         {/* ═══════════════════════════════════════════════════════════════
//             SECTION 10 — GOVERNANCE ACTION PANEL
//         ════════════════════════════════════════════════════════════════ */}
//         <div style={SEC}>
//           <SectionLabel>Section 10 — Governance Action Panel</SectionLabel>
//           <Card style={{ borderLeft:`4px solid ${STATUS_COLOR[rowQRow?.alert_status]||C.navy}` }}>
//             <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:24, alignItems:"start" }}>
//               <div style={{ textAlign:"center", padding:"8px 24px", borderRight:`1px solid ${C.borderLight}` }}>
//                 <MetricLabel>Current Recommendation</MetricLabel>
//                 <div style={{ fontSize:17, fontWeight:700, color:STATUS_COLOR[rowQRow?.alert_status]||C.navy, marginTop:8, maxWidth:180 }}>
//                   {agentOutputs?.recommendation?.governance || "Continue Monitoring"}
//                 </div>
//                 <div style={{ marginTop:10 }}>
//                   <Badge status={rowQRow?.alert_status||"Green"}>{rowQRow?.alert_status||"Green"}</Badge>
//                 </div>
//               </div>
//               <div>
//                 <div style={{ marginBottom:14 }}>
//                   <div style={{ fontSize:11, fontWeight:700, color:C.textSoft, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Rationale</div>
//                   <p style={{ margin:0, fontSize:14, color:C.textMid, lineHeight:1.65 }}>{agentOutputs?.executive?.riskOutlook}</p>
//                 </div>
//                 <Divider style={{ margin:"12px 0" }} />
//                 <div>
//                   <div style={{ fontSize:11, fontWeight:700, color:C.textSoft, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Priority Actions</div>
//                   <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
//                     {(agentOutputs?.recommendation?.actions||[]).filter(a=>a.priority<=2).slice(0,4).map((a,i)=>(
//                       <div key={i} style={{ display:"flex", gap:10, alignItems:"baseline", fontSize:13, color:C.textMid }}>
//                         <Badge status={a.status} small>{a.status}</Badge>
//                         <span><b>{a.metric}</b> — {a.text}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </Card>
//         </div>

//         {/* ═══════════════════════════════════════════════════════════════
//             SECTION 10B — SR 11-7 REPORT OUTPUT
//         ════════════════════════════════════════════════════════════════ */}
//         {aiReport && (
//           <div style={SEC}>
//             <SectionLabel>SR 11-7 Compliance Report — {selectedQuarter}</SectionLabel>
//             <Card>
//               {reportSource==="local" && (
//                 <div style={{ marginBottom:14, background:C.blueBg, border:`1px solid ${C.blueBorder}`, borderRadius:4, padding:"8px 12px", fontSize:12, color:C.blue, fontWeight:600 }}>
//                   Generated by frontend agent simulation (backend endpoint unavailable).
//                 </div>
//               )}
//               <div style={{ fontSize:14, color:C.textMid, lineHeight:1.7 }}>
//                 <ReactMarkdown>{aiReport}</ReactMarkdown>
//               </div>
//               <div style={{ marginTop:20, borderTop:`1px solid ${C.borderLight}`, paddingTop:14, display:"flex", justifyContent:"flex-end" }}>
//                 <button onClick={handleDownloadReport}
//                   style={{ fontSize:13, fontWeight:700, color:"#FFF", background:C.navy, border:"none", padding:"8px 18px", borderRadius:4, cursor:"pointer" }}>
//                   Download Report (.md)
//                 </button>
//               </div>
//             </Card>
//           </div>
//         )}

//         {/* ═══════════════════════════════════════════════════════════════
//             SECTION 11 — THRESHOLD RULEBOOK (collapsed)
//         ════════════════════════════════════════════════════════════════ */}
//         <div style={SEC}>
//           <Collapsible title="Section 11 — Governance Threshold Rulebook" defaultOpen={false}>
//             <div style={{ fontSize:12, color:C.textSoft, marginBottom:12 }}>Reference only. The rules below are used by the Recommendation Agent to classify severity and determine governance actions.</div>
//             <table style={{ width:"100%", borderCollapse:"collapse" }}>
//               <thead>
//                 <tr>
//                   {["Metric","Scope","Green","Amber","Red","Action Guidance"].map(h=><th key={h} style={TH}>{h}</th>)}
//                 </tr>
//               </thead>
//               <tbody>
//                 {THRESHOLD_RULES.map((r,i)=>(
//                   <tr key={i} style={{ borderBottom:`1px solid ${C.borderLight}` }}>
//                     <td style={{...TD, fontWeight:700}}>{r.label}</td>
//                     <td style={{...TD, textTransform:"capitalize", color:C.textSoft}}>{r.scope}</td>
//                     <td style={{...TD, color:C.green, fontWeight:600}}>{r.green_rule}</td>
//                     <td style={{...TD, color:C.amber, fontWeight:600}}>{r.amber_rule}</td>
//                     <td style={{...TD, color:C.red,   fontWeight:600}}>{r.red_rule}</td>
//                     <td style={{...TD, color:C.textSoft}}>{r.action_guidance}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </Collapsible>
//         </div>

//         {/* ═══════════════════════════════════════════════════════════════
//             HISTORICAL PERFORMANCE MATRIX (Champion vs Challenger)
//         ════════════════════════════════════════════════════════════════ */}
//         <div style={SEC}>
//           <SectionLabel>Historical Performance Matrix — Champion vs Challenger</SectionLabel>
//           <Card noPad>
//             <div style={{ overflowX:"auto" }}>
//               <table style={{ width:"100%", borderCollapse:"collapse" }}>
//                 <thead>
//                   <tr>
//                     {["Quarter","Accounts","Gini","AUC","KS","PSI","Cal. Gap","Actual DR","Pred PD","Status"].map(h=><th key={h} style={TH}>{h}</th>)}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {history.map(h => {
//                     const isBestGini = h.gini===Math.max(...history.map(x=>x.gini));
//                     const isBestAuc  = h.auc ===Math.max(...history.map(x=>x.auc));
//                     const isBestKs   = h.ks  ===Math.max(...history.map(x=>x.ks));
//                     const isBestDr   = h.actual_default_rate===Math.min(...history.map(x=>x.actual_default_rate));
//                     const isSelected = h.quarter===selectedQuarter;
//                     const highlight = v => isBestGini&&v==="gini"||isBestAuc&&v==="auc"||isBestKs&&v==="ks"||isBestDr&&v==="dr";
//                     return (
//                       <tr key={h.quarter} onClick={()=>setSelectedQuarter(h.quarter)}
//                         style={{ borderBottom:`1px solid ${C.borderLight}`, cursor:"pointer", background:isSelected?"#EFF6FF":"transparent" }}>
//                         <td style={{...TD, fontWeight:700, color:isSelected?C.blue:C.text}}>
//                           {h.quarter}{isSelected&&<span style={{ marginLeft:6, fontSize:10, color:C.blue, fontWeight:700 }}>● selected</span>}
//                         </td>
//                         <td style={TD}>{h.total_accounts.toLocaleString()}</td>
//                         <td style={TD}>
//                           {isBestGini
//                             ? <span style={{ background:C.greenBg, color:C.green, padding:"2px 8px", borderRadius:3, fontWeight:700 }}>{h.gini.toFixed(3)}</span>
//                             : <span style={{ color:rateStatus(THRESHOLD_RULES[0],h.gini)==="Red"?C.red:C.textMid, fontWeight:500 }}>{h.gini.toFixed(3)}</span>}
//                         </td>
//                         <td style={TD}>
//                           {isBestAuc
//                             ? <span style={{ background:C.greenBg, color:C.green, padding:"2px 8px", borderRadius:3, fontWeight:700 }}>{h.auc.toFixed(3)}</span>
//                             : <span style={{ color:C.textMid }}>{h.auc.toFixed(3)}</span>}
//                         </td>
//                         <td style={TD}>
//                           {isBestKs
//                             ? <span style={{ background:C.greenBg, color:C.green, padding:"2px 8px", borderRadius:3, fontWeight:700 }}>{h.ks.toFixed(1)}%</span>
//                             : <span style={{ color:rateStatus(THRESHOLD_RULES[1],h.ks)==="Red"?C.red:C.textMid }}>{h.ks.toFixed(1)}%</span>}
//                         </td>
//                         <td style={{...TD, color:rateStatus(THRESHOLD_RULES[2],h.psi_population)==="Red"?C.red:C.textMid, fontWeight:rateStatus(THRESHOLD_RULES[2],h.psi_population)==="Red"?700:400}}>
//                           {h.psi_population.toFixed(2)}
//                         </td>
//                         <td style={{...TD, color:rateStatus(THRESHOLD_RULES[4],h.calibration_gap)==="Red"?C.red:C.textMid, fontWeight:rateStatus(THRESHOLD_RULES[4],h.calibration_gap)==="Red"?700:400}}>
//                           {h.calibration_gap.toFixed(3)}
//                         </td>
//                         <td style={TD}>
//                           {isBestDr
//                             ? <span style={{ background:C.greenBg, color:C.green, padding:"2px 8px", borderRadius:3, fontWeight:700 }}>{pctStr(h.actual_default_rate)}</span>
//                             : <span style={{ color:C.textMid }}>{pctStr(h.actual_default_rate)}</span>}
//                         </td>
//                         <td style={TD}>{pctStr(h.avg_pred_pd)}</td>
//                         <td style={TD}><Badge status={h.alert_status} small>{h.alert_status}</Badge></td>
//                       </tr>
//                     );
//                   })}
//                   {/* Sparklines row */}
//                   <tr style={{ background:"#F8FAFC" }}>
//                     <td style={{...TD, fontSize:11, fontWeight:700, color:C.textSoft, textTransform:"uppercase" }}>Trend</td>
//                     <td style={{...TD, height:50}}><Sparkline data={history} dataKey="total_accounts" color={C.slate} /></td>
//                     <td style={{...TD, height:50}}><Sparkline data={history} dataKey="gini" color={C.blue} /></td>
//                     <td style={{...TD, height:50}}><Sparkline data={history} dataKey="auc" color="#7C3AED" /></td>
//                     <td style={{...TD, height:50}}><Sparkline data={history} dataKey="ks" color="#0891B2" /></td>
//                     <td style={{...TD, height:50}}><Sparkline data={history} dataKey="psi_population" color={C.amber} /></td>
//                     <td style={{...TD, height:50}}><Sparkline data={history} dataKey="calibration_gap" color={C.red} /></td>
//                     <td style={{...TD, height:50}}><Sparkline data={history} dataKey="actual_default_rate" color={C.red} /></td>
//                     <td style={{...TD, height:50}}><Sparkline data={history} dataKey="avg_pred_pd" color={C.slate} /></td>
//                     <td style={TD} />
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         </div>

//       </div>{/* end page wrapper */}

//       {/* ═══════════════════════════════════════════════════════════════════
//           FLOATING CHAT COPILOT
//       ════════════════════════════════════════════════════════════════════ */}
//       <button onClick={()=>setIsChatOpen(o=>!o)} style={{
//         position:"fixed", bottom:28, right:isChatOpen?428:28,
//         width:52, height:52, borderRadius:"50%",
//         background:C.navy, color:"#FFF", fontSize:20, border:`2px solid ${C.navyLight}`,
//         boxShadow:"0 4px 14px rgba(0,0,0,0.25)", cursor:"pointer", zIndex:1000,
//         display:"flex", alignItems:"center", justifyContent:"center",
//         transition:"right 0.25s ease",
//       }}>
//         {isChatOpen ? "✕" : "?"}
//       </button>

//       <div style={{
//         position:"fixed", top:0, right:isChatOpen?0:-420,
//         width:400, height:"100vh", background:C.surface,
//         boxShadow:"-4px 0 20px rgba(0,0,0,0.10)", zIndex:999,
//         transition:"right 0.25s ease", display:"flex", flexDirection:"column",
//         borderLeft:`1px solid ${C.borderLight}`,
//       }}>
//         <div style={{ padding:"16px 20px", background:C.navy, borderBottom:`1px solid ${C.navyMid}` }}>
//           <div style={{ fontSize:14, fontWeight:700, color:"#FFF" }}>SR 11-7 Risk Co-Pilot</div>
//           <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>Monitoring context: {selectedQuarter}</div>
//         </div>
//         <div style={{ flex:1, padding:"16px", overflowY:"auto", display:"flex", flexDirection:"column", gap:10, background:"#F8FAFC" }}>
//           {chatMessages.map((msg,i)=>(
//             <div key={i} style={{
//               alignSelf: msg.role==="user"?"flex-end":"flex-start",
//               background: msg.role==="user" ? C.navy : C.surface,
//               color: msg.role==="user" ? "#FFF" : C.textMid,
//               padding:"10px 14px", borderRadius:6,
//               border: msg.role==="user" ? "none" : `1px solid ${C.borderLight}`,
//               maxWidth:"85%", fontSize:13, lineHeight:1.55,
//             }}>
//               {msg.role==="user" ? msg.content : <div className="markdown-body" style={{fontSize:13}}><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
//             </div>
//           ))}
//           {isChatLoading && <div style={{ alignSelf:"flex-start", background:C.surface, padding:"10px 14px", borderRadius:6, border:`1px solid ${C.borderLight}`, fontSize:13, color:C.textSoft }}>Processing...</div>}
//           <div ref={chatEndRef} />
//         </div>
//         <div style={{ padding:"14px 16px", background:C.surface, borderTop:`1px solid ${C.borderLight}` }}>
//           <div style={{ display:"flex", gap:8 }}>
//             <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)}
//               onKeyDown={e=>e.key==="Enter"&&handleSendChatMessage()}
//               placeholder="Ask about drift, segments, recommendations..."
//               style={{ flex:1, padding:"8px 12px", borderRadius:4, border:`1px solid ${C.border}`, fontSize:13, outline:"none", background:"#F8FAFC" }} />
//             <button onClick={handleSendChatMessage} disabled={isChatLoading||!chatInput.trim()}
//               style={{ padding:"0 16px", background:C.navy, color:"#FFF", border:"none", borderRadius:4, cursor:"pointer", fontWeight:700, fontSize:13 }}>
//               Send
//             </button>
//           </div>
//         </div>
//       </div>

//     </div>
//   );
// }