import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const fetchSales = useCallback((params) => saleService.listSales(params), []);
  const { items, meta, loading, page, setPage, search, setSearch } = useTable(fetchSales);

  const columns = [
    { key: 'sale_number', label: 'Sale #' },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (row.customer_first_name ? `${row.customer_first_name} ${row.customer_last_name}` : 'Walk-in'),
    },
    { key: 'cashier', label: 'Cashier', render: (row) => `${row.cashier_first_name} ${row.cashier_last_name}` },
    { key: 'branch_name', label: 'Branch' },
    { key: 'created_at', label: 'Date', render: (row) => formatDateTime(row.created_at) },
    { key: 'discount_amount', label: 'Discount', render: (row) => (Number(row.discount_amount) > 0 ? formatCurrency(row.discount_amount) : '—') },
    { key: 'total_amount', label: 'Amount', render: (row) => formatCurrency(row.total_amount) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <span className={`badge ${row.status === 'voided' ? 'badge-danger' : 'badge-success'}`}>{row.status}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/pos/sales/${row.id}`)} aria-label="View sale">
            <FiEye />
          </button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => saleService.printReceipt(row.id)} aria-label="Reprint receipt">
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
          <h1 className="page-title">Sale History</h1>
          <p className="page-subtitle">All completed sales across your accessible branches</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate('/pos')}>
            <FiShoppingCart aria-hidden="true" /> New Sale
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by sale number..." />
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage="No sales recorded yet" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default SaleList;
