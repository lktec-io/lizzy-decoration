import { FiGrid, FiList } from 'react-icons/fi';

// A small pill switch between "list" (table) and "grid" (card) rendering
// for a management page. The page itself owns the view state and swaps
// which of its two already-built render paths shows — this component is
// just the control, so no page's table/card markup has to be duplicated
// here.
function ViewToggle({ view, onChange }) {
  return (
    <div className="view-toggle" role="group" aria-label="Toggle list or grid view">
      <button
        type="button"
        className={`view-toggle-btn ${view === 'list' ? 'view-toggle-btn-active' : ''}`}
        onClick={() => onChange('list')}
        aria-pressed={view === 'list'}
        aria-label="List view"
      >
        <FiList aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`view-toggle-btn ${view === 'grid' ? 'view-toggle-btn-active' : ''}`}
        onClick={() => onChange('grid')}
        aria-pressed={view === 'grid'}
        aria-label="Grid view"
      >
        <FiGrid aria-hidden="true" />
      </button>
    </div>
  );
}

export default ViewToggle;
