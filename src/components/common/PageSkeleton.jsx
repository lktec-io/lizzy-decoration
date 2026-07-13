import Skeleton from './Skeleton';

// A generic, layout-preserving stand-in for a page's initial load (a
// header-shaped block + a card of line placeholders) — used by detail/edit
// pages that fetch a single record before they have anything real to show,
// so navigating to them shows page structure immediately instead of a
// centered spinner on an otherwise blank page. One shared shape keeps the
// loading language consistent app-wide rather than each page inventing its
// own placeholder.
function PageSkeleton({ rows = 5 }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <Skeleton width={200} height="1.5rem" style={{ marginBottom: 'var(--space-2)' }} />
          <Skeleton width={280} height="1rem" />
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {Array.from({ length: rows }, (_, index) => `skeleton-row-${index}`).map((key, index) => (
            <Skeleton key={key} height="1rem" width={`${92 - index * 9}%`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PageSkeleton;
