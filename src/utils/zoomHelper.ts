import apiClient from '../services/apiClient';
import type { Booking } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // 1. If zoomLink or joinLink exists directly on the booking session -> return it directly
  if (session.zoomUrl && session.zoomUrl.trim() !== '') {
    return session.zoomUrl;
  }
  if (session.joinLink && session.joinLink.trim() !== '') {
    return session.joinLink;
  }
 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session as any).meetingLink && (session as any).meetingLink.trim() !== '') {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (session as any).meetingLink;
  }

  // 2. If NOT -> attempt to get or create from Treatment Sessions API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalTreatmentId = session.treatmentId || (session as any).TreatmentId;

  if (!finalTreatmentId && session.childId) {
    try {
      const childIdNum = cleanIntId(session.childId);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await apiClient.get<any[]>(`/sessions/treatment/${treatmentIdNum}`);
      const sessions = Array.isArray(res.data) ? res.data : [];
      
      const matchedSession = sessions.find((s) => s.meetingLink || s.joinLink || s.zoomUrl);
      
      if (matchedSession) {
        const link = matchedSession.meetingLink || matchedSession.joinLink || matchedSession.zoomUrl;
        if (link && link.trim() !== '') {
          console.log('[ZOOM] Found active backend session link:', link);
          return link;
        }
      }
      
      // Generate/create then open
      if (isDoctor) {
        try {
          console.log('[ZOOM] No active session found. Registering new session on backend...');
          const createRes = await apiClient.post('/sessions', {
            treatmentId: treatmentIdNum,
            parentId: cleanIntId(session.parentId),
            specialistId: cleanIntId(session.specialistId),
            sessionDate: new Date(session.appointmentDate || session.dateTime || Date.now()).toISOString(),
            duration: session.duration || 60,
            sessionNotes: session.notes || session.reason || 'Session scheduled'
          });
          const newLink = createRes.data?.meetingLink || createRes.data?.joinLink || createRes.data?.zoomUrl;
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

  // 3. If still missing -> show error
  throw new Error('No Zoom meeting link available.');
};

export const formatZoomLink = (link?: string | null): string => {
  if (!link) return '';
  const clean = link.trim();
  if (!clean) return '';
  if (/^[\d\s-]+$/.test(clean)) return 'https://zoom.us/j/' + clean.replace(/[\s-]/g, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    if (clean.includes('zoom.us')) return 'https://' + clean;
    return 'https://zoom.us/j/' + clean;
  }
  return clean;
};