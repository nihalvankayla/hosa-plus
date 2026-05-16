import Charts from '../components/charts/Charts.jsx'
import DashboardCards from '../components/dashboard/DashboardCards.jsx'

function Analytics() {
  return (
    <div className="space-y-5">
      <header>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#095786]">
          Analytics
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[#0d1a24]">
          Readiness Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3a5267]">
          Watch your strongest and weakest topic areas so each study block has a purpose.
        </p>
      </header>
      <DashboardCards />
      <Charts />
    </div>
  )
}

export default Analytics
