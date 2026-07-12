import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import * as branchService from '../../services/branchService';
import * as userService from '../../services/userService';
import { useToast } from '../../hooks/useToast';

function BranchForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '', code: '', managerId: '', phone: '', email: '',
      address: '', region: '', district: '', openingDate: '',
    },
  });

  useEffect(() => {
    userService.listUsers({ limit: 100 }).then((result) => setManagers(result.items));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    branchService.getBranch(id).then((branch) => {
      if (cancelled) return;
      reset({
        name: branch.name,
        code: branch.code,
        managerId: branch.manager_id ? String(branch.manager_id) : '',
        phone: branch.phone || '',
        email: branch.email || '',
        address: branch.address || '',
        region: branch.region || '',
        district: branch.district || '',
        openingDate: branch.opening_date ? branch.opening_date.slice(0, 10) : '',
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit, reset]);

  const onSubmit = async (values) => {
    setFormError('');
    const payload = { ...values, managerId: values.managerId ? Number(values.managerId) : null };

    try {
      if (isEdit) {
        await branchService.updateBranch(id, payload);
        toast.success('Branch updated.');
      } else {
        await branchService.createBranch(payload);
        toast.success('Branch created.');
      }
      navigate('/settings/branches');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save branch.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <span className="spinner" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Branch' : 'New Branch'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update branch details and manager' : 'Register a new store location'}</p>
        </div>
      </div>

      {formError && <div className="alert alert-danger mb-4" role="alert">{formError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="card mb-5">
          <div className="card-header"><span className="card-title">Branch Details</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="name">Branch Name</label>
                <input id="name" className={`form-control ${errors.name ? 'form-control-error' : ''}`} {...register('name', { required: 'Branch name is required' })} />
                {errors.name && <span className="form-error">{errors.name.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="code">Branch Code</label>
                <input id="code" className={`form-control ${errors.code ? 'form-control-error' : ''}`} {...register('code', { required: 'Branch code is required' })} />
                {errors.code && <span className="form-error">{errors.code.message}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="managerId">Manager</label>
                <select id="managerId" className="form-control" {...register('managerId')}>
                  <option value="">Unassigned</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>{manager.first_name} {manager.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="openingDate">Opening Date</label>
                <input id="openingDate" type="date" className="form-control" {...register('openingDate')} />
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-header"><span className="card-title">Contact &amp; Address</span></div>
          <div className="card-body">
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
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/settings/branches')}>Cancel</button>
          <button type="submit" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Branch'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BranchForm;
