import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

function KPICard({ icon: Icon, label, value, formatter, subtitle, accent }) {
  const gradientStyle = accent ? { backgroundImage: `linear-gradient(135deg, var(--color-primary), ${accent})` } : undefined;

  return (
    <div className="card card-hover kpi-card">
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
