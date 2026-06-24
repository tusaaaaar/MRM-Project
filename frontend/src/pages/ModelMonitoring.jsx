// import { useState, useEffect, useRef } from 'react'
// import ReactMarkdown from 'react-markdown'
// import {
//   CartesianGrid, Line, LineChart, ResponsiveContainer,
//   Tooltip, XAxis, YAxis, Legend, Area, AreaChart,
//   Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
//   ReferenceArea, ComposedChart, Bar, BarChart, Cell
// } from 'recharts'

// import PDDecileValidationChart from '../components/PDDecileValidationChart'
// import RocChart from '../components/RocChart'
// import RiskDistributionChart from '../components/RiskDistributionChart'
// import RiskGauge from '../components/RiskGauge'

// function formatPercent(value) {
//   if (value == null || Number.isNaN(Number(value))) return '—'
//   return `${Number(value).toFixed(2)}%`
// }

// function EmptyState({ icon, message }) {
//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 16px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1', gap: '16px', marginTop: '24px' }}>
//       <span style={{ fontSize: '48px', opacity: 0.5 }}>{icon}</span>
//       <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{message}</p>
//     </div>
//   )
// }

// const QUARTER_COLORS = ['#94a3b8', '#8b5cf6', '#f59e0b', '#ef4444', '#2563eb', '#10b981', '#ec4899', '#0ea5e9']

// function getQuarterColor(index, total) {
//   if (index === total - 1) return '#2563eb'
//   if (index === 0) return '#94a3b8'
//   return QUARTER_COLORS[index % QUARTER_COLORS.length]
// }

// export default function ModelMonitoring({ analysisResult, setAnalysisResult }) {
//   const [history, setHistory] = useState([])
//   const [isUploading, setIsUploading] = useState(false)
//   const fileInputRef = useRef(null)

//   const [aiReport, setAiReport] = useState('')
//   const [isAiLoading, setIsAiLoading] = useState(false)

//   useEffect(() => {
//     if (analysisResult?.history) {
//       setHistory(analysisResult.history)
//     } else {
//       fetch('http://192.168.1.6:8000/monitoring-history')
//         .then(res => res.json())
//         .then(data => { if (data.history) setHistory(data.history) })
//         .catch(err => console.error("Failed to fetch history", err))
//     }
//   }, [analysisResult])

//   const currentQNum = history.length > 0 ? history.length : 0
//   const nextQuarterLabel = `Q${currentQNum + 1}`

//   const handleInitialUpload = async (e) => {
//     const file = e.target.files?.[0]
//     if (!file) return
//     setIsUploading(true)
//     const formData = new FormData()
//     formData.append('file', file)
//     formData.append('prediction_threshold', 0.5)
//     formData.append('good_threshold', 0.3)
//     formData.append('bad_threshold', 0.7)

//     try {
//       const res = await fetch('http://192.168.1.6:8000/upload', { method: 'POST', body: formData })
//       const data = await res.json()
//       if (setAnalysisResult) setAnalysisResult(data)
//     } catch (err) {
//       alert('Upload failed. Ensure backend is running.')
//     } finally {
//       setIsUploading(false)
//       if (fileInputRef.current) fileInputRef.current.value = ''
//     }
//   }

//   const handleUploadNextQuarter = async (e) => {
//     const file = e.target.files?.[0]
//     if (!file) return
//     setIsUploading(true)
//     const formData = new FormData()
//     formData.append('file', file)
//     formData.append('quarter_label', nextQuarterLabel)

//     try {
//       const res = await fetch('http://192.168.1.6:8000/upload-quarter', { method: 'POST', body: formData })
//       const data = await res.json()
//       if (setAnalysisResult) setAnalysisResult(data)
//     } catch (err) {
//       alert('Upload failed.')
//     } finally {
//       setIsUploading(false)
//       if (fileInputRef.current) fileInputRef.current.value = ''
//     }
//   }

//   const handleClearHistory = async () => {
//     await fetch('http://192.168.1.6:8000/clear-history', { method: 'DELETE' })
//     if (setAnalysisResult) setAnalysisResult(null)
//     setHistory([])
//     setAiReport('')
//   }

//   // --- NEW: CLEAN AGENT ARCHITECTURE ---
//   const handleRunAiValidator = async () => {
//     setIsAiLoading(true)
//     try {
//       const res = await fetch('http://192.168.1.6:8000/agents/monitoring', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ history: history }) // Just pass the raw JSON data
//       })
//       const data = await res.json()
//       setAiReport(data.report_markdown)
//     } catch (err) {
//       setAiReport('Failed to execute Monitoring Agent.')
//     } finally {
//       setIsAiLoading(false)
//     }
//   }

//   if (!analysisResult) {
//     return (
//       <main className="dashboard-main analytics-page">
//         <section className="card analytics-header-card">
//           <div className="card-header analytics-header">
//             <div>
//               <h2 style={{ fontSize: '24px', color: '#0f172a' }}>Enterprise Model Validation Command Center</h2>
//               <p style={{ color: '#64748b' }}>Establish a Q1 Baseline to begin model risk monitoring.</p>
//             </div>
//             <div>
//               <input type="file" ref={fileInputRef} onChange={handleInitialUpload} style={{ display: 'none' }} accept=".csv,.xlsx" />
//               <button 
//                 onClick={() => fileInputRef.current?.click()} 
//                 disabled={isUploading} 
//                 style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
//                 {isUploading ? 'Establishing Baseline...' : 'Upload Q1 Baseline Data'}
//               </button>
//             </div>
//           </div>
//         </section>
//         <EmptyState icon="📈" message="Awaiting Q1 Data Upload" />
//       </main>
//     )
//   }

//   // --- Calculations ---
//   const metrics = analysisResult.metrics || {}
//   const scoreBandData = analysisResult.score_band_analysis || []
//   const pdDecileData = analysisResult.pd_decile_analysis || []
//   const cm = analysisResult.confusion_matrix || { tn: 0, fp: 0, fn: 0, tp: 0 }
//   const pdValues = analysisResult.pd_values || []

//   const latestQ = history[history.length - 1]
//   const prevQ = history.length > 1 ? history[history.length - 2] : null
//   const getTrend = (current, previous) => {
//     if (!prevQ || current == null || previous == null) return null
//     const diff = current - previous
//     return { value: diff, isPositive: diff > 0 }
//   }

//   const velocityData = history.map((h, index) => {
//     if (index === 0) return { quarter: h.quarter, change: 0 };
//     return { quarter: h.quarter, change: (h.gini - history[index - 1].gini) };
//   });

//   const radarSubjects = [
//     { key: 'auc', subject: 'AUC' },
//     { key: 'gini', subject: 'Gini' },
//     { key: 'accuracy', subject: 'Accuracy' },
//     { key: 'precision', subject: 'Precision' },
//     { key: 'recall', subject: 'Recall' },
//   ]

//   const multiQuarterRadarData = radarSubjects.map(({ key, subject }) => {
//     const row = { subject, fullMark: 1 }
//     history.forEach((h, index) => {
//       const isLatest = index === history.length - 1
//       let value
//       if (isLatest && metrics[key] != null) {
//         value = metrics[key]
//       } else if (h[key] != null) {
//         value = h[key]
//       } else {
//         value = null
//       }
//       row[h.quarter] = value
//     })
//     return row
//   })

//   const calibrationData = pdDecileData.map((d) => ({
//     decile: d.decile,
//     predicted_pd: d.average_pd * 100,
//     actual_pd: d.actual_bad_rate,
//     perfect_calibration: d.average_pd * 100
//   }))

//   let cumDefaults = 0;
//   const totalDefaults = pdDecileData.reduce((sum, d) => sum + ((d.actual_bad_rate / 100) * d.customer_count), 0);
//   const gainsData = pdDecileData.map((d, index) => {
//     const decileDefaults = (d.actual_bad_rate / 100) * d.customer_count;
//     cumDefaults += decileDefaults;
//     return {
//       decile: d.decile,
//       pct_portfolio: (index + 1) * 10,
//       model_capture: totalDefaults ? (cumDefaults / totalDefaults) * 100 : 0,
//       random_capture: (index + 1) * 10
//     }
//   })

//   const driftData = scoreBandData.map((d, index) => {
//     const shiftedIndex = Math.min(index + 1, scoreBandData.length - 1);
//     const mockBaselineVolume = scoreBandData[shiftedIndex].customer_count * (1 + (Math.random() * 0.1)); 
//     return {
//       score_band: d.score_band,
//       current_volume: d.customer_count,
//       baseline_volume: currentQNum > 1 ? mockBaselineVolume : d.customer_count
//     }
//   })

//   const cmTotal = cm.tn + cm.fp + cm.fn + cm.tp || 1;
//   const fpRate = cm.fp / Math.max(cm.tn + cm.fp, 1)
//   const fnRate = cm.fn / Math.max(cm.fn + cm.tp, 1)
//   const tnRate = cm.tn / Math.max(cm.tn + cm.fp, 1)
//   const tpRate = cm.tp / Math.max(cm.fn + cm.tp, 1)

//   const cellBackground = (count, isError) => {
//     const intensity = Math.max(0.12, Math.min(0.9, count / cmTotal + 0.12))
//     return isError ? `rgba(239, 68, 68, ${intensity})` : `rgba(16, 185, 129, ${intensity})`
//   }

//   return (
//     <main className="dashboard-main analytics-page">
      
//       {/* ── TOP NAV BAR ── */}
//       <section className="card" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px' }}>
//         <div>
//           <h2 style={{ fontSize: '24px', color: '#0f172a', margin: '0 0 8px 0' }}>Enterprise Model Validation Command Center</h2>
//           <p style={{ color: '#64748b', margin: 0 }}>Monitor multi-quarter model degradation and deep-dive into the latest metrics.</p>
//         </div>
//         <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
//           <div style={{ background: '#f1f5f9', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, color: '#475569', border: '1px solid #cbd5e1' }}>
//             Current View: {latestQ?.quarter || 'Q1'}
//           </div>
//           <input type="file" ref={fileInputRef} onChange={handleUploadNextQuarter} style={{ display: 'none' }} accept=".csv,.xlsx" />
//           <button 
//             onClick={() => fileInputRef.current?.click()} 
//             disabled={isUploading} 
//             style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
//             {isUploading ? 'Processing...' : `+ Upload ${nextQuarterLabel} Data`}
//           </button>
//           <button onClick={handleClearHistory} style={{ background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
//             Reset App
//           </button>
//         </div>
//       </section>

//       {/* ── SECTION 1: MACRO VIEW (TRENDS) ── */}
//       <div style={{ marginBottom: '48px' }}>
//         <h3 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>Macro View: Multi-Quarter Model Drift</h3>
        
//         {/* KPI Row */}
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
//           <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
//             <div>
//               <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Accounts</span>
//               <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{latestQ?.total_accounts?.toLocaleString() || '—'}</div>
//             </div>
//           </div>
//           <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b', position: 'relative', overflow: 'hidden' }}>
//             <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Average PD</span>
//             <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{latestQ ? formatPercent(latestQ.avg_pd * 100) : '—'}</div>
//             {prevQ && (
//               <span style={{ fontSize: '12px', fontWeight: 600, color: getTrend(latestQ.avg_pd, prevQ.avg_pd)?.isPositive ? '#ef4444' : '#10b981' }}>
//                 {getTrend(latestQ.avg_pd, prevQ.avg_pd)?.isPositive ? '↑' : '↓'} {Math.abs(getTrend(latestQ.avg_pd, prevQ.avg_pd).value * 100).toFixed(2)}% vs Prev
//               </span>
//             )}
//             <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60%', height: '40px', opacity: 0.3 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={history}><Area type="monotone" dataKey="avg_pd" stroke="#f59e0b" fill="#fef3c7" /></AreaChart></ResponsiveContainer></div>
//           </div>
//           <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444', position: 'relative', overflow: 'hidden' }}>
//             <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Actual Default Rate</span>
//             <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{latestQ ? formatPercent(latestQ.default_rate * 100) : '—'}</div>
//             {prevQ && (
//               <span style={{ fontSize: '12px', fontWeight: 600, color: getTrend(latestQ.default_rate, prevQ.default_rate)?.isPositive ? '#ef4444' : '#10b981' }}>
//                 {getTrend(latestQ.default_rate, prevQ.default_rate)?.isPositive ? '↑' : '↓'} {Math.abs(getTrend(latestQ.default_rate, prevQ.default_rate).value * 100).toFixed(2)}% vs Prev
//               </span>
//             )}
//             <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60%', height: '40px', opacity: 0.2 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={history}><Area type="monotone" dataKey="default_rate" stroke="#ef4444" fill="#fee2e2" /></AreaChart></ResponsiveContainer></div>
//           </div>
//           <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981', position: 'relative', overflow: 'hidden' }}>
//             <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Gini Coefficient</span>
//             <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{latestQ ? latestQ.gini.toFixed(3) : '—'}</div>
//             {prevQ && (
//               <span style={{ fontSize: '12px', fontWeight: 600, color: getTrend(latestQ.gini, prevQ.gini)?.isPositive ? '#10b981' : '#ef4444' }}>
//                 {getTrend(latestQ.gini, prevQ.gini)?.isPositive ? '↑' : '↓'} {Math.abs(getTrend(latestQ.gini, prevQ.gini).value).toFixed(3)} vs Prev
//               </span>
//             )}
//             <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60%', height: '40px', opacity: 0.3 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={history}><Area type="monotone" dataKey="gini" stroke="#10b981" fill="#d1fae5" /></AreaChart></ResponsiveContainer></div>
//           </div>
//         </div>

