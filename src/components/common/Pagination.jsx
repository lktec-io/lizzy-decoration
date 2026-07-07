import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function Pagination({ page, totalPages, total, limit, onPageChange }) {
  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="table-pagination">
      <span>
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <FiChevronLeft />
        </button>
        <span className="text-sm">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
