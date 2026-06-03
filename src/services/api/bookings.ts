import apiClient from '../apiClient';

export interface BookingRequest {
  specialistId: string;
  childId?: string;
  dateTime?: string;
  request?: string;
  reason?: string;
  notes?: string;
}

export interface Booking {
  id: string;
  userId: string;
  specialistId: string;
  childId?: string;
  dateTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending' | 'confirmed';
  reason?: string;
  notes?: string;
  joinLink?: string;
  specialistName?: string;
  createdAt: string;
  updatedAt?: string;
}

export const bookingService = {
  createBooking: async (data: BookingRequest): Promise<Booking> => {
    // Try sending data flat at root level instead of wrapped in { request: data }
    const response = await apiClient.post<Booking>('/bookings', data);
    return response.data;
  },

  getBooking: async (id: string): Promise<Booking> => {
    const response = await apiClient.get<Booking>(`/bookings/${id}`);
    return response.data;
  },

  updateBooking: async (id: string, data: Partial<BookingRequest>): Promise<Booking> => {
    const response = await apiClient.put<Booking>(`/bookings/${id}`, data);
    return response.data;
  },

  deleteBooking: async (id: string): Promise<void> => {
    await apiClient.delete(`/bookings/${id}`);
  },

  getMyBookings: async (): Promise<Booking[]> => {
    const response = await apiClient.get<Booking[]>('/bookings/my-bookings');
    return response.data;
  },

  getUpcomingBookings: async (): Promise<Booking[]> => {
    const response = await apiClient.get<Booking[]>('/bookings/upcoming');
    return response.data;
  },

  updateBookingStatus: async (id: string, status: string): Promise<Booking> => {
    const response = await apiClient.patch<Booking>(`/bookings/${id}/status`, { status });
    return response.data;
  },
};
