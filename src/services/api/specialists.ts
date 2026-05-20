import apiClient from '../apiClient';

export interface Specialist {
  id: string;
  name: string;
  specialization: string;
  yearsOfExperience: number;
  rating: number;
  reviewCount: number;
  profileImage?: string;
  licenseNumber?: string;
  certifications?: string[];
}

export const specialistsService = {
  getSpecialists: async (type?: string): Promise<Specialist[]> => {
    const response = await apiClient.get<Specialist[]>('/specialists', {
      params: type ? { type } : {},
    });
    return response.data;
  },

  getSpecialist: async (id: string): Promise<Specialist> => {
    const response = await apiClient.get<Specialist>(`/specialists/${id}`);
    return response.data;
  },
};
