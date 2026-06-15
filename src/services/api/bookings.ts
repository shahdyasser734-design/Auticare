import apiClient from '../apiClient';
import type { Booking as BookingType } from '../../types';
import { localNotificationManager } from './localNotificationManager';

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

const dedupeBookings = (bookings: Booking[]): Booking[] => {
  const map = new Map<string, Booking>();
  
  const getRank = (s: string) => {
    const lower = (s || '').toLowerCase();
    if (lower === 'completed') return 5;
    if (lower === 'confirmed' || lower === 'scheduled') return 4;
    if (lower === 'approved') return 3;
    if (lower === 'pending') return 2;
    return 1;
  };

  bookings.forEach(b => {
    // Dedupe by ID if present, otherwise fallback to composite key of session attributes
    const idKey = b.id ? `id-${b.id}` : null;
    const compositeKey = `comp-${b.childId}-${b.specialistId}-${b.appointmentDate}-${b.appointmentTime}`;
    
    // Check if we already have this booking stored via either key
    const existing = (idKey && map.get(idKey)) || map.get(compositeKey);

    if (!existing) {
      if (idKey) map.set(idKey, b);
      map.set(compositeKey, b);
    } else {
      // If we have duplicates, keep the one with the most advanced status
      if (getRank(b.status) > getRank(existing.status)) {
        if (idKey) map.set(idKey, b);
        map.set(compositeKey, b);
      }
    }
  });
  
  // Extract unique bookings from map values
  const uniqueBookings = Array.from(new Set(map.values()));
  return uniqueBookings;
};

const applyAutoCompletion = (bookings: Booking[]): Booking[] => {
  const now = new Date();
  
  return bookings.map(b => {
    const status = (b.status || '').toLowerCase();
    // Only process sessions that haven't already reached a terminal state
    if (status === 'cancelled' || status === 'completed' || status === 'rejected') {
      return b;
    }

    let sessionTimeStr = b.dateTime;
    if (!sessionTimeStr && b.appointmentDate) {
      sessionTimeStr = `${b.appointmentDate}T${b.appointmentTime || '00:00:00'}`;
    }
    
    if (sessionTimeStr) {
      const sessionDate = new Date(sessionTimeStr);
      if (!isNaN(sessionDate.getTime())) {
        const diffMs = now.getTime() - sessionDate.getTime();
        const diffMinutes = diffMs / (1000 * 60);
        
        // If 5 minutes have passed since the scheduled time, trigger auto-complete
        if (diffMinutes >= 5) {
          console.log(`[AUTO-COMPLETE] Marking session ${b.id} as completed (diff: ${diffMinutes.toFixed(1)} mins)`);
          
          // Fire-and-forget background patch to synchronize backend state
          apiClient.patch(`/bookings/${b.id}/status`, { status: 'Completed' })
            .catch(err => console.warn(`[AUTO-COMPLETE] Failed to patch booking ${b.id}:`, err));
            
          // Update in-memory for immediate UI accuracy
          return { ...b, status: 'completed' as Booking['status'] };
        }
      }
    }
    return b;
  });
};

