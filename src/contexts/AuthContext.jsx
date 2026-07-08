import { useCallback, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import { setAccessToken, clearAccessToken } from '../utils/tokenStorage';
import { setOnSessionExpired } from '../services/apiClient';
import { AuthContext } from './authContextInstance';

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null);
      setSessionExpired(true);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const { accessToken, user: restoredUser } = await authService.refresh();
        if (cancelled) return;
        setAccessToken(accessToken);
        setUser(restoredUser);
      } catch {
        if (!cancelled) clearAccessToken();
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async ({ identifier, password, rememberMe }) => {
    const result = await authService.login({ identifier, password, rememberMe });
    setAccessToken(result.accessToken);
    setUser(result.user);
    setSessionExpired(false);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const acknowledgeSessionExpired = useCallback(() => setSessionExpired(false), []);

  // Lets Profile updates (name, avatar) reflect immediately in the Navbar
  // and anywhere else `user` is read, without a full session refresh.
  const updateUser = useCallback((updatedUser) => setUser(updatedUser), []);

  const hasPermission = useCallback(
    (code) => Boolean(user?.permissions?.includes(code)),
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      initializing,
      sessionExpired,
      login,
      logout,
      acknowledgeSessionExpired,
      hasPermission,
      updateUser,
    }),
    [user, initializing, sessionExpired, login, logout, acknowledgeSessionExpired, hasPermission, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
