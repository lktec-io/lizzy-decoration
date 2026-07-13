import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { FiUpload } from 'react-icons/fi';
import PageSkeleton from '../../components/common/PageSkeleton';
import { useToast } from '../../hooks/useToast';
import * as userService from '../../services/userService';
import * as roleService from '../../services/roleService';
import * as branchService from '../../services/branchService';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a symbol.';

function UserForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const avatarInputRef = useRef(null);

  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [avatarPath, setAvatarPath] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [formError, setFormError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordSubmitting, setResetPasswordSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      firstName: '', lastName: '', gender: '', phone: '', email: '', username: '',
      password: '', roleId: '', branchId: '', branchIds: [],
    },
  });

  useEffect(() => {
    Promise.all([roleService.listRoles(), branchService.listActiveBranches()]).then(([roleRows, branchRows]) => {
      setRoles(roleRows);
      setBranches(branchRows);
    });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    userService.getUser(id).then((user) => {
      if (cancelled) return;
      reset({
        firstName: user.first_name,
        lastName: user.last_name,
        gender: user.gender || '',
        phone: user.phone,
        email: user.email,
        username: user.username,
        password: '',
        roleId: String(user.role_id),
        branchId: user.branch_id ? String(user.branch_id) : '',
        branchIds: (user.branchIds || []).map(String),
      });
      setAvatarPath(user.avatar_path || null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit, reset]);

  const onSubmit = async (values) => {
    setFormError('');

    const payload = {
      ...values,
      roleId: Number(values.roleId),
      branchId: values.branchId ? Number(values.branchId) : null,
      branchIds: (values.branchIds || []).map(Number),
    };

    try {
      if (isEdit) {
        delete payload.password;
        await userService.updateUser(id, payload);
        toast.success('User updated successfully.');
      } else {
        const created = await userService.createUser(payload);
        toast.success('User created successfully.');
        navigate(`/settings/users/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save user.');
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const user = await userService.uploadUserAvatar(id, file);
      setAvatarPath(user.avatar_path);
      toast.success('Avatar updated.');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleResetPassword = async () => {
    setResetPasswordError('');
    if (!PASSWORD_REGEX.test(resetPasswordValue)) {
      setResetPasswordError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    setResetPasswordSubmitting(true);
    try {
      await userService.resetUserPassword(id, resetPasswordValue);
      toast.success('Password reset successfully.');
      setResetPasswordValue('');
    } catch (err) {
      setResetPasswordError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setResetPasswordSubmitting(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit User' : 'New User'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update account details, role and branch access' : 'Create a new staff account'}</p>
        </div>
      </div>

      {formError && <div className="alert alert-danger mb-4" role="alert">{formError}</div>}

      {isEdit && (
        <div className="card mb-5">
          <div className="card-body flex items-center gap-4">
            <div className="company-logo-preview" style={{ borderRadius: 'var(--radius-full)' }}>
              {avatarPath ? <img src={avatarPath} alt="User avatar" /> : <span className="company-logo-placeholder">No Photo</span>}
            </div>
            <div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="visually-hidden"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                className={`btn btn-secondary ${uploadingAvatar ? 'btn-loading' : ''}`}
                disabled={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
              >
                <FiUpload aria-hidden="true" /> Upload Photo
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="card mb-5">
          <div className="card-header"><span className="card-title">Personal Information</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="firstName">First Name</label>
                <input id="firstName" className={`form-control ${errors.firstName ? 'form-control-error' : ''}`} {...register('firstName', { required: 'First name is required' })} />
                {errors.firstName && <span className="form-error">{errors.firstName.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="lastName">Last Name</label>
                <input id="lastName" className={`form-control ${errors.lastName ? 'form-control-error' : ''}`} {...register('lastName', { required: 'Last name is required' })} />
                {errors.lastName && <span className="form-error">{errors.lastName.message}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="gender">Gender</label>
                <select id="gender" className="form-control" {...register('gender')}>
                  <option value="">Not specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="phone">Phone Number</label>
                <input id="phone" className={`form-control ${errors.phone ? 'form-control-error' : ''}`} {...register('phone', { required: 'Phone number is required' })} />
                {errors.phone && <span className="form-error">{errors.phone.message}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-header"><span className="card-title">Account</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className={`form-control ${errors.email ? 'form-control-error' : ''}`}
                  {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' } })}
                />
                {errors.email && <span className="form-error">{errors.email.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="username">Username</label>
                <input id="username" className={`form-control ${errors.username ? 'form-control-error' : ''}`} {...register('username', { required: 'Username is required' })} />
                {errors.username && <span className="form-error">{errors.username.message}</span>}
              </div>
            </div>

            {!isEdit && (
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className={`form-control ${errors.password ? 'form-control-error' : ''}`}
                  {...register('password', { required: 'Password is required', pattern: { value: PASSWORD_REGEX, message: PASSWORD_POLICY_MESSAGE } })}
                />
                {errors.password ? <span className="form-error">{errors.password.message}</span> : <span className="form-help">{PASSWORD_POLICY_MESSAGE}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-header"><span className="card-title">Role &amp; Branch Access</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="roleId">Role</label>
                <select id="roleId" className={`form-control ${errors.roleId ? 'form-control-error' : ''}`} {...register('roleId', { required: 'Role is required' })}>
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                {errors.roleId && <span className="form-error">{errors.roleId.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="branchId">Primary Branch</label>
                <select id="branchId" className="form-control" {...register('branchId')}>
                  <option value="">None (Super Admin / unassigned)</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="branchIds">Additional Branches (for Managers overseeing multiple branches)</label>
              <select id="branchIds" multiple className="form-control" style={{ minHeight: 96 }} {...register('branchIds')}>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/settings/users')}>Cancel</button>
          <button type="submit" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </form>

      {isEdit && (
        <div className="card mt-5">
          <div className="card-header"><span className="card-title">Reset Password</span></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label" htmlFor="resetPassword">New Password</label>
              <input
                id="resetPassword"
                type="password"
                className={`form-control ${resetPasswordError ? 'form-control-error' : ''}`}
                value={resetPasswordValue}
                onChange={(event) => setResetPasswordValue(event.target.value)}
              />
              {resetPasswordError ? <span className="form-error">{resetPasswordError}</span> : <span className="form-help">{PASSWORD_POLICY_MESSAGE}</span>}
            </div>
            <button
              type="button"
              className={`btn btn-secondary ${resetPasswordSubmitting ? 'btn-loading' : ''}`}
              disabled={resetPasswordSubmitting}
              onClick={handleResetPassword}
            >
              Reset Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserForm;
