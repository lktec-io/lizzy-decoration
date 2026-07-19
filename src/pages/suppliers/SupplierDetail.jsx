import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiArrowLeft, FiShoppingCart, FiCheckCircle, FiAlertCircle, FiPlus } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import PageSkeleton from '../../components/common/PageSkeleton';
import Modal from '../../components/common/Modal';
import KPICard from '../../components/dashboard/KPICard';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import * as supplierService from '../../services/supplierService';
import * as purchaseService from '../../services/purchaseService';
import { formatCurrency } from '../../utils/formatCurrency';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-TZ', { dateStyle: 'medium' });
}

function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canRecordPayment = usePermission('purchases.manage');
  const toast = useToast();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const fetchHistory = useCallback((params) => supplierService.getSupplierPurchaseHistory(id, params), [id]);
  const { items, meta, loading: historyLoading, page, setPage } = useTable(fetchHistory);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { amount: '', paymentMethod: 'cash' } });

  const loadSupplier = useCallback(() => {
    supplierService.getSupplier(id).then((data) => {
      setSupplier(data);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    loadSupplier();
  }, [loadSupplier]);

  const openPaymentModal = () => {
    reset({ amount: '', paymentMethod: 'cash' });
    setPaymentError('');
    setPaymentModalOpen(true);
  };

  const onSubmitPayment = async (values) => {
    setPaymentError('');
    try {
      await purchaseService.addSupplierPayment({
        supplierId: Number(id),
        amount: Number(values.amount),
        paymentMethod: values.paymentMethod,
      });
      toast.success('Payment recorded.');
      setPaymentModalOpen(false);
      loadSupplier();
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to record payment.');
    }
  };

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
        {canRecordPayment && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={openPaymentModal}>
              <FiPlus aria-hidden="true" /> Record Payment
            </button>
          </div>
        )}
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

      <Modal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Payment"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setPaymentModalOpen(false)}>Cancel</button>
            <button type="submit" form="supplier-payment-form" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
              Save Payment
            </button>
          </>
        }
      >
        {paymentError && <div className="alert alert-danger mb-4" role="alert">{paymentError}</div>}
        <p className="text-sm text-secondary mb-4">Outstanding balance: {formatCurrency(supplier.outstandingBalance)}</p>
        <form id="supplier-payment-form" onSubmit={handleSubmit(onSubmitPayment)} noValidate>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="amount">Amount</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              className={`form-control ${errors.amount ? 'form-control-error' : ''}`}
              {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Must be positive' } })}
            />
            {errors.amount && <span className="form-error">{errors.amount.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="paymentMethod">Payment Method</label>
            <select id="paymentMethod" className="form-control" {...register('paymentMethod', { required: true })}>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SupplierDetail;
