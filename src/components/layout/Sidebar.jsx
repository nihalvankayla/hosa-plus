import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const sections = [
  {
    title: 'Operations',
    links: [
      { label: 'Command Center', path: '/dashboard', icon: 'CC' },
      { label: 'Analytics', path: '/analytics', icon: 'A' },
    ],
  },
  {
    title: 'SQT',
    badge: 'Testing',
    links: [
      { label: 'Study Suite', path: '/study', icon: 'SS', badge: '4', badgeColor: 'red' },
      { label: 'Testing', path: '/testing', icon: 'T' },
    ],
  },
  {
    title: 'Non-SQT',
    badge: 'Pres.',
    links: [
      { label: 'Presentation Suite', path: '/study', icon: 'P' },
      { label: 'Scenario Lab', path: '/testing', icon: 'S' },
      { label: 'Collaborators', path: '/dashboard', icon: 'C' },
    ],
  },
]

const moreLinks = [
  { label: 'My Planner', path: '/planner', icon: 'MP' },
  { label: 'Officers Only', path: '/officers', icon: 'Lock' },
]

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-[10px] border border-[rgba(9,87,134,0.16)] bg-white/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#095786] shadow-[0_2px_12px_rgba(9,87,134,0.12)] backdrop-blur md:hidden"
      >
        Menu
      </button>

      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-sm md:hidden"
        />
      )}

      <aside style={{ background: 'linear-gradient(175deg, #042d47 0%, #063d5c 100%)', borderRight: '1px solid rgba(255,255,255,0.06)', boxShadow: '2px 0 20px rgba(0,0,0,0.18)' }}
        className={`fixed inset-y-0 left-0 z-40 flex w-[214px] shrink-0 flex-col overflow-y-auto border-r border-[rgba(9,87,134,0.11)] bg-white/90 shadow-[2px_0_16px_rgba(9,87,134,0.06)] backdrop-blur-2xl transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarBrand />

        <div className="py-3">
          {sections.map((section) => (
            <SidebarSection key={section.title} section={section} onNavigate={() => setIsOpen(false)} />
          ))}

          <div className="px-2 pt-3">
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className="flex w-full items-center gap-2 rounded-[9px] px-3 py-2 text-left text-xs font-medium text-[#3a5267] transition hover:bg-[rgba(9,87,134,0.07)] hover:text-[#095786]"
            >
              <span className="w-3 text-center font-mono text-[11px] text-[#7a93a8]">
                {showMore ? '-' : '+'}
              </span>
              More Tools
            </button>
          </div>

          {showMore && (
            <SidebarSection
              section={{ title: 'Chapter', links: moreLinks }}
              onNavigate={() => setIsOpen(false)}
            />
          )}
        </div>

        <SidebarProfile />
      </aside>
    </>
  )
}

function SidebarBrand() {
  return (
    <div className="flex shrink-0 items-center gap-2.5 border-b border-[rgba(9,87,134,0.11)] px-[15px] py-[17px]">
      <div className="grid size-[34px] place-items-center rounded-[10px] bg-gradient-to-br from-[#095786] to-[#0d6fa8] font-mono text-[11px] font-medium tracking-wide text-white shadow-[0_2px_10px_rgba(9,87,134,0.30)]">
        H+
      </div>
      <div>
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0d1a24]">
          HOSA<span className="font-bold text-[#ae0000]">+</span>
        </div>
        <div className="mt-px text-[9px] text-[#7a93a8]">Clinical Command Center</div>
      </div>
    </div>
  )
}

function SidebarSection({ section, onNavigate }) {
  return (
    <section className="pb-1 pt-3">
      <div className="flex items-center px-[15px] pb-[5px] font-mono text-[8px] font-medium uppercase tracking-[0.22em] text-[#7a93a8]">
        <span>{section.title}</span>
        {section.badge && (
          <span className="ml-auto rounded bg-[rgba(9,87,134,0.07)] px-1.5 py-0.5 text-[7px] tracking-[0.08em] text-[#095786]">
            {section.badge}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-px">
        {section.links.map((link) => (
          <SidebarLink key={link.path} link={link} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  )
}

function SidebarLink({ link, onNavigate }) {
  return (
    <NavLink
      to={link.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        `relative mx-[7px] flex items-center gap-2 rounded-[9px] px-[11px] py-[7px] text-xs transition ${
          isActive
            ? 'bg-[linear-gradient(135deg,rgba(9,87,134,0.10),rgba(9,87,134,0.05))] font-medium text-white before:absolute before:left-0 before:top-1/2 before:h-3/5 before:w-[3px] before:-translate-y-1/2 before:rounded-r before:bg-gradient-to-b before:from-[#095786] before:to-[#0d6fa8]'
            : 'font-normal text-[#3a5267] hover:bg-[rgba(9,87,134,0.07)] hover:text-[#095786]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`w-3.5 shrink-0 text-center font-mono text-[10px] ${
              isActive ? 'text-white' : 'text-[rgba(255,255,255,0.55)]'
            }`}
          >
            {link.icon}
          </span>
          <span className="min-w-0 flex-1 truncate">{link.label}</span>
          {link.badge && <NavBadge color={link.badgeColor}>{link.badge}</NavBadge>}
        </>
      )}
    </NavLink>
  )
}

function NavBadge({ children, color }) {
  const colorClasses =
    color === 'red'
      ? 'border-[rgba(174,0,0,0.14)] bg-[rgba(174,0,0,0.06)] text-[#ae0000]'
      : 'border-[rgba(9,87,134,0.15)] bg-[rgba(9,87,134,0.07)] text-[#095786]'

  return (
    <span className={`ml-auto rounded-full border px-1.5 py-0.5 font-mono text-[8px] font-medium ${colorClasses}`}>
      {children}
    </span>
  )
}

function SidebarProfile() {
  return (
    <div className="mt-auto flex shrink-0 items-center gap-2 border-t border-[rgba(9,87,134,0.11)] px-[15px] py-3">
      <div className="relative grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#095786] to-[#0d6fa8] font-mono text-[9px] font-medium text-white shadow-[0_2px_8px_rgba(9,87,134,0.28)]">
        NJ
        <span className="absolute bottom-0 right-0 size-2 rounded-full border border-[#042d47] bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[11.5px] font-medium text-[#0d1a24]">Nihal J.</div>
        <div className="mt-px text-[9px] text-[#7a93a8]">Comp. Officer</div>
        <div className="mt-1 flex gap-1">
          <span className="rounded border border-[rgba(9,87,134,0.15)] bg-[rgba(9,87,134,0.07)] px-1.5 py-0.5 font-mono text-[8px] font-medium text-[#095786]">
            STATES 40D
          </span>
          <span className="rounded border border-[rgba(9,87,134,0.15)] bg-[rgba(9,87,134,0.07)] px-1.5 py-0.5 font-mono text-[8px] font-medium text-[#095786]">
            STREAK 7
          </span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
