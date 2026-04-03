import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Search, X, BookOpen, UserCircle, ChevronRight,
  HelpCircle, Smile, Paperclip, Mic, ChevronDown,
  Check, CheckCheck, CornerUpLeft, Copy, Trash2, ArrowLeft,
  Phone, Video, MoreVertical, Image as ImageIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useSupportChat, useMyConversation } from "@/hooks/use-support-chat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const EMOJIS = ["😊","😂","❤️","👍","👎","😢","😮","😡","🔥","💯","🙏","✅","❌","💪","🎉","😎","🤔","😍","👏","🤝","💼","⭐","🚀","💡","📞","📸","📁","💰","🎯","⚡"];

const QUICK_REPLIES = [
  "Hello! How can I help you?",
  "I need help with my account",
  "My payment is pending",
  "I have a project issue",
];

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

const TH = {
  black: {
    bg: "#070714",
    chatBg: "#0d0d1e",
    bubbleMe: "linear-gradient(135deg,#1a3a2a,#0f2a1e)",
    bubbleMeBorder: "rgba(74,222,128,.2)",
    bubbleThem: "rgba(255,255,255,.07)",
    bubbleThemBorder: "rgba(255,255,255,.1)",
    text: "#e2e8f0",
    sub: "#94a3b8",
    header: "rgba(7,7,20,.97)",
    headerBorder: "rgba(255,255,255,.07)",
    input: "rgba(255,255,255,.06)",
    inputBorder: "rgba(255,255,255,.1)",
    inputBar: "rgba(7,7,20,.97)",
    dateBg: "rgba(255,255,255,.07)",
    dateText: "#94a3b8",
    emojiPicker: "rgba(13,13,36,.98)",
    ctxMenu: "rgba(13,13,36,.98)",
    ctxBorder: "rgba(255,255,255,.1)",
    dot: "rgba(255,255,255,.04)",
    replyBg: "rgba(255,255,255,.05)",
    replyBorder: "#4ade80",
    tickRead: "#60a5fa",
    tickSent: "#64748b",
    scrollBtn: "rgba(13,13,36,.95)",
  },
  white: {
    bg: "#f0f4ff",
    chatBg: "#e8edf7",
    bubbleMe: "linear-gradient(135deg,#dcfce7,#d1fae5)",
    bubbleMeBorder: "rgba(74,222,128,.3)",
    bubbleThem: "#ffffff",
    bubbleThemBorder: "rgba(0,0,0,.06)",
    text: "#1e293b",
    sub: "#64748b",
    header: "#ffffff",
    headerBorder: "rgba(0,0,0,.08)",
    input: "#ffffff",
    inputBorder: "rgba(0,0,0,.1)",
    inputBar: "#ffffff",
    dateBg: "rgba(0,0,0,.07)",
    dateText: "#64748b",
    emojiPicker: "#ffffff",
    ctxMenu: "#ffffff",
    ctxBorder: "rgba(0,0,0,.1)",
    dot: "rgba(0,0,0,.03)",
    replyBg: "rgba(99,102,241,.08)",
    replyBorder: "#6366f1",
    tickRead: "#3b82f6",
    tickSent: "#94a3b8",
    scrollBtn: "rgba(255,255,255,.95)",
  },
  wb: {
    bg: "#f0f4ff",
    chatBg: "#e8edf7",
    bubbleMe: "linear-gradient(135deg,#dcfce7,#d1fae5)",
    bubbleMeBorder: "rgba(74,222,128,.3)",
    bubbleThem: "#ffffff",
    bubbleThemBorder: "rgba(0,0,0,.06)",
    text: "#1e293b",
    sub: "#64748b",
    header: "#0d0d1e",
    headerBorder: "rgba(255,255,255,.08)",
    input: "#ffffff",
    inputBorder: "rgba(0,0,0,.1)",
    inputBar: "#ffffff",
    dateBg: "rgba(0,0,0,.07)",
    dateText: "#64748b",
    emojiPicker: "#ffffff",
    ctxMenu: "#ffffff",
    ctxBorder: "rgba(0,0,0,.1)",
    dot: "rgba(0,0,0,.03)",
    replyBg: "rgba(99,102,241,.08)",
    replyBorder: "#6366f1",
    tickRead: "#3b82f6",
    tickSent: "#94a3b8",
    scrollBtn: "rgba(255,255,255,.95)",
  },
};

