import { useAuth } from './useAuth';

export function usePermission(code) {
  const { hasPermission } = useAuth();
  return hasPermission(code);
}
