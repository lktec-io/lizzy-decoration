import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiEdit2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import Modal from '../../components/common/Modal';
import SettingsTabs from '../../components/common/SettingsTabs';
import { usePermission } from '../../hooks/usePermission';
import { useTable } from '../../hooks/useTable';
import { useToast } from '../../hooks/useToast';
import * as settingsService from '../../services/settingsService';
import { formatCurrency } from '../../utils/formatCurrency';
import '../../styles/pages/Notifications.css';

function CarwashServiceSettings() {
  const { t } = useTranslation('settings');
  const canManage = usePermission('settings.manage');
  const toast = useToast();

  const fetchServices = useCallback((params) => settingsService.listCarwashServices(params), []);
  const { items, meta, loading, page, setPage, search, setSearch, refetch } = useTable(fetchServices);

  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: '', price: '' } });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', price: '' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (service) => {
    setEditing(service);
    reset({ name: service.name, price: service.price });
    setError('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setError('');
    const payload = { name: values.name, price: Number(values.price) };
    try {
      if (editing) {
        await settingsService.updateCarwashService(editing.id, { ...payload, status: editing.status });
        toast.success(t('packageUpdated'));
      } else {
        await settingsService.createCarwashService(payload);
        toast.success(t('packageCreated'));
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || t('failedToSavePackage'));
    }
  };

  const handleToggleStatus = async (service) => {
    setActionError('');
    const nextStatus = service.status === 'active' ? 'inactive' : 'active';
    try {
      await settingsService.setCarwashServiceStatus(service.id, nextStatus);
      toast.success(nextStatus === 'active' ? t('packageActivated') : t('packageDeactivated'));
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || t('failedToUpdatePackageStatus'));
    }
  };

  const columns = [
    { key: 'name', label: t('packageName') },
    { key: 'price', label: t('common:price'), render: (row) => formatCurrency(row.price) },
    {
      key: 'status',
      label: t('common:status'),
      render: (row) => (
        <span className={`badge ${row.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
          {row.status === 'active' ? t('common:active') : t('common:inactive')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => canManage && (
        <div className="table-actions">
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => openEdit(row)} aria-label={t('editPackageAria')}>
            <FiEdit2 />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={() => handleToggleStatus(row)}
            aria-label={row.status === 'active' ? t('deactivatePackage') : t('activatePackage')}
          >
            {row.status === 'active' ? <FiToggleRight /> : <FiToggleLeft />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('carwashTitle')}</h1>
          <p className="page-subtitle">{t('carwashSubtitle')}</p>
        </div>
        {canManage && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <FiPlus aria-hidden="true" /> {t('newPackage')}
            </button>
          </div>
        )}
      </div>

      <SettingsTabs />

      {actionError && <div className="alert alert-danger mb-4" role="alert">{actionError}</div>}

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder={t('searchByName')} />
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage={t('noCarwashPackagesFound')} />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('editPackage') : t('newPackage')}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>{t('common:cancel')}</button>
            <button type="submit" form="carwash-service-form" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
              {editing ? t('saveChanges') : t('createPackage')}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}
        <form id="carwash-service-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="name">{t('packageName')}</label>
            <input id="name" className={`form-control ${errors.name ? 'form-control-error' : ''}`} {...register('name', { required: t('packageNameRequired') })} />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="price">{t('common:price')}</label>
            <input
              id="price"
              type="number"
              step="0.01"
              className={`form-control ${errors.price ? 'form-control-error' : ''}`}
              {...register('price', { required: t('priceRequired'), min: { value: 0.01, message: t('priceMustBePositive') } })}
            />
            {errors.price && <span className="form-error">{errors.price.message}</span>}
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CarwashServiceSettings;
