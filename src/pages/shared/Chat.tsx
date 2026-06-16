import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { chatServiceAPI, type ChatConversation, type ChatMessage } from '../../services/api/chatService';
import { bookingService } from '../../services/api/bookings';
import { useAuth } from '../../context/useAuth';
import { MessageSquare, Send, Loader2, RefreshCw, ChevronLeft, Phone, Video, Paperclip, Mic, Smile } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Participant info derived from a chat object */
interface ParticipantInfo {
  id: string;
  name: string;
  role: string; // 'Doctor' | 'Therapist' | 'Parent' | 'Specialist'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Given the raw participantNames map and the current user's ID, return all OTHER participants. */
const getOtherParticipants = (chat: ChatConversation, myId: string): ParticipantInfo[] => {
  try {
    const names = chat.participantNames ?? {};
    const ids = Array.isArray(chat.participantIds) ? chat.participantIds : [];
    const others: ParticipantInfo[] = [];

    for (const id of ids) {
      if (!id || id === myId) continue;
      const rawName = names[id] || '';
      if (!rawName) continue;

      // Detect role from the name string (backend may embed role prefix)
      let role = 'Specialist';
      const lower = rawName.toLowerCase();
      if (lower.startsWith('dr.') || lower.includes('doctor')) role = 'Doctor';
      else if (lower.includes('therapist')) role = 'Therapist';
      else if (lower.includes('parent')) role = 'Parent';

      others.push({ id, name: rawName, role });
    }

    // If no names from participantIds, iterate the names map directly
    if (others.length === 0) {
      for (const [id, rawName] of Object.entries(names)) {
        if (!id || id === myId || !rawName) continue;
        let role = 'Specialist';
        const lower = rawName.toLowerCase();
        if (lower.startsWith('dr.') || lower.includes('doctor')) role = 'Doctor';
        else if (lower.includes('therapist')) role = 'Therapist';
        else if (lower.includes('parent')) role = 'Parent';
        others.push({ id, name: rawName, role });
      }
    }

    return others;
  } catch {
    return [];
  }
};

/** Return the primary other participant (first one found). */
const getPrimaryOther = (chat: ChatConversation, myId: string): ParticipantInfo => {
  const others = getOtherParticipants(chat, myId);
  if (others.length > 0) return others[0];
  return { id: '', name: 'Conversation', role: 'Specialist' };
};

const formatTime = (ts: string) => {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
};

const isZoomMsg = (msg: ChatMessage) =>
  msg.messageType === 'zoom-link' ||
  (typeof msg.content === 'string' && msg.content.includes('zoom.us'));

// ─── Component ────────────────────────────────────────────────────────────────

export const Chat = () => {
  const { user } = useAuth();
  const { clearChatUnread } = useNotification();
  const location = useLocation();
  const myId = String(user?.id ?? '');

  const [conversations, setConversations]   = useState<ChatConversation[]>([]);
  const [selected, setSelected]             = useState<ChatConversation | null>(null);
  const [messages, setMessages]             = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage]         = useState('');
  const [sending, setSending]               = useState(false);
  const [sendError, setSendError]           = useState<string | null>(null);
  const [loadingChats, setLoadingChats]     = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  // ─── Fetch conversations ─────────────────────────────────────────────────

