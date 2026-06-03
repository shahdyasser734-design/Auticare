import apiClient from '../apiClient';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  messageType?: string;
  timestamp: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage | null;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StartChatRequest {
  specialistId: string;
}

export interface SendMessageRequest {
  chatId: string;
  content: string;
}

export const chatService = {
  startChat: async (data: StartChatRequest): Promise<Chat> => {
    const response = await apiClient.post<Chat>('/chat/start', data);
    return response.data;
  },

  getMyChats: async (): Promise<Chat[]> => {
    const response = await apiClient.get<Chat[]>('/chat/my-chats');
    return response.data;
  },

  getMessages: async (chatId: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get<ChatMessage[]>(`/chat/${chatId}/messages`);
    return response.data;
  },

  sendMessage: async (data: SendMessageRequest): Promise<ChatMessage> => {
    const response = await apiClient.post<ChatMessage>('/chat/send', data);
    return response.data;
  },

  sendZoomLink: async (chatId: string, zoomLink: string): Promise<void> => {
    await apiClient.post('/chat/send-zoom-link', { chatId, zoomLink });
  },
};
