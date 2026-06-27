import apiClient from '../apiClient';
import type { ChatMessage, ChatConversation } from '../../types';
import { localMediaManager } from './localMediaManager';

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
  startChat: async (contactId: string, fallbackName?: string): Promise<ChatConversation> => {
    let myId = '';
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        myId = String(JSON.parse(userStr).id);
      }
    } catch { /* ignore */ }

    if (myId && String(contactId) === myId) {
      throw new Error("Cannot start a chat with yourself.");
    }

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
        [String(contactId)]: r.specialistName || r.parentName || r.patientName || r.receiver?.name || fallbackName || 'Unknown',
      },
      lastUpdated: r.lastMessageAt || new Date().toISOString(),
      unreadCount: r.unreadCount || 0,
      createdAt: new Date().toISOString(),
      ...r
    } as ChatConversation;
  },

  getMyChats: async (): Promise<ChatConversation[]> => {
    let myId = '';
    let myName = '';
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        myId = String(u.id);
        myName = String(u.name || '').toLowerCase().trim();
      }
    } catch { /* ignore */ }

    const response = await apiClient.get<Record<string, unknown> | unknown[]>('/chat/my-chats');
    const data = response.data as Record<string, unknown>;
    const raw: unknown[] = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.chats) ? data.chats : []));
    
    return raw.map((rRaw: unknown) => {
      const r = rRaw as Record<string, unknown>;
      const pIds: string[] = [];
      const pNames: Record<string, string> = {};

      if (r.specialistId && String(r.specialistId) !== myId) {
        const sName = String(r.specialistName || '').toLowerCase().trim();
        if (!myName || (!sName.includes(myName) && !myName.includes(sName))) {
          pIds.push(String(r.specialistId));
          if (r.specialistName) pNames[String(r.specialistId)] = String(r.specialistName);
        }
      }
      if (r.parentId && String(r.parentId) !== myId) {
        const pName = String(r.parentName || r.patientName || '').toLowerCase().trim();
        if (!myName || (!pName.includes(myName) && !myName.includes(pName))) {
          pIds.push(String(r.parentId));
          if (r.parentName || r.patientName) pNames[String(r.parentId)] = String(r.parentName || r.patientName);
        }
      }
      if (r.contactId && String(r.contactId) !== myId) {
        const cName = String(r.contactName || '').toLowerCase().trim();
        if (!myName || (!cName.includes(myName) && !myName.includes(cName))) {
          pIds.push(String(r.contactId));
          if (r.contactName) pNames[String(r.contactId)] = String(r.contactName);
        }
      }

      return {
        id: String(r.chatId || r.id),
        participantIds: pIds,
        participantNames: pNames,
        lastUpdated: (r.lastMessageAt as string) || new Date().toISOString(),
        unreadCount: (r.unreadCount as number) || 0,
        createdAt: new Date().toISOString(),
        ...(r as Record<string, unknown>)
      } as ChatConversation;
    }).filter(chat => {
      // STRICT FILTER: Discard any chat that has no valid other participant ids
      return chat.participantIds.length > 0;
    });
  },

  getMessages: async (chatId: string, limit?: number): Promise<ChatMessage[]> => {
    const params = limit ? { limit } : {};
    let apiMessages: ChatMessage[] = [];
    try {
      const response = await apiClient.get<Record<string, unknown> | unknown[]>(`/chat/${chatId}/messages`, { params });
      const data = response.data as Record<string, unknown>;
      const raw: unknown[] = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.messages) ? data.messages : []));
      apiMessages = raw.map(mapMessage);
    } catch {
      // Allow fallback to local media if API fails
    }

    const localMessages = localMediaManager.getMediaMessagesForChat(chatId);
    
    // Merge API and local messages
    const merged = [...apiMessages, ...localMessages];
    
    // Sort by timestamp ascending (oldest first, which is standard for chat UI rendering)
    merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return merged;
  },

  sendMessage: async (
    chatId: string,
    content: string,
    messageType: 'text' | 'file' | 'audio' | 'call' | 'image' | 'voice' = 'text',
    replyToMessageId?: string
  ): Promise<ChatMessage> => {
    const response = await apiClient.post<Record<string, unknown>>('/chat/send', {
      chatId: isNaN(Number(chatId)) ? chatId : Number(chatId),
      content,
      messageType,
      replyToMessageId,
    });
    return mapMessage(response.data?.data || response.data);
  },

  sendMediaMessage: async (
    chatId: string,
    type: 'file' | 'image' | 'voice',
    blob: Blob,
    fileName?: string,
    duration?: number
  ): Promise<ChatMessage> => {
    const formData = new FormData();
    formData.append('chatId', String(isNaN(Number(chatId)) ? chatId : Number(chatId)));
    formData.append('type', type);
    
    if (type === 'voice') {
      formData.append('audio', blob, fileName || 'voice-message.wav');
      if (duration) formData.append('duration', String(duration));
    } else if (type === 'image') {
      formData.append('image', blob, fileName || 'image.png');
    } else {
      formData.append('file', blob, fileName || 'attachment.bin');
    }

    const response = await apiClient.post<Record<string, unknown>>('/chat/send', formData, {
      // We must not explicitly set Content-Type here, or else we lose the browser-generated boundary
      headers: {
        'Content-Type': undefined,
      },
    });
    return mapMessage(response.data?.data || response.data);
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
