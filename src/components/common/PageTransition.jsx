import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// Drop-in replacement for <Outlet /> that fades/slides the outgoing page
// out and the incoming page in on route change, keyed by pathname so
// AnimatePresence treats each route as a distinct element to cross-fade.
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
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
