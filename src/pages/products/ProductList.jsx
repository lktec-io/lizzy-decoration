import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiPrinter, FiArchive } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ViewToggle from '../../components/common/ViewToggle';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import * as productService from '../../services/productService';
import * as categoryService from '../../services/categoryService';
import * as brandService from '../../services/brandService';
import * as labelService from '../../services/labelService';
import { formatCurrency } from '../../utils/formatCurrency';
import '../../styles/components/ViewToggle.css';

function ProductList() {
  const { t } = useTranslation('products');
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
  const [view, setView] = useState('list');

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
      toast.success(status === 'active' ? t('productsActivated') : t('productsDeactivated'));
      setSelected(new Set());
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || t('failedToUpdateProducts'));
    }
  };

  const handleDelete = async () => {
    await productService.deleteProduct(pendingDelete.id);
    toast.success(t('productPermanentlyDeleted', { name: pendingDelete.name }));
    refetch();
  };

  const handleBulkPrint = async () => {
    setActionError('');
    setPrinting(true);
    try {
      await labelService.printBulkLabels(Array.from(selected), { size: 'medium' });
      toast.success(t('labelsGenerated'));
    } catch {
      setActionError(t('failedToGenerateLabels'));
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
          aria-label={t('selectProduct', { name: row.name })}
        />
      ),
    },
    {
      key: 'name',
      label: t('common:product'),
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
    { key: 'category_name', label: t('common:category') },
    { key: 'brand_name', label: t('brand'), render: (row) => row.brand_name || '—' },
    { key: 'buying_price', label: t('buyingPrice'), render: (row) => formatCurrency(row.buying_price) },
    { key: 'selling_price', label: t('sellingPrice'), render: (row) => formatCurrency(row.selling_price) },
    {
      key: 'status',
      label: t('common:status'),
      render: (row) => <span className={`badge ${row.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{row.status === 'active' ? t('common:active') : t('common:inactive')}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          {canEdit && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/products/${row.id}/edit`)} aria-label={t('editProduct')}>
              <FiEdit2 />
            </button>
          )}
          {canDelete && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPendingDelete(row)} aria-label={t('deleteProduct')}>
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
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle">{t('subtitle')}</p>
        </div>
        <div className="page-actions">
          {canDelete && (
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/products/archived')}>
              <FiArchive aria-hidden="true" /> {t('archivedProducts')}
            </button>
          )}
          {canCreate && (
            <button type="button" className="btn btn-primary" onClick={() => navigate('/products/new')}>
              <FiPlus aria-hidden="true" /> {t('newProduct')}
            </button>
          )}
        </div>
      </div>

      {actionError && <div className="alert alert-danger mb-4" role="alert">{actionError}</div>}

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder={t('searchPlaceholder')} />
          <div className="flex flex-wrap items-center gap-3">
            <select className="form-control" value={filters.categoryId || ''} onChange={(e) => setFilters((prev) => ({ ...prev, categoryId: e.target.value || undefined }))}>
              <option value="">{t('allCategories')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="form-control" value={filters.brandId || ''} onChange={(e) => setFilters((prev) => ({ ...prev, brandId: e.target.value || undefined }))}>
              <option value="">{t('allBrands')}</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {canManage && selected.size > 0 && (
              <>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleBulkStatus('active')}>{t('activateCount', { count: selected.size })}</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleBulkStatus('inactive')}>{t('deactivateCount', { count: selected.size })}</button>
              </>
            )}
            {canPrint && selected.size > 0 && (
              <button type="button" className={`btn btn-secondary btn-sm ${printing ? 'btn-loading' : ''}`} onClick={handleBulkPrint} disabled={printing}>
                <FiPrinter aria-hidden="true" /> {t('printLabelsCount', { count: selected.size })}
              </button>
            )}
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>

        {view === 'list' ? (
          <Table columns={columns} rows={items} loading={loading} emptyMessage={t('noProductsFound')} />
        ) : (
          <div className="management-grid">
            {items.map((row) => (
              <div className="card card-hover management-grid-card" key={row.id}>
                <div className="management-grid-card-header">
                  <div className="management-grid-card-media">
                    {row.images?.[0] ? <img src={row.images[0].image_path} alt={row.name} /> : <FiPackage aria-hidden="true" />}
                  </div>
                  <span className={`badge ${row.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{row.status === 'active' ? t('common:active') : t('common:inactive')}</span>
                </div>
                <div>
                  <div className="management-grid-card-title">{row.name}</div>
                  <div className="management-grid-card-subtitle">{row.code}</div>
                </div>
                <div className="management-grid-card-body">
                  <span>{row.brand_name ? `${row.category_name} · ${row.brand_name}` : row.category_name}</span>
                  <span>{formatCurrency(row.selling_price)}</span>
                </div>
                <div className="management-grid-card-footer">
                  <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelected(row.id)} aria-label={t('selectProduct', { name: row.name })} />
                  <div className="table-actions">
                    {canEdit && (
                      <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/products/${row.id}/edit`)} aria-label={t('editProduct')}>
                        <FiEdit2 />
                      </button>
                    )}
                    {canDelete && (
                      <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPendingDelete(row)} aria-label={t('deleteProduct')}>
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!loading && items.length === 0 && (
              <div className="text-sm text-secondary" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-8)' }}>
                {t('noProductsFound')}
              </div>
            )}
          </div>
        )}

        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title={t('deleteProduct')}
        message={pendingDelete ? t('deleteProductMessage', { name: pendingDelete.name }) : ''}
        confirmLabel={t('common:delete')}
        variant="danger"
      />
    </div>
  );
}

export default ProductList;
