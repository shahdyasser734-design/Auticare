export const ROLES = {
  PARENT: 'parent',
  DOCTOR: 'doctor',
  THERAPIST: 'therapist',
} as const;

export const SCREENING_PAGES = 10;

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const SESSION_STATUS = {
  SCHEDULED: 'scheduled',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const NOTIFICATION_TYPES = {
  SESSION: 'session',
  BOOKING: 'booking',
  SCREENING: 'screening',
  MESSAGE: 'message',
  SYSTEM: 'system',
} as const;

export const SPECIALIZATIONS = {
  GENERAL: 'General Practice',
  PEDIATRIC: 'Pediatric Medicine',
  PSYCHOLOGY: 'Psychology',
  SPEECH_THERAPY: 'Speech Therapy',
  OCCUPATIONAL_THERAPY: 'Occupational Therapy',
  BEHAVIORAL_THERAPY: 'Behavioral Therapy',
  COGNITIVE_THERAPY: 'Cognitive Behavioral Therapy',
} as const;

export const ROUTES = {
  // Public routes
  ROOT: '/',
  LOADING: '/loading',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_EMAIL: '/verify-email',

  // Parent routes
  PARENT_HOME: '/parent',
  PARENT_SCREENING: '/parent/screening',
  PARENT_SCREENING_RESULTS: '/parent/screening-results',
  PARENT_BOOK_SPECIALIST: '/parent/book-specialist',
  PARENT_DOCTORS: '/parent/doctors',
  PARENT_DOCTORS_DETAIL: '/parent/doctors/:id',
  PARENT_THERAPISTS: '/parent/therapists',
  PARENT_THERAPISTS_DETAIL: '/parent/therapists/:id',
  PARENT_SESSIONS: '/parent/sessions',
  PARENT_RE_SCREENING: '/parent/re-screening',
  PARENT_ADD_CHILD: '/parent/add-child',
  PARENT_MY_BOOKINGS: '/parent/my-bookings',

  // Doctor routes
  DOCTOR_HOME: '/doctor',
  DOCTOR_SESSIONS: '/doctor/sessions',
  DOCTOR_PATIENTS: '/doctor/patients',
  DOCTOR_PATIENTS_DETAIL: '/doctor/patients/:id',

  // Therapist routes
  THERAPIST_HOME: '/therapist',
  THERAPIST_SESSIONS: '/therapist/sessions',
  THERAPIST_PATIENTS: '/therapist/patients',
  THERAPIST_PATIENTS_DETAIL: '/therapist/patients/:id',

  // Shared routes
  CHAT: '/chat',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  TREATMENT_PLAN: '/treatment-plan/:childId',

  // Error routes
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/unauthorized',
};

export const API_ENDPOINTS = {
  AUTH: '/auth',
  SCREENING: '/screening',
  SESSIONS: '/sessions',
  SPECIALISTS: '/specialists',
  PATIENTS: '/patients',
  CHAT: '/chat',
  NOTIFICATIONS: '/notifications',
};
