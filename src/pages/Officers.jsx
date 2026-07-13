import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'

const OFFICER_PIN = '2627'
const STORAGE_KEY_NOTES = 'hosa-plus-officer-notes'
const STORAGE_KEY_EVENTS = 'hosa-plus-officer-events'

/* ═══════════════════════════════════════════════════════════════
   Officers Page — PIN-protected chapter management dashboard
   ═══════════════════════════════════════════════════════════════ */

function Officers() {
  const [authenticated, setAuthenticated] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [shake, setShake] = useState(false)

  const handlePinSubmit = () => {
    if (pin === OFFICER_PIN) {
      setAuthenticated(true)
      setPinError(false)
    } else {
      setPinError(true)
      setShake(true)
      setPin('')
      setTimeout(() => setShake(false), 500)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handlePinSubmit()
  }

  if (!authenticated) {
    return <PinGate pin={pin} setPin={setPin} pinError={pinError} shake={shake} onSubmit={handlePinSubmit} onKeyDown={handleKeyDown} />
  }

  return <OfficerDashboard onLock={() => { setAuthenticated(false); setPin('') }} />
}

/* ── PIN Entry Gate ────────────────────────────────────────────── */
function PinGate({ pin, setPin, pinError, shake, onSubmit, onKeyDown }) {
  const handleDigitClick = (digit) => {
    if (pin.length < 4) setPin((prev) => prev + digit)
  }

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1))
  }

  return (
    <div id="v-officers" className="view active">
      <div className="officer-pin-gate">
        <div className="officer-pin-card">
          <div className="officer-pin-lock-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className="officer-pin-title">Officers Only</div>
          <div className="officer-pin-sub">Enter the 4-digit chapter PIN to access the officer dashboard.</div>

          <div className={`officer-pin-dots${shake ? ' shake' : ''}`}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`officer-pin-dot${i < pin.length ? ' filled' : ''}${pinError && pin.length === 0 ? ' error' : ''}`} />
            ))}
          </div>

          {pinError && <div className="officer-pin-error">Incorrect PIN. Try again.</div>}

          <div className="officer-pin-pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
              <button key={d} type="button" className="officer-pin-btn" onClick={() => handleDigitClick(String(d))}>{d}</button>
            ))}
            <button type="button" className="officer-pin-btn pin-back" onClick={handleBackspace}>⌫</button>
            <button type="button" className="officer-pin-btn" onClick={() => handleDigitClick('0')}>0</button>
            <button type="button" className="officer-pin-btn pin-enter" onClick={onSubmit}>→</button>
          </div>

          {/* Also allow keyboard entry */}
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onKeyDown={onKeyDown}
            className="officer-pin-hidden-input"
            placeholder="Or type PIN here..."
            autoFocus
          />
        </div>
      </div>
    </div>
  )
}

