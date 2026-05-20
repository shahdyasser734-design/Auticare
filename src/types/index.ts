export type UserRole = 'parent' | 'doctor' | 'therapist';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  profileImage?: string;
  createdAt: string;
}

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
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  clearError: () => void;
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
  rating: number;
  reviewCount: number;
  availableSlots: AvailableSlot[];
  profileImage?: string;
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

export interface Booking {
  id: string;
  userId: string;
  specialistId: string;
  childId?: string;
  dateTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'scheduled' | 'completed';
  reason?: string;
  notes?: string;
  joinLink?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt?: string;
  specialistName?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'session' | 'booking' | 'screening' | 'message' | 'system';
  isRead: boolean;
  createdAt: string;
  actionLink?: string;
}
