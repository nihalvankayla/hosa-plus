import { Link } from 'react-router-dom'
import { readinessAreas } from '../data/hosaDashboardData.js'

const activity = [
  ['Today', 'Completed Medical Terminology drill', '+12 mastery'],
  ['Yesterday', 'Missed pharmacology beta blocker item', 'weak queue'],
  ['Apr 8', 'Finished EMT protocols quiz', '82%'],
]

function Dashboard() {
  return (
    <div id="v-dashboard" className="view active">
      <div className="dash5-cmdbar">
        <div>
          <div className="dash5-greeting">
            HOSA<span style={{ color: 'var(--maroon)', fontWeight: 700 }}>+</span>
            <span> // </span>Nihal
          </div>
          <div className="dash5-date-sub">Saturday, May 30 - Clinical Command Center</div>
        </div>
        <div className="dash5-stats">
          <DashboardStat value="40" label="Days to States" detail="May 11, 2026" />
          <div className="dash5-divider" />
          <DashboardStat value="74%" label="Comp Readiness" detail="+6% this week" />
          <div className="dash5-divider" />
          <DashboardStat value="7" label="Day Streak" detail="Perfect week" />
        </div>
      </div>

      <div className="dash5-ai-wrap">
        <div className="ai-command-bar">
          <div style={{ flexShrink: 0, width: 28, height: 20, display: 'flex', alignItems: 'center' }}>
            <svg width="28" height="20" viewBox="0 0 28 20" fill="var(--teal)">
              {[0, 5, 10, 15, 20].map((x, index) => (
                <rect key={x} className="ai-wave-bar" x={x} y={index % 2 ? 3 : 6} width="3" height={index % 2 ? 14 : 8} rx="1.5" />
              ))}
            </svg>
          </div>
          <input
            className="ai-cmd-inp"
            placeholder='Ask anything - "first-line treatment for anaphylaxis?" or "quiz me on EMT protocols"'
          />
          <span className="ai-cmd-kbd">Ctrl K</span>
          <button className="ai-ask-btn" type="button">Ask</button>
        </div>
        <div className="ai-quick-chips">
          {['Explain tachycardia', 'Quiz me: Pharmacology', 'Summarize EMT protocols', 'Prep me for States', "Today's focus", 'Build a study plan'].map((chip) => (
            <span key={chip} className="ai-qchip">{chip}</span>
          ))}
        </div>
      </div>

      <div className="dash5-mid">
        <div className="card dash5-radar-card" style={{ padding: '14px 13px' }}>
          <div className="card-hd" style={{ marginBottom: 9, flexShrink: 0 }}>
            <div className="card-title">Knowledge Radar</div>
            <div className="ctag maroon">3 Critical</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column' }}>
            <Radar areas={readinessAreas} />
            <div style={{ marginTop: 8, width: '100%' }}>
              {readinessAreas.slice(0, 4).map((area) => (
                <div key={area.name} className="radar-leg-row">
                  <span>{area.name}</span>
                  <span>{area.score}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, overflow: 'hidden' }}>
          <div className="card card-ai-fused" style={{ flex: 1, overflow: 'auto', border: '1px solid rgba(10,124,140,0.22)', background: 'linear-gradient(160deg,rgba(255,255,255,0.98) 0%,rgba(245,252,253,0.97) 100%)' }}>
            <div className="card-hd" style={{ marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                <div className="card-title">AI Situation Report</div>
                <span className="ctag">LIVE</span>
                <span className="ctag">Personalized</span>
                <div className="card-title" style={{ color: 'var(--teal)' }}>AI Clinical Insights</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 11 }}>
              <div className="ai-avatar">*</div>
              <div className="ai-bubble">
                <p>
                  Overall readiness is at <strong style={{ color: 'var(--navy)' }}>74%</strong>, up 6% this week.
                  Your strongest areas are Cardiology and Medical Terminology.
                </p>
                <p>
                  The two gaps that need attention are <strong style={{ color: 'var(--maroon)' }}>Pharmacology at 38%</strong> and
                  <strong style={{ color: 'var(--maroon)' }}> EMT Protocols at 45%</strong>. Twenty minutes of targeted review per day closes these meaningfully.
                </p>
                <div style={{ display: 'flex', gap: 5, marginTop: 11, flexWrap: 'wrap' }}>
                  <Link className="ai-action-chip" to="/testing">Drill Pharmacology</Link>
                  <Link className="ai-action-chip" to="/study">Weak Drill {'->'}</Link>
                </div>
              </div>
            </div>
            <div className="insight-list">
              <Insight label="Priority" text="Pharmacology at 38%. 20 min/day closes this gap before States." />
              <Insight label="Forecast" text="Projected 91% by April 28 at current streak." />
              <Insight label="Recommendation" text="3 clinical cases ready in Scenario Lab." />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, overflow: 'hidden' }}>
          <div className="cd2" style={{ flexShrink: 0 }}>
            <div className="cd2-eyebrow">States Competition</div>
            <div className="cd2-num-row"><div className="cd2-num">40</div><div className="cd2-unit">days remaining</div></div>
            <div className="cd2-event">May 11, 2026 - Forsyth Central</div>
            <div className="cert-track">
              <div className="cert-node done">✓</div><div className="cert-line" />
              <div className="cert-node done">✓</div><div className="cert-line" />
              <div className="cert-node active">3</div><div className="cert-line locked" />
              <div className="cert-node locked">4</div><div className="cert-line locked" />
              <div className="cert-node locked">5</div>
            </div>
            <div className="cert-labels">
              {['Regional', 'Qualifier', 'States', 'Nationals', 'Board'].map((label) => (
                <div key={label} className={`cert-lbl ${label === 'States' ? 'active' : ''}`}>{label}</div>
              ))}
            </div>
          </div>
          <div className="card" style={{ flex: 1, overflow: 'auto' }}>
            <div className="card-hd" style={{ marginBottom: 11 }}>
              <div className="card-title">Study Modes</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t3)' }}>Quick Launch</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <QuickLaunch to="/study" label="Flashcards" sub="Spaced repetition" icon="▧" />
              <QuickLaunch to="/testing" label="Testing" sub="MCQ - Timed" icon="◇" tone="maroon" />
              <QuickLaunch to="/study" label="Weak Drill" sub="4 queued" icon="◑" tone="maroon" />
            </div>
          </div>
        </div>
      </div>

      <div className="dash5-bottom">
        <div className="card">
          <div className="card-hd"><div className="card-title">Recent Activity</div><span className="ctag">Live</span></div>
          {activity.map(([time, title, detail]) => (
            <div className="event-row" key={title}>
              <div className="event-dot" />
              <div style={{ flex: 1 }}><div className="event-name">{title}</div><div className="event-meta">{time}</div></div>
              <span className="ctag">{detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DashboardStat({ value, label, detail }) {
  return (
    <div className="dash5-stat">
      <div className="dash5-stat-num">{value}</div>
      <div className="dash5-stat-lbl">{label}</div>
      <div className="dash5-stat-delta">{detail}</div>
    </div>
  )
}

function Radar({ areas }) {
  const size = 260
  const center = size / 2
  const radius = 96
  const points = areas.map((area, index) => {
    const angle = (index / areas.length) * Math.PI * 2 - Math.PI / 2
    const r = radius * (area.score / 100)
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
  }).join(' ')

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <svg width="260" height="260" style={{ display: 'block' }}>
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <circle key={scale} cx={center} cy={center} r={radius * scale} fill="none" stroke="rgba(9,87,134,0.1)" />
        ))}
        {areas.map((area, index) => {
          const angle = (index / areas.length) * Math.PI * 2 - Math.PI / 2
          const x = center + radius * Math.cos(angle)
          const y = center + radius * Math.sin(angle)
          return <line key={area.name} x1={center} y1={center} x2={x} y2={y} stroke="rgba(9,87,134,0.08)" />
        })}
        <polygon points={points} fill="rgba(9,87,134,0.16)" stroke="var(--navy)" strokeWidth="2" />
      </svg>
      <div className="radar-center-label">74%</div>
    </div>
  )
}

function Insight({ label, text }) {
  return (
    <div className="insight-item">
      <div className="insight-k">{label}</div>
      <div>{text}</div>
    </div>
  )
}

function QuickLaunch({ to, label, sub, icon, tone = 'navy' }) {
  return (
    <Link className={`dash5-ql ${tone === 'maroon' ? 'maroon-ql' : 'navy-ql'}`} to={to} style={{ borderRadius: 'var(--r-sm)', padding: '11px 13px' }}>
      <div className={`dash5-ql-ico ${tone === 'maroon' ? 'ghost-maroon' : 'navy-bg'}`}>{icon}</div>
      <div><div className="dash5-ql-lbl">{label}</div><div className="dash5-ql-sub">{sub}</div></div>
    </Link>
  )
}

export default Dashboard
