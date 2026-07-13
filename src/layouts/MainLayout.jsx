import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import PageTransition from '../components/common/PageTransition';

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className={`app-shell ${collapsed ? 'app-shell-collapsed' : ''}`}>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="app-sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      <div className={mobileOpen ? 'app-sidebar app-sidebar-open' : 'app-sidebar'}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} onNavigate={closeMobile} />
      </div>

      <div className="app-navbar">
        <Navbar onMenuClick={() => setMobileOpen((prev) => !prev)} />
      </div>

      <main className="app-main">
        <PageTransition />
      </main>
    </div>
  );
}

export default MainLayout;
