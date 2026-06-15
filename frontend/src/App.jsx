
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import DataQualityAssessment from './pages/DataQualityAssessment'
import ScorecardAnalytics from './pages/ScorecardAnalytics'
import './App.css'

export default function App() {
  const [activePage, setActivePage] = useState('data-quality')
  const [analysisResult, setAnalysisResult] = useState(null)

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="app-content">

        {activePage === 'data-quality' && (
          <DataQualityAssessment analysisResult={analysisResult} />
        )}

        {activePage === 'dashboard' && (
          <Dashboard
            analysisResult={analysisResult}
            setAnalysisResult={setAnalysisResult}
          />
        )}

        {activePage === 'scorecard' && (
          <ScorecardAnalytics
          analysisResult={analysisResult}
          />
          )}
          

      </div>
    </div>
  )
}