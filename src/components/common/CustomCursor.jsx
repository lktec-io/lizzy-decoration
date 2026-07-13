import { useEffect, useRef } from 'react';
import '../../styles/components/CustomCursor.css';

// Anything the ring should visibly grow for.
const HOVER_SELECTOR = 'button, a, [role="button"], .card-hover, .sidebar-link, [data-cursor-hover]';
// Anything that needs the native cursor back (text caret, resize handles,
// embedded content) — the custom cursor hides itself over these instead of
// covering up the affordance they need.
const DISABLE_SELECTOR = 'input, textarea, select, [contenteditable], [contenteditable="true"], iframe, canvas';

// Two-layer custom cursor (dot + lagging ring), desktop/fine-pointer only —
// never mounts its visuals on touch devices, so native touch behavior is
// completely unaffected. Both layers are pointer-events:none and only ever
// write `transform`, so this never intercepts a click and never triggers
// layout/repaint work beyond compositing.
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const state = useRef({ x: 0, y: 0, ringX: 0, ringY: 0, raf: null });

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
    </>
  );
}

export default CustomCursor;
