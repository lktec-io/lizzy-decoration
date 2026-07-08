import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiEye, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import Modal from '../../components/common/Modal';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import * as customerService from '../../services/customerService';

const CUSTOMER_TYPE_LABELS = {
  walk_in: 'Walk In',
  retail: 'Retail',
  wholesale: 'Wholesale',
  vip: 'VIP',
  business: 'Business',
};

const DEFAULT_VALUES = {
  firstName: '', lastName: '', businessName: '', phone: '', altPhone: '', email: '',
  address: '', region: '', district: '', tinNumber: '', customerType: 'walk_in', status: 'active',
};

function CustomerList() {
  const navigate = useNavigate();
  const canCreate = usePermission('customers.create');
  const canEdit = usePermission('customers.edit');

  const fetchCustomers = useCallback((params) => customerService.listCustomers(params), []);
  const { items, meta, loading, page, setPage, search, setSearch, refetch } = useTable(fetchCustomers);

  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: DEFAULT_VALUES });

  const openCreate = () => {
    setEditing(null);
    reset(DEFAULT_VALUES);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (customer) => {
    setEditing(customer);
    reset({
      firstName: customer.first_name,
      lastName: customer.last_name,
      businessName: customer.business_name || '',
      phone: customer.phone,
      altPhone: customer.alt_phone || '',
      email: customer.email || '',
      address: customer.address || '',
      region: customer.region || '',
      district: customer.district || '',
      tinNumber: customer.tin_number || '',
      customerType: customer.customer_type,
      status: customer.status,
    });
    setError('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setError('');
    try {
      if (editing) {
        await customerService.updateCustomer(editing.id, values);
      } else {
        await customerService.createCustomer(values);
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer.');
    }
  };

  const handleToggleStatus = async (customer) => {
    setActionError('');
    const nextStatus = customer.status === 'active' ? 'inactive' : 'active';
    try {
      await customerService.changeCustomerStatus(customer.id, nextStatus);
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update customer status.');
    }
  };

  const columns = [
    { key: 'customer_code', label: 'Code' },
    {
      key: 'name',
      label: 'Customer',
      render: (row) => (
        <div>
          {row.first_name} {row.last_name}
          {row.business_name && <div className="text-xs text-secondary">{row.business_name}</div>}
        </div>
      ),
    },
    { key: 'phone', label: 'Phone' },
    { key: 'customer_type', label: 'Type', render: (row) => CUSTOMER_TYPE_LABELS[row.customer_type] || row.customer_type },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <span className={`badge ${row.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{row.status}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/customers/${row.id}`)} aria-label="View customer">
            <FiEye />
          </button>
          {canEdit && (
            <>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => openEdit(row)} aria-label="Edit customer">
                <FiEdit2 />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => handleToggleStatus(row)}
                aria-label={row.status === 'active' ? 'Deactivate customer' : 'Activate customer'}
              >
                {row.status === 'active' ? <FiToggleRight /> : <FiToggleLeft />}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage customers and their purchase/return history</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <FiPlus aria-hidden="true" /> New Customer
            </button>
          </div>
        )}
      </div>

      {actionError && <div className="alert alert-danger mb-4" role="alert">{actionError}</div>}

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, phone, code..." />
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage="No customers found" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Customer' : 'New Customer'}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="customer-form" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
              {editing ? 'Save Changes' : 'Create Customer'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}
        <form id="customer-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="firstName">First Name</label>
              <input id="firstName" className={`form-control ${errors.firstName ? 'form-control-error' : ''}`} {...register('firstName', { required: 'First name is required' })} />
              {errors.firstName && <span className="form-error">{errors.firstName.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="lastName">Last Name</label>
              <input id="lastName" className={`form-control ${errors.lastName ? 'form-control-error' : ''}`} {...register('lastName', { required: 'Last name is required' })} />
              {errors.lastName && <span className="form-error">{errors.lastName.message}</span>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="businessName">Business Name (Optional)</label>
            <input id="businessName" className="form-control" {...register('businessName')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="phone">Phone Number</label>
              <input id="phone" className={`form-control ${errors.phone ? 'form-control-error' : ''}`} {...register('phone', { required: 'Phone number is required' })} />
              {errors.phone && <span className="form-error">{errors.phone.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="altPhone">Alternative Phone</label>
              <input id="altPhone" className="form-control" {...register('altPhone')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={`form-control ${errors.email ? 'form-control-error' : ''}`}
                {...register('email', { pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' } })}
              />
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="customerType">Customer Type</label>
              <select id="customerType" className="form-control" {...register('customerType')}>
                <option value="walk_in">Walk In</option>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="vip">VIP</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="address">Address</label>
            <input id="address" className="form-control" {...register('address')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="region">Region</label>
              <input id="region" className="form-control" {...register('region')} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="district">District</label>
              <input id="district" className="form-control" {...register('district')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="tinNumber">TIN Number (Optional)</label>
              <input id="tinNumber" className="form-control" {...register('tinNumber')} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="status">Status</label>
              <select id="status" className="form-control" {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CustomerList;
