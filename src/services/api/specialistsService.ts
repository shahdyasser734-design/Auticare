import apiClient from '../apiClient';
import type { Specialist } from '../../types';

interface RawSpecialist {
  id?: unknown;
  specialistId?: unknown;
  type?: unknown;
  name?: unknown;
  specialization?: unknown;
  yearsOfExperience?: unknown;
  yearsExperience?: unknown;
  rating?: unknown;
  reviewCount?: unknown;
  reviews?: unknown;
  availableSlots?: unknown;
  profileImage?: unknown;
  licenseNumber?: unknown;
  certifications?: unknown;
  email?: unknown;
  bio?: unknown;
  about?: unknown;
  role?: unknown;
}

export const normalizeSpecialist = (raw: Record<string, unknown>): Specialist => {
  const r = raw as RawSpecialist;
  const specId = String(r.id ?? r.specialistId ?? '');
  
  // Determine type based on explicit backend 'role' or 'type', otherwise fallback to specialization/title
  let calculatedType: 'doctor' | 'therapist' = 'doctor';
  
  if (r.role === 'therapist' || r.type === 'therapist') {
    calculatedType = 'therapist';
  } else if (r.role === 'doctor' || r.type === 'doctor') {
    calculatedType = 'doctor';
  } else {
    const specialization = String(r.specialization ?? '').toLowerCase();
    if (
      specialization.includes('therapist') || 
      specialization.includes('therapy') ||
      specialization.includes('speech') ||
      specialization.includes('aba') ||
      specialization.includes('sensory') ||
      specialization.includes('occupational')
    ) {
      calculatedType = 'therapist';
    }
  }

  const typeValue = calculatedType;

  return {
    id: specId,
    name: String(r.name ?? ''),
    type: typeValue,
    specialization: String(r.specialization ?? ''),
    yearsOfExperience: Number(r.yearsOfExperience ?? r.yearsExperience ?? 0),
    rating: Number(r.rating ?? 0),
    reviewCount: Number(r.reviewCount ?? r.reviews ?? 0),
    availableSlots: Array.isArray(r.availableSlots) ? r.availableSlots : [],
    profileImage: String(r.profileImage ?? ''),
    licenseNumber: String(r.licenseNumber ?? ''),
    certifications: Array.isArray(r.certifications) ? r.certifications : [],
    email: String(r.email ?? ''),
    bio: String(r.bio ?? r.about ?? ''),
  };
};

export const specialistsService = {
  // Get all specialists (with optional type filter)
  getSpecialists: async (type?: 'doctor' | 'therapist'): Promise<Specialist[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('PageSize', '100');
    if (type) {
      queryParams.append('type', type);
    }
    const response = await apiClient.get<unknown>(`/specialists?${queryParams.toString()}`);
    const data = response.data;
    const list = Array.isArray(data) ? data : 
                 Array.isArray((data as Record<string, unknown>)?.data) ? ((data as Record<string, unknown>).data as Record<string, unknown>[]) : 
                 Array.isArray((data as Record<string, unknown>)?.specialists) ? ((data as Record<string, unknown>).specialists as Record<string, unknown>[]) : [];
    const allSpecs = list.map(normalizeSpecialist);
    
    if (type) {
      return allSpecs.filter((s) => s.type === type);
    }
    return allSpecs;
  },

  // Get specific specialist details
  getSpecialist: async (id: string): Promise<Specialist> => {
    const response = await apiClient.get<Record<string, unknown>>(`/specialists/${id}`);
    const rawData = (response.data as Record<string, unknown>)?.data ?? response.data;
    return normalizeSpecialist((rawData || {}) as Record<string, unknown>);
  },

  // Get doctors only
  getDoctors: async (): Promise<Specialist[]> => {
    return specialistsService.getSpecialists('doctor');
  },

  // Get therapists only
  getTherapists: async (): Promise<Specialist[]> => {
    return specialistsService.getSpecialists('therapist');
  },

  // Search specialists
  searchSpecialists: async (
    query: string,
    type?: 'doctor' | 'therapist'
  ): Promise<Specialist[]> => {
    const list = await specialistsService.getSpecialists(type);
    const searchVal = query.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(searchVal) ||
        s.specialization.toLowerCase().includes(searchVal)
    );
  },
};

export type { Specialist };
