// import React, { useRef, useState, useEffect } from 'react'
// import { uploadDataQuality, downloadExecutivePDF, sendChatMessage } from '../services/api'
// import { 
//   ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ZAxis, Cell,
//   BarChart, Bar, PieChart, Pie, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend 
// } from 'recharts'

// // ── Helpers ──
// function formatCount(value) {
//   if (value == null || Number.isNaN(Number(value))) return '—'
//   return Number(value).toLocaleString()
// }

// function safeNum(value) {
//   const num = Number(value);
//   return Number.isNaN(num) ? 0 : num;
// }

// const SEVERITY_STYLES = {
//   Critical: { bg: '#fef2f2', text: '#b91c1c', border: '#fca5a5' },
//   High:     { bg: '#fff7ed', text: '#c2410c', border: '#fdba74' },
//   Medium:   { bg: '#fefce8', text: '#a16207', border: '#fde047' },
//   Low:      { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
// }

// function SeverityBadge({ severity }) {
//   const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Low
//   return (
//     <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: s.bg, color: s.text, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
//       {severity || 'Low'}
//     </span>
//   )
// }

// const CustomTooltip = ({ active, payload }) => {
//   if (active && payload && payload.length) {
//     const data = payload[0].payload;
//     return (
//       <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '13px' }}>
//         <strong style={{ color: '#0f172a', display: 'block', marginBottom: '6px' }}>{data.name || data.subject}</strong>
//         {data.count !== undefined && <span style={{ color: '#475569', display: 'block' }}>Count: <strong>{formatCount(data.count)}</strong></span>}
//         {data.x !== undefined && <span style={{ color: '#475569', display: 'block' }}>Impact: <strong>{data.x}%</strong></span>}
//         {data.value !== undefined && <span style={{ color: '#475569', display: 'block' }}>Value: <strong>{data.value}</strong></span>}
//       </div>
//     );
//   }
//   return null;
// }

// // ── Main Component ──
// export default function DataQualityAssessment() {
//   const fileInputRef = useRef(null)
//   const [selectedFile, setSelectedFile] = useState(null)
//   const [result, setResult] = useState(null)
//   const [isLoading, setIsLoading] = useState(false)
//   const [errorMessage, setErrorMessage] = useState('')
  
//   const [activeTab, setActiveTab] = useState('outliers') 
//   const [activeFeature, setActiveFeature] = useState(null)
//   const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

//   // Chatbot State
//   const [isChatOpen, setIsChatOpen] = useState(false)
//   const [chatInput, setChatInput] = useState('')
//   const [isChatLoading, setIsChatLoading] = useState(false)
//   const [chatMessages, setChatMessages] = useState([
//     { role: 'assistant', content: 'Hello! I am your AI MRM Auditor Copilot. Ask me about compliance risks or specific data features in this portfolio.' }
//   ])

//   const resultData = result?.data || result;

//   useEffect(() => {
//     if (!resultData) return;
//     try {
//       if (activeTab === 'outliers' && resultData.outlier_analysis?.length > 0) setActiveFeature(resultData.outlier_analysis[0].column);
//       else if (activeTab === 'missing' && resultData.missing_value_analysis?.length > 0) setActiveFeature(resultData.missing_value_analysis[0].column);
//       else if (activeTab === 'duplicates' && resultData.duplicate_analysis?.length > 0) setActiveFeature(resultData.duplicate_analysis[0].customer_id || 'Dup_01');
//       else setActiveFeature(null);
//     } catch (e) {
//       setActiveFeature(null);
//     }
//   }, [activeTab, resultData])

//   const handleFileChange = (e) => {
//     setSelectedFile(e.target.files?.[0] ?? null)
//     setErrorMessage('')
//   }

//   const handleRunAssessment = async () => {
//     if (!selectedFile) return setErrorMessage('Please upload a file first.')
//     setIsLoading(true); setErrorMessage('');
//     try {
//       const data = await uploadDataQuality(selectedFile)
//       setResult(data)
//     } catch (error) {
//       setErrorMessage(error.message || 'Assessment failed.')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleExportPDF = async () => {
//     if (!resultData) return;
//     setIsGeneratingPDF(true);
//     try {
//       await downloadExecutivePDF(resultData);
//     } catch (err) {
//       alert("Failed to export PDF.");
//     } finally {
//       setIsGeneratingPDF(false);
//     }
//   }

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!chatInput.trim() || isChatLoading) return;
//     const userMessage = { role: 'user', content: chatInput };
//     const newHistory = [...chatMessages, userMessage];
//     setChatMessages(newHistory); setChatInput(''); setIsChatLoading(true);
//     try {
//       const contextSummary = `Inspecting feature: ${activeFeature || 'None'}. Rows: ${resultData?.dataset_profile?.total_rows}.`;
//       const response = await sendChatMessage(newHistory, contextSummary);
//       setChatMessages([...newHistory, { role: 'assistant', content: response.reply }]);
//     } catch (err) {
//       setChatMessages([...newHistory, { role: 'assistant', content: '⚠️ Connection failed. Ensure backend is running.' }]);
//     } finally {
//       setIsChatLoading(false);
//     }
//   }

//   // ── DATA PREPARATION FOR VISUALIZATIONS ──
//   const aiAssessment = resultData?.ai_assessment || { executive_summary: "Awaiting AI insight generation..." };