//         {/* Large Line Charts */}
//         <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
//           <div className="card" style={{ flex: 1, padding: '24px' }}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Model Degradation (With Regulatory Alert Zones)</h3>
//             <div style={{ height: '250px' }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                   <XAxis dataKey="quarter" />
//                   <YAxis domain={[0, 1]} />
//                   <Tooltip />
//                   <Legend />
//                   <ReferenceArea y1={0.4} y2={1.0} fill="#d1fae5" fillOpacity={0.3} />
//                   <ReferenceArea y1={0.25} y2={0.4} fill="#fef08a" fillOpacity={0.3} />
//                   <ReferenceArea y1={0} y2={0.25} fill="#fee2e2" fillOpacity={0.3} />
//                   <Line type="monotone" dataKey="gini" stroke="#2563eb" strokeWidth={4} name="Gini" />
//                   <Line type="monotone" dataKey="auc" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="AUC" />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </div>

//           <div className="card" style={{ flex: 1, padding: '24px' }}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Macroeconomic Trend (Default Rate vs PD)</h3>
//             <div style={{ height: '250px' }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                   <XAxis dataKey="quarter" />
//                   <YAxis tickFormatter={(tick) => `${(tick * 100).toFixed(0)}%`} />
//                   <Tooltip formatter={(value) => `${(value * 100).toFixed(2)}%`} />
//                   <Legend />
//                   <Line type="monotone" dataKey="default_rate" stroke="#ef4444" strokeWidth={3} name="Actual Default Rate" />
//                   <Line type="monotone" dataKey="avg_pd" stroke="#f59e0b" strokeWidth={3} name="Predicted PD" />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         </div>

//         {/* MACRO CHARTS: Radar Overlay & Velocity */}
//         <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          
//           <div className="card" style={{ flex: 1, padding: '24px' }}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Model Health Radar (Multi-Quarter Overlay)</h3>
//             <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>Watch the polygon contract from {history[0]?.quarter || 'Q1'} (gray) toward {latestQ?.quarter || 'latest'} (blue) as model performance decays.</p>
//             <div style={{ height: '250px' }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <RadarChart cx="50%" cy="50%" outerRadius="70%" data={multiQuarterRadarData}>
//                   <PolarGrid stroke="#e2e8f0" />
//                   <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
//                   <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
//                   {history.map((h, index) => {
//                     const color = getQuarterColor(index, history.length)
//                     const isLatest = index === history.length - 1
//                     return (
//                       <Radar
//                         key={h.quarter}
//                         name={h.quarter}
//                         dataKey={h.quarter}
//                         stroke={color}
//                         fill={color}
//                         fillOpacity={isLatest ? 0.35 : 0.12}
//                         strokeWidth={isLatest ? 3 : 2}
//                         strokeDasharray={isLatest ? undefined : '4 3'}
//                       />
//                     )
//                   })}
//                   <Tooltip formatter={(val) => (val == null ? '—' : Number(val).toFixed(3))} />
//                 </RadarChart>
//               </ResponsiveContainer>
//             </div>
//           </div>

//           <div className="card" style={{ flex: 1, padding: '24px' }}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Degradation Velocity (QoQ Gini Drop)</h3>
//             <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>Shows the exact speed at which the model's accuracy is collapsing.</p>
//             <div style={{ height: '250px' }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={velocityData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                   <XAxis dataKey="quarter" />
//                   <YAxis />
//                   <Tooltip formatter={(value) => value.toFixed(3)} />
//                   <ReferenceArea y1={0} y2={0} stroke="#0f172a" />
//                   <Bar dataKey="change" name="Gini Change">
//                     {velocityData.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={entry.change < 0 ? '#ef4444' : '#10b981'} />
//                     ))}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </div>

//         </div>
//       </div>

//       {/* ── SECTION 2: AI VALIDATOR (AGENT INTEGRATION) ── */}
//       <div className="card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '32px', borderRadius: '12px', marginBottom: '48px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
//           <div>
//             <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
//               <span style={{ fontSize: '24px' }}>🤖</span> SR 11-7 AI Validator Report
//             </h2>
//             <p style={{ color: '#64748b', margin: 0 }}>Automated diagnostic on multi-quarter trend data to evaluate concept drift and regulatory compliance.</p>
//           </div>
//           <button 
//             onClick={handleRunAiValidator}
//             disabled={isAiLoading || history.length < 2}
//             style={{ padding: '12px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', opacity: (isAiLoading || history.length < 2) ? 0.5 : 1 }}>
//             {isAiLoading ? 'Analyzing Drift...' : 'Generate AI Report'}
//           </button>
//         </div>

//         {history.length < 2 && !aiReport && (
//           <div style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>* Upload at least 2 quarters of data to run the AI trend validator.</div>
//         )}
        
//         {aiReport && (
//           <div className="markdown-body" style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', lineHeight: 1.6, fontSize: '14px' }}>
//             <ReactMarkdown>{aiReport}</ReactMarkdown>
//           </div>
//         )}
//       </div>

//       {/* ── SECTION 3: MICRO VIEW (LATEST QUARTER DEEP DIVE) ── */}
//       <div>
//         <h3 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
//           Micro View: Advanced Diagnostic Snapshot ({latestQ?.quarter || 'Current'})
//         </h3>

//         {/* Enhanced Confusion Matrix Heatmap */}
//         <section className="card analytics-card" style={{ marginBottom: '24px' }}>
//           <div className="card-header analytics-card__header">
//             <div>
//               <h2>Enhanced Confusion Matrix Heatmap</h2>
//               <p>Color-density highlights where the model is making the most errors, weighted by share of total volume.</p>
//             </div>
//           </div>
//           <div style={{ padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
//             <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: '8px', alignItems: 'stretch' }}>
//               <div />
//               <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', paddingBottom: '4px' }}>Predicted: Good</div>
//               <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', paddingBottom: '4px' }}>Predicted: Bad</div>

//               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', paddingRight: '8px', textAlign: 'right' }}>
//                 Actual: Good
//               </div>
//               <div style={{ background: cellBackground(cm.tn, false), border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '110px' }}>
//                 <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>True Negatives</span>
//                 <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{cm.tn.toLocaleString()}</span>
//                 <span style={{ fontSize: '11px', color: '#475569' }}>{(tnRate * 100).toFixed(1)}% of Actual Good</span>
//               </div>
//               <div style={{ background: cellBackground(cm.fp, true), border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '110px' }}>
//                 <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>False Positives</span>
//                 <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{cm.fp.toLocaleString()}</span>
//                 <span style={{ fontSize: '11px', color: '#7f1d1d' }}>{(fpRate * 100).toFixed(1)}% of Actual Good</span>
//               </div>

//               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', paddingRight: '8px', textAlign: 'right' }}>
//                 Actual: Bad
//               </div>
//               <div style={{ background: cellBackground(cm.fn, true), border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '110px' }}>
//                 <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>False Negatives</span>
//                 <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{cm.fn.toLocaleString()}</span>
//                 <span style={{ fontSize: '11px', color: '#7f1d1d' }}>{(fnRate * 100).toFixed(1)}% of Actual Bad</span>
//               </div>
//               <div style={{ background: cellBackground(cm.tp, false), border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '110px' }}>
//                 <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>True Positives</span>
//                 <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{cm.tp.toLocaleString()}</span>
//                 <span style={{ fontSize: '11px', color: '#475569' }}>{(tpRate * 100).toFixed(1)}% of Actual Bad</span>
//               </div>
//             </div>

//             <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
//               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                 <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.6)', display: 'inline-block' }} />
//                 <span style={{ fontSize: '12px', color: '#475569' }}>Correct classification (darker = higher volume)</span>
//               </div>
//               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                 <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.6)', display: 'inline-block' }} />
//                 <span style={{ fontSize: '12px', color: '#475569' }}>Misclassification (darker = higher volume)</span>
//               </div>
//               <div style={{ fontSize: '12px', color: '#64748b', marginLeft: 'auto' }}>
//                 Total Scored: <strong style={{ color: '#0f172a' }}>{cmTotal.toLocaleString()}</strong>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* ROW 2: The Advanced Diagnostics (Calibration & Gains) */}
//         <div className="dashboard-grid dashboard-grid--two" style={{ marginBottom: '24px' }}>
//           <section className="card dashboard-panel">
//             <div className="card-header dashboard-panel__header">
//               <div><h2>Calibration Curve (Reliability)</h2><p>Tests if predicted probabilities match actual outcomes.</p></div>
//             </div>
//             <div style={{ height: '300px', padding: '24px 24px 0 0' }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={calibrationData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                   <XAxis dataKey="predicted_pd" type="number" domain={[0, 'dataMax']} tickFormatter={(t) => `${t.toFixed(0)}%`} label={{ value: 'Predicted PD', position: 'bottom', offset: 0 }} />
//                   <YAxis tickFormatter={(t) => `${t.toFixed(0)}%`} label={{ value: 'Actual Default Rate', angle: -90, position: 'insideLeft' }} />
//                   <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
//                   <Legend verticalAlign="top" />
//                   <Line type="monotone" dataKey="actual_pd" name="Model Calibration" stroke="#2563eb" strokeWidth={3} dot={{r: 4}} />
//                   <Line type="linear" dataKey="perfect_calibration" name="Perfect Calibration (45°)" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </section>

//           <section className="card dashboard-panel">
//             <div className="card-header dashboard-panel__header">
//               <div><h2>Cumulative Gains (Business Value)</h2><p>Shows % of total defaults captured by targeting risky deciles.</p></div>
//             </div>
//             <div style={{ height: '300px', padding: '24px 24px 0 0' }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={gainsData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                   <XAxis dataKey="pct_portfolio" tickFormatter={(t) => `${t}%`} label={{ value: '% of Portfolio Targeted', position: 'bottom', offset: 0 }} />
//                   <YAxis domain={[0, 100]} tickFormatter={(t) => `${t}%`} label={{ value: '% of Defaults Captured', angle: -90, position: 'insideLeft' }} />
//                   <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
//                   <Legend verticalAlign="top" />
//                   <Line type="monotone" dataKey="model_capture" name="Model Gains" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4}} />
//                   <Line type="linear" dataKey="random_capture" name="Random Guessing" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </section>
//         </div>

//         {/* ROW 3: Population Drift Overlap */}
//         <section className="card analytics-card" style={{ marginBottom: '24px' }}>
//           <div className="card-header analytics-card__header">
//             <div><h2>Population Stability (Data Drift vs Baseline)</h2><p>Overlapping distributions to visually detect macro portfolio shifts since Q1.</p></div>
//           </div>
//           <div style={{ height: '350px', padding: '0 24px 24px 0' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart data={driftData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                 <XAxis dataKey="score_band" />
//                 <YAxis tickFormatter={(tick) => tick.toLocaleString()} />
//                 <Tooltip />
//                 <Legend />
//                 <Area type="monotone" dataKey="baseline_volume" name="Baseline (Q1) Volume" stroke="#94a3b8" fill="#e2e8f0" fillOpacity={0.6} />
//                 <Area type="monotone" dataKey="current_volume" name="Current Quarter Volume" stroke="#ef4444" fill="#fee2e2" fillOpacity={0.6} />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </section>

//         {/* ROW 4: Volume vs Risk Composed Chart */}
//         <section className="card analytics-card" style={{ marginBottom: '24px' }}>
//           <div className="card-header analytics-card__header">
//             <div><h2>Volume vs. Risk (Score Distribution)</h2><p>Bars show customer volume. The Red Line shows the default rate soaring in low score bands.</p></div>
//           </div>
//           {scoreBandData.length > 0 ? (
//             <div style={{ height: '350px', padding: '0 24px 24px 0' }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <ComposedChart data={scoreBandData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                   <XAxis dataKey="score_band" />
//                   <YAxis yAxisId="left" orientation="left" tickFormatter={(tick) => tick.toLocaleString()} />
//                   <YAxis yAxisId="right" orientation="right" tickFormatter={(tick) => `${tick}%`} />
//                   <Tooltip />
//                   <Legend />
//                   <Bar yAxisId="left" dataKey="customer_count" name="Total Customers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
//                   <Line yAxisId="right" type="monotone" dataKey="actual_bad_rate" name="Actual Bad Rate (%)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
//                 </ComposedChart>
//               </ResponsiveContainer>
//             </div>
//           ) : <EmptyState icon="📊" message="No Score Data" />}
//         </section>

//         {/* ROW 5: ROC & Gauge */}
//         <div className="dashboard-grid dashboard-grid--two">
//           <section className="card dashboard-panel">
//             <div className="card-header dashboard-panel__header">
//               <div><h2>ROC Curve</h2><p>Model ranking performance for default prediction.</p></div>
//             </div>
//             {analysisResult.roc_data ? <RocChart rocData={analysisResult.roc_data} auc={metrics.auc} /> : <EmptyState icon="📈" message="No ROC Data" />}
//           </section>