  const fetchConversations = useCallback(async (autoSelect = false) => {
    setLoadingChats(true);
    try {
      const raw = await chatServiceAPI.getMyChats();
      let data = Array.isArray(raw) ? raw : [];

      // Enrich with real linked users from bookings
      try {
        const bookings = await bookingService.getMyBookings();
        const contactMap = new Map<string, ParticipantInfo>();

        bookings.forEach(b => {
          // Skip pending/rejected cases (Case Approval Workflow)
          const status = (b.status || '').toLowerCase();
          if (status === 'pending' || status === 'rejected') return;

          // Add specialist if they are not the current user
          if (b.specialistId && String(b.specialistId) !== myId && b.specialistName) {
            contactMap.set(String(b.specialistId), {
              id: String(b.specialistId),
              name: b.specialistName,
              role: String(b.specialistType || 'Specialist').replace(/^./, c => c.toUpperCase())
            });
          }
          // Add parent if they are not the current user
          if (b.parentId && String(b.parentId) !== myId && b.parentName) {
            contactMap.set(String(b.parentId), {
              id: String(b.parentId),
              name: b.parentName,
              role: 'Parent'
            });
          }
        });

        // Patch existing chats with real names if missing
        data = data.map(chat => {
          const patchedChat = { ...chat };
          patchedChat.participantNames = { ...patchedChat.participantNames };
          const ids = Array.isArray(patchedChat.participantIds) ? patchedChat.participantIds : [];
          ids.forEach(id => {
            if (id !== myId && contactMap.has(id)) {
              patchedChat.participantNames![id] = contactMap.get(id)!.name;
              // Add a suffix to role so getOtherParticipants parses it correctly if we want
              if (contactMap.get(id)!.role === 'Doctor' && !patchedChat.participantNames![id].toLowerCase().includes('dr.')) {
                patchedChat.participantNames![id] = 'Dr. ' + patchedChat.participantNames![id];
              } else if (contactMap.get(id)!.role === 'Therapist') {
                patchedChat.participantNames![id] = patchedChat.participantNames![id] + ' (Therapist)';
              } else if (contactMap.get(id)!.role === 'Parent') {
                patchedChat.participantNames![id] = patchedChat.participantNames![id] + ' (Parent)';
              }
            }
          });
          return patchedChat;
        });

        // Add dummy chats for contacts we have no chat with
        contactMap.forEach((info, contactId) => {
          const hasChat = data.some(c => Array.isArray(c.participantIds) && c.participantIds.includes(contactId));
          if (!hasChat) {
            data.push({
              id: `new-${contactId}`,
              participantIds: [myId, contactId],
              participantNames: {
                [contactId]: info.role === 'Doctor' && !info.name.toLowerCase().includes('dr.') 
                  ? `Dr. ${info.name}` 
                  : `${info.name} (${info.role})`
              },
              lastMessage: undefined,
              lastUpdated: new Date().toISOString(),
              unreadCount: 0,
              createdAt: new Date().toISOString()
            });
          }
        });

      } catch (err) {
        console.warn('[Chat] Failed to fetch bookings for contacts:', err);
      }

      // ── Filter chats based on role strictly ──
      const currentUserRole = user?.role?.toLowerCase() || '';
      data = data.filter(chat => {
        const others = getOtherParticipants(chat, myId);
        // Prevent self-chat or empty chat
        if (others.length === 0) return false;

        const otherRole = others[0].role.toLowerCase();

        if (currentUserRole === 'parent') {
          return ['doctor', 'therapist', 'specialist'].includes(otherRole);
        } else if (currentUserRole === 'doctor') {
          return ['therapist', 'parent', 'specialist'].includes(otherRole);
        } else if (currentUserRole === 'therapist') {
          return ['doctor', 'parent', 'specialist'].includes(otherRole);
        }
        return true;
      });

      setConversations(data);

      // Auto-select from navigation state
      const state = location.state as { targetChatId?: string } | null;
      if (state?.targetChatId) {
        const target = data.find(c => c.id === state.targetChatId);
        if (target) { setSelected(target); return; }
      }

      // Auto-select first conversation on initial load
      if (autoSelect && data.length > 0) {
        setSelected(data[0]);
      }
    } catch (err) {
      console.error('[Chat] fetchConversations error:', err);
    } finally {
      setLoadingChats(false);
    }
  }, [myId, location.state]);

  // ─── Fetch messages ──────────────────────────────────────────────────────

