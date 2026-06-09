import apiClient from '../apiClient';
import type { Booking as BookingType } from '../../types';

export type Booking = BookingType;

export interface BookingRequest {
  specialistId: number;
  childId?: number;
  preferredDate?: string;
  preferredTime?: string;
  bookingDate?: string;
  bookingTime?: string;
  reason?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const normalizeBooking = (b: any): Booking => {
  if (!b) return b as unknown as Booking;
  const idVal = b.id || b.bookingId || b.BookingId || '';
  const idStr = String(idVal);
  const appointmentDate = String(b.appointmentDate || (b.bookingDate ? String(b.bookingDate).split('T')[0] : b.preferredDate || ''));
  const appointmentTime = String(b.appointmentTime || b.bookingTime || b.preferredTime || '');
  const dateTime = String(b.dateTime || b.bookingDate || `${appointmentDate}T${appointmentTime}`);
  // Keep the real status from backend — do NOT silently convert 'approved' to 'confirmed'
  let status = String(b.status || 'pending').toLowerCase();
  // Map backend casing variants to our lowercase enum values
  if (status === 'scheduled') status = 'confirmed';
  const joinLink = String(b.meetingLink || b.joinLink || b.meeting_link || b.join_link || '');
  // Use the real specialist name from the backend — never fall back to hardcoded names
  const specName = String(b.specialistName || b.SpecialistName || '');
  const specType = String(b.specialistType || b.SpecialistType || 'doctor');
  const treatmentId = b.treatmentId || b.TreatmentId || '';
  return {
    id: idStr,
    parentId: String(b.parentId || b.ParentId || ''),
    parentName: String(b.parentName || b.ParentName || ''),
    childId: String(b.childId || b.ChildId || ''),
    childName: String(b.childName || b.ChildName || ''),
    specialistId: String(b.specialistId || b.SpecialistId || ''),
    specialistName: specName,
    specialistType: specType as 'doctor' | 'therapist',
    status: status as Booking['status'],
    appointmentDate,
    appointmentTime,
    duration: Number(b.duration) || 60,
    notes: String(b.notes || b.reason || ''),
    consultationNotes: String(b.consultationNotes || ''),
    createdAt: String(b.createdAt || new Date().toISOString()),
    updatedAt: String(b.updatedAt || new Date().toISOString()),
    dateTime,
    joinLink,
    zoomUrl: joinLink,
    reason: String(b.reason || ''),
    // For display: build specialist display name from real data
    doctorName: specType === 'doctor' ? specName : '',
    therapistName: specType === 'therapist' ? specName : '',
    treatmentId: String(treatmentId),
    TreatmentId: String(treatmentId),
  };
};

export const bookingService = {
  createBooking: async (data: BookingRequest): Promise<Booking> => {
    const response = await apiClient.post<Booking>('/bookings', data);
    return normalizeBooking(response.data);
  },
  getBooking: async (id: string): Promise<Booking> => {
    const response = await apiClient.get<Booking>(`/bookings/${id}`);
    return normalizeBooking(response.data);
  },
  updateBooking: async (id: string, data: Partial<Booking>): Promise<Booking> => {
    const response = await apiClient.put<Booking>(`/bookings/${id}`, data);
    return normalizeBooking(response.data);
  },
  deleteBooking: async (id: string): Promise<void> => {
    await apiClient.delete(`/bookings/${id}`);
  },
  getMyBookings: async (): Promise<Booking[]> => {
    const response = await apiClient.get<Booking[]>('/bookings/my-bookings');
    return (response.data || [])
      .filter(Boolean)
      .map(normalizeBooking)
      .sort((a, b) => new Date(b.dateTime ?? b.createdAt).getTime() - new Date(a.dateTime ?? a.createdAt).getTime());
  },
  getUpcomingBookings: async (): Promise<Booking[]> => {
    const response = await apiClient.get<Booking[]>('/bookings/my-bookings');
    return (response.data || [])
      .filter(Boolean)
      .map(normalizeBooking)
      .filter(b => {
        const status = (b.status || '').toLowerCase();
        return status === 'pending' || status === 'approved' || status === 'confirmed';
      })
      .sort((a, b) => new Date(b.dateTime ?? b.createdAt).getTime() - new Date(a.dateTime ?? a.createdAt).getTime());
  },
  updateBookingStatus: async (id: string, status: Booking['status']): Promise<Booking> => {
    // The backend UpdateBookingStatusRequest only has { status: string }
    // It uses additionalProperties: false, so no extra fields allowed
    let backendStatus = status as string;
    if (backendStatus === 'confirmed') backendStatus = 'Confirmed';
    else if (backendStatus === 'cancelled') backendStatus = 'Cancelled';
    else if (backendStatus === 'pending') backendStatus = 'Pending';
    else if (backendStatus === 'completed') backendStatus = 'Completed';
    else if (backendStatus === 'rejected') backendStatus = 'Rejected';
    else if (backendStatus === 'approved') backendStatus = 'Confirmed'; // Map approved -> Confirmed
    else if (backendStatus && backendStatus.length > 0) {
      backendStatus = backendStatus.charAt(0).toUpperCase() + backendStatus.slice(1);
    }
    console.log(`[BOOKING] PATCH /bookings/${id}/status with:`, { status: backendStatus });
    const response = await apiClient.patch<Booking>(`/bookings/${id}/status`, { status: backendStatus });
    return normalizeBooking(response.data);
  },
  cancelBooking: async (id: string, _reason?: string): Promise<Booking> => {
    // Cancel uses the same status endpoint - no separate /cancel endpoint
    console.log(`[BOOKING] Cancelling booking ${id} via PATCH /bookings/${id}/status`);
    const response = await apiClient.patch<Booking>(`/bookings/${id}/status`, { status: 'Cancelled' });
    return normalizeBooking(response.data);
  },
};
