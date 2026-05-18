import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'linear-gradient(155deg, #f5f0e8 0%, #f7f9fb 45%, #eef4f9 100%)' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '28px 32px' }}>
        <Outlet />
      </main>
    </div>
  )
}