//   // Chart 1: Scatter Data
//   const scatterData = (resultData?.outlier_analysis || []).map(d => ({
//     name: d.column || 'Unknown', x: safeNum(d.outlier_percentage), count: safeNum(d.outlier_count),
//     fill: safeNum(d.outlier_percentage) > 5 ? '#ef4444' : safeNum(d.outlier_percentage) > 1 ? '#f97316' : '#22c55e'
//   })).reverse();
//   const scatterMaxImpact = scatterData.length > 0 ? Math.max(10, ...scatterData.map(d => d.x)) : 10;

//   // Chart 2: Missing Bar Data
//   const missingBarData = (resultData?.missing_value_analysis || []).slice(0, 8).map(d => ({
//     name: d.column, value: safeNum(d.missing_percentage)
//   })).sort((a, b) => b.value - a.value);

//   // Chart 3: Severity Pie Data
//   let highRisk = 0, medRisk = 0, lowRisk = 0;
//   (resultData?.outlier_analysis || []).forEach(o => o.outlier_percentage > 5 ? highRisk++ : o.outlier_percentage > 1 ? medRisk++ : lowRisk++);
//   (resultData?.missing_value_analysis || []).forEach(m => (m.missing_percentage > 10 || m.severity === 'High') ? highRisk++ : medRisk++);
//   medRisk += (resultData?.duplicate_analysis?.length || 0);

//   const severityPieData = [
//     { name: 'High Risk', value: highRisk, color: '#ef4444' },
//     { name: 'Medium Risk', value: medRisk, color: '#f59e0b' },
//     { name: 'Low Risk', value: lowRisk, color: '#22c55e' }
//   ].filter(d => d.value > 0);

//   // Chart 4: Radar Data
//   const radarData = [
//     { subject: 'Completeness', score: Math.max(0, 100 - (resultData?.missing_value_analysis?.length * 2 || 0)) },
//     { subject: 'Uniqueness', score: Math.max(0, 100 - ((resultData?.duplicate_analysis?.length || 0) > 10 ? 20 : 0)) },
//     { subject: 'Stability', score: Math.max(0, 100 - (resultData?.outlier_analysis?.length * 2 || 0)) },
//     { subject: 'Validity', score: 84 },
//     { subject: 'Consistency', score: 90 }
//   ];

//   // Top Header Aggregations
//   const totalMissingValues = (resultData?.missing_value_analysis || []).reduce((acc, curr) => acc + safeNum(curr.missing_count), 0);
//   const totalDuplicates = resultData?.duplicate_analysis?.length || 0;

//   // List Data Logic
//   let listData = [];
//   if (activeTab === 'outliers') listData = resultData?.outlier_analysis || [];
//   if (activeTab === 'missing') listData = resultData?.missing_value_analysis || [];
//   if (activeTab === 'duplicates') listData = resultData?.duplicate_analysis || [];

//   const activeOutlierData = (resultData?.outlier_analysis || []).find(o => o.column === activeFeature);
//   const activeMissingData = (resultData?.missing_value_analysis || []).find(m => m.column === activeFeature);
//   const activeAIData = activeTab === 'duplicates' 
//     ? aiAssessment.ai_recommendations?.find(r => r.column === "DUPLICATES_GLOBAL")
//     : aiAssessment.ai_recommendations?.find(r => r.column === activeFeature);

//   const missingPct = activeMissingData ? safeNum(activeMissingData.missing_percentage) : 0;
//   const validPct = 100 - missingPct;

//   return (
//     <main style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '60px', overflowX: 'hidden' }}>

//       {!isLoading && !result && (
//         <div style={{ maxWidth: '800px', margin: '60px auto' }}>
//           <section style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
//             <h2 style={{ fontSize: '24px', color: '#0f172a', marginBottom: '8px' }}>Model Risk Data Assessment</h2>
//             <p style={{ color: '#64748b', marginBottom: '32px' }}>Upload a portfolio file to initiate the SR 11-7 compliance check.</p>
//             <input ref={fileInputRef} type="file" accept=".csv,.xlsx" onChange={handleFileChange} style={{ display: 'none' }} />
//             <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
//               <button onClick={() => fileInputRef.current?.click()} style={{ padding: '10px 20px', background: '#e2e8f0', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', border: 'none' }}>{selectedFile ? selectedFile.name : 'Choose File'}</button>
//               <button onClick={handleRunAssessment} disabled={isLoading || !selectedFile} style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', border: 'none', opacity: !selectedFile ? 0.5 : 1 }}>Run Matrix Audit</button>
//             </div>
//             {errorMessage && <p style={{ color: '#ef4444', marginTop: '16px', fontWeight: 600 }}>{errorMessage}</p>}
//           </section>
//         </div>
//       )}

//       {isLoading && (
//         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#475569' }}>
//           <div className="spinner" style={{ width: '40px', height: '40px', marginBottom: '16px' }} />
//           <h3>Executing AI Analysis...</h3>
//         </div>
//       )}

//       {result && (
//         <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
          
//           {/* 1. MASTER HEADER WITH DATA PROFILING */}
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '24px 32px', borderRadius: '12px', color: '#fff', marginBottom: '24px', flexWrap: 'wrap', gap: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            
//             <div style={{ flex: '1 1 200px' }}>
//               <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Asset Class: Retail Credit Risk</p>
//               <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{selectedFile?.name || 'Dataset'}</h1>
//             </div>

