import apiClient from '../apiClient';
import type { Booking as BookingType } from '../../types';

export type Booking = BookingType;

export interface BookingRequest {
  specialistId: number;
  childId?: number;
  bookingDate: string;
  bookingTime?: string;
  reason?: string;
}

export const normalizeBooking = (b: any): Booking => {
  if (!b) return b;
  const idVal = b.id || b.bookingId || b.BookingId || '';
  const idStr = String(idVal);
  const appointmentDate = b.appointmentDate || (b.bookingDate ? b.bookingDate.split('T')[0] : b.preferredDate || '');
  const appointmentTime = b.appointmentTime || b.bookingTime || b.preferredTime || '';
  const dateTime = b.dateTime || b.bookingDate || `${appointmentDate}T${appointmentTime}`;
  let status = b.status || 'pending';
  if (typeof status === 'string') status = status.toLowerCase();
  if (status === 'approved') status = 'confirmed'; 
  const joinLink = b.meetingLink || b.joinLink || b.meeting_link || b.join_link || '';
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
    zoomUrl: joinLink,
    reason: b.reason || '',
    doctorName,
    therapistName,
    treatmentId,
    TreatmentId: treatmentId,
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
    const response = await apiClient.get<Booking[]>('/bookings/upcoming');
    return (response.data || [])
      .filter(Boolean)
      .map(normalizeBooking)
      .sort((a, b) => new Date(b.dateTime ?? b.createdAt).getTime() - new Date(a.dateTime ?? a.createdAt).getTime());
  },
  updateBookingStatus: async (id: string, status: Booking['status']): Promise<Booking> => {
    let backendStatus = status as string;
    if (backendStatus === 'confirmed') backendStatus = 'Confirmed';
    else if (backendStatus === 'cancelled') backendStatus = 'Cancelled';
    else if (backendStatus === 'pending') backendStatus = 'Pending';
    else if (backendStatus === 'completed') backendStatus = 'Completed';
    else if (backendStatus === 'rejected') backendStatus = 'Rejected';
    else if (backendStatus && backendStatus.length > 0) {
      backendStatus = backendStatus.charAt(0).toUpperCase() + backendStatus.slice(1);
    }
    const response = await apiClient.patch<Booking>(`/bookings/${id}/status`, { status: backendStatus });
    return normalizeBooking(response.data);
  },
  cancelBooking: async (id: string, reason: string, cancelledBy: 'doctor' | 'parent' | 'therapist'): Promise<Booking> => {
    // Send cancellation reason and who cancelled it, as well as setting status to Cancelled
    const response = await apiClient.patch<Booking>(`/bookings/${id}/status`, { 
      status: 'Cancelled',
      cancellationReason: reason,
      cancelledBy: cancelledBy
    });
    return normalizeBooking(response.data);
  },
};
