function KPICard({ icon: Icon, label, value, formatter }) {
  const displayValue = formatter ? formatter(value) : value;

  return (
    <div className="card kpi-card">
      <div>
        <div className="kpi-card-label">{label}</div>
        <div className="kpi-card-value">{displayValue}</div>
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
