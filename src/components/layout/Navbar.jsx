import { NavLink } from 'react-router-dom'
import { topNavLinks } from '../../data/hosaDashboardData.js'

const statusItems = [
  { value: '40', label: 'Days to States', detail: 'May 11, 2026' },
  { value: '74%', label: 'Readiness', detail: '+6% this week' },
  { value: '7', label: 'Streak', detail: 'Perfect week' },
]

function Navbar() {
  return (
    <header className="rounded-[14px] bg-[linear-gradient(135deg,#042d47_0%,#063d5c_100%)] px-4 py-4 text-white shadow-[0_4px_20px_rgba(4,45,71,0.28)] sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold tracking-[-0.01em]">
            HOSA<span className="font-bold text-[#f87171]">+</span>
            <span className="px-2 font-light text-white/45">//</span>Nihal
          </p>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-white/35">
            Clinical command center
          </p>
        </div>

        <nav className="flex flex-wrap gap-2 lg:ml-4">
          {topNavLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                  isActive
                    ? 'border-white/25 bg-white text-[#095786]'
                    : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="grid gap-3 sm:grid-cols-3 lg:ml-auto lg:flex lg:items-center lg:gap-[18px]">
          {statusItems.map((item, index) => (
            <div key={item.label} className="flex items-center gap-3">
              {index > 0 && <div className="hidden h-11 w-px bg-white/10 lg:block" />}
              <div className="text-left lg:text-center">
                <div className="font-mono text-[28px] font-semibold leading-none tracking-[-0.02em] sm:text-[34px]">
                  {item.value}
                </div>
                <div className="mt-1 text-[9.5px] uppercase tracking-[0.1em] text-white/45">
                  {item.label}
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-[#4ade80]">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}

export default Navbar
