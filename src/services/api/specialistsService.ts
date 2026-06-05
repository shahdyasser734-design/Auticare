import apiClient from '../apiClient';
import type { Specialist } from '../../types';

export const normalizeSpecialist = (raw: any): Specialist => {
  const specId = String(raw.id ?? raw.specialistId ?? '');
  
  // Determine type based on specialization/title
  let calculatedType: 'doctor' | 'therapist' = 'doctor';
  const specialization = String(raw.specialization ?? '').toLowerCase();
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
  
  return {
    id: specId,
    name: String(raw.name ?? ''),
    type: raw.type ?? calculatedType,
    specialization: String(raw.specialization ?? ''),
    yearsOfExperience: Number(raw.yearsOfExperience ?? raw.yearsExperience ?? 0),
    rating: Number(raw.rating ?? 0),
    reviewCount: Number(raw.reviewCount ?? raw.reviews ?? 0),
    availableSlots: Array.isArray(raw.availableSlots) ? raw.availableSlots : [],
    profileImage: raw.profileImage ?? '',
    licenseNumber: raw.licenseNumber ?? '',
    certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
    email: raw.email ?? '',
    bio: raw.bio ?? raw.about ?? '',
  };
};

export const specialistsService = {
  // Get all specialists (with optional type filter)
  getSpecialists: async (type?: 'doctor' | 'therapist'): Promise<Specialist[]> => {
    const response = await apiClient.get<any[]>('/specialists');
    const allSpecs = (response.data || []).map(normalizeSpecialist);
    
    if (type) {
      return allSpecs.filter((s) => s.type === type);
    }
    return allSpecs;
  },

  // Get specific specialist details
  getSpecialist: async (id: string): Promise<Specialist> => {
    const response = await apiClient.get<any>(`/specialists/${id}`);
    const rawData = response.data?.data || response.data;
    return normalizeSpecialist(rawData);
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
