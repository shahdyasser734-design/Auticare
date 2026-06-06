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
}

const mergeBookings = (backend: Booking[] = []) => {
  const local = mockState.getBookings();
  const uniqueLocal = local.filter((item) => !backend.some((backendBooking) => backendBooking.id === item.id));
  return [...backend, ...uniqueLocal].sort((a, b) => (new Date(b.dateTime ?? b.createdAt).getTime() - new Date(a.dateTime ?? a.createdAt).getTime()));
};

export const bookingService = {
  createBooking: async (data: BookingRequest): Promise<Booking> => {
    try {
      const response = await apiClient.post<Booking>('/bookings', data);
      const booking = response.data;
      mockState.addBooking(booking);
      return booking;
    } catch {
      const booking = buildMockBooking(data);
      mockState.addBooking(booking);
      return booking;
    }
  },

  getBooking: async (id: string): Promise<Booking> => {
    try {
      const response = await apiClient.get<Booking>(`/bookings/${id}`);
      return response.data;
    } catch {
      const booking = mockState.getBookings().find((item) => item.id === id);
      if (!booking) throw new Error('Booking not found');
      return booking;
    }
  },

  updateBooking: async (id: string, data: Partial<Booking>): Promise<Booking> => {
    try {
      const response = await apiClient.put<Booking>(`/bookings/${id}`, data);
      const booking = response.data;
      mockState.addBooking(booking);
      return booking;
    } catch {
      const bookings = mockState.getBookings().map((item) =>
        item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item
      );
      const booking = bookings.find((item) => item.id === id);
      if (!booking) throw new Error('Booking not found');
      return booking;
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
      return mergeBookings(response.data);
    } catch {
      return mockState.getBookings();
    }
  },

  getUpcomingBookings: async (): Promise<Booking[]> => {
    try {
      const response = await apiClient.get<Booking[]>('/bookings/upcoming');
      return mergeBookings(response.data);
    } catch {
      return mockState.getBookings().filter((booking) => booking.status !== 'cancelled');
    }
  },

  updateBookingStatus: async (id: string, status: Booking['status']): Promise<Booking> => {
    try {
      const response = await apiClient.patch<Booking>(`/bookings/${id}/status`, { status });
      const booking = response.data;
      mockState.addBooking(booking);
      return booking;
    } catch {
      const bookings = mockState.updateBookingStatus(id, status);
      const booking = bookings.find((item) => item.id === id);
      if (!booking) throw new Error('Booking not found');
      return booking;
    }
  },
};
