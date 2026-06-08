import apiClient from '../apiClient';
import type { ChatMessage, ChatConversation } from '../../types';

export type { ChatMessage, ChatConversation };

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
    const response = await apiClient.get<ChatMessage[]>(`/chat/${chatId}/messages`, { params });
    return response.data ?? [];
  },

  sendMessage: async (
    chatId: string,
    content: string,
    messageType: 'text' | 'file' = 'text'
  ): Promise<ChatMessage> => {
    const response = await apiClient.post<ChatMessage>('/chat/send', {
      chatId: parseInt(chatId, 10),
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
    const response = await apiClient.post<ChatMessage>('/chat/send-zoom-link', {
      chatId: parseInt(chatId, 10),
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
