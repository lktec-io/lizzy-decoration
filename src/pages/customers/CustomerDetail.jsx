import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiShoppingBag, FiDollarSign, FiRotateCcw } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import KPICard from '../../components/dashboard/KPICard';
import { useTable } from '../../hooks/useTable';
import * as customerService from '../../services/customerService';
import { formatCurrency } from '../../utils/formatCurrency';

const CUSTOMER_TYPE_LABELS = {
  walk_in: 'Walk In',
  retail: 'Retail',
  wholesale: 'Wholesale',
  vip: 'VIP',
  business: 'Business',
};

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-TZ', { dateStyle: 'medium' });
}

function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = useCallback((params) => customerService.getCustomerPurchaseHistory(id, params), [id]);
  const purchases = useTable(fetchPurchases);

  const fetchReturns = useCallback((params) => customerService.getCustomerReturnHistory(id, params), [id]);
  const returns = useTable(fetchReturns);

  useEffect(() => {
    customerService.getCustomer(id).then((data) => {
      setCustomer(data);
      setLoading(false);
    });
  }, [id]);

  const purchaseColumns = [
    { key: 'sale_number', label: 'Sale #' },
    { key: 'created_at', label: 'Date', render: (row) => formatDate(row.created_at) },
    { key: 'total_amount', label: 'Amount', render: (row) => formatCurrency(row.total_amount) },
    { key: 'status', label: 'Status', render: (row) => <span className="badge badge-neutral">{row.status}</span> },
  ];

  const returnColumns = [
    { key: 'return_number', label: 'Return #' },
    { key: 'created_at', label: 'Date', render: (row) => formatDate(row.created_at) },
    { key: 'reason', label: 'Reason' },
    { key: 'refund_amount', label: 'Refund', render: (row) => (row.refund_amount != null ? formatCurrency(row.refund_amount) : '—') },
    { key: 'status', label: 'Status', render: (row) => <span className="badge badge-neutral">{row.status}</span> },
  ];

  if (loading || !customer) {
    return (
      <div className="flex items-center justify-center p-6">
        <span className="spinner" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => navigate('/customers')}>
            <FiArrowLeft aria-hidden="true" /> Back to Customers
          </button>
          <h1 className="page-title">{customer.first_name} {customer.last_name}</h1>
          <p className="page-subtitle">
            {customer.customer_code} · {customer.phone} · {CUSTOMER_TYPE_LABELS[customer.customer_type] || customer.customer_type}
            {customer.business_name ? ` · ${customer.business_name}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 mb-5">
        <KPICard icon={FiShoppingBag} label="Total Orders" value={customer.totalOrders} />
        <KPICard icon={FiDollarSign} label="Total Spent" value={customer.totalSpent} formatter={(v) => formatCurrency(v)} />
        <KPICard icon={FiRotateCcw} label="Total Returns" value={customer.totalReturns} />
      </div>

      <div className="card mb-5">
        <div className="card-header"><span className="card-title">Purchase History</span></div>
        <Table columns={purchaseColumns} rows={purchases.items} loading={purchases.loading} emptyMessage="No purchases recorded yet" />
        <Pagination page={purchases.page} totalPages={purchases.meta.totalPages} total={purchases.meta.total} limit={purchases.meta.limit} onPageChange={purchases.setPage} />
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Return History</span></div>
        <Table columns={returnColumns} rows={returns.items} loading={returns.loading} emptyMessage="No returns recorded yet" />
        <Pagination page={returns.page} totalPages={returns.meta.totalPages} total={returns.meta.total} limit={returns.meta.limit} onPageChange={returns.setPage} />
      </div>
    </div>
  );
}

export default CustomerDetail;
