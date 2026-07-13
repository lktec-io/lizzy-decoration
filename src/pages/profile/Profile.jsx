import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FiUpload } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import * as authService from '../../services/authService';
import '../../styles/pages/CompanySettings.css';

function Profile() {
  const { user, updateUser, logout } = useAuth();
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
      toast.success('Profile updated successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
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
      toast.success('Avatar updated successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const onSubmitPassword = async (values) => {
    setPasswordError('');
    try {
      await authService.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success('Password changed. You will be signed out shortly.');
      passwordForm.reset();
      setTimeout(async () => {
        await logout();
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Update your personal information and password</p>
        </div>
      </div>

      {profileError && <div className="alert alert-danger mb-4" role="alert">{profileError}</div>}

      <div className="card mb-5">
        <div className="card-body flex items-center gap-4">
          <div className="company-logo-preview">
            {avatarPath ? <img src={avatarPath} alt="Avatar" /> : <span className="company-logo-placeholder">{user?.first_name?.charAt(0).toUpperCase()}</span>}
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
              <FiUpload aria-hidden="true" /> Upload Avatar
            </button>
            <p className="form-help mt-2">JPG, PNG or WEBP, up to 2MB.</p>
          </div>
        </div>
      </div>

      <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} noValidate>
        <div className="card mb-5">
          <div className="card-header"><span className="card-title">Personal Information</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  className={`form-control ${profileForm.formState.errors.firstName ? 'form-control-error' : ''}`}
                  {...profileForm.register('firstName', { required: 'First name is required' })}
                />
                {profileForm.formState.errors.firstName && <span className="form-error">{profileForm.formState.errors.firstName.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  className={`form-control ${profileForm.formState.errors.lastName ? 'form-control-error' : ''}`}
                  {...profileForm.register('lastName', { required: 'Last name is required' })}
                />
                {profileForm.formState.errors.lastName && <span className="form-error">{profileForm.formState.errors.lastName.message}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  className={`form-control ${profileForm.formState.errors.phone ? 'form-control-error' : ''}`}
                  {...profileForm.register('phone', { required: 'Phone number is required' })}
                />
                {profileForm.formState.errors.phone && <span className="form-error">{profileForm.formState.errors.phone.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="gender">Gender</label>
                <select id="gender" className="form-control" {...profileForm.register('gender')}>
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className={`btn btn-primary ${profileForm.formState.isSubmitting ? 'btn-loading' : ''}`} disabled={profileForm.formState.isSubmitting}>
            Save Profile
          </button>
        </div>
      </form>

      {passwordError && <div className="alert alert-danger mb-4 mt-5" role="alert">{passwordError}</div>}

      <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} noValidate className="mt-5">
        <div className="card mb-5">
          <div className="card-header"><span className="card-title">Change Password</span></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                className={`form-control ${passwordForm.formState.errors.currentPassword ? 'form-control-error' : ''}`}
                {...passwordForm.register('currentPassword', { required: 'Current password is required' })}
              />
              {passwordForm.formState.errors.currentPassword && <span className="form-error">{passwordForm.formState.errors.currentPassword.message}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  className={`form-control ${passwordForm.formState.errors.newPassword ? 'form-control-error' : ''}`}
                  {...passwordForm.register('newPassword', {
                    required: 'New password is required',
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                      message: 'Must be at least 8 characters with an uppercase letter, lowercase letter, number and symbol',
                    },
                  })}
                />
                {passwordForm.formState.errors.newPassword && <span className="form-error">{passwordForm.formState.errors.newPassword.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className={`form-control ${passwordForm.formState.errors.confirmPassword ? 'form-control-error' : ''}`}
                  {...passwordForm.register('confirmPassword', {
                    required: 'Please confirm your new password',
                    validate: (value) => value === newPassword || 'Passwords do not match',
                  })}
                />
                {passwordForm.formState.errors.confirmPassword && <span className="form-error">{passwordForm.formState.errors.confirmPassword.message}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className={`btn btn-primary ${passwordForm.formState.isSubmitting ? 'btn-loading' : ''}`} disabled={passwordForm.formState.isSubmitting}>
            Change Password
          </button>
        </div>
      </form>
    </div>
  );
}

export default Profile;
