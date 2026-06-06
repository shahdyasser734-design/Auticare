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
    // 1. Upload the file and get back a URL
    const uploadRes = await fileUploadService.uploadFile(file);
    const imageUrl = uploadRes.fileUrl;

    // 2. PUT /profile/picture — body must be a plain JSON string (backend schema: type "string")
    //    We must NOT double-encode: send the string directly, not JSON.stringify(imageUrl).
    await apiClient.put('/profile/picture', imageUrl, {
      headers: { 'Content-Type': 'application/json' },
    });

    return {
      id: '',
      email: '',
      name: '',
      profileImage: imageUrl,
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
