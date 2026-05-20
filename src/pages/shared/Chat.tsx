import { useState, useEffect } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { chatService, type Chat as ChatType, type ChatMessage } from '../../services/api/chat';

export const Chat = () => {
  const [conversations, setConversations] = useState<ChatType[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const data = await chatService.getMyChats();
      setConversations(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;
    try {
      const data = await chatService.getMessages(selectedConversation.id);
      setMessages(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const message = await chatService.sendMessage({
        chatId: selectedConversation.id,
        content: newMessage,
      });
      setMessages([...messages, message]);
      setNewMessage('');
      fetchConversations(); // Update last message
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getChatName = (chat: ChatType) => {
    // In a real app, we'd map participant IDs to user names.
    // For now, if there's only one other participant, we show their ID.
    return `Chat with ${chat.participants?.[1] || 'Specialist'}`;
  };

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[calc(100vh-8rem)]">
        {/* Conversations List */}
        <Card className="md:col-span-1 h-full overflow-hidden flex flex-col">
          <h2 className="text-xl font-bold text-neutral-900 mb-4 px-2">Messages</h2>
          <div className="flex-1 overflow-y-auto space-y-2 px-2">
            {loading ? (
              <p>Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="text-neutral-500">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedConversation?.id === conv.id
                      ? 'bg-primary-600 text-white'
                      : 'hover:bg-neutral-100'
                  }`}
                >
                  <p className="font-medium">{getChatName(conv)}</p>
                  <p className="text-sm opacity-75 truncate">{conv.lastMessage?.content || 'No messages yet'}</p>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2 h-full flex flex-col">
          {selectedConversation ? (
            <>
              <h2 className="text-xl font-bold text-neutral-900 mb-4 pb-4 border-b">
                {getChatName(selectedConversation)}
              </h2>
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                {messages.length === 0 ? (
                  <p className="text-center text-neutral-500 mt-10">No messages yet. Send a message to start the conversation.</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.isRead ? '' : 'bg-primary-50 p-3 rounded-lg'
                      }`}
                    >
                      <Avatar name="User" size="sm" />
                      <div>
                        <p className="text-sm text-neutral-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                        <p className="text-neutral-900">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="Type a message..."
                  fullWidth
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-500">
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
};
