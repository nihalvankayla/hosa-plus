import { readinessAreas } from '../data/hosaDashboardData.js'

function Analytics() {
  return (
    <div id="v-aihub" className="view active">
      <div className="ph">
        <div>
          <div className="ph-eye">AI Command</div>
          <div className="ph-title">AI Hub</div>
          <div className="ph-sub">Personalized study intelligence, weak-area triage, and source-backed review</div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-hd"><div className="card-title">Readiness Breakdown</div><span className="ctag">Live</span></div>
          <div className="metric-stack">
            {readinessAreas.map((area) => (
              <div key={area.name} className="metric-row">
                <div className="metric-row-top"><span>{area.name}</span><span>{area.score}%</span></div>
                <div className="metric-track"><div className={`metric-fill ${area.status}`} style={{ width: `${area.score}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-ai-fused">
          <div className="card-hd"><div className="card-title">Clinical Insights</div><span className="ctag maroon">Priority</span></div>
          <div className="aihub-srow"><div><div className="aihub-srow-label">Study Guide</div><div className="aihub-srow-sub">Summary + key points</div></div><span className="aihub-srow-arrow">›</span></div>
          <div className="aihub-srow"><div><div className="aihub-srow-label">Mind Map</div><div className="aihub-srow-sub">Visual concept web</div></div><span className="aihub-srow-arrow">›</span></div>
          <div className="aihub-srow"><div><div className="aihub-srow-label">Flashcards</div><div className="aihub-srow-sub">Export to deck</div></div><span className="aihub-srow-arrow">›</span></div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
