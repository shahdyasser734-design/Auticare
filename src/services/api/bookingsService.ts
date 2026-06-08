import apiClient from '../apiClient';
import type { Booking } from '../../types';
import { normalizeBooking } from './bookings';

export const bookingsService = {
  createBooking: async (
    data: Partial<Booking> & { preferredDate?: string; preferredTime?: string; specialistType?: 'doctor' | 'therapist'; specialistId?: string | number }
  ): Promise<Booking> => {
    console.log('[BOOKING] Creating booking with data:', data);
    const response = await apiClient.post<Booking>('/bookings', data);
    const booking = normalizeBooking(response.data);
    console.log('[BOOKING] Successfully created booking:', booking);
    return booking;
  },

  getBooking: async (id: string): Promise<Booking> => {
    const response = await apiClient.get<Booking>(`/bookings/${id}`);
    console.log('[BOOKING] Fetched booking:', response.data);
    return normalizeBooking(response.data);
  },

  getMyBookings: async (): Promise<Booking[]> => {
    console.log('[BOOKING] Fetching my bookings from API...');
    const response = await apiClient.get<Booking[]>('/bookings/my-bookings');
    console.log('[BOOKING] Fetched my bookings from API:', response.data.length, 'items');
    return response.data.map(normalizeBooking).sort((a, b) => new Date(b.dateTime ?? b.createdAt).getTime() - new Date(a.dateTime ?? a.createdAt).getTime());
  },

  getUpcomingBookings: async (): Promise<Booking[]> => {
    console.log('[BOOKING] Fetching upcoming bookings from API...');
    const response = await apiClient.get<Booking[]>('/bookings/upcoming');
    console.log('[BOOKING] Fetched upcoming bookings from API:', response.data.length, 'items');
    return response.data.map(normalizeBooking).sort((a, b) => new Date(b.dateTime ?? b.createdAt).getTime() - new Date(a.dateTime ?? a.createdAt).getTime());
  },

  updateBookingStatus: async (
    id: string,
    status: Booking['status']
  ): Promise<Booking> => {
    console.log(`[BOOKING] Updating booking ${id} status to ${status}`);
    const response = await apiClient.patch<Booking>(`/bookings/${id}/status`, { status });
    const booking = normalizeBooking(response.data);
    console.log('[BOOKING] Status updated successfully:', booking);
    return booking;
  },

  cancelBooking: async (id: string, reason?: string): Promise<Booking> => {
    const response = await apiClient.patch<Booking>(`/bookings/${id}/cancel`, { reason });
    return normalizeBooking(response.data);
  },

  approveBooking: async (id: string): Promise<Booking> => {
    return bookingsService.updateBookingStatus(id, 'approved');
  },

  completeBooking: async (id: string): Promise<Booking> => {
    return bookingsService.updateBookingStatus(id, 'completed');
  },
};
