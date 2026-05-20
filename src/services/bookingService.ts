import apiClient from './apiClient';
import type { Booking } from '../types';

export const bookingService = {
  getBookings: async (userId?: string): Promise<Booking[]> => {
    const params = userId ? { userId } : {};
    const response = await apiClient.get<Booking[]>('/bookings', { params });
    return response.data;
  },

  getBooking: async (bookingId: string): Promise<Booking> => {
    const response = await apiClient.get<Booking>(`/bookings/${bookingId}`);
    return response.data;
  },

  createBooking: async (
    specialistId: string,
    slotId: string,
    notes?: string
  ): Promise<Booking> => {
    const response = await apiClient.post<Booking>('/bookings', {
      specialistId,
      slotId,
      notes,
    });
    return response.data;
  },

  updateBooking: async (
    bookingId: string,
    data: Partial<Booking>
  ): Promise<Booking> => {
    const response = await apiClient.put<Booking>(`/bookings/${bookingId}`, data);
    return response.data;
  },

  cancelBooking: async (bookingId: string): Promise<void> => {
    await apiClient.delete(`/bookings/${bookingId}`);
  },
};
