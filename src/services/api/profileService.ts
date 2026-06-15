import apiClient from '../apiClient';
import type { User } from '../../types';

export const profileService = {
  // Update profile information
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>('/profile/update', data);
    return response.data;
  },

  // Update profile picture
  updateProfilePicture: async (imageUrl: string): Promise<User> => {
    const response = await apiClient.put<User>('/profile/picture', { imageUrl });
    return response.data;
  },

  // For specialists: update license information
  updateLicense: async (licenseData: Record<string, unknown>): Promise<User> => {
    const response = await apiClient.put<User>('/profile/license', licenseData);
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/profile');
    return response.data;
  },
};
