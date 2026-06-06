import apiClient from '../apiClient';
import { fileUploadService } from './fileUpload';

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
  bio?: string;
}

export const profileService = {
  updateProfile: async (data: UpdateProfileRequest): Promise<Profile> => {
    const response = await apiClient.put<Profile>('/profile/update', data);
    return response.data;
  },

  updateProfilePicture: async (file: File): Promise<Profile> => {
    const uploadRes = await fileUploadService.uploadFile(file);
    const imageUrl = uploadRes.fileUrl;
    
    // PUT /profile/picture expects string URL
    const response = await apiClient.put<Profile>('/profile/picture', JSON.stringify(imageUrl), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    return {
      ...response.data,
      profileImage: imageUrl, // Ensure the updated URL is populated in the returned profile
    };
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
