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
  ROUTES.PARENT_SCREENING_RESULTS,  // ← result page must never be blocked
  ROUTES.PARENT_RE_SCREENING,       // ← re-screening must never be blocked
];

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
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

  // ─── Screening guard for parents only ───────────────────────────────────────
  //
  // IMPORTANT: We deliberately do NOT block the Parent Home (/parent) here.
  // The login flow already checked GET /api/children and directed the user
  // to the correct page. Blocking the home page would re-trigger the
  // onboarding loop for every returning parent whose localStorage was cleared
  // by logout.
  //
  // We only apply the guard to deep pages (e.g. Sessions, Bookings) if there
  // is genuinely zero evidence of prior onboarding. Evidence is:
  //   1. localStorage screeningComplete_<userId> flag  (set after submission)
  //   2. localStorage latestChildId                    (set when a child was added)
  //   3. localStorage screeningSubmitted_<childId>     (set on successful submit)
  //
  // If ANY of these exist, the parent has completed at least one onboarding
  // step and must not be forced back to the beginning.
  // ────────────────────────────────────────────────────────────────────────────
  const isParent = user?.role === 'parent';

  const isExemptPath =
    location.pathname === ROUTES.PARENT_HOME ||
    location.pathname.startsWith(ROUTES.PARENT_HOME + '/') === false ||  // non-parent paths
    SCREENING_EXEMPT_PATHS.some(
      (path) => location.pathname === path || location.pathname.startsWith(path + '?')
    );

  if (isParent && !isExemptPath) {
    const screeningKey = user ? `screeningComplete_${user.id}` : null;
    const screeningCompleted = screeningKey
      ? localStorage.getItem(screeningKey) === 'true'
      : false;
    const hasChild = Boolean(localStorage.getItem('latestChildId'));
    const childId = localStorage.getItem('latestChildId');
    const screeningSubmitted = childId
      ? localStorage.getItem(`screeningSubmitted_${childId}`) === 'true'
      : false;

    const hasAnyEvidence = screeningCompleted || hasChild || screeningSubmitted;

    if (!hasAnyEvidence) {
      // Truly first-time parent with no evidence of onboarding — redirect to Add Child
      return <Navigate to={ROUTES.PARENT_ADD_CHILD} replace />;
    }
  }

  return <>{children}</>;
};
