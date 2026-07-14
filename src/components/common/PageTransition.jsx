import { Suspense } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PageSkeleton from './PageSkeleton';

const VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// Drop-in replacement for <Outlet /> that fades/slides the outgoing page
// out and the incoming page in on route change, keyed by pathname so
// AnimatePresence treats each route as a distinct element to cross-fade.
//
// The Suspense boundary here is load-bearing, not decorative: AppRouter's
// route-level lazy() imports only throw a promise the first time a given
// page chunk is fetched. Without a Suspense boundary INSIDE MainLayout,
// that suspension bubbles up past MainLayout to AppRouter's top-level
// Suspense — which unmounts MainLayout entirely (sidebar, navbar, and all)
// and replaces the whole screen with a bare spinner until the chunk
// resolves, then remounts everything from scratch. Scoping the boundary to
// just the outlet keeps Sidebar/Navbar mounted (and the sidebar's own
// close state and closing animation intact) across every navigation,
// regardless of whether the target page's chunk is already cached.
function PageTransition() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <Suspense fallback={<PageSkeleton />}>{outlet}</Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
