import apiClient from '../apiClient';
import type { ChatMessage, ChatConversation } from '../../types';
import { mockState } from './mockState';

export type { ChatMessage, ChatConversation };

export const chatServiceAPI = {
  startChat: async (participantIds: string[]): Promise<ChatConversation> => {
    try {
      const response = await apiClient.post<ChatConversation>('/chat/start', {
        participantIds,
      });
      return response.data;
    } catch {
      const conversations = mockState.getChats();
      return conversations[0] ?? conversations[conversations.length - 1];
    }
  },

  getMyChats: async (): Promise<ChatConversation[]> => {
    try {
      const response = await apiClient.get<ChatConversation[]>('/chat/my-chats');
      const data = response.data ?? [];
      return data.length > 0 ? data : mockState.getChats();
    } catch (error) {
      console.warn('Chat API unavailable, using mock chats.', error);
      return mockState.getChats();
    }
  },

  getMessages: async (chatId: string, limit?: number): Promise<ChatMessage[]> => {
    try {
      const params = limit ? { limit } : {};
      const response = await apiClient.get<ChatMessage[]>(`/chat/${chatId}/messages`, { params });
      const data = response.data ?? [];
      return data.length > 0 ? data : mockState.getMessages(chatId).slice(-Math.max(limit ?? 100, 100));
    } catch (error) {
      console.warn('Chat messages API unavailable, using mock messages.', error);
      const messages = mockState.getMessages(chatId);
      return limit ? messages.slice(-limit) : messages;
    }
  },

  sendMessage: async (
    chatId: string,
    content: string,
    messageType: 'text' | 'file' = 'text'
  ): Promise<ChatMessage> => {
    try {
      const response = await apiClient.post<ChatMessage>('/chat/send', {
        chatId,
        content,
        messageType,
      });
      const created = response.data;
      mockState.addMessage(chatId, created);
      return created;
    } catch {
      const message: ChatMessage = {
        id: `mock-msg-${Date.now()}`,
        chatId,
        senderId: localStorage.getItem('userId') || 'user-123',
        senderName: 'You',
        senderRole: 'parent',
        content,
        messageType,
        timestamp: new Date().toISOString(),
        isRead: true,
      };
      mockState.addMessage(chatId, message);
      return message;
    }
  },

  sendZoomLink: async (chatId: string, zoomLink: string): Promise<ChatMessage> => {
    try {
      const response = await apiClient.post<ChatMessage>('/chat/send-zoom-link', {
        chatId,
        zoomLink,
      });
      const created = response.data;
      mockState.addMessage(chatId, created);
      return created;
    } catch {
      const message: ChatMessage = {
        id: `mock-msg-${Date.now()}`,
        chatId,
        senderId: localStorage.getItem('userId') || 'user-123',
        senderName: 'You',
        senderRole: 'parent',
        content: zoomLink,
        messageType: 'zoom-link',
        zoomLink,
        timestamp: new Date().toISOString(),
        isRead: true,
      };
      mockState.addMessage(chatId, message);
      return message;
    }
  },

  markAsRead: async (messageId: string): Promise<void> => {
    try {
      await apiClient.patch(`/chat/messages/${messageId}/read`);
    } catch {
      // Mock read state handled locally by message viewers.
    }
  },

  markChatAsRead: async (chatId: string): Promise<void> => {
    try {
      await apiClient.patch(`/chat/${chatId}/read-all`);
    } catch {
      // Mock state not persisted for chat read receipts.
    }
  },
};
