import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiShield } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SettingsTabs from '../../components/common/SettingsTabs';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import * as roleService from '../../services/roleService';
import '../../styles/pages/Notifications.css';

function RoleList() {
  const navigate = useNavigate();
  const canCreate = usePermission('roles.create');
  const canEdit = usePermission('roles.edit');
  const canDelete = usePermission('roles.delete');
  const canManagePermissions = usePermission('roles.manage');
  const toast = useToast();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: '', description: '' } });

  const loadRoles = async () => {
    setLoading(true);
    try {
      const rows = await roleService.listRoles();
      setRoles(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRoles();
  }, []);

  const openCreate = () => {
    setEditingRole(null);
    reset({ name: '', description: '' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (role) => {
    setEditingRole(role);
    reset({ name: role.name, description: role.description || '' });
    setError('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setError('');
    try {
      if (editingRole) {
        await roleService.updateRole(editingRole.id, values);
        toast.success('Role updated.');
      } else {
        await roleService.createRole(values);
        toast.success('Role created.');
      }
      setModalOpen(false);
      loadRoles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save role.');
    }
  };

  const handleDelete = async () => {
    await roleService.deleteRole(pendingDelete.id);
    toast.success('Role deleted.');
    loadRoles();
  };

  const columns = [
    { key: 'name', label: 'Role Name' },
    { key: 'description', label: 'Description', render: (row) => row.description || '—' },
    {
      key: 'is_system',
      label: 'Type',
      render: (row) => <span className={`badge ${row.is_system ? 'badge-info' : 'badge-neutral'}`}>{row.is_system ? 'System' : 'Custom'}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          {canManagePermissions && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate('/settings/permissions/matrix')} aria-label="Manage permissions">
              <FiShield />
            </button>
          )}
          {canEdit && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => openEdit(row)} aria-label="Edit role">
              <FiEdit2 />
            </button>
          )}
          {canDelete && !row.is_system && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPendingDelete(row)} aria-label="Delete role">
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
          <h1 className="page-title">Roles</h1>
          <p className="page-subtitle">Manage roles and what each one can access</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <FiPlus aria-hidden="true" /> New Role
            </button>
          </div>
        )}
      </div>

      <SettingsTabs />

      <div className="card">
        <Table columns={columns} rows={roles} loading={loading} emptyMessage="No roles found" />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRole ? 'Edit Role' : 'New Role'}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" form="role-form" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
              {editingRole ? 'Save Changes' : 'Create Role'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}
        <form id="role-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="name">Role Name</label>
            <input
              id="name"
              className={`form-control ${errors.name ? 'form-control-error' : ''}`}
              disabled={editingRole?.is_system}
              {...register('name', { required: 'Role name is required' })}
            />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
            {editingRole?.is_system && <span className="form-help">System role names cannot be changed.</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea id="description" className="form-control" {...register('description')} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete role"
        message={pendingDelete ? `Delete the "${pendingDelete.name}" role? This is blocked if any users are still assigned to it.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}

export default RoleList;
