import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
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
  businessType: '',
  tinNumber: '',
  vrn: '',
  registrationNumber: '',
  address: '',
  region: '',
  district: '',
  street: '',
  phone: '',
  altPhone: '',
  email: '',
  website: '',
  currency: 'TZS',
  timezone: 'Africa/Dar_es_Salaam',
  receiptFooter: '',
  description: '',
  status: 'active',
};

function CompanySettings() {
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
            businessType: profile.business_type || '',
            tinNumber: profile.tin_number || '',
            vrn: profile.vrn || '',
            registrationNumber: profile.registration_number || '',
            address: profile.address || '',
            region: profile.region || '',
            district: profile.district || '',
            street: profile.street || '',
            phone: profile.phone || '',
            altPhone: profile.alt_phone || '',
            email: profile.email || '',
            website: profile.website || '',
            currency: profile.currency || 'TZS',
            timezone: profile.timezone || 'Africa/Dar_es_Salaam',
            receiptFooter: profile.receipt_footer || '',
            description: profile.description || '',
            status: profile.status || 'active',
          });
          setLogoPath(profile.logo_path || null);
        }
      } catch {
        if (!cancelled) setFormError('Failed to load company profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const onSubmit = async (values) => {
    setFormError('');
    try {
      const profile = await companyService.updateCompany(values);
      updateCompanyBrand(profile);
      toast.success('Company profile saved successfully.');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save company profile.');
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
      toast.success('Logo updated successfully.');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to upload logo.');
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
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Business profile used across receipts, reports and the login page</p>
        </div>
      </div>

      <SettingsTabs />

      {!canManage && (
        <div className="alert alert-info mb-4" role="status">
          Only Super Administrators can edit company settings. You are viewing this in read-only mode.
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
            {logoPath ? <img src={logoPath} alt="Company logo" /> : <span className="company-logo-placeholder">No Logo</span>}
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
                <FiUpload aria-hidden="true" /> Upload Logo
              </button>
              <p className="form-help mt-2">JPG, PNG or WEBP, up to 2MB.</p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="card mb-5">
          <div className="card-header">
            <span className="card-title">Business Identity</span>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="companyName">Company Name</label>
                <input
                  id="companyName"
                  className={`form-control ${errors.companyName ? 'form-control-error' : ''}`}
                  disabled={!canManage}
                  {...register('companyName', { required: 'Company name is required' })}
                />
                {errors.companyName && <span className="form-error">{errors.companyName.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="businessType">Business Type</label>
                <input id="businessType" className="form-control" disabled={!canManage} {...register('businessType')} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="tinNumber">TIN Number</label>
                <input id="tinNumber" className="form-control" disabled={!canManage} {...register('tinNumber')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="vrn">VRN</label>
                <input id="vrn" className="form-control" disabled={!canManage} {...register('vrn')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="registrationNumber">Business Registration Number</label>
              <input id="registrationNumber" className="form-control" disabled={!canManage} {...register('registrationNumber')} />
            </div>
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-header">
            <span className="card-title">Address</span>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label" htmlFor="address">Physical Address</label>
              <input id="address" className="form-control" disabled={!canManage} {...register('address')} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="region">Region</label>
                <input id="region" className="form-control" disabled={!canManage} {...register('region')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="district">District</label>
                <input id="district" className="form-control" disabled={!canManage} {...register('district')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="street">Street</label>
              <input id="street" className="form-control" disabled={!canManage} {...register('street')} />
            </div>
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-header">
            <span className="card-title">Contact</span>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <input id="phone" className="form-control" disabled={!canManage} {...register('phone')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="altPhone">Alternative Phone</label>
                <input id="altPhone" className="form-control" disabled={!canManage} {...register('altPhone')} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className={`form-control ${errors.email ? 'form-control-error' : ''}`}
                  disabled={!canManage}
                  {...register('email', { pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' } })}
                />
                {errors.email && <span className="form-error">{errors.email.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="website">Website</label>
                <input id="website" className="form-control" disabled={!canManage} {...register('website')} />
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-header">
            <span className="card-title">Regional &amp; Receipt Settings</span>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="currency">Currency</label>
                <input id="currency" className="form-control" disabled={!canManage} {...register('currency')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="timezone">Timezone</label>
                <input id="timezone" className="form-control" disabled={!canManage} {...register('timezone')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="receiptFooter">Receipt Footer</label>
              <textarea id="receiptFooter" className="form-control" disabled={!canManage} {...register('receiptFooter')} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="description">Business Description</label>
              <textarea id="description" className="form-control" disabled={!canManage} {...register('description')} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="status">Status</label>
              <select id="status" className="form-control" disabled={!canManage} {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="form-actions">
            <button type="submit" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default CompanySettings;