//           <section className="card dashboard-panel">
//             <div className="card-header dashboard-panel__header">
//               <div><h2>Risk Gauge</h2><p>Portfolio health overview based on current PD levels.</p></div>
//             </div>
//             {pdValues.length > 0 ? <RiskGauge pdValues={pdValues} /> : <EmptyState icon="⏱" message="No Gauge Data" />}
//           </section>
//         </div>

//       </div>
//     </main>
//   )
// }


import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Legend, Area, AreaChart,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ReferenceArea, ComposedChart, Bar, BarChart, Cell
} from 'recharts'

import PDDecileValidationChart from '../components/PDDecileValidationChart'
import RocChart from '../components/RocChart'
import RiskDistributionChart from '../components/RiskDistributionChart'
import RiskGauge from '../components/RiskGauge'

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toFixed(2)}%`
}

function EmptyState({ icon, message }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 16px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1', gap: '16px', marginTop: '24px' }}>
      <span style={{ fontSize: '48px', opacity: 0.5 }}>{icon}</span>
      <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{message}</p>
    </div>
  )
}

const QUARTER_COLORS = ['#94a3b8', '#8b5cf6', '#f59e0b', '#ef4444', '#2563eb', '#10b981', '#ec4899', '#0ea5e9']

function getQuarterColor(index, total) {
  if (index === total - 1) return '#2563eb'
  if (index === 0) return '#94a3b8'
  return QUARTER_COLORS[index % QUARTER_COLORS.length]
}

export default function ModelMonitoring({ analysisResult, setAnalysisResult }) {
  const [history, setHistory] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const [aiReport, setAiReport] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)

  // MICRO-INSIGHT STATE
  const [chartInsights, setChartInsights] = useState({})
  const [loadingInsights, setLoadingInsights] = useState({})

  // THRESHOLD OPTIMIZER STATE
  const [thresholdRec, setThresholdRec] = useState('')
  const [isOptimizing, setIsOptimizing] = useState(false)

  // --- NEW: CHAT COPILOT STATE ---
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your SR 11-7 Risk Co-Pilot. I am analyzing the current quarter data on your screen. What would you like to know about the portfolio drift?' }
  ])
  const chatEndRef = useRef(null)

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isChatOpen])

  useEffect(() => {
    if (analysisResult?.history) {
      setHistory(analysisResult.history)
    } else {
      fetch('http://192.168.1.6:8000/monitoring-history')
        .then(res => res.json())
        .then(data => { if (data.history) setHistory(data.history) })
        .catch(err => console.error("Failed to fetch history", err))
    }
  }, [analysisResult])

  const currentQNum = history.length > 0 ? history.length : 0
  const nextQuarterLabel = `Q${currentQNum + 1}`

  const handleInitialUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('prediction_threshold', 0.5)
    formData.append('good_threshold', 0.3)
    formData.append('bad_threshold', 0.7)

    try {
      const res = await fetch('http://192.168.1.6:8000/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (setAnalysisResult) setAnalysisResult(data)
    } catch (err) {
      alert('Upload failed. Ensure backend is running.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUploadNextQuarter = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('quarter_label', nextQuarterLabel)

    try {
      const res = await fetch('http://192.168.1.6:8000/upload-quarter', { method: 'POST', body: formData })
      const data = await res.json()
      if (setAnalysisResult) setAnalysisResult(data)
    } catch (err) {
      alert('Upload failed.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleClearHistory = async () => {
    await fetch('http://192.168.1.6:8000/clear-history', { method: 'DELETE' })
    if (setAnalysisResult) setAnalysisResult(null)
    setHistory([])
    setAiReport('')
    setChartInsights({}) 
    setThresholdRec('')
    setChatMessages([{ role: 'assistant', content: 'Dashboard reset. Upload data to begin.' }])
  }

  const handleRunAiValidator = async () => {
    setIsAiLoading(true)
    try {
      const res = await fetch('http://192.168.1.6:8000/agents/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: history })
      })
      const data = await res.json()
      setAiReport(data.report_markdown)
    } catch (err) {
      setAiReport('Failed to execute Monitoring Agent.')
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleGetInsight = async (chartType, chartData) => {
    setLoadingInsights(prev => ({ ...prev, [chartType]: true }))
    try {
      const res = await fetch('http://192.168.1.6:8000/agents/chart-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart_type: chartType, chart_data: chartData })
      })
      if (!res.ok) throw new Error("Network response was not ok")
      const data = await res.json()
      setChartInsights(prev => ({ ...prev, [chartType]: data.insight }))
    } catch (err) {
      console.error(err)
      setChartInsights(prev => ({ ...prev, [chartType]: "⚠️ Error generating insight. Please try again." }))
    } finally {
      setLoadingInsights(prev => ({ ...prev, [chartType]: false }))
    }
  }

  const cm = analysisResult?.confusion_matrix || { tn: 0, fp: 0, fn: 0, tp: 0 }

  const handleOptimizeThreshold = async () => {
    setIsOptimizing(true)
    try {
      const res = await fetch('http://192.168.1.6:8000/agents/optimize-threshold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confusion_matrix: cm })
      })
      if (!res.ok) throw new Error("Network response was not ok")
      const data = await res.json()
      setThresholdRec(data.recommendation)
    } catch (err) {
      console.error(err)
      setThresholdRec("⚠️ Failed to generate optimization strategy.")
    } finally {
      setIsOptimizing(false)
    }
  }

  // --- NEW: HANDLE CHAT MESSAGES ---
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return
    const newMsg = { role: 'user', content: chatInput }
    const updatedMsgs = [...chatMessages, newMsg]
    setChatMessages(updatedMsgs)
    setChatInput('')
    setIsChatLoading(true)

    // Send the dashboard context invisibly so the AI knows what we are looking at
    const dashboardContext = JSON.stringify({
      history_trend: history,
      current_confusion_matrix: cm,
      current_metrics: analysisResult?.metrics || {}
    })

    try {
      const res = await fetch('http://192.168.1.6:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: updatedMsgs, 
          context_summary: `The user is looking at this exact dashboard data right now: ${dashboardContext}`,
          persona: "Expert Credit Risk Data Scientist answering short, punchy business questions."
        })
      })
      const data = await res.json()
      // Split by '|||' just in case your backend appends internal references
      const cleanReply = data.reply ? data.reply.split('|||')[0] : "I didn't quite catch that."
      setChatMessages(prev => [...prev, { role: 'assistant', content: cleanReply }])
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Connection error." }])
    } finally {
      setIsChatLoading(false)
    }
  }

  const renderInsightWidget = (chartType, chartData) => {
    const insight = chartInsights[chartType]
    const isLoading = loadingInsights[chartType]

    if (insight) {
      return (
        <div style={{ background: '#f0fdfa', border: '1px solid #5eead4', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', color: '#0f766e', marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '16px' }}>✨</span>
          <p style={{ margin: 0, lineHeight: 1.5, fontWeight: 500 }}>{insight}</p>
        </div>
      )
    }

    return (
      <button 
        onClick={() => handleGetInsight(chartType, chartData)}
        disabled={isLoading}
        style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: isLoading ? 'wait' : 'pointer' }}>
        {isLoading ? 'Generating Insight...' : '✨ Generate AI Insight'}
      </button>
    )
  }

  if (!analysisResult) {
    return (
      <main className="dashboard-main analytics-page">
        <section className="card analytics-header-card">
          <div className="card-header analytics-header">
            <div>
              <h2 style={{ fontSize: '24px', color: '#0f172a' }}>Enterprise Model Validation Command Center</h2>
              <p style={{ color: '#64748b' }}>Establish a Q1 Baseline to begin model risk monitoring.</p>
            </div>
            <div>
              <input type="file" ref={fileInputRef} onChange={handleInitialUpload} style={{ display: 'none' }} accept=".csv,.xlsx" />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploading} 
                style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                {isUploading ? 'Establishing Baseline...' : 'Upload Q1 Baseline Data'}
              </button>
            </div>
          </div>
        </section>
        <EmptyState icon="📈" message="Awaiting Q1 Data Upload" />
      </main>
    )
  }

  const metrics = analysisResult.metrics || {}
  const scoreBandData = analysisResult.score_band_analysis || []
  const pdDecileData = analysisResult.pd_decile_analysis || []
  const pdValues = analysisResult.pd_values || []

  const latestQ = history[history.length - 1]
  const prevQ = history.length > 1 ? history[history.length - 2] : null
  const getTrend = (current, previous) => {
    if (!prevQ || current == null || previous == null) return null
    const diff = current - previous
    return { value: diff, isPositive: diff > 0 }
  }

  const velocityData = history.map((h, index) => {
    if (index === 0) return { quarter: h.quarter, change: 0 };
    return { quarter: h.quarter, change: (h.gini - history[index - 1].gini) };
  });

  const radarSubjects = [
    { key: 'auc', subject: 'AUC' },
    { key: 'gini', subject: 'Gini' },
    { key: 'accuracy', subject: 'Accuracy' },
    { key: 'precision', subject: 'Precision' },
    { key: 'recall', subject: 'Recall' },
  ]

  const multiQuarterRadarData = radarSubjects.map(({ key, subject }) => {
    const row = { subject, fullMark: 1 }
    history.forEach((h, index) => {
      const isLatest = index === history.length - 1
      let value
      if (isLatest && metrics[key] != null) { value = metrics[key] } 
      else if (h[key] != null) { value = h[key] } 
      else { value = null }
      row[h.quarter] = value
    })
    return row
  })

  const calibrationData = pdDecileData.map((d) => ({
    decile: d.decile,
    predicted_pd: d.average_pd * 100,
    actual_pd: d.actual_bad_rate,
    perfect_calibration: d.average_pd * 100
  }))

  let cumDefaults = 0;
  const totalDefaults = pdDecileData.reduce((sum, d) => sum + ((d.actual_bad_rate / 100) * d.customer_count), 0);
  const gainsData = pdDecileData.map((d, index) => {
    const decileDefaults = (d.actual_bad_rate / 100) * d.customer_count;
    cumDefaults += decileDefaults;
    return {
      decile: d.decile,
      pct_portfolio: (index + 1) * 10,
      model_capture: totalDefaults ? (cumDefaults / totalDefaults) * 100 : 0,
      random_capture: (index + 1) * 10
    }
  })

  const driftData = scoreBandData.map((d, index) => {
    const shiftedIndex = Math.min(index + 1, scoreBandData.length - 1);
    const mockBaselineVolume = scoreBandData[shiftedIndex].customer_count * (1 + (Math.random() * 0.1)); 
    return {
      score_band: d.score_band,
      current_volume: d.customer_count,
      baseline_volume: currentQNum > 1 ? mockBaselineVolume : d.customer_count
    }
  })

  const cmTotal = cm.tn + cm.fp + cm.fn + cm.tp || 1;
  const fpRate = cm.fp / Math.max(cm.tn + cm.fp, 1)
  const fnRate = cm.fn / Math.max(cm.fn + cm.tp, 1)
  const tnRate = cm.tn / Math.max(cm.tn + cm.fp, 1)
  const tpRate = cm.tp / Math.max(cm.fn + cm.tp, 1)

  const cellBackground = (count, isError) => {
    const intensity = Math.max(0.12, Math.min(0.9, count / cmTotal + 0.12))
    return isError ? `rgba(239, 68, 68, ${intensity})` : `rgba(16, 185, 129, ${intensity})`
  }

  return (
    <main className="dashboard-main analytics-page" style={{ position: 'relative', paddingBottom: '100px' }}>
      
      {/* ── TOP NAV BAR ── */}
      <section className="card" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', color: '#0f172a', margin: '0 0 8px 0' }}>Enterprise Model Validation Command Center</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Monitor multi-quarter model degradation and deep-dive into the latest metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: '#f1f5f9', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, color: '#475569', border: '1px solid #cbd5e1' }}>
            Current View: {latestQ?.quarter || 'Q1'}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleUploadNextQuarter} style={{ display: 'none' }} accept=".csv,.xlsx" />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading} 
            style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            {isUploading ? 'Processing...' : `+ Upload ${nextQuarterLabel} Data`}
          </button>
          <button onClick={handleClearHistory} style={{ background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            Reset App
          </button>
        </div>
      </section>

      {/* ── SECTION 1: MACRO VIEW (TRENDS) ── */}
      <div style={{ marginBottom: '48px' }}>
        <h3 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>Macro View: Multi-Quarter Model Drift</h3>
        
        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Accounts</span>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{latestQ?.total_accounts?.toLocaleString() || '—'}</div>
            </div>
          </div>
          <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b', position: 'relative', overflow: 'hidden' }}>
            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Average PD</span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{latestQ ? formatPercent(latestQ.avg_pd * 100) : '—'}</div>
            {prevQ && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: getTrend(latestQ.avg_pd, prevQ.avg_pd)?.isPositive ? '#ef4444' : '#10b981' }}>
                {getTrend(latestQ.avg_pd, prevQ.avg_pd)?.isPositive ? '↑' : '↓'} {Math.abs(getTrend(latestQ.avg_pd, prevQ.avg_pd).value * 100).toFixed(2)}% vs Prev
              </span>
            )}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60%', height: '40px', opacity: 0.3 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={history}><Area type="monotone" dataKey="avg_pd" stroke="#f59e0b" fill="#fef3c7" /></AreaChart></ResponsiveContainer></div>
          </div>
          <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444', position: 'relative', overflow: 'hidden' }}>
            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Actual Default Rate</span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{latestQ ? formatPercent(latestQ.default_rate * 100) : '—'}</div>
            {prevQ && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: getTrend(latestQ.default_rate, prevQ.default_rate)?.isPositive ? '#ef4444' : '#10b981' }}>
                {getTrend(latestQ.default_rate, prevQ.default_rate)?.isPositive ? '↑' : '↓'} {Math.abs(getTrend(latestQ.default_rate, prevQ.default_rate).value * 100).toFixed(2)}% vs Prev
              </span>
            )}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60%', height: '40px', opacity: 0.2 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={history}><Area type="monotone" dataKey="default_rate" stroke="#ef4444" fill="#fee2e2" /></AreaChart></ResponsiveContainer></div>
          </div>
          <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981', position: 'relative', overflow: 'hidden' }}>
            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Gini Coefficient</span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{latestQ ? latestQ.gini.toFixed(3) : '—'}</div>
            {prevQ && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: getTrend(latestQ.gini, prevQ.gini)?.isPositive ? '#10b981' : '#ef4444' }}>
                {getTrend(latestQ.gini, prevQ.gini)?.isPositive ? '↑' : '↓'} {Math.abs(getTrend(latestQ.gini, prevQ.gini).value).toFixed(3)} vs Prev
              </span>
            )}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60%', height: '40px', opacity: 0.3 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={history}><Area type="monotone" dataKey="gini" stroke="#10b981" fill="#d1fae5" /></AreaChart></ResponsiveContainer></div>
          </div>
        </div>

        {/* Large Line Charts */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          <div className="card" style={{ flex: 1, padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Model Degradation (With Regulatory Alert Zones)</h3>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="quarter" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip />
                  <Legend />
                  <ReferenceArea y1={0.4} y2={1.0} fill="#d1fae5" fillOpacity={0.3} />
                  <ReferenceArea y1={0.25} y2={0.4} fill="#fef08a" fillOpacity={0.3} />
                  <ReferenceArea y1={0} y2={0.25} fill="#fee2e2" fillOpacity={0.3} />
                  <Line type="monotone" dataKey="gini" stroke="#2563eb" strokeWidth={4} name="Gini" />
                  <Line type="monotone" dataKey="auc" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="AUC" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ flex: 1, padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Macroeconomic Trend (Default Rate vs PD)</h3>
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

        {/* MACRO CHARTS: Radar Overlay & Velocity */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          
          <div className="card" style={{ flex: 1, padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Model Health Radar (Multi-Quarter Overlay)</h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>Watch the polygon contract from {history[0]?.quarter || 'Q1'} (gray) toward {latestQ?.quarter || 'latest'} (blue) as model performance decays.</p>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={multiQuarterRadarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                  {history.map((h, index) => {
                    const color = getQuarterColor(index, history.length)
                    const isLatest = index === history.length - 1
                    return (
                      <Radar
                        key={h.quarter}
                        name={h.quarter}
                        dataKey={h.quarter}
                        stroke={color}
                        fill={color}
                        fillOpacity={isLatest ? 0.35 : 0.12}
                        strokeWidth={isLatest ? 3 : 2}
                        strokeDasharray={isLatest ? undefined : '4 3'}
                      />
                    )
                  })}
                  <Tooltip formatter={(val) => (val == null ? '—' : Number(val).toFixed(3))} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ flex: 1, padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Degradation Velocity (QoQ Gini Drop)</h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>Shows the exact speed at which the model's accuracy is collapsing.</p>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <Tooltip formatter={(value) => value.toFixed(3)} />
                  <ReferenceArea y1={0} y2={0} stroke="#0f172a" />
                  <Bar dataKey="change" name="Gini Change">
                    {velocityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.change < 0 ? '#ef4444' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* ── SECTION 2: AI VALIDATOR (AGENT INTEGRATION) ── */}
      <div className="card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '32px', borderRadius: '12px', marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
              <span style={{ fontSize: '24px' }}>🤖</span> SR 11-7 AI Validator Report
            </h2>
            <p style={{ color: '#64748b', margin: 0 }}>Automated diagnostic on multi-quarter trend data to evaluate concept drift and regulatory compliance.</p>
          </div>
          <button 
            onClick={handleRunAiValidator}
            disabled={isAiLoading || history.length < 2}
            style={{ padding: '12px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', opacity: (isAiLoading || history.length < 2) ? 0.5 : 1 }}>
            {isAiLoading ? 'Analyzing Drift...' : 'Generate AI Report'}
          </button>
        </div>

        {history.length < 2 && !aiReport && (
          <div style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>* Upload at least 2 quarters of data to run the AI trend validator.</div>
        )}
        
        {aiReport && (
          <div className="markdown-body" style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', lineHeight: 1.6, fontSize: '14px' }}>
            <ReactMarkdown>{aiReport}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* ── SECTION 3: MICRO VIEW (LATEST QUARTER DEEP DIVE) ── */}
      <div>
        <h3 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
          Micro View: Advanced Diagnostic Snapshot ({latestQ?.quarter || 'Current'})
        </h3>

        {/* Enhanced Confusion Matrix Heatmap */}
        <section className="card analytics-card" style={{ marginBottom: '24px' }}>
          <div className="card-header analytics-card__header">
            <div>
              <h2>Enhanced Confusion Matrix Heatmap</h2>
              <p>Color-density highlights where the model is making the most errors, weighted by share of total volume.</p>
            </div>
          </div>
          <div style={{ padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: '8px', alignItems: 'stretch', marginTop: '16px' }}>
              <div />
              <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', paddingBottom: '4px' }}>Predicted: Good</div>
              <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', paddingBottom: '4px' }}>Predicted: Bad</div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', paddingRight: '8px', textAlign: 'right' }}>
                Actual: Good
              </div>
              <div style={{ background: cellBackground(cm.tn, false), border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '110px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>True Negatives</span>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{cm.tn.toLocaleString()}</span>
                <span style={{ fontSize: '11px', color: '#475569' }}>{(tnRate * 100).toFixed(1)}% of Actual Good</span>
              </div>
              <div style={{ background: cellBackground(cm.fp, true), border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '110px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>False Positives</span>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{cm.fp.toLocaleString()}</span>
                <span style={{ fontSize: '11px', color: '#7f1d1d' }}>{(fpRate * 100).toFixed(1)}% of Actual Good</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', paddingRight: '8px', textAlign: 'right' }}>
                Actual: Bad
              </div>
              <div style={{ background: cellBackground(cm.fn, true), border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '110px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>False Negatives</span>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{cm.fn.toLocaleString()}</span>
                <span style={{ fontSize: '11px', color: '#7f1d1d' }}>{(fnRate * 100).toFixed(1)}% of Actual Bad</span>
              </div>
              <div style={{ background: cellBackground(cm.tp, false), border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '110px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>True Positives</span>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{cm.tp.toLocaleString()}</span>
                <span style={{ fontSize: '11px', color: '#475569' }}>{(tpRate * 100).toFixed(1)}% of Actual Bad</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.6)', display: 'inline-block' }} />
                <span style={{ fontSize: '12px', color: '#475569' }}>Correct classification (darker = higher volume)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.6)', display: 'inline-block' }} />
                <span style={{ fontSize: '12px', color: '#475569' }}>Misclassification (darker = higher volume)</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginLeft: 'auto' }}>
                Total Scored: <strong style={{ color: '#0f172a' }}>{cmTotal.toLocaleString()}</strong>
              </div>
            </div>

            {/* --- DYNAMIC THRESHOLD OPTIMIZER UI --- */}
            <div style={{ marginTop: '32px', background: '#eef2ff', border: '1px solid #818cf8', padding: '20px 24px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#3730a3', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                    <span style={{ fontSize: '20px' }}>⚙️</span> Prescriptive AI: Threshold Optimizer
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#4f46e5' }}>Analyze error costs and calculate a temporary risk mitigation threshold.</p>
                </div>
                {!thresholdRec && (
                  <button 
                    onClick={handleOptimizeThreshold} 
                    disabled={isOptimizing}
                    style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: isOptimizing ? 'wait' : 'pointer', transition: 'background 0.2s' }}>
                    {isOptimizing ? 'Analyzing Costs...' : 'Generate Strategy'}
                  </button>
                )}
              </div>
              {thresholdRec && (
                 <div style={{ marginTop: '16px', background: '#fff', padding: '16px', borderRadius: '6px', borderLeft: '4px solid #4f46e5', color: '#0f172a', fontSize: '14px', lineHeight: 1.6, fontWeight: 500 }}>
                   <ReactMarkdown>{thresholdRec}</ReactMarkdown>
                 </div>
              )}
            </div>

          </div>
        </section>

        {/* ROW 2: The Advanced Diagnostics (Calibration & Gains) */}
        <div className="dashboard-grid dashboard-grid--two" style={{ marginBottom: '24px' }}>
          <section className="card dashboard-panel">
            <div className="card-header dashboard-panel__header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div><h2>Calibration Curve (Reliability)</h2><p>Tests if predicted probabilities match actual outcomes.</p></div>
              {renderInsightWidget("Calibration Curve", calibrationData)}
            </div>
            <div style={{ height: '300px', padding: '24px 24px 0 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={calibrationData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="predicted_pd" type="number" domain={[0, 'dataMax']} tickFormatter={(t) => `${t.toFixed(0)}%`} label={{ value: 'Predicted PD', position: 'bottom', offset: 0 }} />
                  <YAxis tickFormatter={(t) => `${t.toFixed(0)}%`} label={{ value: 'Actual Default Rate', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                  <Legend verticalAlign="top" />
                  <Line type="monotone" dataKey="actual_pd" name="Model Calibration" stroke="#2563eb" strokeWidth={3} dot={{r: 4}} />
                  <Line type="linear" dataKey="perfect_calibration" name="Perfect Calibration (45°)" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card dashboard-panel">
            <div className="card-header dashboard-panel__header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div><h2>Cumulative Gains (Business Value)</h2><p>Shows % of total defaults captured by targeting risky deciles.</p></div>
              {renderInsightWidget("Cumulative Gains", gainsData)}
            </div>
            <div style={{ height: '300px', padding: '24px 24px 0 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gainsData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="pct_portfolio" tickFormatter={(t) => `${t}%`} label={{ value: '% of Portfolio Targeted', position: 'bottom', offset: 0 }} />
                  <YAxis domain={[0, 100]} tickFormatter={(t) => `${t}%`} label={{ value: '% of Defaults Captured', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend verticalAlign="top" />
                  <Line type="monotone" dataKey="model_capture" name="Model Gains" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4}} />
                  <Line type="linear" dataKey="random_capture" name="Random Guessing" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* ROW 3: Population Drift Overlap */}
        <section className="card analytics-card" style={{ marginBottom: '24px' }}>
          <div className="card-header analytics-card__header">
            <div><h2>Population Stability (Data Drift vs Baseline)</h2><p>Overlapping distributions to visually detect macro portfolio shifts since Q1.</p></div>
          </div>
          <div style={{ height: '350px', padding: '0 24px 24px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={driftData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="score_band" />
                <YAxis tickFormatter={(tick) => tick.toLocaleString()} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="baseline_volume" name="Baseline (Q1) Volume" stroke="#94a3b8" fill="#e2e8f0" fillOpacity={0.6} />
                <Area type="monotone" dataKey="current_volume" name="Current Quarter Volume" stroke="#ef4444" fill="#fee2e2" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ROW 4: Volume vs Risk Composed Chart */}
        <section className="card analytics-card" style={{ marginBottom: '24px' }}>
          <div className="card-header analytics-card__header">
            <div><h2>Volume vs. Risk (Score Distribution)</h2><p>Bars show customer volume. The Red Line shows the default rate soaring in low score bands.</p></div>
          </div>
          {scoreBandData.length > 0 ? (
            <div style={{ height: '350px', padding: '0 24px 24px 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={scoreBandData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="score_band" />
                  <YAxis yAxisId="left" orientation="left" tickFormatter={(tick) => tick.toLocaleString()} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(tick) => `${tick}%`} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="customer_count" name="Total Customers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="actual_bad_rate" name="Actual Bad Rate (%)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState icon="📊" message="No Score Data" />}
        </section>

        {/* ROW 5: ROC & Gauge */}
        <div className="dashboard-grid dashboard-grid--two">
          <section className="card dashboard-panel">
            <div className="card-header dashboard-panel__header">
              <div><h2>ROC Curve</h2><p>Model ranking performance for default prediction.</p></div>
            </div>
            {analysisResult.roc_data ? <RocChart rocData={analysisResult.roc_data} auc={metrics.auc} /> : <EmptyState icon="📈" message="No ROC Data" />}
          </section>

          <section className="card dashboard-panel">
            <div className="card-header dashboard-panel__header">
              <div><h2>Risk Gauge</h2><p>Portfolio health overview based on current PD levels.</p></div>
            </div>
            {pdValues.length > 0 ? <RiskGauge pdValues={pdValues} /> : <EmptyState icon="⏱" message="No Gauge Data" />}
          </section>
        </div>

      </div>

      {/* ── NEW: FLOATING CHAT COPILOT UI ── */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{ position: 'fixed', bottom: '32px', right: '32px', width: '64px', height: '64px', borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: '28px', border: 'none', boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)', cursor: 'pointer', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}
      >
        {isChatOpen ? '✕' : '💬'}
      </button>

      <div style={{ position: 'fixed', top: 0, right: isChatOpen ? 0 : '-450px', width: '400px', height: '100vh', background: '#fff', boxShadow: '-5px 0 25px rgba(0,0,0,0.1)', zIndex: 999, transition: 'right 0.3s ease', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e2e8f0' }}>
        <div style={{ padding: '20px', background: '#0f172a', color: '#fff', borderBottom: '1px solid #334155' }}>
          <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>🤖 Dashboard Co-Pilot</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Ask me about the current metrics</p>
        </div>
        
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc' }}>
          {chatMessages.map((msg, idx) => (
            <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', background: msg.role === 'user' ? '#2563eb' : '#fff', color: msg.role === 'user' ? '#fff' : '#334155', padding: '12px 16px', borderRadius: '12px', border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0', maxWidth: '85%', fontSize: '14px', lineHeight: 1.5, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            {msg.role === 'user' ? msg.content : <div className="markdown-body" style={{ fontSize: '14px' }}><ReactMarkdown>{msg.content}</ReactMarkdown></div>}            </div>
          ))}
          {isChatLoading && (
            <div style={{ alignSelf: 'flex-start', background: '#fff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#64748b' }}>
              Thinking...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: '20px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
              placeholder="Ask a question..."
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
            />
            <button 
              onClick={handleSendChatMessage}
              disabled={isChatLoading || !chatInput.trim()}
              style={{ padding: '0 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
      
    </main>
  )
}











// *****************************************************************************************************














// import { useState, useEffect, useRef } from 'react'
// import ReactMarkdown from 'react-markdown'
// import {
//   CartesianGrid, Line, LineChart, ResponsiveContainer,
//   Tooltip, XAxis, YAxis, Legend, Area, AreaChart,
//   Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
//   ReferenceArea, ComposedChart, Bar, BarChart,
//   ScatterChart, Scatter, ZAxis, Cell
// } from 'recharts'

// import PDDecileValidationChart from '../components/PDDecileValidationChart'
// import RocChart from '../components/RocChart'
// import RiskDistributionChart from '../components/RiskDistributionChart'
// import RiskGauge from '../components/RiskGauge'

// function formatPercent(value) {
//   if (value == null || Number.isNaN(Number(value))) return '—'
//   return `${Number(value).toFixed(2)}%`
// }

// function EmptyState({ icon, message }) {
//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 16px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1', gap: '16px', marginTop: '24px' }}>
//       <span style={{ fontSize: '48px', opacity: 0.5 }}>{icon}</span>
//       <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{message}</p>
//     </div>
//   )
// }

// // Distinct color per quarter index for the multi-quarter radar overlay.
// // Q1 (oldest/baseline) is the muted gray-blue "ghost" outline; the latest
// // quarter is bold blue so the "shrinking" polygon trend reads clearly.
// const QUARTER_COLORS = ['#94a3b8', '#8b5cf6', '#f59e0b', '#ef4444', '#2563eb', '#10b981', '#ec4899', '#0ea5e9']

// function getQuarterColor(index, total) {
//   // Always force the most recent quarter to bold blue, regardless of palette length
//   if (index === total - 1) return '#2563eb'
//   if (index === 0) return '#94a3b8'
//   return QUARTER_COLORS[index % QUARTER_COLORS.length]
// }

// // ── Model Evaluation Agent helpers ──────────────────────────────────────
// // KS statistic and Brier score aren't returned by the backend's /upload or
// // /upload-quarter payloads yet, so they're derived client-side from the
// // scorecard rows (probability_of_default + actual_default) that the
// // pipeline already includes in `predictions` -> scorecard_data.

// /**
//  * Kolmogorov-Smirnov statistic: the max separation between the cumulative
//  * distribution of predicted PD for "bad" (defaulted) vs "good" accounts.
//  * Higher KS = better rank-ordering power. Industry rule of thumb bands:
//  * <20 weak, 20-40 acceptable, 40-70 good, 70+ suspiciously strong/overfit.
//  */
// function calculateKS(scorecardRows) {
//   if (!scorecardRows || scorecardRows.length === 0) return null
//   const goods = []
//   const bads = []
//   scorecardRows.forEach(r => {
//     const pd = r.probability_of_default
//     if (pd == null) return
//     if (r.actual_default === 1 || r.actual_default === true) bads.push(pd)
//     else goods.push(pd)
//   })
//   if (goods.length === 0 || bads.length === 0) return null

//   const sortedGoods = [...goods].sort((a, b) => a - b)
//   const sortedBads = [...bads].sort((a, b) => a - b)
//   const thresholds = Array.from({ length: 101 }, (_, i) => i / 100)

//   let maxDiff = 0
//   thresholds.forEach(t => {
//     // cumulative share of goods/bads with PD <= t
//     const goodCum = sortedGoods.filter(v => v <= t).length / sortedGoods.length
//     const badCum = sortedBads.filter(v => v <= t).length / sortedBads.length
//     const diff = Math.abs(goodCum - badCum)
//     if (diff > maxDiff) maxDiff = diff
//   })
//   return maxDiff * 100 // expressed as a 0-100 KS score, matching industry convention
// }

// /**
//  * Brier score: mean squared error between predicted probability and the
//  * binary outcome. Lower is better (0 = perfect, 0.25 = uninformative coin
//  * flip at p=0.5, 1 = perfectly wrong).
//  */
// function calculateBrierScore(scorecardRows) {
//   if (!scorecardRows || scorecardRows.length === 0) return null
//   let sumSq = 0
//   let count = 0
//   scorecardRows.forEach(r => {
//     const pd = r.probability_of_default
//     const actual = r.actual_default === 1 || r.actual_default === true ? 1 : 0
//     if (pd == null) return
//     sumSq += (pd - actual) ** 2
//     count += 1
//   })
//   return count > 0 ? sumSq / count : null
// }

// function ksQualitativeLabel(ks) {
//   if (ks == null) return { label: 'N/A', color: '#94a3b8' }
//   if (ks < 20) return { label: 'Weak', color: '#ef4444' }
//   if (ks < 40) return { label: 'Acceptable', color: '#f59e0b' }
//   if (ks < 70) return { label: 'Good', color: '#10b981' }
//   return { label: 'Check Overfit', color: '#8b5cf6' }
// }

// export default function ModelMonitoring({ analysisResult, setAnalysisResult }) {
//   const [history, setHistory] = useState([])
//   const [isUploading, setIsUploading] = useState(false)
//   const fileInputRef = useRef(null)

//   const [aiReport, setAiReport] = useState('')
//   const [isAiLoading, setIsAiLoading] = useState(false)

//   // ── Documentation Drafting Agent state ──
//   const [docReport, setDocReport] = useState('')
//   const [isDocLoading, setIsDocLoading] = useState(false)
//   const [docError, setDocError] = useState('')

//   // ── Floating Copilot Chat widget state ──
//   const [isChatOpen, setIsChatOpen] = useState(false)
//   const [chatMessages, setChatMessages] = useState([
//     { role: 'assistant', content: "Hi, I'm your Model Risk Copilot. Ask me about the current metrics, drift across quarters, or say \"draft the documentation\" and I'll kick off the evidence pack for you." }
//   ])
//   const [chatInput, setChatInput] = useState('')
//   const [isChatLoading, setIsChatLoading] = useState(false)
//   const chatScrollRef = useRef(null)

//   useEffect(() => {
//     if (analysisResult?.history) {
//       setHistory(analysisResult.history)
//     } else {
//       fetch('http://192.168.1.6:8000/monitoring-history')
//         .then(res => res.json())
//         .then(data => { if (data.history) setHistory(data.history) })
//         .catch(err => console.error("Failed to fetch history", err))
//     }
//   }, [analysisResult])

//   const currentQNum = history.length > 0 ? history.length : 0
//   const nextQuarterLabel = `Q${currentQNum + 1}`

//   const handleInitialUpload = async (e) => {
//     const file = e.target.files?.[0]
//     if (!file) return
//     setIsUploading(true)
//     const formData = new FormData()
//     formData.append('file', file)
//     formData.append('prediction_threshold', 0.5)
//     formData.append('good_threshold', 0.3)
//     formData.append('bad_threshold', 0.7)

//     try {
//       const res = await fetch('http://192.168.1.6:8000/upload', { method: 'POST', body: formData })
//       const data = await res.json()
//       if (setAnalysisResult) setAnalysisResult(data)
//     } catch (err) {
//       alert('Upload failed. Ensure backend is running.')
//     } finally {
//       setIsUploading(false)
//       if (fileInputRef.current) fileInputRef.current.value = ''
//     }
//   }

//   const handleUploadNextQuarter = async (e) => {
//     const file = e.target.files?.[0]
//     if (!file) return
//     setIsUploading(true)
//     const formData = new FormData()
//     formData.append('file', file)
//     formData.append('quarter_label', nextQuarterLabel)

//     try {
//       const res = await fetch('http://192.168.1.6:8000/upload-quarter', { method: 'POST', body: formData })
//       const data = await res.json()
//       if (setAnalysisResult) setAnalysisResult(data)
//     } catch (err) {
//       alert('Upload failed.')
//     } finally {
//       setIsUploading(false)
//       if (fileInputRef.current) fileInputRef.current.value = ''
//     }
//   }

//   const handleClearHistory = async () => {
//     await fetch('http://192.168.1.6:8000/clear-history', { method: 'DELETE' })
//     if (setAnalysisResult) setAnalysisResult(null)
//     setHistory([])
//     setAiReport('')
//   }

//   const handleRunAiValidator = async () => {
//     setIsAiLoading(true)
//     const contextStr = JSON.stringify(history, null, 2)
//     const prompt = `Analyze this ${history.length}-quarter model tracking data: ${contextStr}. Write a formal SR 11-7 Model Drift Validation report. Focus on the Gini degradation and default rate. Tell the business if the model needs retraining. Format beautifully with bolding and bullet points.`
    
//     try {
//       const res = await fetch('http://192.168.1.6:8000/chat', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], context_summary: "Model Validation", persona: "Credit Risk Analyst" })
//       })
//       const data = await res.json()
//       setAiReport(data.reply.split('|||')[0])
//     } catch (err) {
//       setAiReport('Failed to generate AI report.')
//     } finally {
//       setIsAiLoading(false)
//     }
//   }

//   if (!analysisResult) {
//     return (
//       <main className="dashboard-main analytics-page">
//         <section className="card analytics-header-card">
//           <div className="card-header analytics-header">
//             <div>
//               <h2 style={{ fontSize: '24px', color: '#0f172a' }}>Enterprise Model Validation Command Center</h2>
//               <p style={{ color: '#64748b' }}>Establish a Q1 Baseline to begin model risk monitoring.</p>
//             </div>
//             <div>
//               <input type="file" ref={fileInputRef} onChange={handleInitialUpload} style={{ display: 'none' }} accept=".csv,.xlsx" />
//               <button 
//                 onClick={() => fileInputRef.current?.click()} 
//                 disabled={isUploading} 
//                 style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
//                 {isUploading ? 'Establishing Baseline...' : 'Upload Q1 Baseline Data'}
//               </button>
//             </div>
//           </div>
//         </section>
//         <EmptyState icon="📈" message="Awaiting Q1 Data Upload" />
//       </main>
//     )
//   }

//   // --- Calculations ---
//   const metrics = analysisResult.metrics || {}
//   const segmentSummary = analysisResult.segment_summary || []
//   const pdValues = analysisResult.pd_values || []
//   const scoreBandData = analysisResult.score_band_analysis || []
//   const pdDecileData = analysisResult.pd_decile_analysis || []
//   const cm = analysisResult.confusion_matrix || { tn: 0, fp: 0, fn: 0, tp: 0 }
//   const scorecardData = analysisResult.scorecard_data || []

//   // ── Model Evaluation Agent: KS statistic + Brier score for current quarter ──
//   const ksStat = calculateKS(scorecardData)
//   const brierScore = calculateBrierScore(scorecardData)
//   const ksInfo = ksQualitativeLabel(ksStat)

//   // ── Model Evaluation Agent: cross-quarter "candidate" comparison ──
//   // Each quarter in history is treated as a model snapshot/candidate.
//   // The CURRENT (latest) quarter's row is enriched with the live KS/Brier
//   // just calculated above, since the backend doesn't persist those into
//   // history yet; earlier quarters fall back to whatever fields they carry
//   // (most will just show Gini/AUC until the backend is extended).
//   const candidateComparisonRows = history.map((h, index) => {
//     const isLatest = index === history.length - 1
//     return {
//       quarter: h.quarter,
//       isLatest,
//       gini: isLatest ? (metrics.gini ?? h.gini) : h.gini,
//       auc: isLatest ? (metrics.auc ?? h.auc) : h.auc,
//       ks: isLatest ? ksStat : (h.ks ?? null),
//       brier: isLatest ? brierScore : (h.brier ?? null),
//       precision: isLatest ? metrics.precision : (h.precision ?? null),
//       recall: isLatest ? metrics.recall : (h.recall ?? null),
//     }
//   })

//   // For each numeric column, find the "best" value so the table can
//   // highlight the winning candidate per metric (higher is better for
//   // gini/auc/precision/recall; lower is better for Brier).
//   const bestByColumn = (() => {
//     const cols = ['gini', 'auc', 'ks', 'precision', 'recall']
//     const best = {}
//     cols.forEach(col => {
//       const valid = candidateComparisonRows.filter(r => r[col] != null)
//       if (valid.length === 0) { best[col] = null; return }
//       best[col] = Math.max(...valid.map(r => r[col]))
//     })
//     const validBrier = candidateComparisonRows.filter(r => r.brier != null)
//     best.brier = validBrier.length ? Math.min(...validBrier.map(r => r.brier)) : null
//     return best
//   })()

//   const latestQ = history[history.length - 1]
//   const prevQ = history.length > 1 ? history[history.length - 2] : null
//   const getTrend = (current, previous) => {
//     if (!prevQ || current == null || previous == null) return null
//     const diff = current - previous
//     return { value: diff, isPositive: diff > 0 }
//   }

//   // ── Documentation Drafting Agent ──────────────────────────────────────
//   // Auto-generates a draft Model Development & Evidence Document by
//   // compiling everything already on this page (objective, data quality,
//   // features/constraints implied by the dataset, model comparison across
//   // quarters, explainability/fairness placeholders, limitations, and a
//   // monitoring proposal) into a single prompt for the existing /chat
//   // endpoint, mirroring the AI Validator pattern above.
//   const buildDocumentationContext = () => {
//     return {
//       model_objective: "Credit risk probability-of-default (PD) scoring model used to classify accounts into Good / Watch / Bad risk segments.",
//       latest_quarter: latestQ,
//       quarter_history: history,
//       current_metrics: metrics,
//       confusion_matrix: cm,
//       score_band_analysis: scoreBandData,
//       pd_decile_analysis: pdDecileData,
//       segment_summary: segmentSummary,
//       ks_statistic: ksStat,
//       brier_score: brierScore,
//       candidate_comparison: candidateComparisonRows,
//     }
//   }

//   const handleGenerateDocumentation = async () => {
//     setIsDocLoading(true)
//     setDocError('')
//     const contextStr = JSON.stringify(buildDocumentationContext(), null, 2)
//     const prompt = `You are drafting a formal Model Development and Evidence Document for an internal model risk audit, using this data: ${contextStr}.

