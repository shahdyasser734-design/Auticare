import apiClient from '../apiClient';
import type { Booking } from '../../types';
import { mockState } from './mockState';

const mergeBookings = (backend: Booking[] = []) => {
  const local = mockState.getBookings();
  const uniqueLocal = local.filter((item) => !backend.some((backendBooking) => backendBooking.id === item.id));
  return [...backend, ...uniqueLocal].sort((a, b) => new Date(a.dateTime ?? a.createdAt).getTime() - new Date(b.dateTime ?? b.createdAt).getTime());
};

export const bookingsService = {
  createBooking: async (
    data: Partial<Booking> & { preferredDate?: string; preferredTime?: string; specialistType?: 'doctor' | 'therapist'; specialistId?: string | number }
  ): Promise<Booking> => {
    try {
      const response = await apiClient.post<Booking>('/bookings', data);
      const booking = response.data;
      mockState.addBooking(booking);
      return booking;
    } catch {
      const booking = mockState.getBookings().find((item) => item.id === data.id);
      if (booking) {
        return booking;
      }
      const newBooking: Booking = {
        id: `mock-booking-${Date.now()}`,
        parentId: data.parentId ?? 'user-123',
        childId: data.childId ?? 'child-1',
        specialistId: String(data.specialistId ?? 'specialist-1'),
        specialistType: data.specialistType ?? 'doctor',
        status: 'pending',
        appointmentDate: data.preferredDate ?? new Date().toISOString().split('T')[0],
        appointmentTime: data.preferredTime ?? '10:00',
        duration: 60,
        notes: data.notes || data.reason || 'Session request pending.',
        dateTime: data.dateTime ?? `${data.preferredDate ?? new Date().toISOString().split('T')[0]}T${data.preferredTime ?? '10:00'}`,
        specialistName: 'Assigned Specialist',
        joinLink: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockState.addBooking(newBooking);
      return newBooking;
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

  updateBookingStatus: async (
    id: string,
    status: Booking['status']
  ): Promise<Booking> => {
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

  cancelBooking: async (id: string, reason?: string): Promise<Booking> => {
    try {
      const response = await apiClient.patch<Booking>(`/bookings/${id}/cancel`, { reason });
      const booking = response.data;
      mockState.addBooking(booking);
      return booking;
    } catch {
      const bookings = mockState.updateBookingStatus(id, 'cancelled');
      const booking = bookings.find((item) => item.id === id);
      if (!booking) throw new Error('Booking not found');
      return booking;
    }
  },

  approveBooking: async (id: string): Promise<Booking> => {
    return bookingsService.updateBookingStatus(id, 'approved');
  },

  completeBooking: async (id: string): Promise<Booking> => {
    return bookingsService.updateBookingStatus(id, 'completed');
  },
};
