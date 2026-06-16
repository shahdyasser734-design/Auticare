import apiClient from '../apiClient';

export interface Note {
  id: string;
  title: string;
  content: string;
  childId: string;
  parentId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  senderRole?: string;
  receiverRole?: string;
  receiverId?: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  childId: string;
  parentId?: string;
  senderRole?: string;
  receiverRole?: string;
  receiverId?: string;
}

export const notesService = {
  createNote: async (data: CreateNoteRequest): Promise<Note> => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.post<any>('/notes', data);
    return response.data?.data || response.data;
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
