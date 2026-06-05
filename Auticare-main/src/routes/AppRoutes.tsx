import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ROUTES, ROLES } from '../utils/constants';
import { BookingsProvider } from '../context/BookingsContext';

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
import { ParentSessions } from '../pages/parent/ParentSessions';
import { MyBookings } from '../pages/parent/MyBookings';
import { ParentReScreening } from '../pages/parent/ParentReScreening';
import { AddChild } from '../pages/parent/AddChild';
import OurSpecialists from '../pages/parent/OurSpecialists';

// Doctor Pages
import { DoctorHome } from '../pages/doctor/DoctorHome';
import { DoctorSessions } from '../pages/doctor/DoctorSessions';
import { DoctorPatients } from '../pages/doctor/DoctorPatients';
import { PatientDetail } from '../pages/doctor/PatientDetail';

// Therapist Pages
import { TherapistHome, TherapistSessions, TherapistPatients } from '../pages/therapist/TherapistPages';

// Shared Pages
import { Chat } from '../pages/shared/Chat';
import { Notifications } from '../pages/shared/Notifications';
import { Settings } from '../pages/shared/Settings';
import { Profile } from '../pages/shared/Profile';
import { Unauthorized } from '../pages/auth/Unauthorized';
import { HomeLanding } from '../pages/HomeLanding';

export const AppRoutes = () => {
  return (
    <Router>
      <BookingsProvider>
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
          path={ROUTES.PARENT_DASHBOARD}
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
          path={ROUTES.PARENT_MY_BOOKINGS}
          element={
            <ProtectedRoute requiredRole={ROLES.PARENT}>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PARENT_SPECIALISTS}
          element={
            <ProtectedRoute requiredRole={ROLES.PARENT}>
              <OurSpecialists />
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
        <Route
          path={ROUTES.DOCTOR_PATIENTS_DETAIL}
          element={
            <ProtectedRoute requiredRole={ROLES.DOCTOR}>
              <PatientDetail />
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
        <Route
          path="/therapist/patients/:id"
          element={
            <ProtectedRoute requiredRole={ROLES.THERAPIST}>
              <PatientDetail />
            </ProtectedRoute>
          }
        />

        {/* Shared Routes */}
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
      </BookingsProvider>
    </Router>
  );
};
