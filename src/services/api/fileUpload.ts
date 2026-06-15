import apiClient from '../apiClient';

export interface FileUploadResponse {
  fileUrl: string;
  fileName: string;
  size: number;
}

export const fileUploadService = {
  uploadFile: async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<FileUploadResponse>('/FileUpload/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
