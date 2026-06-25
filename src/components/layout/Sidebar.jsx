import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'

const sections = [
  {
    title: 'Operations',
    links: [{ label: 'Command Center', path: '/dashboard', icon: '▦' }],
  },
  {
    title: 'SQT',
    badge: 'Testing',
    links: [
      { label: 'AI Hub', path: '/analytics', icon: '*' },
      { label: 'Study Suite', path: '/study', icon: '▧', badge: '4', badgeColor: 'r' },
      { label: 'Study Plan', path: '/study-plan', icon: <CalendarIcon /> },
      { label: 'Testing', path: '/testing', icon: '◇' },
    ],
  },
  {
    title: 'Non-SQT',
    badge: 'Pres.',
    links: [
      { label: 'Presentation Suite', path: '/presentation', icon: '▶' },
      { label: 'Scenario Lab', path: '/scenarios', icon: '⬥' },
      { label: 'Collaborators', path: '/collaborators', icon: '▣' },
    ],
  },
]

function Sidebar() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const isMoreRoute = ['/planner', '/officers'].includes(location.pathname)
  const [showMore, setShowMore] = useState(isMoreRoute)
  const isMoreOpen = showMore || isMoreRoute
  const displayName = user?.user_metadata?.full_name || user?.email || 'Student'
  const initials = displayName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <nav id="sidebar">
      <div className="sb-logo">
        <div className="sb-mark">
          <LogoMark />
        </div>
        <div className="sb-text">
          <div className="sb-name" style={{ letterSpacing: '0.1em' }}>
            HOSA<span style={{ color: 'var(--maroon)', fontWeight: 700 }}>+</span>
          </div>
          <div className="sb-sub">Clinical Command Center</div>
        </div>
      </div>

      {sections.map((section) => (
        <SidebarSection key={section.title} section={section} />
      ))}

      <div className="sb-section">
        <div className="sb-nav">
          <button type="button" className="sb-more-toggle" onClick={() => setShowMore(!showMore)}>
            <span className="sb-more-ico">{isMoreOpen ? '-' : '+'}</span>
            <span className="ni-lbl">More Tools</span>
          </button>
        </div>
      </div>

      {isMoreOpen && (
        <div className="sb-more-collapsed-section" style={{ display: 'block' }}>
          <div className="sb-section">
            <div className="sb-grp">Chapter</div>
            <div className="sb-nav">
              <SidebarLink label="My Planner" path="/planner" icon="⌗" />
              <SidebarLink label="Officers Only" path="/officers" icon="Lock" />
            </div>
          </div>
        </div>
      )}

      <div className="sb-foot">
        <div className="sb-av" style={{ position: 'relative' }}>
          {initials || 'HP'}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              border: '1.5px solid #042d47',
              boxShadow: '0 0 6px rgba(34,197,94,0.5)',
            }}
          />
        </div>
        <div className="sb-foot-text">
          <div className="sb-un">{displayName}</div>
          <div className="sb-ur">Student account</div>
          <div className="sb-chips">
            <span className="sb-chip states-chip">STATES 40D</span>
            <span className="sb-chip">STREAK 7</span>
          </div>
        </div>
        <button type="button" className="sb-logout-btn" onClick={signOut}>
          Log out
        </button>
      </div>
    </nav>
  )
}

function SidebarSection({ section }) {
  return (
    <div className="sb-section">
      <div className="sb-grp" style={{ display: 'flex', alignItems: 'center' }}>
        {section.title}
        {section.badge && (
          <span className={`sb-grp-badge ${section.title === 'SQT' ? 'sqt' : 'non'}`} style={{ marginLeft: 'auto' }}>
            {section.badge}
          </span>
        )}
      </div>
      <div className="sb-nav">
        {section.links.map((link) => (
          <SidebarLink key={`${section.title}-${link.label}`} {...link} />
        ))}
      </div>
    </div>
  )
}

function SidebarLink({ label, path, icon, badge, badgeColor }) {
  return (
    <NavLink to={path} className={({ isActive }) => `ni ${isActive ? 'active' : ''}`}>
      <span className="ni-ico">{icon}</span>
      <span className="ni-lbl">{label}</span>
      {badge && <span className={`ni-badge ${badgeColor || ''}`}>{badge}</span>}
    </NavLink>
  )
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true" focusable="false">
      <rect x="2.2" y="3" width="10.6" height="9.4" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 5.8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 1.9v2.2M10 1.9v2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5.1 8h1.1M8.8 8h1.1M5.1 10.1h1.1M8.8 10.1h1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="lgMkReact" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#095786" />
          <stop offset="100%" stopColor="#0a6fa8" />
        </linearGradient>
      </defs>
      <rect width="34" height="34" rx="9" fill="url(#lgMkReact)" />
      <rect x="13.5" y="6.5" width="5.5" height="21" rx="2.5" fill="rgba(255,255,255,0.93)" />
      <rect x="6.5" y="13.5" width="21" height="5.5" rx="2.5" fill="rgba(255,255,255,0.93)" />
      <circle cx="27" cy="7" r="5.5" fill="#ae0000" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <line x1="24.5" y1="7" x2="29.5" y2="7" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="27" y1="4.5" x2="27" y2="9.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default Sidebar
