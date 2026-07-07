import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import * as brandService from '../../services/brandService';

function BrandList() {
  const canCreate = usePermission('brands.create');
  const canEdit = usePermission('brands.edit');
  const canDelete = usePermission('brands.delete');

  const fetchBrands = useCallback((params) => brandService.listBrands(params), []);
  const { items, meta, loading, page, setPage, search, setSearch, refetch } = useTable(fetchBrands);

  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: '', code: '', description: '', country: '', status: 'active' } });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', code: '', description: '', country: '', status: 'active' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (brand) => {
    setEditing(brand);
    reset({
      name: brand.name,
      code: brand.code,
      description: brand.description || '',
      country: brand.country || '',
      status: brand.status,
    });
    setError('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setError('');
    try {
      if (editing) {
        await brandService.updateBrand(editing.id, values);
      } else {
        await brandService.createBrand(values);
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save brand.');
    }
  };

  const handleDelete = async () => {
    await brandService.deleteBrand(pendingDelete.id);
    refetch();
  };

  const columns = [
    { key: 'name', label: 'Brand Name' },
    { key: 'code', label: 'Code' },
    { key: 'country', label: 'Country', render: (row) => row.country || '—' },
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
          {canEdit && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => openEdit(row)} aria-label="Edit brand">
              <FiEdit2 />
            </button>
          )}
          {canDelete && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPendingDelete(row)} aria-label="Delete brand">
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
          <h1 className="page-title">Brands</h1>
          <p className="page-subtitle">Manage product brands</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <FiPlus aria-hidden="true" /> New Brand
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, code, country..." />
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage="No brands found" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Brand' : 'New Brand'}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="brand-form" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
              {editing ? 'Save Changes' : 'Create Brand'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}
        <form id="brand-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="name">Brand Name</label>
              <input id="name" className={`form-control ${errors.name ? 'form-control-error' : ''}`} {...register('name', { required: 'Brand name is required' })} />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="code">Code</label>
              <input id="code" className={`form-control ${errors.code ? 'form-control-error' : ''}`} {...register('code', { required: 'Brand code is required' })} />
              {errors.code && <span className="form-error">{errors.code.message}</span>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="country">Country</label>
            <input id="country" className="form-control" {...register('country')} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea id="description" className="form-control" {...register('description')} />
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete brand"
        message={pendingDelete ? `Delete "${pendingDelete.name}"? This is blocked if any products still reference it.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}

export default BrandList;
