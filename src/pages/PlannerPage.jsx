import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import {
  PLANNER_COLUMNS,
  PLANNER_FILTERS,
  PRIORITY_COLORS,
  createTaskId,
  filterTasks,
  formatParsePreview,
  formatTimer,
  formatWeekRange,
  getEnergyIcon,
  getPlannerStats,
  getTaskDaysMap,
  getWeekSchedule,
  normalizeTask,
  normalizeTasks,
  parseTaskInput,
} from '../lib/planner.js'
import { loadUserDataFromAccount, saveUserDataToAccount } from '../lib/userDataSync.js'

const FOCUS_SECONDS = 25 * 60
const RING_CIRCUMFERENCE = 163.4

const EMPTY_MODAL = {
  title: '',
  cat: 'study',
  pri: 'med',
  col: 'today',
  energy: 'med',
}

function PlannerPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState('board')
  const [activeFilter, setActiveFilter] = useState('all')
  const [draft, setDraft] = useState('')
  const [parsePreview, setParsePreview] = useState('\u00a0')
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())
  const [calExpanded, setCalExpanded] = useState(false)
  const [collapseState, setCollapseState] = useState({ today: false, week: false, backlog: false })
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalForm, setModalForm] = useState(EMPTY_MODAL)
  const [focusTaskId, setFocusTaskId] = useState(null)
  const [focusSeconds, setFocusSeconds] = useState(FOCUS_SECONDS)
  const [focusRunning, setFocusRunning] = useState(false)
  const [newTaskIds, setNewTaskIds] = useState(new Set())
  const saveTimerRef = useRef(null)

  useEffect(() => {
    if (!user?.id) {
      setTasks([])
      setLoaded(true)
      return
    }

    let alive = true
    const cached = localStorage.getItem(`hosa-plus-planner:${user.id}`)
    if (cached) {
      try {
        setTasks(normalizeTasks(JSON.parse(cached)))
      } catch {
        setTasks([])
      }
    }

    loadUserDataFromAccount(user.id).then((userData) => {
      if (!alive) return
      if (userData?.plannerTasks) {
        setTasks(normalizeTasks(userData.plannerTasks))
      }
      setLoaded(true)
    })

    return () => {
      alive = false
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || !loaded) return

    localStorage.setItem(`hosa-plus-planner:${user.id}`, JSON.stringify(tasks))

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveUserDataToAccount(user.id, undefined, undefined, tasks)
    }, 600)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [tasks, user?.id, loaded])

  useEffect(() => {
    if (!focusRunning) return undefined

    const interval = setInterval(() => {
      setFocusSeconds((current) => {
        if (current <= 1) {
          setFocusRunning(false)
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [focusRunning])

  const filteredTasks = useMemo(
    () => filterTasks(tasks, activeFilter),
    [tasks, activeFilter],
  )
  const stats = useMemo(() => getPlannerStats(tasks), [tasks])
  const grouped = useMemo(
    () =>
      Object.fromEntries(
        PLANNER_COLUMNS.map(([key]) => [key, filteredTasks.filter((task) => task.col === key)]),
      ),
    [filteredTasks],
  )
  const calendar = useMemo(
    () => getTaskDaysMap(tasks, calYear, calMonth),
    [tasks, calYear, calMonth],
  )
  const weekSchedule = useMemo(() => getWeekSchedule(tasks), [tasks])
  const focusTask = tasks.find((task) => task.id === focusTaskId) || null
  const focusProgress = 1 - focusSeconds / FOCUS_SECONDS

  const addTask = useCallback((taskInput) => {
    const task = normalizeTask({ ...taskInput, id: createTaskId(), done: false })
    if (!task.title) return

    setTasks((current) => [task, ...current])
    setNewTaskIds((current) => new Set(current).add(task.id))
    setTimeout(() => {
      setNewTaskIds((current) => {
        const next = new Set(current)
        next.delete(task.id)
        return next
      })
    }, 400)
  }, [])

  function handleQuickAdd() {
    const value = draft.trim()
    if (!value) {
      openAddModal()
      return
    }
    addTask(parseTaskInput(value))
    setDraft('')
    setParsePreview('\u00a0')
  }

  function handleDraftChange(value) {
    setDraft(value)
    if (!value.trim()) {
      setParsePreview('\u00a0')
      return
    }
    setParsePreview(formatParsePreview(parseTaskInput(value)))
  }

  function openAddModal(prefill) {
    if (prefill) {
      setModalForm({
        title: prefill.title,
        cat: prefill.cat,
        pri: prefill.pri,
        col: prefill.col,
        energy: prefill.energy,
      })
    } else if (draft.trim()) {
      const parsed = parseTaskInput(draft)
      setModalForm({
        title: parsed.title,
        cat: parsed.cat,
        pri: parsed.pri,
        col: parsed.col,
        energy: parsed.energy,
      })
    } else {
      setModalForm(EMPTY_MODAL)
    }
    setShowAddModal(true)
  }

  function closeAddModal() {
    setShowAddModal(false)
    setDraft('')
    setParsePreview('\u00a0')
  }

  function submitModal() {
    const title = modalForm.title.trim()
    if (!title) return
    addTask(modalForm)
    closeAddModal()
  }

  function toggleTask(id) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    )
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id))
  }

  function moveTask(id, col) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, col } : task)),
    )
  }

  function openFocus(id) {
    setFocusTaskId(id)
    setFocusSeconds(FOCUS_SECONDS)
    setFocusRunning(false)
  }

  function closeFocus() {
    setFocusTaskId(null)
    setFocusRunning(false)
    setFocusSeconds(FOCUS_SECONDS)
  }

  function toggleFocusTimer() {
    if (focusSeconds <= 0) {
      setFocusSeconds(FOCUS_SECONDS)
      setFocusRunning(true)
      return
    }
    setFocusRunning((current) => !current)
  }

  function resetFocusTimer() {
    setFocusRunning(false)
    setFocusSeconds(FOCUS_SECONDS)
  }

  function completeFocusTask() {
    if (focusTaskId) toggleTask(focusTaskId)
    closeFocus()
  }

  function calNav(dir) {
    setCalMonth((current) => {
      let next = current + dir
      let year = calYear
      if (next < 0) {
        next = 11
        year -= 1
      } else if (next > 11) {
        next = 0
        year += 1
      }
      setCalYear(year)
      return next
    })
  }

  function toggleSection(key) {
    setCollapseState((current) => ({ ...current, [key]: !current[key] }))
  }

  if (!loaded) {
    return (
      <div className="view active">
        <div className="ph">
          <div>
            <div className="ph-eye">Organize</div>
            <div className="ph-title">My Planner</div>
          </div>
        </div>
        <div className="pln-shell">
          <p className="text-xs text-[#7a93a8]">Loading your planner...</p>
        </div>
      </div>
    )
  }

  return (
    <div id="v-planner" className="view active">
      <div className="ph">
        <div>
          <div className="ph-eye">Organize</div>
          <div className="ph-title">My Planner</div>
          <div className="ph-sub">Board · Calendar · Focus Mode · Weekly Schedule</div>
        </div>
      </div>

      <div className="pln-shell">
        <div className="pln-topbar">
          <div className="pln-add-bar">
            <span className="pln-add-ico">+</span>
            <input
              className="pln-add-inp"
              placeholder='Quick add: "Review pharm friday high" — or press Enter for full form...'
              value={draft}
              onChange={(event) => handleDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleQuickAdd()
              }}
            />
            <span className="pln-add-hint">{parsePreview}</span>
            <button className="pln-add-btn" type="button" onClick={() => openAddModal()}>
              Add Task
            </button>
          </div>
          <div className="pln-view-toggle">
            <button
              type="button"
              className={`pln-vtab ${view === 'board' ? 'active' : ''}`}
              onClick={() => setView('board')}
            >
              ■ Board
            </button>
            <button
              type="button"
              className={`pln-vtab ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              ≡ List
            </button>
          </div>
        </div>

        <div className="pln-stats-bar">
          <Stat value={stats.total} label={<>Total<br />Tasks</>} tone="sn-navy" />
          <Stat value={stats.doneToday} label={<>Done<br />Today</>} tone="sn-ok" />
          <Stat value={stats.highPriority} label={<>High<br />Priority</>} tone="sn-red" />
          <div className="pln-progress-pill">
            <div className="pln-prog-label">Today&apos;s Progress</div>
            <div className="pln-prog-track">
              <div className="pln-prog-fill" style={{ width: `${stats.todayProgress}%` }} />
            </div>
            <div className="pln-prog-pct">{stats.todayProgress}%</div>
          </div>
        </div>

        <div className="pln-filters">
          {PLANNER_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`pln-fchip ${filter.className || ''} ${activeFilter === filter.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="pln-body">
          <div className="pln-sidebar">
            <CalendarCard
              calExpanded={calExpanded}
              calMonth={calMonth}
              calYear={calYear}
              calendar={calendar}
              onNav={calNav}
              onToggleExpand={() => setCalExpanded((current) => !current)}
            />

            <div className="pln-momentum">
              <div className="pln-mom-hd">Today&apos;s Momentum</div>
              <div className="pln-mom-inner">
                <div className="pln-mom-ring-wrap">
                  <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="white"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={RING_CIRCUMFERENCE * (1 - stats.todayProgress / 100)}
                      transform="rotate(-90 32 32)"
                      style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)' }}
                    />
                  </svg>
                  <div className="pln-mom-pct">{stats.todayProgress}%</div>
                </div>
                <div className="pln-mom-stats">
                  <div className="pln-mom-stat-num">{stats.todayDone}</div>
                  <div className="pln-mom-stat-lbl">Completed</div>
                </div>
                <div className="pln-mom-divider" />
                <div className="pln-mom-stats">
                  <div className="pln-mom-stat-num">{stats.todayRemaining}</div>
                  <div className="pln-mom-stat-lbl">Remaining</div>
                </div>
              </div>
            </div>

            <div className="pln-week-card">
              <div className="card-hd" style={{ marginBottom: 10 }}>
                <div className="card-title">This Week</div>
                <div className="ctag" style={{ fontSize: 8 }}>{formatWeekRange()}</div>
              </div>
              <div id="pln-week-body">
                {weekSchedule.map((day) => (
                  <div key={day.label} className={`pln-week-day ${day.isToday ? 'pln-wd-today' : ''}`}>
                    <div className="pln-wd-lbl" style={day.isToday ? { color: 'var(--maroon)', fontWeight: 700 } : undefined}>
                      {day.label}
                    </div>
                    <div className="pln-wd-tasks">
                      {day.tasks.length ? (
                        day.tasks.map((task) => (
                          <div key={task.id} className="pln-wd-task">{task.title}</div>
                        ))
                      ) : (
                        <div className="pln-wd-task" style={{ opacity: 0.45 }}>No tasks</div>
                      )}
                    </div>
                    <div className="pln-wd-count">{day.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pln-main">
            {view === 'board' ? (
              <div className="pln-board">
                {PLANNER_COLUMNS.map(([key, label, color]) => (
                  <div className="pln-col" key={key}>
                    <div className="pln-col-hdr">
                      <div className="pln-col-title">
                        <div className="pln-col-title-dot" style={{ background: color }} />
                        {label}
                      </div>
                      <div className="pln-col-count">{grouped[key].length}</div>
                    </div>
                    <div className="pln-col-body">
                      {grouped[key].length ? (
                        grouped[key].map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            column={key}
                            isNew={newTaskIds.has(task.id)}
                            onDelete={deleteTask}
                            onFocus={openFocus}
                            onMove={moveTask}
                            onToggle={toggleTask}
                          />
                        ))
                      ) : (
                        <ColumnEmpty column={key} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pln-list-view">
                {PLANNER_COLUMNS.map(([key, label, color]) => {
                  const sectionTasks = grouped[key]
                  const collapsed = collapseState[key]
                  return (
                    <div className="pln-list-section" key={key}>
                      <button
                        type="button"
                        className={`pln-list-sec-hdr ${collapsed ? 'collapsed' : ''}`}
                        onClick={() => toggleSection(key)}
                      >
                        <span style={{ color }}>●</span>
                        {label}
                        <span style={{ fontWeight: 400, color: 'var(--t3)' }}>({sectionTasks.length})</span>
                        <span className="pln-list-sec-arrow" style={{ marginLeft: 'auto' }}>▼</span>
                      </button>
                      <div className={`pln-list-tasks ${collapsed ? 'collapsed' : ''}`}>
                        {sectionTasks.map((task) => (
                          <div key={task.id} className={`pln-list-task ${task.done ? 'pln-done' : ''}`}>
                            <div className="pln-list-pri-bar" style={{ background: PRIORITY_COLORS[task.pri] }} />
                            <button
                              type="button"
                              className={`pln-task-check ${task.done ? 'checked' : ''}`}
                              onClick={() => toggleTask(task.id)}
                            >
                              {task.done ? '✓' : ''}
                            </button>
                            <div className="pln-task-txt">{task.title}</div>
                            <div className="pln-list-task-right">
                              <span className={`pln-cat-badge cat-${task.cat}`}>{task.cat}</span>
                              <button
                                type="button"
                                className="pln-task-action-btn"
                                onClick={() => openFocus(task.id)}
                                title="Focus"
                              >
                                ▣
                              </button>
                              <button
                                type="button"
                                className="pln-task-action-btn del"
                                onClick={() => deleteTask(task.id)}
                                title="Delete"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="pln-add-modal open">
          <button type="button" className="pln-add-modal-bg" aria-label="Close" onClick={closeAddModal} />
          <div className="pln-add-panel">
            <div className="pln-add-panel-title">New Task</div>
            <input
              className="pln-modal-inp"
              placeholder="What needs to get done?"
              value={modalForm.title}
              onChange={(event) => setModalForm((current) => ({ ...current, title: event.target.value }))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitModal()
              }}
            />
            <div className="pln-parse-hint">
              {modalForm.title.trim() ? formatParsePreview(normalizeTask({ ...modalForm, done: false })) : '\u00a0'}
            </div>
            <div className="pln-modal-row">
              <select
                className="pln-modal-sel"
                value={modalForm.cat}
                onChange={(event) => setModalForm((current) => ({ ...current, cat: event.target.value }))}
              >
                <option value="study">Study</option>
                <option value="practice">Practice</option>
                <option value="event">Event</option>
                <option value="chapter">Chapter</option>
              </select>
              <select
                className="pln-modal-sel"
                value={modalForm.pri}
                onChange={(event) => {
                  const pri = event.target.value
                  setModalForm((current) => ({
                    ...current,
                    pri,
                    energy: pri === 'high' ? 'high' : pri === 'low' ? 'low' : 'med',
                  }))
                }}
              >
                <option value="high">High Priority</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                className="pln-modal-sel"
                value={modalForm.col}
                onChange={(event) => setModalForm((current) => ({ ...current, col: event.target.value }))}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="backlog">Backlog</option>
              </select>
              <select
                className="pln-modal-sel"
                value={modalForm.energy}
                onChange={(event) => setModalForm((current) => ({ ...current, energy: event.target.value }))}
              >
                <option value="high">High Energy</option>
                <option value="med">Medium Energy</option>
                <option value="low">Low Energy</option>
              </select>
            </div>
            <div className="pln-modal-footer">
              <button type="button" className="pln-modal-cancel" onClick={closeAddModal}>
                Cancel
              </button>
              <button type="button" className="pln-modal-submit" onClick={submitModal}>
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {focusTask && (
        <div
          className={`pln-focus-overlay ${focusTask ? 'active' : ''}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeFocus()
          }}
        >
          <div className="pln-focus-modal">
            <button type="button" className="pln-focus-close" onClick={closeFocus}>×</button>
            <div className="pln-focus-mode-lbl">Focus Session</div>
            <div className="pln-focus-cat">
              <span className={`pln-cat-badge cat-${focusTask.cat}`}>{focusTask.cat}</span>
            </div>
            <div className="pln-focus-task-name">{focusTask.title}</div>
            <div className="pln-timer-ring-wrap">
              <svg viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
                <circle className="pln-timer-track" cx="75" cy="75" r="60" />
                <circle
                  className="pln-timer-fill"
                  cx="75"
                  cy="75"
                  r="60"
                  strokeDasharray="376.99"
                  strokeDashoffset={376.99 * (1 - focusProgress)}
                />
              </svg>
              <div className="pln-timer-display">
                <div className="pln-timer-time">{formatTimer(focusSeconds)}</div>
                <div className="pln-timer-phase">{focusRunning ? 'FOCUS' : focusSeconds <= 0 ? 'DONE' : 'READY'}</div>
              </div>
            </div>
            <div className="pln-focus-btns">
              <button type="button" className="pln-focus-btn primary" onClick={toggleFocusTimer}>
                {focusRunning ? '⏸ Pause' : focusSeconds <= 0 ? '↻ Restart' : '▶ Start'}
              </button>
              <button type="button" className="pln-focus-btn secondary" onClick={resetFocusTimer}>
                ↺ Reset
              </button>
            </div>
            <button type="button" className="pln-focus-btn done-btn" onClick={completeFocusTask}>
              ✓ Mark Complete &amp; Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ value, label, tone }) {
  return (
    <div className="pln-stat-pill">
      <div>
        <div className={`pln-stat-pill-num ${tone}`}>{value}</div>
        <div className="pln-stat-pill-lbl">{label}</div>
      </div>
    </div>
  )
}

function ColumnEmpty({ column }) {
  const messages = {
    today: 'Nothing for today ✓',
    week: 'This week is clear',
    backlog: 'Backlog empty',
  }

  return (
    <div className="pln-col-empty">
      <div className="pln-col-empty-ico">○</div>
      {messages[column]}
    </div>
  )
}

function TaskCard({ task, column, isNew, onToggle, onDelete, onMove, onFocus }) {
  const otherColumns = {
    today: ['week', 'backlog'],
    week: ['today', 'backlog'],
    backlog: ['today', 'week'],
  }
  const moveLabels = {
    today: '→ Today',
    week: '→ Week',
    backlog: '→ Backlog',
  }

  return (
    <div className={`pln-task-card pri-${task.pri} ${task.done ? 'pln-done' : ''} ${isNew ? 'pln-task-new' : ''}`}>
      <div className="pln-task-top">
        <button
          type="button"
          className={`pln-task-check ${task.done ? 'checked' : ''}`}
          onClick={() => onToggle(task.id)}
        >
          {task.done ? '✓' : ''}
        </button>
        <div className="pln-task-txt">{task.title}</div>
        <div className="pln-task-actions">
          <button
            type="button"
            className="pln-task-action-btn"
            onClick={() => onFocus(task.id)}
            title="Focus Mode"
          >
            ▣
          </button>
          <button
            type="button"
            className="pln-task-action-btn del"
            onClick={() => onDelete(task.id)}
            title="Delete"
          >
            ×
          </button>
        </div>
      </div>
      <div className="pln-task-meta">
        <span className={`pln-cat-badge cat-${task.cat}`}>{task.cat}</span>
        <span className="pln-energy">{getEnergyIcon(task.energy)}</span>
      </div>
      <div className="pln-move-btns">
        {(otherColumns[column] || []).map((target) => (
          <button
            key={target}
            type="button"
            className="pln-move-btn"
            onClick={() => onMove(task.id, target)}
          >
            {moveLabels[target]}
          </button>
        ))}
      </div>
    </div>
  )
}

function CalendarCard({ calYear, calMonth, calExpanded, calendar, onNav, onToggleExpand }) {
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })

  const cells = []
  for (let i = 0; i < firstDay; i += 1) {
    cells.push(<div key={`empty-${i}`} className="pln-cal-cell pln-empty" />)
  }
  for (let day = 1; day <= calendar.daysInMonth; day += 1) {
    const dayTasks = calendar.taskDays[day] || []
    const classes = ['pln-cal-cell']
    if (day === calendar.todayDay) classes.push('pln-today')
    if (dayTasks.length) classes.push('pln-has-tasks')

    cells.push(
      <div key={day} className={classes.join(' ')}>
        <span className="pln-cal-day-num">{day}</span>
        {calExpanded &&
          dayTasks.slice(0, 3).map((task) => (
            <span
              key={task.id}
              className={`pln-cal-task-chip chip-${task.cat}${task.done ? ' chip-done' : ''}`}
            >
              {task.title.length > 14 ? `${task.title.slice(0, 13)}…` : task.title}
            </span>
          ))}
        {calExpanded && dayTasks.length > 3 && (
          <span className="pln-cal-task-chip" style={{ opacity: 0.45 }}>
            +{dayTasks.length - 3} more
          </span>
        )}
      </div>,
    )
  }

  return (
    <div className={`pln-cal-card ${calExpanded ? 'cal-expanded' : ''}`}>
      <div className="pln-cal-hdr">
        <button
          type="button"
          className="pln-cal-mo"
          onClick={onToggleExpand}
          style={{
            cursor: 'pointer',
            textDecoration: 'underline dotted rgba(9,87,134,0.4)',
            textUnderlineOffset: 3,
            background: 'none',
            border: 'none',
            padding: 0,
            font: 'inherit',
          }}
        >
          {monthLabel}
        </button>
        <button type="button" className="pln-cal-expand-btn" onClick={onToggleExpand}>
          {calExpanded ? 'Collapse ↑' : 'Expand tasks ↓'}
        </button>
        <div className="pln-cal-nav">
          <button type="button" className="pln-cal-arr" onClick={() => onNav(-1)}>‹</button>
          <button type="button" className="pln-cal-arr" onClick={() => onNav(1)}>›</button>
        </div>
      </div>
      <div className="pln-cal-days-hdr">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="pln-cal-dh">{day}</div>
        ))}
      </div>
      <div className="pln-cal-grid">{cells}</div>
      <div className="pln-cal-legend">
        <div className="pln-leg-item">
          <div className="pln-leg-dot" style={{ background: 'var(--maroon)' }} />
          Competition
        </div>
        <div className="pln-leg-item">
          <div className="pln-leg-dot" style={{ background: 'var(--navy)' }} />
          Meeting
        </div>
        <div className="pln-leg-item">
          <div className="pln-leg-dot" style={{ background: 'rgba(174,0,0,0.5)' }} />
          Tasks due
        </div>
      </div>
    </div>
  )
}

export default PlannerPage
