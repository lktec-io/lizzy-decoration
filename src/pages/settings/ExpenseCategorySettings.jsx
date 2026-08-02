import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SettingsTabs from '../../components/common/SettingsTabs';
import { usePermission } from '../../hooks/usePermission';
import { useTable } from '../../hooks/useTable';
import { useToast } from '../../hooks/useToast';
import * as settingsService from '../../services/settingsService';
import '../../styles/pages/Notifications.css';

function ExpenseCategorySettings() {
  const { t } = useTranslation('settings');
  const canManage = usePermission('settings.manage');
  const toast = useToast();

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
        toast.success(t('categoryUpdated'));
      } else {
        await settingsService.createExpenseCategory(values);
        toast.success(t('categoryCreated'));
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || t('failedToSaveCategory'));
    }
  };

  const handleDelete = async () => {
    await settingsService.deleteExpenseCategory(pendingDelete.id);
    toast.success(t('categoryDeleted'));
    refetch();
  };

  const columns = [
    { key: 'name', label: t('categoryName') },
    {
      key: 'actions',
      label: '',
      render: (row) => canManage && (
        <div className="table-actions">
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => openEdit(row)} aria-label={t('editCategoryAria')}>
            <FiEdit2 />
          </button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPendingDelete(row)} aria-label={t('deleteCategoryAria')}>
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
          <h1 className="page-title">{t('expenseCategoriesTitle')}</h1>
          <p className="page-subtitle">{t('expenseCategoriesSubtitle')}</p>
        </div>
        {canManage && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <FiPlus aria-hidden="true" /> {t('newCategory')}
            </button>
          </div>
        )}
      </div>

      <SettingsTabs />

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder={t('searchByName')} />
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage={t('noExpenseCategoriesFound')} />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('editExpenseCategory') : t('newExpenseCategory')}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>{t('common:cancel')}</button>
            <button type="submit" form="expense-category-form" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
              {editing ? t('saveChanges') : t('createCategory')}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}
        <form id="expense-category-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="name">{t('categoryName')}</label>
            <input id="name" className={`form-control ${errors.name ? 'form-control-error' : ''}`} {...register('name', { required: t('categoryNameRequired') })} />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title={t('deleteCategoryTitle')}
        message={pendingDelete ? t('deleteCategoryMessage', { name: pendingDelete.name }) : ''}
        confirmLabel={t('common:delete')}
      />
    </div>
  );
}

export default ExpenseCategorySettings;
