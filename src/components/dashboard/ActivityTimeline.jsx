function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' });
}

function ActivityTimeline({ items, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <span className="spinner" aria-label="Loading" />
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-secondary p-4">No recent activity yet.</p>;
  }

  return (
    <ul className="activity-timeline">
      {items.map((item) => (
        <li key={item.id} className="activity-timeline-item">
          <span className="activity-timeline-time">{formatTime(item.created_at)}</span>
          <span className="activity-timeline-dot" aria-hidden="true" />
          <span className="activity-timeline-description">{item.description}</span>
        </li>
      ))}
    </ul>
  );
}

export default ActivityTimeline;
