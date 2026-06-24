import { useState } from 'react'
import Sidebar from './components/Sidebar'
import DataQualityAssessment from './pages/DataQualityAssessment'
import ModelMonitoring from './pages/ModelMonitoring'
import './App.css'

export default function App() {
  const [activePage, setActivePage] = useState('data-quality')
  
  // We lift state up so the whole app shares the memory
  const [analysisResult, setAnalysisResult] = useState(null)

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="app-content">

        {activePage === 'data-quality' && (
          <DataQualityAssessment analysisResult={analysisResult} />
        )}

        {/* The New Unified Enterprise Dashboard */}
        {activePage === 'model-monitoring' && (
          <ModelMonitoring
            analysisResult={analysisResult}
            setAnalysisResult={setAnalysisResult}
          />
        )}

      </div>
    </div>
  )
}