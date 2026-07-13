import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiPrinter } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import * as productService from '../../services/productService';
import * as categoryService from '../../services/categoryService';
import * as brandService from '../../services/brandService';
import * as labelService from '../../services/labelService';
import { formatCurrency } from '../../utils/formatCurrency';

function ProductList() {
  const navigate = useNavigate();
  const canCreate = usePermission('products.create');
  const canEdit = usePermission('products.edit');
  const canDelete = usePermission('products.delete');
  const canManage = usePermission('products.manage');
  const canPrint = usePermission('products.print');
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [pendingDelete, setPendingDelete] = useState(null);
  const [actionError, setActionError] = useState('');
  const [printing, setPrinting] = useState(false);

  const fetchProducts = useCallback((params) => productService.listProducts(params), []);
  const { items, meta, loading, page, setPage, search, setSearch, filters, setFilters, refetch } = useTable(fetchProducts);

  useEffect(() => {
    categoryService.listActiveCategories().then(setCategories);
    brandService.listActiveBrands().then(setBrands);
  }, []);

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatus = async (status) => {
    setActionError('');
    try {
      await productService.bulkUpdateStatus(Array.from(selected), status);
      toast.success(status === 'active' ? 'Products activated.' : 'Products deactivated.');
      setSelected(new Set());
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update products.');
    }
  };

  const handleDelete = async () => {
    await productService.deleteProduct(pendingDelete.id);
    toast.success('Product deleted.');
    refetch();
  };

  const handleBulkPrint = async () => {
    setActionError('');
    setPrinting(true);
    try {
      await labelService.printBulkLabels(Array.from(selected), { size: 'medium' });
      toast.success('Labels PDF generated.');
    } catch {
      setActionError('Failed to generate labels PDF.');
    } finally {
      setPrinting(false);
    }
  };

  const columns = [
    {
      key: 'select',
      label: '',
      render: (row) => (
        <input
          type="checkbox"
          checked={selected.has(row.id)}
          onChange={() => toggleSelected(row.id)}
          aria-label={`Select ${row.name}`}
        />
      ),
    },
    {
      key: 'name',
      label: 'Product',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="company-logo-preview" style={{ width: 36, height: 36 }}>
            {row.images?.[0] ? <img src={row.images[0].image_path} alt={row.name} /> : <FiPackage className="text-secondary" />}
          </div>
          <div>
            <div>{row.name}</div>
            <div className="text-xs text-secondary">{row.code}</div>
          </div>
        </div>
      ),
    },
    { key: 'category_name', label: 'Category' },
    { key: 'brand_name', label: 'Brand' },
    { key: 'buying_price', label: 'Buying Price', render: (row) => formatCurrency(row.buying_price) },
    { key: 'selling_price', label: 'Selling Price', render: (row) => formatCurrency(row.selling_price) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <span className={`badge ${row.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{row.status}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          {canEdit && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/products/${row.id}/edit`)} aria-label="Edit product">
              <FiEdit2 />
            </button>
          )}
          {canDelete && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPendingDelete(row)} aria-label="Delete product">
              <FiTrash2 />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product catalog</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate('/products/new')}>
              <FiPlus aria-hidden="true" /> New Product
            </button>
          </div>
        )}
      </div>

      {actionError && <div className="alert alert-danger mb-4" role="alert">{actionError}</div>}

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or code..." />
          <div className="flex flex-wrap items-center gap-3">
            <select className="form-control" value={filters.categoryId || ''} onChange={(e) => setFilters((prev) => ({ ...prev, categoryId: e.target.value || undefined }))}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="form-control" value={filters.brandId || ''} onChange={(e) => setFilters((prev) => ({ ...prev, brandId: e.target.value || undefined }))}>
              <option value="">All Brands</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {canManage && selected.size > 0 && (
              <>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleBulkStatus('active')}>Activate ({selected.size})</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleBulkStatus('inactive')}>Deactivate ({selected.size})</button>
              </>
            )}
            {canPrint && selected.size > 0 && (
              <button type="button" className={`btn btn-secondary btn-sm ${printing ? 'btn-loading' : ''}`} onClick={handleBulkPrint} disabled={printing}>
                <FiPrinter aria-hidden="true" /> Print Labels ({selected.size})
              </button>
            )}
          </div>
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage="No products found" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete product"
        message={pendingDelete ? `Delete "${pendingDelete.name}"? This is blocked if any sales or purchases reference it.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}

export default ProductList;