export const bookingService = {
  createBooking: async (data: BookingRequest): Promise<Booking> => {
    const response = await apiClient.post<Booking>('/bookings', data);
    const normalized = normalizeBooking(response.data);
    
    // Emit event-driven notifications based on session creation
    if (normalized.specialistId) {
      const isDoctor = normalized.specialistType === 'doctor';
      localNotificationManager.emitNotification(
        normalized.specialistId,
        'booking',
        'New Session Request',
        isDoctor 
          ? `New clinical session request for patient ${normalized.childName || 'unknown'}. Please review clinical availability.`
          : `New therapy session requested for ${normalized.childName || 'unknown'}. Please check your therapy schedule.`,
        normalized.id
      );
    }
    if (normalized.parentId) {
      localNotificationManager.emitNotification(
        normalized.parentId,
        'booking',
        'Session Requested',
        `Your session request with ${normalized.specialistName || 'the specialist'} has been submitted successfully.`,
        normalized.id
      );
    }

    return normalized;
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
    const rawBookings = (response.data || []).filter(Boolean).map(normalizeBooking);
    const autoCompleted = applyAutoCompletion(rawBookings);
    return dedupeBookings(autoCompleted).sort((a, b) => new Date(b.dateTime ?? b.createdAt).getTime() - new Date(a.dateTime ?? a.createdAt).getTime());
  },
  getUpcomingBookings: async (): Promise<Booking[]> => {
    const response = await apiClient.get<Booking[]>('/bookings/my-bookings');
    const rawBookings = (response.data || [])
      .filter(Boolean)
      .map(normalizeBooking);
      
    const autoCompleted = applyAutoCompletion(rawBookings)
      .filter(b => {
        const status = (b.status || '').toLowerCase();
        return status === 'pending' || status === 'approved' || status === 'confirmed';
      });
      
    return dedupeBookings(autoCompleted).sort((a, b) => new Date(b.dateTime ?? b.createdAt).getTime() - new Date(a.dateTime ?? a.createdAt).getTime());
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
    const normalized = normalizeBooking(response.data);

    // Emit notifications based on status updates
    if (normalized.parentId) {
      const lowerStatus = (normalized.status || '').toLowerCase();
      if (lowerStatus === 'confirmed' || lowerStatus === 'approved') {
        localNotificationManager.emitNotification(
          normalized.parentId,
          'session',
          'Session Approved',
          `Your session request with ${normalized.specialistName} has been approved.`,
          normalized.id
        );
      } else if (lowerStatus === 'cancelled' || lowerStatus === 'rejected') {
        localNotificationManager.emitNotification(
          normalized.parentId,
          'session',
          'Session Cancelled',
          `Your session request with ${normalized.specialistName} has been cancelled/rejected.`,
          normalized.id
        );
      } else if (lowerStatus === 'completed') {
        localNotificationManager.emitNotification(
          normalized.parentId,
          'session',
          'Session Completed',
          `Your session with ${normalized.specialistName} has been marked as completed.`,
          normalized.id
        );
      }
    }

    if (normalized.specialistId) {
      const isDoctor = normalized.specialistType === 'doctor';
      const lowerStatus = (normalized.status || '').toLowerCase();
      if (lowerStatus === 'confirmed' || lowerStatus === 'approved') {
        localNotificationManager.emitNotification(
          normalized.specialistId,
          'session',
          'Session Confirmed',
          isDoctor
            ? `Clinical session with patient ${normalized.childName} confirmed. Ensure medical history is reviewed.`
            : `Therapy session with ${normalized.childName} confirmed. Prepare activity goals.`,
          normalized.id
        );
      } else if (lowerStatus === 'cancelled' || lowerStatus === 'rejected') {
        localNotificationManager.emitNotification(
          normalized.specialistId,
          'session',
          'Session Cancelled',
          isDoctor
            ? `Clinical session with patient ${normalized.childName} has been cancelled. Update patient records.`
            : `Therapy session with ${normalized.childName} has been cancelled. Adjust schedule.`,
          normalized.id
        );
      } else if (lowerStatus === 'completed') {
        localNotificationManager.emitNotification(
          normalized.specialistId,
          'session',
          'Session Completed',
          isDoctor
            ? `Clinical session with patient ${normalized.childName} complete. Please finalize clinical notes.`
            : `Therapy session with ${normalized.childName} complete. Log session progress.`,
          normalized.id
        );
      }
    }

    return normalized;
  },
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  cancelBooking: async (id: string, _reason?: string): Promise<Booking> => {
    // Cancel uses the same status endpoint - no separate /cancel endpoint
    console.log(`[BOOKING] Cancelling booking ${id} via PATCH /bookings/${id}/status`);
    const response = await apiClient.patch<Booking>(`/bookings/${id}/status`, { status: 'Cancelled' });
    const normalized = normalizeBooking(response.data);

    if (normalized.parentId) {
      localNotificationManager.emitNotification(
        normalized.parentId,
        'session',
        'Session Cancelled',
        `Your session request with ${normalized.specialistName} has been cancelled.`,
        normalized.id
      );
    }
    if (normalized.specialistId) {
      const isDoctor = normalized.specialistType === 'doctor';
      localNotificationManager.emitNotification(
        normalized.specialistId,
        'session',
        'Session Cancelled',
        isDoctor
          ? `Clinical session with patient ${normalized.childName} has been cancelled. Update patient records.`
          : `Therapy session with ${normalized.childName} has been cancelled. Adjust schedule.`,
        normalized.id
      );
    }

    return normalized;
  },
};
