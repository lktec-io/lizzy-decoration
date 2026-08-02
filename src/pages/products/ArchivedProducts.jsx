import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft, FiRotateCcw, FiTrash2, FiPackage } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useTable } from '../../hooks/useTable';
import { useToast } from '../../hooks/useToast';
import * as productService from '../../services/productService';
import { formatCurrency } from '../../utils/formatCurrency';

// Super Administrator only (RequirePermission="products.delete" at the
// route level — the same permission that gates the Delete button on the
// main Product List, since "who may archive/remove a product" is one
// authority, not two). Archived here means products.deleted_at IS NOT
// NULL — already invisible to every other list/search/POS/purchase query
// in the app, this page is the only place they're still reachable.
function ArchivedProducts() {
  const { t } = useTranslation('products');
  const navigate = useNavigate();
  const toast = useToast();
  const [pendingRestore, setPendingRestore] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [actionError, setActionError] = useState('');

  const fetchArchived = useCallback((params) => productService.listArchivedProducts(params), []);
  const { items, meta, loading, page, setPage, search, setSearch, refetch } = useTable(fetchArchived);

  const handleRestore = async () => {
    setActionError('');
    try {
      await productService.restoreProduct(pendingRestore.id);
      toast.success(t('productRestored', { name: pendingRestore.name }));
      setPendingRestore(null);
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || t('failedToRestoreProduct'));
    }
  };

  const handlePermanentDelete = async () => {
    setActionError('');
    try {
      await productService.permanentlyDeleteProduct(pendingDelete.id);
      toast.success(t('productPermanentlyDeleted', { name: pendingDelete.name }));
      setPendingDelete(null);
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || t('failedToPermanentlyDeleteProduct'));
      setPendingDelete(null);
    }
  };

  const columns = [
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
    { key: 'selling_price', label: t('sellingPrice'), render: (row) => formatCurrency(row.selling_price) },
    { key: 'deleted_at', label: t('archived'), render: (row) => new Date(row.deleted_at).toLocaleDateString('en-TZ', { dateStyle: 'medium' }) },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPendingRestore(row)} aria-label={t('restoreProduct')}>
            <FiRotateCcw />
          </button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPendingDelete(row)} aria-label={t('permanentlyDeleteProduct')}>
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => navigate('/products')}>
            <FiArrowLeft aria-hidden="true" /> {t('backToProducts')}
          </button>
          <h1 className="page-title">{t('archivedProducts')}</h1>
          <p className="page-subtitle">{t('archivedProductsSubtitle')}</p>
        </div>
      </div>

      {actionError && <div className="alert alert-danger mb-4" role="alert">{actionError}</div>}

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder={t('searchArchivedPlaceholder')} />
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage={t('noArchivedProducts')} />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <ConfirmDialog
        open={Boolean(pendingRestore)}
        onClose={() => setPendingRestore(null)}
        onConfirm={handleRestore}
        title={t('restoreProduct')}
        message={pendingRestore ? t('restoreProductMessage', { name: pendingRestore.name }) : ''}
        confirmLabel={t('restore')}
        variant="primary"
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handlePermanentDelete}
        title={t('permanentlyDeleteProduct')}
        message={pendingDelete ? t('permanentlyDeleteProductMessage', { name: pendingDelete.name }) : ''}
        confirmLabel={t('deletePermanently')}
        variant="danger"
      />
    </div>
  );
}

export default ArchivedProducts;
