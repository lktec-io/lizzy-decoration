import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();

  const closeMobile = () => setMobileOpen(false);

  // Robust close-on-navigate: rather than relying solely on each nav
  // element's onClick firing correctly, close whenever the route itself
  // changes — this covers every way a navigation can happen (link click,
  // back/forward, programmatic navigate()) with one mechanism. Derived
  // during render (React's "adjusting state when a prop changes" pattern)
  // rather than a useEffect, since this project's lint config treats
  // setState-in-effect as an error for what's really a synchronous
  // derivation, not a side effect.
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  // Escape closes the drawer — only listens while it's actually open.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

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
