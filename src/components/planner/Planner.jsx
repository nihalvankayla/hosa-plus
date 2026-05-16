import { useMemo, useState } from 'react'
import { plannerTasks } from '../../data/hosaDashboardData.js'

const filters = ['Today', 'Week', 'Project']

function Planner({ initialTasks = plannerTasks }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [newTask, setNewTask] = useState('')
  const [activeFilter, setActiveFilter] = useState(filters[0])

  const completedCount = useMemo(
    () => tasks.filter((task) => task.done).length,
    [tasks],
  )
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0

  function addTask() {
    const title = newTask.trim()
    if (!title) return

    setTasks([...tasks, { title, tag: activeFilter, done: false }])
    setNewTask('')
  }

  function toggleTask(taskTitle) {
    setTasks(
      tasks.map((task) =>
        task.title === taskTitle ? { ...task, done: !task.done } : task,
      ),
    )
  }

  return (
    <section className="rounded-[14px] border border-[rgba(9,87,134,0.11)] bg-white/70 p-4 shadow-[0_2px_12px_rgba(9,87,134,0.07)] backdrop-blur">
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center rounded-full border-[1.5px] border-[rgba(9,87,134,0.18)] bg-white px-4 shadow-[0_2px_10px_rgba(9,87,134,0.06)] focus-within:border-[#095786] focus-within:shadow-[0_0_0_3px_rgba(9,87,134,0.10)]">
          <span className="mr-3 text-[15px] font-light text-[#095786]/45">+</span>
          <input
            value={newTask}
            onChange={(event) => setNewTask(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') addTask()
            }}
            className="min-w-0 flex-1 bg-transparent py-2.5 text-xs text-[#0d1a24] outline-none placeholder:text-[#7a93a8]"
            placeholder="Add a prep task..."
          />
          <span className="mr-2 hidden border-r border-[rgba(9,87,134,0.08)] px-2 font-mono text-[8px] text-[#095786] sm:inline">
            ENTER
          </span>
          <button
            type="button"
            onClick={addTask}
            className="rounded-full bg-gradient-to-br from-[#095786] to-[#0d6fa8] px-4 py-2 text-[11.5px] font-semibold text-white transition hover:scale-[1.02] hover:opacity-90"
          >
            Add
          </button>
        </div>

        <div className="flex shrink-0 rounded-full bg-[#ede7d9] p-1">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-3.5 py-1.5 text-[10.5px] font-medium transition ${
                activeFilter === filter
                  ? 'bg-white text-[#095786] shadow-[0_1px_5px_rgba(9,87,134,0.12)]'
                  : 'text-[#7a93a8]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[254px_1fr]">
        <aside className="space-y-2">
          <PlannerStat value={tasks.length} label="Open tasks" tone="navy" />
          <PlannerStat value={tasks.length - completedCount} label="Needs focus" tone="red" />
          <PlannerStat value={completedCount} label="Done" tone="green" />
        </aside>

        <div className="rounded-[14px] border border-[rgba(9,87,134,0.11)] bg-white/75 p-4">
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#7a93a8]">
                Progress
              </span>
              <span className="font-mono text-[10px] font-semibold text-[#095786]">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#ede7d9]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#095786] to-[#0d6fa8] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => (
              <button
                key={task.title}
                type="button"
                onClick={() => toggleTask(task.title)}
                className="flex w-full items-center gap-3 rounded-[9px] border border-[rgba(9,87,134,0.11)] bg-white/80 px-3 py-3 text-left transition hover:border-[rgba(9,87,134,0.18)]"
              >
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-md border text-[10px] ${
                    task.done
                      ? 'border-[#059669] bg-[#059669] text-white'
                      : 'border-[rgba(9,87,134,0.18)] bg-white text-transparent'
                  }`}
                >
                  ok
                </span>
                <span className={`flex-1 text-[12px] ${task.done ? 'text-[#7a93a8] line-through' : 'text-[#0d1a24]'}`}>
                  {task.title}
                </span>
                <span className="rounded-full border border-[rgba(9,87,134,0.13)] bg-[rgba(9,87,134,0.07)] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.08em] text-[#095786]">
                  {task.tag}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function PlannerStat({ value, label, tone }) {
  const colors = {
    navy: 'text-[#095786]',
    red: 'text-[#ae0000]',
    green: 'text-[#06786d]',
  }

  return (
    <div className="flex items-center gap-2 rounded-[9px] border border-[rgba(9,87,134,0.11)] bg-white px-3.5 py-3 shadow-[0_1px_5px_rgba(9,87,134,0.04)]">
      <span className={`font-mono text-lg font-bold leading-none ${colors[tone]}`}>
        {value}
      </span>
      <span className="font-mono text-[9px] leading-tight text-[#7a93a8]">{label}</span>
    </div>
  )
}

export default Planner
