import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

// Counts up from 0 to `value` on mount/change (~800ms), formatting each
// intermediate frame through the same formatter the final value uses so a
// currency-formatted KPI counts up in currency, not raw digits.
function AnimatedCounter({ value, formatter = (v) => v }) {
  const nodeRef = useRef(null);
  const previousValue = useRef(0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return undefined;

    const controls = animate(previousValue.current, Number(value) || 0, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate(latest) {
        node.textContent = formatter(latest);
      },
      onComplete() {
        previousValue.current = Number(value) || 0;
      },
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- formatter is recreated per render by callers; only re-animate when the target value changes
  }, [value]);

  return <span ref={nodeRef}>{formatter(0)}</span>;
}

export default AnimatedCounter;
