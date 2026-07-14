import { useEffect, useRef } from 'react';
import '../../styles/components/CustomCursor.css';

// Anything the ring (desktop) or ripple (touch) should visibly react to.
const HOVER_SELECTOR = 'button, a, [role="button"], .card-hover, .sidebar-link, [data-cursor-hover]';
// Anything that needs the native cursor back (text caret, resize handles,
// embedded content) — the custom cursor hides itself over these instead of
// covering up the affordance they need.
const DISABLE_SELECTOR = 'input, textarea, select, [contenteditable], [contenteditable="true"], iframe, canvas';
const RIPPLE_LIFETIME_MS = 550;

// Two-layer custom cursor (dot + lagging ring), desktop/fine-pointer only —
// never mounts its visuals on touch devices, so native touch behavior is
// completely unaffected. Both layers are pointer-events:none and only ever
// write `transform`, so this never intercepts a click and never triggers
// layout/repaint work beyond compositing.
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const glowRef = useRef(null);
  const rippleLayerRef = useRef(null);
  const state = useRef({ x: 0, y: 0, ringX: 0, ringY: 0, raf: null });

  // Touch-follow glow + tap ripple, coarse-pointer (touch) devices only —
  // this is the mobile counterpart to the dot/ring pair above, never runs
  // alongside it since a device is either fine- or coarse-primary.
  useEffect(() => {
    if (!window.matchMedia('(pointer: coarse)').matches) return undefined;

    const root = document.documentElement;
    const glow = glowRef.current;
    const rippleLayer = rippleLayerRef.current;
    root.classList.add('custom-touch-active');
    let hideTimer = null;

    const moveGlow = (x, y) => {
      if (glow) glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const spawnRipple = (x, y) => {
      if (!rippleLayer) return;
      const ripple = document.createElement('span');
      ripple.className = 'touch-ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      rippleLayer.appendChild(ripple);
      setTimeout(() => ripple.remove(), RIPPLE_LIFETIME_MS);
    };

    const handleTouchStart = (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      clearTimeout(hideTimer);
      moveGlow(touch.clientX, touch.clientY);
      root.classList.add('touch-glow-active');

      const target = touch.target;
      const disabled = typeof target.closest === 'function' && target.closest(DISABLE_SELECTOR);
      if (!disabled && typeof target.closest === 'function' && target.closest(HOVER_SELECTOR)) {
        spawnRipple(touch.clientX, touch.clientY);
      }
    };

    const handleTouchMove = (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      moveGlow(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      root.classList.remove('touch-glow-active');
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      root.classList.remove('custom-touch-active', 'touch-glow-active');
      clearTimeout(hideTimer);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;

    const root = document.documentElement;
    root.classList.add('custom-cursor-active');
    const s = state.current;

    const handleMove = (event) => {
      s.x = event.clientX;
      s.y = event.clientY;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;

      const target = event.target;
      const disabled = typeof target.closest === 'function' && target.closest(DISABLE_SELECTOR);
      const hovering = !disabled && typeof target.closest === 'function' && target.closest(HOVER_SELECTOR);
      root.classList.toggle('cursor-hidden', Boolean(disabled));
      root.classList.toggle('cursor-hover-active', Boolean(hovering));
    };

    const handleDown = () => root.classList.add('cursor-click-active');
    const handleUp = () => root.classList.remove('cursor-click-active');
    const handlePageLeave = () => root.classList.add('cursor-hidden');
    const handlePageEnter = () => root.classList.remove('cursor-hidden');

    function tick() {
      s.ringX += (s.x - s.ringX) * 0.18;
      s.ringY += (s.y - s.ringY) * 0.18;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${s.ringX}px, ${s.ringY}px, 0)`;
      s.raf = requestAnimationFrame(tick);
    }

    document.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('mouseup', handleUp);
    document.documentElement.addEventListener('mouseleave', handlePageLeave);
    document.documentElement.addEventListener('mouseenter', handlePageEnter);
    s.raf = requestAnimationFrame(tick);

    return () => {
      root.classList.remove('custom-cursor-active', 'cursor-hidden', 'cursor-hover-active', 'cursor-click-active');
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('mouseup', handleUp);
      document.documentElement.removeEventListener('mouseleave', handlePageLeave);
      document.documentElement.removeEventListener('mouseenter', handlePageEnter);
      if (s.raf) cancelAnimationFrame(s.raf);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={glowRef} className="touch-glow" aria-hidden="true" />
      <div ref={rippleLayerRef} className="touch-ripple-layer" aria-hidden="true" />
    </>
  );
}

export default CustomCursor;
