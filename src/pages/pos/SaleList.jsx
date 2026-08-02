import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiEye, FiPrinter, FiShoppingCart } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import { useTable } from '../../hooks/useTable';
import * as saleService from '../../services/saleService';
import { formatCurrency } from '../../utils/formatCurrency';

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function SaleList() {
  const { t } = useTranslation('pos');
  const navigate = useNavigate();

  const fetchSales = useCallback((params) => saleService.listSales(params), []);
  const { items, meta, loading, page, setPage, search, setSearch } = useTable(fetchSales);

  const columns = [
    { key: 'sale_number', label: t('colSaleNumber') },
    {
      key: 'customer',
      label: t('common:customer'),
      render: (row) => (row.customer_first_name ? `${row.customer_first_name} ${row.customer_last_name}` : t('walkIn')),
    },
    { key: 'cashier', label: t('colCashier'), render: (row) => `${row.cashier_first_name} ${row.cashier_last_name}` },
    { key: 'branch_name', label: t('common:branch') },
    { key: 'created_at', label: t('common:date'), render: (row) => formatDateTime(row.created_at) },
    { key: 'discount_amount', label: t('common:discount'), render: (row) => (Number(row.discount_amount) > 0 ? formatCurrency(row.discount_amount) : '—') },
    { key: 'total_amount', label: t('common:amount'), render: (row) => formatCurrency(row.total_amount) },
    {
      key: 'status',
      label: t('common:status'),
      render: (row) => (
        <span className={`badge ${row.status === 'voided' ? 'badge-danger' : 'badge-success'}`}>
          {row.status === 'voided' ? t('statusVoided') : t('statusCompleted')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/pos/sales/${row.id}`)} aria-label={t('viewSaleAria')}>
            <FiEye />
          </button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => saleService.printReceipt(row.id)} aria-label={t('reprintReceiptAria')}>
            <FiPrinter />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('saleHistory')}</h1>
          <p className="page-subtitle">{t('saleHistorySubtitle')}</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate('/pos')}>
            <FiShoppingCart aria-hidden="true" /> {t('newSale')}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder={t('searchBySaleNumberPlaceholder')} />
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage={t('noSalesRecordedYet')} />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default SaleList;