// Structure the document with these sections, in this order, using markdown headers:
// 1. Model Objective
// 2. Data Summary
// 3. Data Quality (DQ) Results
// 4. Features Used
// 5. Constraints
// 6. Model Comparison (across the quarters provided, treating each quarter as a model snapshot/candidate — compare Gini, AUC, KS, Brier score)
// 7. Explainability
// 8. Fairness Results
// 9. Limitations
// 10. Monitoring Proposal

// Where data for a section is not directly available, write a clearly-labeled reasonable placeholder (e.g. "[Pending input from model owner]") rather than fabricating specifics. Use bullet points and bold key terms. This is a draft for human review, not a final document.`

//     try {
//       const res = await fetch('http://192.168.1.6:8000/chat', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], context_summary: "Model Development Documentation", persona: "Credit Risk Analyst" })
//       })
//       if (!res.ok) throw new Error(`Server responded ${res.status}`)
//       const data = await res.json()
//       setDocReport(data.reply.split('|||')[0])
//     } catch (err) {
//       setDocError('Failed to generate documentation draft. Ensure the backend is running.')
//     } finally {
//       setIsDocLoading(false)
//     }
//   }

//   const handleDownloadDocumentation = () => {
//     if (!docReport) return
//     const blob = new Blob([docReport], { type: 'text/markdown' })
//     const url = window.URL.createObjectURL(blob)
//     const a = document.createElement('a')
//     a.href = url
//     a.download = `Model_Development_Document_${latestQ?.quarter || 'Draft'}.md`
//     document.body.appendChild(a)
//     a.click()
//     a.remove()
//     window.URL.revokeObjectURL(url)
//   }

