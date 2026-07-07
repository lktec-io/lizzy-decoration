import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';

// Generic list-page state: pagination + search + arbitrary filters + sort,
// wired to any service function shaped as fetchFn(params) -> { items, meta }.
export function useTable(fetchFn, { initialLimit = 20, initialFilters = {} } = {}) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: initialLimit, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState(null);

  const debouncedSearch = useDebounce(search, 350);
  const filtersKey = JSON.stringify(filters);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: initialLimit, search: debouncedSearch || undefined, sort, ...filters };
      const result = await fetchFn(params);
      setItems(result.items);
      setMeta(result.meta);
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters tracked via filtersKey below
  }, [page, initialLimit, debouncedSearch, sort, filtersKey]);

  // Data fetching in an effect is a standard, documented React pattern —
  // https://react.dev/learn/you-might-not-need-an-effect#fetching-data.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Reset to page 1 whenever the search term or filters change, so a new
  // query never lands on a page that no longer exists.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [debouncedSearch, filtersKey]);

  return {
    items,
    meta,
    loading,
    error,
    page,
    setPage,
    search,
    setSearch,
    filters,
    setFilters,
    sort,
    setSort,
    refetch: load,
  };
}
