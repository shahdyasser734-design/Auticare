import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

export const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingZoom, setSendingZoom] = useState(false);

  const [childrenList, setChildrenList] = useState<Child[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSpecialist = user?.role === 'doctor' || user?.role === 'therapist';

  const fetchConversations = async () => {
    try {
      const data = await chatServiceAPI.getMyChats();
      setConversations(data);
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const list = await childrenService.getChildren();
      setChildrenList(list);
    } catch (err) {
      console.warn('Failed to load patient profiles:', err);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;
    try {
      const data = await chatServiceAPI.getMessages(selectedConversation.id);
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
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
      
      // Setup polling for real-time style feel
      const interval = setInterval(() => {
        void fetchMessages();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    setSending(true);
    try {
      const msg = await chatServiceAPI.sendMessage(
        selectedConversation.id,
        newMessage.trim()
      );
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
      
      // Update last message in local state
      setConversations((current) =>
        current.map((c) =>
          c.id === selectedConversation.id ? { ...c, lastMessage: msg } : c
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSendZoomLink = async () => {
    if (!selectedConversation) return;
    setSendingZoom(true);
    try {
      const meetingId = Math.floor(1000000000 + Math.random() * 9000000000);
      const link = `https://zoom.us/j/${meetingId}`;
      await chatServiceAPI.sendZoomLink(selectedConversation.id, link);
      await fetchMessages();
      await fetchConversations();
    } catch (err) {
      console.error('Failed to send Zoom link:', err);
    } finally {
      setSendingZoom(false);
    }
  };

  const getChatName = (chat: ChatConversation): string => {
    const otherParticipants = Object.entries(chat.participantNames || {})
      .filter(([, name]) => name !== user?.name && name !== 'You')
      .map(([, name]) => name);
    return otherParticipants.length > 0 ? otherParticipants[0] : 'Specialist';
  };

  const getChatDetails = (chat: ChatConversation) => {
    const parentId = chat.participantIds.find((id) => id !== user?.id);
    const parentName = parentId ? (chat.participantNames[parentId] || 'Parent') : 'Parent';
    const child = childrenList.find((c) => c.parentId === parentId);
    return {
      parentName: parentName === 'You' ? 'Sarah Johnson' : parentName,
      childName: child ? child.name : 'Samira Ali',
      avatar: child ? child.profileImage : undefined,
      status: child ? 'Active' : 'Pending',
    };
  };

  const getChatSpecialty = (chat: ChatConversation): string => {
    const name = getChatName(chat).toLowerCase();
    if (name.includes('dr.') || name.includes('doctor')) return 'Doctor';
    if (name.includes('therapist') || name.includes('anna') || name.includes('therapy')) return 'Therapist';
    return isSpecialist ? 'Parent Contact' : 'Assigned Care Specialist';
  };

  const getLastMessageTime = (chat: ChatConversation): string => {
    if (!chat.lastMessage?.timestamp) return '';
    const date = new Date(chat.lastMessage.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString();
  };

  // Only show conversations with doctors/therapists (not self-chats)
  const filteredConversations = conversations.filter((conv) => {
    const otherNames = Object.entries(conv.participantNames || {})
      .filter(([, name]) => name !== user?.name && name !== 'You')
      .map(([, name]) => name.toLowerCase());
    // Keep if the other participant appears to be a specialist (has Dr., Therapist, or doctor/therapist role)
    return otherNames.some(
      (name) =>
        name.includes('dr.') ||
        name.includes('doctor') ||
        name.includes('therapist') ||
        name.includes('specialist')
    ) || otherNames.length > 0; // fallback: show any conversation with another person
  });

  const isZoomMessage = (msg: ChatMessage) => {
    return msg.messageType === 'zoom-link' || msg.content.includes('zoom.us');
  };

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-8rem)]">
        {/* Conversations List Panel */}
        <Card className="lg:col-span-1 h-full overflow-hidden flex flex-col p-4 border border-slate-200 dark:border-white/10 shadow-lg rounded-3xl bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="text-primary-600" />
              Care Chats
            </h2>
            <Badge variant="secondary">Active</Badge>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500 text-sm">No care chats started yet.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
              const isActiveConv = selectedConversation?.id === conv.id;
              const details = getChatDetails(conv);
              const displayName = isSpecialist ? details.childName : getChatName(conv);
              const displaySubtitle = isSpecialist ? `Parent: ${details.parentName}` : getChatSpecialty(conv);
              
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center gap-3 border ${
                    isActiveConv
                      ? 'bg-primary-600 text-white border-primary-500 shadow-md shadow-primary-500/20'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-150 dark:border-white/5 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <Avatar name={displayName} image={isSpecialist ? details.avatar : undefined} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="font-bold text-sm truncate">{displayName}</p>
                        {isSpecialist && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                            {details.status}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] shrink-0 ${isActiveConv ? 'opacity-70' : 'text-slate-400'}`}>
                        {getLastMessageTime(conv)}
                      </span>
                    </div>
                    <p className={`text-xs font-semibold ${isActiveConv ? 'opacity-85' : 'text-slate-500 dark:text-slate-400'}`}>
                      {displaySubtitle}
                    </p>
                    <p className={`text-xs truncate mt-0.5 ${isActiveConv ? 'opacity-70' : 'text-slate-500'}`}>
                      {conv.lastMessage?.content || 'Consultation started'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
          </div>
        </Card>

        {/* Messaging Area Panel & Patient Info Sidebar Container */}
        <div className={`lg:col-span-3 grid grid-cols-1 ${isSpecialist && selectedConversation ? 'lg:grid-cols-3' : ''} gap-6 h-full`}>
          <Card className={`${isSpecialist && selectedConversation ? 'lg:col-span-2' : 'lg:col-span-3'} h-full flex flex-col p-6 border border-slate-200 dark:border-white/10 shadow-lg rounded-3xl`}>
            {selectedConversation ? (
              <>
                {/* Active Conversation Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-150 dark:border-white/5 mb-4 shrink-0">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      name={isSpecialist ? getChatDetails(selectedConversation).childName : getChatName(selectedConversation)} 
                      image={isSpecialist ? getChatDetails(selectedConversation).avatar : undefined} 
                      size="lg" 
                    />
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        {isSpecialist ? getChatDetails(selectedConversation).childName : getChatName(selectedConversation)}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {isSpecialist ? `Parent: ${getChatDetails(selectedConversation).parentName}` : getChatSpecialty(selectedConversation)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSpecialist && (
                      <Button
                        size="sm"
                        onClick={handleSendZoomLink}
                        disabled={sendingZoom}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 rounded-xl cursor-pointer"
                      >
                        {sendingZoom ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
                        Share Zoom Room
                      </Button>
                    )}
                    <Badge variant="success">Connected</Badge>
                  </div>
                </div>

                {/* Chat Message Stream */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-1 pl-1">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                      <div className="text-4xl">💬</div>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Start the conversation</p>
                      <p className="text-xs text-slate-500 max-w-xs">Type a message below to coordinate care times and consultations.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwnMessage = msg.senderId === user?.id;
                      const isZoom = isZoomMessage(msg);

                      if (isZoom) {
                        return (
                          <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-md w-full rounded-3xl overflow-hidden border border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 p-5 shadow-md shadow-blue-500/5 space-y-3">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">🎥</span>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">Zoom Consultation Invitation</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled clinical room</p>
                                </div>
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-blue-100/50 dark:bg-slate-950/40 p-3 rounded-2xl">
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
                              <p className="text-[10px] text-slate-400 text-right">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isOwnMessage && (
                            <div className="mt-1">
                              <Avatar name={getChatName(selectedConversation)} size="sm" />
                            </div>
                          )}
                          <div className="max-w-[70%]">
                            <div
                              className={`p-4 rounded-3xl text-sm leading-relaxed font-medium ${
                                isOwnMessage
                                  ? 'bg-primary-600 text-white rounded-tr-sm shadow-md shadow-primary-500/10'
                                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                              }`}
                            >
                              <p>{msg.content}</p>
                            </div>
                            <p className={`text-[10px] text-slate-400 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Typing Panel */}
                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-150 dark:border-white/5 shrink-0">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') void handleSendMessage();
                    }}
                    placeholder="Type your message here..."
                    disabled={sending}
                    fullWidth
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim() || sending}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl flex items-center justify-center gap-1.5 px-6 shrink-0 cursor-pointer"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Send
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 py-20 text-center">
                <span className="text-6xl animate-bounce">💬</span>
                <h3 className="font-bold text-xl text-slate-700 dark:text-slate-300">Select a Care Chat</h3>
                <p className="text-sm text-slate-500 max-w-xs">Select a therapist or doctor consultation chat from the sidebar to coordinate your care program.</p>
              </div>
            )}
          </Card>

          {/* Specialist Patient Information Panel */}
          {isSpecialist && selectedConversation && (() => {
            const details = getChatDetails(selectedConversation);
            const parentId = selectedConversation.participantIds.find((id) => id !== user?.id);
            const childObj = childrenList.find((c) => c.parentId === parentId);
            const childId = childObj ? childObj.id : 'child-1';

            return (
              <Card className="lg:col-span-1 h-full flex flex-col p-6 border border-slate-200 dark:border-white/10 shadow-lg rounded-3xl bg-slate-50/50 dark:bg-slate-900/30 overflow-y-auto">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 border-b pb-3">Patient Portal Summary</h3>
                
                {/* Patient Child Avatar & Info */}
                <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-slate-200 dark:border-white/5">
                  <Avatar name={details.childName} image={details.avatar} size="xl" />
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-primary-100 text-primary-800 dark:bg-primary-950/40 dark:text-primary-300 px-2 py-0.5 rounded-full">
                      Patient Profile
                    </span>
                    <h4 className="font-black text-slate-900 dark:text-white text-base mt-2">{details.childName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Age: {childObj?.age || 4} yrs · {childObj?.gender || 'Female'}</p>
                  </div>
                </div>

                {/* Parent Contact Details */}
                <div className="space-y-4 py-6 border-b border-slate-200 dark:border-white/5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Parent Contact</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1">Parent: {details.parentName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Role: Parent User</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Assigned Program</span>
                    <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 font-semibold">Development &amp; Autism Care Pathway</p>
                  </div>
                </div>

                {/* Action Links */}
                <div className="pt-6 space-y-3">
                  <Button
                    size="sm"
                    fullWidth
                    variant="outline"
                    onClick={() => navigate(`/treatment-plan/${childId}`)}
                    className="rounded-xl font-bold border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
                  >
                    📋 View Treatment Plan
                  </Button>
                  <Button
                    size="sm"
                    fullWidth
                    variant="primary"
                    onClick={() => navigate(`/${user?.role}/patients/${childId}`)}
                    className="rounded-xl font-bold bg-primary-600 text-white"
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
