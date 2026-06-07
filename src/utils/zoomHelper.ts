import apiClient from '../services/apiClient';
import type { Booking } from '../types';

export const cleanIntId = (idVal: any): number => {
  if (typeof idVal === 'number') return idVal;
  if (!idVal) return 1;
  const cleaned = String(idVal).replace(/\D/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
};

export const getOrCreateSessionMeetingLink = async (
  session: Booking,
  isDoctor: boolean
): Promise<string> => {
  const tId = session.treatmentId || (session as any).TreatmentId;
  const meetingId = cleanIntId(session.id);
  const fallbackLink = `https://zoom.us/j/${meetingId}`;

  // If there's no treatment plan ID, try to search for the child's active plan
  let finalTreatmentId = tId;
  if (!finalTreatmentId && session.childId) {
    try {
      const childIdNum = cleanIntId(session.childId);
      const plansRes = await apiClient.get<any[]>(`/treatment-plans/child/${childIdNum}`);
      const plans = Array.isArray(plansRes.data) ? plansRes.data : [];
      const activePlan = plans.find((p) => p.status === 'active') || plans[0];
      if (activePlan) {
        finalTreatmentId = activePlan.treatmentId || activePlan.id;
      }
    } catch (err) {
      console.warn('[ZOOM] Failed to fetch active treatment plan for child:', err);
    }
  }

  if (finalTreatmentId) {
    try {
      const treatmentIdNum = cleanIntId(finalTreatmentId);
      // Fetch sessions for this treatment plan
      const res = await apiClient.get<any[]>(`/sessions/treatment/${treatmentIdNum}`);
      const sessions = Array.isArray(res.data) ? res.data : [];
      
      // Look for a session with a valid meetingLink
      const matchedSession = sessions.find(
        (s) => s.meetingLink || s.joinLink
      );
      
      if (matchedSession) {
        const link = matchedSession.meetingLink || matchedSession.joinLink;
        if (link && link.trim() !== '') {
          console.log('[ZOOM] Found active backend session link:', link);
          return link;
        }
      }
      
      // If no session exists on the backend and current user is a Doctor/specialist, create one
      if (isDoctor) {
        try {
          console.log('[ZOOM] No active session found. Registering new session on backend...');
          const createRes = await apiClient.post('/sessions', {
            treatmentId: treatmentIdNum,
            parentId: cleanIntId(session.parentId),
            specialistId: cleanIntId(session.specialistId),
            sessionDate: new Date(session.appointmentDate || session.dateTime || Date.now()).toISOString(),
            duration: session.duration || 60,
            meetingLink: fallbackLink,
            sessionNotes: session.notes || session.reason || 'Session scheduled'
          });
          const newLink = createRes.data?.meetingLink || createRes.data?.joinLink;
          if (newLink) {
            console.log('[ZOOM] Backend session created successfully:', newLink);
            return newLink;
          }
        } catch (postErr) {
          console.warn('[ZOOM] Failed to create session on backend:', postErr);
        }
      }
    } catch (err) {
      console.warn('[ZOOM] Failed to fetch or create sessions:', err);
    }
  }

  // Fallback if no treatmentId or calls failed
  return session.joinLink || fallbackLink;
};
