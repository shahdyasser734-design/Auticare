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
      const senderInfo = data.senderRole ? `${data.senderRole.charAt(0).toUpperCase() + data.senderRole.slice(1)} ${data.senderName || ''}`.trim() : (data.senderName || 'A user');
      localNotificationManager.emitNotification(
        data.receiverId,
        'notes',
        'New Clinical Note',
        `${senderInfo} added a new note: "${data.title}"`,
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
      const senderInfo = data.senderRole ? `${data.senderRole.charAt(0).toUpperCase() + data.senderRole.slice(1)} ${data.senderName || ''}`.trim() : (data.senderName || 'A user');
      localNotificationManager.emitNotification(
        targetId,
        'notes',
        'Clinical Note Updated',
        `${senderInfo} updated the note: "${data.title || note.title}"`,
        note.id
      );
    }

    return note;
  },

  deleteNote: async (id: string): Promise<void> => {
    await apiClient.delete(`/notes/${id}`);
  },

  getMyNotes: async (): Promise<Note[]> => {
    let myNotes: Note[] = [];
    try {
      const response = await apiClient.get<Note[]>('/notes/my-notes');
      myNotes = response.data || [];
    } catch { /* ignore */ }

    try {
      // Also fetch from all booked children to ensure received notes are included
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bookingsRes = await apiClient.get<any[]>('/bookings/my-bookings');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      const childIds = [...new Set((bookingsRes.data || []).map((b: any) => b.childId).filter(Boolean))];
      
      if (childIds.length > 0) {
        const childNotesPromises = childIds.map(cId => 
          apiClient.get<Note[]>(`/notes/child/${cId}`).then(res => res.data || []).catch(() => [])
        );
        
        const allChildNotes = (await Promise.all(childNotesPromises)).flat();
        const combined = [...myNotes, ...allChildNotes];
        
        // deduplicate
        return Array.from(new Map(combined.map(n => [String(n.id), n])).values());
      }
    } catch {
      // fallback to just my notes
    }
    return myNotes;
  },

  getChildNotes: async (childId: string): Promise<Note[]> => {
    const response = await apiClient.get<Note[]>(`/notes/child/${childId}`);
    return response.data;
  },
};
