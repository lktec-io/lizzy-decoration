import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiDroplet, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import KPICard from '../../components/dashboard/KPICard';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import * as carwashService from '../../services/carwashService';
import * as branchService from '../../services/branchService';
import { formatCurrency } from '../../utils/formatCurrency';

const PAYMENT_METHODS = [
  { value: 'cash', key: 'common:cash' },
  { value: 'mpesa', key: 'paymentMethodMpesa' },
  { value: 'airtel_money', key: 'paymentMethodAirtelMoney' },
];

const DEFAULT_VALUES = {
  plateNumber: '', customerName: '', phone: '', serviceId: '', branchId: '', amount: '', paymentMethod: 'cash',
};

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function CarWash() {
  const { t } = useTranslation('carwash');
  const canCreate = usePermission('carwash.create');
  const canEdit = usePermission('carwash.edit');
  const canDelete = usePermission('carwash.delete');
  const toast = useToast();

  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);

  const fetchTransactions = useCallback((params) => carwashService.listCarwashTransactions(params), []);
  const { items, meta, loading, page, setPage, search, setSearch, filters, setFilters, refetch } = useTable(fetchTransactions);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: DEFAULT_VALUES });

  const selectedServiceId = watch('serviceId');

  useEffect(() => {
    carwashService.listCarwashServices().then(setServices);
    branchService.listActiveBranches().then(setBranches);
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset(DEFAULT_VALUES);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({
      plateNumber: row.plate_number,
      customerName: row.customer_name,
      phone: row.phone,
      serviceId: String(row.service_id),
      branchId: String(row.branch_id),
      amount: row.amount,
      paymentMethod: row.payment_method,
    });
    setError('');
    setModalOpen(true);
  };

  const handleServiceChange = (event) => {
    const serviceId = event.target.value;
    setValue('serviceId', serviceId);
    const service = services.find((s) => String(s.id) === String(serviceId));
    if (service) setValue('amount', service.price);
  };

  const onSubmit = async (values) => {
    setError('');
    const payload = {
      plateNumber: values.plateNumber,
      customerName: values.customerName,
      phone: values.phone,
      serviceId: Number(values.serviceId),
      branchId: Number(values.branchId),
      amount: Number(values.amount),
      paymentMethod: values.paymentMethod,
    };
    try {
      if (editing) {
        await carwashService.updateCarwashTransaction(editing.id, payload);
        toast.success(t('carwashUpdated'));
      } else {
        await carwashService.recordCarwashTransaction(payload);
        toast.success(t('carwashRecorded'));
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || t('failedToSaveTransaction'));
    }
  };

  const handleDelete = async () => {
    try {
      await carwashService.deleteCarwashTransaction(pendingDelete.id);
      toast.success(t('carwashDeleted'));
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || t('failedToDeleteTransaction'));
    }
  };

  const columns = [
    { key: 'created_at', label: t('common:date'), render: (row) => formatDateTime(row.created_at) },
    { key: 'plate_number', label: t('plateNumberColumn') },
    { key: 'customer_name', label: t('common:customer'), render: (row) => `${row.customer_name} · ${row.phone}` },
    { key: 'service_name', label: t('service') },
    { key: 'branch_name', label: t('common:branch') },
    { key: 'payment_method', label: t('paymentColumn'), render: (row) => { const m = PAYMENT_METHODS.find((pm) => pm.value === row.payment_method); return m ? t(m.key) : row.payment_method; } },
    { key: 'served_by', label: t('servedByColumn'), render: (row) => `${row.served_by_first_name} ${row.served_by_last_name}` },
    { key: 'amount', label: t('common:amount'), render: (row) => formatCurrency(row.amount) },
    ...(canEdit || canDelete ? [{
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          {canEdit && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => openEdit(row)} aria-label={t('editTransaction')}>
              <FiEdit2 />
            </button>
          )}
          {canDelete && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPendingDelete(row)} aria-label={t('deleteTransaction')}>
              <FiTrash2 />
            </button>
          )}
        </div>
      ),
    }] : []),
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
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <FiPlus aria-hidden="true" /> {t('newService')}
            </button>
          </div>
        )}
      </div>

      <div className="mb-5">
        <KPICard icon={FiDroplet} label={t('revenueFilteredResults')} value={meta.totalAmount || 0} formatter={(v) => formatCurrency(v)} />
      </div>

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder={t('searchPlaceholder')} />
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="form-control"
              value={filters.serviceId || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, serviceId: e.target.value || undefined }))}
            >
              <option value="">{t('allServices')}</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select
              className="form-control"
              value={filters.branchId || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, branchId: e.target.value || undefined }))}
            >
              <option value="">{t('common:allBranches')}</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <input
              type="date"
              className="form-control"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value || undefined }))}
            />
            <input
              type="date"
              className="form-control"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value || undefined }))}
            />
          </div>
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage={t('emptyList')} />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('modalTitleEdit') : t('modalTitleNew')}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>{t('common:cancel')}</button>
            <button type="submit" form="carwash-form" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
              {editing ? t('saveChanges') : t('recordAndReceivePayment')}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}
        <form id="carwash-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="plateNumber">{t('plateNumberLabel')}</label>
            <input id="plateNumber" className={`form-control ${errors.plateNumber ? 'form-control-error' : ''}`} {...register('plateNumber', { required: t('plateNumberRequired') })} />
            {errors.plateNumber && <span className="form-error">{errors.plateNumber.message}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="customerName">{t('customerNameLabel')}</label>
              <input id="customerName" className={`form-control ${errors.customerName ? 'form-control-error' : ''}`} {...register('customerName', { required: t('customerNameRequired') })} />
              {errors.customerName && <span className="form-error">{errors.customerName.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="phone">{t('phoneNumberLabel')}</label>
              <input id="phone" className={`form-control ${errors.phone ? 'form-control-error' : ''}`} {...register('phone', { required: t('phoneNumberRequired') })} />
              {errors.phone && <span className="form-error">{errors.phone.message}</span>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="serviceId">{t('service')}</label>
            <select
              id="serviceId"
              className={`form-control ${errors.serviceId ? 'form-control-error' : ''}`}
              {...register('serviceId', { required: t('serviceRequired') })}
              onChange={handleServiceChange}
              value={selectedServiceId}
            >
              <option value="">{t('selectService')}</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.price)})</option>)}
            </select>
            {errors.serviceId && <span className="form-error">{errors.serviceId.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="branchId">{t('common:branch')}</label>
            <select id="branchId" className={`form-control ${errors.branchId ? 'form-control-error' : ''}`} {...register('branchId', { required: t('branchRequired') })}>
              <option value="">{t('selectBranch')}</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {errors.branchId && <span className="form-error">{errors.branchId.message}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="amount">{t('common:amount')}</label>
              <input id="amount" type="number" min="0" step="0.01" className={`form-control ${errors.amount ? 'form-control-error' : ''}`} {...register('amount', { required: t('amountRequired'), min: { value: 0.01, message: t('amountMustBeGreaterThanZero') } })} />
              {errors.amount && <span className="form-error">{errors.amount.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="paymentMethod">{t('common:paymentMethod')}</label>
              <select id="paymentMethod" className="form-control" {...register('paymentMethod')}>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{t(m.key)}</option>)}
              </select>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title={t('deleteTransactionTitle')}
        message={t('common:thisActionCannotBeUndone')}
        confirmLabel={t('common:delete')}
      />
    </div>
  );
}

export default CarWash;
