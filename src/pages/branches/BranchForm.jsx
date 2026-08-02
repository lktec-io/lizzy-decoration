import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as branchService from '../../services/branchService';
import * as userService from '../../services/userService';
import PageSkeleton from '../../components/common/PageSkeleton';
import { useToast } from '../../hooks/useToast';

function BranchForm() {
  const { t } = useTranslation('branches');
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
        toast.success(t('toast.branchUpdated'));
      } else {
        await branchService.createBranch(payload);
        toast.success(t('toast.branchCreated'));
      }
      navigate('/settings/branches');
    } catch (err) {
      setFormError(err.response?.data?.message || t('toast.failedToSaveBranch'));
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? t('editBranch') : t('newBranch')}</h1>
          <p className="page-subtitle">{isEdit ? t('editBranchSubtitle') : t('newBranchSubtitle')}</p>
        </div>
      </div>

      {formError && <div className="alert alert-danger mb-4" role="alert">{formError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="card mb-5">
          <div className="card-header"><span className="card-title">{t('branchDetails')}</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="name">{t('branchName')}</label>
                <input id="name" className={`form-control ${errors.name ? 'form-control-error' : ''}`} {...register('name', { required: t('branchNameRequired') })} />
                {errors.name && <span className="form-error">{errors.name.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="code">{t('branchCode')}</label>
                <input id="code" className={`form-control ${errors.code ? 'form-control-error' : ''}`} {...register('code', { required: t('branchCodeRequired') })} />
                {errors.code && <span className="form-error">{errors.code.message}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="managerId">{t('manager')}</label>
                <select id="managerId" className="form-control" {...register('managerId')}>
                  <option value="">{t('unassigned')}</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>{manager.first_name} {manager.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="openingDate">{t('openingDate')}</label>
                <input id="openingDate" type="date" className="form-control" {...register('openingDate')} />
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-header"><span className="card-title">{t('contactAndAddress')}</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="phone">{t('common:phone')}</label>
                <input id="phone" className="form-control" {...register('phone')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">{t('common:email')}</label>
                <input
                  id="email"
                  type="email"
                  className={`form-control ${errors.email ? 'form-control-error' : ''}`}
                  {...register('email', { pattern: { value: /^\S+@\S+\.\S+$/, message: t('invalidEmail') } })}
                />
                {errors.email && <span className="form-error">{errors.email.message}</span>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="address">{t('common:address')}</label>
              <input id="address" className="form-control" {...register('address')} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="region">{t('region')}</label>
                <input id="region" className="form-control" {...register('region')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="district">{t('district')}</label>
                <input id="district" className="form-control" {...register('district')} />
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/settings/branches')}>{t('common:cancel')}</button>
          <button type="submit" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
            {isEdit ? t('saveChanges') : t('createBranch')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BranchForm;
