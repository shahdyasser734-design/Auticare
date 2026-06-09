import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { chatServiceAPI, type ChatConversation, type ChatMessage } from '../../services/api/chatService';
import { useAuth } from '../../context/useAuth';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return the name of the OTHER participant (not the current user) */
const getOtherName = (chat: ChatConversation, myId: string): string => {
  try {
    const names = chat.participantNames ?? {};
    const ids = chat.participantIds ?? [];
    const otherId = ids.find(id => id && id !== myId);
    if (otherId && names[otherId]) return names[otherId];
    // Fallback: first name that is not our own
    const entry = Object.entries(names).find(([id, n]) => id !== myId && n);
    return entry ? entry[1] : 'Unknown';
  } catch {
    return 'Unknown';
  }
};

/** Return the other participant's ID */
const getOtherId = (chat: ChatConversation, myId: string): string => {
  try {
    const ids = chat.participantIds ?? [];
    return ids.find(id => id && id !== myId) ?? '';
  } catch {
    return '';
  }
};

const formatTime = (ts: string) => {
  try {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
};

const isZoomMsg = (msg: ChatMessage) =>
  msg.messageType === 'zoom-link' || (msg.content ?? '').includes('zoom.us');

// ─── Component ────────────────────────────────────────────────────────────────

export const Chat = () => {
  const { user, activeChildId } = useAuth();
  const location = useLocation();
  const myId = user?.id ?? '';
  const isSpecialist = user?.role === 'doctor' || user?.role === 'therapist';

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selected, setSelected]           = useState<ChatConversation | null>(null);
  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage]       = useState('');
  const [sending, setSending]             = useState(false);
  const [sendError, setSendError]         = useState<string | null>(null);
  const [loadingChats, setLoadingChats]   = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    setLoadingChats(true);
    try {
      const data = await chatServiceAPI.getMyChats();
      const safe = Array.isArray(data) ? data : [];
      setConversations(safe);

      // Auto-select from navigation state
      const state = location.state as { targetChatId?: string } | null;
      if (state?.targetChatId) {
        const target = safe.find(c => c.id === state.targetChatId);
        if (target) { setSelected(target); return; }
      }

      // Auto-select first conversation
      if (safe.length > 0 && !selected) {
        setSelected(safe[0]);
      }
    } catch (err) {
      console.error('[Chat] Failed to load chats:', err);
    } finally {
      setLoadingChats(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMessages = useCallback(async (conv: ChatConversation) => {
    try {
      const data = await chatServiceAPI.getMessages(conv.id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Chat] Failed to load messages:', err);
    }
  }, []);

  // Initial load
  useEffect(() => { void fetchConversations(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload chats when child switches (parent context)
  useEffect(() => {
    if (activeChildId) void fetchConversations();
  }, [activeChildId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages when conversation changes; poll every 5 s
  useEffect(() => {
    if (!selected) return;
    void fetchMessages(selected);
    const interval = setInterval(() => void fetchMessages(selected), 5000);
    return () => clearInterval(interval);
  }, [selected, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Send ────────────────────────────────────────────────────────────────────

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = newMessage.trim();
    if (!content || !selected?.id) return;

    setNewMessage('');
    setSending(true);
    setSendError(null);

    try {
      await chatServiceAPI.sendMessage(selected.id, content, 'text');
      // Immediately refetch messages so the sent message appears
      await fetchMessages(selected);
      await fetchConversations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send message.';
      setSendError(msg);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // ─── Derived display data ────────────────────────────────────────────────────

  // Only show conversations that have another participant
  const visibleConvs = conversations.filter(conv => {
    try { return (conv.participantIds ?? []).some(id => id && id !== myId); }
    catch { return false; }
  });

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 h-[calc(100vh-7rem)]">

        {/* ── LEFT PANEL: Conversation List ──────────────────────────────── */}
        <Card className="col-span-1 hidden lg:flex flex-col h-full p-4 border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl bg-[var(--surface-strong)] dark:bg-slate-900/10 overflow-hidden">
          <h2 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-widest mb-4 px-1 shrink-0">
            Conversations
          </h2>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {loadingChats ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={20} className="animate-spin text-indigo-500" />
              </div>
            ) : visibleConvs.length === 0 ? (
              <p className="text-xs text-stone-400 text-center mt-10 px-2">
                No conversations yet.
                {!isSpecialist && <span className="block mt-1">Book a specialist to start chatting.</span>}
              </p>
            ) : (
              visibleConvs.map(conv => {
                const otherName = getOtherName(conv, myId);
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
                    <div className="flex items-center gap-3">
                      <Avatar name={otherName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-stone-900 dark:text-white truncate">{otherName}</p>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest truncate">
                          {isSpecialist ? 'Parent' : 'Specialist'}
                        </p>
                        {lastMsg && (
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <p className="text-xs text-stone-500 dark:text-slate-400 truncate flex-1">
                              {isZoomMsg(lastMsg) ? '🎥 Zoom link' : lastMsg.content}
                            </p>
                            <span className="text-[10px] text-stone-400 shrink-0">
                              {formatTime(lastMsg.timestamp)}
                            </span>
                          </div>
                        )}
                      </div>
                      {(conv.unreadCount ?? 0) > 0 && (
                        <span className="h-5 w-5 rounded-full bg-indigo-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
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
        <Card className="col-span-1 lg:col-span-3 flex flex-col h-full p-5 border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl bg-[var(--surface-strong)] dark:bg-slate-900/10 overflow-hidden">
          {selected ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-stone-200/60 dark:border-white/8 mb-4 shrink-0">
                <Avatar name={getOtherName(selected, myId)} size="md" />
                <div>
                  <p className="font-black text-stone-900 dark:text-white text-base">
                    {getOtherName(selected, myId)}
                  </p>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                    {isSpecialist ? 'Parent' : 'Specialist'}
                  </p>
                </div>

                {/* Mobile: conversation selector */}
                <div className="lg:hidden ml-auto">
                  <select
                    className="bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-900 dark:text-white text-sm rounded-xl px-3 py-2 font-bold outline-none"
                    value={selected?.id ?? ''}
                    onChange={e => {
                      const conv = conversations.find(c => c.id === e.target.value);
                      if (conv) setSelected(conv);
                    }}
                  >
                    {visibleConvs.map(conv => (
                      <option key={conv.id} value={conv.id}>
                        {getOtherName(conv, myId)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 px-1 mb-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <div className="text-4xl">💬</div>
                    <p className="font-bold text-stone-700 dark:text-slate-300">Start the conversation</p>
                    <p className="text-xs text-stone-400">Type a message below to coordinate care.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    if (!msg?.id) return null;
                    const isOwn = msg.senderId === myId || msg.senderId === String(myId);
                    const zoom  = isZoomMsg(msg);

                    if (zoom) {
                      const zoomUrl = msg.zoomLink || msg.content;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-sm rounded-3xl border border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 p-4 shadow-md space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🎥</span>
                              <div>
                                <p className="font-bold text-stone-900 dark:text-white text-sm">Zoom Consultation</p>
                                <p className="text-xs text-stone-400">{formatTime(msg.timestamp)}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              fullWidth
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                              onClick={() => window.open(zoomUrl, '_blank', 'noopener,noreferrer')}
                            >
                              Join Zoom Meeting
                            </Button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex gap-2.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        {!isOwn && (
                          <div className="mt-1">
                            <Avatar name={msg.senderName || getOtherName(selected, myId)} size="sm" />
                          </div>
                        )}
                        <div className="max-w-[70%]">
                          <div className={`p-3.5 rounded-3xl text-sm leading-relaxed font-medium ${
                            isOwn
                              ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-500/10'
                              : 'bg-stone-100 dark:bg-slate-800/70 text-stone-800 dark:text-slate-200 rounded-tl-sm'
                          }`}>
                            {msg.content}
                          </div>
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

              {/* Error */}
              {sendError && (
                <div className="mb-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs font-medium flex items-center justify-between shrink-0">
                  <span>{sendError}</span>
                  <button onClick={() => setSendError(null)} className="ml-2 hover:opacity-70">✕</button>
                </div>
              )}

              {/* Input */}
              <form onSubmit={e => { e.preventDefault(); void handleSend(); }} className="flex gap-2 pt-4 border-t border-stone-200/60 dark:border-white/8 shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message…"
                  disabled={sending}
                  className="flex-1 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-slate-800 text-stone-900 dark:text-white text-sm px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-stone-400 disabled:opacity-50"
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-2xl flex items-center gap-1.5 px-5 shrink-0 cursor-pointer"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send
                </Button>
              </form>
            </>
          ) : (
            /* No conversation selected */
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-stone-400">
              <div className="w-20 h-20 rounded-3xl bg-stone-100 dark:bg-slate-800/50 flex items-center justify-center">
                <MessageSquare size={36} className="text-stone-300 dark:text-slate-600" />
              </div>
              <div>
                <h3 className="font-black text-xl text-stone-700 dark:text-slate-300">Select a conversation</h3>
                <p className="text-sm text-stone-400 max-w-xs mt-1">
                  {loadingChats
                    ? 'Loading conversations…'
                    : visibleConvs.length === 0
                      ? 'No active conversations found.'
                      : 'Choose a conversation from the sidebar.'}
                </p>
              </div>
              {/* Mobile: show selector when nothing is selected */}
              {visibleConvs.length > 0 && (
                <div className="lg:hidden w-full max-w-xs">
                  <select
                    className="w-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-900 dark:text-white text-sm rounded-xl px-4 py-2.5 font-bold outline-none"
                    defaultValue=""
                    onChange={e => {
                      const conv = conversations.find(c => c.id === e.target.value);
                      if (conv) setSelected(conv);
                    }}
                  >
                    <option value="" disabled>Select conversation…</option>
                    {visibleConvs.map(conv => (
                      <option key={conv.id} value={conv.id}>{getOtherName(conv, myId)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Dummy element to close location state after auto-select */}
      <span data-chatid={getOtherId(selected ?? ({} as ChatConversation), myId)} style={{ display: 'none' }} />
    </MainLayout>
  );
};
