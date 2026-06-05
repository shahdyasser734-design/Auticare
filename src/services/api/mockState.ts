import type { ChatConversation, ChatMessage, Notification, Child, Booking } from '../../types';

const STORAGE_KEYS = {
  notifications: 'auticare.mock.notifications',
  chats: 'auticare.mock.chats',
  messages: 'auticare.mock.messages',
  bookings: 'auticare.mock.bookings',
  children: 'auticare.mock.children',
};

const parseStored = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const saveStored = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const defaultNotifications: Notification[] = [
  {
    id: 'mock-notification-1',
    userId: 'user-123',
    type: 'booking',
    title: 'Session request sent',
    message: 'Your session request has been sent to the doctor and is pending confirmation.',
    relatedId: 'mock-booking-1',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 'mock-notification-2',
    userId: 'user-123',
    type: 'session',
    title: 'Upcoming consultation',
    message: 'You have an upcoming session tomorrow at 4:00 PM with Dr. Patel.',
    relatedId: 'mock-booking-2',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: 'mock-notification-3',
    userId: 'user-123',
    type: 'message',
    title: 'New message from therapist',
    message: 'Your therapist has sent a chat update about your child’s progress.',
    relatedId: 'mock-chat-1',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'mock-notification-4',
    userId: 'user-123',
    type: 'system',
    title: 'Profile setup complete',
    message: 'Your child profile is ready. You can now book appointments and review screening results.',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
];

const defaultChats: ChatConversation[] = [
  {
    id: 'mock-chat-1',
    participantIds: ['user-123', 'therapist-1'],
    participantNames: { 'user-123': 'You', 'therapist-1': 'Therapist Anna' },
    lastMessage: {
      id: 'mock-msg-3',
      chatId: 'mock-chat-1',
      senderId: 'therapist-1',
      senderName: 'Therapist Anna',
      senderRole: 'therapist',
      content: 'I reviewed your notes and would recommend a short observation session next week.',
      messageType: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      isRead: false,
    },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    unreadCount: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'mock-chat-2',
    participantIds: ['user-123', 'doctor-1'],
    participantNames: { 'user-123': 'You', 'doctor-1': 'Dr. Patel' },
    lastMessage: {
      id: 'mock-msg-6',
      chatId: 'mock-chat-2',
      senderId: 'user-123',
      senderName: 'You',
      senderRole: 'parent',
      content: 'Thank you, I’ll be ready for the session tomorrow.',
      messageType: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      isRead: true,
    },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    unreadCount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
];

const defaultMessages: Record<string, ChatMessage[]> = {
  'mock-chat-1': [
    {
      id: 'mock-msg-1',
      chatId: 'mock-chat-1',
      senderId: 'user-123',
      senderName: 'You',
      senderRole: 'parent',
      content: 'Hello Anna, I wanted to follow up on the screening results.',
      messageType: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      isRead: true,
    },
    {
      id: 'mock-msg-2',
      chatId: 'mock-chat-1',
      senderId: 'therapist-1',
      senderName: 'Therapist Anna',
      senderRole: 'therapist',
      content: 'Thanks for reaching out. I see the results and I will follow up with a suggested plan now.',
      messageType: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      isRead: true,
    },
    {
      id: 'mock-msg-3',
      chatId: 'mock-chat-1',
      senderId: 'therapist-1',
      senderName: 'Therapist Anna',
      senderRole: 'therapist',
      content: 'I reviewed your notes and would recommend a short observation session next week.',
      messageType: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      isRead: false,
    },
  ],
  'mock-chat-2': [
    {
      id: 'mock-msg-4',
      chatId: 'mock-chat-2',
      senderId: 'doctor-1',
      senderName: 'Dr. Patel',
      senderRole: 'doctor',
      content: 'Hello! I have reviewed the latest assessment and I am ready to confirm your appointment.',
      messageType: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      isRead: true,
    },
    {
      id: 'mock-msg-5',
      chatId: 'mock-chat-2',
      senderId: 'user-123',
      senderName: 'You',
      senderRole: 'parent',
      content: 'Thank you, doctor. I appreciate the quick response.',
      messageType: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      isRead: true,
    },
    {
      id: 'mock-msg-6',
      chatId: 'mock-chat-2',
      senderId: 'user-123',
      senderName: 'You',
      senderRole: 'parent',
      content: 'Thank you, I’ll be ready for the session tomorrow.',
      messageType: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      isRead: true,
    },
  ],
};

const defaultBookings: Booking[] = [
  {
    id: 'mock-booking-1',
    parentId: 'user-123',
    childId: 'child-1',
    specialistId: 'doctor-1',
    specialistType: 'doctor',
    appointmentDate: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString().split('T')[0],
    appointmentTime: '16:00',
    duration: 60,
    status: 'scheduled',
    notes: 'Please review the latest screening results before the session.',
    consultationNotes: 'Developmental consultation and follow up.',
    joinLink: 'https://zoom.us/j/1234567890',
    specialistName: 'Dr. Patel',
    dateTime: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'mock-booking-2',
    parentId: 'user-123',
    childId: 'child-1',
    specialistId: 'therapist-1',
    specialistType: 'therapist',
    appointmentDate: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString().split('T')[0],
    appointmentTime: '11:00',
    duration: 60,
    status: 'completed',
    notes: 'Therapy completed. Awaiting follow-up recommendations.',
    consultationNotes: 'Speech development review and therapy plan.',
    joinLink: 'https://zoom.us/j/9876543210',
    specialistName: 'Therapist Anna',
    dateTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
  },
];

const defaultChildren: Child[] = [
  {
    id: 'child-1',
    parentId: 'parent-123',
    name: 'Samira Ali',
    age: 4,
    gender: 'Female',
    dateOfBirth: '2020-06-14',
    profileImage: '',
    medicalHistory: 'No significant medical history.',
    familyAutismHistory: false,
    jaundiceHistory: false,
    notes: 'No additional notes',
    createdAt: new Date().toISOString(),
  },
];

const ensureStoredDefaults = <T>(key: string, defaults: T): T => {
  const stored = parseStored<T>(key, defaults);
  if (!stored || (Array.isArray(stored) && stored.length === 0)) {
    saveStored(key, defaults);
    return defaults;
  }
  return stored;
};

export const mockState = {
  getNotifications: (): Notification[] => ensureStoredDefaults(STORAGE_KEYS.notifications, defaultNotifications),
  addNotification: (notification: Notification) => {
    const notifications = mockState.getNotifications();
    const existing = notifications.find((item) => item.id === notification.id);
    const next = existing ? notifications.map((item) => (item.id === notification.id ? notification : item)) : [notification, ...notifications];
    saveStored(STORAGE_KEYS.notifications, next);
    return next;
  },
  markNotificationRead: (notificationId: string) => {
    const notifications = mockState.getNotifications().map((notification) =>
      notification.id === notificationId ? { ...notification, isRead: true } : notification
    );
    saveStored(STORAGE_KEYS.notifications, notifications);
    return notifications;
  },
  deleteReadNotifications: () => {
    const notifications = mockState.getNotifications().filter((notification) => !notification.isRead);
    saveStored(STORAGE_KEYS.notifications, notifications);
    return notifications;
  },

  getChats: (): ChatConversation[] => ensureStoredDefaults(STORAGE_KEYS.chats, defaultChats),
  getMessages: (chatId: string): ChatMessage[] => {
    const allMessages = parseStored<Record<string, ChatMessage[]>>(STORAGE_KEYS.messages, defaultMessages);
    if (!allMessages[chatId]) {
      allMessages[chatId] = [];
      saveStored(STORAGE_KEYS.messages, allMessages);
    }
    return allMessages[chatId];
  },
  addMessage: (chatId: string, message: ChatMessage) => {
    const allMessages = parseStored<Record<string, ChatMessage[]>>(STORAGE_KEYS.messages, defaultMessages);
    const messages = allMessages[chatId] ?? [];
    allMessages[chatId] = [...messages, message];
    saveStored(STORAGE_KEYS.messages, allMessages);
    return allMessages[chatId];
  },

  getBookings: (): Booking[] => ensureStoredDefaults(STORAGE_KEYS.bookings, defaultBookings),
  addBooking: (booking: Booking) => {
    const bookings = mockState.getBookings();
    const next = [booking, ...bookings.filter((item) => item.id !== booking.id)];
    saveStored(STORAGE_KEYS.bookings, next);
    return next;
  },
  updateBookingStatus: (id: string, status: Booking['status']) => {
    const bookings = mockState.getBookings().map((booking) =>
      booking.id === id ? { ...booking, status, updatedAt: new Date().toISOString() } : booking
    );
    saveStored(STORAGE_KEYS.bookings, bookings);
    return bookings;
  },

  getChildren: (): Child[] => ensureStoredDefaults(STORAGE_KEYS.children, defaultChildren),
  addChild: (child: Child) => {
    const children = mockState.getChildren();
    const next = [child, ...children.filter((item) => item.id !== child.id)];
    saveStored(STORAGE_KEYS.children, next);
    return next;
  },
  updateChild: (childId: string, data: Partial<Child>) => {
    const children = mockState.getChildren().map((child) =>
      child.id === childId ? { ...child, ...data } : child
    );
    saveStored(STORAGE_KEYS.children, children);
    return children;
  },
};

type BuildBookingInput = Partial<Omit<Booking, 'specialistId'>> & {
  preferredDate?: string;
  PreferredDate?: string;
  preferredTime?: string;
  PreferredTime?: string;
  specialistId?: string | number;
  SpecialistId?: string | number;
  specialistType?: 'doctor' | 'therapist';
  SpecialistType?: 'doctor' | 'therapist';
  reason?: string;
  Reason?: string;
  notes?: string;
  Notes?: string;
  dateTime?: string;
  DateTime?: string;
};

export const buildMockBooking = (booking: BuildBookingInput): Booking => {
  const now = new Date();
  const preferredDate = booking.preferredDate || booking.PreferredDate || now.toISOString().split('T')[0];
  const preferredTime = booking.preferredTime || booking.PreferredTime || booking.dateTime?.slice(11, 16) || booking.DateTime?.slice(11, 16) || '10:00';
  const dateTime = booking.dateTime || booking.DateTime || `${preferredDate}T${preferredTime}`;

  return {
    id: booking.id ?? `mock-booking-${Date.now()}`,
    parentId: booking.parentId ?? 'user-123',
    childId: booking.childId ?? 'child-1',
    specialistId: booking.specialistId ?? 'specialist-1',
    specialistType: booking.specialistType ?? 'doctor',
    appointmentDate: preferredDate,
    appointmentTime: preferredTime,
    duration: booking.duration ?? 60,
    status: booking.status ?? 'pending',
    notes: booking.notes ?? booking.reason ?? 'Session request sent via AutiCare.',
    consultationNotes: booking.consultationNotes ?? booking.reason ?? 'Requested appointment',
    joinLink: booking.joinLink ?? '',
    specialistName: booking.specialistName ?? 'Assigned Specialist',
    dateTime,
    createdAt: booking.createdAt ?? new Date().toISOString(),
    updatedAt: booking.updatedAt ?? new Date().toISOString(),
  } as Booking;
};

export const createBookingNotification = (booking: Booking): Notification => ({
  id: `mock-notification-${Date.now()}`,
  userId: booking.parentId,
  type: 'booking',
  title: 'Your booking request is in progress',
  message: `A new session with ${booking.specialistName} has been requested for ${new Date(booking.dateTime ?? booking.appointmentDate).toLocaleDateString()} at ${booking.appointmentTime}.`,
  relatedId: booking.id,
  isRead: false,
  createdAt: new Date().toISOString(),
});
