import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

// Turns a "#RRGGBB" accent into an "r, g, b" triple so CSS can build
// low-opacity washes/glows from it via rgba(var(--kpi-accent-rgb), a) —
// every accent in Dashboard.jsx's KPI_DEFS is a plain hex literal, so this
// never needs to handle named colors or shorthand hex.
function hexToRgbTriple(hex) {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function KPICard({ icon: Icon, label, value, formatter, subtitle, accent }) {
  const gradientStyle = accent ? { backgroundImage: `linear-gradient(135deg, var(--color-primary), ${accent})` } : undefined;
  // Each card gets its own identity via one CSS custom property — the
  // background wash, hover glow, and accent bar in cards.css all derive
  // from this single source instead of three separate inline styles.
  const cardStyle = accent ? { '--kpi-accent-rgb': hexToRgbTriple(accent) } : undefined;

  return (
    <div className="card card-hover kpi-card" style={cardStyle}>
      <div className="kpi-card-main">
        <div className="kpi-card-label">{label}</div>
        <div className="kpi-card-value">
          <AnimatedCounter value={value} formatter={formatter || ((v) => v)} />
        </div>
        {subtitle && <div className="kpi-card-subtitle">{subtitle}</div>}
      </div>
      {Icon && (
        <div className="kpi-card-icon" style={gradientStyle}>
          <Icon aria-hidden="true" />
        </div>
      )}
      <motion.span
        className="kpi-card-accent-bar"
        style={accent ? { backgroundColor: accent } : undefined}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

export default KPICard;
