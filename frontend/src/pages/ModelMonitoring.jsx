// import { useState, useEffect, useRef } from 'react'
// import ReactMarkdown from 'react-markdown'
// import { API_BASE_URL } from '../config';
// import { sendChatMessage } from '../services/api';
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

//   // ── CHATBOT STATE (DEDICATED MRM VALIDATOR) ──
//   const [isChatOpen, setIsChatOpen] = useState(false)
//   const [chatInput, setChatInput] = useState('')
//   const [isChatLoading, setIsChatLoading] = useState(false)
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

//   // ── CHATBOT HANDLERS ──
//   const getQuickPrompts = () => {
//     return [
//       `Why did the Gini drop to ${latestQ.gini.toFixed(3)} in ${selectedQuarter}?`, 
//       "Does the current PSI breach regulatory limits?",
//       "Summarize the Calibration Gap trend."
//     ];
//   }

//   const processChat = async (messageText) => {
//     const userMessage = { role: 'user', content: messageText };
//     const newHistory = [...chatMessages, userMessage];
//     setChatMessages(newHistory); 
//     setChatInput(''); 
//     setIsChatLoading(true);
    
//     try {
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

//       const response = await fetch(`${API_BASE_URL}/chat-monitoring`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           messages: cleanHistory,
//           context_summary: richContext,
//           persona: 'MRM Validator' // Strictly fixed persona
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

//       {/* ── HISTORICAL MATRIX ── */}
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

//         {/* Removed Persona Toggle Buttons from here */}

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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

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

  const handleDownloadDetailedReport = async () => {
    setIsDownloadingPdf(true);
    try {
      const res = await fetch(`${API_BASE_URL}/export-monitoring-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: history })
      });
      
      if (!res.ok) throw new Error("Failed to generate PDF");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Detailed_SR117_Audit_${selectedQuarter}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert("⚠️ Failed to download detailed PDF. Check backend terminal.");
    } finally {
      setIsDownloadingPdf(false);
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
            <div style={{ padding: '20px 24px', background: '#225ad4', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 Model Validation Report
              </h3>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {/* ── THE NEW DOWNLOAD BUTTON ── */}
                {reportData.content && !reportData.loading && (
                  <button 
                    onClick={handleDownloadDetailedReport}
                    disabled={isDownloadingPdf}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', color: '#000000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: isDownloadingPdf ? 0.7 : 1, transition: 'all 0.2s' }}
                  >
                    {isDownloadingPdf ? 'Generating Deep-Dive PDF...' : ' Download Detailed Report'}
                  </button>
                )}
                
                <button onClick={() => setIsReportOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '28px', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
              </div>
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
        
        {/* Gini Trend */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Gini Coefficient — Trend</h3>
            <button onClick={() => handleGetInsight('Gini Trend', history)} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {insights['Gini Trend']?.loading ? 'Analyzing...' : '✨ Generate Insight'}
            </button>
          </div>
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
          {insights['Gini Trend']?.text && (
             <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderLeft: '3px solid #3b82f6', fontSize: '13px', color: '#334155' }}>
               {insights['Gini Trend'].text}
             </div>
          )}
        </div>

        {/* AUC Trend */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>AUC — Trend</h3>
            <button onClick={() => handleGetInsight('AUC Trend', history)} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {insights['AUC Trend']?.loading ? 'Analyzing...' : '✨ Generate Insight'}
            </button>
          </div>
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
          {insights['AUC Trend']?.text && (
             <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderLeft: '3px solid #3b82f6', fontSize: '13px', color: '#334155' }}>
               {insights['AUC Trend'].text}
             </div>
          )}
        </div>

        {/* KS Statistic Trend */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>KS Statistic — Trend</h3>
            <button onClick={() => handleGetInsight('KS Trend', history)} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {insights['KS Trend']?.loading ? 'Analyzing...' : '✨ Generate Insight'}
            </button>
          </div>
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
          {insights['KS Trend']?.text && (
             <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderLeft: '3px solid #3b82f6', fontSize: '13px', color: '#334155' }}>
               {insights['KS Trend'].text}
             </div>
          )}
        </div>

        {/* PSI Trend */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Population Stability Index — Trend</h3>
            <button onClick={() => handleGetInsight('PSI Trend', history)} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {insights['PSI Trend']?.loading ? 'Analyzing...' : '✨ Generate Insight'}
            </button>
          </div>
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
          {insights['PSI Trend']?.text && (
             <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderLeft: '3px solid #3b82f6', fontSize: '13px', color: '#334155' }}>
               {insights['PSI Trend'].text}
             </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px', marginBottom: '48px' }}>
        
        {/* PD vs Default Rate */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Predicted PD vs Actual Default Rate</h3>
            <button onClick={() => handleGetInsight('PD vs Default Rate', history)} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {insights['PD vs Default Rate']?.loading ? 'Analyzing...' : '✨ Generate Insight'}
            </button>
          </div>
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
          {insights['PD vs Default Rate']?.text && (
             <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderLeft: '3px solid #3b82f6', fontSize: '13px', color: '#334155' }}>
               {insights['PD vs Default Rate'].text}
             </div>
          )}
        </div> 

        {/* Calibration Gap Trend */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Calibration Gap — Trend</h3>
            <button onClick={() => handleGetInsight('Calibration Gap Trend', history)} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {insights['Calibration Gap Trend']?.loading ? 'Analyzing...' : '✨ Generate Insight'}
            </button>
          </div>
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
          {insights['Calibration Gap Trend']?.text && (
             <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderLeft: '3px solid #3b82f6', fontSize: '13px', color: '#334155' }}>
               {insights['Calibration Gap Trend'].text}
             </div>
          )}
        </div>
      </div>

      {/* ── SECTION 6 PERFORMANCE DIAGNOSTICS ── */}
      <h3 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderLeft: '3px solid #0f172a', paddingLeft: '8px' }}>
        Model Quarterly Performance — {selectedQuarter}
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

        {/* ROC Curve */}
        <div style={{...cardStyle, marginBottom: 0}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>ROC Curve — AUC {latestQ.auc.toFixed(3)}</h3>
            <button onClick={() => handleGetInsight('ROC Curve', rocData)} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {insights['ROC Curve']?.loading ? 'Analyzing...' : '✨ Generate Insight'}
            </button>
          </div>
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
          {insights['ROC Curve']?.text && (
             <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderLeft: '3px solid #3b82f6', fontSize: '13px', color: '#334155' }}>
               {insights['ROC Curve'].text}
             </div>
          )}
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
      <h3 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderLeft: '3px solid #0f172a', paddingLeft: '8px' }}>
        Regulatory Calibration & Score Banding
      </h3>

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

        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {chatMessages.map((msg, idx) => {
            const parts = msg.content.split('|||');
            const mainContent = parts[0];
            
            const downloadPart = parts.find(p => p.includes("DOWNLOAD_FILE:"));
            const fileId = downloadPart ? downloadPart.replace("DOWNLOAD_FILE:", "").trim() : null;

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