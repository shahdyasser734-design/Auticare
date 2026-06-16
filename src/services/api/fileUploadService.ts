import apiClient from '../apiClient';
import type { FileUploadResponse } from '../../types';

export const fileUploadService = {
  // Upload a file
  uploadFile: async (
    file: File,
    documentType: 'medical-report' | 'session-attachment' | 'treatment-document' | 'specialist-document' | 'booking-document'
  ): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const response = await apiClient.post<FileUploadResponse>('/FileUpload/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload multiple files
  uploadMultiple: async (
    files: File[],
    documentType: 'medical-report' | 'session-attachment' | 'treatment-document' | 'specialist-document'
  ): Promise<FileUploadResponse[]> => {
    const promises = files.map((file) => fileUploadService.uploadFile(file, documentType));
    return Promise.all(promises);
  },
};
