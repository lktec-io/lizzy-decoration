import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import * as authService from '../../services/authService';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a symbol.';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { newPassword: '', confirmPassword: '' } });

  const newPassword = watch('newPassword');

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await authService.resetPassword({ token, newPassword: values.newPassword });
      navigate(ROUTES.LOGIN, { replace: true, state: { resetSuccess: true } });
    } catch (err) {
      setFormError(err.response?.data?.message || 'This reset link is invalid or has expired.');
    }
  };

  if (!token) {
    return (
      <div>
        <h1 className="text-lg font-semibold">Invalid link</h1>
        <p className="text-secondary text-sm mt-1">
          This password reset link is missing its token. Request a new one below.
        </p>
        <Link to={ROUTES.FORGOT_PASSWORD} className="btn btn-primary btn-block mt-4">
          Request New Link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Reset password</h1>
      <p className="text-secondary text-sm mt-1 mb-4">Choose a new password for your account.</p>

      {formError && (
        <div className="alert alert-danger mb-4" role="alert">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-group">
          <label className="form-label form-label-required" htmlFor="newPassword">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            className={`form-control ${errors.newPassword ? 'form-control-error' : ''}`}
            {...register('newPassword', {
              required: 'New password is required',
              pattern: { value: PASSWORD_REGEX, message: PASSWORD_POLICY_MESSAGE },
            })}
          />
          {errors.newPassword ? (
            <span className="form-error">{errors.newPassword.message}</span>
          ) : (
            <span className="form-help">{PASSWORD_POLICY_MESSAGE}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label form-label-required" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={`form-control ${errors.confirmPassword ? 'form-control-error' : ''}`}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === newPassword || 'Passwords do not match',
            })}
          />
          {errors.confirmPassword && <span className="form-error">{errors.confirmPassword.message}</span>}
        </div>

        <button type="submit" className={`btn btn-primary btn-block ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
          Reset Password
        </button>
      </form>
    </div>
  );
}

export default ResetPassword;
