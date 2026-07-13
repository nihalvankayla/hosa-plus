export const PLANNER_COLUMNS = [
  ['today', 'Today', 'var(--maroon)'],
  ['week', 'This Week', 'var(--navy)'],
  ['backlog', 'Backlog', 'var(--beige3)'],
]

export const PLANNER_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'study', label: 'Study', className: 'fc-study' },
  { key: 'practice', label: 'Practice', className: 'fc-practice' },
  { key: 'event', label: 'Event', className: 'fc-event' },
  { key: 'chapter', label: 'Chapter', className: 'fc-chapter' },
]

export const PRIORITY_COLORS = {
  high: 'var(--maroon)',
  med: 'var(--navy)',
  low: 'var(--beige3)',
}

const ENERGY_ICONS = {
  high: '🔥',
  med: '⚡',
  low: '💤',
}

export function createTaskId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function normalizeTask(task, index = 0) {
  const title = (task.title || task.t || '').trim()
  return {
    id: task.id ? String(task.id) : createTaskId(),
    title,
    done: Boolean(task.done),
    cat: task.cat || 'study',
    pri: task.pri || 'med',
    col: task.col || (index < 2 ? 'today' : index < 5 ? 'week' : 'backlog'),
    energy: task.energy || (task.pri === 'high' ? 'high' : task.pri === 'low' ? 'low' : 'med'),
  }
}

export function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) return []
  return tasks
    .map((task, index) => normalizeTask(task, index))
    .filter((task) => task.title)
}

export function parseTaskInput(raw) {
  let text = raw.trim()
  let cat = 'study'
  let pri = 'med'
  let col = 'week'
  let energy = 'med'
  const lower = text.toLowerCase()

  const categoryMap = {
    practice: ['practice', 'drill', 'judge', 'trainer', 'scenario'],
    event: ['event', 'states', 'competition', 'comp'],
    chapter: ['chapter', 'officer', 'meeting', 'peer'],
  }

  Object.entries(categoryMap).forEach(([category, keywords]) => {
    keywords.forEach((keyword) => {
      if (lower.includes(keyword)) cat = category
    })
  })

  if (/\bhigh\b/.test(lower) || /\burgent\b/.test(lower) || /!/.test(raw)) pri = 'high'
  else if (/\blow\b/.test(lower) || /\beasy\b/.test(lower)) pri = 'low'

  if (/\btoday\b/.test(lower) || /\bnow\b/.test(lower)) col = 'today'
  else if (/\bbacklog\b/.test(lower) || /\blater\b/.test(lower)) col = 'backlog'
  else {
    ;['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach((day) => {
      if (lower.includes(day)) col = 'week'
    })
  }

  if (pri === 'high') energy = 'high'
  else if (pri === 'low') energy = 'low'

  text = text
    .replace(
      /\b(high|low|urgent|today|now|backlog|later|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      '',
    )
    .trim()
    .replace(/\s+/g, ' ')

  if (!text) text = raw.trim()

  return normalizeTask({ title: text, cat, pri, col, energy, done: false })
}

export function formatParsePreview(parsed) {
  const priLabel = { high: 'HIGH', med: 'MED', low: 'LOW' }
  return `${parsed.cat} · ${priLabel[parsed.pri]} · ${parsed.col}`
}

export function filterTasks(tasks, filter) {
  if (filter === 'all') return tasks
  return tasks.filter((task) => task.cat === filter)
}

export function getPlannerStats(tasks) {
  const done = tasks.filter((task) => task.done)
  const highPriority = tasks.filter((task) => task.pri === 'high' && !task.done)
  const todayTasks = tasks.filter((task) => task.col === 'today')
  const todayDone = todayTasks.filter((task) => task.done)
  const todayProgress = todayTasks.length
    ? Math.round((todayDone.length / todayTasks.length) * 100)
    : 0

  return {
    total: tasks.length,
    doneToday: todayDone.length,
    highPriority: highPriority.length,
    todayProgress,
    todayDone: todayDone.length,
    todayRemaining: todayTasks.length - todayDone.length,
    todayTotal: todayTasks.length,
  }
}

export function getTaskDaysMap(tasks, year, month) {
  const today = new Date()
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month
  const todayDay = isThisMonth ? today.getDate() : -1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weekStart = today.getDate() - today.getDay()
  const taskDays = {}

  tasks.forEach((task) => {
    let day = null
    if (task.col === 'today') day = todayDay
    else if (task.col === 'week') {
      const offset = (Math.abs(Number.parseInt(String(task.id), 10) || 0) * 13) % 5 + 1
      day = weekStart + offset
      if (day < 1 || day > daysInMonth) day = null
    }

    if (day && day >= 1 && day <= daysInMonth) {
      if (!taskDays[day]) taskDays[day] = []
      taskDays[day].push(task)
    }
  })

  return { taskDays, todayDay, daysInMonth }
}

export function getWeekSchedule(tasks) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const { taskDays, todayDay } = getTaskDaysMap(tasks, now.getFullYear(), now.getMonth())

  return dayLabels.map((label, index) => {
    const dayNumber = weekStart.getDate() + index
    const dayTasks = taskDays[dayNumber] || []
    const isToday = dayNumber === todayDay

    return {
      label,
      isToday,
      tasks: dayTasks,
      count: dayTasks.length,
    }
  })
}

export function getEnergyIcon(energy) {
  return ENERGY_ICONS[energy] || ENERGY_ICONS.med
}

export function formatWeekRange() {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const fmt = (date) =>
    date.toLocaleString('default', { month: 'short', day: 'numeric' })

  return `${fmt(weekStart)}–${fmt(weekEnd)}`
}

export function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