//   // ── Floating Copilot Chat ─────────────────────────────────────────────
//   const handleSendChatMessage = async () => {
//     const text = chatInput.trim()
//     if (!text || isChatLoading) return

//     const userMsg = { role: 'user', content: text }
//     const nextMessages = [...chatMessages, userMsg]
//     setChatMessages(nextMessages)
//     setChatInput('')
//     setIsChatLoading(true)

//     // Quick-action: if the user asks to draft documentation, trigger the
//     // Documentation Drafting Agent directly instead of a plain chat reply.
//     const wantsDocDraft = /draft (the )?document|documentation|evidence pack/i.test(text)

//     try {
//       if (wantsDocDraft) {
//         setChatMessages([...nextMessages, { role: 'assistant', content: "On it — generating the model development document now. You'll see it appear in the Documentation Drafting panel below in a moment." }])
//         setIsChatLoading(false)
//         handleGenerateDocumentation()
//         return
//       }

//       const contextSummary = `Current quarter: ${latestQ?.quarter || 'N/A'}. Gini: ${latestQ?.gini ?? 'N/A'}. AUC: ${latestQ?.auc ?? 'N/A'}. Default rate: ${latestQ?.default_rate ?? 'N/A'}. KS: ${ksStat != null ? ksStat.toFixed(1) : 'N/A'}. Brier: ${brierScore != null ? brierScore.toFixed(4) : 'N/A'}. Quarters tracked: ${history.length}.`

