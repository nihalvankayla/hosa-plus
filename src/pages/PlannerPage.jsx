import Planner from '../components/planner/Planner.jsx'

function PlannerPage() {
  return (
    <div className="space-y-5">
      <header>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#095786]">
          Planner
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[#0d1a24]">
          Prep Schedule
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3a5267]">
          Track study tasks, project work, and competition readiness in one place.
        </p>
      </header>
      <Planner />
    </div>
  )
}

export default PlannerPage
