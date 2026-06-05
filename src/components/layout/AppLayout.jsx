import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

export default function AppLayout() {
  return (
    <div id="app">
      <Sidebar />
      <main id="main">
        <Outlet />
      </main>
    </div>
  )
}