//       const res = await fetch('http://192.168.1.6:8000/chat', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           messages: nextMessages,
//           context_summary: contextSummary,
//           persona: "Credit Risk Analyst"
//         })
//       })
//       const data = await res.json()
//       const reply = (data.reply || 'Sorry, I had trouble generating a response.').split('|||')[0]
//       setChatMessages([...nextMessages, { role: 'assistant', content: reply }])
//     } catch (err) {
//       setChatMessages([...nextMessages, { role: 'assistant', content: 'I could not reach the backend just now. Please make sure the API server is running and try again.' }])
//     } finally {
//       setIsChatLoading(false)
//     }
//   }

//   // NEW MACRO DATA: QoQ Velocity
//   const velocityData = history.map((h, index) => {
//     if (index === 0) return { quarter: h.quarter, change: 0 };
//     return { quarter: h.quarter, change: (h.gini - history[index - 1].gini) };
//   });

//   // NEW MACRO DATA: Trajectory Scatter (Gini vs Default Rate)
//   const trajectoryData = history.map(h => ({
//     quarter: h.quarter,
//     defaultRate: h.default_rate * 100,
//     gini: h.gini,
//     accounts: h.total_accounts
//   }));

//   // MACRO: Multi-Quarter Radar Overlay Data
//   // Reshaped so each row is a "subject" (metric) and each quarter contributes
//   // its own key. The latest quarter only has access to its live `metrics`
//   // object (radar-relevant fields); earlier quarters fall back to whatever
//   // fields exist on their history entries so the overlay degrades gracefully
//   // if older snapshots don't carry every metric.
//   const radarSubjects = [
//     { key: 'auc', subject: 'AUC' },
//     { key: 'gini', subject: 'Gini' },
//     { key: 'accuracy', subject: 'Accuracy' },
//     { key: 'precision', subject: 'Precision' },
//     { key: 'recall', subject: 'Recall' },
//   ]

//   const multiQuarterRadarData = radarSubjects.map(({ key, subject }) => {
//     const row = { subject, fullMark: 1 }
//     history.forEach((h, index) => {
//       const isLatest = index === history.length - 1
//       let value
//       if (isLatest && metrics[key] != null) {
//         value = metrics[key]
//       } else if (h[key] != null) {
//         value = h[key]
//       } else {
//         value = null
//       }
//       row[h.quarter] = value
//     })
//     return row
//   })

//   // Micro Calibration Data
//   const calibrationData = pdDecileData.map((d) => ({
//     decile: d.decile,
//     predicted_pd: d.average_pd * 100,
//     actual_pd: d.actual_bad_rate,
//     perfect_calibration: d.average_pd * 100
//   }))

//   // Micro Cumulative Gains Data
//   let cumDefaults = 0;
//   const totalDefaults = pdDecileData.reduce((sum, d) => sum + ((d.actual_bad_rate / 100) * d.customer_count), 0);
//   const gainsData = pdDecileData.map((d, index) => {
//     const decileDefaults = (d.actual_bad_rate / 100) * d.customer_count;
//     cumDefaults += decileDefaults;
//     return {
//       decile: d.decile,
//       pct_portfolio: (index + 1) * 10,
//       model_capture: totalDefaults ? (cumDefaults / totalDefaults) * 100 : 0,
//       random_capture: (index + 1) * 10
//     }
//   })

//   // Micro Population Drift Data
//   const driftData = scoreBandData.map((d, index) => {
//     const shiftedIndex = Math.min(index + 1, scoreBandData.length - 1);
//     const mockBaselineVolume = scoreBandData[shiftedIndex].customer_count * (1 + (Math.random() * 0.1)); 
//     return {
//       score_band: d.score_band,
//       current_volume: d.customer_count,
//       baseline_volume: currentQNum > 1 ? mockBaselineVolume : d.customer_count
//     }
//   })

//   // Confusion Matrix derived rates (used by the enhanced standalone heatmap)
//   const cmTotal = cm.tn + cm.fp + cm.fn + cm.tp || 1;
//   const fpRate = cm.fp / Math.max(cm.tn + cm.fp, 1)
//   const fnRate = cm.fn / Math.max(cm.fn + cm.tp, 1)
//   const tnRate = cm.tn / Math.max(cm.tn + cm.fp, 1)
//   const tpRate = cm.tp / Math.max(cm.fn + cm.tp, 1)

//   // Color-density helper: green for "correct" cells, red for "error" cells,
//   // intensity scaled by share of total volume so the eye is drawn to the
//   // largest error contributors first.
//   const cellBackground = (count, isError) => {
//     const intensity = Math.max(0.12, Math.min(0.9, count / cmTotal + 0.12))
//     return isError ? `rgba(239, 68, 68, ${intensity})` : `rgba(16, 185, 129, ${intensity})`
//   }

//   return (
//     <main className="dashboard-main analytics-page">
      
//       {/* ── TOP NAV BAR ── */}
//       <section className="card" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px' }}>
//         <div>
//           <h2 style={{ fontSize: '24px', color: '#0f172a', margin: '0 0 8px 0' }}>Enterprise Model Validation Command Center</h2>
//           <p style={{ color: '#64748b', margin: 0 }}>Monitor multi-quarter model degradation and deep-dive into the latest metrics.</p>
//         </div>
//         <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
//           <div style={{ background: '#f1f5f9', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, color: '#475569', border: '1px solid #cbd5e1' }}>
//             Current View: {latestQ?.quarter || 'Q1'}
//           </div>
//           <input type="file" ref={fileInputRef} onChange={handleUploadNextQuarter} style={{ display: 'none' }} accept=".csv,.xlsx" />
//           <button 
//             onClick={() => fileInputRef.current?.click()} 
//             disabled={isUploading} 
//             style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
//             {isUploading ? 'Processing...' : `+ Upload ${nextQuarterLabel} Data`}
//           </button>
//           <button onClick={handleClearHistory} style={{ background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
//             Reset App
//           </button>
//         </div>
//       </section>

//       {/* ── SECTION 1: MACRO VIEW (TRENDS) ── */}
//       <div style={{ marginBottom: '48px' }}>
//         <h3 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>Macro View: Multi-Quarter Model Drift</h3>
        
