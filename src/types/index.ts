export type UserRole = 'parent' | 'doctor' | 'therapist';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  nationalId?: string;
  profileImage?: string;
  createdAt: string;
  specialization?: string;
  specialty?: string;
  yearsOfExperience?: number | string;
  licenseNumber?: string;
  bio?: string;
  gender?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user?: User;
  userId?: string;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
  profileImage?: string;
  createdAt?: string;
  expiresAt?: string;
}

export type LoginResponse = AuthResponse;
export type SignupResponse = AuthResponse;

export interface Parent extends User {
  role: 'parent';
  childName?: string;
  childAge?: number;
}

export interface Doctor extends User {
  role: 'doctor';
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
}

export interface Therapist extends User {
  role: 'therapist';
  specialization?: string;
  certifications?: string[];
  yearsOfExperience?: number;
}

export interface AuthContextType {
  authInitialized: boolean;
  user: User | null;
  loading: boolean;
  childrenLoaded: boolean;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentChildren: any[];
  activeChildId: string | null;
  setActiveChildId: (id: string | null) => void;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  signup: (payload: Record<string, unknown>) => Promise<SignupResponse>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  clearError: () => void;
  updateUserFields: (fields: Partial<User>) => void;
}

export interface ScreeningQuestion {
  id: string;
  question: string;
  description?: string;
  pageNumber: number;
  options: ScreeningOption[];
}

export interface ScreeningOption {
  id: string;
  label: string;
  value: number;
}

export interface ScreeningAnswer {
  questionId: string;
  optionId: string;
  value: number;
}

export interface ScreeningSession {
  id: string;
  childId?: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  answers: ScreeningAnswer[];
  score?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface ScreeningResult {
  childName: string;
  predictionClass: string;
  confidenceScore: number;
  aqScore: number;
  riskLevel: string;
  probability: string;
  socialAttention: number;
  jointAttention: number;
  socialCommunication: number;
  language: number;
  imagination: number;
  repetitiveBehavior: number;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  specialistId: string;
  specialistType: 'doctor' | 'therapist';
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  notes?: string;
  joinLink?: string;
}

export interface Specialist {
  id: string;
  name: string;
  type: 'doctor' | 'therapist';
  specialization: string;
  yearsOfExperience: number;
  yearsExperience?: number; // Backend field
  rating: number;
  reviewCount: number;
  availableSlots: AvailableSlot[];
  profileImage?: string;
  licenseNumber?: string;
  certifications?: string[];
  email?: string;
  bio?: string;
  about?: string;
  reviews?: number;
  cases?: number;
  availability?: string;
}

export interface AvailableSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  lastSessionDate?: string;
  nextSessionDate?: string;
}

// ========================= NEW TYPES =========================

export interface Child {
  id: string;
  parentId: string;
  name: string;
  age: number;
  gender: string;
  dateOfBirth: string;
  profileImage?: string;
  medicalHistory?: string;
  familyAutismHistory?: boolean;
  jaundiceHistory?: boolean;
  notes?: string;
  createdAt: string;
  riskLevel?: string;
}

export interface Booking {
  id: string;
  parentId: string;
  childId: string;
  specialistId: string;
  specialistType: 'doctor' | 'therapist';
  status: 'pending' | 'approved' | 'completed' | 'cancelled' | 'scheduled' | 'confirmed' | 'rejected';
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  notes?: string;
  consultationNotes?: string;
  createdAt: string;
  updatedAt: string;
  // Additional optional fields for compatibility
  dateTime?: string;
  specialistName?: string;
  joinLink?: string;
  zoomUrl?: string;
  reason?: string;
  doctorName?: string;
  therapistName?: string;
  parentName?: string;
  childName?: string;
  treatmentId?: string | number;
  TreatmentId?: string | number;
}

export interface TreatmentPlan {
  id: string;
  childId: string;
  doctorId: string;
  title: string;
  description?: string;
  goals: string[];
  recommendations: string[];
  homeActivities: string[];
  assignedTherapists: string[];
  status: 'active' | 'completed' | 'paused';
  startDate: string;
  endDate?: string;
  notes?: string;
  progressOverview?: ProgressItem[];
  createdAt: string;
  updatedAt: string;
  goal?: string;
  progress?: string;
}

export interface ProgressItem {
  id: string;
  title: string;
  description: string;
  progress: number; // 0-100
  status: 'not-started' | 'in-progress' | 'completed';
}

export interface TherapySession {
  id: string;
  treatmentPlanId: string;
  therapistId: string;
  childId: string;
  title: string;
  description?: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  notes?: string;
  joinLink?: string;
  recordingUrl?: string;
  createdAt: string;
}

export interface ClinicalNote {
  id: string;
  childId: string;
  authorId: string;
  authorType: 'doctor' | 'therapist';
  title: string;
  content: string;
  category: 'observation' | 'recommendation' | 'progress' | 'concern';
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  fileType: string;
  uploadedAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: 'parent' | 'doctor' | 'therapist';
  content: string;
  messageType: 'text' | 'zoom-link' | 'file' | 'audio' | 'call';
  zoomLink?: string;
  fileAttachment?: Attachment;
  audioUrl?: string;
  reactions?: Record<string, string>; // e.g. { 'userId': '👍' }
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  lastMessage?: ChatMessage;
  lastUpdated: string;
  unreadCount: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'booking' | 'message' | 'treatment-plan' | 'session' | 'reminder' | 'notes' | 'system' | 'screening';
  title: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Dashboard {
  children?: Child[];
  latestScreening?: ScreeningResult;
  upcomingSessions?: TherapySession[];
  activeTreatmentPlans?: TreatmentPlan[];
  recentNotes?: ClinicalNote[];
  notifications?: Notification[];
  pendingBookings?: Booking[];
}

export interface ScreeningAnalytics {
  totalScreenings: number;
  averageScore: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  trends: ScreeningTrend[];
}

export interface ScreeningTrend {
  date: string;
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface FileUploadResponse {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface PatientDetails extends Patient {
  screeningResults: ScreeningResult[];
  sessionHistory: Session[];
  notes: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  lastMessage?: string;
  unreadCount?: number;
}
