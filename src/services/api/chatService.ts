import apiClient from '../apiClient';
import type { ChatMessage, ChatConversation } from '../../types';

export type { ChatMessage, ChatConversation };

// Helper to map backend message schema to frontend interface
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapMessage = (m: any): ChatMessage => ({
  id: String(m.messageId || m.id),
  senderId: String(m.senderUserId || m.senderId),
  senderName: m.senderName || '',
  content: m.content || '',
  timestamp: m.timeStamp || m.timestamp || new Date().toISOString(),
  messageType: m.messageType || 'text',
  ...m
});

export const chatServiceAPI = {
  startChat: async (contactId: string): Promise<ChatConversation> => {
    const parsedId = isNaN(Number(contactId)) ? contactId : Number(contactId);
    // Send standard IDs. If backend is updated, it will read what it needs.
    const payload: Record<string, string | number> = {
      participantId: parsedId,
      specialistId: parsedId,
      parentId: parsedId
    };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.post<any>('/chat/start', payload);
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.get<any[]>('/chat/my-chats');
    const raw = response.data ?? [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    return raw.map((r: any) => {
      const pIds: string[] = [];
      const pNames: Record<string, string> = {};

      if (r.specialistId) {
        pIds.push(String(r.specialistId));
        if (r.specialistName) pNames[String(r.specialistId)] = r.specialistName;
      }
      if (r.parentId) {
        pIds.push(String(r.parentId));
        if (r.parentName || r.patientName) pNames[String(r.parentId)] = r.parentName || r.patientName;
      }
      if (r.contactId) {
        pIds.push(String(r.contactId));
        if (r.contactName) pNames[String(r.contactId)] = r.contactName;
      }

      return {
        id: String(r.chatId || r.id),
        participantIds: pIds,
        participantNames: pNames,
        lastUpdated: r.lastMessageAt || new Date().toISOString(),
        unreadCount: r.unreadCount || 0,
        createdAt: new Date().toISOString(),
        ...r
      };
    });
  },

  getMessages: async (chatId: string, limit?: number): Promise<ChatMessage[]> => {
    const params = limit ? { limit } : {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.get<any[]>(`/chat/${chatId}/messages`, { params });
    const raw = response.data ?? [];
    return raw.map(mapMessage);
  },

  sendMessage: async (
    chatId: string,
    content: string,
    messageType: 'text' | 'file' = 'text'
  ): Promise<ChatMessage> => {
    const response = await apiClient.post<Record<string, unknown>>('/chat/send', {
      chatId: isNaN(Number(chatId)) ? chatId : Number(chatId),
      content,
      messageType,
    });
    return mapMessage(response.data);
  },

  sendZoomLink: async (
    chatId: string, 
    zoomLink: string, 
    confirmedDate?: string, 
    confirmedTime?: string, 
    note?: string
  ): Promise<ChatMessage> => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await apiClient.post<any>('/chat/send-zoom-link', {
      chatId: isNaN(Number(chatId)) ? chatId : Number(chatId),
      zoomLink,
      confirmedDate: confirmedDate || new Date().toISOString().split('T')[0],
      confirmedTime: confirmedTime || new Date().toISOString().split('T')[1].substring(0, 5),
      note: note || 'Zoom Session Link'
    });
    return mapMessage(response.data);
  },

  markAsRead: async (messageId: string): Promise<void> => {
    await apiClient.patch(`/chat/messages/${messageId}/read`);
  },

  markChatAsRead: async (chatId: string): Promise<void> => {
    await apiClient.patch(`/chat/${chatId}/read-all`);
  },
};
