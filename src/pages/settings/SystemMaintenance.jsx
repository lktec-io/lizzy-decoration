import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import SettingsTabs from '../../components/common/SettingsTabs';
import * as systemMaintenanceService from '../../services/systemMaintenanceService';

const CONFIRMATION_WORD = 'RESET';

function SystemMaintenance() {
  const { t } = useTranslation('settings');
  const [confirmationInput, setConfirmationInput] = useState('');
  const [includeActivityLogs, setIncludeActivityLogs] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const canSubmit = confirmationInput.trim() === CONFIRMATION_WORD && !running;

  const handleReset = async () => {
    if (!canSubmit) return;
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const summary = await systemMaintenanceService.runProductionReset({
        confirmation: confirmationInput.trim(),
        includeActivityLogs,
      });
      setResult(summary);
      setConfirmationInput('');
    } catch (err) {
      setError(err.response?.data?.message || t('systemMaintenance.failed'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('systemMaintenance.title')}</h1>
          <p className="page-subtitle">{t('systemMaintenance.subtitle')}</p>
        </div>
      </div>

      <SettingsTabs />

      {result && (
        <div className="card mb-4" style={{ borderColor: 'var(--color-success)' }}>
          <div className="flex items-start gap-3 p-4">
            <FiCheckCircle className="text-success" size={22} aria-hidden="true" />
            <div>
              <p className="font-semibold text-success mb-1">{t('systemMaintenance.resetComplete')}</p>
              <p className="text-sm text-secondary">
                {t('systemMaintenance.resetSummary', {
                  users: result.usersDeactivated,
                  files: result.filesRemoved,
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="p-4">
          <h2 className="card-title mb-3">{t('systemMaintenance.productionResetTitle')}</h2>

          <div className="alert alert-danger" role="alert">
            <FiAlertTriangle aria-hidden="true" />
            <span>{t('systemMaintenance.warning')}</span>
          </div>

          <div className="flex flex-wrap gap-6 mt-4">
            <div style={{ flex: '1 1 220px' }}>
              <p className="font-semibold text-sm mb-2">{t('systemMaintenance.keptTitle')}</p>
              <ul className="text-sm text-secondary" style={{ paddingLeft: '1.2em' }}>
                <li>{t('systemMaintenance.keptCompany')}</li>
                <li>{t('systemMaintenance.keptBranches')}</li>
                <li>{t('systemMaintenance.keptRolesPermissions')}</li>
                <li>{t('systemMaintenance.keptSuperAdmin')}</li>
                <li>{t('systemMaintenance.keptSettings')}</li>
              </ul>
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <p className="font-semibold text-sm mb-2">{t('systemMaintenance.removedTitle')}</p>
              <ul className="text-sm text-secondary" style={{ paddingLeft: '1.2em' }}>
                <li>{t('systemMaintenance.removedSales')}</li>
                <li>{t('systemMaintenance.removedProducts')}</li>
                <li>{t('systemMaintenance.removedCustomersSuppliers')}</li>
                <li>{t('systemMaintenance.removedUsers')}</li>
                <li>{t('systemMaintenance.removedNotifications')}</li>
              </ul>
            </div>
          </div>

          <div className="form-group mt-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeActivityLogs}
                onChange={(e) => setIncludeActivityLogs(e.target.checked)}
              />
              {t('systemMaintenance.includeActivityLogs')}
            </label>
          </div>

          {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}

          <div className="form-group mt-4">
            <label className="form-label" htmlFor="reset-confirmation">
              {t('systemMaintenance.typeToConfirm', { word: CONFIRMATION_WORD })}
            </label>
            <input
              id="reset-confirmation"
              className="form-control"
              style={{ maxWidth: 260 }}
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={CONFIRMATION_WORD}
              autoComplete="off"
            />
          </div>

          <button
            type="button"
            className={`btn btn-danger ${running ? 'btn-loading' : ''}`}
            disabled={!canSubmit}
            onClick={handleReset}
          >
            {t('systemMaintenance.runReset')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SystemMaintenance;
