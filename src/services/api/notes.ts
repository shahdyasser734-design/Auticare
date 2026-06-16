import apiClient from '../apiClient';
import { localNotificationManager } from './localNotificationManager';

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
  senderName?: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  childId: string;
  parentId?: string;
  senderRole?: string;
  receiverRole?: string;
  receiverId?: string;
  senderName?: string;
}

export const notesService = {
  createNote: async (data: CreateNoteRequest): Promise<Note> => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.post<any>('/notes', data);
    const note = response.data?.data || response.data;
    
    if (data.receiverId) {
      localNotificationManager.emitNotification(
        data.receiverId,
        'notes',
        'New Clinical Note',
        `A new note "${data.title}" has been shared with you.`,
        note.id
      );
    }
    
    return note;
  },

  getNote: async (id: string): Promise<Note> => {
    const response = await apiClient.get<Note>(`/notes/${id}`);
    return response.data;
  },

  updateNote: async (id: string, data: Partial<CreateNoteRequest>): Promise<Note> => {
    const response = await apiClient.put<Note>(`/notes/${id}`, data);
    const note = response.data;
    
    if (data.receiverId || note.receiverId) {
      const targetId = (data.receiverId || note.receiverId) as string;
      localNotificationManager.emitNotification(
        targetId,
        'notes',
        'Clinical Note Updated',
        `The note "${data.title || note.title}" has been updated.`,
        note.id
      );
    }

    return note;
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