/* ── Main Officer Dashboard ────────────────────────────────────── */
function OfficerDashboard({ onLock }) {
  const [tab, setTab] = useState('directory')
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_NOTES)) || [] } catch { return [] }
  })
  const [events, setEvents] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_EVENTS)) || [] } catch { return [] }
  })

  // Persist notes & events
  useEffect(() => { localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes)) }, [notes])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events)) }, [events])

  // Fetch all members from Supabase profiles
  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true)
    try {
      // Query the profiles table (contains id and name JSON string)
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, name')

      if (profError) {
        console.error('Error fetching profiles:', profError)
        setMembers([])
        setLoadingMembers(false)
        return
      }

      const memberList = (profiles || []).map((profile) => {
        // Try to parse the name field for stored data
        let parsedName = null
        try { parsedName = JSON.parse(profile.name) } catch { /* not JSON */ }

        return {
          id: profile.id,
          email: parsedName?.email || 'No email',
          fullName: parsedName?.fullName || 'Student',
          lastActive: parsedName?.lastActive || null,
          hasStudyData: !!(parsedName?.chatHistory?.length || parsedName?.customFlashcards),
          chatMessages: parsedName?.chatHistory?.length || 0,
          flashcardSets: parsedName?.customFlashcards ? Object.keys(parsedName.customFlashcards).length : 0,
        }
      })

      // Sort by last active timestamp in JavaScript (descending)
      memberList.sort((a, b) => {
        if (!a.lastActive) return 1
        if (!b.lastActive) return -1
        return new Date(b.lastActive) - new Date(a.lastActive)
      })

      setMembers(memberList)
    } catch (err) {
      console.error('Failed to fetch members:', err)
      setMembers([])
    }
    setLoadingMembers(false)
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  // Subscribe to realtime profile changes
  useEffect(() => {
    const channel = supabase
      .channel('officer-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchMembers()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchMembers])

  const totalMembers = members.length
  const activeToday = members.filter((m) => {
    if (!m.lastActive) return false
    const last = new Date(m.lastActive)
    const now = new Date()
    return (now - last) < 24 * 60 * 60 * 1000
  }).length
  const withStudyData = members.filter((m) => m.hasStudyData).length
  const totalMessages = members.reduce((sum, m) => sum + m.chatMessages, 0)

  const tabs = [
    { key: 'directory', label: 'Student Directory', icon: '👥' },
    { key: 'stats', label: 'Chapter Stats', icon: '📊' },
    { key: 'notes', label: 'Team Notes', icon: '📝' },
    { key: 'events', label: 'Upcoming Events', icon: '📅' },
  ]

  return (
    <div id="v-officers" className="view active">
      {/* Header bar */}
      <div className="officer-header">
        <div>
          <div className="officer-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Officer Dashboard
          </div>
          <div className="officer-subtitle">Chapter management · PIN-protected</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" className="officer-refresh-btn" onClick={fetchMembers} title="Refresh data">↻ Refresh</button>
          <button type="button" className="officer-lock-btn" onClick={onLock}>🔒 Lock</button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="officer-stats-row">
        <StatCard value={totalMembers} label="Total Members" icon="👥" color="navy" />
        <StatCard value={activeToday} label="Active Today" icon="🟢" color="green" />
        <StatCard value={withStudyData} label="Studying" icon="📖" color="teal" />
        <StatCard value={totalMessages} label="AI Messages" icon="💬" color="purple" />
      </div>

      {/* Tab Bar */}
      <div className="officer-tab-bar">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`officer-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span className="officer-tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="officer-content">
        {tab === 'directory' && <DirectoryTab members={members} loading={loadingMembers} />}
        {tab === 'stats' && <StatsTab members={members} totalMessages={totalMessages} />}
        {tab === 'notes' && <NotesTab notes={notes} setNotes={setNotes} />}
        {tab === 'events' && <EventsTab events={events} setEvents={setEvents} />}
      </div>
    </div>
  )
}

/* ── Stat Card ─────────────────────────────────────────────────── */
function StatCard({ value, label, icon, color }) {
  return (
    <div className={`officer-stat-card officer-stat-${color}`}>
      <div className="officer-stat-icon">{icon}</div>
      <div className="officer-stat-value">{value}</div>
      <div className="officer-stat-label">{label}</div>
    </div>
  )
}

/* ── Directory Tab ─────────────────────────────────────────────── */
function DirectoryTab({ members, loading }) {
  const [search, setSearch] = useState('')

  const filtered = members.filter((m) => {
    const q = search.toLowerCase()
    return m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
  })

  if (loading) {
    return (
      <div className="officer-loading">
        <div className="officer-spinner" />
        <span>Loading student directory...</span>
      </div>
    )
  }

  return (
    <div className="officer-directory">
      <div className="officer-dir-header">
        <div className="officer-dir-count">{filtered.length} student{filtered.length !== 1 ? 's' : ''} registered</div>
        <input
          type="text"
          className="officer-dir-search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="officer-empty">
          <div className="officer-empty-icon">🔍</div>
          <div>{search ? 'No students match your search.' : 'No student accounts yet. They\'ll appear here as students sign up.'}</div>
        </div>
      ) : (
        <div className="officer-dir-table-wrap">
          <table className="officer-dir-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Last Active</th>
                <th>AI Chats</th>
                <th>Flashcard Sets</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const initials = m.fullName.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
                const isRecent = m.lastActive && (new Date() - new Date(m.lastActive)) < 24 * 60 * 60 * 1000
                return (
                  <tr key={m.id}>
                    <td>
                      <div className="officer-dir-student">
                        <div className="officer-dir-avatar">{initials || '??'}</div>
                        <span>{m.fullName}</span>
                      </div>
                    </td>
                    <td className="officer-dir-email">{m.email}</td>
                    <td className="officer-dir-date">{m.lastActive ? formatRelativeDate(m.lastActive) : 'Never'}</td>
                    <td className="officer-dir-num">{m.chatMessages}</td>
                    <td className="officer-dir-num">{m.flashcardSets}</td>
                    <td>
                      <span className={`officer-dir-status ${isRecent ? 'active' : 'inactive'}`}>
                        {isRecent ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Stats Tab ─────────────────────────────────────────────────── */
function StatsTab({ members, totalMessages }) {
  const withStudy = members.filter((m) => m.hasStudyData).length
  const avgMessages = members.length > 0 ? Math.round(totalMessages / members.length) : 0
  const totalFlashcards = members.reduce((sum, m) => sum + m.flashcardSets, 0)

  // Activity breakdown
  const now = new Date()
  const activeDay = members.filter((m) => m.lastActive && (now - new Date(m.lastActive)) < 86400000).length
  const activeWeek = members.filter((m) => m.lastActive && (now - new Date(m.lastActive)) < 604800000).length
  const activeMonth = members.filter((m) => m.lastActive && (now - new Date(m.lastActive)) < 2592000000).length
  const dormant = members.length - activeMonth

  return (
    <div className="officer-stats-panel">
      <div className="officer-stats-grid">
        <div className="card officer-stat-block">
          <div className="card-hd"><div className="card-title">Engagement Overview</div><span className="ctag">Live</span></div>
          <div className="officer-stat-rows">
            <StatRow label="Total Registered" value={members.length} />
            <StatRow label="Actively Studying" value={withStudy} highlight />
            <StatRow label="Study Adoption Rate" value={members.length > 0 ? `${Math.round((withStudy / members.length) * 100)}%` : '0%'} />
            <StatRow label="Total AI Conversations" value={totalMessages} />
            <StatRow label="Avg Messages / Student" value={avgMessages} />
            <StatRow label="Total Flashcard Sets Created" value={totalFlashcards} />
          </div>
        </div>

        <div className="card officer-stat-block">
          <div className="card-hd"><div className="card-title">Activity Breakdown</div><span className="ctag">Retention</span></div>
          <div className="officer-activity-bars">
            <ActivityBar label="Active Today" count={activeDay} total={members.length} color="var(--green)" />
            <ActivityBar label="Active This Week" count={activeWeek} total={members.length} color="var(--teal)" />
            <ActivityBar label="Active This Month" count={activeMonth} total={members.length} color="var(--navy)" />
            <ActivityBar label="Dormant (30d+)" count={dormant} total={members.length} color="var(--maroon)" />
          </div>
        </div>

        <div className="card officer-stat-block full-width">
          <div className="card-hd"><div className="card-title">Top Performers</div><span className="ctag">By AI Usage</span></div>
          <div className="officer-top-list">
            {[...members].sort((a, b) => b.chatMessages - a.chatMessages).slice(0, 5).map((m, i) => (
              <div key={m.id} className="officer-top-row">
                <span className="officer-top-rank">#{i + 1}</span>
                <span className="officer-top-name">{m.fullName}</span>
                <span className="officer-top-stat">{m.chatMessages} messages</span>
                <div className="officer-top-bar-wrap">
                  <div className="officer-top-bar" style={{ width: `${members[0]?.chatMessages ? (m.chatMessages / members[0].chatMessages) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
            {members.length === 0 && <div className="officer-empty-inline">No student data yet.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatRow({ label, value, highlight }) {
  return (
    <div className="officer-statrow">
      <span className="officer-statrow-label">{label}</span>
      <span className={`officer-statrow-value${highlight ? ' highlight' : ''}`}>{value}</span>
    </div>
  )
}

function ActivityBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="officer-activity-row">
      <div className="officer-activity-info">
        <span>{label}</span>
        <span className="officer-activity-nums">{count} / {total} ({pct}%)</span>
      </div>
      <div className="officer-activity-track">
        <div className="officer-activity-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

/* ── Notes Tab ─────────────────────────────────────────────────── */
function NotesTab({ notes, setNotes }) {
  const [newNote, setNewNote] = useState('')
  const [author, setAuthor] = useState('')

  const addNote = () => {
    if (!newNote.trim()) return
    const note = {
      id: Date.now(),
      text: newNote,
      author: author.trim() || 'Officer',
      timestamp: new Date().toISOString(),
      pinned: false,
    }
    setNotes((prev) => [note, ...prev])
    setNewNote('')
  }

  const deleteNote = (id) => setNotes((prev) => prev.filter((n) => n.id !== id))
  const togglePin = (id) => setNotes((prev) => prev.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n))

  const sorted = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return b.id - a.id
  })

  return (
    <div className="officer-notes-panel">
      <div className="officer-note-composer card">
        <div className="card-hd"><div className="card-title">Post a Note to the Team</div></div>
        <input
          type="text"
          className="officer-note-author"
          placeholder="Your name (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <textarea
          className="officer-note-input"
          placeholder="Write a note to your team... (announcements, reminders, strategies, encouragement)"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={3}
        />
        <button type="button" className="officer-note-post-btn" onClick={addNote}>Post Note</button>
      </div>

      <div className="officer-notes-list">
        {sorted.length === 0 && (
          <div className="officer-empty">
            <div className="officer-empty-icon">📝</div>
            <div>No team notes yet. Post the first one above!</div>
          </div>
        )}
        {sorted.map((note) => (
          <div key={note.id} className={`officer-note-card card${note.pinned ? ' pinned' : ''}`}>
            <div className="officer-note-top">
              <div className="officer-note-author-tag">{note.author}</div>
              <div className="officer-note-time">{formatRelativeDate(note.timestamp)}</div>
            </div>
            <div className="officer-note-text">{note.text}</div>
            <div className="officer-note-actions">
              <button type="button" className="officer-note-action" onClick={() => togglePin(note.id)}>
                {note.pinned ? '📌 Unpin' : '📌 Pin'}
              </button>
              <button type="button" className="officer-note-action delete" onClick={() => deleteNote(note.id)}>
                🗑 Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Events Tab ────────────────────────────────────────────────── */
function EventsTab({ events, setEvents }) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('meeting')

  const addEvent = () => {
    if (!title.trim() || !date) return
    const evt = {
      id: Date.now(),
      title: title.trim(),
      date,
      description: description.trim(),
      type,
    }
    setEvents((prev) => [...prev, evt].sort((a, b) => new Date(a.date) - new Date(b.date)))
    setTitle('')
    setDate('')
    setDescription('')
    setType('meeting')
    setShowForm(false)
  }

  const deleteEvent = (id) => setEvents((prev) => prev.filter((e) => e.id !== id))

  const upcoming = events.filter((e) => new Date(e.date) >= new Date(new Date().toDateString()))
  const past = events.filter((e) => new Date(e.date) < new Date(new Date().toDateString()))

  const typeColors = {
    meeting: { bg: 'rgba(9,87,134,0.08)', color: 'var(--navy)', label: 'Meeting' },
    competition: { bg: 'rgba(174,0,0,0.07)', color: 'var(--maroon)', label: 'Competition' },
    deadline: { bg: 'rgba(217,119,6,0.08)', color: 'var(--amber)', label: 'Deadline' },
    social: { bg: 'rgba(8,145,178,0.08)', color: 'var(--teal)', label: 'Social' },
    practice: { bg: 'rgba(5,150,105,0.08)', color: 'var(--green)', label: 'Practice' },
  }

  return (
    <div className="officer-events-panel">
      <div className="officer-events-header">
        <div className="officer-events-count">{upcoming.length} upcoming event{upcoming.length !== 1 ? 's' : ''}</div>
        <button type="button" className="officer-add-event-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Event'}
        </button>
      </div>

      {showForm && (
        <div className="card officer-event-form">
          <div className="card-hd"><div className="card-title">New Event</div></div>
          <input type="text" className="officer-evt-input" placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" className="officer-evt-input" value={date} onChange={(e) => setDate(e.target.value)} style={{ flex: 1 }} />
            <select className="officer-evt-input" value={type} onChange={(e) => setType(e.target.value)} style={{ flex: 1 }}>
              <option value="meeting">Meeting</option>
              <option value="competition">Competition</option>
              <option value="deadline">Deadline</option>
              <option value="social">Social</option>
              <option value="practice">Practice</option>
            </select>
          </div>
          <textarea className="officer-evt-input" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <button type="button" className="officer-note-post-btn" onClick={addEvent}>Add Event</button>
        </div>
      )}

      {upcoming.length === 0 && !showForm && (
        <div className="officer-empty">
          <div className="officer-empty-icon">📅</div>
          <div>No upcoming events. Add one to keep your chapter on track!</div>
        </div>
      )}

      {upcoming.map((evt) => {
        const tc = typeColors[evt.type] || typeColors.meeting
        const eventDate = new Date(evt.date + 'T00:00:00')
        const daysUntil = Math.ceil((eventDate - new Date(new Date().toDateString())) / 86400000)
        return (
          <div key={evt.id} className="officer-event-card card">
            <div className="officer-event-top">
              <span className="officer-event-type" style={{ background: tc.bg, color: tc.color }}>{tc.label}</span>
              <span className="officer-event-countdown">
                {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
              </span>
            </div>
            <div className="officer-event-title">{evt.title}</div>
            <div className="officer-event-date">{eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
            {evt.description && <div className="officer-event-desc">{evt.description}</div>}
            <button type="button" className="officer-note-action delete" onClick={() => deleteEvent(evt.id)} style={{ marginTop: 8 }}>🗑 Remove</button>
          </div>
        )
      })}

      {past.length > 0 && (
        <>
          <div className="officer-past-divider">Past Events</div>
          {past.map((evt) => {
            const tc = typeColors[evt.type] || typeColors.meeting
            return (
              <div key={evt.id} className="officer-event-card card past">
                <div className="officer-event-top">
                  <span className="officer-event-type" style={{ background: tc.bg, color: tc.color, opacity: 0.6 }}>{tc.label}</span>
                </div>
                <div className="officer-event-title" style={{ opacity: 0.5 }}>{evt.title}</div>
                <div className="officer-event-date" style={{ opacity: 0.4 }}>{new Date(evt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                <button type="button" className="officer-note-action delete" onClick={() => deleteEvent(evt.id)} style={{ marginTop: 6 }}>🗑 Remove</button>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

/* ── Utilities ─────────────────────────────────────────────────── */
function formatRelativeDate(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default Officers
