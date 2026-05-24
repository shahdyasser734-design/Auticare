import { useAuth } from '../context/useAuth';

export const useRole = () => {
  const { user } = useAuth();
  return user?.role || null;
};

export const useHasRole = (role: string | string[]) => {
  const userRole = useRole();
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(userRole || '');
};
