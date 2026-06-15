import apiClient from '../apiClient';

export interface Note {
  id: string;
  title: string;
  content: string;
  childId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  senderRole?: string;
  receiverRole?: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  childId: string;
  senderRole?: string;
  receiverRole?: string;
}

export const notesService = {
  createNote: async (data: CreateNoteRequest): Promise<Note> => {
    const response = await apiClient.post<Note>('/notes', data);
    return response.data;
  },

  getNote: async (id: string): Promise<Note> => {
    const response = await apiClient.get<Note>(`/notes/${id}`);
    return response.data;
  },

  updateNote: async (id: string, data: Partial<CreateNoteRequest>): Promise<Note> => {
    const response = await apiClient.put<Note>(`/notes/${id}`, data);
    return response.data;
  },

  deleteNote: async (id: string): Promise<void> => {
    await apiClient.delete(`/notes/${id}`);
  },

  getMyNotes: async (): Promise<Note[]> => {
    const response = await apiClient.get<Note[]>('/notes/my-notes');
    return response.data;
  },

  getChildNotes: async (childId: string): Promise<Note[]> => {
    const response = await apiClient.get<Note[]>(`/notes/child/${childId}`);
    return response.data;
  },
};