//             <div style={{ flex: '2 1 500px', display: 'flex', gap: '32px', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', padding: '0 32px', justifyContent: 'center' }}>
//               <div style={{ textAlign: 'center' }}>
//                 <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rows</p>
//                 <span style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{formatCount(resultData?.dataset_profile?.total_rows)}</span>
//               </div>
//               <div style={{ textAlign: 'center' }}>
//                 <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Columns</p>
//                 <span style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{formatCount(resultData?.dataset_profile?.total_columns)}</span>
//               </div>
//               <div style={{ textAlign: 'center' }}>
//                 <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Missing Values</p>
//                 <span style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>{formatCount(totalMissingValues)}</span>
//               </div>
//               <div style={{ textAlign: 'center' }}>
//                 <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duplicates</p>
//                 <span style={{ fontSize: '18px', fontWeight: 700, color: '#f97316' }}>{formatCount(totalDuplicates)}</span>
//               </div>
//             </div>

//             <div style={{ flex: '1 1 150px', textAlign: 'right' }}>
//               <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Overall Health</p>
//               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
//                 <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)' }} />
//                 <span style={{ fontSize: '24px', fontWeight: 800, color: '#fcd34d' }}>84%</span>
//               </div>
//             </div>
//           </div>

//           <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
//             <div style={{ flex: 1, background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #f59e0b' }}>
//               <h3 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compliance Risk</h3>
//               <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Moderate (Amber) - Review Recommended</p>
//             </div>
//             <div style={{ flex: 1, background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6' }}>
//               <h3 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Downstream Impact</h3>
//               <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>IFRS 9 Expected Credit Loss Engines</p>
//             </div>
//           </div>

//           {/* 2. 2x2 VISUALIZATION COMMAND CENTER */}
//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            
//             {/* Chart 2: Missing Bar */}
//             <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
//               <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a', textTransform: 'uppercase' }}>Top Missing Data Features</h3>
//               <div style={{ width: '100%', height: '220px' }}>
//                 {missingBarData.length > 0 ? (
//                   <ResponsiveContainer>
//                     <BarChart layout="vertical" data={missingBarData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
//                       <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
//                       <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
//                       <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#334155' }} width={80} axisLine={false} tickLine={false} />
//                       <Tooltip formatter={(val) => [`${val}%`, 'Missing Rate']} />
//                       <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
//                     </BarChart>
//                   </ResponsiveContainer>
//                 ) : (
//                   <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>No missing data detected.</div>
//                 )}
//               </div>
//             </div>            
//             {/* Chart 1: Scatter */}
//             <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
//               <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a', textTransform: 'uppercase' }}>Anomaly Spread (Z-Score &gt; 3.0)</h3>
//               <div style={{ width: '100%', height: '220px' }}>
//                 <ResponsiveContainer>
//                   <ScatterChart margin={{ top: 10, right: 20, bottom: 0, left: 20 }}>
//                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//                     <XAxis type="number" dataKey="x" unit="%" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fontSize: 11, fill: '#64748b' }} />
//                     <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#334155' }} width={80} />
//                     <ZAxis type="number" dataKey="count" range={[40, 150]} />
//                     <ReferenceArea x1={0} x2={1} fill="#dcfce7" fillOpacity={0.3} />
//                     <ReferenceArea x1={1} x2={5} fill="#ffedd5" fillOpacity={0.3} />
//                     <ReferenceArea x1={5} x2={scatterMaxImpact} fill="#fee2e2" fillOpacity={0.3} />
//                     <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
//                     <Scatter data={scatterData}>{scatterData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Scatter>
//                   </ScatterChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             {/* Chart 3: Radar Chart */}
//             <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
//               <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a', textTransform: 'uppercase' }}>SR 11-7 Quality Dimensions</h3>
//               <div style={{ width: '100%', height: '220px', display: 'flex', justifyContent: 'center' }}>
//                 <ResponsiveContainer width="80%" height="100%">
//                   <RadarChart outerRadius={70} data={radarData}>
//                     <PolarGrid stroke="#e2e8f0" />
//                     <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} />
//                     <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
//                     <Tooltip formatter={(val) => [`${val}/100`, 'Score']} />
//                     <Radar name="Quality Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
//                   </RadarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             {/* Chart 4: Severity Donut */}
//             <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
//               <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a', textTransform: 'uppercase' }}>Issue Severity Breakdown</h3>
//               <div style={{ width: '100%', height: '220px' }}>
//                 <ResponsiveContainer>
//                   <PieChart>
//                     <Pie data={severityPieData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
//                       {severityPieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
//                     </Pie>
//                     <Tooltip formatter={(val) => [val, 'Issues']} />
//                     <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#475569' }} />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//           </div>

