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
import * as supplierService from '../../services/supplierService';

function SupplierList() {
  const navigate = useNavigate();
  const canCreate = usePermission('suppliers.create');
  const canEdit = usePermission('suppliers.edit');

  const fetchSuppliers = useCallback((params) => supplierService.listSuppliers(params), []);
  const { items, meta, loading, page, setPage, search, setSearch, refetch } = useTable(fetchSuppliers);

  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: '', phone: '', email: '', address: '', tinNumber: '', status: 'active' } });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', phone: '', email: '', address: '', tinNumber: '', status: 'active' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (supplier) => {
    setEditing(supplier);
    reset({
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      tinNumber: supplier.tin_number || '',
      status: supplier.status,
    });
    setError('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setError('');
    try {
      if (editing) {
        await supplierService.updateSupplier(editing.id, values);
      } else {
        await supplierService.createSupplier(values);
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save supplier.');
    }
  };

  const handleToggleStatus = async (supplier) => {
    setActionError('');
    const nextStatus = supplier.status === 'active' ? 'inactive' : 'active';
    try {
      await supplierService.changeSupplierStatus(supplier.id, nextStatus);
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update supplier status.');
    }
  };

  const columns = [
    { key: 'name', label: 'Supplier Name' },
    { key: 'phone', label: 'Phone', render: (row) => row.phone || '—' },
    { key: 'email', label: 'Email', render: (row) => row.email || '—' },
    { key: 'tin_number', label: 'TIN', render: (row) => row.tin_number || '—' },
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
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/suppliers/${row.id}`)} aria-label="View supplier">
            <FiEye />
          </button>
          {canEdit && (
            <>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => openEdit(row)} aria-label="Edit supplier">
                <FiEdit2 />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => handleToggleStatus(row)}
                aria-label={row.status === 'active' ? 'Deactivate supplier' : 'Activate supplier'}
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
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">Manage suppliers and their purchase history</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <FiPlus aria-hidden="true" /> New Supplier
            </button>
          </div>
        )}
      </div>

      {actionError && <div className="alert alert-danger mb-4" role="alert">{actionError}</div>}

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, phone, email..." />
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage="No suppliers found" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Supplier' : 'New Supplier'}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="supplier-form" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
              {editing ? 'Save Changes' : 'Create Supplier'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}
        <form id="supplier-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="name">Supplier Name</label>
            <input id="name" className={`form-control ${errors.name ? 'form-control-error' : ''}`} {...register('name', { required: 'Supplier name is required' })} />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone</label>
              <input id="phone" className="form-control" {...register('phone')} />
            </div>
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
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="address">Address</label>
            <input id="address" className="form-control" {...register('address')} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="tinNumber">TIN (Optional)</label>
            <input id="tinNumber" className="form-control" {...register('tinNumber')} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="status">Status</label>
            <select id="status" className="form-control" {...register('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SupplierList;
