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
        <Route
          path="/presentation"
          element={
            <DemoPlaceholder
              eyebrow="Non-SQT"
              title="Presentation Suite"
              description="Speech prep, slide outlines, rubrics, and timed delivery tools."
            />
          }
        />
        <Route
          path="/scenarios"
          element={
            <DemoPlaceholder
              eyebrow="Clinical"
              title="Scenario Lab"
              description="Full SOAP note clinical cases for Health Professions and Emergency events."
            />
          }
        />
        <Route
          path="/collaborators"
          element={
            <DemoPlaceholder
              eyebrow="Team"
              title="Collaborators"
              description="Study groups, peer review, chapter coordination, and shared readiness."
            />
          }
        />
        <Route
          path="/officers"
          element={
            <DemoPlaceholder
              eyebrow="Chapter"
              title="Officers Only"
              description="Private officer planning, agendas, and chapter readiness controls."
            />
          }
        />
      </Route>
    </Routes>
  )
}

function DemoPlaceholder({ eyebrow, title, description }) {
  return (
    <div className="view active">
      <div className="ph">
        <div>
          <div className="ph-eye">{eyebrow}</div>
          <div className="ph-title">{title}</div>
          <div className="ph-sub">{description}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-hd">
          <div className="card-title">Workspace Ready</div>
          <span className="ctag">Demo route</span>
        </div>
        <p className="side-copy">
          This route is separated so sidebar state behaves correctly while the full tool is wired up.
        </p>
      </div>
    </div>
  )
}

export default App
