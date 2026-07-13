import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiShoppingCart, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import PageSkeleton from '../../components/common/PageSkeleton';
import KPICard from '../../components/dashboard/KPICard';
import { useTable } from '../../hooks/useTable';
import * as supplierService from '../../services/supplierService';
import { formatCurrency } from '../../utils/formatCurrency';

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-TZ', { dateStyle: 'medium' });
}

function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback((params) => supplierService.getSupplierPurchaseHistory(id, params), [id]);
  const { items, meta, loading: historyLoading, page, setPage } = useTable(fetchHistory);

  useEffect(() => {
    supplierService.getSupplier(id).then((data) => {
      setSupplier(data);
      setLoading(false);
    });
  }, [id]);

  const columns = [
    { key: 'purchase_number', label: 'Purchase #' },
    { key: 'created_at', label: 'Date', render: (row) => formatDate(row.created_at) },
    { key: 'total_amount', label: 'Amount', render: (row) => formatCurrency(row.total_amount) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <span className="badge badge-neutral">{row.status}</span>,
    },
  ];

  if (loading || !supplier) {
    return <PageSkeleton />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => navigate('/suppliers')}>
            <FiArrowLeft aria-hidden="true" /> Back to Suppliers
          </button>
          <h1 className="page-title">{supplier.name}</h1>
          <p className="page-subtitle">{supplier.phone || 'No phone on file'} {supplier.email ? `· ${supplier.email}` : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 mb-5">
        <KPICard icon={FiShoppingCart} label="Total Purchased" value={supplier.totalPurchased} formatter={(v) => formatCurrency(v)} />
        <KPICard icon={FiCheckCircle} label="Total Paid" value={supplier.totalPaid} formatter={(v) => formatCurrency(v)} />
        <KPICard icon={FiAlertCircle} label="Outstanding Balance" value={supplier.outstandingBalance} formatter={(v) => formatCurrency(v)} />
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Purchase History</span></div>
        <Table columns={columns} rows={items} loading={historyLoading} emptyMessage="No purchases recorded yet" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default SupplierDetail;