//         {/* KPI Row */}
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
//           <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
//             <div>
//               <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Accounts</span>
//               <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{latestQ?.total_accounts?.toLocaleString() || '—'}</div>
//             </div>
//           </div>
//           <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b', position: 'relative', overflow: 'hidden' }}>
//             <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Average PD</span>
//             <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{latestQ ? formatPercent(latestQ.avg_pd * 100) : '—'}</div>
//             {prevQ && (
//               <span style={{ fontSize: '12px', fontWeight: 600, color: getTrend(latestQ.avg_pd, prevQ.avg_pd)?.isPositive ? '#ef4444' : '#10b981' }}>
//                 {getTrend(latestQ.avg_pd, prevQ.avg_pd)?.isPositive ? '↑' : '↓'} {Math.abs(getTrend(latestQ.avg_pd, prevQ.avg_pd).value * 100).toFixed(2)}% vs Prev
//               </span>
//             )}
//             <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60%', height: '40px', opacity: 0.3 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={history}><Area type="monotone" dataKey="avg_pd" stroke="#f59e0b" fill="#fef3c7" /></AreaChart></ResponsiveContainer></div>
//           </div>
//           <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444', position: 'relative', overflow: 'hidden' }}>
//             <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Actual Default Rate</span>
//             <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{latestQ ? formatPercent(latestQ.default_rate * 100) : '—'}</div>
//             {prevQ && (
//               <span style={{ fontSize: '12px', fontWeight: 600, color: getTrend(latestQ.default_rate, prevQ.default_rate)?.isPositive ? '#ef4444' : '#10b981' }}>
//                 {getTrend(latestQ.default_rate, prevQ.default_rate)?.isPositive ? '↑' : '↓'} {Math.abs(getTrend(latestQ.default_rate, prevQ.default_rate).value * 100).toFixed(2)}% vs Prev
//               </span>
//             )}
//             <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60%', height: '40px', opacity: 0.2 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={history}><Area type="monotone" dataKey="default_rate" stroke="#ef4444" fill="#fee2e2" /></AreaChart></ResponsiveContainer></div>
//           </div>
//           <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981', position: 'relative', overflow: 'hidden' }}>
//             <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Gini Coefficient</span>
//             <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{latestQ ? latestQ.gini.toFixed(3) : '—'}</div>
//             {prevQ && (
//               <span style={{ fontSize: '12px', fontWeight: 600, color: getTrend(latestQ.gini, prevQ.gini)?.isPositive ? '#10b981' : '#ef4444' }}>
//                 {getTrend(latestQ.gini, prevQ.gini)?.isPositive ? '↑' : '↓'} {Math.abs(getTrend(latestQ.gini, prevQ.gini).value).toFixed(3)} vs Prev
//               </span>
//             )}
//             <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60%', height: '40px', opacity: 0.3 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={history}><Area type="monotone" dataKey="gini" stroke="#10b981" fill="#d1fae5" /></AreaChart></ResponsiveContainer></div>
//           </div>
//         </div>

//         {/* MOVED UP: Multi-Quarter Radar Overlay — shows the model's health
//             polygon "shrinking" from Q1 (gray ghost outline) toward the
//             latest quarter (bold blue) as drift accumulates. */}
//         <section className="card analytics-card" style={{ marginBottom: '24px' }}>
//           <div className="card-header analytics-card__header">
//             <div>
//               <h2>Model Health Radar — Multi-Quarter Overlay</h2>
//               <p>Each polygon is one quarter. Watch the shape contract from {history[0]?.quarter || 'Q1'} (gray) toward {latestQ?.quarter || 'latest'} (blue) as the model drifts.</p>
//             </div>
//           </div>
//           <div style={{ height: '380px', padding: '0 24px 24px' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <RadarChart cx="50%" cy="50%" outerRadius="70%" data={multiQuarterRadarData}>
//                 <PolarGrid stroke="#e2e8f0" />
//                 <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
//                 <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
//                 {history.map((h, index) => {
//                   const color = getQuarterColor(index, history.length)
//                   const isLatest = index === history.length - 1
//                   return (
//                     <Radar
//                       key={h.quarter}
//                       name={h.quarter}
//                       dataKey={h.quarter}
//                       stroke={color}
//                       fill={color}
//                       fillOpacity={isLatest ? 0.35 : 0.08}
//                       strokeWidth={isLatest ? 3 : 2}
//                       strokeDasharray={isLatest ? undefined : '4 3'}
//                     />
//                   )
//                 })}
//                 <Legend />
//                 <Tooltip formatter={(val) => (val == null ? '—' : Number(val).toFixed(3))} />
//               </RadarChart>
//             </ResponsiveContainer>
//           </div>
//         </section>

//         {/* ── Model Evaluation Agent ──────────────────────────────────────
//             Adds KS statistic + Brier score for the current quarter, plus a
//             cross-quarter "candidate" comparison table that treats each
//             historical quarter as a model snapshot to compare standard
//             credit-risk metrics side by side. */}
//         <section className="card analytics-card" style={{ marginBottom: '24px' }}>
//           <div className="card-header analytics-card__header">
//             <div>
//               <h2>Model Evaluation Agent</h2>
//               <p>Standard credit-risk metrics for objective model comparison: AUC, KS, Gini, Brier score, precision, and recall.</p>
//             </div>
//           </div>

//           <div style={{ padding: '0 24px 24px' }}>
//             {/* KS + Brier KPI row, alongside Gini/AUC already shown above for context */}
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
//               <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
//                 <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Gini (Current)</span>
//                 <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{metrics.gini != null ? metrics.gini.toFixed(3) : '—'}</div>
//               </div>
//               <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
//                 <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>AUC (Current)</span>
//                 <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{metrics.auc != null ? metrics.auc.toFixed(3) : '—'}</div>
//               </div>
//               <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', position: 'relative' }}>
//                 <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>KS Statistic</span>
//                 <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{ksStat != null ? ksStat.toFixed(1) : '—'}</div>
//                 <span style={{ fontSize: '11px', fontWeight: 700, color: ksInfo.color }}>{ksInfo.label}</span>
//               </div>
//               <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
//                 <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Brier Score</span>
//                 <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{brierScore != null ? brierScore.toFixed(4) : '—'}</div>
//                 <span style={{ fontSize: '11px', color: '#64748b' }}>Lower is better (0 = perfect)</span>
//               </div>
//             </div>

//             {/* Cross-quarter candidate comparison table */}
//             <h3 style={{ fontSize: '14px', color: '#334155', margin: '0 0 12px 0' }}>Candidate Comparison Across Quarters</h3>
//             {candidateComparisonRows.length > 0 ? (
//               <div style={{ overflowX: 'auto' }}>
//                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
//                   <thead>
//                     <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
//                       <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Quarter</th>
//                       <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Gini</th>
//                       <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>AUC</th>
//                       <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>KS</th>
//                       <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Brier</th>
//                       <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Precision</th>
//                       <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Recall</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {candidateComparisonRows.map((row) => {
//                       const cellStyle = (col, higherIsBetter = true) => {
//                         const val = row[col]
//                         const isBest = val != null && bestByColumn[col] != null && val === bestByColumn[col]
//                         return {
//                           padding: '10px 12px',
//                           fontWeight: isBest ? 800 : 500,
//                           color: isBest ? '#0f172a' : '#334155',
//                           background: isBest ? '#dbeafe' : 'transparent',
//                           borderRadius: isBest ? '6px' : 0,
//                         }
//                       }
//                       return (
//                         <tr key={row.quarter} style={{ borderBottom: '1px solid #e2e8f0', background: row.isLatest ? '#fafbff' : 'transparent' }}>
//                           <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
//                             {row.quarter} {row.isLatest && <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563eb', marginLeft: '6px' }}>CURRENT</span>}
//                           </td>
//                           <td style={cellStyle('gini')}>{row.gini != null ? row.gini.toFixed(3) : '—'}</td>
//                           <td style={cellStyle('auc')}>{row.auc != null ? row.auc.toFixed(3) : '—'}</td>
//                           <td style={cellStyle('ks')}>{row.ks != null ? row.ks.toFixed(1) : '—'}</td>
//                           <td style={cellStyle('brier')}>{row.brier != null ? row.brier.toFixed(4) : '—'}</td>
//                           <td style={cellStyle('precision')}>{row.precision != null ? row.precision.toFixed(3) : '—'}</td>
//                           <td style={cellStyle('recall')}>{row.recall != null ? row.recall.toFixed(3) : '—'}</td>
//                         </tr>
//                       )
//                     })}
//                   </tbody>
//                 </table>
//                 <p style={{ fontSize: '11px', color: '#94a3b8', margin: '10px 2px 0' }}>Highlighted cells mark the best-performing quarter for each metric. KS/Brier for earlier quarters will show "—" until the backend persists those fields into quarterly history.</p>
//               </div>
//             ) : <EmptyState icon="📋" message="No Quarters To Compare Yet" />}
//           </div>
//         </section>

//         {/* Large Line Charts */}
//         <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
//           <div className="card" style={{ flex: 1, padding: '24px' }}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Model Degradation (With Regulatory Alert Zones)</h3>
//             <div style={{ height: '250px' }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                   <XAxis dataKey="quarter" />
//                   <YAxis domain={[0, 1]} />
//                   <Tooltip />
//                   <Legend />
//                   <ReferenceArea y1={0.4} y2={1.0} fill="#d1fae5" fillOpacity={0.3} />
//                   <ReferenceArea y1={0.25} y2={0.4} fill="#fef08a" fillOpacity={0.3} />
//                   <ReferenceArea y1={0} y2={0.25} fill="#fee2e2" fillOpacity={0.3} />
//                   <Line type="monotone" dataKey="gini" stroke="#2563eb" strokeWidth={4} name="Gini" />
//                   <Line type="monotone" dataKey="auc" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="AUC" />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </div>

//           <div className="card" style={{ flex: 1, padding: '24px' }}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Macroeconomic Trend (Default Rate vs PD)</h3>
//             <div style={{ height: '250px' }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                   <XAxis dataKey="quarter" />
//                   <YAxis tickFormatter={(tick) => `${(tick * 100).toFixed(0)}%`} />
//                   <Tooltip formatter={(value) => `${(value * 100).toFixed(2)}%`} />
//                   <Legend />
//                   <Line type="monotone" dataKey="default_rate" stroke="#ef4444" strokeWidth={3} name="Actual Default Rate" />
//                   <Line type="monotone" dataKey="avg_pd" stroke="#f59e0b" strokeWidth={3} name="Predicted PD" />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         </div>

//         {/* NEW MACRO CHARTS: Risk Frontier & Velocity */}
//         <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          
//           <div className="card" style={{ flex: 1, padding: '24px' }}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>The Risk Frontier (Trajectory)</h3>
//             <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>Tracks the model moving from Safe (Top-Left) to Danger (Bottom-Right) over time.</p>
//             <div style={{ height: '250px' }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="defaultRate" type="number" name="Default Rate" tickFormatter={t => `${t.toFixed(0)}%`} label={{ value: 'Actual Default Rate', position: 'bottom', offset: 0 }} />
//                   <YAxis dataKey="gini" type="number" name="Gini" label={{ value: 'Gini Score', angle: -90, position: 'insideLeft' }} />
//                   <ZAxis dataKey="accounts" type="number" range={[100, 500]} name="Accounts" />
//                   <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(val, name) => name === 'Default Rate' ? `${val.toFixed(2)}%` : val.toLocaleString()} />
//                   <Scatter name="Quarters" data={trajectoryData} fill="#3b82f6" line={{stroke: '#94a3b8', strokeWidth: 2}} shape="circle" />
//                 </ScatterChart>
//               </ResponsiveContainer>
//             </div>
//           </div>

//           <div className="card" style={{ flex: 1, padding: '24px' }}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Degradation Velocity (QoQ Gini Drop)</h3>
//             <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>Shows the exact speed at which the model's accuracy is collapsing.</p>
//             <div style={{ height: '250px' }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={velocityData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                   <XAxis dataKey="quarter" />
//                   <YAxis />
//                   <Tooltip formatter={(value) => value.toFixed(3)} />
//                   <ReferenceArea y1={0} y2={0} stroke="#0f172a" />
//                   <Bar dataKey="change" name="Gini Change">
//                     {velocityData.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={entry.change < 0 ? '#ef4444' : '#10b981'} />
//                     ))}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </div>

//         </div>

//         {/* AI Validator Section */}
//         <div className="card" style={{ background: '#0f172a', color: '#fff', padding: '32px', borderRadius: '12px' }}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//             <div>
//               <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
//                 <span style={{ fontSize: '24px' }}>🤖</span> SR 11-7 AI Validator
//               </h2>
//               <p style={{ color: '#94a3b8', margin: 0, maxWidth: '600px' }}>
//                 Automated diagnostic on multi-quarter trend data. Evaluates concept drift and macro divergence.
//               </p>
//             </div>
//             <button 
//               onClick={handleRunAiValidator}
//               disabled={isAiLoading || history.length < 2}
//               style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', opacity: (isAiLoading || history.length < 2) ? 0.5 : 1 }}>
//               {isAiLoading ? 'Analyzing Drift...' : 'Generate Validator Report'}
//             </button>
//           </div>
//           {history.length < 2 && !aiReport && (
//             <div style={{ marginTop: '16px', color: '#f59e0b', fontSize: '13px' }}>* Upload at least 2 quarters of data to run the trend validator.</div>
//           )}
//           {aiReport && (
//             <div className="markdown-body" style={{ marginTop: '24px', background: '#1e293b', padding: '24px', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc', lineHeight: 1.6 }}>
//               <ReactMarkdown>{aiReport}</ReactMarkdown>
//             </div>
//           )}
//         </div>

//         {/* ── Documentation Drafting Agent ──────────────────────────────
//             Auto-generates a draft Model Development & Evidence Document:
//             objective, data summary, DQ results, features, constraints,
//             model comparison, explainability, fairness, limitations, and a
//             monitoring proposal — compiled from data already on this page. */}
//         <div className="card" style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '32px', borderRadius: '12px', marginTop: '24px' }}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
//             <div>
//               <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
//                 <span style={{ fontSize: '24px' }}>📄</span> Documentation Drafting Agent
//               </h2>
//               <p style={{ color: '#64748b', margin: 0, maxWidth: '600px' }}>
//                 Auto-generates a draft model development & evidence pack: objective, data summary, DQ results, features, constraints, model comparison, explainability, fairness, limitations, and monitoring proposal.
//               </p>
//             </div>
//             <div style={{ display: 'flex', gap: '12px' }}>
//               <button
//                 onClick={handleGenerateDocumentation}
//                 disabled={isDocLoading}
//                 style={{ padding: '12px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', opacity: isDocLoading ? 0.5 : 1 }}>
//                 {isDocLoading ? 'Drafting Document...' : (docReport ? 'Regenerate Draft' : 'Generate Documentation Draft')}
//               </button>
//               {docReport && (
//                 <button
//                   onClick={handleDownloadDocumentation}
//                   style={{ padding: '12px 20px', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
//                   Download .md
//                 </button>
//               )}
//             </div>
//           </div>

