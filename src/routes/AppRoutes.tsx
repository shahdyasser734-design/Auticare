import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../context/useAuth';
import { ROUTES, ROLES } from '../utils/constants';

// Auth Pages
import { Loading } from '../pages/auth/Loading';
import { Login } from '../pages/auth/Login';
import { Signup } from '../pages/auth/Signup';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { NotFound } from '../pages/auth/NotFound';

// Parent Pages
import { ParentHome } from '../pages/parent/ParentHome';
import { ParentScreening } from '../pages/parent/ParentScreening';
import { ParentScreeningResults } from '../pages/parent/ParentScreeningResults';
import { BookSpecialist } from '../pages/parent/BookSpecialist';
import { DoctorDetails } from '../pages/parent/DoctorDetails';
import { TherapistDetails } from '../pages/parent/TherapistDetails';

import { ParentSessions } from '../pages/parent/ParentSessions';
import { ParentReScreening } from '../pages/parent/ParentReScreening';
import { AddChild } from '../pages/parent/AddChild';

// Doctor Pages
import { DoctorHome } from '../pages/doctor/DoctorHome';
import { DoctorSessions } from '../pages/doctor/DoctorSessions';
import { DoctorPatients } from '../pages/doctor/DoctorPatients';
import { SpecialistScreeningResults } from '../pages/doctor/SpecialistScreeningResults';

// Therapist Pages
import { TherapistHome, TherapistSessions, TherapistPatients } from '../pages/therapist/TherapistPages';

// Shared Pages
import { Chat } from '../pages/shared/Chat';
import { Notifications } from '../pages/shared/Notifications';
import { Settings } from '../pages/shared/Settings';
import { Profile } from '../pages/shared/Profile';
import { TreatmentPlan } from '../pages/shared/TreatmentPlan';
import { PatientDetails } from '../pages/shared/PatientDetails';
import { Unauthorized } from '../pages/auth/Unauthorized';
import { HomeLanding } from '../pages/HomeLanding';

export const AppRoutes = () => {
  const { authInitialized, childrenLoaded, isAuthenticated, user } = useAuth();

  // Global Hydration Gate: Do not allow ANY routing decisions until fully synced
  if (!authInitialized) {
    return <Loading />;
  }

  if (isAuthenticated && user?.role === 'parent' && !childrenLoaded) {
    return <Loading />;
  }

  return (
    <Router>
      <Routes>
        {/* Public Landing */}
        <Route path={ROUTES.ROOT} element={<HomeLanding />} />

        {/* Auth Routes */}
        <Route path={ROUTES.LOADING} element={<Loading />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.SIGNUP} element={<Signup />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />

        {/* Parent Routes */}
        <Route
          path={ROUTES.PARENT_HOME}
          element={
            <ProtectedRoute requiredRole={ROLES.PARENT}>
              <ParentHome />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PARENT_SCREENING}
          element={
            <ProtectedRoute requiredRole={ROLES.PARENT}>
              <ParentScreening />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PARENT_SCREENING_RESULTS}
          element={
            <ProtectedRoute requiredRole={ROLES.PARENT}>
              <ParentScreeningResults />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PARENT_BOOK_SPECIALIST}
          element={
            <ProtectedRoute requiredRole={ROLES.PARENT}>
              <BookSpecialist />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PARENT_DOCTORS}
          element={
            <ProtectedRoute requiredRole={ROLES.PARENT}>
              <BookSpecialist />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PARENT_DOCTORS_DETAIL}
          element={
            <ProtectedRoute requiredRole={ROLES.PARENT}>
              <DoctorDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PARENT_THERAPISTS}
          element={
            <ProtectedRoute requiredRole={ROLES.PARENT}>
              <BookSpecialist />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PARENT_THERAPISTS_DETAIL}
          element={
            <ProtectedRoute requiredRole={ROLES.PARENT}>
              <TherapistDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PARENT_SESSIONS}
          element={
            <ProtectedRoute requiredRole={ROLES.PARENT}>
              <ParentSessions />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PARENT_RE_SCREENING}
          element={
            <ProtectedRoute requiredRole={ROLES.PARENT}>
              <ParentReScreening />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PARENT_ADD_CHILD}
          element={
            <ProtectedRoute requiredRole={ROLES.PARENT}>
              <AddChild />
            </ProtectedRoute>
          }
        />

        {/* Doctor Routes */}
        <Route
          path={ROUTES.DOCTOR_HOME}
          element={
            <ProtectedRoute requiredRole={ROLES.DOCTOR}>
              <DoctorHome />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.DOCTOR_SESSIONS}
          element={
            <ProtectedRoute requiredRole={ROLES.DOCTOR}>
              <DoctorSessions />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.DOCTOR_PATIENTS}
          element={
            <ProtectedRoute requiredRole={ROLES.DOCTOR}>
              <DoctorPatients />
            </ProtectedRoute>
          }
        />

        {/* Therapist Routes */}
        <Route
          path={ROUTES.THERAPIST_HOME}
          element={
            <ProtectedRoute requiredRole={ROLES.THERAPIST}>
              <TherapistHome />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.THERAPIST_SESSIONS}
          element={
            <ProtectedRoute requiredRole={ROLES.THERAPIST}>
              <TherapistSessions />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.THERAPIST_PATIENTS}
          element={
            <ProtectedRoute requiredRole={ROLES.THERAPIST}>
              <TherapistPatients />
            </ProtectedRoute>
          }
        />
        {/* ── Unified Patient Detail ──────────────────────────────────────────
             Single route, no role restriction. Any authenticated user who
             arrives here gets the page. Role only controls UI actions inside.
             Old paths (/cases/:id, /specialist/patients/:id) are kept as
             aliases so any existing bookmark/link still works.              */}
        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute>
              <PatientDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases/:id"
          element={
            <ProtectedRoute>
              <PatientDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/specialist/patients/:id"
          element={
            <ProtectedRoute>
              <PatientDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/specialist/screening-results/:id"
          element={
            <ProtectedRoute requiredRole={[ROLES.DOCTOR, ROLES.THERAPIST]}>
              <SpecialistScreeningResults />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.TREATMENT_PLAN}
          element={
            <ProtectedRoute requiredRole={[ROLES.DOCTOR, ROLES.PARENT]}>
              <TreatmentPlan />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.NOTIFICATIONS}
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CHAT}
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.SETTINGS}
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PROFILE}
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Default & Error Routes */}
        <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />
        <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};
