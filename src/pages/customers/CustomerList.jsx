import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiEye, FiToggleLeft, FiToggleRight, FiUser, FiTrash2 } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ViewToggle from '../../components/common/ViewToggle';
import CustomerFormFields from '../../components/forms/CustomerFormFields';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import * as customerService from '../../services/customerService';
import { splitFullName } from '../../utils/splitFullName';
import '../../styles/components/ViewToggle.css';

const CUSTOMER_TYPE_LABELS = {
  walk_in: 'Walk In',
  retail: 'Retail',
  wholesale: 'Wholesale',
  vip: 'VIP',
  business: 'Business',
};

const DEFAULT_VALUES = { fullName: '', phone: '', email: '', address: '', notes: '' };

function CustomerList() {
  const navigate = useNavigate();
  const canCreate = usePermission('customers.create');
  const canEdit = usePermission('customers.edit');
  const canDelete = usePermission('customers.delete');
  const toast = useToast();

  const fetchCustomers = useCallback((params) => customerService.listCustomers(params), []);
  const { items, meta, loading, page, setPage, search, setSearch, refetch } = useTable(fetchCustomers);

  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState('list');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

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
      fullName: `${customer.first_name} ${customer.last_name}`.trim(),
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setError('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setError('');
    const { firstName, lastName } = splitFullName(values.fullName);
    const payload = { firstName, lastName, phone: values.phone, email: values.email, address: values.address, notes: values.notes };
    try {
      if (editing) {
        await customerService.updateCustomer(editing.id, payload);
        toast.success('Customer updated.');
      } else {
        await customerService.createCustomer(payload);
        toast.success('Customer registered.');
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
      toast.success(nextStatus === 'active' ? 'Customer activated.' : 'Customer deactivated.');
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update customer status.');
    }
  };

  const handleDelete = async () => {
    try {
      await customerService.deleteCustomer(pendingDelete.id);
      toast.success('Customer permanently deleted.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer.');
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
          {canDelete && (
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => setPendingDelete(row)}
              aria-label="Delete customer"
            >
              <FiTrash2 />
            </button>
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
          <ViewToggle view={view} onChange={setView} />
        </div>

        {view === 'list' ? (
          <Table columns={columns} rows={items} loading={loading} emptyMessage="No customers found" />
        ) : (
          <div className="management-grid">
            {items.map((row) => (
              <div className="card card-hover management-grid-card" key={row.id}>
                <div className="management-grid-card-header">
                  <div className="management-grid-card-media">
                    <FiUser aria-hidden="true" />
                  </div>
                  <span className={`badge ${row.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{row.status}</span>
                </div>
                <div>
                  <div className="management-grid-card-title">{row.first_name} {row.last_name}</div>
                  <div className="management-grid-card-subtitle">{row.customer_code}</div>
                </div>
                <div className="management-grid-card-body">
                  <span>{row.phone}</span>
                  <span>{CUSTOMER_TYPE_LABELS[row.customer_type] || row.customer_type}</span>
                </div>
                <div className="management-grid-card-footer">
                  <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/customers/${row.id}`)} aria-label="View customer">
                    <FiEye />
                  </button>
                  {canEdit && (
                    <div className="table-actions">
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
                    </div>
                  )}
                  {canDelete && (
                    <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPendingDelete(row)} aria-label="Delete customer">
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!loading && items.length === 0 && (
              <div className="text-sm text-secondary" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-8)' }}>
                No customers found
              </div>
            )}
          </div>
        )}

        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Customer' : 'New Customer'}
        size="md"
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
          <CustomerFormFields register={register} errors={errors} />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete Customer?"
        message="This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}

export default CustomerList;
