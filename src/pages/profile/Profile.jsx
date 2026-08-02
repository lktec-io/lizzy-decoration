import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiUpload } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useLanguage } from '../../hooks/useLanguage';
import * as authService from '../../services/authService';
import '../../styles/pages/CompanySettings.css';

function Profile() {
  const { t } = useTranslation('profile');
  const { user, updateUser, logout } = useAuth();
  const { language, setLanguage, languages } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [avatarPath, setAvatarPath] = useState(user?.avatar_path || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const profileForm = useForm({
    defaultValues: {
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      gender: user?.gender || '',
      phone: user?.phone || '',
    },
  });

  const passwordForm = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });
  const newPassword = passwordForm.watch('newPassword');

  const onSubmitProfile = async (values) => {
    setProfileError('');
    try {
      const updated = await authService.updateProfile(values);
      updateUser(updated);
      toast.success(t('profileUpdated'));
    } catch (err) {
      setProfileError(err.response?.data?.message || t('failedToUpdateProfile'));
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setProfileError('');
    try {
      const updated = await authService.uploadProfileAvatar(file);
      setAvatarPath(updated.avatar_path);
      updateUser(updated);
      toast.success(t('avatarUpdated'));
    } catch (err) {
      setProfileError(err.response?.data?.message || t('failedToUploadAvatar'));
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const onSubmitPassword = async (values) => {
    setPasswordError('');
    try {
      await authService.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success(t('passwordChanged'));
      passwordForm.reset();
      setTimeout(async () => {
        await logout();
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || t('failedToChangePassword'));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle">{t('subtitle')}</p>
        </div>
      </div>

      {profileError && <div className="alert alert-danger mb-4" role="alert">{profileError}</div>}

      <div className="card mb-5">
        <div className="card-body flex items-center gap-4">
          <div className="avatar-preview">
            {avatarPath ? <img src={avatarPath} alt="Avatar" loading="lazy" /> : <span className="company-logo-placeholder">{user?.first_name?.charAt(0).toUpperCase()}</span>}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="visually-hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              className={`btn btn-secondary ${uploadingAvatar ? 'btn-loading' : ''}`}
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUpload aria-hidden="true" /> {t('uploadAvatar')}
            </button>
            <p className="form-help mt-2">{t('avatarHelp')}</p>
          </div>
        </div>
      </div>

      <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} noValidate>
        <div className="card mb-5">
          <div className="card-header"><span className="card-title">{t('personalInformation')}</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="firstName">{t('firstName')}</label>
                <input
                  id="firstName"
                  className={`form-control ${profileForm.formState.errors.firstName ? 'form-control-error' : ''}`}
                  {...profileForm.register('firstName', { required: t('firstNameRequired') })}
                />
                {profileForm.formState.errors.firstName && <span className="form-error">{profileForm.formState.errors.firstName.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="lastName">{t('lastName')}</label>
                <input
                  id="lastName"
                  className={`form-control ${profileForm.formState.errors.lastName ? 'form-control-error' : ''}`}
                  {...profileForm.register('lastName', { required: t('lastNameRequired') })}
                />
                {profileForm.formState.errors.lastName && <span className="form-error">{profileForm.formState.errors.lastName.message}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="phone">{t('phoneNumber')}</label>
                <input
                  id="phone"
                  className={`form-control ${profileForm.formState.errors.phone ? 'form-control-error' : ''}`}
                  {...profileForm.register('phone', { required: t('phoneRequired') })}
                />
                {profileForm.formState.errors.phone && <span className="form-error">{profileForm.formState.errors.phone.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="gender">{t('gender')}</label>
                <select id="gender" className="form-control" {...profileForm.register('gender')}>
                  <option value="">{t('preferNotToSay')}</option>
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                  <option value="other">{t('other')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className={`btn btn-primary ${profileForm.formState.isSubmitting ? 'btn-loading' : ''}`} disabled={profileForm.formState.isSubmitting}>
            {t('saveProfile')}
          </button>
        </div>
      </form>

      {passwordError && <div className="alert alert-danger mb-4 mt-5" role="alert">{passwordError}</div>}

      <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} noValidate className="mt-5">
        <div className="card mb-5">
          <div className="card-header"><span className="card-title">{t('changePassword')}</span></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="currentPassword">{t('currentPassword')}</label>
              <input
                id="currentPassword"
                type="password"
                className={`form-control ${passwordForm.formState.errors.currentPassword ? 'form-control-error' : ''}`}
                {...passwordForm.register('currentPassword', { required: t('currentPasswordRequired') })}
              />
              {passwordForm.formState.errors.currentPassword && <span className="form-error">{passwordForm.formState.errors.currentPassword.message}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="newPassword">{t('newPassword')}</label>
                <input
                  id="newPassword"
                  type="password"
                  className={`form-control ${passwordForm.formState.errors.newPassword ? 'form-control-error' : ''}`}
                  {...passwordForm.register('newPassword', {
                    required: t('newPasswordRequired'),
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                      message: t('passwordPolicy'),
                    },
                  })}
                />
                {passwordForm.formState.errors.newPassword && <span className="form-error">{passwordForm.formState.errors.newPassword.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="confirmPassword">{t('confirmNewPassword')}</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className={`form-control ${passwordForm.formState.errors.confirmPassword ? 'form-control-error' : ''}`}
                  {...passwordForm.register('confirmPassword', {
                    required: t('confirmPasswordRequired'),
                    validate: (value) => value === newPassword || t('passwordsDoNotMatch'),
                  })}
                />
                {passwordForm.formState.errors.confirmPassword && <span className="form-error">{passwordForm.formState.errors.confirmPassword.message}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className={`btn btn-primary ${passwordForm.formState.isSubmitting ? 'btn-loading' : ''}`} disabled={passwordForm.formState.isSubmitting}>
            {t('changePassword')}
          </button>
        </div>
      </form>

      <div className="card mb-5 mt-5">
        <div className="card-header"><span className="card-title">{t('preferences')}</span></div>
        <div className="card-body">
          <label className="form-label" htmlFor="languageSelect">{t('language')}</label>
          <p className="form-help mb-3">{t('languageDescription')}</p>
          <div className="flex gap-3" role="radiogroup" aria-label={t('language')}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                className={`btn ${language === lang.code ? 'btn-primary' : 'btn-secondary'}`}
                aria-pressed={language === lang.code}
                onClick={() => setLanguage(lang.code)}
              >
                <span aria-hidden="true">{lang.flag}</span> {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