//           {/* 3. SPLIT WORKSPACE */}
//           <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
//             <div style={{ flex: '1 1 400px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
//               <div style={{ display: 'flex', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
//                 <button onClick={() => setActiveTab('outliers')} style={{ flex: 1, padding: '14px 0', background: activeTab === 'outliers' ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === 'outliers' ? '2px solid #2563eb' : '2px solid transparent', fontWeight: 700, fontSize: '13px', color: activeTab === 'outliers' ? '#2563eb' : '#64748b', cursor: 'pointer' }}>
//                   Outliers ({resultData?.outlier_analysis?.length || 0})
//                 </button>
//                 <button onClick={() => setActiveTab('missing')} style={{ flex: 1, padding: '14px 0', background: activeTab === 'missing' ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === 'missing' ? '2px solid #2563eb' : '2px solid transparent', fontWeight: 700, fontSize: '13px', color: activeTab === 'missing' ? '#2563eb' : '#64748b', cursor: 'pointer' }}>
//                   Missing Data ({resultData?.missing_value_analysis?.length || 0})
//                 </button>
//                 <button onClick={() => setActiveTab('duplicates')} style={{ flex: 1, padding: '14px 0', background: activeTab === 'duplicates' ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === 'duplicates' ? '2px solid #2563eb' : '2px solid transparent', fontWeight: 700, fontSize: '13px', color: activeTab === 'duplicates' ? '#2563eb' : '#64748b', cursor: 'pointer' }}>
//                   Duplicates ({resultData?.duplicate_analysis?.length || 0})
//                 </button>
//               </div>
//               <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
//                 {listData.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>No issues found.</div>}
//                 {listData.map((item, idx) => {
//                   let featureName = '';
//                   let metric1 = '';
//                   let metric2 = '';
//                   let sev = 'Low';

//                   if (activeTab === 'outliers') {
//                     featureName = item.column || 'Unknown';
//                     metric1 = `Anomalies: ${formatCount(item.outlier_count)}`;
//                     metric2 = `Impact: ${safeNum(item.outlier_percentage)}%`;
//                     sev = safeNum(item.outlier_percentage) > 5 ? 'High' : safeNum(item.outlier_percentage) > 1 ? 'Medium' : 'Low';
//                   } else if (activeTab === 'missing') {
//                     featureName = item.column || 'Unknown';
//                     metric1 = `Missing: ${formatCount(item.missing_count)}`;
//                     metric2 = `Rate: ${safeNum(item.missing_percentage)}%`;
//                     sev = item.severity || (safeNum(item.missing_percentage) > 10 ? 'High' : 'Medium');
//                   } else if (activeTab === 'duplicates') {
//                     featureName = item.customer_id || `Row ${idx + 1}`;
//                     metric1 = 'Duplicate Record';
//                     metric2 = '';
//                     sev = 'Medium';
//                   }

//                   const isActive = activeFeature === featureName;
//                   return (
//                     <div key={idx} onClick={() => setActiveFeature(featureName)} style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: isActive ? '#eff6ff' : '#fff', borderLeft: isActive ? '4px solid #2563eb' : '4px solid transparent' }}>
//                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
//                         <span style={{ fontWeight: 700, color: isActive ? '#1e40af' : '#0f172a', fontSize: '14px' }}>{featureName}</span>
//                         <SeverityBadge severity={sev} />
//                       </div>
//                       <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#475569' }}>
//                         <span>{metric1}</span>
//                         {metric2 && <span><strong>{metric2}</strong></span>}
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>
//             </div>

//             <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
//               <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
//                 <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#0f172a', textTransform: 'uppercase' }}>✨ AI Materiality Assessment</h3>
//                 <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.6, fontWeight: 500 }}>{aiAssessment.executive_summary}</p>
//               </div>

//               {activeFeature && (
//                 <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
//                   <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
//                     <h3 style={{ margin: 0, fontSize: '15px' }}>Remediation Dossier: {activeTab === 'duplicates' ? 'Global Deduplication' : activeFeature}</h3>
//                   </div>
                  
//                   <div style={{ padding: '24px' }}>
//                     <div style={{ padding: '16px', background: '#f1f5f9', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '24px' }}>
//                       <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Standard Rule-Based Baseline</span>
//                       <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
//                         {activeTab === 'outliers' && 'Remove rows containing statistical outliers (Z-Score > 3.0) to normalize distribution.'}
//                         {activeTab === 'missing' && 'Apply generic mean imputation or drop records containing null values.'}
//                         {activeTab === 'duplicates' && 'Drop all identical rows keeping only the first instance.'}
//                       </p>
//                     </div>

//                     <div style={{ padding: '20px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
//                         <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', background: '#dbeafe', padding: '4px 10px', borderRadius: '999px' }}>✨ AI Override Strategy</span>
//                         <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
//                           {activeAIData ? activeAIData.strategy : 'No Actionable Override Generated'}
//                         </span>
//                       </div>
//                       <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
//                         <strong style={{ color: '#0f172a' }}>Justification:</strong> {activeAIData ? activeAIData.justification : 'The baseline statistical rule is sufficient or the AI model has not provided explicit instructions for this feature.'}
//                       </p>

//                       {activeTab === 'outliers' && activeOutlierData && (
//                         <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #bfdbfe', display: 'flex', gap: '32px' }}>
//                           <div>
//                             <span style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Suggested Lower Floor</span>
//                             <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>≥ {formatCount(activeOutlierData.suggested_cap_lower)}</span>
//                           </div>
//                           <div>
//                             <span style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Suggested Upper Cap</span>
//                             <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>≤ {formatCount(activeOutlierData.suggested_cap_upper)}</span>
//                           </div>
//                         </div>
//                       )}

