import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LoadingPage } from '../components/common/Loading';
import { ROUTES } from '../utils/constants';
import { useState, useEffect } from 'react';
import { childrenService } from '../services/api/childrenService';

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
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const [checkingEvidence, setCheckingEvidence] = useState(true);
  const [hasEvidence, setHasEvidence] = useState(false);

  const isParent = user?.role === 'parent';
  const isExemptPath =
    location.pathname === ROUTES.PARENT_HOME ||
    location.pathname.startsWith(ROUTES.PARENT_HOME + '/') === false ||
    SCREENING_EXEMPT_PATHS.some(
      (path) => location.pathname === path || location.pathname.startsWith(path + '?')
    );

  useEffect(() => {
    if (!isParent || isExemptPath || loading || !isAuthenticated) {
      setCheckingEvidence(false);
      return;
    }

    const checkEvidence = async () => {
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

      // If no local evidence, try fetching from server (which checks bookings as fallback)
      try {
        const children = await childrenService.getMyChildren();
        if (children && children.length > 0) {
          setHasEvidence(true);
        } else {
          setHasEvidence(false);
        }
      } catch (err) {
        setHasEvidence(false);
      } finally {
        setCheckingEvidence(false);
      }
    };

    void checkEvidence();
  }, [isParent, isExemptPath, loading, isAuthenticated, user]);

  if (loading || checkingEvidence) {
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

