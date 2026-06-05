import apiClient from '../apiClient';
import type { ClinicalNote } from '../../types';

export const notesService = {
  // Create a new note
  createNote: async (data: Partial<ClinicalNote>): Promise<ClinicalNote> => {
    const response = await apiClient.post<ClinicalNote>('/notes', data);
    return response.data;
  },

  // Get specific note
  getNote: async (id: string): Promise<ClinicalNote> => {
    const response = await apiClient.get<ClinicalNote>(`/notes/${id}`);
    return response.data;
  },

  // Update note
  updateNote: async (id: string, data: Partial<ClinicalNote>): Promise<ClinicalNote> => {
    const response = await apiClient.put<ClinicalNote>(`/notes/${id}`, data);
    return response.data;
  },

  // Delete note
  deleteNote: async (id: string): Promise<void> => {
    await apiClient.delete(`/notes/${id}`);
  },

  // Get all notes for current user
  getMyNotes: async (): Promise<ClinicalNote[]> => {
    const response = await apiClient.get<ClinicalNote[]>('/notes/my-notes');
    return response.data;
  },

  // Get all notes for a specific child
  getChildNotes: async (childId: string): Promise<ClinicalNote[]> => {
    const response = await apiClient.get<ClinicalNote[]>(`/notes/child/${childId}`);
    return response.data;
  },
};