//                       {activeTab === 'missing' && activeMissingData && (
//                         <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #bfdbfe' }}>
//                           <span style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Feature Completeness Matrix</span>
//                           <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
//                             <div style={{ width: `${validPct}%`, background: '#22c55e', height: '100%' }} title={`Valid: ${validPct}%`} />
//                             <div style={{ width: `${missingPct}%`, background: '#ef4444', height: '100%' }} title={`Missing: ${missingPct}%`} />
//                           </div>
//                           <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#475569', fontWeight: 600 }}>
//                             <span>{validPct.toFixed(2)}% Intact</span>
//                             <span style={{ color: '#ef4444' }}>{missingPct.toFixed(2)}% Missing Block</span>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* 4. THE ACTION FOOTER */}
//           <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//             <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>Ready to proceed with Model Training?</h3>
//             <button 
//               onClick={handleExportPDF} 
//               disabled={isGeneratingPDF} 
//               style={{ padding: '16px 32px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.2s', opacity: isGeneratingPDF ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '12px' }}
//             >
//               <span style={{ fontSize: '18px' }}>📄</span> 
//               {isGeneratingPDF ? 'Generating AI PDF Report...' : 'Download Executive Audit Report'}
//             </button>
//             <p style={{ marginTop: '12px', fontSize: '13px', color: '#64748b' }}>Includes full AI justifications and SR 11-7 compliance logs.</p>
//           </div>

//         </div>
//       )}

//       {/* ── COPILOT CHAT UI ── */}
//       {result && (
//         <button onClick={() => setIsChatOpen(!isChatOpen)} style={{ position: 'fixed', right: '24px', bottom: '32px', zIndex: 1000, background: '#2563eb', color: '#fff', border: 'none', borderRadius: '50px', padding: '14px 24px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}>
//           💬 {isChatOpen ? 'Close Copilot' : 'Ask Auditor Copilot'}
//         </button>
//       )}

//       <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '380px', background: '#fff', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)', zIndex: 999, transform: isChatOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column' }}>
//         <div style={{ padding: '24px', background: '#0f172a', color: '#fff' }}>
//           <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><span>✨</span> AI Auditor Copilot</h3>
//         </div>
//         <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
//           {chatMessages.map((msg, idx) => (
//             <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', background: msg.role === 'user' ? '#2563eb' : '#fff', color: msg.role === 'user' ? '#fff' : '#0f172a', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
//               {msg.content}
//             </div>
//           ))}
//           {isChatLoading && <div style={{ alignSelf: 'flex-start', fontSize: '12px', color: '#64748b' }}>Thinking...</div>}
//         </div>
//         <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
//           <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
//             <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} disabled={isChatLoading} placeholder="Ask a question..." style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
//             <button type="submit" disabled={isChatLoading} style={{ padding: '10px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Send</button>
//           </form>
//         </div>
//       </div>
//     </main>
//   )
// }

import React, { useRef, useState, useEffect } from 'react'
import { uploadDataQuality, downloadExecutivePDF, sendChatMessage } from '../services/api'
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ZAxis, Cell,
  BarChart, Bar, PieChart, Pie, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend 
} from 'recharts'

// ── Helpers ──
function formatCount(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString()
}

function safeNum(value) {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}

const SEVERITY_STYLES = {
  Critical: { bg: '#fef2f2', text: '#b91c1c', border: '#fca5a5' },
  High:     { bg: '#fff7ed', text: '#c2410c', border: '#fdba74' },
  Medium:   { bg: '#fefce8', text: '#a16207', border: '#fde047' },
  Low:      { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
}

function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Low
  return (
    <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: s.bg, color: s.text, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {severity || 'Low'}
    </span>
  )
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '13px' }}>
        <strong style={{ color: '#0f172a', display: 'block', marginBottom: '6px' }}>{data.name || data.subject}</strong>
        {data.count !== undefined && <span style={{ color: '#475569', display: 'block' }}>Count: <strong>{formatCount(data.count)}</strong></span>}
        {data.x !== undefined && <span style={{ color: '#475569', display: 'block' }}>Impact: <strong>{data.x}%</strong></span>}
        {data.value !== undefined && <span style={{ color: '#475569', display: 'block' }}>Value: <strong>{data.value}</strong></span>}
      </div>
    );
  }
  return null;
}

