import apiClient from '../apiClient';
import type { Booking as BookingType } from '../../types';
import { mockState, buildMockBooking } from './mockState';

export type Booking = BookingType;

export interface BookingRequest {
  parentId?: string;
  specialistId?: string | number;
  specialistType?: 'doctor' | 'therapist';
  childId?: string;
  preferredDate?: string;
  preferredTime?: string;
  dateTime?: string;
  reason?: string;
  request?: string;
  notes?: string;
  specialistName?: string;
  SpecialistName?: string;
  SpecialistId?: string | number;
  SpecialistType?: 'doctor' | 'therapist';
  ChildId?: string;
  PreferredDate?: string;
  PreferredTime?: string;
  DateTime?: string;
  Reason?: string;
  Request?: string;
  Notes?: string;
  treatmentId?: string | number;
  TreatmentId?: string | number;
}

export const normalizeBooking = (b: any): Booking => {
  if (!b) return b;
  
  const idVal = b.id || b.bookingId || b.BookingId || '';
  const idStr = String(idVal);
  
  // Normalize date and time
  const appointmentDate = b.appointmentDate || (b.bookingDate ? b.bookingDate.split('T')[0] : b.preferredDate || '');
  const appointmentTime = b.appointmentTime || b.bookingTime || b.preferredTime || '';
  const dateTime = b.dateTime || b.bookingDate || `${appointmentDate}T${appointmentTime}`;
  
  // Status mapping: convert status to lowercase for frontend logic
  let status = b.status || 'pending';
  if (typeof status === 'string') {
    status = status.toLowerCase();
  }
  if (status === 'approved') {
    status = 'confirmed'; // Standardize approved to confirmed as expected by some components
  }
  
  // Generate deterministic unique Zoom meeting URL so all participants use the same URL, unless already provided by backend
  const joinLink = b.meetingLink || b.joinLink || b.meeting_link || b.join_link || (idStr ? `https://zoom.us/j/${idStr}` : '');

  // Handle names
  const specName = b.specialistName || b.SpecialistName || '';
  const specType = b.specialistType || b.SpecialistType || 'doctor';
  
  let doctorName = 'Dr. Ahmed';
  let therapistName = 'Therapist Sarah';
  
  if (specType === 'doctor') {
    doctorName = specName ? `Dr. ${specName.replace(/^Dr\.\s+/i, '')}` : 'Dr. Ahmed';
  } else if (specType === 'therapist') {
    therapistName = specName ? `Therapist ${specName.replace(/^Therapist\s+/i, '')}` : 'Therapist Sarah';
  }

  const treatmentId = b.treatmentId || b.TreatmentId || '';

  return {
    id: idStr,
    parentId: String(b.parentId || b.ParentId || ''),
    parentName: b.parentName || b.ParentName || 'Sarah Johnson',
    childId: String(b.childId || b.ChildId || ''),
    childName: b.childName || b.ChildName || 'Emma Johnson',
    specialistId: String(b.specialistId || b.SpecialistId || ''),
    specialistName: specName,
    specialistType: specType,
    status: status as any,
    appointmentDate,
    appointmentTime,
    duration: b.duration || 60,
    notes: b.notes || b.reason || '',
    consultationNotes: b.consultationNotes || '',
    createdAt: b.createdAt || new Date().toISOString(),
    updatedAt: b.updatedAt || new Date().toISOString(),
    dateTime,
    joinLink,
    reason: b.reason || '',
    doctorName,
    therapistName,
    treatmentId,
    TreatmentId: treatmentId,
  };
};

const mergeBookings = (backend: Booking[] = []) => {
  const local = mockState.getBookings().map(normalizeBooking);
  const uniqueLocal = local.filter((item) => !backend.some((backendBooking) => backendBooking.id === item.id));
  return [...backend, ...uniqueLocal].sort((a, b) => (new Date(b.dateTime ?? b.createdAt).getTime() - new Date(a.dateTime ?? a.createdAt).getTime()));
};

export const bookingService = {
  createBooking: async (data: BookingRequest): Promise<Booking> => {
    try {
      const response = await apiClient.post<Booking>('/bookings', data);
      const booking = normalizeBooking(response.data);
      mockState.addBooking(booking);
      return booking;
    } catch (err) {
      console.warn('[BOOKING] API createBooking failed, using fallback:', err);
      const booking = normalizeBooking(buildMockBooking(data));
      mockState.addBooking(booking);
      return booking;
    }
  },

  getBooking: async (id: string): Promise<Booking> => {
    try {
      const response = await apiClient.get<Booking>(`/bookings/${id}`);
      return normalizeBooking(response.data);
    } catch {
      const booking = mockState.getBookings().find((item) => item.id === id);
      if (!booking) throw new Error('Booking not found');
      return normalizeBooking(booking);
    }
  },

  updateBooking: async (id: string, data: Partial<Booking>): Promise<Booking> => {
    try {
      const response = await apiClient.put<Booking>(`/bookings/${id}`, data);
      const booking = normalizeBooking(response.data);
      mockState.addBooking(booking);
      return booking;
    } catch {
      const bookings = mockState.getBookings().map((item) =>
        item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item
      );
      const booking = bookings.find((item) => item.id === id);
      if (!booking) throw new Error('Booking not found');
      return normalizeBooking(booking);
    }
  },

  deleteBooking: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/bookings/${id}`);
    } catch {
      // no-op in mock mode
    }
  },

  getMyBookings: async (): Promise<Booking[]> => {
    try {
      const response = await apiClient.get<Booking[]>('/bookings/my-bookings');
      return mergeBookings(response.data.map(normalizeBooking));
    } catch {
      return mockState.getBookings().map(normalizeBooking);
    }
  },

  getUpcomingBookings: async (): Promise<Booking[]> => {
    try {
      const response = await apiClient.get<Booking[]>('/bookings/upcoming');
      return mergeBookings(response.data.map(normalizeBooking));
    } catch {
      return mockState.getBookings().map(normalizeBooking).filter((booking) => booking.status !== 'cancelled');
    }
  },

  updateBookingStatus: async (id: string, status: Booking['status']): Promise<Booking> => {
    try {
      const response = await apiClient.patch<Booking>(`/bookings/${id}/status`, { status });
      const booking = normalizeBooking(response.data);
      mockState.addBooking(booking);
      return booking;
    } catch {
      const bookings = mockState.updateBookingStatus(id, status);
      const booking = bookings.find((item) => item.id === id);
      if (!booking) throw new Error('Booking not found');
      return normalizeBooking(booking);
    }
  },
};
