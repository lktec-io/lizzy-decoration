import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SettingsTabs from '../../components/common/SettingsTabs';
import { usePermission } from '../../hooks/usePermission';
import { useTable } from '../../hooks/useTable';
import * as settingsService from '../../services/settingsService';
import '../../styles/pages/Notifications.css';

function ExpenseCategorySettings() {
  const canManage = usePermission('settings.manage');

  const fetchCategories = useCallback((params) => settingsService.listExpenseCategories(params), []);
  const { items, meta, loading, page, setPage, search, setSearch, refetch } = useTable(fetchCategories);

  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: '' } });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    reset({ name: category.name });
    setError('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setError('');
    try {
      if (editing) {
        await settingsService.updateExpenseCategory(editing.id, values);
      } else {
        await settingsService.createExpenseCategory(values);
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense category.');
    }
  };

  const handleDelete = async () => {
    await settingsService.deleteExpenseCategory(pendingDelete.id);
    refetch();
  };

  const columns = [
    { key: 'name', label: 'Category Name' },
    {
      key: 'actions',
      label: '',
      render: (row) => canManage && (
        <div className="table-actions">
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => openEdit(row)} aria-label="Edit expense category">
            <FiEdit2 />
          </button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPendingDelete(row)} aria-label="Delete expense category">
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Expense Categories</h1>
          <p className="page-subtitle">Manage the categories used when recording expenses</p>
        </div>
        {canManage && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <FiPlus aria-hidden="true" /> New Category
            </button>
          </div>
        )}
      </div>

      <SettingsTabs />

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name..." />
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage="No expense categories found" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Expense Category' : 'New Expense Category'}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="expense-category-form" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
              {editing ? 'Save Changes' : 'Create Category'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}
        <form id="expense-category-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="name">Category Name</label>
            <input id="name" className={`form-control ${errors.name ? 'form-control-error' : ''}`} {...register('name', { required: 'Category name is required' })} />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete expense category"
        message={pendingDelete ? `Delete "${pendingDelete.name}"? This is blocked if any expenses still reference it.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}

export default ExpenseCategorySettings;
