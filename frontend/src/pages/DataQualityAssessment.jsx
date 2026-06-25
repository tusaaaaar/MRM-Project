import React, { useRef, useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown' 
import { uploadDataQuality, downloadExecutivePDF, sendChatMessage, generateFeatureDossier } from '../services/api'
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ZAxis, Cell,
  BarChart, Bar, PieChart, Pie, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend 
} from 'recharts'

import { API_BASE_URL } from '../config';

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
  High:     { bg: '#fff7ed', text: '#dc2626', border: '#fca5a5' },
  Medium:   { bg: '#fefce8', text: '#d97706', border: '#fde047' },
  Low:      { bg: '#f0fdf4', text: '#059669', border: '#86efac' },
}

function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Low
  return (
    <span
      className="dqa-severity-badge"
      style={{
        '--severity-bg': s.bg,
        '--severity-text': s.text,
        '--severity-border': s.border,
      }}
    >
      {severity || 'Low'}
    </span>
  )
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="dqa-tooltip">
        <strong className="dqa-tooltip__title">{data.name || data.subject}</strong>
        {data.count !== undefined && <span className="dqa-tooltip__line">Count: <strong>{formatCount(data.count)}</strong></span>}
        {data.x !== undefined && <span className="dqa-tooltip__line">Impact: <strong>{data.x}%</strong></span>}
        {data.value !== undefined && <span className="dqa-tooltip__line">Value: <strong>{data.value}</strong></span>}
      </div>
    )
  }
  return null
}

