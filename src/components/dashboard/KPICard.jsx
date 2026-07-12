import AnimatedCounter from './AnimatedCounter';

function KPICard({ icon: Icon, label, value, formatter }) {
  return (
    <div className="card card-hover kpi-card">
      <div>
        <div className="kpi-card-label">{label}</div>
        <div className="kpi-card-value">
          <AnimatedCounter value={value} formatter={formatter || ((v) => v)} />
        </div>
      </div>
      {Icon && (
        <div className="kpi-card-icon">
          <Icon aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

export default KPICard;
