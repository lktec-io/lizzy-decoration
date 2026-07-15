import { useState } from 'react';
import { motion } from 'framer-motion';
import '../../styles/components/TrendBars.css';

function formatDayLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short' });
}

// A compact, self-contained bar trend — deliberately not pulling in a full
// charting library just for one 14-day sparkline-style view. Bar heights
// are relative to the series max; hovering (or tapping, on touch) shows the
// exact date/value in a tooltip, matching the same hover-reveal language
// DoughnutChart already uses elsewhere on this dashboard.
function TrendBars({ data, valueFormatter = (v) => v }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const max = Math.max(1, ...data.map((d) => Number(d.value)));
  const hovered = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="trend-bars">
      <div className="trend-bars-track">
        {data.map((point, index) => {
          const heightPercent = Math.max((Number(point.value) / max) * 100, 2);
          const isHovered = hoveredIndex === index;
          return (
            <button
              type="button"
              key={point.date}
              className={`trend-bars-col ${isHovered ? 'trend-bars-col-active' : ''}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              aria-label={`${formatDayLabel(point.date)}: ${valueFormatter(point.value)}`}
            >
              <motion.span
                className="trend-bars-bar"
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.03 }}
              />
            </button>
          );
        })}
      </div>
      <div className="trend-bars-axis">
        <span>{data.length ? formatDayLabel(data[0].date) : ''}</span>
        <span>{data.length ? formatDayLabel(data[data.length - 1].date) : ''}</span>
      </div>
      {hovered && (
        <div className="trend-bars-tooltip">
          <span className="trend-bars-tooltip-date">{formatDayLabel(hovered.date)}</span>
          <span className="trend-bars-tooltip-value">{valueFormatter(hovered.value)}</span>
        </div>
      )}
    </div>
  );
}

export default TrendBars;