export default function DataQualityAssessment() {
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  const [activeTab, setActiveTab] = useState('missing') 
  const [activeFeature, setActiveFeature] = useState(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [dossierCache, setDossierCache] = useState({})
  const [isDossierLoading, setIsDossierLoading] = useState(false)

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [chatPersona, setChatPersona] = useState('Credit Risk Analyst')
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Remediation Agent. Select a quick prompt below or ask me a specific question about the dataset.' }
  ])

  const messagesEndRef = useRef(null)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, isChatLoading, isChatOpen])

  const getQuickPrompts = () => {
    const target = activeFeature || "this dataset";
    if (chatPersona === 'Credit Risk Analyst') {
      return [
        `How does missing data in ${target} affect PD models?`, 
        `What is the IFRS 9 regulatory impact of ${target}?`,
        "Explain the SR 11-7 compliance risks here.",
        "Summarize the overall portfolio risk."
      ];
    } else {
      return [
        `Why is ${target} failing data quality checks?`,
        `Generate Python Pandas imputation code for ${target}.`,
        "What is the optimal deduplication key?",
        "Show me the ETL pipeline remediation steps."
      ];
    }
  }

  const handlePersonaSwitch = (newPersona) => {
    setChatPersona(newPersona);
    setChatMessages([
      { role: 'assistant', content: `Switched to **${newPersona}** mode. How can I assist you with the data infrastructure today?` }
    ]);
  }

  const resultData = result?.data || result;

  useEffect(() => {
    if (!resultData) return;
    try {
      if (activeTab === 'missing' && resultData.missing_value_analysis?.length > 0) setActiveFeature(resultData.missing_value_analysis[0].column);
      else if (activeTab === 'outliers' && resultData.outlier_analysis?.length > 0) setActiveFeature(resultData.outlier_analysis[0].column);
      else if (activeTab === 'duplicates' && resultData.duplicate_analysis?.length > 0) setActiveFeature(resultData.duplicate_analysis[0].customer_id || 'Dup_01');
      else setActiveFeature(null);
    } catch (e) {
      setActiveFeature(null);
    }
  }, [activeTab, resultData])

  useEffect(() => {
    if (resultData?.ai_assessment?.ai_recommendations) {
      const initialCache = {};
      resultData.ai_assessment.ai_recommendations.forEach(rec => {
        initialCache[rec.column] = rec;
      });
      setDossierCache(initialCache);
    }
  }, [resultData]);

  useEffect(() => {
    if (!activeFeature || !resultData) return;
    if (dossierCache[activeFeature]) return;

    const fetchDossier = async () => {
      setIsDossierLoading(true);
      try {
        const payload = {
          feature_name: activeFeature,
          anomaly_type: activeTab,
          dataset_profile: resultData.dataset_profile || {}
        };
        const newDossier = await generateFeatureDossier(payload);
        setDossierCache(prev => ({ ...prev, [activeFeature]: newDossier }));
      } catch (error) {
        console.error("On-demand generation failed", error);
        setDossierCache(prev => ({ ...prev, [activeFeature]: { strategy: "Baseline rule recommended.", justification: "AI on-demand generation failed.", risk_impact: "Unknown", confidence_level: "N/A" } }));
      } finally {
        setIsDossierLoading(false);
      }
    };

    fetchDossier();
  }, [activeFeature]);

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

  const mockAIAssessment = {
    executive_summary: "The portfolio exhibits high risk due to missing demographic predictors and extreme value outliers which threaten model stability.",
    business_impact: "Unmitigated outliers and missing demographic data will artificially inflate Probability of Default (PD) estimates.",
    risk_implications: "Failure to address these anomalies violates SR 11-7 guidelines for model input stability.",
    prioritized_action_plan: "1. Apply limit-conditioned median imputation.\n2. Execute winsorization.\n3. Implement deterministic hashing.",
    ai_recommendations: [] 
  }

  const hasValidAI = resultData?.ai_assessment && Object.keys(resultData.ai_assessment).length > 0;
  const aiAssessment = hasValidAI ? resultData.ai_assessment : mockAIAssessment;

  const handleExportPDF = async () => {
    if (!resultData) return;
    setIsGeneratingPDF(true);
    try {
      const payloadToExport = {
        ...resultData,
        ai_assessment: {
          ...aiAssessment,
          ai_recommendations: Object.values(dossierCache) 
        }
      };
      await downloadExecutivePDF(payloadToExport);
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF. Check backend terminal for errors.");
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  const processChat = async (messageText) => {
    const userMessage = { role: 'user', content: messageText };
    const newHistory = [...chatMessages, userMessage];
    setChatMessages(newHistory); 
    setChatInput(''); 
    setIsChatLoading(true);
    
    try {
      const topMissing = (resultData?.missing_value_analysis || []).slice(0, 3).map(m => `${m.column} (${m.missing_percentage}%)`).join(", ");
      const topOutliers = (resultData?.outlier_analysis || []).slice(0, 3).map(o => o.column).join(", ");
      
      const richContext = `
        Total Rows: ${resultData?.dataset_profile?.total_rows}.
        Overall Health Score: 84%.
        Top Missing Columns: ${topMissing || 'None'}.
        Top Outlier Columns: ${topOutliers || 'None'}.
        Currently viewing feature: ${activeFeature || 'None'} (Anomaly Type: ${activeTab}).
        AI Materiality Summary: ${aiAssessment.executive_summary}
      `;

      // We strip out any previous follow-up chips from the payload history so the AI doesn't get confused
      const cleanHistory = newHistory.map(m => ({
        role: m.role,
        content: m.content.split('|||')[0].trim() 
      }));

      const response = await sendChatMessage(cleanHistory, richContext, chatPersona);
      setChatMessages([...newHistory, { role: 'assistant', content: response.reply }]);
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
  const activeAIData = dossierCache[activeTab === 'duplicates' ? "DUPLICATES_GLOBAL" : activeFeature];

  const missingPct = activeMissingData ? safeNum(activeMissingData.missing_percentage) : 0;
  const validPct = 100 - missingPct;

  return (
    <>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .loading-spinner { animation: spin 1s linear infinite; }
        .markdown-body pre { background: #0f172a; color: #f8fafc; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 13px; margin: 12px 0; border: 1px solid #334155; }
        .markdown-body code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; }
        .markdown-body p { margin: 0 0 10px 0; }
        .markdown-body p:last-child { margin: 0; }
        .markdown-body ul { margin: 0 0 10px 0; padding-left: 20px; }
        .markdown-body li { margin-bottom: 4px; }
        .markdown-body strong { font-weight: 700; color: inherit; }
      `}</style>

      <main style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '60px', overflowX: 'hidden' }}>

        {!isLoading && !result && (
          <div style={{ maxWidth: '800px', margin: '60px auto' }}>
            <section style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '24px', color: '#0f172a', marginBottom: '8px' }}>Model Risk Data Assessment</h2>
              <p style={{ color: '#64748b', marginBottom: '32px' }}>Upload a portfolio file to initiate the compliance check.</p>
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <svg className="loading-spinner" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '24px' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: 700 }}>Executing AI Analysis...</h3>
            <p style={{ marginTop: '8px', fontSize: '15px', color: '#64748b' }}>Running statistical integrity checks and risk validation.</p>
          </div>
        )}

        {result && (
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
            
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

            {/* <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
              <div style={{ flex: 1, background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #f59e0b' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compliance Risk</h3>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Moderate (Amber) - Review Recommended</p>
              </div>
              <div style={{ flex: 1, background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Downstream Impact</h3>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>IFRS 9 Expected Credit Loss Engines</p>
              </div>
            </div> */}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a', textTransform: 'uppercase' }}>Variable-Level Anomaly Detection</h3>
                <p style={{fontSize: '13.5px',color: '#64748b',marginTop: '2px',marginBottom: '18px'}}>
                    Percentage of records with extreme observations (Z-score &gt; 3) across monitored variables.
                </p>
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
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a', textTransform: 'uppercase' }}>Critical Missing Data Hotspots</h3>
                <p style={{fontSize: '13.5px',color: '#64748b',marginTop: '2px',marginBottom: '18px'}}>
                  Higher missing rates may affect model reliability, calibration, and risk assessment accuracy.
                </p>
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
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a', textTransform: 'uppercase' }}>Data Quality Health Assessment</h3>
                <p style={{fontSize: '13.5px',color: '#64748b',marginTop: '2px',marginBottom: '18px'}}>
                    Assessment of key data quality dimensions aligned with model risk management and governance expectations.
                </p>
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
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a', textTransform: 'uppercase' }}>Data Quality Risk Exposure</h3>
                <p style={{fontSize: '13.5px',color: '#64748b',marginTop: '2px',marginBottom: '18px'}}>
                    Highlights concentration of data quality risks requiring remediation.
                </p>
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

            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 400px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ display: 'flex', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <button onClick={() => setActiveTab('missing')} style={{ flex: 1, padding: '14px 0', background: activeTab === 'missing' ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === 'missing' ? '2px solid #2563eb' : '2px solid transparent', fontWeight: 700, fontSize: '13px', color: activeTab === 'missing' ? '#2563eb' : '#64748b', cursor: 'pointer' }}>
                    Missing Data ({resultData?.missing_value_analysis?.length || 0})
                  </button>
                  <button onClick={() => setActiveTab('outliers')} style={{ flex: 1, padding: '14px 0', background: activeTab === 'outliers' ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === 'outliers' ? '2px solid #2563eb' : '2px solid transparent', fontWeight: 700, fontSize: '13px', color: activeTab === 'outliers' ? '#2563eb' : '#64748b', cursor: 'pointer' }}>
                    Outliers ({resultData?.outlier_analysis?.length || 0})
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
                {activeFeature && (
                  <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <h3 style={{ margin: 0, fontSize: '15px' }}>Remediation Dossier: {activeTab === 'duplicates' ? 'Global Deduplication' : activeFeature}</h3>
                    </div>
                    
                    <div style={{ padding: '24px' }}>
                      <div style={{ padding: '16px', background: '#f1f5f9', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '24px' }}>
                        <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}> Rule-Based Remediation</span>
                        <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                          {activeTab === 'outliers' && 'Remove rows containing statistical outliers (Z-Score > 3.0) to normalize distribution.'}
                          {activeTab === 'missing' && 'Apply generic mean imputation or drop records containing null values.'}
                          {activeTab === 'duplicates' && 'Drop all identical rows keeping only the first instance.'}
                        </p>
                      </div>

                      {isDossierLoading ? (
                         <div style={{ padding: '32px', textAlign: 'center', background: '#eff6ff', borderRadius: '8px', border: '1px dashed #bfdbfe' }}>
                            <svg className="loading-spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
                              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                            </svg>
                            <p style={{ margin: 0, fontSize: '13px', color: '#1d4ed8', fontWeight: 600 }}>✨ AI is analyzing {activeFeature}...</p>
                         </div>
                      ) : (
                        <div style={{ padding: '24px', background: '#fff', borderRadius: '8px', border: '1px solid #bfdbfe', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)' }}>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                            <div style={{ flex: 1, paddingRight: '20px' }}>
                              <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#dbeafe', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px' }}>✨ AI Recommended Remediation</span>
                              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                                {activeAIData ? activeAIData.strategy : 'No Actionable Override Generated'}
                              </h4>
                            </div>
                            
                            {activeAIData && (
                              <div style={{ display: 'flex', gap: '12px', textAlign: 'right' }}>
                                 <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                   <span style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>Risk Impact</span>
                                   <span style={{ fontSize: '14px', fontWeight: 800, color: activeAIData.risk_impact === 'High' ? '#dc2626' : '#d97706' }}>{activeAIData.risk_impact}</span>
                                 </div>
                                 <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                   <span style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>AI Confidence</span>
                                   <span style={{ fontSize: '14px', fontWeight: 800, color: '#059669' }}>{activeAIData.confidence_level}</span>
                                 </div>
                              </div>
                            )}
                          </div>

                          <div style={{ marginBottom: '20px' }}>
                            <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Justification for Remediation</h5>
                            <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                              {activeAIData ? activeAIData.justification : 'The baseline statistical rule is sufficient.'}
                            </div>
                          </div>

                          <div style={{ marginTop: '20px', marginBottom: '20px', padding: '16px', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fda4af' }}>
                            <h5 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#9f1239', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                              Business Impact if Unresolved
                            </h5>
                            <div style={{ fontSize: '14px', color: '#881337', lineHeight: 1.6, fontWeight: 300, whiteSpace: 'pre-line' }}>
                              {activeAIData ? activeAIData.business_impact : 'No impact analysis provided.'}
                            </div>
                          </div>
                          
                          {activeAIData?.expected_outcome && (
                            <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '6px', borderLeft: '4px solid #10b981' }}>
                              <span style={{ display: 'block', fontSize: '11px', color: '#047857', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>Expected Outcome</span>
                              <p style={{ margin: 0, fontSize: '13px', color: '#065f46', lineHeight: 1.5, fontWeight: 500 }}>
                                {activeAIData.expected_outcome}
                              </p>
                            </div>
                          )}

                          {activeTab === 'outliers' && activeOutlierData && (
                            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1', display: 'flex', gap: '32px' }}>
                              <div>
                                <span style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Suggested Lower Floor</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>≥ {formatCount(activeOutlierData.suggested_cap_lower)}</span>
                              </div>
                              <div>
                                <span style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Suggested Upper Cap</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>≤ {formatCount(activeOutlierData.suggested_cap_upper)}</span>
                              </div>
                            </div>
                          )}

                          {activeTab === 'missing' && activeMissingData && (
                            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                              <span style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Affected Data Volume</span>
                              <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
                                <div style={{ width: `${validPct}%`, background: '#22c55e', height: '100%' }} title={`Valid: ${validPct}%`} />
                                <div style={{ width: `${missingPct}%`, background: '#ef4444', height: '100%' }} title={`Missing: ${missingPct}%`} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                                <span>{validPct.toFixed(2)}% Intact</span>
                                <span style={{ color: '#ef4444' }}>{missingPct.toFixed(2)}% Missing Block</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>Ready to proceed with Model Documentation?</h3>
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

        {result && !isChatOpen && (
          <button onClick={() => setIsChatOpen(true)} style={{ position: 'fixed', right: '24px', bottom: '32px', zIndex: 1000, background: '#2563eb', color: '#fff', border: 'none', borderRadius: '50px', padding: '14px 24px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 15px rgba(37,99,235,0.3)', transition: 'transform 0.2s' }}>
            💬 Remediation Agent
          </button>
        )}

        <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '420px', background: '#fff', boxShadow: '-8px 0 20px rgba(0,0,0,0.15)', zIndex: 1001, transform: isChatOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '20px 24px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>✨</span> Remediation Agent
            </h3>
            <button onClick={() => setIsChatOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>&times;</button>
          </div>

          <div style={{ padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => handlePersonaSwitch('Credit Risk Analyst')}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: chatPersona === 'Credit Risk Analyst' ? '#2563eb' : '#fff', color: chatPersona === 'Credit Risk Analyst' ? '#fff' : '#475569', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              📊 Risk Analyst
            </button>
            <button 
              onClick={() => handlePersonaSwitch('Data Quality Engineer')}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: chatPersona === 'Data Quality Engineer' ? '#2563eb' : '#fff', color: chatPersona === 'Data Quality Engineer' ? '#fff' : '#475569', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              ⚙️ Data Engineer
            </button>
          </div>

          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* ── UPGRADED: Chat Splitting Logic for Follow-Up Chips & Downloads ── */}
            {chatMessages.map((msg, idx) => {
              const parts = msg.content.split('|||');
              const mainContent = parts[0];
              
              // Extract the file ID if the AI triggered a download
              const downloadPart = parts.find(p => p.includes("DOWNLOAD_FILE:"));
              const fileId = downloadPart ? downloadPart.replace("DOWNLOAD_FILE:", "").trim() : null;

              // Filter out empty strings AND the secret download trigger
              const followUps = parts.slice(1).map(f => f.trim()).filter(f => f.length > 0 && !f.startsWith("DOWNLOAD_FILE:"));
              const isLastMessage = idx === chatMessages.length - 1;

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', width: '100%' }}>
                  
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', width: '100%' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.role === 'user' ? '#dbeafe' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    
                    <div className={msg.role === 'assistant' ? 'markdown-body' : ''} style={{ background: msg.role === 'user' ? '#2563eb' : '#fff', color: msg.role === 'user' ? '#fff' : '#0f172a', padding: '14px 18px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: '13.5px', lineHeight: 1.5, border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', maxWidth: '85%' }}>
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown>{mainContent}</ReactMarkdown>
                      ) : (
                        mainContent
                      )}

                      {/* ── THE SHINY DOWNLOAD BUTTON ── */}
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

                  {/* ── The Dynamic Follow-Up Chips! ── */}
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

          {/* <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            // {/* ── UPGRADED: Chat Splitting Logic for Follow-Up Chips ── }
            {chatMessages.map((msg, idx) => {
              const parts = msg.content.split('|||');
              const mainContent = parts[0];
              const followUps = parts.slice(1).map(f => f.trim()).filter(f => f.length > 0);
              const isLastMessage = idx === chatMessages.length - 1;

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', width: '100%' }}>
                  
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', width: '100%' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.role === 'user' ? '#dbeafe' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    
                    <div className={msg.role === 'assistant' ? 'markdown-body' : ''} style={{ background: msg.role === 'user' ? '#2563eb' : '#fff', color: msg.role === 'user' ? '#fff' : '#0f172a', padding: '14px 18px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: '13.5px', lineHeight: 1.5, border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', maxWidth: '85%' }}>
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown>{mainContent}</ReactMarkdown>
                      ) : (
                        mainContent
                      )}
                    </div>
                  </div>

                  // {/* ── The Dynamic Follow-Up Chips! ── }
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
          </div> */}

          <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <textarea 
                rows="2"
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                onKeyDown={handleKeyDown}
                disabled={isChatLoading} 
                placeholder="Ask about this feature..." 
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
    </>
  )
}
