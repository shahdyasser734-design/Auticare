import apiClient from '../apiClient';
import type { ChatMessage, ChatConversation } from '../../types';

export type { ChatMessage, ChatConversation };

// No frontend transformation applied to raw message payloads

export const chatServiceAPI = {
  startChat: async (contactId: string): Promise<ChatConversation> => {
    const response = await apiClient.post<any>('/chat/start', {
      specialistId: Number(contactId),
    });
    const r = response.data;
    return {
      id: String(r.chatId || r.id),
      participantIds: [String(contactId)],
      participantNames: {
        [String(contactId)]: r.specialistName || r.parentName || r.patientName || 'Unknown',
      },
      lastUpdated: r.lastMessageAt || new Date().toISOString(),
      unreadCount: r.unreadCount || 0,
      createdAt: new Date().toISOString(),
      ...r
    } as ChatConversation;
  },

  getMyChats: async (): Promise<ChatConversation[]> => {
    const response = await apiClient.get<any[]>('/chat/my-chats');
    const raw = response.data ?? [];
    return raw.map((r: any) => ({
      id: String(r.chatId || r.id),
      participantIds: r.specialistId ? [String(r.specialistId)] : (r.parentId ? [String(r.parentId)] : []),
      participantNames: {
        [String(r.specialistId || r.parentId)]: r.specialistName || r.parentName || r.patientName || 'Unknown',
      },
      lastUpdated: r.lastMessageAt || new Date().toISOString(),
      unreadCount: r.unreadCount || 0,
      createdAt: new Date().toISOString(),
      ...r
    }));
  },

  getMessages: async (chatId: string, limit?: number): Promise<ChatMessage[]> => {
    const params = limit ? { limit } : {};
    const response = await apiClient.get<any[]>(`/chat/${chatId}/messages`, { params });
    return response.data ?? [];
  },

  sendMessage: async (
    chatId: string,
    content: string,
    messageType: 'text' | 'file' = 'text'
  ): Promise<ChatMessage> => {
    const response = await apiClient.post<any>('/chat/send', {
      chatId: Number(chatId),
      content,
      messageType,
    });
    return response.data;
  },

  sendZoomLink: async (
    chatId: string, 
    zoomLink: string, 
    confirmedDate?: string, 
    confirmedTime?: string, 
    note?: string
  ): Promise<ChatMessage> => {
    const response = await apiClient.post<any>('/chat/send-zoom-link', {
      chatId: Number(chatId),
      zoomLink,
      confirmedDate: confirmedDate || new Date().toISOString().split('T')[0],
      confirmedTime: confirmedTime || new Date().toISOString().split('T')[1].substring(0, 5),
      note: note || 'Zoom Session Link'
    });
    return response.data;
  },

  markAsRead: async (messageId: string): Promise<void> => {
    await apiClient.patch(`/chat/messages/${messageId}/read`);
  },

  markChatAsRead: async (chatId: string): Promise<void> => {
    await apiClient.patch(`/chat/${chatId}/read-all`);
  },
};
