import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

export type SupportedLanguage = 'en' | 'ar' | 'fr' | 'es';

export interface Translations {
  // Navigation
  home: string;
  autismScreening: string;
  screeningResults: string;
  doctors: string;
  therapists: string;
  myBookings: string;
  sessions: string;
  notifications: string;
  chat: string;
  settings: string;
  profile: string;
  cases: string;
  logout: string;
  careDashboard: string;
  secureConnection: string;

  // Dashboard
  welcomeBack: string;
  parentDashboard: string;
  doctorDashboard: string;
  therapistDashboard: string;
  myChildren: string;
  noChildrenYet: string;
  addChild: string;
  startScreening: string;
  viewResults: string;
  bookSpecialist: string;
  activeCases: string;
  todaySessions: string;
  pendingBookings: string;
  completedSessions: string;
  upcomingSessions: string;
  recentNotifications: string;
  treatmentPlans: string;

  // Bookings / Sessions
  upcoming: string;
  completed: string;
  pending: string;
  scheduled: string;
  cancelled: string;
  joinZoomMeeting: string;
  specialist: string;
  dateTime: string;
  status: string;
  reason: string;
  noUpcomingBookings: string;
  noCompletedBookings: string;

  // Screening
  screeningFor: string;
  submitScreening: string;
  previous: string;
  continueBtn: string;
  loadingResults: string;
  noResultsFound: string;
  predictionResult: string;
  confidenceScore: string;
  riskLevel: string;

  // Auth
  signIn: string;
  signUp: string;
  email: string;
  password: string;
  forgotPassword: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;
  loginSuccessful: string;

  // Settings
  settingsTitle: string;
  managePreferences: string;
  notificationsSection: string;
  emailNotifications: string;
  pushNotifications: string;
  preferencesSection: string;
  theme: string;
  language: string;
  saveSettings: string;
  settingsSaved: string;
  dangerZone: string;
  deleteAccount: string;
  themeLight: string;
  themeDark: string;
  themeAuto: string;

  // Common
  loading: string;
  error: string;
  save: string;
  cancel: string;
  close: string;
  back: string;
  next: string;
  submit: string;
  confirm: string;
  approve: string;
  reject: string;
  yes: string;
  no: string;
  of: string;
}

