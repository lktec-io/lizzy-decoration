import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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

const CUSTOMER_TYPE_KEYS = {
  walk_in: 'walk_in',
  retail: 'retail',
  wholesale: 'wholesale',
  vip: 'vip',
  business: 'business',
};

const DEFAULT_VALUES = { fullName: '', phone: '', email: '', address: '', notes: '' };

function CustomerList() {
  const { t } = useTranslation('customers');
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

  const customerTypeLabel = (type) => t(`customerType.${CUSTOMER_TYPE_KEYS[type] || type}`, { defaultValue: type });

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
        toast.success(t('toast.customerUpdated'));
      } else {
        await customerService.createCustomer(payload);
        toast.success(t('toast.customerRegistered'));
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || t('toast.failedToSaveCustomer'));
    }
  };

  const handleToggleStatus = async (customer) => {
    setActionError('');
    const nextStatus = customer.status === 'active' ? 'inactive' : 'active';
    try {
      await customerService.changeCustomerStatus(customer.id, nextStatus);
      toast.success(nextStatus === 'active' ? t('toast.customerActivated') : t('toast.customerDeactivated'));
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || t('toast.failedToUpdateStatus'));
    }
  };

  const handleDelete = async () => {
    try {
      await customerService.deleteCustomer(pendingDelete.id);
      toast.success(t('toast.customerDeleted'));
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || t('toast.failedToDeleteCustomer'));
    }
  };

  const columns = [
    { key: 'customer_code', label: t('common:code') },
    {
      key: 'name',
      label: t('columns.customer'),
      render: (row) => (
        <div>
          {row.first_name} {row.last_name}
          {row.business_name && <div className="text-xs text-secondary">{row.business_name}</div>}
        </div>
      ),
    },
    { key: 'phone', label: t('common:phone') },
    { key: 'customer_type', label: t('columns.type'), render: (row) => customerTypeLabel(row.customer_type) },
    {
      key: 'status',
      label: t('common:status'),
      render: (row) => <span className={`badge ${row.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{row.status === 'active' ? t('common:active') : t('common:inactive')}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/customers/${row.id}`)} aria-label={t('viewCustomerAria')}>
            <FiEye />
          </button>
          {canEdit && (
            <>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => openEdit(row)} aria-label={t('editCustomerAria')}>
                <FiEdit2 />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => handleToggleStatus(row)}
                aria-label={row.status === 'active' ? t('deactivateCustomerAria') : t('activateCustomerAria')}
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
              aria-label={t('deleteCustomerAria')}
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
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle">{t('subtitle')}</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <FiPlus aria-hidden="true" /> {t('newCustomer')}
            </button>
          </div>
        )}
      </div>

      {actionError && <div className="alert alert-danger mb-4" role="alert">{actionError}</div>}

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder={t('searchPlaceholder')} />
          <ViewToggle view={view} onChange={setView} />
        </div>

        {view === 'list' ? (
          <Table columns={columns} rows={items} loading={loading} emptyMessage={t('emptyList')} />
        ) : (
          <div className="management-grid">
            {items.map((row) => (
              <div className="card card-hover management-grid-card" key={row.id}>
                <div className="management-grid-card-header">
                  <div className="management-grid-card-media">
                    <FiUser aria-hidden="true" />
                  </div>
                  <span className={`badge ${row.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{row.status === 'active' ? t('common:active') : t('common:inactive')}</span>
                </div>
                <div>
                  <div className="management-grid-card-title">{row.first_name} {row.last_name}</div>
                  <div className="management-grid-card-subtitle">{row.customer_code}</div>
                </div>
                <div className="management-grid-card-body">
                  <span>{row.phone}</span>
                  <span>{customerTypeLabel(row.customer_type)}</span>
                </div>
                <div className="management-grid-card-footer">
                  <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/customers/${row.id}`)} aria-label={t('viewCustomerAria')}>
                    <FiEye />
                  </button>
                  {canEdit && (
                    <div className="table-actions">
                      <button type="button" className="btn btn-ghost btn-icon" onClick={() => openEdit(row)} aria-label={t('editCustomerAria')}>
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleToggleStatus(row)}
                        aria-label={row.status === 'active' ? t('deactivateCustomerAria') : t('activateCustomerAria')}
                      >
                        {row.status === 'active' ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                    </div>
                  )}
                  {canDelete && (
                    <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPendingDelete(row)} aria-label={t('deleteCustomerAria')}>
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!loading && items.length === 0 && (
              <div className="text-sm text-secondary" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-8)' }}>
                {t('emptyList')}
              </div>
            )}
          </div>
        )}

        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('editCustomer') : t('newCustomer')}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>{t('common:cancel')}</button>
            <button type="submit" form="customer-form" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
              {editing ? t('saveChanges') : t('createCustomer')}
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
        title={t('deleteCustomerTitle')}
        message={t('common:thisActionCannotBeUndone')}
        confirmLabel={t('common:delete')}
      />
    </div>
  );
}

export default CustomerList;