const HelpSupport = () => {
  const { profile } = useAuth();
  const { theme } = useDashboardTheme();
  const T = TH[theme];

  const { data: conversation, isLoading: loadingConv } = useMyConversation();
  const { messages, isLoading: loadingMessages, sendMessage, deleteMessage, clearHistory, toggleReaction } = useSupportChat(conversation?.id);

  const [newMessage, setNewMessage]         = useState("");
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchOpen, setSearchOpen]         = useState(false);
  const [activeTab, setActiveTab]           = useState("messages");
  const [showEmoji, setShowEmoji]           = useState(false);
  const [replyTo, setReplyTo]               = useState<any>(null);
  const [ctxMsg, setCtxMsg]                 = useState<any>(null);
  const [ctxPos, setCtxPos]                 = useState({ x: 0, y: 0 });
  const [showScrollBtn, setShowScrollBtn]   = useState(false);
  const [typing, setTyping]                 = useState(false);
  const [expandedFaq, setExpandedFaq]       = useState<string | null>(null);
  const [showReactionFor, setShowReactionFor] = useState<string | null>(null);
  const [showHeaderMenu, setShowHeaderMenu]   = useState(false);
  const [confirmClear, setConfirmClear]       = useState(false);

  const scrollRef    = useRef<HTMLDivElement>(null);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);
  const fileRef      = useRef<HTMLInputElement>(null);
  const typingTimer  = useRef<any>(null);

  const { data: faqs = [] } = useQuery({
    queryKey: ["help-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faqs").select("*").eq("is_active", true).order("display_order");
      if (error) throw error;
      return data || [];
    },
  });

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    if (activeTab === "messages") scrollToBottom(false);
  }, [messages.length, activeTab]);

  // Scroll watcher
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };

  // Typing simulation from support (demo)
  useEffect(() => {
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.sender_id === profile?.id) {
        setTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), 3000);
      }
    }
  }, [messages.length]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content) return;
    const msgWithReply = replyTo ? `[Reply to: "${replyTo.content.slice(0, 40)}…"]\n${content}` : content;
    try {
      await sendMessage(msgWithReply);
      setNewMessage("");
      setReplyTo(null);
      setShowEmoji(false);
      setTimeout(() => scrollToBottom(), 100);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversation?.id || !profile?.id) return;
    try {
      const ext  = file.name.split(".").pop();
      const path = `support/${conversation.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("support-files").upload(path, file);
      if (upErr) throw upErr;
      await sendMessage(`📎 ${file.name}`, path, file.name);
      toast.success("File sent!");
      setTimeout(() => scrollToBottom(), 100);
    } catch (err: any) { toast.error(err.message || "Upload failed"); }
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const openCtxMenu = (e: React.MouseEvent | React.TouchEvent, msg: any) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCtxPos({ x: rect.left, y: rect.bottom + 4 });
    setCtxMsg(msg);
    setShowReactionFor(null);
  };

  const copyMsg = (msg: any) => { navigator.clipboard.writeText(msg.content); toast.success("Copied!"); setCtxMsg(null); };

  const deleteMsg = async (msg: any) => {
    setCtxMsg(null);
    try {
      await deleteMessage(msg.id, msg.sender_id);
      toast.success("Message deleted");
    } catch (e: any) { toast.error(e.message || "Failed to delete message"); }
  };

  const handleClearHistory = async () => {
    setConfirmClear(false);
    setShowHeaderMenu(false);
    if (!conversation?.id) return;
    try {
      await clearHistory(conversation.id);
      toast.success("Chat history cleared");
    } catch (e: any) { toast.error(e.message || "Failed to clear history"); }
  };

  const filteredMessages = searchQuery
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const unreadCount = messages.filter(m => !m.is_read && m.sender_id !== profile?.id).length;

  if (loadingConv) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className={`h-14 rounded-2xl ${i % 2 === 0 ? "ml-auto w-2/3" : "w-2/3"}`} />)}
      </div>
    );
  }

  // ── CHAT VIEW (Messages Tab) ──────────────────────────────────────
  if (activeTab === "messages") {
    return (
      <div className="flex flex-col" style={{ position: "fixed", top: 56, left: 0, right: 0, bottom: 70, zIndex: 40, background: T.bg }}
        onClick={() => { setCtxMsg(null); setShowReactionFor(null); setShowHeaderMenu(false); }}>

        {/* ── Header ── */}
        <div style={{ background: T.header, borderBottom: `1px solid ${T.headerBorder}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, zIndex: 20, backdropFilter: "blur(16px)" }}>
          <button onClick={() => setActiveTab("dashboard")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 8, display: "flex", alignItems: "center" }}>
            <ArrowLeft size={18} style={{ color: T.sub }} />
          </button>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>FI</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>Freelancer India Support</p>
            <p style={{ fontSize: 10, color: "#4ade80", margin: 0, fontWeight: 600 }}>
              {typing ? "typing..." : "online"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 2, position: "relative" }}>
            <button onClick={() => { setSearchOpen(s => !s); setSearchQuery(""); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: 8, display: "flex", alignItems: "center" }}>
              <Search size={17} style={{ color: T.sub }} />
            </button>
            <button onClick={e => { e.stopPropagation(); setShowHeaderMenu(s => !s); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: 8, display: "flex", alignItems: "center" }}>
              <MoreVertical size={17} style={{ color: T.sub }} />
            </button>
            {/* Header dropdown */}
            {showHeaderMenu && (
              <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, minWidth: 180, background: T.ctxMenu, border: `1px solid ${T.ctxBorder}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.3)", zIndex: 50 }}>
                <button onClick={() => { setShowHeaderMenu(false); setSearchOpen(s => !s); setSearchQuery(""); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "none", border: "none", cursor: "pointer", color: T.text, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${T.ctxBorder}` }}>
                  <Search size={15} style={{ color: T.sub }} /> Search
                </button>
                <button onClick={() => { setShowHeaderMenu(false); setConfirmClear(true); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 13, fontWeight: 600 }}>
                  <Trash2 size={15} style={{ color: "#f87171" }} /> Clear History
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div style={{ background: T.header, borderBottom: `1px solid ${T.headerBorder}`, padding: "8px 14px", display: "flex", gap: 8, alignItems: "center", flexShrink: 0, zIndex: 19, backdropFilter: "blur(16px)" }}>
            <Search size={14} style={{ color: T.sub, flexShrink: 0 }} />
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search in conversation..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.text, fontSize: 13 }} />
            {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} style={{ color: T.sub }} /></button>}
          </div>
        )}

        {/* ── Chat background + messages ── */}
        <div ref={scrollRef} onScroll={handleScroll}
          style={{ flex: 1, overflowY: "auto", padding: "12px 10px 12px", position: "relative", background: T.chatBg, backgroundImage: `radial-gradient(circle,${T.dot} 1px,transparent 1px)`, backgroundSize: "20px 20px", scrollbarWidth: "none" }}>

          {loadingMessages ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[70, 55, 80, 60].map((w, i) => (
                <div key={i} style={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-end" : "flex-start" }}>
                  <div style={{ width: `${w}%`, height: 48, borderRadius: 16, background: "rgba(128,128,128,.15)" }} />
                </div>
              ))}
            </div>
          ) : filteredMessages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(99,102,241,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <HelpCircle size={28} style={{ color: "#6366f1" }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 6px" }}>Start a conversation</p>
              <p style={{ fontSize: 12, color: T.sub, margin: "0 0 16px" }}>Our support team is here to help you.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {QUICK_REPLIES.map(qr => (
                  <button key={qr} onClick={() => { setNewMessage(qr); inputRef.current?.focus(); }}
                    style={{ fontSize: 11, padding: "6px 12px", borderRadius: 20, border: `1px solid rgba(99,102,241,.35)`, background: "rgba(99,102,241,.1)", color: "#a5b4fc", cursor: "pointer" }}>
                    {qr}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {filteredMessages.map((msg, idx) => {
                const isMe = msg.sender_id === profile?.id;
                const showDate = idx === 0 || !isSameDay(filteredMessages[idx - 1].created_at, msg.created_at);
                const prevIsMe = idx > 0 && filteredMessages[idx - 1].sender_id === profile?.id;
                const nextIsMe = idx < filteredMessages.length - 1 && filteredMessages[idx + 1].sender_id === profile?.id;
                const isFirst = !prevIsMe || prevIsMe !== isMe;
                const myReaction = msg.reactions?.find((r: any) => r.user_id === profile?.id)?.emoji;
                const reactionCounts = msg.reactions?.reduce((acc: any, r: any) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {}) ?? {};
                const isReply = msg.content.startsWith("[Reply to:");

                return (
                  <div key={msg.id}>
                    {/* Date separator */}
                    {showDate && (
                      <div style={{ display: "flex", justifyContent: "center", margin: "12px 0 8px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: T.dateText, background: T.dateBg, borderRadius: 12, padding: "3px 12px", backdropFilter: "blur(8px)" }}>
                          {formatDateLabel(msg.created_at)}
                        </span>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: nextIsMe === isMe ? 2 : 8, position: "relative" }}>
                      {/* Support avatar */}
                      {!isMe && isFirst && (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 6, marginTop: "auto", fontSize: 10, color: "#fff", fontWeight: 800 }}>FI</div>
                      )}
                      {!isMe && !isFirst && <div style={{ width: 34, flexShrink: 0 }} />}

                      <div style={{ maxWidth: "72%", position: "relative" }}
                        onContextMenu={e => { e.preventDefault(); openCtxMenu(e, msg); }}
                        onTouchStart={e => { const t = setTimeout(() => openCtxMenu(e as any, msg), 500); e.currentTarget.addEventListener("touchend", () => clearTimeout(t), { once: true }); }}>

                        {/* Bubble */}
                        <div onClick={e => { e.stopPropagation(); setShowReactionFor(showReactionFor === msg.id ? null : msg.id); setCtxMsg(null); }}
                          style={{
                            background: isMe ? T.bubbleMe : T.bubbleThem,
                            border: `1px solid ${isMe ? T.bubbleMeBorder : T.bubbleThemBorder}`,
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            padding: "8px 12px 6px",
                            boxShadow: "0 1px 4px rgba(0,0,0,.12)",
                            cursor: "pointer",
                            position: "relative",
                          }}>

                          {/* Reply preview inside bubble */}
                          {isReply && (() => {
                            const lines = msg.content.split("\n");
                            const replyLine = lines[0].replace("[Reply to: \"", "").replace("…\"]", "");
                            const actualContent = lines.slice(1).join("\n");
                            return (
                              <>
                                <div style={{ background: T.replyBg, borderLeft: `3px solid ${T.replyBorder}`, borderRadius: 8, padding: "4px 8px", marginBottom: 6, fontSize: 11, color: T.sub }}>
                                  <CornerUpLeft size={10} style={{ display: "inline", marginRight: 4 }} />
                                  {replyLine}
                                </div>
                                <p style={{ margin: 0, fontSize: 13.5, color: T.text, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{actualContent}</p>
                              </>
                            );
                          })()}
                          {!isReply && <p style={{ margin: 0, fontSize: 13.5, color: T.text, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.content}</p>}

                          {/* Time + ticks */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: 3 }}>
                            <span style={{ fontSize: 10, color: T.sub }}>{formatTime(msg.created_at)}</span>
                            {isMe && (
                              msg.is_read
                                ? <CheckCheck size={13} style={{ color: T.tickRead }} />
                                : <CheckCheck size={13} style={{ color: T.tickSent }} />
                            )}
                          </div>
                        </div>

                        {/* Reaction quick bar */}
                        {showReactionFor === msg.id && (
                          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", [isMe ? "right" : "left"]: 0, bottom: "calc(100% + 6px)", display: "flex", gap: 4, background: T.emojiPicker, border: `1px solid ${T.ctxBorder}`, borderRadius: 24, padding: "6px 10px", boxShadow: "0 4px 20px rgba(0,0,0,.2)", zIndex: 30 }}>
                            {["👍","❤️","😂","😮","😢","🔥"].map(e => (
                              <button key={e} onClick={() => { toggleReaction(msg.id, e); setShowReactionFor(null); }}
                                style={{ fontSize: 20, background: myReaction === e ? "rgba(99,102,241,.2)" : "none", border: "none", cursor: "pointer", padding: "2px 3px", borderRadius: 8, transform: myReaction === e ? "scale(1.2)" : "scale(1)", transition: "all .15s" }}>
                                {e}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Reaction chips */}
                        {Object.keys(reactionCounts).length > 0 && (
                          <div style={{ display: "flex", gap: 3, marginTop: 3, justifyContent: isMe ? "flex-end" : "flex-start", flexWrap: "wrap" }}>
                            {Object.entries(reactionCounts).map(([emoji, count]: any) => (
                              <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)}
                                style={{ fontSize: 11, padding: "1px 6px", borderRadius: 12, background: T.dateBg, border: `1px solid ${T.ctxBorder}`, cursor: "pointer", color: T.text }}>
                                {emoji} {count}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {typing && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 34 }}>
                  <div style={{ background: T.bubbleThem, border: `1px solid ${T.bubbleThemBorder}`, borderRadius: "18px 18px 18px 4px", padding: "10px 16px", display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.sub, animation: "typing-bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} style={{ height: 4 }} />
            </div>
          )}

          {/* Scroll-to-bottom button */}
          {showScrollBtn && (
            <button onClick={() => scrollToBottom()}
              style={{ position: "sticky", bottom: 12, float: "right", marginRight: 4, width: 38, height: 38, borderRadius: "50%", background: T.scrollBtn, border: `1px solid ${T.ctxBorder}`, boxShadow: "0 2px 12px rgba(0,0,0,.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }}>
              <ChevronDown size={18} style={{ color: T.text }} />
              {unreadCount > 0 && (
                <div style={{ position: "absolute", top: -4, right: -4, background: "#6366f1", borderRadius: "50%", width: 16, height: 16, fontSize: 9, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{unreadCount}</div>
              )}
            </button>
          )}
        </div>

        {/* ── Context menu ── */}
        {ctxMsg && (
          <div onClick={e => e.stopPropagation()} style={{ position: "fixed", left: Math.min(ctxPos.x, window.innerWidth - 180), top: Math.min(ctxPos.y, window.innerHeight - 220), zIndex: 50, background: T.ctxMenu, border: `1px solid ${T.ctxBorder}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.3)", minWidth: 170 }}>
            {[
              { icon: CornerUpLeft, label: "Reply", color: T.text, action: () => { setReplyTo(ctxMsg); setCtxMsg(null); inputRef.current?.focus(); } },
              { icon: Copy,          label: "Copy",  color: T.text, action: () => copyMsg(ctxMsg) },
              { icon: Smile,         label: "React", color: T.text, action: () => { setShowReactionFor(ctxMsg.id); setCtxMsg(null); } },
              ...(ctxMsg.sender_id === profile?.id
                ? [{ icon: Trash2, label: "Delete", color: "#f87171", action: () => deleteMsg(ctxMsg) }]
                : []),
            ].map((item, i, arr) => {
              const Icon = item.icon;
              return (
                <button key={item.label} onClick={item.action}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", color: item.color, fontSize: 13, fontWeight: 600, borderBottom: i < arr.length - 1 ? `1px solid ${T.ctxBorder}` : "none" }}>
                  <Icon size={15} style={{ color: item.color }} /> {item.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Clear History Confirm ── */}
        {confirmClear && (
          <div onClick={() => setConfirmClear(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: T.ctxMenu, border: `1px solid ${T.ctxBorder}`, borderRadius: 20, padding: 24, maxWidth: 320, width: "100%", boxShadow: "0 16px 48px rgba(0,0,0,.4)" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(248,113,113,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Trash2 size={22} style={{ color: "#f87171" }} />
              </div>
              <p style={{ fontWeight: 800, fontSize: 16, color: T.text, textAlign: "center", margin: "0 0 8px" }}>Clear Chat History?</p>
              <p style={{ fontSize: 13, color: T.sub, textAlign: "center", margin: "0 0 12px", lineHeight: 1.5 }}>All messages in this conversation will be permanently deleted. This cannot be undone.</p>
              <div style={{ background: "rgba(251,191,36,.1)", border: "1px solid rgba(251,191,36,.3)", borderRadius: 10, padding: "10px 13px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                <p style={{ fontSize: 12, color: "#fbbf24", margin: 0, lineHeight: 1.55, fontWeight: 500 }}>
                  ഈ ചാറ്റ് ഒരിക്കൽ ഡിലീറ്റ് ചെയ്‌താൽ ഒരു ആവശ്യഘട്ടത്തിലും വീണ്ടെടുക്കാൻ സാധിക്കില്ല. ഡിലീറ്റ് ചെയ്യുന്നതിന് മുൻപ് ഒന്ന് ആലോചിക്കുക.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: "11px", borderRadius: 12, border: `1px solid ${T.ctxBorder}`, background: "none", cursor: "pointer", color: T.sub, fontSize: 13, fontWeight: 600 }}>Cancel</button>
                <button onClick={handleClearHistory} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 700 }}>Clear All</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Emoji Picker ── */}
        {showEmoji && (
          <div style={{ background: T.emojiPicker, borderTop: `1px solid ${T.ctxBorder}`, padding: "10px", flexShrink: 0, maxHeight: 180, overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 2 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setNewMessage(m => m + e)}
                  style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: 8, lineHeight: 1, textAlign: "center" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Reply Preview ── */}
        {replyTo && (
          <div style={{ background: T.replyBg, borderLeft: `3px solid ${T.replyBorder}`, padding: "6px 14px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, borderTop: `1px solid ${T.ctxBorder}` }}>
            <CornerUpLeft size={13} style={{ color: T.replyBorder, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: T.replyBorder, margin: 0 }}>Replying to</p>
              <p style={{ fontSize: 11, color: T.sub, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.content.slice(0, 60)}</p>
            </div>
            <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <X size={14} style={{ color: T.sub }} />
            </button>
          </div>
        )}

        {/* ── Input Bar ── */}
        <div style={{ background: T.inputBar, borderTop: `1px solid ${T.headerBorder}`, padding: "8px 10px", display: "flex", alignItems: "flex-end", gap: 8, flexShrink: 0, zIndex: 20, backdropFilter: "blur(16px)" }}>
          <button onClick={() => setShowEmoji(s => !s)}
            style={{ background: showEmoji ? "rgba(99,102,241,.2)" : "none", border: "none", cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Smile size={20} style={{ color: showEmoji ? "#6366f1" : T.sub }} />
          </button>

          <button onClick={() => fileRef.current?.click()}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Paperclip size={20} style={{ color: T.sub }} />
          </button>

          <input ref={fileRef} type="file" accept="image/*,application/*,.pdf,.doc,.docx,.zip" style={{ display: "none" }} onChange={handleFileChange} />

          <div style={{ flex: 1, background: T.input, border: `1px solid ${T.inputBorder}`, borderRadius: 22, padding: "8px 14px", display: "flex", alignItems: "center" }}>
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.text, fontSize: 13.5, resize: "none", lineHeight: 1.4, maxHeight: 100, overflowY: "auto", scrollbarWidth: "none", fontFamily: "inherit" }}
            />
          </div>

          {newMessage.trim() ? (
            <button onClick={handleSend}
              style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 12px rgba(99,102,241,.45)" }}>
              <Send size={17} style={{ color: "#fff", transform: "translateX(1px)" }} />
            </button>
          ) : (
            <button
              style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 12px rgba(99,102,241,.45)" }}>
              <Mic size={17} style={{ color: "#fff" }} />
            </button>
          )}
        </div>

        {/* Typing animation keyframes */}
        <style>{`
          @keyframes typing-bounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-5px); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // ── DASHBOARD / FAQ TABS ─────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", background: T.bg, minHeight: "100%" }}>
      {/* Header */}
      <div style={{ background: T.header, borderBottom: `1px solid ${T.headerBorder}`, padding: "14px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(99,102,241,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HelpCircle size={18} style={{ color: "#6366f1" }} />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 15, color: T.text, margin: 0 }}>Help & Support</p>
            <p style={{ fontSize: 11, color: T.sub, margin: 0 }}>Browse FAQs or chat with support</p>
          </div>
        </div>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0 }}>
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "faqs",      label: "FAQs" },
            { id: "messages",  label: "Messages", badge: unreadCount },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "10px 4px 11px", fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? "#6366f1" : T.sub, borderBottom: activeTab === tab.id ? "2px solid #6366f1" : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all .15s" }}>
              {tab.label}
              {tab.badge ? <span style={{ background: "#ef4444", color: "#fff", borderRadius: 10, padding: "1px 5px", fontSize: 9, fontWeight: 700 }}>{tab.badge}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard */}
      {activeTab === "dashboard" && (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              { label: "Chat",    icon: "💬", badge: unreadCount, action: () => setActiveTab("messages"), color: "#6366f1" },
              { label: "FAQs",   icon: "📚", badge: faqs.length, action: () => setActiveTab("faqs"),    color: "#8b5cf6" },
              { label: "Account", icon: "👤", badge: null,         action: () => {},                        color: "#a78bfa" },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 8px", borderRadius: 16, background: `${item.color}12`, border: `1px solid ${item.color}25`, cursor: "pointer" }}>
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.label}</span>
                {item.badge ? <span style={{ background: item.color, color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 9, fontWeight: 700 }}>{item.badge}</span> : null}
              </button>
            ))}
          </div>
          <div style={{ background: T.bubbleThem, border: `1px solid ${T.bubbleThemBorder}`, borderRadius: 16, padding: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: T.text, margin: "0 0 12px" }}>Account Summary</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Status",            value: profile?.approval_status || "—" },
                { label: "User Code",         value: profile?.user_code        || "—" },
                { label: "Available Balance", value: `₹${(profile?.available_balance ?? 0).toLocaleString("en-IN")}` },
                { label: "Hold Balance",      value: `₹${(profile?.hold_balance ?? 0).toLocaleString("en-IN")}` },
              ].map(s => (
                <div key={s.label} style={{ background: T.chatBg, borderRadius: 12, padding: "10px 12px" }}>
                  <p style={{ fontSize: 10, color: T.sub, margin: "0 0 2px" }}>{s.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0, textTransform: "capitalize" }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAQs */}
      {activeTab === "faqs" && (
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {faqs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <BookOpen size={36} style={{ color: T.sub, margin: "0 auto 12px", display: "block" }} />
              <p style={{ color: T.sub, fontSize: 13 }}>No FAQs available yet.</p>
            </div>
          ) : faqs.map((faq: any) => (
            <button key={faq.id} onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              style={{ width: "100%", textAlign: "left", background: T.bubbleThem, border: `1px solid ${T.bubbleThemBorder}`, borderRadius: 14, padding: "12px 14px", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <HelpCircle size={15} style={{ color: "#6366f1", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.text }}>{faq.question}</span>
                <ChevronRight size={14} style={{ color: T.sub, transform: expandedFaq === faq.id ? "rotate(90deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
              </div>
              {expandedFaq === faq.id && (
                <p style={{ fontSize: 12, color: T.sub, margin: "10px 0 0 23px", lineHeight: 1.6 }}>{faq.answer}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HelpSupport;
