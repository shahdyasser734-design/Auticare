import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LoadingPage } from '../components/common/Loading';
import { ROUTES } from '../utils/constants';


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

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user?.role || '')) {
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
