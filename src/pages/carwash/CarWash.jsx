import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiDroplet } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import Modal from '../../components/common/Modal';
import KPICard from '../../components/dashboard/KPICard';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import * as carwashService from '../../services/carwashService';
import * as branchService from '../../services/branchService';
import { formatCurrency } from '../../utils/formatCurrency';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'airtel_money', label: 'Airtel Money' },
];

const DEFAULT_VALUES = {
  plateNumber: '', customerName: '', phone: '', serviceId: '', branchId: '', amount: '', paymentMethod: 'cash',
};

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function CarWash() {
  const canCreate = usePermission('carwash.create');
  const toast = useToast();

  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);

  const fetchTransactions = useCallback((params) => carwashService.listCarwashTransactions(params), []);
  const { items, meta, loading, page, setPage, search, setSearch, filters, setFilters, refetch } = useTable(fetchTransactions);

  const [modalOpen, setModalOpen] = useState(false);
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
    reset(DEFAULT_VALUES);
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
      await carwashService.recordCarwashTransaction(payload);
      toast.success('Car wash transaction recorded.');
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record car wash.');
    }
  };

  const columns = [
    { key: 'created_at', label: 'Date', render: (row) => formatDateTime(row.created_at) },
    { key: 'plate_number', label: 'Plate Number' },
    { key: 'customer_name', label: 'Customer', render: (row) => `${row.customer_name} · ${row.phone}` },
    { key: 'service_name', label: 'Service' },
    { key: 'branch_name', label: 'Branch' },
    { key: 'payment_method', label: 'Payment', render: (row) => PAYMENT_METHODS.find((m) => m.value === row.payment_method)?.label || row.payment_method },
    { key: 'served_by', label: 'Served By', render: (row) => `${row.served_by_first_name} ${row.served_by_last_name}` },
    { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Car Wash</h1>
          <p className="page-subtitle">Register vehicles, record services, and receive payment</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <FiPlus aria-hidden="true" /> New Service
            </button>
          </div>
        )}
      </div>

      <div className="mb-5">
        <KPICard icon={FiDroplet} label="Revenue (filtered results)" value={meta.totalAmount || 0} formatter={(v) => formatCurrency(v)} />
      </div>

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by plate number, customer, phone..." />
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="form-control"
              value={filters.serviceId || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, serviceId: e.target.value || undefined }))}
            >
              <option value="">All Services</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select
              className="form-control"
              value={filters.branchId || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, branchId: e.target.value || undefined }))}
            >
              <option value="">All Branches</option>
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
        <Table columns={columns} rows={items} loading={loading} emptyMessage="No car wash transactions recorded yet" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Car Wash Service"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="carwash-form" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
              Record & Receive Payment
            </button>
          </>
        }
      >
        {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}
        <form id="carwash-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="plateNumber">Vehicle Plate Number</label>
            <input id="plateNumber" className={`form-control ${errors.plateNumber ? 'form-control-error' : ''}`} {...register('plateNumber', { required: 'Plate number is required' })} />
            {errors.plateNumber && <span className="form-error">{errors.plateNumber.message}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="customerName">Customer Name</label>
              <input id="customerName" className={`form-control ${errors.customerName ? 'form-control-error' : ''}`} {...register('customerName', { required: 'Customer name is required' })} />
              {errors.customerName && <span className="form-error">{errors.customerName.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="phone">Phone Number</label>
              <input id="phone" className={`form-control ${errors.phone ? 'form-control-error' : ''}`} {...register('phone', { required: 'Phone number is required' })} />
              {errors.phone && <span className="form-error">{errors.phone.message}</span>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="serviceId">Service</label>
            <select
              id="serviceId"
              className={`form-control ${errors.serviceId ? 'form-control-error' : ''}`}
              {...register('serviceId', { required: 'Service is required' })}
              onChange={handleServiceChange}
              value={selectedServiceId}
            >
              <option value="">Select a service</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.price)})</option>)}
            </select>
            {errors.serviceId && <span className="form-error">{errors.serviceId.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="branchId">Branch</label>
            <select id="branchId" className={`form-control ${errors.branchId ? 'form-control-error' : ''}`} {...register('branchId', { required: 'Branch is required' })}>
              <option value="">Select a branch</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {errors.branchId && <span className="form-error">{errors.branchId.message}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="amount">Amount</label>
              <input id="amount" type="number" min="0" step="0.01" className={`form-control ${errors.amount ? 'form-control-error' : ''}`} {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Amount must be greater than zero' } })} />
              {errors.amount && <span className="form-error">{errors.amount.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="paymentMethod">Payment Method</label>
              <select id="paymentMethod" className="form-control" {...register('paymentMethod')}>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CarWash;
