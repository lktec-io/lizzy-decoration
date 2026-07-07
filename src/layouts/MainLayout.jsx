import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`app-shell ${collapsed ? 'app-shell-collapsed' : ''}`}>
      <div className={mobileOpen ? 'app-sidebar app-sidebar-open' : 'app-sidebar'}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      </div>

      <div className="app-navbar">
        <Navbar onMenuClick={() => setMobileOpen((prev) => !prev)} />
      </div>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
