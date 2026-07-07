import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import * as authService from '../../services/authService';

function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '' } });

  const onSubmit = async ({ email }) => {
    setFormError('');
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  if (sent) {
    return (
      <div>
        <h1 className="text-lg font-semibold">Check your email</h1>
        <p className="text-secondary text-sm mt-1">
          If an account exists for that address, we&apos;ve sent a link to reset your password.
        </p>
        <Link to={ROUTES.LOGIN} className="btn btn-secondary btn-block mt-4">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Forgot password</h1>
      <p className="text-secondary text-sm mt-1 mb-4">
        Enter your account email and we&apos;ll send you a reset link.
      </p>

      {formError && (
        <div className="alert alert-danger mb-4" role="alert">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-group">
          <label className="form-label form-label-required" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`form-control ${errors.email ? 'form-control-error' : ''}`}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
            })}
          />
          {errors.email && <span className="form-error">{errors.email.message}</span>}
        </div>

        <button type="submit" className={`btn btn-primary btn-block ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
          Send Reset Link
        </button>

        <Link to={ROUTES.LOGIN} className="btn btn-ghost btn-block mt-2">
          Back to Sign In
        </Link>
      </form>
    </div>
  );
}

export default ForgotPassword;