const translations: Record<SupportedLanguage, Translations> = {
  en: {
    home: 'Home',
    autismScreening: 'Autism Screening',
    screeningResults: 'Screening Results',
    doctors: 'Doctors',
    therapists: 'Therapists',
    myBookings: 'My Bookings',
    sessions: 'Sessions',
    notifications: 'Notifications',
    chat: 'Chat',
    settings: 'Settings',
    profile: 'Profile',
    cases: 'Cases',
    logout: 'Logout',
    careDashboard: 'Care dashboard',
    secureConnection: 'Secure connection to your care network.',
    welcomeBack: 'Welcome Back',
    parentDashboard: 'Parent Dashboard',
    doctorDashboard: 'Doctor Dashboard',
    therapistDashboard: 'Therapist Dashboard',
    myChildren: 'My Children',
    noChildrenYet: 'No children added yet.',
    addChild: 'Add Child',
    startScreening: 'Start Screening',
    viewResults: 'View Results',
    bookSpecialist: 'Book Specialist',
    activeCases: 'Active Cases',
    todaySessions: "Today's Sessions",
    pendingBookings: 'Pending Bookings',
    completedSessions: 'Completed Sessions',
    upcomingSessions: 'Upcoming Sessions',
    recentNotifications: 'Recent Notifications',
    treatmentPlans: 'Treatment Plans',
    upcoming: 'Upcoming',
    completed: 'Completed',
    pending: 'Pending',
    scheduled: 'Scheduled',
    cancelled: 'Cancelled',
    joinZoomMeeting: 'Join Zoom Meeting',
    specialist: 'Specialist',
    dateTime: 'Date & Time',
    status: 'Status',
    reason: 'Reason',
    noUpcomingBookings: 'You have no upcoming bookings',
    noCompletedBookings: 'You have no completed bookings',
    screeningFor: 'Screening for',
    submitScreening: 'Submit Screening',
    previous: 'Previous',
    continueBtn: 'Continue',
    loadingResults: 'Loading your results…',
    noResultsFound: 'No results found',
    predictionResult: 'Prediction Result',
    confidenceScore: 'Confidence Score',
    riskLevel: 'Risk Level',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    loginSuccessful: 'Login successful! Redirecting...',
    settingsTitle: 'Settings',
    managePreferences: 'Manage your account preferences and app appearance.',
    notificationsSection: 'Notifications',
    emailNotifications: 'Email Notifications',
    pushNotifications: 'Push Notifications',
    preferencesSection: 'Preferences',
    theme: 'Theme',
    language: 'Language',
    saveSettings: 'Save Settings',
    settingsSaved: 'Settings saved successfully!',
    dangerZone: 'Danger Zone',
    deleteAccount: 'Delete Account',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeAuto: 'Auto',
    loading: 'Loading…',
    error: 'Error',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    confirm: 'Confirm',
    approve: 'Approve',
    reject: 'Reject',
    yes: 'Yes',
    no: 'No',
    of: 'of',
  },

  ar: {
    home: 'الرئيسية',
    autismScreening: 'فحص التوحد',
    screeningResults: 'نتائج الفحص',
    doctors: 'الأطباء',
    therapists: 'المعالجون',
    myBookings: 'حجوزاتي',
    sessions: 'الجلسات',
    notifications: 'الإشعارات',
    chat: 'المحادثة',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    cases: 'الحالات',
    logout: 'تسجيل الخروج',
    careDashboard: 'لوحة الرعاية',
    secureConnection: 'اتصال آمن بشبكة الرعاية الخاصة بك.',
    welcomeBack: 'مرحباً بعودتك',
    parentDashboard: 'لوحة تحكم ولي الأمر',
    doctorDashboard: 'لوحة تحكم الطبيب',
    therapistDashboard: 'لوحة تحكم المعالج',
    myChildren: 'أطفالي',
    noChildrenYet: 'لم يتم إضافة أطفال بعد.',
    addChild: 'إضافة طفل',
    startScreening: 'بدء الفحص',
    viewResults: 'عرض النتائج',
    bookSpecialist: 'حجز متخصص',
    activeCases: 'الحالات النشطة',
    todaySessions: 'جلسات اليوم',
    pendingBookings: 'الحجوزات المعلقة',
    completedSessions: 'الجلسات المكتملة',
    upcomingSessions: 'الجلسات القادمة',
    recentNotifications: 'الإشعارات الأخيرة',
    treatmentPlans: 'خطط العلاج',
    upcoming: 'القادمة',
    completed: 'المكتملة',
    pending: 'معلق',
    scheduled: 'مجدول',
    cancelled: 'ملغي',
    joinZoomMeeting: 'الانضمام إلى اجتماع زوم',
    specialist: 'المتخصص',
    dateTime: 'التاريخ والوقت',
    status: 'الحالة',
    reason: 'السبب',
    noUpcomingBookings: 'لا توجد حجوزات قادمة',
    noCompletedBookings: 'لا توجد حجوزات مكتملة',
    screeningFor: 'فحص لـ',
    submitScreening: 'إرسال الفحص',
    previous: 'السابق',
    continueBtn: 'متابعة',
    loadingResults: 'جارٍ تحميل النتائج...',
    noResultsFound: 'لم يتم العثور على نتائج',
    predictionResult: 'نتيجة التنبؤ',
    confidenceScore: 'درجة الثقة',
    riskLevel: 'مستوى الخطر',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    dontHaveAccount: 'ليس لديك حساب؟',
    alreadyHaveAccount: 'هل لديك حساب بالفعل؟',
    loginSuccessful: 'تم تسجيل الدخول بنجاح! جارٍ التحويل...',
    settingsTitle: 'الإعدادات',
    managePreferences: 'إدارة تفضيلات حسابك ومظهر التطبيق.',
    notificationsSection: 'الإشعارات',
    emailNotifications: 'إشعارات البريد الإلكتروني',
    pushNotifications: 'الإشعارات الفورية',
    preferencesSection: 'التفضيلات',
    theme: 'المظهر',
    language: 'اللغة',
    saveSettings: 'حفظ الإعدادات',
    settingsSaved: 'تم حفظ الإعدادات بنجاح!',
    dangerZone: 'منطقة الخطر',
    deleteAccount: 'حذف الحساب',
    themeLight: 'فاتح',
    themeDark: 'داكن',
    themeAuto: 'تلقائي',
    loading: 'جارٍ التحميل...',
    error: 'خطأ',
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    back: 'رجوع',
    next: 'التالي',
    submit: 'إرسال',
    confirm: 'تأكيد',
    approve: 'موافقة',
    reject: 'رفض',
    yes: 'نعم',
    no: 'لا',
    of: 'من',
  },

  fr: {
    home: 'Accueil',
    autismScreening: 'Dépistage de l\'autisme',
    screeningResults: 'Résultats du dépistage',
    doctors: 'Médecins',
    therapists: 'Thérapeutes',
    myBookings: 'Mes réservations',
    sessions: 'Séances',
    notifications: 'Notifications',
    chat: 'Messagerie',
    settings: 'Paramètres',
    profile: 'Profil',
    cases: 'Dossiers',
    logout: 'Déconnexion',
    careDashboard: 'Tableau de bord des soins',
    secureConnection: 'Connexion sécurisée à votre réseau de soins.',
    welcomeBack: 'Bon retour',
    parentDashboard: 'Tableau de bord parent',
    doctorDashboard: 'Tableau de bord médecin',
    therapistDashboard: 'Tableau de bord thérapeute',
    myChildren: 'Mes enfants',
    noChildrenYet: 'Aucun enfant ajouté pour l\'instant.',
    addChild: 'Ajouter un enfant',
    startScreening: 'Commencer le dépistage',
    viewResults: 'Voir les résultats',
    bookSpecialist: 'Réserver un spécialiste',
    activeCases: 'Dossiers actifs',
    todaySessions: 'Séances d\'aujourd\'hui',
    pendingBookings: 'Réservations en attente',
    completedSessions: 'Séances terminées',
    upcomingSessions: 'Séances à venir',
    recentNotifications: 'Notifications récentes',
    treatmentPlans: 'Plans de traitement',
    upcoming: 'À venir',
    completed: 'Terminé',
    pending: 'En attente',
    scheduled: 'Planifié',
    cancelled: 'Annulé',
    joinZoomMeeting: 'Rejoindre la réunion Zoom',
    specialist: 'Spécialiste',
    dateTime: 'Date et heure',
    status: 'Statut',
    reason: 'Raison',
    noUpcomingBookings: 'Vous n\'avez aucune réservation à venir',
    noCompletedBookings: 'Vous n\'avez aucune réservation terminée',
    screeningFor: 'Dépistage pour',
    submitScreening: 'Soumettre le dépistage',
    previous: 'Précédent',
    continueBtn: 'Continuer',
    loadingResults: 'Chargement de vos résultats…',
    noResultsFound: 'Aucun résultat trouvé',
    predictionResult: 'Résultat de la prédiction',
    confidenceScore: 'Score de confiance',
    riskLevel: 'Niveau de risque',
    signIn: 'Se connecter',
    signUp: 'S\'inscrire',
    email: 'Email',
    password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    dontHaveAccount: 'Vous n\'avez pas de compte ?',
    alreadyHaveAccount: 'Vous avez déjà un compte ?',
    loginSuccessful: 'Connexion réussie ! Redirection...',
    settingsTitle: 'Paramètres',
    managePreferences: 'Gérez les préférences de votre compte et l\'apparence de l\'application.',
    notificationsSection: 'Notifications',
    emailNotifications: 'Notifications par email',
    pushNotifications: 'Notifications push',
    preferencesSection: 'Préférences',
    theme: 'Thème',
    language: 'Langue',
    saveSettings: 'Enregistrer les paramètres',
    settingsSaved: 'Paramètres enregistrés avec succès !',
    dangerZone: 'Zone dangereuse',
    deleteAccount: 'Supprimer le compte',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    themeAuto: 'Auto',
    loading: 'Chargement…',
    error: 'Erreur',
    save: 'Enregistrer',
    cancel: 'Annuler',
    close: 'Fermer',
    back: 'Retour',
    next: 'Suivant',
    submit: 'Soumettre',
    confirm: 'Confirmer',
    approve: 'Approuver',
    reject: 'Rejeter',
    yes: 'Oui',
    no: 'Non',
    of: 'sur',
  },

  es: {
    home: 'Inicio',
    autismScreening: 'Detección de autismo',
    screeningResults: 'Resultados del cribado',
    doctors: 'Médicos',
    therapists: 'Terapeutas',
    myBookings: 'Mis reservas',
    sessions: 'Sesiones',
    notifications: 'Notificaciones',
    chat: 'Chat',
    settings: 'Configuración',
    profile: 'Perfil',
    cases: 'Casos',
    logout: 'Cerrar sesión',
    careDashboard: 'Panel de atención',
    secureConnection: 'Conexión segura a tu red de atención.',
    welcomeBack: 'Bienvenido de nuevo',
    parentDashboard: 'Panel de padres',
    doctorDashboard: 'Panel del médico',
    therapistDashboard: 'Panel del terapeuta',
    myChildren: 'Mis hijos',
    noChildrenYet: 'Aún no se han añadido niños.',
    addChild: 'Añadir niño',
    startScreening: 'Iniciar detección',
    viewResults: 'Ver resultados',
    bookSpecialist: 'Reservar especialista',
    activeCases: 'Casos activos',
    todaySessions: 'Sesiones de hoy',
    pendingBookings: 'Reservas pendientes',
    completedSessions: 'Sesiones completadas',
    upcomingSessions: 'Próximas sesiones',
    recentNotifications: 'Notificaciones recientes',
    treatmentPlans: 'Planes de tratamiento',
    upcoming: 'Próximas',
    completed: 'Completadas',
    pending: 'Pendiente',
    scheduled: 'Programado',
    cancelled: 'Cancelado',
    joinZoomMeeting: 'Unirse a la reunión de Zoom',
    specialist: 'Especialista',
    dateTime: 'Fecha y hora',
    status: 'Estado',
    reason: 'Motivo',
    noUpcomingBookings: 'No tienes reservas próximas',
    noCompletedBookings: 'No tienes reservas completadas',
    screeningFor: 'Detección para',
    submitScreening: 'Enviar detección',
    previous: 'Anterior',
    continueBtn: 'Continuar',
    loadingResults: 'Cargando tus resultados…',
    noResultsFound: 'No se encontraron resultados',
    predictionResult: 'Resultado de la predicción',
    confidenceScore: 'Puntuación de confianza',
    riskLevel: 'Nivel de riesgo',
    signIn: 'Iniciar sesión',
    signUp: 'Registrarse',
    email: 'Correo electrónico',
    password: 'Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    dontHaveAccount: '¿No tienes cuenta?',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    loginSuccessful: '¡Inicio de sesión exitoso! Redirigiendo...',
    settingsTitle: 'Configuración',
    managePreferences: 'Gestiona las preferencias de tu cuenta y la apariencia de la aplicación.',
    notificationsSection: 'Notificaciones',
    emailNotifications: 'Notificaciones por correo',
    pushNotifications: 'Notificaciones push',
    preferencesSection: 'Preferencias',
    theme: 'Tema',
    language: 'Idioma',
    saveSettings: 'Guardar configuración',
    settingsSaved: '¡Configuración guardada correctamente!',
    dangerZone: 'Zona de peligro',
    deleteAccount: 'Eliminar cuenta',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeAuto: 'Auto',
    loading: 'Cargando…',
    error: 'Error',
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    back: 'Atrás',
    next: 'Siguiente',
    submit: 'Enviar',
    confirm: 'Confirmar',
    approve: 'Aprobar',
    reject: 'Rechazar',
    yes: 'Sí',
    no: 'No',
    of: 'de',
  },
};

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translations;
  isRTL: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const RTL_LANGUAGES: SupportedLanguage[] = ['ar'];

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const stored = localStorage.getItem('appLanguage') as SupportedLanguage | null;
    return stored && translations[stored] ? stored : 'en';
  });

  const isRTL = RTL_LANGUAGES.includes(language);

  // Apply lang + dir to the document root whenever language changes
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    if (!translations[lang]) return;
    setLanguageState(lang);
    localStorage.setItem('appLanguage', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
  }, []);

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t: translations[language], isRTL }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
