import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import SettingsTabs from '../../components/common/SettingsTabs';
import Skeleton from '../../components/common/Skeleton';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import * as settingsService from '../../services/settingsService';
import '../../styles/pages/Notifications.css';

function SystemSettings() {
  const { t } = useTranslation('settings');
  const canManage = usePermission('settings.manage');
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({ defaultValues: { taxEnabled: false, taxRate: 0, notificationEmailEnabled: true, receiptQrVerificationEnabled: false } });

  useEffect(() => {
    settingsService
      .getSystemSettings()
      .then(reset)
      .catch(() => setFormError(t('failedToLoadSystemSettings')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]);

  const onSubmit = async (values) => {
    setFormError('');
    try {
      const updated = await settingsService.updateSystemSettings({
        taxEnabled: values.taxEnabled,
        taxRate: Number(values.taxRate) || 0,
        notificationEmailEnabled: values.notificationEmailEnabled,
        receiptQrVerificationEnabled: values.receiptQrVerificationEnabled,
      });
      reset(updated);
      toast.success(t('settingsSaved'));
    } catch (err) {
      setFormError(err.response?.data?.message || t('failedToSaveSettings'));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('systemTitle')}</h1>
          <p className="page-subtitle">{t('systemSubtitle')}</p>
        </div>
      </div>

      <SettingsTabs />

      {!canManage && (
        <div className="alert alert-info mb-4" role="status">
          {t('systemReadOnlyNotice')}
        </div>
      )}
      {formError && <div className="alert alert-danger mb-4" role="alert">{formError}</div>}

      {loading ? (
        <div className="card">
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Skeleton height="1rem" width="40%" />
            <Skeleton height="1rem" width="60%" />
            <Skeleton height="1rem" width="35%" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="card mb-5">
            <div className="card-header"><span className="card-title">{t('taxSectionTitle')}</span></div>
            <div className="card-body">
              <label className="form-switch mb-3">
                <input type="checkbox" disabled={!canManage} {...register('taxEnabled')} />
                {t('enableTaxOnSales')}
              </label>
              <div className="form-group" style={{ maxWidth: 200 }}>
                <label className="form-label" htmlFor="taxRate">{t('taxRatePercent')}</label>
                <input id="taxRate" type="number" min="0" max="100" step="0.01" className="form-control" disabled={!canManage} {...register('taxRate')} />
              </div>
            </div>
          </div>

          <div className="card mb-5">
            <div className="card-header"><span className="card-title">{t('emailSectionTitle')}</span></div>
            <div className="card-body">
              <label className="form-switch">
                <input type="checkbox" disabled={!canManage} {...register('notificationEmailEnabled')} />
                {t('sendEmailNotifications')}
              </label>
            </div>
          </div>

          <div className="card mb-5">
            <div className="card-header"><span className="card-title">{t('receiptSectionTitle')}</span></div>
            <div className="card-body">
              <label className="form-switch">
                <input type="checkbox" disabled={!canManage} {...register('receiptQrVerificationEnabled')} />
                {t('printVerificationQrCode')}
              </label>
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
      )}
    </div>
  );
}

export default SystemSettings;
