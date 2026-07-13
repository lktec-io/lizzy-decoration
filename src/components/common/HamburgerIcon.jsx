import { motion } from 'framer-motion';

const BAR_TRANSITION = { duration: 0.35, ease: 'easeInOut' };

// A real 3-bar hamburger (not a react-icons glyph) that morphs into an X.
// Bar spacing is height(3px) + gap(6px) = 9px between centers, so the top/
// bottom bars translate by that same 9px to meet in the middle when forming
// the X.
function HamburgerIcon({ open }) {
  return (
    <span className="hamburger-icon" aria-hidden="true">
      <motion.span
        className="hamburger-bar"
        animate={open ? { rotate: 45, y: 9 } : { rotate: 0, y: 0 }}
        transition={BAR_TRANSITION}
      />
      <motion.span
        className="hamburger-bar"
        animate={open ? { opacity: 0, x: -6 } : { opacity: 1, x: 0 }}
        transition={BAR_TRANSITION}
      />
      <motion.span
        className="hamburger-bar"
        animate={open ? { rotate: -45, y: -9 } : { rotate: 0, y: 0 }}
        transition={BAR_TRANSITION}
      />
    </span>
  );
}

export default HamburgerIcon;
