import { useMemo, useState } from 'react'

const seedTasks = [
  { id: 1, title: 'Review cardiovascular pharmacology', cat: 'study', pri: 'high', col: 'today', done: false },
  { id: 2, title: 'Run Emergency Prep scenario', cat: 'practice', pri: 'high', col: 'today', done: false },
  { id: 3, title: 'Complete A&P deck units 7-9', cat: 'study', pri: 'med', col: 'week', done: false },
  { id: 4, title: 'Peer review session prep', cat: 'chapter', pri: 'low', col: 'week', done: false },
  { id: 5, title: 'Glossary: top 50 drug terms', cat: 'study', pri: 'low', col: 'backlog', done: false },
]

const columns = [
  ['today', 'Today', 'var(--maroon)'],
  ['week', 'This Week', 'var(--navy)'],
  ['backlog', 'Backlog', 'var(--beige3)'],
]

function PlannerPage() {
  const [tasks, setTasks] = useState(seedTasks)
  const [draft, setDraft] = useState('')
  const done = tasks.filter((task) => task.done).length
  const high = tasks.filter((task) => task.pri === 'high').length
  const progress = Math.round((done / tasks.length) * 100)

  const grouped = useMemo(() => Object.fromEntries(columns.map(([key]) => [key, tasks.filter((task) => task.col === key)])), [tasks])

  function addTask() {
    const title = draft.trim()
    if (!title) return
    setTasks((current) => [...current, { id: Date.now(), title, cat: 'study', pri: 'med', col: 'today', done: false }])
    setDraft('')
  }

  function toggleTask(id) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task))
  }

  return (
    <div id="v-planner" className="view active">
      <div className="ph">
        <div>
          <div className="ph-eye">Organize</div>
          <div className="ph-title">My Planner</div>
          <div className="ph-sub">Board - Calendar - Focus Mode - Weekly Schedule</div>
        </div>
      </div>

      <div className="pln-shell">
        <div className="pln-topbar">
          <div className="pln-add-bar">
            <span className="pln-add-ico">+</span>
            <input
              className="pln-add-inp"
              placeholder='Quick add: "Review pharm friday high"'
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') addTask()
              }}
            />
            <span className="pln-add-hint">study - medium - today</span>
            <button className="pln-add-btn" type="button" onClick={addTask}>Add Task</button>
          </div>
          <div className="pln-view-toggle">
            <div className="pln-vtab active">■ Board</div>
            <div className="pln-vtab">≡ List</div>
          </div>
        </div>

        <div className="pln-stats-bar">
          <Stat value={tasks.length} label="Total Tasks" tone="sn-navy" />
          <Stat value={done} label="Done Today" tone="sn-ok" />
          <Stat value={high} label="High Priority" tone="sn-red" />
          <div className="pln-progress-pill">
            <div className="pln-prog-label">Today&apos;s Progress</div>
            <div className="pln-prog-track"><div className="pln-prog-fill" style={{ width: `${progress}%` }} /></div>
            <div className="pln-prog-pct">{progress}%</div>
          </div>
        </div>

        <div className="pln-filters">
          {['All', 'Study', 'Practice', 'Event', 'Chapter'].map((filter, index) => (
            <div key={filter} className={`pln-fchip ${index === 0 ? 'active' : ''} ${index === 1 ? 'fc-study' : ''}`}>{filter}</div>
          ))}
        </div>

        <div className="pln-body">
          <div className="pln-sidebar">
            <div className="pln-cal-card">
              <div className="pln-cal-hdr">
                <div className="pln-cal-mo">April 2026</div>
                <span className="pln-cal-expand-btn">Expand tasks ↓</span>
                <div className="pln-cal-nav"><div className="pln-cal-arr">‹</div><div className="pln-cal-arr">›</div></div>
              </div>
              <div className="pln-cal-days-hdr">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <div key={day} className="pln-cal-dh">{day}</div>)}
              </div>
              <div className="pln-cal-grid">
                {Array.from({ length: 35 }, (_, index) => (
                  <div key={index} className={`pln-cal-day ${index === 10 ? 'today' : ''}`}>
                    <span>{index + 1 <= 30 ? index + 1 : ''}</span>
                    {[10, 15, 22].includes(index) && <i />}
                  </div>
                ))}
              </div>
            </div>

            <div className="pln-momentum">
              <div className="pln-mom-hd">Today&apos;s Momentum</div>
              <div className="pln-mom-inner">
                <div className="pln-mom-ring-wrap">
                  <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
                    <circle cx="32" cy="32" r="26" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeDasharray="163.4" strokeDashoffset={163.4 - (163.4 * progress) / 100} transform="rotate(-90 32 32)" />
                  </svg>
                  <div className="pln-mom-pct">{progress}%</div>
                </div>
                <div className="pln-mom-stats"><div className="pln-mom-stat-num">{done}</div><div className="pln-mom-stat-lbl">Completed</div></div>
                <div className="pln-mom-divider" />
                <div className="pln-mom-stats"><div className="pln-mom-stat-num">{tasks.length - done}</div><div className="pln-mom-stat-lbl">Remaining</div></div>
              </div>
            </div>
          </div>

          <div className="pln-main">
            <div className="pln-board">
              {columns.map(([key, label, color]) => (
                <div className="pln-col" key={key}>
                  <div className="pln-col-hdr">
                    <div className="pln-col-title"><div className="pln-col-title-dot" style={{ background: color }} />{label}</div>
                    <div className="pln-col-count">{grouped[key].length}</div>
                  </div>
                  <div className="pln-col-body">
                    {grouped[key].map((task) => (
                      <button key={task.id} className={`pln-task ${task.done ? 'done' : ''}`} type="button" onClick={() => toggleTask(task.id)}>
                        <div className="pln-task-title">{task.title}</div>
                        <div className="pln-task-meta"><span className={`pln-cat-badge cat-${task.cat}`}>{task.cat}</span><span>{task.pri}</span></div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ value, label, tone }) {
  return (
    <div className="pln-stat-pill">
      <div><div className={`pln-stat-pill-num ${tone}`}>{value}</div><div className="pln-stat-pill-lbl">{label}</div></div>
    </div>
  )
}

export default PlannerPage
