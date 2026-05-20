import apiClient from '../apiClient';

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  specialization?: string;
  yearsOfExperience?: number;
  profileImage?: string;
  licenseNumber?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  specialization?: string;
  yearsOfExperience?: number;
}

export const profileService = {
  updateProfile: async (data: UpdateProfileRequest): Promise<Profile> => {
    const response = await apiClient.put<Profile>('/profile/update', data);
    return response.data;
  },

  updateProfilePicture: async (file: File): Promise<Profile> => {
    const formData = new FormData();
    formData.append('picture', file);
    const response = await apiClient.put<Profile>('/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateLicense: async (licenseNumber: string, licenseFile: File): Promise<Profile> => {
    const formData = new FormData();
    formData.append('licenseNumber', licenseNumber);
    formData.append('license', licenseFile);
    const response = await apiClient.put<Profile>('/profile/license', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
