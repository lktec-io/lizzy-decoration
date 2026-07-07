function ChartCard({ title, loading, empty, emptyMessage = 'No data yet', children }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{title}</span>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: 260 }}>
            <span className="spinner" aria-label="Loading" />
          </div>
        ) : empty ? (
          <div className="flex items-center justify-center text-sm text-secondary" style={{ height: 260 }}>
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default ChartCard;
