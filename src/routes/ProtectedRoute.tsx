import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LoadingPage } from '../components/common/Loading';
import { ROUTES } from '../utils/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

// Routes that are excluded from the screening redirect
// (i.e., parents can visit these before/after completing screening)
const SCREENING_EXEMPT_PATHS = [
  ROUTES.PARENT_SCREENING,
  ROUTES.PARENT_ADD_CHILD,
  ROUTES.PARENT_RE_SCREENING,
];

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Temporary debug logs requested by user
  console.log("TOKEN:", localStorage.getItem('token'));
  console.log("USER:", user);
  console.log("AUTH:", isAuthenticated);
  console.log("REDIRECT:", window.location.pathname);

  if (loading) {
    return <LoadingPage />;
  }

  // Auth state still hydrating: token exists but user object hasn't been set yet
  if (!isAuthenticated && localStorage.getItem('token') && localStorage.getItem('isAuthenticated') === 'true') {
    return <LoadingPage />;
  }

  // Not logged in → redirect to login, preserving intended path
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user?.role || '')) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Screening guard for parents only
  const isParent = user?.role === 'parent';
  const screeningKey = user ? `screeningComplete_${user.id}` : null;
  const screeningCompleted = screeningKey
    ? localStorage.getItem(screeningKey) === 'true'
    : false;

  const isExemptPath = SCREENING_EXEMPT_PATHS.some(
    (path) => location.pathname === path || location.pathname.startsWith(path + '?')
  );

  if (isParent && !screeningCompleted && !isExemptPath) {
    return <Navigate to={ROUTES.PARENT_SCREENING} replace />;
  }

  return <>{children}</>;
};
