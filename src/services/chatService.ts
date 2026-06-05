import apiClient from './apiClient';
import type { Message, Conversation } from '../types';

export const chatService = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await apiClient.get<Conversation[]>('/chat/conversations');
    return response.data;
  },

  getMessages: async (receiverId: string): Promise<Message[]> => {
    const response = await apiClient.get<Message[]>('/chat/messages', {
      params: { receiverId },
    });
    return response.data;
  },

  sendMessage: async (receiverId: string, content: string): Promise<Message> => {
    const response = await apiClient.post<Message>('/chat/messages', {
      receiverId,
      content,
    });
    return response.data;
  },

  markAsRead: async (messageId: string): Promise<void> => {
    await apiClient.put(`/chat/messages/${messageId}/read`, {});
  },
};