// ── Main Component ──
export default function DataQualityAssessment() {
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  const [activeTab, setActiveTab] = useState('outliers') 
  const [activeFeature, setActiveFeature] = useState(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // ── Chatbot State ──
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI MRM Auditor Copilot. Select a quick prompt below or ask me a specific question about the dataset.' }
  ])

  // Suggested Quick Prompts
  const QUICK_PROMPTS = [
    "Summarize the main data risks.",
    "Explain the SR 11-7 compliance impacts.",
    "Why are the missing values problematic?",
    "What is the overall dataset health?"
  ];

  const resultData = result?.data || result;

  useEffect(() => {
    if (!resultData) return;
    try {
      if (activeTab === 'outliers' && resultData.outlier_analysis?.length > 0) setActiveFeature(resultData.outlier_analysis[0].column);
      else if (activeTab === 'missing' && resultData.missing_value_analysis?.length > 0) setActiveFeature(resultData.missing_value_analysis[0].column);
      else if (activeTab === 'duplicates' && resultData.duplicate_analysis?.length > 0) setActiveFeature(resultData.duplicate_analysis[0].customer_id || 'Dup_01');
      else setActiveFeature(null);
    } catch (e) {
      setActiveFeature(null);
    }
  }, [activeTab, resultData])

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files?.[0] ?? null)
    setErrorMessage('')
  }

  const handleRunAssessment = async () => {
    if (!selectedFile) return setErrorMessage('Please upload a file first.')
    setIsLoading(true); setErrorMessage('');
    try {
      const data = await uploadDataQuality(selectedFile)
      setResult(data)
    } catch (error) {
      setErrorMessage(error.message || 'Assessment failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!resultData) return;
    setIsGeneratingPDF(true);
    try {
      await downloadExecutivePDF(resultData);
    } catch (err) {
      alert("Failed to export PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  // Handle standard typing send
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    await processChat(chatInput);
  }

  // Handle Quick Prompt click (Auto-send)
  const handleQuickPrompt = async (promptText) => {
    if (isChatLoading) return;
    await processChat(promptText);
  }

  // Extracted core chat logic
  const processChat = async (messageText) => {
    const userMessage = { role: 'user', content: messageText };
    const newHistory = [...chatMessages, userMessage];
    setChatMessages(newHistory); 
    setChatInput(''); 
    setIsChatLoading(true);
    try {
      const contextSummary = `Inspecting feature: ${activeFeature || 'None'}. Rows: ${resultData?.dataset_profile?.total_rows}.`;
      const response = await sendChatMessage(newHistory, contextSummary);
      setChatMessages([...newHistory, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      setChatMessages([...newHistory, { role: 'assistant', content: '⚠️ Connection failed. Ensure backend is running.' }]);
    } finally {
      setIsChatLoading(false);
    }
  }

  // ── DATA PREPARATION FOR VISUALIZATIONS ──
  const aiAssessment = resultData?.ai_assessment || { executive_summary: "Awaiting AI insight generation..." };

  const scatterData = (resultData?.outlier_analysis || []).map(d => ({
    name: d.column || 'Unknown', x: safeNum(d.outlier_percentage), count: safeNum(d.outlier_count),
    fill: safeNum(d.outlier_percentage) > 5 ? '#ef4444' : safeNum(d.outlier_percentage) > 1 ? '#f97316' : '#22c55e'
  })).reverse();
  const scatterMaxImpact = scatterData.length > 0 ? Math.max(10, ...scatterData.map(d => d.x)) : 10;

  const missingBarData = (resultData?.missing_value_analysis || []).slice(0, 8).map(d => ({
    name: d.column, value: safeNum(d.missing_percentage)
  })).sort((a, b) => b.value - a.value);

  let highRisk = 0, medRisk = 0, lowRisk = 0;
  (resultData?.outlier_analysis || []).forEach(o => o.outlier_percentage > 5 ? highRisk++ : o.outlier_percentage > 1 ? medRisk++ : lowRisk++);
  (resultData?.missing_value_analysis || []).forEach(m => (m.missing_percentage > 10 || m.severity === 'High') ? highRisk++ : medRisk++);
  medRisk += (resultData?.duplicate_analysis?.length || 0);

  const severityPieData = [
    { name: 'High Risk', value: highRisk, color: '#ef4444' },
    { name: 'Medium Risk', value: medRisk, color: '#f59e0b' },
    { name: 'Low Risk', value: lowRisk, color: '#22c55e' }
  ].filter(d => d.value > 0);

  const radarData = [
    { subject: 'Completeness', score: Math.max(0, 100 - (resultData?.missing_value_analysis?.length * 2 || 0)) },
    { subject: 'Uniqueness', score: Math.max(0, 100 - ((resultData?.duplicate_analysis?.length || 0) > 10 ? 20 : 0)) },
    { subject: 'Stability', score: Math.max(0, 100 - (resultData?.outlier_analysis?.length * 2 || 0)) },
    { subject: 'Validity', score: 84 },
    { subject: 'Consistency', score: 90 }
  ];

  const totalMissingValues = (resultData?.missing_value_analysis || []).reduce((acc, curr) => acc + safeNum(curr.missing_count), 0);
  const totalDuplicates = resultData?.duplicate_analysis?.length || 0;

  let listData = [];
  if (activeTab === 'outliers') listData = resultData?.outlier_analysis || [];
  if (activeTab === 'missing') listData = resultData?.missing_value_analysis || [];
  if (activeTab === 'duplicates') listData = resultData?.duplicate_analysis || [];

  const activeOutlierData = (resultData?.outlier_analysis || []).find(o => o.column === activeFeature);
  const activeMissingData = (resultData?.missing_value_analysis || []).find(m => m.column === activeFeature);
  const activeAIData = activeTab === 'duplicates' 
    ? aiAssessment.ai_recommendations?.find(r => r.column === "DUPLICATES_GLOBAL")
    : aiAssessment.ai_recommendations?.find(r => r.column === activeFeature);

  const missingPct = activeMissingData ? safeNum(activeMissingData.missing_percentage) : 0;
  const validPct = 100 - missingPct;

  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '60px', overflowX: 'hidden' }}>

      {!isLoading && !result && (
        <div style={{ maxWidth: '800px', margin: '60px auto' }}>
          <section style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '24px', color: '#0f172a', marginBottom: '8px' }}>Model Risk Data Assessment</h2>
            <p style={{ color: '#64748b', marginBottom: '32px' }}>Upload a portfolio file to initiate the SR 11-7 compliance check.</p>
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx" onChange={handleFileChange} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button onClick={() => fileInputRef.current?.click()} style={{ padding: '10px 20px', background: '#e2e8f0', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', border: 'none' }}>{selectedFile ? selectedFile.name : 'Choose File'}</button>
              <button onClick={handleRunAssessment} disabled={isLoading || !selectedFile} style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', border: 'none', opacity: !selectedFile ? 0.5 : 1 }}>Run Matrix Audit</button>
            </div>
            {errorMessage && <p style={{ color: '#ef4444', marginTop: '16px', fontWeight: 600 }}>{errorMessage}</p>}
          </section>
        </div>
      )}

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#475569' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', marginBottom: '16px' }} />
          <h3>Executing AI Analysis...</h3>
        </div>
      )}

      {result && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
          
          {/* MASTER HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '24px 32px', borderRadius: '12px', color: '#fff', marginBottom: '24px', flexWrap: 'wrap', gap: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ flex: '1 1 200px' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Asset Class: Retail Credit Risk</p>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{selectedFile?.name || 'Dataset'}</h1>
            </div>
            <div style={{ flex: '2 1 500px', display: 'flex', gap: '32px', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', padding: '0 32px', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rows</p>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{formatCount(resultData?.dataset_profile?.total_rows)}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Columns</p>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>{formatCount(resultData?.dataset_profile?.total_columns)}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Missing Values</p>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>{formatCount(totalMissingValues)}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duplicates</p>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#f97316' }}>{formatCount(totalDuplicates)}</span>
              </div>
            </div>
            <div style={{ flex: '1 1 150px', textAlign: 'right' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Overall Health</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)' }} />
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#fcd34d' }}>84%</span>
              </div>
            </div>
          </div>

          {/* REGULATORY BANNERS */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
            <div style={{ flex: 1, background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #f59e0b' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compliance Risk</h3>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Moderate (Amber) - Review Recommended</p>
            </div>
            <div style={{ flex: 1, background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Downstream Impact</h3>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>IFRS 9 Expected Credit Loss Engines</p>
            </div>
          </div>

          {/* 2x2 VISUALIZATION COMMAND CENTER */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            {/* Chart 1: Scatter */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a', textTransform: 'uppercase' }}>Anomaly Spread (Z-Score &gt; 3.0)</h3>
              <div style={{ width: '100%', height: '220px' }}>
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 0, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="x" unit="%" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#334155' }} width={80} />
                    <ZAxis type="number" dataKey="count" range={[40, 150]} />
                    <ReferenceArea x1={0} x2={1} fill="#dcfce7" fillOpacity={0.3} />
                    <ReferenceArea x1={1} x2={5} fill="#ffedd5" fillOpacity={0.3} />
                    <ReferenceArea x1={5} x2={scatterMaxImpact} fill="#fee2e2" fillOpacity={0.3} />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={scatterData}>{scatterData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Chart 2: Missing Bar */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a', textTransform: 'uppercase' }}>Top Missing Data Features</h3>
              <div style={{ width: '100%', height: '220px' }}>
                {missingBarData.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart layout="vertical" data={missingBarData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#334155' }} width={80} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(val) => [`${val}%`, 'Missing Rate']} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>No missing data detected.</div>
                )}
              </div>
            </div>
            {/* Chart 3: Radar Chart */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a', textTransform: 'uppercase' }}>SR 11-7 Quality Dimensions</h3>
              <div style={{ width: '100%', height: '220px', display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="80%" height="100%">
                  <RadarChart outerRadius={70} data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip formatter={(val) => [`${val}/100`, 'Score']} />
                    <Radar name="Quality Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Chart 4: Severity Donut */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a', textTransform: 'uppercase' }}>Issue Severity Breakdown</h3>
              <div style={{ width: '100%', height: '220px' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={severityPieData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                      {severityPieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(val) => [val, 'Issues']} />
                    <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#475569' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* SPLIT WORKSPACE */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 400px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                <button onClick={() => setActiveTab('outliers')} style={{ flex: 1, padding: '14px 0', background: activeTab === 'outliers' ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === 'outliers' ? '2px solid #2563eb' : '2px solid transparent', fontWeight: 700, fontSize: '13px', color: activeTab === 'outliers' ? '#2563eb' : '#64748b', cursor: 'pointer' }}>
                  Outliers ({resultData?.outlier_analysis?.length || 0})
                </button>
                <button onClick={() => setActiveTab('missing')} style={{ flex: 1, padding: '14px 0', background: activeTab === 'missing' ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === 'missing' ? '2px solid #2563eb' : '2px solid transparent', fontWeight: 700, fontSize: '13px', color: activeTab === 'missing' ? '#2563eb' : '#64748b', cursor: 'pointer' }}>
                  Missing Data ({resultData?.missing_value_analysis?.length || 0})
                </button>
                <button onClick={() => setActiveTab('duplicates')} style={{ flex: 1, padding: '14px 0', background: activeTab === 'duplicates' ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === 'duplicates' ? '2px solid #2563eb' : '2px solid transparent', fontWeight: 700, fontSize: '13px', color: activeTab === 'duplicates' ? '#2563eb' : '#64748b', cursor: 'pointer' }}>
                  Duplicates ({resultData?.duplicate_analysis?.length || 0})
                </button>
              </div>
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {listData.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>No issues found.</div>}
                {listData.map((item, idx) => {
                  let featureName = activeTab === 'outliers' ? item.column : activeTab === 'missing' ? item.column : item.customer_id || `Row ${idx + 1}`;
                  let metric1 = activeTab === 'outliers' ? `Anomalies: ${formatCount(item.outlier_count)}` : activeTab === 'missing' ? `Missing: ${formatCount(item.missing_count)}` : 'Duplicate Record';
                  let metric2 = activeTab === 'outliers' ? `Impact: ${safeNum(item.outlier_percentage)}%` : activeTab === 'missing' ? `Rate: ${safeNum(item.missing_percentage)}%` : '';
                  let sev = activeTab === 'outliers' ? (safeNum(item.outlier_percentage) > 5 ? 'High' : 'Medium') : activeTab === 'missing' ? (safeNum(item.missing_percentage) > 10 ? 'High' : 'Medium') : 'Medium';
                  const isActive = activeFeature === featureName;

                  return (
                    <div key={idx} onClick={() => setActiveFeature(featureName)} style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: isActive ? '#eff6ff' : '#fff', borderLeft: isActive ? '4px solid #2563eb' : '4px solid transparent' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, color: isActive ? '#1e40af' : '#0f172a', fontSize: '14px' }}>{featureName}</span>
                        <SeverityBadge severity={sev} />
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#475569' }}>
                        <span>{metric1}</span>
                        {metric2 && <span><strong>{metric2}</strong></span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#0f172a', textTransform: 'uppercase' }}>✨ AI Materiality Assessment</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.6, fontWeight: 500 }}>{aiAssessment.executive_summary}</p>
              </div>

              {activeFeature && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: 0, fontSize: '15px' }}>Remediation Dossier: {activeTab === 'duplicates' ? 'Global Deduplication' : activeFeature}</h3>
                  </div>
                  
                  <div style={{ padding: '24px' }}>
                    <div style={{ padding: '16px', background: '#f1f5f9', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '24px' }}>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Standard Rule-Based Baseline</span>
                      <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                        {activeTab === 'outliers' && 'Remove rows containing statistical outliers (Z-Score > 3.0) to normalize distribution.'}
                        {activeTab === 'missing' && 'Apply generic mean imputation or drop records containing null values.'}
                        {activeTab === 'duplicates' && 'Drop all identical rows keeping only the first instance.'}
                      </p>
                    </div>

                    <div style={{ padding: '20px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', background: '#dbeafe', padding: '4px 10px', borderRadius: '999px' }}>✨ AI Override Strategy</span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                          {activeAIData ? activeAIData.strategy : 'No Actionable Override Generated'}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
                        <strong style={{ color: '#0f172a' }}>Justification:</strong> {activeAIData ? activeAIData.justification : 'The baseline statistical rule is sufficient or the AI model has not provided explicit instructions for this feature.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ACTION FOOTER */}
          <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>Ready to proceed with Model Training?</h3>
            <button 
              onClick={handleExportPDF} 
              disabled={isGeneratingPDF} 
              style={{ padding: '16px 32px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.2s', opacity: isGeneratingPDF ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <span style={{ fontSize: '18px' }}>📄</span> 
              {isGeneratingPDF ? 'Generating AI PDF Report...' : 'Download Executive Audit Report'}
            </button>
          </div>
        </div>
      )}

      {/* ── NEW MODERN COPILOT CHAT UI ── */}
      {/* Floating button (Only shows when chat is CLOSED) */}
      {result && !isChatOpen && (
        <button onClick={() => setIsChatOpen(true)} style={{ position: 'fixed', right: '24px', bottom: '32px', zIndex: 1000, background: '#2563eb', color: '#fff', border: 'none', borderRadius: '50px', padding: '14px 24px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 15px rgba(37,99,235,0.3)', transition: 'transform 0.2s' }}>
          💬 Ask Auditor Copilot
        </button>
      )}

      {/* Chat Drawer */}
      <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '400px', background: '#fff', boxShadow: '-8px 0 20px rgba(0,0,0,0.15)', zIndex: 1001, transform: isChatOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header with standard close button */}
        <div style={{ padding: '20px 24px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>✨</span> Auditor Copilot
          </h3>
          <button onClick={() => setIsChatOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>&times;</button>
        </div>

        {/* Message Area */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {chatMessages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              {/* Avatar */}
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.role === 'user' ? '#dbeafe' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              {/* Bubble */}
              <div style={{ background: msg.role === 'user' ? '#2563eb' : '#fff', color: msg.role === 'user' ? '#fff' : '#0f172a', padding: '14px 18px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: '13.5px', lineHeight: 1.5, border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', maxWidth: '80%' }}>
                {msg.content}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
               <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Analyzing data...</div>
            </div>
          )}
        </div>

        {/* Input Area with Quick Prompts */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
          
          {/* Scrollable Quick Prompts */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button 
                key={idx} 
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isChatLoading}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '999px', fontSize: '12px', color: '#334155', whiteSpace: 'nowrap', cursor: isChatLoading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              disabled={isChatLoading} 
              placeholder="Type your question..." 
              style={{ flex: 1, padding: '12px 16px', borderRadius: '999px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', background: '#f8fafc' }} 
            />
            <button 
              type="submit" 
              disabled={isChatLoading} 
              style={{ width: '44px', height: '44px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isChatLoading ? 0.6 : 1 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}