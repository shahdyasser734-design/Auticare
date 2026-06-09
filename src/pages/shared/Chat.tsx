import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { chatServiceAPI, type ChatConversation, type ChatMessage } from '../../services/api/chatService';
import { useAuth } from '../../context/useAuth';
import { childrenService, type Child } from '../../services/api/children';
import { MessageSquare, Video, Send, Loader2 } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

// ─── Safe helpers (prevent crashes on null API data) ──────────────────────────
const safeParticipantNames = (chat: ChatConversation): Record<string, string> => {
  try {
    return chat.participantNames && typeof chat.participantNames === 'object'
      ? chat.participantNames
      : {};
  } catch {
    return {};
  }
};

const safeParticipantIds = (chat: ChatConversation): string[] => {
  try {
    return Array.isArray(chat.participantIds) ? chat.participantIds : [];
  } catch {
    return [];
  }
};

export const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendingZoom, setSendingZoom] = useState(false);

  const [childrenList, setChildrenList] = useState<Child[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSpecialist = user?.role === 'doctor' || user?.role === 'therapist';

  const fetchConversations = async () => {
    try {
      const data = await chatServiceAPI.getMyChats();
      const safeData = Array.isArray(data) ? data : [];
      setConversations(safeData);
      
      const state = location.state as { targetChatId?: string } | null;
      if (state?.targetChatId) {
        const target = safeData.find(c => c.id === state.targetChatId);
        if (target) {
          setSelectedConversation(target);
          return;
        }
      }
      
      if (safeData.length > 0 && !selectedConversation) {
        setSelectedConversation(safeData[0]);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  };

  const fetchChildren = async () => {
    try {
      const list = await childrenService.getMyChildren();
      setChildrenList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load patient profiles:', err);
      // Don't crash — children list is optional enhancement
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation?.id) return;
    try {
      const data = await chatServiceAPI.getMessages(selectedConversation.id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      // Don't crash — just keep existing messages
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchConversations();
    void fetchChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchMessages();

      const interval = setInterval(() => {
        void fetchMessages();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    const messageContent = newMessage.trim();
    if (!messageContent || !selectedConversation?.id) return;
    
    // Clear UI state immediately so user can keep typing
    setNewMessage('');
    setSending(true);
    setSendError(null);
    
    console.log('[Chat.tsx] Sending message:', {
      chatId: selectedConversation.id,
      contentLength: messageContent.length,
      messageType: 'text'
    });
    
    try {
      const msg = await chatServiceAPI.sendMessage(
        selectedConversation.id,
        messageContent
      );
      
      console.log('[Chat.tsx] Message send response:', msg);
      
      // Strict sync: Fetch fresh messages from backend to guarantee UI alignment
      await fetchMessages();
      await fetchConversations();
      
    } catch (err: any) {
      console.error('[Chat.tsx] Failed to send message:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to send message. Please try again.';
      console.error('[Chat.tsx] Backend error details:', err?.response?.data);
      setSendError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleSendZoomLink = async () => {
    if (!selectedConversation?.id) return;
    setSendingZoom(true);
    
    const meetingId = Math.floor(1000000000 + Math.random() * 9000000000);
    const link = `https://zoom.us/j/${meetingId}`;
    
    console.log('[Chat.tsx] Sending Zoom link:', {
      chatId: selectedConversation.id,
      zoomLink: link
    });
    
    try {
      const msg = await chatServiceAPI.sendZoomLink(selectedConversation.id, link);
      console.log('[Chat.tsx] Zoom message send response:', msg);
      
      await fetchMessages();
      await fetchConversations();
    } catch (err: any) {
      console.error('[Chat.tsx] Failed to send Zoom link:', err);
      console.error('[Chat.tsx] Backend error details:', err?.response?.data);
    } finally {
      setSendingZoom(false);
    }
  };

  // ─── Safe data helpers ─────────────────────────────────────────────────────
  const getChatName = (chat: ChatConversation): string => {
    try {
      const names = safeParticipantNames(chat);
      const otherParticipants = Object.entries(names)
        .filter(([id, name]) => id !== user?.id && name && name !== user?.name && name !== 'You')
        .map(([, name]) => name);
      
      if (otherParticipants.length > 0 && otherParticipants[0]) {
        // Evaluate role prefix if we know it
        const rawName = otherParticipants[0];
        if (!isSpecialist) {
          // Parent looking at specialist
          if (rawName.toLowerCase().includes('dr.') || rawName.toLowerCase().includes('therapist')) {
            return rawName;
          }
          return `Dr. / Therapist: ${rawName}`;
        } else {
          // Specialist looking at parent
          if (rawName.toLowerCase().includes('parent')) {
            return rawName;
          }
          return `Parent: ${rawName}`;
        }
      }
      
      // Fallback based on context
      return isSpecialist ? 'Parent' : 'Doctor / Therapist';
    } catch {
      return isSpecialist ? 'Parent' : 'Doctor / Therapist';
    }
  };

  const getChatDetails = (chat: ChatConversation) => {
    try {
      const ids = safeParticipantIds(chat);
      const names = safeParticipantNames(chat);
      const otherId = ids.find((id) => id && id !== user?.id);
      
      if (!isSpecialist) {
        const docName = otherId ? (names[otherId] || 'Doctor / Therapist') : 'Doctor / Therapist';
        return { parentName: 'You', childName: docName, avatar: undefined, status: 'Active' };
      }

      const parentName = otherId ? (names[otherId] || 'Parent') : 'Parent';
      const child = childrenList.find((c) => c.parentId === otherId);
      return {
        parentName,
        childName: child ? child.name : `${parentName}'s Child`,
        avatar: child?.profileImage || undefined,
        status: child ? 'Active' : 'Pending',
      };
    } catch {
      return { parentName: 'Parent', childName: 'Patient', avatar: undefined, status: 'Pending' };
    }
  };


  const isZoomMessage = (msg: ChatMessage): boolean => {
    try {
      return msg.messageType === 'zoom-link' || (msg.content || '').includes('zoom.us');
    } catch {
      return false;
    }
  };

  // Show all convs that have another participant (safe filter)
  const filteredConversations = conversations.filter((conv) => {
    try {
      const ids = safeParticipantIds(conv);
      return ids.some((id) => id && id !== user?.id);
    } catch {
      return false;
    }
  });

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 min-h-[calc(100vh-8rem)]">

        {/* Left Sidebar: Chat List */}
        <div className="col-span-1 hidden lg:flex flex-col gap-3 h-full">
          <Card className="h-full flex flex-col p-4 border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl bg-[var(--surface-strong)] dark:bg-slate-900/10">
            <h2 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider mb-4 px-2">
              Conversations
            </h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredConversations.length === 0 ? (
                <p className="text-xs text-stone-500 px-2 text-center mt-10">No conversations yet.</p>
              ) : (
                filteredConversations.map(conv => {
                  let nameLabel = '';
                  let roleLabel = '';
                  if (isSpecialist) {
                    const details = getChatDetails(conv);
                    nameLabel = details.parentName;
                    roleLabel = 'Parent';
                  } else {
                    const chatName = getChatName(conv);
                    if (chatName.includes(':')) {
                      const parts = chatName.split(':');
                      roleLabel = parts[0].trim();
                      nameLabel = parts[1].trim();
                    } else {
                      roleLabel = 'Specialist';
                      nameLabel = chatName;
                    }
                  }
                  
                  const isSelected = selectedConversation?.id === conv.id;
                  
                  return (
                    <div 
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                        isSelected 
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' 
                          : 'bg-white dark:bg-slate-800 border-transparent hover:border-stone-200 dark:hover:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={nameLabel} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-stone-900 dark:text-white truncate">
                            {nameLabel}
                          </p>
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest truncate">
                            {roleLabel}
                          </p>
                          {conv.lastMessage && (
                            <p className="text-xs text-stone-500 dark:text-slate-400 truncate mt-0.5">
                              {isZoomMessage(conv.lastMessage) ? '🎥 Zoom link' : conv.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Messaging Area + Patient Info Sidebar */}
        <div className={`col-span-1 lg:col-span-3 grid grid-cols-1 ${isSpecialist && selectedConversation ? 'lg:grid-cols-3' : 'w-full'} gap-5 h-full`}>
          <Card className={`${isSpecialist && selectedConversation ? 'lg:col-span-2' : 'col-span-1'} h-full flex flex-col p-5 border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl bg-[var(--surface-strong)] dark:bg-slate-900/10`}>
            {/* Unified Conversation Header (Mobile Dropdown + Desktop Info) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-stone-200/60 dark:border-white/8 mb-4 shrink-0 gap-4">
              <div className="flex flex-col">
                <div className="lg:hidden w-full mb-3">
                  <label className="text-xs text-stone-500 font-bold mb-1.5 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare size={14} className="text-indigo-500" />
                    Chat with:
                  </label>
                  <select
                    className="w-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-900 dark:text-white text-sm rounded-xl px-4 py-2.5 font-bold outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    value={selectedConversation?.id || ''}
                    onChange={(e) => {
                      const targetChatId = e.target.value;
                      const conv = conversations.find(c => c.id === targetChatId);
                      if (conv) {
                        setSelectedConversation(conv);
                      }
                    }}
                  >
                    <option value="" disabled>Select Participant</option>
                    {filteredConversations.map(conv => {
                      let label = '';
                      if (isSpecialist) {
                        const details = getChatDetails(conv);
                        label = `Parent: ${details.parentName}`;
                      } else {
                        const chatName = getChatName(conv);
                        label = chatName.includes(':') ? chatName : `Dr. / Therapist: ${chatName}`;
                      }
                      return (
                        <option key={conv.id} value={conv.id}>{label}</option>
                      );
                    })}
                  </select>
                </div>
                
                {selectedConversation && (
                  <div className="hidden lg:flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                       <MessageSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-900 dark:text-white">
                        {isSpecialist ? `Parent: ${getChatDetails(selectedConversation).parentName}` : getChatName(selectedConversation)}
                      </p>
                      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                        Active Conversation
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isSpecialist && selectedConversation && (
                  <Button
                    size="sm"
                    onClick={handleSendZoomLink}
                    disabled={sendingZoom}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 rounded-xl cursor-pointer"
                  >
                    {sendingZoom ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
                    Start Zoom Session
                  </Button>
                )}
                {selectedConversation && <Badge variant="success">Connected</Badge>}
              </div>
            </div>

            {selectedConversation ? (
              <>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-1 pl-1">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                      <div className="text-4xl">💬</div>
                      <p className="font-bold text-stone-700 dark:text-slate-300">Start the conversation</p>
                      <p className="text-xs text-stone-400 max-w-xs">Type a message below to coordinate care times and consultations.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      if (!msg?.id) return null; // guard against malformed messages
                      const isOwnMessage = msg.senderId === user?.id;
                      const isZoom = isZoomMessage(msg);

                      if (isZoom) {
                        return (
                          <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-md w-full rounded-3xl overflow-hidden border border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 p-5 shadow-md space-y-3">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">🎥</span>
                                <div>
                                  <p className="font-bold text-stone-900 dark:text-white text-sm">Zoom Consultation Invitation</p>
                                  <p className="text-xs text-stone-500">Scheduled clinical room</p>
                                </div>
                              </div>
                              <p className="text-xs text-stone-700 dark:text-slate-300 leading-relaxed font-medium bg-blue-50/70 dark:bg-slate-950/40 p-3 rounded-2xl">
                                Hi, please join our developmental consultation room by clicking the button below.
                              </p>
                              <Button
                                size="sm"
                                fullWidth
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                                onClick={() => window.open(msg.content, '_blank')}
                              >
                                Join Zoom Meeting
                              </Button>
                              <p className="text-[10px] text-stone-400 text-right">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={msg.id} className={`flex gap-2.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          {!isOwnMessage && (
                            <div className="mt-1">
                              <Avatar name={getChatName(selectedConversation)} size="sm" />
                            </div>
                          )}
                          <div className="max-w-[70%]">
                            <div className={`p-3.5 rounded-3xl text-sm leading-relaxed font-medium ${
                              isOwnMessage
                                ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-500/10'
                                : 'bg-stone-100 dark:bg-slate-800/70 text-stone-800 dark:text-slate-200 rounded-tl-sm'
                            }`}>
                              <p>{msg.content}</p>
                            </div>
                            <p className={`text-[10px] text-stone-400 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Error */}
                {sendError && (
                  <div className="px-4 py-2 mb-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-medium flex items-center justify-between shrink-0">
                    <span>{sendError}</span>
                    <button onClick={() => setSendError(null)} className="text-red-400 hover:text-red-700">
                      &times;
                    </button>
                  </div>
                )}
                
                {/* Message Input */}
                <form 
                  onSubmit={handleSendMessage} 
                  className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-stone-200/60 dark:border-white/8 shrink-0"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    fullWidth
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl flex items-center justify-center gap-1.5 px-6 shrink-0 cursor-pointer"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Send
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-stone-400 space-y-4 py-20 text-center">
                <div className="w-20 h-20 rounded-3xl bg-stone-100 dark:bg-slate-800/50 flex items-center justify-center">
                  <MessageSquare size={36} className="text-stone-300 dark:text-slate-600" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-stone-700 dark:text-slate-300">Select a Care Chat</h3>
                  <p className="text-sm text-stone-400 max-w-xs mt-1">Choose a conversation from the sidebar to begin coordinating care.</p>
                </div>
              </div>
            )}
          </Card>

          {/* Patient Info Panel (Specialists Only) */}
          {isSpecialist && selectedConversation && (() => {
            const details = getChatDetails(selectedConversation);
            const ids = safeParticipantIds(selectedConversation);
            const parentId = ids.find((id) => id && id !== user?.id);
            const childObj = childrenList.find((c) => c.parentId === parentId);
            const childId = childObj?.id || 'child-1';

            return (
              <Card className="lg:col-span-1 h-full flex flex-col p-5 border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl bg-[var(--surface-strong)] dark:bg-slate-900/30 overflow-y-auto">
                <h3 className="font-black text-base text-stone-900 dark:text-white mb-5 border-b border-stone-200/60 dark:border-white/8 pb-3 tracking-tight">
                  Patient Summary
                </h3>

                <div className="flex flex-col items-center text-center space-y-3 pb-5 border-b border-stone-100 dark:border-white/5">
                  <Avatar name={details.childName} image={details.avatar} size="xl" />
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                      Patient Profile
                    </span>
                    <h4 className="font-black text-stone-900 dark:text-white text-base mt-2">{details.childName}</h4>
                    {childObj && (
                      <p className="text-xs text-stone-500 mt-0.5">
                        {childObj.age ? `Age: ${childObj.age} yrs` : ''}
                        {childObj.age && childObj.gender && childObj.gender !== 'Unknown' ? ' · ' : ''}
                        {childObj.gender && childObj.gender !== 'Unknown' ? childObj.gender : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 py-5 border-b border-stone-100 dark:border-white/5">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Parent Contact</span>
                    <p className="font-bold text-stone-800 dark:text-slate-200 text-sm mt-1">{details.parentName}</p>
                    <p className="text-xs text-stone-400 mt-0.5">Role: Parent User</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Assigned Program</span>
                    <p className="text-xs text-stone-700 dark:text-slate-300 mt-1 font-semibold">Development & Autism Care Pathway</p>
                  </div>
                </div>

                <div className="pt-5 space-y-2.5">
                  <Button
                    size="sm"
                    fullWidth
                    variant="outline"
                    onClick={() => navigate(`/treatment-plan/${childId}`)}
                    className="rounded-xl font-bold"
                  >
                    📋 View Treatment Plan
                  </Button>
                  <Button
                    size="sm"
                    fullWidth
                    variant="primary"
                    onClick={() => navigate(`/${user?.role}/patients/${childId}`)}
                    className="rounded-xl font-bold bg-indigo-600 text-white"
                  >
                    🔎 View Patient Profile
                  </Button>
                </div>
              </Card>
            );
          })()}
        </div>
      </div>
    </MainLayout>
  );
};
