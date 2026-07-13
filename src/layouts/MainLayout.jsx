import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import PageTransition from '../components/common/PageTransition';

// Mobile-drawer-only entrance/exit — a CSS !important safety net in
// responsive.css forces the desktop rail to stay opacity:1/transform:none
// regardless of this, since mobileOpen never becomes true there (the
// hamburger that would toggle it is hidden on desktop).
const SIDEBAR_DRAWER_VARIANTS = {
  closed: { opacity: 0, x: -25, y: 12, scale: 0.98 },
  open: { opacity: 1, x: 0, y: 0, scale: 1 },
};

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

      <motion.div
        className={mobileOpen ? 'app-sidebar app-sidebar-open' : 'app-sidebar'}
        variants={SIDEBAR_DRAWER_VARIANTS}
        initial={false}
        animate={mobileOpen ? 'open' : 'closed'}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} onNavigate={closeMobile} mobileOpen={mobileOpen} />
      </motion.div>

      <div className="app-navbar">
        <Navbar onMenuClick={() => setMobileOpen((prev) => !prev)} menuOpen={mobileOpen} />
      </div>

      <main className="app-main">
        <PageTransition />
      </main>
    </div>
  );
}

export default MainLayout;
