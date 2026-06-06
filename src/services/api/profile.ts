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
  bio?: string;
}

export const profileService = {
  updateProfile: async (data: UpdateProfileRequest): Promise<Profile> => {
    const response = await apiClient.put<Profile>('/profile/update', data);
    return response.data;
  },

  updateProfilePicture: async (file: File): Promise<Profile> => {
    // 1. Upload the file via multipart/form-data
    const formData = new FormData();
    formData.append('file', file);
    const uploadRes = await apiClient.post<unknown>('/FileUpload/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const raw = uploadRes.data;
    console.log('[profile] FileUpload/upload raw response:', raw);

    // Defensively extract URL — backend may use different field names
    let imageUrl: string | null = null;
    if (typeof raw === 'string' && raw.startsWith('http')) {
      imageUrl = raw;
    } else if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      imageUrl = (
        (typeof obj.fileUrl === 'string' && obj.fileUrl) ||
        (typeof obj.url === 'string' && obj.url) ||
        (typeof obj.imageUrl === 'string' && obj.imageUrl) ||
        (typeof obj.filePath === 'string' && obj.filePath) ||
        (typeof obj.path === 'string' && obj.path) ||
        (typeof obj.FileUrl === 'string' && obj.FileUrl) ||
        null
      );
    }

    if (!imageUrl) {
      console.error('[profile] Could not extract URL from FileUpload response:', raw);
      throw new Error('File upload succeeded but returned no URL. Raw response: ' + JSON.stringify(raw));
    }

    console.log('[profile] Extracted imageUrl:', imageUrl);

    // 2. PUT /profile/picture — backend expects a JSON string body (schema type: "string")
    await apiClient.put('/profile/picture', JSON.stringify(imageUrl), {
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
