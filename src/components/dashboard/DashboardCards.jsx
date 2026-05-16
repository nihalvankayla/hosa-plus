import { dashboardStats } from '../../data/hosaDashboardData.js'

const toneStyles = {
  navy: {
    bar: 'from-[#095786] to-[#0d6fa8]',
    value: 'text-[#095786]',
    delta: 'text-[#095786]',
  },
  maroon: {
    bar: 'from-[#ae0000] to-[#c41a1a]',
    value: 'text-[#ae0000]',
    delta: 'text-[#ae0000]',
  },
  amber: {
    bar: 'from-[#d97706] to-[#f59e0b]',
    value: 'text-[#d97706]',
    delta: 'text-[#d97706]',
  },
  green: {
    bar: 'from-[#059669] to-[#10b981]',
    value: 'text-[#059669]',
    delta: 'text-[#059669]',
  },
}

function DashboardCards({ stats = dashboardStats }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <DashboardCard key={stat.label} stat={stat} />
      ))}
    </section>
  )
}

function DashboardCard({ stat }) {
  const tone = toneStyles[stat.tone] || toneStyles.navy

  return (
    <article className="relative overflow-hidden rounded-[14px] border border-[rgba(9,87,134,0.11)] bg-white/75 p-[15px] shadow-[0_2px_12px_rgba(9,87,134,0.07),0_1px_3px_rgba(9,87,134,0.05)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(9,87,134,0.10),0_1px_4px_rgba(9,87,134,0.07)]">
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${tone.bar}`} />
      <div className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-[#7a93a8]">
        {stat.label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`font-mono text-3xl font-semibold leading-none tracking-[-0.02em] ${tone.value}`}>
          {stat.value}
        </span>
      </div>
      <div className={`mt-2 text-[10px] font-medium ${tone.delta}`}>{stat.detail}</div>
    </article>
  )
}

export default DashboardCards
