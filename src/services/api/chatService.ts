import apiClient from '../apiClient';
import type { ChatMessage, ChatConversation } from '../../types';

export type { ChatMessage, ChatConversation };

const normalizeMessage = (raw: any): ChatMessage => {
  if (!raw) return raw;
  return {
    ...raw,
    id: String(raw.id || raw.messageId || ''),
    chatId: String(raw.chatId || ''),
    senderId: String(raw.senderId || raw.senderUserId || ''),
    senderName: raw.senderName || '',
    senderRole: raw.senderRole || raw.senderType || '',
    content: raw.content || '',
    messageType: raw.messageType || 'text',
    timestamp: raw.timestamp || raw.timeStamp || new Date().toISOString(),
    isRead: !!raw.isRead,
  } as ChatMessage;
};

export const chatServiceAPI = {
  startChat: async (participantIds: string[]): Promise<ChatConversation> => {
    const response = await apiClient.post<ChatConversation>('/chat/start', {
      participantIds,
    });
    return response.data;
  },

  getMyChats: async (): Promise<ChatConversation[]> => {
    const response = await apiClient.get<ChatConversation[]>('/chat/my-chats');
    return response.data ?? [];
  },

  getMessages: async (chatId: string, limit?: number): Promise<ChatMessage[]> => {
    const params = limit ? { limit } : {};
    const response = await apiClient.get<any[]>(`/chat/${chatId}/messages`, { params });
    const data = response.data ?? [];
    return data.map(normalizeMessage);
  },

  sendMessage: async (
    chatId: string,
    content: string,
    messageType: 'text' | 'file' = 'text'
  ): Promise<ChatMessage> => {
    const numericChatId = typeof chatId === 'number' ? chatId : parseInt(String(chatId).replace(/\D/g, ''), 10);
    const response = await apiClient.post<any>('/chat/send', {
      chatId: numericChatId || parseInt(chatId as string, 10),
      content,
      messageType,
    });
    return normalizeMessage(response.data);
  },

  sendZoomLink: async (
    chatId: string, 
    zoomLink: string, 
    confirmedDate?: string, 
    confirmedTime?: string, 
    note?: string
  ): Promise<ChatMessage> => {
    const numericChatId = typeof chatId === 'number' ? chatId : parseInt(String(chatId).replace(/\D/g, ''), 10);
    const response = await apiClient.post<any>('/chat/send-zoom-link', {
      chatId: numericChatId || parseInt(chatId as string, 10),
      zoomLink,
      confirmedDate: confirmedDate || new Date().toISOString().split('T')[0],
      confirmedTime: confirmedTime || new Date().toISOString().split('T')[1].substring(0, 5),
      note: note || 'Zoom Session Link'
    });
    return normalizeMessage(response.data);
  },

  markAsRead: async (messageId: string): Promise<void> => {
    await apiClient.patch(`/chat/messages/${messageId}/read`);
  },

  markChatAsRead: async (chatId: string): Promise<void> => {
    await apiClient.patch(`/chat/${chatId}/read-all`);
  },
};
