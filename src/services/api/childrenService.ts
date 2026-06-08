import apiClient from '../apiClient';
import type { Child } from '../../types';

const normalizeChild = (raw: any): Child => {
  const id = String(raw.id ?? raw._id ?? raw.childId ?? raw.child_id ?? '');
  const firstName = raw.firstName || '';
  const lastName = raw.lastName || '';
  const fullName = raw.name || (firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || 'Unknown');
  // Calculate age from DOB if direct age is missing
  let age = (raw.age ?? raw.ageInYears ?? raw.childAge ?? null) as number | null;
  if (!age && (raw.dateOfBirth ?? raw.date_of_birth ?? raw.dob)) {
    const dob = new Date(raw.dateOfBirth ?? raw.date_of_birth ?? raw.dob);
    if (!isNaN(dob.getTime())) {
      const now = new Date();
      age = now.getFullYear() - dob.getFullYear() -
        (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
    }
  }
  const genderRaw = (raw.gender ?? raw.sex ?? '') as string;
  const gender = genderRaw && genderRaw.toLowerCase() !== 'unknown' ? genderRaw : '';
  return {
    id,
    parentId: String(raw.parentId ?? raw.parent_id ?? raw.parent ?? ''),
    name: fullName,
    age: age as number,
    gender,
    dateOfBirth: (raw.dateOfBirth ?? raw.date_of_birth ?? raw.dob ?? '') as string,
    profileImage: (raw.profileImage ?? raw.profile_image ?? raw.profile_image_url ?? '') as string,
    medicalHistory: (raw.medicalHistory ?? raw.medical_history ?? '') as string,
    familyAutismHistory: (raw.familyAutismHistory ?? raw.family_autism_history ?? false) as boolean,
    jaundiceHistory: (raw.jaundiceHistory ?? raw.jaundice_history ?? false) as boolean,
    notes: (raw.notes ?? '') as string,
    createdAt: (raw.createdAt ?? raw.created_at ?? new Date().toISOString()) as string,
  };
};

export const childrenService = {
  // Create a new child profile
  createChild: async (data: Partial<Child>): Promise<Child> => {
    const response = await apiClient.post<any>('/children', data);
    const raw = response.data?.data ?? response.data;
    const child = normalizeChild(raw);
    // Persist the latest created child to localStorage
    if (child.id) {
      localStorage.setItem('latestChildId', child.id);
      localStorage.setItem('latestChildName', child.name);
    }
    return child;
  },

  // Get specific child by ID
  getChild: async (id: string): Promise<Child> => {
    const response = await apiClient.get<any>(`/children/${id}`);
    const raw = response.data?.data ?? response.data;
    return normalizeChild(raw);
  },

  // Get all children for current parent
  // The API has GET /api/children which is the main endpoint
  getMyChildren: async (): Promise<Child[]> => {
    try {
      const response = await apiClient.get<any>('/children');
      const data = response.data?.data ?? response.data;
      const list = Array.isArray(data) ? data : [];
      const children = list.map(normalizeChild);
      // Persist first child ID if we got results
      if (children.length > 0 && children[0].id) {
        localStorage.setItem('latestChildId', children[0].id);
        localStorage.setItem('latestChildName', children[0].name);
      }
      return children;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        console.warn('[CHILDREN] GET /api/children returned 403. Trying fallback from localStorage.');
      } else {
        console.warn('[CHILDREN] Failed to fetch children:', error?.message || error);
      }
      // Fallback: try to get child by latestChildId stored in localStorage
      let latestId = localStorage.getItem('latestChildId');
      
      // If no child in localStorage, check bookings
      if (!latestId) {
        try {
          const bookingsRes = await apiClient.get<any>('/bookings/my-bookings');
          const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : (bookingsRes.data?.data || []);
          const childIds = bookings.map((b: any) => b.childId || b.child_id).filter(Boolean);
          if (childIds.length > 0) {
            latestId = String(childIds[0]);
            localStorage.setItem('latestChildId', latestId);
            const names = bookings.map((b: any) => b.childName || b.child_name).filter(Boolean);
            if (names.length > 0) {
              localStorage.setItem('latestChildName', names[0]);
            }
          }
        } catch (bookingErr) {
          console.warn('[CHILDREN] Bookings fallback failed:', bookingErr);
        }
      }

      if (latestId) {
        try {
          const child = await childrenService.getChild(latestId);
          return [child];
        } catch {
          // If even the specific child fetch fails, return empty but fake child
          const latestName = localStorage.getItem('latestChildName') || 'My Child';
          return [{
            id: latestId,
            name: latestName,
            parentId: '',
            age: 0,
            gender: 'Unknown',
            dateOfBirth: '',
            profileImage: '',
            medicalHistory: '',
            familyAutismHistory: false,
            jaundiceHistory: false,
            notes: '',
            createdAt: new Date().toISOString(),
          }];
        }
      }
      return [];
    }
  },

  // Update child profile
  updateChild: async (id: string, data: Partial<Child>): Promise<Child> => {
    const response = await apiClient.put<any>(`/children/${id}`, data);
    const raw = response.data?.data ?? response.data;
    return normalizeChild(raw);
  },

  // Delete child profile
  deleteChild: async (id: string): Promise<void> => {
    await apiClient.delete(`/children/${id}`);
  },
};
