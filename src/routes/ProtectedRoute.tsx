import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LoadingPage } from '../components/common/Loading';
import { ROUTES } from '../utils/constants';


interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

const SCREENING_EXEMPT_PATHS = [
  ROUTES.PARENT_SCREENING,
  ROUTES.PARENT_ADD_CHILD,
  ROUTES.PARENT_SCREENING_RESULTS,
  ROUTES.PARENT_RE_SCREENING,
];

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { authInitialized, isAuthenticated, user, childrenLoaded, parentChildren } = useAuth() as any;
  const location = useLocation();

  const isParent = user?.role === 'parent';
  const isExemptPath =
    location.pathname === ROUTES.PARENT_HOME ||
    location.pathname.startsWith(ROUTES.PARENT_HOME + '/') ||
    SCREENING_EXEMPT_PATHS.some(
      (path) => location.pathname === path || location.pathname.startsWith(path + '?')
    );

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

  if (isParent && !isExemptPath && childrenLoaded && (!parentChildren || parentChildren.length === 0)) {
    return <Navigate to={ROUTES.PARENT_ADD_CHILD} replace />;
  }

  return <>{children}</>;
};
