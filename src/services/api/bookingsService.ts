import apiClient from '../apiClient';
import type { Booking } from '../../types';
import { normalizeBooking, type BookingRequest } from './bookings';

const capitalizeStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'approved': 'Confirmed',  // Map approved -> Confirmed (backend enum)
    'cancelled': 'Cancelled',
    'completed': 'Completed',
    'rejected': 'Rejected',
    'scheduled': 'Confirmed',
  };
  return statusMap[status.toLowerCase()] ?? (status.charAt(0).toUpperCase() + status.slice(1));
};

export const bookingsService = {
  createBooking: async (data: BookingRequest): Promise<Booking> => {
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
    const response = await apiClient.get<any>('/bookings/my-bookings');
    const list = Array.isArray(response.data) ? response.data : 
                 Array.isArray(response.data?.data) ? response.data.data : [];
    console.log('[BOOKING] Fetched my bookings from API:', list.length, 'items');
    return list.map(normalizeBooking).sort((a: Booking, b: Booking) => 
      new Date(b.dateTime ?? b.createdAt).getTime() - new Date(a.dateTime ?? a.createdAt).getTime()
    );
  },

  getUpcomingBookings: async (): Promise<Booking[]> => {
    console.log('[BOOKING] Fetching upcoming bookings from API...');
    const response = await apiClient.get<any>('/bookings/upcoming');
    const list = Array.isArray(response.data) ? response.data : 
                 Array.isArray(response.data?.data) ? response.data.data : [];
    console.log('[BOOKING] Fetched upcoming bookings from API:', list.length, 'items');
    return list.map(normalizeBooking).sort((a: Booking, b: Booking) => 
      new Date(b.dateTime ?? b.createdAt).getTime() - new Date(a.dateTime ?? a.createdAt).getTime()
    );
  },

  updateBookingStatus: async (id: string, status: Booking['status']): Promise<Booking> => {
    const backendStatus = capitalizeStatus(status as string);
    console.log(`[BOOKING] PATCH /bookings/${id}/status with:`, { status: backendStatus });
    // The backend UpdateBookingStatusRequest only accepts { status: string } — no extra fields
    const response = await apiClient.patch<Booking>(`/bookings/${id}/status`, { status: backendStatus });
    const booking = normalizeBooking(response.data);
    console.log('[BOOKING] Status updated successfully:', booking);
    return booking;
  },

  cancelBooking: async (id: string, _reason?: string): Promise<Booking> => {
    // No separate /cancel endpoint — use the status endpoint with 'Cancelled'
    console.log(`[BOOKING] Cancelling booking ${id}`);
    const response = await apiClient.patch<Booking>(`/bookings/${id}/status`, { status: 'Cancelled' });
    return normalizeBooking(response.data);
  },

  approveBooking: async (id: string): Promise<Booking> => {
    return bookingsService.updateBookingStatus(id, 'approved');
  },

  completeBooking: async (id: string): Promise<Booking> => {
    return bookingsService.updateBookingStatus(id, 'completed');
  },
};