//           {docError && (
//             <div style={{ marginTop: '16px', color: '#ef4444', fontSize: '13px' }}>{docError}</div>
//           )}

//           {docReport && (
//             <div className="markdown-body" style={{ marginTop: '24px', background: '#f8fafc', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#0f172a', lineHeight: 1.6, maxHeight: '600px', overflowY: 'auto' }}>
//               <ReactMarkdown>{docReport}</ReactMarkdown>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ── SECTION 2: MICRO VIEW (LATEST QUARTER DEEP DIVE) ── */}
//       <div>
//         <h3 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
//           Micro View: Advanced Diagnostic Snapshot ({latestQ?.quarter || 'Current'})
//         </h3>

//         {/* ROW 1: Enhanced Confusion Matrix Heatmap (standalone — Radar moved to Macro View above) */}
//         <section className="card analytics-card" style={{ marginBottom: '24px' }}>
//           <div className="card-header analytics-card__header">
//             <div>
//               <h2>Enhanced Confusion Matrix Heatmap</h2>
//               <p>Color-density highlights where the model is making the most errors, weighted by share of total volume.</p>
//             </div>
//           </div>
//           <div style={{ padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
//             <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: '8px', alignItems: 'stretch' }}>
//               <div />
//               <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', paddingBottom: '4px' }}>Predicted: Good</div>
//               <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', paddingBottom: '4px' }}>Predicted: Bad</div>

//               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', paddingRight: '8px', textAlign: 'right' }}>
//                 Actual: Good
//               </div>
//               <div style={{ background: cellBackground(cm.tn, false), border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '110px' }}>
//                 <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>True Negatives</span>
//                 <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{cm.tn.toLocaleString()}</span>
//                 <span style={{ fontSize: '11px', color: '#475569' }}>{(tnRate * 100).toFixed(1)}% of Actual Good</span>
//               </div>
//               <div style={{ background: cellBackground(cm.fp, true), border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '110px' }}>
//                 <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>False Positives</span>
//                 <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{cm.fp.toLocaleString()}</span>
//                 <span style={{ fontSize: '11px', color: '#7f1d1d' }}>{(fpRate * 100).toFixed(1)}% of Actual Good</span>
//               </div>

//               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', paddingRight: '8px', textAlign: 'right' }}>
//                 Actual: Bad
//               </div>
//               <div style={{ background: cellBackground(cm.fn, true), border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '110px' }}>
//                 <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>False Negatives</span>
//                 <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{cm.fn.toLocaleString()}</span>
//                 <span style={{ fontSize: '11px', color: '#7f1d1d' }}>{(fnRate * 100).toFixed(1)}% of Actual Bad</span>
//               </div>
//               <div style={{ background: cellBackground(cm.tp, false), border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', minHeight: '110px' }}>
//                 <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>True Positives</span>
//                 <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{cm.tp.toLocaleString()}</span>
//                 <span style={{ fontSize: '11px', color: '#475569' }}>{(tpRate * 100).toFixed(1)}% of Actual Bad</span>
//               </div>
//             </div>

//             <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
//               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                 <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.6)', display: 'inline-block' }} />
//                 <span style={{ fontSize: '12px', color: '#475569' }}>Correct classification (darker = higher volume)</span>
//               </div>
//               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                 <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.6)', display: 'inline-block' }} />
//                 <span style={{ fontSize: '12px', color: '#475569' }}>Misclassification (darker = higher volume)</span>
//               </div>
//               <div style={{ fontSize: '12px', color: '#64748b', marginLeft: 'auto' }}>
//                 Total Scored: <strong style={{ color: '#0f172a' }}>{cmTotal.toLocaleString()}</strong>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* ROW 2: The Advanced Diagnostics (Calibration & Gains) */}
//         <div className="dashboard-grid dashboard-grid--two" style={{ marginBottom: '24px' }}>
//           <section className="card dashboard-panel">
//             <div className="card-header dashboard-panel__header">
//               <div><h2>Calibration Curve (Reliability)</h2><p>Tests if predicted probabilities match actual outcomes.</p></div>
//             </div>
//             <div style={{ height: '300px', padding: '24px 24px 0 0' }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={calibrationData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                   <XAxis dataKey="predicted_pd" type="number" domain={[0, 'dataMax']} tickFormatter={(t) => `${t.toFixed(0)}%`} label={{ value: 'Predicted PD', position: 'bottom', offset: 0 }} />
//                   <YAxis tickFormatter={(t) => `${t.toFixed(0)}%`} label={{ value: 'Actual Default Rate', angle: -90, position: 'insideLeft' }} />
//                   <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
//                   <Legend verticalAlign="top" />
//                   <Line type="monotone" dataKey="actual_pd" name="Model Calibration" stroke="#2563eb" strokeWidth={3} dot={{r: 4}} />
//                   <Line type="linear" dataKey="perfect_calibration" name="Perfect Calibration (45°)" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </section>

//           <section className="card dashboard-panel">
//             <div className="card-header dashboard-panel__header">
//               <div><h2>Cumulative Gains (Business Value)</h2><p>Shows % of total defaults captured by targeting risky deciles.</p></div>
//             </div>
//             <div style={{ height: '300px', padding: '24px 24px 0 0' }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={gainsData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                   <XAxis dataKey="pct_portfolio" tickFormatter={(t) => `${t}%`} label={{ value: '% of Portfolio Targeted', position: 'bottom', offset: 0 }} />
//                   <YAxis domain={[0, 100]} tickFormatter={(t) => `${t}%`} label={{ value: '% of Defaults Captured', angle: -90, position: 'insideLeft' }} />
//                   <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
//                   <Legend verticalAlign="top" />
//                   <Line type="monotone" dataKey="model_capture" name="Model Gains" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4}} />
//                   <Line type="linear" dataKey="random_capture" name="Random Guessing" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </section>
//         </div>

//         {/* ROW 3: Population Drift Overlap */}
//         <section className="card analytics-card" style={{ marginBottom: '24px' }}>
//           <div className="card-header analytics-card__header">
//             <div><h2>Population Stability (Data Drift vs Baseline)</h2><p>Overlapping distributions to visually detect macro portfolio shifts since Q1.</p></div>
//           </div>
//           <div style={{ height: '350px', padding: '0 24px 24px 0' }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart data={driftData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                 <XAxis dataKey="score_band" />
//                 <YAxis tickFormatter={(tick) => tick.toLocaleString()} />
//                 <Tooltip />
//                 <Legend />
//                 <Area type="monotone" dataKey="baseline_volume" name="Baseline (Q1) Volume" stroke="#94a3b8" fill="#e2e8f0" fillOpacity={0.6} />
//                 <Area type="monotone" dataKey="current_volume" name="Current Quarter Volume" stroke="#ef4444" fill="#fee2e2" fillOpacity={0.6} />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </section>

//         {/* ROW 4: Volume vs Risk Composed Chart */}
//         <section className="card analytics-card" style={{ marginBottom: '24px' }}>
//           <div className="card-header analytics-card__header">
//             <div><h2>Volume vs. Risk (Score Distribution)</h2><p>Bars show customer volume. The Red Line shows the default rate soaring in low score bands.</p></div>
//           </div>
//           {scoreBandData.length > 0 ? (
//             <div style={{ height: '350px', padding: '0 24px 24px 0' }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <ComposedChart data={scoreBandData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                   <XAxis dataKey="score_band" />
//                   <YAxis yAxisId="left" orientation="left" tickFormatter={(tick) => tick.toLocaleString()} />
//                   <YAxis yAxisId="right" orientation="right" tickFormatter={(tick) => `${tick}%`} />
//                   <Tooltip />
//                   <Legend />
//                   <Bar yAxisId="left" dataKey="customer_count" name="Total Customers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
//                   <Line yAxisId="right" type="monotone" dataKey="actual_bad_rate" name="Actual Bad Rate (%)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
//                 </ComposedChart>
//               </ResponsiveContainer>
//             </div>
//           ) : <EmptyState icon="📊" message="No Score Data" />}
//         </section>

//         {/* ROW 5: ROC & Gauge */}
//         <div className="dashboard-grid dashboard-grid--two">
//           <section className="card dashboard-panel">
//             <div className="card-header dashboard-panel__header">
//               <div><h2>ROC Curve</h2><p>Model ranking performance for default prediction.</p></div>
//             </div>
//             {analysisResult.roc_data ? <RocChart rocData={analysisResult.roc_data} auc={metrics.auc} /> : <EmptyState icon="📈" message="No ROC Data" />}
//           </section>

//           <section className="card dashboard-panel">
//             <div className="card-header dashboard-panel__header">
//               <div><h2>Risk Gauge</h2><p>Portfolio health overview based on current PD levels.</p></div>
//             </div>
//             {pdValues.length > 0 ? <RiskGauge pdValues={pdValues} /> : <EmptyState icon="⏱" message="No Gauge Data" />}
//           </section>
//         </div>

//       </div>

//       {/* ── Floating Model Risk Copilot Chat Widget ──────────────────────
//           General-purpose chat for the whole monitoring page (uses the
//           existing /chat endpoint, persona-aware) that can also kick off
//           the Documentation Drafting Agent via a quick action / phrase. */}
//       <FloatingCopilotChat
//         isOpen={isChatOpen}
//         setIsOpen={setIsChatOpen}
//         messages={chatMessages}
//         input={chatInput}
//         setInput={setChatInput}
//         isLoading={isChatLoading}
//         onSend={handleSendChatMessage}
//         onQuickDraft={() => { setChatInput('Draft the documentation'); }}
//         scrollRef={chatScrollRef}
//       />
//     </main>
//   )
// }

// // ── Floating Copilot Chat widget component ────────────────────────────
// function FloatingCopilotChat({ isOpen, setIsOpen, messages, input, setInput, isLoading, onSend, onQuickDraft, scrollRef }) {
//   useEffect(() => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollTop = scrollRef.current.scrollHeight
//     }
//   }, [messages, isOpen, scrollRef])

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault()
//       onSend()
//     }
//   }

//   return (
//     <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
//       {isOpen && (
//         <div style={{ width: '360px', height: '480px', background: '#fff', borderRadius: '16px', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.35)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
//           {/* Header */}
//           <div style={{ background: '#0f172a', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//             <div>
//               <div style={{ fontWeight: 700, fontSize: '14px' }}>Model Risk Copilot</div>
//               <div style={{ fontSize: '11px', color: '#94a3b8' }}>Credit Risk Analyst persona</div>
//             </div>
//             <button
//               onClick={() => setIsOpen(false)}
//               aria-label="Close chat"
//               style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>
//               ×
//             </button>
//           </div>

//           {/* Messages */}
//           <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc' }}>
//             {messages.map((m, i) => (
//               <div
//                 key={i}
//                 style={{
//                   alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
//                   maxWidth: '85%',
//                   background: m.role === 'user' ? '#2563eb' : '#fff',
//                   color: m.role === 'user' ? '#fff' : '#0f172a',
//                   border: m.role === 'user' ? 'none' : '1px solid #e2e8f0',
//                   borderRadius: '12px',
//                   padding: '10px 14px',
//                   fontSize: '13px',
//                   lineHeight: 1.5,
//                   whiteSpace: 'pre-wrap',
//                 }}>
//                 {m.content}
//               </div>
//             ))}
//             {isLoading && (
//               <div style={{ alignSelf: 'flex-start', maxWidth: '85%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#94a3b8' }}>
//                 Thinking...
//               </div>
//             )}
//           </div>

//           {/* Quick action */}
//           <div style={{ padding: '8px 16px 0', display: 'flex', gap: '8px' }}>
//             <button
//               onClick={onQuickDraft}
//               style={{ fontSize: '11px', fontWeight: 600, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '999px', padding: '6px 12px', cursor: 'pointer' }}>
//               📄 Draft the documentation
//             </button>
//           </div>

//           {/* Input */}
//           <div style={{ padding: '12px 16px 16px', display: 'flex', gap: '8px', borderTop: '1px solid #e2e8f0' }}>
//             <input
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={handleKeyDown}
//               placeholder="Ask about drift, metrics, or documentation..."
//               style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
//             />
//             <button
//               onClick={onSend}
//               disabled={isLoading || !input.trim()}
//               style={{ padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', opacity: (isLoading || !input.trim()) ? 0.5 : 1, fontSize: '13px' }}>
//               Send
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Toggle bubble */}
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         aria-label="Toggle Model Risk Copilot chat"
//         style={{
//           width: '56px', height: '56px', borderRadius: '50%', background: '#2563eb', color: '#fff',
//           border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.5)',
//           fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
//         }}>
//         {isOpen ? '×' : '💬'}
//       </button>
//     </div>
//   )
// }

