import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiEye } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import * as returnService from '../../services/returnService';
import { formatCurrency } from '../../utils/formatCurrency';

const STATUS_BADGE = {
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
};

const REASON_KEYS = {
  damaged: 'reasonDamaged',
  wrong_item: 'reasonWrongItem',
  changed_mind: 'reasonChangedMind',
  expired: 'reasonExpired',
  other: 'reasonOther',
};

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-TZ', { dateStyle: 'medium' });
}

function ReturnList() {
  const { t } = useTranslation('returns');
  const navigate = useNavigate();
  const canCreate = usePermission('returns.create');

  const fetchReturns = useCallback((params) => returnService.listReturns(params), []);
  const { items, meta, loading, page, setPage, search, setSearch } = useTable(fetchReturns);

  const STATUS_LABELS = {
    pending: t('statusPending'),
    approved: t('statusApproved'),
    rejected: t('statusRejected'),
  };

  const columns = [
    { key: 'return_number', label: t('returnNumberColumn') },
    { key: 'sale_number', label: t('originalSaleColumn') },
    {
      key: 'customer',
      label: t('common:customer'),
      render: (row) => (row.customer_first_name ? `${row.customer_first_name} ${row.customer_last_name}` : t('walkIn')),
    },
    { key: 'reason', label: t('reason'), render: (row) => (REASON_KEYS[row.reason] ? t(REASON_KEYS[row.reason]) : row.reason) },
    { key: 'refund_amount', label: t('refundColumn'), render: (row) => (row.refund_amount != null ? formatCurrency(row.refund_amount) : '—') },
    { key: 'created_at', label: t('common:date'), render: (row) => formatDate(row.created_at) },
    {
      key: 'status',
      label: t('common:status'),
      render: (row) => <span className={`badge ${STATUS_BADGE[row.status] || 'badge-neutral'}`}>{STATUS_LABELS[row.status] || row.status}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/returns/${row.id}`)} aria-label={t('viewReturn')}>
            <FiEye />
          </button>
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
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate('/returns/new')}>
              <FiPlus aria-hidden="true" /> {t('newReturn')}
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder={t('searchPlaceholder')} />
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage={t('emptyList')} />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default ReturnList;
