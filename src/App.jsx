import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import Analytics from './pages/Analytics.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PlannerPage from './pages/PlannerPage.jsx'
import Study from './pages/Study.jsx'
import StudyEvent from './pages/StudyEvent.jsx'
import Testing from './pages/Testing.jsx'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/study" element={<Study />} />
        <Route path="/study/:eventId" element={<StudyEvent />} />
        <Route path="/testing" element={<Testing />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>
    </Routes>
  )
}

export default App
