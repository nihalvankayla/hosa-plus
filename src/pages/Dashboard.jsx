import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SQT1_EVENTS } from '../data/events.js'
import { getTopicLabel, loadStudyDeck } from '../data/studyContent.js'
import { loadUserDataFromAccount, saveUserDataToAccount } from '../lib/userDataSync.js'
import { useAuth } from '../contexts/AuthContext.jsx'

const ACTIVE_EVENT_KEY = 'hosa-plus-active-event-id'

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeEventId, setActiveEventId] = useState(() => getSavedEventId(user?.id))
  const [deck, setDeck] = useState({ flashcards: [], quizQuestions: [] })
  const [session, setSession] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let mounted = true
    loadUserDataFromAccount(user?.id).then((profile) => {
      if (!mounted) return
      const saved = profile?.activeEventId || getSavedEventId(user?.id)
      if (saved && SQT1_EVENTS.some((event) => event.id === saved)) setActiveEventId(saved)
    })
    return () => { mounted = false }
  }, [user?.id])

  useEffect(() => {
    let mounted = true
    async function load() {
      const nextDeck = await loadStudyDeck(activeEventId)
      const nextSession = await buildSession(user?.id, activeEventId, nextDeck.flashcards)
      if (mounted) {
        setDeck(nextDeck)
        setSession(nextSession)
      }
    }
    load()
    return () => { mounted = false }
  }, [activeEventId, user?.id])

  const event = SQT1_EVENTS.find((item) => item.id === activeEventId) || SQT1_EVENTS[0]
  const metrics = useMemo(() => buildMetrics(deck.flashcards, session?.progressMap || {}, session?.totalDue), [deck.flashcards, session])
  const firstFocus = metrics.areas[0]?.name || 'Core terms'

  const handleEventChange = (eventId) => {
    setActiveEventId(eventId)
    localStorage.setItem(ACTIVE_EVENT_KEY, eventId)
    if (user?.id) saveUserDataToAccount(user.id, undefined, undefined, undefined, undefined, undefined, eventId)
  }

  const handleAsk = () => {
    if (query.trim()) navigate(`/analytics?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div id="v-dashboard" className="view active">
      <div className="dash5-cmdbar">
        <div>
          <div className="dash5-greeting">HOSA<span style={{ color: 'var(--maroon)', fontWeight: 700 }}>+</span><span> // </span>Command Center</div>
          <div className="dash5-date-sub">{formatToday()} · personal competition operations</div>
        </div>
        <div className="dash5-event-control">
          <label htmlFor="command-event">YOUR EVENT</label>
          <select id="command-event" value={event.id} onChange={(e) => handleEventChange(e.target.value)}>
            {SQT1_EVENTS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <span>Saved to your account</span>
        </div>
        <div className="dash5-stats">
          <DashboardStat value={`${metrics.readiness}%`} label="Event Readiness" detail={`${deck.flashcards.length} cards loaded`} />
          <div className="dash5-divider" />
          <DashboardStat value={metrics.dueCount} label="Due Today" detail={`${metrics.weakCount} weak cards`} />
          <div className="dash5-divider" />
          <DashboardStat value={deck.quizQuestions.length} label="Quiz Items" detail={`${metrics.topicCount} topics`} />
        </div>
      </div>

      <div className="dash5-ai-wrap">
        <div className="ai-command-bar">
          <div className="command-wave" aria-hidden="true">✦</div>
          <input className="ai-cmd-inp" placeholder={`Ask about ${event.name} or your study plan`} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAsk()} />
          <span className="ai-cmd-kbd">Ctrl K</span>
          <button className="ai-ask-btn" type="button" onClick={handleAsk}>Ask</button>
        </div>
        <div className="ai-quick-chips">
          {['Start today’s session', `Review ${firstFocus}`, 'Build a study plan'].map((chip) => <button key={chip} type="button" className="ai-qchip" onClick={() => navigate(chip.startsWith('Start') ? `/study/${event.id}` : '/study-plan')}>{chip}</button>)}
        </div>
      </div>

      <div className="dash5-mid">
        <div className="card dash5-radar-card" style={{ padding: '14px 13px' }}>
          <div className="card-hd" style={{ marginBottom: 9 }}><div className="card-title">Knowledge Radar</div><div className="ctag maroon">{metrics.criticalCount} Needs focus</div></div>
          <div className="radar-dashboard-content"><Radar areas={metrics.areas} readiness={metrics.readiness} /><div className="radar-dashboard-legend">{metrics.areas.map((area) => <div key={area.name} className="radar-legend-row"><span className={`radar-legend-dot ${scoreTone(area.score)}`} /><span className="radar-legend-name">{area.name}</span><span className={`radar-legend-pct ${scoreTone(area.score)}`}>{area.score}%</span></div>)}</div></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, overflow: 'hidden' }}>
          <div className="card card-ai-fused" style={{ flex: 1, overflow: 'auto' }}>
            <div className="card-hd situation-header" style={{ marginBottom: 10 }}>
              <div className="situation-title-group"><div className="card-title">AI Situation Report</div><span className="ctag">LIVE</span><span className="ctag">Personalized</span><span className="situation-divider" /><div className="card-title situation-accent">AI Clinical Insights</div><span className="ctag">Predictive</span></div>
            </div>
            <div className="ai-situation-bubble"><div className="ai-avatar">✦</div><div className="ai-situation-copy">{buildReport(event, metrics)}<div className="situation-actions"><Link className="ai-action-chip" to={`/study/${event.id}`}>Drill {metrics.areas[0]?.name || 'Core Terms'}</Link><Link className="ai-action-chip" to={`/study/${event.id}`}>Weak Drill →</Link><Link className="ai-action-chip" to="/study-plan">Build Plan</Link></div></div></div>
            <div className="insight-label">CLINICAL INSIGHTS</div>
            <div className="insight-list"><Insight label="Priority" text={buildPriority(metrics)} /><Insight label="Forecast" text={buildForecast(metrics)} /><Insight label="Recommendation" text={`${Math.max(1, Math.min(3, metrics.topicCount))} focused event review block${metrics.topicCount === 1 ? '' : 's'} ready to queue.`} /></div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, overflow: 'hidden' }}>
          <div className="cd2" style={{ flexShrink: 0 }}><div className="cd2-eyebrow">States Competition</div><div className="cd2-num-row"><div className="cd2-num">40</div><div className="cd2-unit">days remaining</div></div><div className="cd2-event">May 11, 2026 — Forsyth Central</div><CertificationTrack /></div>
          <div className="card" style={{ flex: 1, overflow: 'auto' }}><div className="card-hd"><div className="card-title">Study Modes</div><div className="quick-launch-label">Quick Launch</div></div><div className="quick-launch-stack"><QuickLaunch to={`/study/${event.id}`} label="Flashcards" sub="Spaced repetition" icon="▣" /><QuickLaunch to="/testing" label="Testing" sub="MCQ · Timed" icon="◇" tone="maroon" /><QuickLaunch to="/scenarios" label="Scenario Lab" sub="SOAP · Clinical" icon="◆" /><QuickLaunch to={`/study/${event.id}`} label="Weak Drill" sub={`${metrics.weakCount} queued`} icon="◐" tone="maroon" /></div></div>
        </div>
      </div>

      <div className="dash5-quote-bar"><div className="dash5-quote-icon">✦</div><div className="dash5-quote-body"><div className="dash5-quote-text">“The good thing about science is that it’s true whether or not you believe in it.”</div><div className="dash5-quote-attr">— Neil deGrasse Tyson, Astrophysicist</div></div><div className="dash5-quote-rule" /><div className="dash5-quote-badge"><span className="dash5-quote-badge-dot" />Keep going</div></div>
    </div>
  )
}

function getSavedEventId(userId) {
  if (typeof window === 'undefined') return SQT1_EVENTS[0].id
  return localStorage.getItem(`hosa-plus-active-event-id:${userId}`) || localStorage.getItem(ACTIVE_EVENT_KEY) || 'medical-terminology'
}

async function buildSession(userId, eventId, cards) {
  try {
    const { getTodaysSession, getStudyUserId } = await import('../lib/sessionCalculator.js')
    return getTodaysSession(userId || getStudyUserId(), eventId, cards)
  } catch { return { progressMap: {} } }
}

function buildMetrics(cards, progressMap, totalDue) {
  const topics = new Map()
  cards.forEach((card) => {
    const topic = card.topic || 'core-terms'
    const progress = progressMap[card.id]
    const score = progress ? Math.round((progress.times_correct / Math.max(progress.times_seen, 1)) * 100) : BASELINE_RADAR_SCORE
    const bucket = topics.get(topic) || { name: getTopicLabel(topic), scores: [], count: 0 }
    bucket.scores.push(progress ? Math.round((score * 0.72) + (BASELINE_RADAR_SCORE * 0.28)) : score); bucket.count += 1; topics.set(topic, bucket)
  })
  const areas = [...topics.values()].map((area) => ({ ...area, score: area.scores.length ? Math.round(area.scores.reduce((a, b) => a + b, 0) / area.scores.length) : 0 })).sort((a, b) => a.score - b.score).slice(0, 6)
  const readiness = cards.length ? Math.round(cards.reduce((total, card) => total + (progressMap[card.id] ? (progressMap[card.id].times_correct / Math.max(progressMap[card.id].times_seen, 1)) * 100 : 0), 0) / cards.length) : 0
  const weakCount = Object.values(progressMap).filter((item) => item.rating === 'review-again' || (item.times_seen > 0 && item.times_correct / item.times_seen < 0.5)).length
  const radarAreas = areas
  const baselineReadiness = cards.length ? Math.round(cards.reduce((total, card) => total + (progressMap[card.id] ? (progressMap[card.id].times_correct / Math.max(progressMap[card.id].times_seen, 1)) * 0.72 * 100 + BASELINE_RADAR_SCORE * 0.28 : BASELINE_RADAR_SCORE, 0), 0) / cards.length) : BASELINE_RADAR_SCORE
  return { areas: radarAreas.length ? radarAreas : [{ name: 'Core Terms', score: BASELINE_RADAR_SCORE }], readiness: cards.some((card) => progressMap[card.id]) ? Math.round((readiness * 0.72) + (baselineReadiness * 0.28)) : baselineReadiness, weakCount, dueCount: totalDue ?? weakCount, topicCount: topics.size, criticalCount: radarAreas.filter((area) => area.score < 40).length }
}

const BASELINE_RADAR_SCORE = 68
function scoreTone(score) { return score < 55 ? 'critical' : score < 70 ? 'warn' : score >= 80 ? 'healthy' : 'neutral' }
function buildReport(event, metrics) { const strongest = [...metrics.areas].sort((a, b) => b.score - a.score)[0]; const weakest = metrics.areas[0]; return <>Here’s where you stand in <strong>{event.name}</strong>. Your overall readiness is at <strong>{metrics.readiness}%</strong>, and your strongest area is <strong>{strongest?.name || 'Core Terms'} {strongest?.score || metrics.readiness}%</strong>. <span>Your study path is trending toward competition readiness.</span><br /><br />The area that needs the most attention is <strong className="situation-warning">{weakest?.name || 'Core Terms'} at {weakest?.score || metrics.readiness}%</strong>. A short targeted review today will move this area meaningfully while keeping your stronger topics active.</> }
function buildPriority(metrics) { return `${metrics.areas[0]?.name || 'Core Terms'} at ${metrics.areas[0]?.score || metrics.readiness}%. Targeted review here gives you the fastest readiness gain.` }
function buildForecast(metrics) { return metrics.readiness >= 70 ? `Projected to stay competition-ready if you maintain your current review rhythm.` : `A consistent focused block each day should raise your readiness trajectory before competition.` }
function formatToday() { return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date()) }
function DashboardStat({ value, label, detail }) { return <div className="dash5-stat"><div className="dash5-stat-num">{value}</div><div className="dash5-stat-lbl">{label}</div><div className="dash5-stat-delta">{detail}</div></div> }
function Radar({ areas, readiness }) { const size = 260; const center = size / 2; const radius = 96; const labelRadius = 119; const points = areas.map((area, index) => { const angle = (index / areas.length) * Math.PI * 2 - Math.PI / 2; const r = radius * (area.score / 100); return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}` }).join(' '); return <div className="radar-dashboard"><svg width="260" height="260" role="img" aria-label="Knowledge readiness radar">{[.25, .5, .75, 1].map((scale) => <circle key={scale} cx={center} cy={center} r={radius * scale} fill="none" stroke="rgba(9,87,134,.12)" />)}{areas.map((area, index) => { const angle = (index / areas.length) * Math.PI * 2 - Math.PI / 2; const x = center + radius * Math.cos(angle); const y = center + radius * Math.sin(angle); const labelX = center + labelRadius * Math.cos(angle); const labelY = center + labelRadius * Math.sin(angle); return <g key={area.name}><line x1={center} y1={center} x2={x} y2={y} stroke="rgba(9,87,134,.12)" /><text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" className={`radar-axis-label ${scoreTone(area.score)}`}>{area.name}</text></g> })}<polygon points={points} fill="rgba(9,87,134,.22)" stroke="var(--navy)" strokeWidth="2" />{areas.map((area, index) => { const angle = (index / areas.length) * Math.PI * 2 - Math.PI / 2; const r = radius * (area.score / 100); return <circle key={`${area.name}-dot`} cx={center + r * Math.cos(angle)} cy={center + r * Math.sin(angle)} r="3.5" className={`radar-point ${scoreTone(area.score)}`} /> })}</svg><div className="radar-center-label">{readiness}%</div></div> }
function Insight({ label, text }) { return <div className="insight-item"><div className="insight-k">{label}</div><div>{text}</div></div> }
function QuickLaunch({ to, label, sub, icon, tone = 'navy' }) { return <Link className={`dash5-ql ${tone === 'maroon' ? 'maroon-ql' : 'navy-ql'}`} to={to}><div className={`dash5-ql-ico ${tone === 'maroon' ? 'ghost-maroon' : 'navy-bg'}`}>{icon}</div><div><div className="dash5-ql-lbl">{label}</div><div className="dash5-ql-sub">{sub}</div></div></Link> }
function CertificationTrack() { return <><div className="cert-track"><div className="cert-node done">✓</div><div className="cert-line" /><div className="cert-node done">✓</div><div className="cert-line" /><div className="cert-node active">3</div><div className="cert-line locked" /><div className="cert-node locked">4</div><div className="cert-line locked" /><div className="cert-node locked">5</div></div><div className="cert-labels">{['Regional', 'Qualifier', 'States', 'Nationals', 'Board'].map((label) => <div key={label} className={`cert-lbl ${label === 'States' ? 'active' : ''}`}>{label}</div>)}</div></> }

export default Dashboard
