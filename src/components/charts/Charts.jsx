import { readinessAreas } from '../../data/hosaDashboardData.js'

const statusColors = {
  critical: '#ae0000',
  warn: '#d97706',
  healthy: '#059669',
  strong: '#059669',
}

function Charts({ areas = readinessAreas }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
      <RadarChart areas={areas} />
      <ReadinessBars areas={areas} />
    </section>
  )
}

function RadarChart({ areas }) {
  const center = 130
  const maxRadius = 96
  const points = areas
    .map((area, index) => {
      const angle = (index / areas.length) * Math.PI * 2 - Math.PI / 2
      const radius = maxRadius * (area.score / 100)
      return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`
    })
    .join(' ')

  return (
    <article className="rounded-[14px] border border-[rgba(9,87,134,0.11)] bg-white/75 p-4 shadow-[0_2px_12px_rgba(9,87,134,0.07)] backdrop-blur">
      <div className="mb-4">
        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#7a93a8]">
          Knowledge Radar
        </p>
        <h2 className="mt-1 text-[15px] font-semibold text-[#0d1a24]">Readiness map</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-[260px_1fr] md:items-center">
        <div className="relative mx-auto size-[260px]">
          <svg viewBox="0 0 260 260" className="size-full">
            {[0.2, 0.4, 0.6, 0.8, 1].map((step) => (
              <polygon
                key={step}
                points={makeRingPoints(areas.length, center, maxRadius * step)}
                fill="none"
                stroke="rgba(9,87,134,0.11)"
                strokeWidth="1"
              />
            ))}

            {areas.map((area, index) => {
              const angle = (index / areas.length) * Math.PI * 2 - Math.PI / 2
              const x = center + maxRadius * Math.cos(angle)
              const y = center + maxRadius * Math.sin(angle)
              return (
                <line
                  key={area.name}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="rgba(9,87,134,0.10)"
                />
              )
            })}

            <polygon
              points={points}
              fill="rgba(9,87,134,0.16)"
              stroke="rgba(9,87,134,0.58)"
              strokeWidth="2"
            />

            {areas.map((area, index) => {
              const angle = (index / areas.length) * Math.PI * 2 - Math.PI / 2
              const radius = maxRadius * (area.score / 100)
              const x = center + radius * Math.cos(angle)
              const y = center + radius * Math.sin(angle)
              return (
                <circle
                  key={area.name}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={statusColors[area.status]}
                  stroke="white"
                  strokeWidth="2"
                />
              )
            })}
          </svg>

          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center font-mono text-lg font-semibold leading-tight text-[#095786]">
              74%
              <div className="text-[8px] uppercase tracking-[0.16em] text-[#7a93a8]">Ready</div>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.16em] text-[#7a93a8]">
            Region status
          </p>
          <div className="space-y-1">
            {areas.map((area) => (
              <div key={area.name} className="flex items-center gap-2 border-b border-[rgba(9,87,134,0.08)] py-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: statusColors[area.status] }}
                />
                <span className="flex-1 text-[11px] text-[#3a5267]">{area.name}</span>
                <span className="font-mono text-[10px] font-medium" style={{ color: statusColors[area.status] }}>
                  {area.score}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-[9px] border border-[rgba(174,0,0,0.18)] bg-[rgba(174,0,0,0.05)] p-3 font-mono text-[9.5px] leading-6 text-[#3a5267]">
            <strong className="text-[#ae0000]">Triage:</strong> pharmacology and EMT skills need the next study block.
          </div>
        </div>
      </div>
    </article>
  )
}

function ReadinessBars({ areas }) {
  return (
    <article className="rounded-[14px] border border-[rgba(9,87,134,0.11)] bg-white/75 p-4 shadow-[0_2px_12px_rgba(9,87,134,0.07)] backdrop-blur">
      <div className="mb-4">
        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#7a93a8]">
          Analytics
        </p>
        <h2 className="mt-1 text-[15px] font-semibold text-[#0d1a24]">Topic readiness</h2>
      </div>

      <div className="space-y-3">
        {areas.map((area) => (
          <div key={area.name}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#0d1a24]">{area.name}</span>
              <span className="font-mono text-[10px]" style={{ color: statusColors[area.status] }}>
                {area.score}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#ede7d9]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${area.score}%`,
                  backgroundColor: statusColors[area.status],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

function makeRingPoints(count, center, radius) {
  return Array.from({ length: count })
    .map((_, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2
      return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`
    })
    .join(' ')
}

export default Charts
