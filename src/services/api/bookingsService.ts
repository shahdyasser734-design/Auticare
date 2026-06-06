import apiClient from '../apiClient';
import type { Booking } from '../../types';
import { mockState } from './mockState';

const mergeBookings = (backend: Booking[] = []) => {
  const local = mockState.getBookings();
  const uniqueLocal = local.filter((item) => !backend.some((backendBooking) => backendBooking.id === item.id));
  return [...backend, ...uniqueLocal].sort((a, b) => new Date(a.dateTime ?? a.createdAt).getTime() - new Date(b.dateTime ?? b.createdAt).getTime());
};

// Helper to create notification on booking status change
const triggerNotificationOnStatusChange = async (booking: Booking, status: Booking['status']) => {
  try {
    const specialistName = booking.specialistName || 'Your Doctor';
    let notificationMessage = '';
    
    if (status === 'confirmed' || status === 'approved') {
      notificationMessage = `Dr. ${specialistName} approved your booking request.`;
    } else if (status === 'cancelled') {
      notificationMessage = `Dr. ${specialistName} rejected your booking request.`;
    }
    
    if (notificationMessage && booking.parentId) {
      console.log(`[NOTIFICATION] Booking ${booking.id} status changed to ${status}`);
      console.log(`[NOTIFICATION] Message for parent ${booking.parentId}: ${notificationMessage}`);
      // Note: Backend should create and send notification
    }
  } catch (err) {
    console.warn('[NOTIFICATION] Failed to trigger notification:', err);
  }
};

export const bookingsService = {
  createBooking: async (
    data: Partial<Booking> & { preferredDate?: string; preferredTime?: string; specialistType?: 'doctor' | 'therapist'; specialistId?: string | number }
  ): Promise<Booking> => {
    try {
      console.log('[BOOKING] Creating booking with data:', data);
      const response = await apiClient.post<Booking>('/bookings', data);
      const booking = response.data;
      mockState.addBooking(booking);
      console.log('[BOOKING] Successfully created booking:', booking);
      return booking;
    } catch (err) {
      console.warn('[BOOKING] API booking creation failed, using mock:', err);
      const booking = mockState.getBookings().find((item) => item.id === data.id);
      if (booking) {
        console.log('[BOOKING] Found existing mock booking:', booking);
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
      console.log('[BOOKING] Created new mock booking:', newBooking);
      return newBooking;
    }
  },

  getBooking: async (id: string): Promise<Booking> => {
    try {
      const response = await apiClient.get<Booking>(`/bookings/${id}`);
      console.log('[BOOKING] Fetched booking:', response.data);
      return response.data;
    } catch {
      const booking = mockState.getBookings().find((item) => item.id === id);
      if (!booking) throw new Error('Booking not found');
      console.log('[BOOKING] Retrieved mock booking:', booking);
      return booking;
    }
  },

  getMyBookings: async (): Promise<Booking[]> => {
    try {
      console.log('[BOOKING] Fetching my bookings from API...');
      const response = await apiClient.get<Booking[]>('/bookings/my-bookings');
      console.log('[BOOKING] Fetched my bookings from API:', response.data.length, 'items');
      return mergeBookings(response.data);
    } catch (err) {
      console.warn('[BOOKING] Failed to fetch my bookings from API:', err);
      return mockState.getBookings();
    }
  },

  getUpcomingBookings: async (): Promise<Booking[]> => {
    try {
      console.log('[BOOKING] Fetching upcoming bookings from API...');
      const response = await apiClient.get<Booking[]>('/bookings/upcoming');
      console.log('[BOOKING] Fetched upcoming bookings from API:', response.data.length, 'items');
      return mergeBookings(response.data);
    } catch (err) {
      console.warn('[BOOKING] Failed to fetch upcoming bookings from API:', err);
      const mockBookings = mockState.getBookings().filter((booking) => booking.status !== 'cancelled');
      console.log('[BOOKING] Using mock bookings:', mockBookings.length, 'items');
      return mockBookings;
    }
  },

  updateBookingStatus: async (
    id: string,
    status: Booking['status']
  ): Promise<Booking> => {
    try {
      console.log(`[BOOKING] Updating booking ${id} status to ${status}`);
      const response = await apiClient.patch<Booking>(`/bookings/${id}/status`, { status });
      const booking = response.data;
      mockState.addBooking(booking);
      
      // Trigger notification for booking status changes
      await triggerNotificationOnStatusChange(booking, status);
      console.log('[BOOKING] Status updated successfully:', booking);
      return booking;
    } catch (err) {
      console.warn('[BOOKING] API status update failed, using mock:', err);
      const bookings = mockState.updateBookingStatus(id, status);
      const booking = bookings.find((item) => item.id === id);
      if (!booking) throw new Error('Booking not found', { cause: err });
      
      // Also trigger notification in mock mode
      await triggerNotificationOnStatusChange(booking, status);
      console.log('[BOOKING] Status updated in mock state:', booking);
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
