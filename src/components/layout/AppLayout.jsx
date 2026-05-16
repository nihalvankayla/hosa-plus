import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Sidebar from './Sidebar.jsx'

function AppLayout() {
  return (
    <div className="min-h-screen bg-[linear-gradient(155deg,#f5f0e8_0%,#f7f9fb_45%,#eef4f9_100%)] text-[#0d1a24]">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="w-full px-4 pb-8 pt-20 sm:px-6 md:pt-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-5">
              <Navbar />
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default AppLayout
