import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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

const PAYMENT_METHOD_VALUES = ['cash', 'mpesa', 'airtel_money', 'bank_transfer'];

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-TZ', { dateStyle: 'medium' });
}

function SupplierDetail() {
  const { t } = useTranslation('suppliers');
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

  const paymentMethodLabel = (value) => {
    if (value === 'cash') return t('common:cash');
    if (value === 'bank_transfer') return t('common:bankTransfer');
    return t(`paymentMethods.${value}`, { defaultValue: value });
  };

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
      toast.success(t('toast.paymentRecorded'));
      setPaymentModalOpen(false);
      loadSupplier();
    } catch (err) {
      setPaymentError(err.response?.data?.message || t('toast.failedToRecordPayment'));
    }
  };

  const columns = [
    { key: 'purchase_number', label: t('columns.purchaseNumber') },
    { key: 'created_at', label: t('common:date'), render: (row) => formatDate(row.created_at) },
    { key: 'total_amount', label: t('common:amount'), render: (row) => formatCurrency(row.total_amount) },
    {
      key: 'status',
      label: t('common:status'),
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
            <FiArrowLeft aria-hidden="true" /> {t('backToSuppliers')}
          </button>
          <h1 className="page-title">{supplier.name}</h1>
          <p className="page-subtitle">{supplier.phone || t('noPhoneOnFile')} {supplier.email ? `· ${supplier.email}` : ''}</p>
        </div>
        {canRecordPayment && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={openPaymentModal}>
              <FiPlus aria-hidden="true" /> {t('recordPayment')}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 mb-5">
        <KPICard icon={FiShoppingCart} label={t('totalPurchased')} value={supplier.totalPurchased} formatter={(v) => formatCurrency(v)} />
        <KPICard icon={FiCheckCircle} label={t('totalPaid')} value={supplier.totalPaid} formatter={(v) => formatCurrency(v)} />
        <KPICard icon={FiAlertCircle} label={t('outstandingBalance')} value={supplier.outstandingBalance} formatter={(v) => formatCurrency(v)} />
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">{t('purchaseHistory')}</span></div>
        <Table columns={columns} rows={items} loading={historyLoading} emptyMessage={t('noPurchasesYet')} />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <Modal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={t('recordPayment')}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setPaymentModalOpen(false)}>{t('common:cancel')}</button>
            <button type="submit" form="supplier-payment-form" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
              {t('savePayment')}
            </button>
          </>
        }
      >
        {paymentError && <div className="alert alert-danger mb-4" role="alert">{paymentError}</div>}
        <p className="text-sm text-secondary mb-4">{t('outstandingBalanceLabel', { amount: formatCurrency(supplier.outstandingBalance) })}</p>
        <form id="supplier-payment-form" onSubmit={handleSubmit(onSubmitPayment)} noValidate>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="amount">{t('common:amount')}</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              className={`form-control ${errors.amount ? 'form-control-error' : ''}`}
              {...register('amount', { required: t('amountRequired'), min: { value: 0.01, message: t('mustBePositive') } })}
            />
            {errors.amount && <span className="form-error">{errors.amount.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="paymentMethod">{t('common:paymentMethod')}</label>
            <select id="paymentMethod" className="form-control" {...register('paymentMethod', { required: true })}>
              {PAYMENT_METHOD_VALUES.map((value) => <option key={value} value={value}>{paymentMethodLabel(value)}</option>)}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SupplierDetail;
