import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import { env } from '../config/env.js';
import * as authService from '../services/auth.service.js';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

function setRefreshCookie(res, token, expiresAt) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    expires: expiresAt,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

export const login = asyncHandler(async (req, res) => {
  const { identifier, password, rememberMe } = req.body;

  const result = await authService.login({
    identifier,
    password,
    rememberMe: Boolean(rememberMe),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
  return success(res, { message: 'Login successful', data: { accessToken: result.accessToken, user: result.user } });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  const result = await authService.refresh({ refreshToken });

  setRefreshCookie(res, result.refreshToken, undefined);
  return success(res, { message: 'Token refreshed', data: { accessToken: result.accessToken, user: result.user } });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  await authService.logout({ refreshToken });
  clearRefreshCookie(res);
  return success(res, { message: 'Logged out' });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  clearRefreshCookie(res);
  return success(res, { message: 'Logged out of all devices' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword({ email: req.body.email });
  return success(res, { message: 'If that email exists, a reset link has been sent' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword({ token: req.body.token, newPassword: req.body.newPassword });
  return success(res, { message: 'Password reset successfully. Please log in with your new password.' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return success(res, { data: user });
});

export const sessions = asyncHandler(async (req, res) => {
  const rows = await authService.listSessions(req.user.id);
  return success(res, { data: rows });
});

export const revokeSession = asyncHandler(async (req, res) => {
  await authService.revokeSession(req.user.id, Number(req.params.id));
  return success(res, { message: 'Session revoked' });
});