  const fetchMessages = useCallback(async (conv: ChatConversation) => {
    if (!conv?.id || String(conv.id).startsWith('new-')) return;
    setLoadingMessages(true);
    try {
      const raw = await chatServiceAPI.getMessages(conv.id);
      const data = Array.isArray(raw) ? raw : [];
      setMessages(data);
      
      if (conv.unreadCount && conv.unreadCount > 0) {
        await chatServiceAPI.markChatAsRead(conv.id);
        if (clearChatUnread) {
          clearChatUnread(conv.unreadCount);
        }
        conv.unreadCount = 0;
      }
    } catch (err) {
      console.error('[Chat] fetchMessages error:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [clearChatUnread]);

  // Initial load — auto-select first conversation
// eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchConversations(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages when selected conversation changes; poll every 5 s
  useEffect(() => {
    if (!selected) return;
// eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMessages(selected);
    const interval = setInterval(() => void fetchMessages(selected), 5000);
    return () => clearInterval(interval);
  }, [selected, fetchMessages]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Send message ────────────────────────────────────────────────────────

  const handleSendCall = useCallback(async (type: 'audio' | 'video') => {
    if (!selected?.id) { setSendError('No conversation selected.'); return; }
    
    setSending(true);
    setSendError(null);

    try {
      let activeChatId = selected.id;

      if (activeChatId.startsWith('new-')) {
        const contactId = activeChatId.replace('new-', '');
        const newChat = await chatServiceAPI.startChat(contactId);
        activeChatId = newChat.id;
        setSelected(newChat);
        void fetchConversations();
      }

      const content = `Incoming ${type} call... Join here: https://zoom.us/j/123456789`;
      await chatServiceAPI.sendMessage(activeChatId, content, 'call');
      await fetchMessages({ ...selected, id: activeChatId });
    } catch (err: unknown) {
      const error = err as { response?: { status?: number, data?: { message?: string } }; message?: string };
      setSendError(error?.response?.data?.message || error?.message || 'Failed to start call.');
    } finally {
      setSending(false);
    }
  }, [selected, fetchConversations, fetchMessages]);

  const handleSend = useCallback(async () => {
    const content = newMessage.trim();

    // Guard: need content AND a selected chat
    if (!content) { setSendError('Please type a message first.'); return; }
    if (!selected?.id) { setSendError('No conversation selected.'); return; }

    console.log('[Chat] Sending message:', { chatId: selected.id, content });

    setNewMessage('');
    setSending(true);
    setSendError(null);

    try {
      let activeChatId = selected.id;

      // If it's a new uninitialized chat, start it first
      if (activeChatId.startsWith('new-')) {
        const contactId = activeChatId.replace('new-', '');
        const newChat = await chatServiceAPI.startChat(contactId);
        activeChatId = newChat.id;
        setSelected(newChat); // update active chat
        // We also need to refresh the conversation list to get the real chat ID
        void fetchConversations();
      }

      const result = await chatServiceAPI.sendMessage(activeChatId, content, 'text');
      console.log('[Chat] Send success:', result);

      // Immediately re-fetch so the sent message appears without waiting for next poll
      await fetchMessages({ ...selected, id: activeChatId });
    } catch (err: unknown) {
      const error = err as { response?: { status?: number, data?: { message?: string } }; message?: string };
      const msg = error?.response?.data?.message || error?.message || 'Failed to send. Please try again.';
      console.error('[Chat] Send error:', err);
      setSendError(msg);
      // Restore the message so the user can retry
      setNewMessage(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessage, selected, fetchMessages]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // ─── Derived data ────────────────────────────────────────────────────────

  // Visible conversations: must have at least one other participant with a name
  const visibleConvs = conversations.filter(conv => {
    const others = getOtherParticipants(conv, myId);
    return others.length > 0;
  });

  const selectedOther = selected ? getPrimaryOther(selected, myId) : null;

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5" style={{ height: 'calc(100vh - 7rem)' }}>

        {/* ── LEFT PANEL: Conversation List ──────────────────────────────── */}
        <Card className={`col-span-1 flex-col h-full lg:max-h-full p-4 border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl bg-[var(--surface-strong)] dark:bg-slate-900/10 overflow-hidden ${selected ? 'hidden lg:flex max-h-[40vh]' : 'flex'}`}>
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-widest">
              Messages
            </h2>
            <button
              onClick={() => void fetchConversations(false)}
              className="p-1.5 rounded-xl text-stone-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
              title="Refresh conversations"
            >
              <RefreshCw size={14} className={loadingChats ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {loadingChats ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={20} className="animate-spin text-indigo-500" />
              </div>
            ) : visibleConvs.length === 0 ? (
              <div className="text-center mt-10 px-3 space-y-2">
                <MessageSquare size={28} className="mx-auto text-stone-300" />
                <p className="text-xs text-stone-400 font-medium">No conversations available yet.</p>
              </div>
            ) : (
              visibleConvs.map(conv => {
                const other = getPrimaryOther(conv, myId);
                const isSelected = selected?.id === conv.id;
                const lastMsg = conv.lastMessage;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelected(conv)}
                    className={`w-full text-left p-3 rounded-2xl transition-all border ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800'
                        : 'bg-white dark:bg-slate-800 border-transparent hover:border-stone-200 dark:hover:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={other.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        {/* Full real name — never "Unknown" */}
                        <p className="text-sm font-bold text-stone-900 dark:text-white truncate">
                          {other.name}
                        </p>
                        {/* Real role label */}
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest truncate">
                          {other.role}
                        </p>
                        {/* Last message preview */}
                        {lastMsg && (
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <p className="text-xs text-stone-500 dark:text-slate-400 truncate flex-1">
                              {isZoomMsg(lastMsg) ? '🎥 Zoom link' : lastMsg.content}
                            </p>
                            <span className="text-[10px] text-stone-400 shrink-0 ml-1">
                              {formatTime(lastMsg.timestamp)}
                            </span>
                          </div>
                        )}
                      </div>
                      {(conv.unreadCount ?? 0) > 0 && (
                        <span className="mt-0.5 h-5 w-5 rounded-full bg-indigo-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* ── RIGHT PANEL: Message Thread ────────────────────────────────── */}
        <Card className={`col-span-1 lg:col-span-3 flex-col h-full p-5 border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl bg-[var(--surface-strong)] dark:bg-slate-900/10 overflow-hidden ${selected ? 'flex' : 'hidden lg:flex'}`}>
          {selected && selectedOther ? (
            <>
              {/* Header — real name + role always */}
              <div className="flex items-center gap-3 pb-4 border-b border-stone-200/60 dark:border-white/8 mb-4 shrink-0">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setSelected(null)}
                  className="lg:hidden p-2 -ml-2 rounded-xl text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Back to conversations"
                >
                  <ChevronLeft size={24} />
                </button>
                <Avatar name={selectedOther.name} size="md" />
                <div className="flex-1">
                  {/* NEVER show "Unknown" or "Specialist" here */}
                  <p className="font-black text-stone-900 dark:text-white text-base leading-tight">
                    {selectedOther.name}
                  </p>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                    {selectedOther.role}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (!selected) return;
                      handleSendCall('audio');
                    }}
                    className="p-2 rounded-xl text-stone-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    title="Start Audio Call"
                  >
                    <Phone size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      if (!selected) return;
                      handleSendCall('video');
                    }}
                    className="p-2 rounded-xl text-stone-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    title="Start Video Call"
                  >
                    <Video size={20} />
                  </button>
                </div>

              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto space-y-3 px-1 mb-4 min-h-0">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={24} className="animate-spin text-indigo-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <div className="text-4xl">💬</div>
                    <p className="font-bold text-stone-700 dark:text-slate-300">No messages yet</p>
                    <p className="text-xs text-stone-400">Type below to start the conversation.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    if (!msg?.id) return null;
                    // Compare as strings — backend may return numeric IDs as strings
                    const isOwn = String(msg.senderId) === myId;
                    const zoom  = isZoomMsg(msg);

                    if (zoom) {
                      let zoomUrl = (msg as unknown as { zoomLink?: string }).zoomLink;
                      if (!zoomUrl && typeof msg.content === 'string') {
                        const match = msg.content.match(/https?:\/\/[^\s]+/);
                        zoomUrl = match ? match[0] : msg.content;
                      } else if (!zoomUrl) {
                        zoomUrl = '';
                      }
                      
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-sm rounded-3xl border border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 p-4 shadow-md space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{msg.messageType === 'call' ? '📞' : '🎥'}</span>
                              <div>
                                <p className="font-bold text-stone-900 dark:text-white text-sm">{msg.messageType === 'call' ? 'Incoming Call' : 'Zoom Consultation'}</p>
                                <p className="text-xs text-stone-400">{formatTime(msg.timestamp)}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => window.open(zoomUrl, '_blank', 'noopener,noreferrer')}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2 rounded-xl transition-colors"
                            >
                              Join
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex gap-2.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        {!isOwn && (
                          <div className="mt-1 shrink-0">
                            <Avatar name={msg.senderName || selectedOther.name} size="sm" />
                          </div>
                        )}
                        <div className="max-w-[70%] relative group">
                          <div className={`px-4 py-3 rounded-3xl text-sm leading-relaxed font-medium ${
                            isOwn
                              ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-500/10'
                              : 'bg-stone-100 dark:bg-slate-800/70 text-stone-800 dark:text-slate-200 rounded-tl-sm'
                          }`}>
                            {msg.messageType === 'audio' ? (
                                <div className="flex items-center gap-2">
                                  <button className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/20 dark:hover:bg-white/30 transition-colors"><Mic size={16}/></button>
                                  <div className="h-1 w-24 bg-black/10 dark:bg-white/30 rounded-full overflow-hidden"><div className="h-full bg-current w-1/3"></div></div>
                                  <span className="text-xs font-bold">0:05</span>
                                </div>
                            ) : msg.messageType === 'file' ? (
                                <div className="flex items-center gap-2">
                                  <Paperclip size={16} />
                                  <span className="underline cursor-pointer">{msg.content || 'Attached File'}</span>
                                </div>
                            ) : msg.content}
                          </div>
                          
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className={`absolute -bottom-2 ${isOwn ? 'right-4' : 'left-4'} bg-white dark:bg-slate-700 rounded-full px-1.5 py-0.5 text-xs shadow border border-slate-100 dark:border-slate-600 flex gap-1 z-10`}>
                              {Object.values(msg.reactions).map((r, i) => <span key={i}>{r}</span>)}
                            </div>
                          )}

                          <button className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 rounded-full shadow-md border border-slate-100 dark:border-slate-700 z-10`} title="React">
                            <Smile size={14} />
                          </button>

                          <p className={`text-[10px] text-stone-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Send error */}
              {sendError && (
                <div className="mb-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs font-medium flex items-center justify-between shrink-0">
                  <span>{sendError}</span>
                  <button onClick={() => setSendError(null)} className="ml-2 font-bold hover:opacity-70">✕</button>
                </div>
              )}

              {/* Input bar */}
              <form
                onSubmit={handleFormSubmit}
                className="flex items-center gap-2 pt-4 border-t border-stone-200/60 dark:border-white/8 shrink-0 relative"
              >
                <button type="button" className="p-2 text-stone-400 hover:text-indigo-600 transition-colors" title="Attach file">
                  <Paperclip size={20} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${selectedOther.name}…`}
                  disabled={sending}
                  className="flex-1 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-stone-400 disabled:opacity-50 transition-shadow"
                />
                <button type="button" className="p-2 text-stone-400 hover:text-indigo-600 transition-colors" title="Record Voice Note">
                  <Mic size={20} />
                </button>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-2xl px-5 py-3 transition-colors shrink-0 cursor-pointer"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send
                </button>
              </form>
            </>
          ) : (
            /* No conversation selected */
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-stone-400">
              <div className="w-20 h-20 rounded-3xl bg-stone-100 dark:bg-slate-800/50 flex items-center justify-center">
                <MessageSquare size={36} className="text-stone-300 dark:text-slate-600" />
              </div>
              <div>
                <h3 className="font-black text-xl text-stone-700 dark:text-slate-300">
                  {loadingChats ? 'Loading conversations…' : 'Select a conversation'}
                </h3>
                <p className="text-sm text-stone-400 max-w-xs mt-1">
                  {!loadingChats && visibleConvs.length === 0
                    ? 'No conversations available yet.'
                    : 'Choose a conversation from the sidebar to begin.'}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
};
