import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FiUpload } from 'react-icons/fi';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import { useCompany } from '../../hooks/useCompany';
import SettingsTabs from '../../components/common/SettingsTabs';
import PageSkeleton from '../../components/common/PageSkeleton';
import * as companyService from '../../services/companyService';
import '../../styles/pages/CompanySettings.css';
import '../../styles/pages/Notifications.css';

const EMPTY_FORM = {
  companyName: '',
  address: '',
  region: '',
  district: '',
  street: '',
  phone: '',
  email: '',
  receiptFooter: '',
};

function CompanySettings() {
  const { t } = useTranslation('company');
  const canManage = usePermission('company.manage');
  const toast = useToast();
  const { updateCompany: updateCompanyBrand } = useCompany();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [logoPath, setLogoPath] = useState(null);
  const [formError, setFormError] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY_FORM });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const profile = await companyService.getCompany();
        if (cancelled) return;
        if (profile) {
          reset({
            companyName: profile.company_name || '',
            address: profile.address || '',
            region: profile.region || '',
            district: profile.district || '',
            street: profile.street || '',
            phone: profile.phone || '',
            email: profile.email || '',
            receiptFooter: profile.receipt_footer || '',
          });
          setLogoPath(profile.logo_path || null);
        }
      } catch {
        if (!cancelled) setFormError(t('failedToLoadProfile'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]);

  const onSubmit = async (values) => {
    setFormError('');
    try {
      const profile = await companyService.updateCompany(values);
      updateCompanyBrand(profile);
      toast.success(t('profileSaved'));
    } catch (err) {
      setFormError(err.response?.data?.message || t('failedToSaveProfile'));
    }
  };

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setFormError('');
    try {
      const profile = await companyService.uploadLogo(file);
      setLogoPath(profile.logo_path);
      // Pushes the new logo into every branding consumer (Login, Sidebar,
      // Navbar, Reports) immediately — they all read from this same
      // CompanyContext, which otherwise only fetches once at app mount.
      updateCompanyBrand(profile);
      toast.success(t('logoUpdated'));
    } catch (err) {
      setFormError(err.response?.data?.message || t('failedToUploadLogo'));
    } finally {
      setUploadingLogo(false);
      event.target.value = '';
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle">{t('subtitle')}</p>
        </div>
      </div>

      <SettingsTabs />

      {!canManage && (
        <div className="alert alert-info mb-4" role="status">
          {t('readOnlyNotice')}
        </div>
      )}

      {formError && (
        <div className="alert alert-danger mb-4" role="alert">
          {formError}
        </div>
      )}

      <div className="card mb-5">
        <div className="card-body flex items-center gap-4">
          <div className="company-logo-preview">
            {logoPath ? <img src={logoPath} alt={t('companyLogoAlt')} /> : <span className="company-logo-placeholder">{t('noLogo')}</span>}
          </div>
          {canManage && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="visually-hidden"
                onChange={handleLogoChange}
              />
              <button
                type="button"
                className={`btn btn-secondary ${uploadingLogo ? 'btn-loading' : ''}`}
                disabled={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
              >
                <FiUpload aria-hidden="true" /> {t('uploadLogo')}
              </button>
              <p className="form-help mt-2">{t('logoHelp')}</p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="card mb-5">
          <div className="card-header">
            <span className="card-title">{t('businessIdentity')}</span>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="companyName">{t('companyName')}</label>
              <input
                id="companyName"
                className={`form-control ${errors.companyName ? 'form-control-error' : ''}`}
                disabled={!canManage}
                {...register('companyName', { required: t('companyNameRequired') })}
              />
              {errors.companyName && <span className="form-error">{errors.companyName.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="receiptFooter">{t('receiptFooter')}</label>
              <textarea id="receiptFooter" className="form-control" disabled={!canManage} placeholder={t('receiptFooterPlaceholder')} {...register('receiptFooter')} />
              <p className="form-help mt-1">{t('receiptFooterHelp')}</p>
            </div>
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-header">
            <span className="card-title">{t('addressSection')}</span>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label" htmlFor="address">{t('physicalAddress')}</label>
              <input id="address" className="form-control" disabled={!canManage} {...register('address')} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="region">{t('region')}</label>
                <input id="region" className="form-control" disabled={!canManage} {...register('region')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="district">{t('district')}</label>
                <input id="district" className="form-control" disabled={!canManage} {...register('district')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="street">{t('street')}</label>
              <input id="street" className="form-control" disabled={!canManage} {...register('street')} />
            </div>
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-header">
            <span className="card-title">{t('contactSection')}</span>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="phone">{t('phoneNumber')}</label>
                <input id="phone" className="form-control" disabled={!canManage} {...register('phone')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">{t('common:email')}</label>
                <input
                  id="email"
                  type="email"
                  className={`form-control ${errors.email ? 'form-control-error' : ''}`}
                  disabled={!canManage}
                  {...register('email', { pattern: { value: /^\S+@\S+\.\S+$/, message: t('invalidEmail') } })}
                />
                {errors.email && <span className="form-error">{errors.email.message}</span>}
              </div>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="form-actions">
            <button type="submit" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
              {t('saveChanges')}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default CompanySettings;
