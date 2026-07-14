import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import PageTransition from '../components/common/PageTransition';

// Mobile-drawer-only entrance/exit — a CSS !important safety net in
// responsive.css forces the desktop rail to stay opacity:1/transform:none
// regardless of this, since isSidebarOpen never becomes true there (the
// hamburger that would toggle it is hidden on desktop).
const SIDEBAR_DRAWER_VARIANTS = {
  closed: { opacity: 0, x: -25, y: 12, scale: 0.98 },
  open: { opacity: 1, x: 0, y: 0, scale: 1 },
};

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  // Single source of truth for the mobile drawer. Every dependent piece of
  // UI (overlay, drawer panel, Navbar's hamburger/X icon, body scroll
  // lock, nav-click auto-close) reads this one boolean — none of them own
  // a second copy of it. `closeSidebar` is the one function anything ever
  // calls to close it; nothing sets isSidebarOpen to false any other way.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const location = useLocation();

  // Belt-and-suspenders close-on-navigate: Sidebar's own nav-click handler
  // already calls closeSidebar() directly before navigating, but this
  // covers every OTHER way the route can change (back/forward, a
  // programmatic navigate() from somewhere that isn't the sidebar).
  // Derived during render (React's "adjusting state when a prop changes"
  // pattern) rather than a useEffect, since this project's lint config
  // treats setState-in-effect as an error for what's really a synchronous
  // derivation, not a side effect.
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    if (isSidebarOpen) setIsSidebarOpen(false);
  }

  // Escape closes the drawer — only listens while it's actually open.
  useEffect(() => {
    if (!isSidebarOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsSidebarOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  // Body scroll lock while the drawer is open, tied to the same state —
  // prevents the page behind the overlay from scrolling on mobile.
  useEffect(() => {
    if (!isSidebarOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  return (
    <div className={`app-shell ${collapsed ? 'app-shell-collapsed' : ''}`}>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className="app-sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      <motion.div
        className={isSidebarOpen ? 'app-sidebar app-sidebar-open' : 'app-sidebar'}
        variants={SIDEBAR_DRAWER_VARIANTS}
        initial={false}
        animate={isSidebarOpen ? 'open' : 'closed'}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} onNavigate={closeSidebar} isOpen={isSidebarOpen} />
      </motion.div>

      <div className="app-navbar">
        <Navbar onMenuClick={toggleSidebar} isOpen={isSidebarOpen} />
      </div>

      <main className="app-main">
        <PageTransition />
      </main>
    </div>
  );
}

export default MainLayout;
