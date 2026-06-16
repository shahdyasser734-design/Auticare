import type { ChatMessage } from '../../types';

const LOCAL_MEDIA_KEY = 'auticare_local_media_chats';

// Helper to convert Blob/File to Base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const loadLocalMedia = (): ChatMessage[] => {
  try {
    const data = localStorage.getItem(LOCAL_MEDIA_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLocalMedia = (messages: ChatMessage[]) => {
  try {
    localStorage.setItem(LOCAL_MEDIA_KEY, JSON.stringify(messages));
  } catch (err: any) {
    // If quota exceeded, remove the oldest 5 messages and try again
    if (err.name === 'QuotaExceededError' && messages.length > 5) {
      messages.splice(0, 5); // remove oldest
      try {
        localStorage.setItem(LOCAL_MEDIA_KEY, JSON.stringify(messages));
      } catch {
        console.error('Failed to save local media: Quota completely full.');
      }
    }
  }
};

export const localMediaManager = {
  saveMediaMessage: (message: ChatMessage): void => {
    const messages = loadLocalMedia();
    messages.push(message);
    saveLocalMedia(messages);
  },

  getMediaMessagesForChat: (chatId: string): ChatMessage[] => {
    const messages = loadLocalMedia();
    return messages.filter(m => String(m.chatId) === String(chatId));
  },
  
  getAllMediaMessages: (): ChatMessage[] => {
    return loadLocalMedia();
  }
};
