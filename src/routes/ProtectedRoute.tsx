import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LoadingPage } from '../components/common/Loading';
import { ROUTES } from '../utils/constants';

const isTokenValid = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};


interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

// Global flag to prevent redirect loops and allow normal drawer navigation
let hasRedirectedToAddChild = false;

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { authInitialized, isAuthenticated, user, childrenLoaded, parentChildren } = useAuth() as any;
  const location = useLocation();

  const isParent = user?.role === 'parent';

  if (!authInitialized) {
    return <LoadingPage />;
  }

  const token = localStorage.getItem('token');
  const tokenExpired = token ? !isTokenValid(token) : true;

  if (!isAuthenticated || tokenExpired || !user) {
    if (tokenExpired && token) {
      // Token is present but expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      localStorage.removeItem('isAuthenticated');
      // Dispatch event just in case AuthContext needs it, but we handle navigation here
      window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { url: location.pathname } }));
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const userRole = String(user?.role || '').toLowerCase();
    const roles = (Array.isArray(requiredRole) ? requiredRole : [requiredRole]).map(r => String(r).toLowerCase());
    if (!roles.includes(userRole)) {
      console.warn(`[ProtectedRoute] Access Denied. User role '${userRole}' not in required roles [${roles.join(', ')}]`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  if (
    isParent &&
    authInitialized &&
    childrenLoaded &&
    (!parentChildren || parentChildren.length === 0) &&
    !localStorage.getItem('latestChildId') &&
    location.pathname !== ROUTES.PARENT_ADD_CHILD &&
    !hasRedirectedToAddChild
  ) {
    // eslint-disable-next-line
    hasRedirectedToAddChild = true;
    return <Navigate to={ROUTES.PARENT_ADD_CHILD} replace />;
  }

  return <>{children}</>;
};
