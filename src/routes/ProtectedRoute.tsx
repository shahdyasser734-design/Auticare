import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LoadingPage } from '../components/common/Loading';
import { ROUTES } from '../utils/constants';
import { useState, useEffect } from 'react';


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
  const { isAuthenticated, loading, user, childrenLoaded, parentChildren } = useAuth() as any; // Using any for childrenLoaded/parentChildren compatibility
  const location = useLocation();
  const [checkingEvidence, setCheckingEvidence] = useState(true);
  const [hasEvidence, setHasEvidence] = useState(false);

  const isParent = user?.role === 'parent';
  const isExemptPath =
    location.pathname === ROUTES.PARENT_HOME ||
    location.pathname.startsWith(ROUTES.PARENT_HOME + '/') ||
    SCREENING_EXEMPT_PATHS.some(
      (path) => location.pathname === path || location.pathname.startsWith(path + '?')
    );

  useEffect(() => {
    // DO NOT proceed until both auth AND children are loaded if parent
    if (loading || (!childrenLoaded && isParent && isAuthenticated && !isExemptPath)) {
      return;
    }

    if (!isParent || isExemptPath || !isAuthenticated) {
      setCheckingEvidence(false);
      return;
    }

    const checkEvidence = () => {
      const screeningKey = user ? `screeningComplete_${user.id}` : null;
      const screeningCompleted = screeningKey
        ? localStorage.getItem(screeningKey) === 'true'
        : false;
      const hasChild = Boolean(localStorage.getItem('latestChildId'));
      const childId = localStorage.getItem('latestChildId');
      const screeningSubmitted = childId
        ? localStorage.getItem(`screeningSubmitted_${childId}`) === 'true'
        : false;

      if (screeningCompleted || hasChild || screeningSubmitted) {
        setHasEvidence(true);
        setCheckingEvidence(false);
        return;
      }

      // Check global context instead of making an API call
      if (parentChildren && parentChildren.length > 0) {
        setHasEvidence(true);
      } else {
        setHasEvidence(false);
      }
      setCheckingEvidence(false);
    };

    checkEvidence();
  }, [isParent, isExemptPath, loading, isAuthenticated, user, childrenLoaded, parentChildren]);

  if (loading || (!childrenLoaded && isParent && isAuthenticated && !isExemptPath) || checkingEvidence) {
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

  if (isParent && !isExemptPath && !hasEvidence) {
    return <Navigate to={ROUTES.PARENT_ADD_CHILD} replace />;
  }

  return <>{children}</>;
};
