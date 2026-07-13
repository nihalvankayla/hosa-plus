import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { readinessAreas } from '../data/hosaDashboardData.js'
import { SQT1_EVENTS } from '../data/events.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { saveUserDataToAccount, loadUserDataFromAccount } from '../lib/userDataSync.js'
import { askGemini } from '../lib/gemini.js'

const activity = [
  ['Today', 'Completed Medical Terminology drill', '+12 mastery'],
  ['Yesterday', 'Missed pharmacology beta blocker item', 'weak queue'],
  ['Apr 8', 'Finished EMT protocols quiz', '82%'],
]

// Date helper to get the most recent Sunday at midnight
function getLastSunday() {
  const d = new Date()
  const day = d.getDay() // 0 is Sunday, 1 is Monday, etc.
  const diff = d.getDate() - day
  const lastSunday = new Date(d.setDate(diff))
  lastSunday.setHours(0, 0, 0, 0)
  return lastSunday
}

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [eventId, setEventId] = useState('')
  const [report, setReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [readiness, setReadiness] = useState(74) // Default fallback
  const [cardStats, setCardStats] = useState({ total: 0, mastered: 0, learning: 0, trouble: 0 })

  const displayName = user?.user_metadata?.full_name || 'Nihal'

  // Fetch student progress stats for the selected HOSA event
  const fetchProgressStats = useCallback(async (selectedEventId) => {
    if (!user?.id || !selectedEventId) return { total: 0, mastered: 0, learning: 0, trouble: 0, computedReadiness: 10 }

    try {
      const { data: progress, error } = await supabase
        .from('card_progress')
        .select('rating')
        .eq('user_id', user.id)
        .eq('event_id', selectedEventId)

      if (error) throw error

      if (!progress || progress.length === 0) {
        return { total: 0, mastered: 0, learning: 0, trouble: 0, computedReadiness: 10 }
      }

      const total = progress.length
      const mastered = progress.filter((p) => p.rating === 'got-it').length
      const learning = progress.filter((p) => p.rating === 'almost').length
      const trouble = progress.filter((p) => p.rating === 'review-again').length

      // Compute readiness based on mastery weight
      const computedReadiness = Math.min(
        100,
        Math.max(10, Math.round(((mastered * 1.0 + learning * 0.5) / total) * 100))
      )

      return { total, mastered, learning, trouble, computedReadiness }
    } catch (err) {
      console.error('Error fetching progress stats:', err)
      return { total: 0, mastered: 0, learning: 0, trouble: 0, computedReadiness: 74 }
    }
  }, [user?.id])

  // Generate a weekly personalized report using Gemini API
  const generateReport = useCallback(async (selectedEventId, stats) => {
    if (!user?.id || !selectedEventId) return

    setReportLoading(true)
    const selectedEventObj = SQT1_EVENTS.find((e) => e.id === selectedEventId)
    const eventName = selectedEventObj ? selectedEventObj.name : 'HOSA Event'

    try {
      const systemInstruction = `You are HOSA+ AI, a high-fidelity intelligence assistant built for clinical and medical competitive preparation.
Your job is to generate a personalized AI Situation Report for the student's dashboard based on their progress in their selected event.
You MUST respond with a JSON object in this exact format (do not wrap in markdown or backticks):
{
  "reportText": "A 2-3 paragraph personalized summary analyzing their progress, strengths, and specific areas that need attention. Address the student by name if provided. Make it sound professional, encouraging, and clinical. Keep it concise.",
  "priority": "1-sentence specific action item (e.g. 'Review Pharmacology at 38%. 20 min/day closes this gap before States.')",
  "forecast": "1-sentence projection (e.g. 'Projected 91% readiness by April 28 at your current study rate.')",
  "recommendation": "1-sentence tool recommendation (e.g. '3 clinical cases ready in Scenario Lab.')"
}`

      const promptText = `Student Name: ${displayName}
Selected Event: ${eventName} (ID: ${selectedEventId})
Study Progress Stats:
- Total cards studied: ${stats.total}
- Cards mastered ('got-it'): ${stats.mastered}
- Cards learning ('almost'): ${stats.learning}
- Cards trouble ('review-again'): ${stats.trouble}
- Computed Readiness Rate: ${stats.computedReadiness}%

Please analyze this progress and generate a highly personalized, weekly AI Situation Report. Ground it in their selected event.`

      const responseText = await askGemini(promptText, systemInstruction)
      
      // Attempt to clean and parse the JSON response from Gemini
      let cleanText = responseText.trim()
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7)
      }
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3)
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3)
      }
      cleanText = cleanText.trim()

      const parsedReport = JSON.parse(cleanText)
      const newReport = {
        ...parsedReport,
        generatedAt: new Date().toISOString(),
        eventId: selectedEventId
      }

      setReport(newReport)
      
      // Save both the event and the report to Supabase
      await saveUserDataToAccount(user.id, undefined, undefined, undefined, selectedEventId, newReport)
    } catch (err) {
      console.error('Failed to generate AI situation report:', err)
      // Fallback report
      setReport({
        reportText: `Welcome to your HOSA+ dashboard, ${displayName}! Select your target HOSA event in the dropdown menu at the top of the screen to begin receiving weekly, personalized AI situation reports and clinical insights.`,
        priority: 'Select a HOSA event at the top of the page.',
        forecast: 'Choose an event to compute states qualification readiness.',
        recommendation: 'Get started by exploring study suite cards.',
        generatedAt: new Date().toISOString(),
        eventId: selectedEventId
      })
    } finally {
      setReportLoading(false)
    }
  }, [user?.id, displayName])

  // Load profile data (selected event & persisted report)
  useEffect(() => {
    if (!user?.id) return

    const initDashboard = async () => {
      setReportLoading(true)
      try {
        const profileData = await loadUserDataFromAccount(user.id)
        
        let activeEvent = profileData?.selectedEvent || ''
        let activeReport = profileData?.situationReport || null

        // Default to first event if none is selected
        if (!activeEvent && SQT1_EVENTS.length > 0) {
          activeEvent = SQT1_EVENTS[0].id
        }

        setEventId(activeEvent)

        // Fetch stats first
        const stats = await fetchProgressStats(activeEvent)
        setCardStats(stats)
        setReadiness(stats.computedReadiness)

        // Determine if we need to regenerate the report
        // Needs regeneration if: no report, event changed, or generated before last Sunday
        const lastSunday = getLastSunday()
        const isOutdated = activeReport && new Date(activeReport.generatedAt) < lastSunday
        const isEventMismatch = activeReport && activeReport.eventId !== activeEvent

        if (!activeReport || isOutdated || isEventMismatch) {
          await generateReport(activeEvent, stats)
        } else {
          setReport(activeReport)
          setReportLoading(false)
        }
      } catch (err) {
        console.error('Dashboard init failed:', err)
        setReportLoading(false)
      }
    }

    initDashboard()
  }, [user?.id, fetchProgressStats, generateReport])

  const handleEventChange = async (e) => {
    const newEventId = e.target.value
    setEventId(newEventId)
    setReportLoading(true)

    // Save event selection and immediately fetch/regenerate report
    if (user?.id) {
      const stats = await fetchProgressStats(newEventId)
      setCardStats(stats)
      setReadiness(stats.computedReadiness)
      await generateReport(newEventId, stats)
    }
  }

  const handleAsk = () => {
    if (!query.trim()) return
    navigate(`/analytics?q=${encodeURIComponent(query.trim())}`)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAsk()
    }
  }

  const handleChipClick = (chipText) => {
    navigate(`/analytics?q=${encodeURIComponent(chipText)}`)
  }

  // Update dynamic readinessAreas values
  const updatedReadinessAreas = readinessAreas.map((area) => {
    if (area.name === 'Pharmacology' && cardStats.total > 0 && eventId === 'pharmacology') {
      return { ...area, score: readiness }
    }
    return area
  })

  const currentEventName = SQT1_EVENTS.find((e) => e.id === eventId)?.name || 'Select Event'

  return (
    <div id="v-dashboard" className="view active">
      <div className="dash5-cmdbar">
        <div>
          <div className="dash5-greeting">
            HOSA<span style={{ color: 'var(--maroon)', fontWeight: 700 }}>+</span>
            <span> // </span>
            {displayName}
            <select
              value={eventId}
              onChange={handleEventChange}
              className="dash5-event-select"
            >
              <option value="">Select Event...</option>
              {SQT1_EVENTS.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
          </div>
          <div className="dash5-date-sub">Clinical Command Center · Target Event: {currentEventName}</div>
        </div>
        <div className="dash5-stats">
          <DashboardStat value="40" label="Days to States" detail="May 11, 2026" />
          <div className="dash5-divider" />
          <DashboardStat value={`${readiness}%`} label="Comp Readiness" detail="Calculated live" />
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="ai-cmd-kbd">Ctrl K</span>
          <button className="ai-ask-btn" type="button" onClick={handleAsk}>
            Ask
          </button>
        </div>
        <div className="ai-quick-chips">
          {['Explain tachycardia', 'Quiz me: Pharmacology', 'Summarize EMT protocols', 'Prep me for States', "Today's focus", 'Build a study plan'].map((chip) => (
            <span key={chip} className="ai-qchip" onClick={() => handleChipClick(chip)} style={{ cursor: 'pointer' }}>
              {chip}
            </span>
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
            <Radar areas={updatedReadinessAreas} centerReadiness={readiness} />
            <div style={{ marginTop: 8, width: '100%' }}>
              {updatedReadinessAreas.slice(0, 4).map((area) => (
                <div key={area.name} className="radar-leg-row">
                  <span>{area.name}</span>
                  <span>{area.score}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div className="card card-ai-fused" style={{ border: '1px solid rgba(10,124,140,0.22)', background: 'linear-gradient(160deg,rgba(255,255,255,0.98) 0%,rgba(245,252,253,0.97) 100%)' }}>
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
              <div className="ai-bubble" style={{ width: '100%' }}>
                {reportLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
                    <div style={{ height: 14, background: 'rgba(9,87,134,0.06)', borderRadius: 4, width: '90%', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ height: 14, background: 'rgba(9,87,134,0.06)', borderRadius: 4, width: '95%', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ height: 14, background: 'rgba(9,87,134,0.06)', borderRadius: 4, width: '70%', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>Consulting HOSA AI advisor...</div>
                  </div>
                ) : (
                  <>
                    <p style={{ whiteSpace: 'pre-wrap' }}>
                      {report?.reportText || 'Please select your target HOSA event at the top of the page to generate your personalized clinical report.'}
                    </p>
                    {eventId && (
                      <div style={{ display: 'flex', gap: 5, marginTop: 11, flexWrap: 'wrap' }}>
                        <Link className="ai-action-chip" to="/study">
                          Study event cards {'->'}
                        </Link>
                        <Link className="ai-action-chip" to="/testing">
                          Practice drills {'->'}
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="insight-list">
              <Insight label="Priority" text={reportLoading ? 'Analyzing...' : report?.priority || 'Select an event above'} />
              <Insight label="Forecast" text={reportLoading ? 'Calculating...' : report?.forecast || 'No event active'} />
              <Insight label="Recommendation" text={reportLoading ? 'Readying tools...' : report?.recommendation || 'Explore study suites'} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div className="cd2" style={{ flexShrink: 0 }}>
            <div className="cd2-eyebrow">States Competition</div>
            <div className="cd2-num-row">
              <div className="cd2-num">40</div>
              <div className="cd2-unit">days remaining</div>
            </div>
            <div className="cd2-event">May 11, 2026 - Forsyth Central</div>
            <div className="cert-track">
              <div className="cert-node done">✓</div>
              <div className="cert-line" />
              <div className="cert-node done">✓</div>
              <div className="cert-line" />
              <div className="cert-node active">3</div>
              <div className="cert-line locked" />
              <div className="cert-node locked">4</div>
              <div className="cert-line locked" />
              <div className="cert-node locked">5</div>
            </div>
            <div className="cert-labels">
              {['Regional', 'Qualifier', 'States', 'Nationals', 'Board'].map((label) => (
                <div key={label} className={`cert-lbl ${label === 'States' ? 'active' : ''}`}>
                  {label}
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ flex: 1 }}>
            <div className="card-hd" style={{ marginBottom: 11 }}>
              <div className="card-title">Study Modes</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t3)' }}>Quick Launch</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <QuickLaunch to="/study" label="Flashcards" sub="Spaced repetition" icon="▧" />
              <QuickLaunch to="/testing" label="Testing" sub="MCQ - Timed" icon="◇" tone="maroon" />
              <QuickLaunch to="/study" label="Weak Drill" sub="Review incorrect" icon="◑" tone="maroon" />
            </div>
          </div>
        </div>
      </div>

      <div className="dash5-bottom">
        <div className="card">
          <div className="card-hd">
            <div className="card-title">Recent Activity</div>
            <span className="ctag">Live</span>
          </div>
          {activity.map(([time, title, detail]) => (
            <div className="event-row" key={title}>
              <div className="event-dot" />
              <div style={{ flex: 1 }}>
                <div className="event-name">{title}</div>
                <div className="event-meta">{time}</div>
              </div>
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

function Radar({ areas, centerReadiness }) {
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
      <div className="radar-center-label">{centerReadiness}%</div>
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
