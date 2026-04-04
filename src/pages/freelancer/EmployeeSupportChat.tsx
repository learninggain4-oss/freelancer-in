import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Send, Smile, CheckCheck, Check, Shield, Mic,
  Paperclip, Reply, Copy, Trash2, X, Search, Phone, Video,
  MoreVertical, ChevronDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

/* ──────────────────────────── types ──────────────────────────── */
interface Reaction { id: string; message_id: string; user_id: string; emoji: string; }
interface Msg {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  is_deleted: boolean;
  edited_at: string | null;
  parent_message_id: string | null;
  created_at: string;
  reactions: Reaction[];
}

/* ──────────────────────────── palette ────────────────────────── */
const getWA = (dark: boolean) => ({
  bg:          dark ? "#0b141a" : "#efeae2",
  bgPattern:   dark
    ? "radial-gradient(circle,rgba(255,255,255,.035) 1px,transparent 1px)"
    : "radial-gradient(circle,rgba(0,0,0,.07) 1px,transparent 1px)",
  header:      dark ? "#202c33" : "#075e54",
  headerText:  "#fff",
  headerSub:   "rgba(255,255,255,.72)",
  incoming:    dark ? "#202c33" : "#ffffff",
  incomingTxt: dark ? "#e9edef" : "#111b21",
  outgoing:    dark ? "#005c4b" : "#d9fdd3",
  outgoingTxt: dark ? "#e9edef" : "#111b21",
  inputBar:    dark ? "#111b21" : "#f0f2f5",
  inputBg:     dark ? "#2a3942" : "#ffffff",
  inputTxt:    dark ? "#d1d7db" : "#111b21",
  sub:         dark ? "#8696a0" : "#667781",
  border:      dark ? "rgba(134,150,160,.15)" : "rgba(0,0,0,.08)",
  tickBlue:    "#53bdeb",
  tickGrey:    dark ? "#8696a0" : "#b0bec5",
  sendBtn:     "#00a884",
  emojiBtn:    dark ? "#8696a0" : "#54656f",
  avatar:      dark ? "#2a3942" : "#dfe5e7",
  dateBg:      dark ? "rgba(11,20,26,.85)" : "rgba(225,218,200,.85)",
  menu:        dark ? "#233138" : "#ffffff",
  menuBorder:  dark ? "rgba(134,150,160,.2)" : "rgba(0,0,0,.08)",
  quote:       dark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)",
  quoteLine:   "#00a884",
  replyBar:    dark ? "#1f2c33" : "#f0f2f5",
  replyBorder: dark ? "rgba(134,150,160,.2)" : "rgba(0,0,0,.12)",
  deleted:     dark ? "#8696a0" : "#667781",
});

/* ──────────────────────────── helpers ────────────────────────── */
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function getDateLabel(msgs: Msg[], idx: number): string | null {
  if (idx === 0) return fmtDate(msgs[0].created_at);
  const prev = new Date(msgs[idx - 1].created_at);
  const curr = new Date(msgs[idx].created_at);
  if (prev.toDateString() !== curr.toDateString()) return fmtDate(msgs[idx].created_at);
  return null;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const EMOJIS = ["😊","😂","❤️","👍","🙏","😭","🔥","✅","💯","😍","🤔","👏","🎉","😅","💪","🙌","😎","🤝","💬","⭐","😮","😢","🥳","💔","👀","✨","🫶","🤩","😁","🙃"];

/* ──────────────────────────── component ──────────────────────── */
const EmployeeSupportChat = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room");
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { theme } = useDashboardTheme();
  const isDark = theme === "black";
  const WA = getWA(isDark);

  const [newMessage, setNewMessage]     = useState("");
  const [showEmoji, setShowEmoji]       = useState(false);
  const [replyTo, setReplyTo]           = useState<Msg | null>(null);
  const [pickerMsgId, setPickerMsgId]   = useState<string | null>(null);
  const [contextMenu, setContextMenu]   = useState<{ msgId: string; x: number; y: number } | null>(null);
  const [copiedId, setCopiedId]         = useState<string | null>(null);
  const [showSearch, setShowSearch]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);

  /* ── Chat room ── */
  const { data: chatRoom, isLoading: loadingRoom } = useQuery({
    queryKey: ["support-chat-room", roomId],
    queryFn: async () => {
      if (!roomId) return null;
      const { data, error } = await supabase
        .from("chat_rooms").select("*").eq("id", roomId).eq("type", "support").maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!roomId,
  });

  /* ── Messages (ALL, including replies, with reactions) ── */
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["wa-support-msgs", chatRoom?.id],
    queryFn: async () => {
      if (!chatRoom?.id) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("id,chat_room_id,sender_id,content,is_read,is_deleted,edited_at,parent_message_id,created_at")
        .eq("chat_room_id", chatRoom.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const ids = (data || []).map((m: any) => m.id);
      let rxns: any[] = [];
      if (ids.length > 0) {
        const { data: r } = await supabase.from("message_reactions").select("*").in("message_id", ids);
        rxns = r || [];
      }
      return (data || []).map((m: any) => ({
        ...m,
        reactions: rxns.filter((r) => r.message_id === m.id),
      })) as Msg[];
    },
    enabled: !!chatRoom?.id,
    staleTime: 3000,
  });

  /* ── Realtime ── */
  useEffect(() => {
    if (!chatRoom?.id) return;
    const ch = supabase.channel(`wa-support-${chatRoom.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `chat_room_id=eq.${chatRoom.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["wa-support-msgs", chatRoom.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["wa-support-msgs", chatRoom.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [chatRoom?.id, queryClient]);

  /* ── Mark as read ── */
  useEffect(() => {
    if (!chatRoom?.id || !profile?.id || messages.length === 0) return;
    const unread = messages.filter((m) => !m.is_read && m.sender_id !== profile.id).map((m) => m.id);
    if (unread.length > 0)
      supabase.from("messages").update({ is_read: true }).in("id", unread).then();
  }, [messages, chatRoom?.id, profile?.id]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Textarea auto-height ── */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [newMessage]);

  /* ── Close context menu on outside click ── */
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  /* ── Close picker on outside click ── */
  useEffect(() => {
    if (!pickerMsgId) return;
    const close = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".wa-picker")) return;
      setPickerMsgId(null);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [pickerMsgId]);

  /* ── Search focus ── */
  useEffect(() => {
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 100);
  }, [showSearch]);

  /* ── Message map (for parent lookup) ── */
  const msgMap = new Map(messages.map((m) => [m.id, m]));
  const myId   = profile?.id || "";

  /* ── Send ── */
  const handleSend = useCallback(async () => {
    const content = newMessage.trim();
    if (!content || !chatRoom?.id || !profile?.id) return;
    try {
      const insert: any = { chat_room_id: chatRoom.id, sender_id: profile.id, content };
      if (replyTo) insert.parent_message_id = replyTo.id;
      await supabase.from("messages").insert(insert);
      setNewMessage("");
      setReplyTo(null);
      setShowEmoji(false);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (e: any) { toast.error(e.message); }
  }, [newMessage, chatRoom?.id, profile?.id, replyTo]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") setReplyTo(null);
  };

  /* ── Reaction ── */
  const handleReaction = useCallback(async (msgId: string, emoji: string) => {
    setPickerMsgId(null);
    setContextMenu(null);
    if (!profile?.id) return;
    const msg = messages.find((m) => m.id === msgId);
    const existing = msg?.reactions.find((r) => r.user_id === profile.id && r.emoji === emoji);
    if (existing) {
      await supabase.from("message_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("message_reactions").insert({ message_id: msgId, user_id: profile.id, emoji });
    }
  }, [messages, profile?.id]);

  /* ── Copy ── */
  const handleCopy = useCallback((msgId: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    });
    setContextMenu(null);
  }, []);

  /* ── Delete ── */
  const handleDelete = useCallback(async (msgId: string) => {
    setContextMenu(null);
    await supabase.from("messages").update({ is_deleted: true, content: "" }).eq("id", msgId);
  }, []);

  /* ── Filtered messages (search) ── */
  const visibleMsgs = searchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  /* ── Loading ── */
  if (loadingRoom) {
    return (
      <div style={{ background: WA.bg, display: "flex", flexDirection: "column", height: "calc(100vh - 5rem)" }}>
        <div style={{ background: WA.header, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <Skeleton style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.22)" }} />
          <div style={{ flex: 1 }}>
            <Skeleton style={{ width: 110, height: 13, borderRadius: 8, background: "rgba(255,255,255,.22)", marginBottom: 5 }} />
            <Skeleton style={{ width: 55, height: 9, borderRadius: 8, background: "rgba(255,255,255,.16)" }} />
          </div>
        </div>
        <div style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-start" : "flex-end" }}>
              <Skeleton style={{ width: `${i % 2 === 0 ? 58 : 42}%`, height: 50, borderRadius: 10, background: "rgba(128,128,128,.16)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── No room ── */
  if (!chatRoom) {
    return (
      <div style={{ background: WA.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 5rem)", gap: 16, padding: 24 }}>
        <div style={{ width: 76, height: 76, borderRadius: "50%", background: WA.incoming, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,.18)" }}>
          <Shield size={34} style={{ color: WA.sub }} />
        </div>
        <p style={{ color: WA.incomingTxt, fontWeight: 700, fontSize: 17, margin: 0 }}>Support Chat Unavailable</p>
        <p style={{ color: WA.sub, fontSize: 13, textAlign: "center", margin: 0 }}>No support channel found for this project.</p>
        <button onClick={() => navigate(-1)}
          style={{ marginTop: 8, padding: "10px 28px", borderRadius: 24, border: "none", background: WA.sendBtn, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Go Back
        </button>
      </div>
    );
  }

  /* ═══════════════════════ MAIN RENDER ═══════════════════════ */
  return (
    <div
      style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 5rem)", background: WA.bg, overflow: "hidden", position: "relative" }}
      onClick={() => { setContextMenu(null); }}
    >

      {/* ───────────── Header ───────────── */}
      <div style={{ background: WA.header, display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,.25)", zIndex: 10 }}>
        <button onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#fff", display: "flex" }}>
          <ArrowLeft size={22} />
        </button>

        {/* Avatar */}
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: WA.avatar, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Shield size={20} style={{ color: WA.header }} />
        </div>

        {/* Name + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#fff", lineHeight: 1.2 }}>Support Team</p>
          <p style={{ margin: 0, fontSize: 12, color: WA.headerSub, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            Online · 24/7
          </p>
        </div>

        {/* Header actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button onClick={() => { setShowSearch(v => !v); setSearchQuery(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", color: "#fff", display: "flex", borderRadius: 8 }}>
            <Search size={20} />
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", color: "#fff", display: "flex", borderRadius: 8 }}>
            <Phone size={20} />
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", color: "#fff", display: "flex", borderRadius: 8 }}>
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* ───────────── Search bar ───────────── */}
      {showSearch && (
        <div style={{ background: WA.header, padding: "8px 12px 10px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            style={{
              flex: 1, background: "rgba(255,255,255,.15)", border: "none", borderRadius: 20,
              padding: "7px 14px", color: "#fff", fontSize: 14, outline: "none",
            }}
          />
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#fff" }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* ───────────── Chat area ───────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px 4px", backgroundImage: WA.bgPattern, backgroundSize: "20px 20px" }}>

        {loadingMessages ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 4px" }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-start" : "flex-end" }}>
                <Skeleton style={{ width: `${i % 2 === 0 ? 55 : 40}%`, height: 48, borderRadius: 10, background: "rgba(128,128,128,.16)" }} />
              </div>
            ))}
          </div>
        ) : visibleMsgs.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12, padding: 24 }}>
            <div style={{ background: WA.incoming, borderRadius: 16, padding: "14px 20px", maxWidth: 280, boxShadow: "0 1px 2px rgba(0,0,0,.13)", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: isDark ? "rgba(0,168,132,.15)" : "rgba(7,94,84,.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <Shield size={24} style={{ color: WA.sendBtn }} />
              </div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: WA.incomingTxt }}>Support Chat</p>
              <p style={{ margin: "6px 0 0", fontSize: 12.5, color: WA.sub, lineHeight: 1.55 }}>
                {searchQuery ? "No messages match your search." : "Describe your issue and our team will assist you shortly."}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {visibleMsgs.map((msg, idx) => {
              const isMe      = msg.sender_id === myId;
              const dateLabel = getDateLabel(visibleMsgs, idx);
              const parent    = msg.parent_message_id ? msgMap.get(msg.parent_message_id) : null;
              const showPicker = pickerMsgId === msg.id;

              // Group reactions by emoji
              const grouped = (msg.reactions || []).reduce<Record<string, { count: number; hasMe: boolean }>>((acc, r) => {
                if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasMe: false };
                acc[r.emoji].count++;
                if (r.user_id === myId) acc[r.emoji].hasMe = true;
                return acc;
              }, {});

              return (
                <div key={msg.id}>
                  {/* ── Date separator ── */}
                  {dateLabel && (
                    <div style={{ display: "flex", justifyContent: "center", margin: "10px 0 6px" }}>
                      <span style={{ background: WA.dateBg, backdropFilter: "blur(4px)", padding: "4px 14px", borderRadius: 20, fontSize: 12, color: isDark ? "#e9edef" : "#54656f", fontWeight: 600, boxShadow: "0 1px 4px rgba(0,0,0,.12)" }}>
                        {dateLabel}
                      </span>
                    </div>
                  )}

                  {/* ── Message row ── */}
                  <div
                    className="wa-msg-row"
                    style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", padding: "2px 8px", position: "relative" }}
                  >
                    {/* Support avatar for incoming */}
                    {!isMe && (
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: WA.avatar, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 6, marginBottom: 2, alignSelf: "flex-end" }}>
                        <Shield size={13} style={{ color: WA.header }} />
                      </div>
                    )}

                    {/* Bubble column */}
                    <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 3 }}>

                      {/* Quick reaction picker */}
                      {showPicker && (
                        <div
                          className="wa-picker"
                          onClick={e => e.stopPropagation()}
                          style={{
                            display: "flex", gap: 3, padding: "6px 10px",
                            background: WA.menu,
                            borderRadius: 24,
                            boxShadow: "0 6px 24px rgba(0,0,0,.25)",
                            border: `1px solid ${WA.menuBorder}`,
                            animation: "waPickerIn .15s ease",
                            order: isMe ? 1 : 0,
                          }}
                        >
                          {QUICK_REACTIONS.map(e => (
                            <button key={e}
                              onClick={() => handleReaction(msg.id, e)}
                              style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", padding: "2px 4px", borderRadius: 8, lineHeight: 1, transition: "transform .1s" }}
                              onMouseEnter={ev => (ev.currentTarget.style.transform = "scale(1.3)")}
                              onMouseLeave={ev => (ev.currentTarget.style.transform = "scale(1)")}
                            >{e}</button>
                          ))}
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setContextMenu({ msgId: msg.id, x: e.clientX, y: e.clientY }); }}
                        onDoubleClick={() => setReplyTo(msg)}
                        style={{
                          background: isMe ? WA.outgoing : WA.incoming,
                          borderRadius: isMe ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                          padding: "7px 11px 5px",
                          boxShadow: "0 1px 2px rgba(0,0,0,.13)",
                          position: "relative",
                          cursor: "default",
                          minWidth: 100,
                        }}
                      >
                        {/* Sender label (incoming only) */}
                        {!isMe && (
                          <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#00a884" }}>
                            Support Team
                          </p>
                        )}

                        {/* Quoted reply */}
                        {parent && !parent.is_deleted && (
                          <div style={{
                            background: WA.quote,
                            borderLeft: `4px solid ${WA.quoteLine}`,
                            borderRadius: "6px 6px 6px 0",
                            padding: "5px 10px",
                            marginBottom: 6,
                            maxWidth: "100%",
                            overflow: "hidden",
                          }}>
                            <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: WA.quoteLine }}>
                              {parent.sender_id === myId ? "You" : "Support Team"}
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: WA.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                              {parent.content}
                            </p>
                          </div>
                        )}

                        {/* Message content */}
                        {msg.is_deleted ? (
                          <p style={{ margin: 0, fontSize: 13.5, color: WA.deleted, fontStyle: "italic", lineHeight: 1.5 }}>
                            🚫 This message was deleted
                          </p>
                        ) : (
                          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, wordBreak: "break-word", whiteSpace: "pre-wrap", color: isMe ? WA.outgoingTxt : WA.incomingTxt }}>
                            {msg.content}
                            {msg.edited_at && (
                              <span style={{ fontSize: 10, color: WA.sub, marginLeft: 5, fontStyle: "italic" }}>edited</span>
                            )}
                          </p>
                        )}

                        {/* Time + ticks */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: 3 }}>
                          {copiedId === msg.id && (
                            <span style={{ fontSize: 10, color: WA.sub, marginRight: 4 }}>Copied!</span>
                          )}
                          <span style={{ fontSize: 11, color: WA.sub }}>{fmtTime(msg.created_at)}</span>
                          {isMe && !msg.is_deleted && (
                            msg.is_read
                              ? <CheckCheck size={14} style={{ color: WA.tickBlue }} />
                              : <Check size={14} style={{ color: WA.tickGrey }} />
                          )}
                        </div>

                        {/* Hover react button */}
                        {!msg.is_deleted && (
                          <button
                            onClick={e => { e.stopPropagation(); setPickerMsgId(pickerMsgId === msg.id ? null : msg.id); }}
                            className="wa-react-btn"
                            style={{
                              position: "absolute", bottom: -10,
                              [isMe ? "left" : "right"]: -10,
                              background: WA.menu,
                              border: `1px solid ${WA.menuBorder}`,
                              borderRadius: "50%", width: 24, height: 24,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer", fontSize: 14, lineHeight: 1,
                              boxShadow: "0 2px 8px rgba(0,0,0,.18)",
                              opacity: 0, transition: "opacity .15s",
                            }}
                          >😊</button>
                        )}
                      </div>

                      {/* Reaction pills */}
                      {Object.keys(grouped).length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                          {Object.entries(grouped).map(([emoji, { count, hasMe }]) => (
                            <button key={emoji}
                              onClick={() => handleReaction(msg.id, emoji)}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 3,
                                padding: "2px 9px", borderRadius: 12,
                                border: `1.5px solid ${hasMe ? "#00a884" : WA.border}`,
                                background: hasMe
                                  ? (isDark ? "rgba(0,168,132,.2)" : "rgba(0,168,132,.10)")
                                  : (isDark ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.9)"),
                                cursor: "pointer", fontSize: 14, fontWeight: 600,
                                boxShadow: "0 1px 3px rgba(0,0,0,.1)",
                              }}>
                              {emoji}
                              <span style={{ fontSize: 11, color: WA.sub }}>{count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ───────────── Context Menu ───────────── */}
      {contextMenu && (() => {
        const msg = msgMap.get(contextMenu.msgId);
        if (!msg) return null;
        const isMe = msg.sender_id === myId;
        return (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "fixed",
              top: Math.min(contextMenu.y, window.innerHeight - 220),
              left: Math.min(contextMenu.x, window.innerWidth - 180),
              background: WA.menu,
              border: `1px solid ${WA.menuBorder}`,
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,.28)",
              zIndex: 1000,
              minWidth: 170,
              overflow: "hidden",
              animation: "waMenuIn .15s ease",
            }}
          >
            {/* Quick reactions row */}
            {!msg.is_deleted && (
              <div style={{ display: "flex", gap: 0, padding: "10px 12px 8px", borderBottom: `1px solid ${WA.menuBorder}` }}>
                {QUICK_REACTIONS.map(e => (
                  <button key={e}
                    onClick={() => handleReaction(msg.id, e)}
                    style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 8, lineHeight: 1, transition: "transform .1s" }}
                    onMouseEnter={ev => (ev.currentTarget.style.transform = "scale(1.25)")}
                    onMouseLeave={ev => (ev.currentTarget.style.transform = "scale(1)")}
                  >{e}</button>
                ))}
              </div>
            )}

            {[
              { icon: Reply, label: "Reply", action: () => { setReplyTo(msg); setContextMenu(null); textareaRef.current?.focus(); } },
              { icon: Copy, label: "Copy", action: () => handleCopy(msg.id, msg.content), hide: msg.is_deleted },
              { icon: Trash2, label: "Delete", action: () => handleDelete(msg.id), hide: !isMe || msg.is_deleted, danger: true },
            ].filter(item => !item.hide).map(item => (
              <button key={item.label}
                onClick={item.action}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", background: "none", border: "none",
                  cursor: "pointer", fontFamily: "inherit", fontSize: 14,
                  color: item.danger ? "#ef4444" : (isDark ? "#e9edef" : "#111b21"),
                  textAlign: "left", transition: "background .1s",
                }}
                onMouseEnter={ev => (ev.currentTarget.style.background = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)")}
                onMouseLeave={ev => (ev.currentTarget.style.background = "none")}
              >
                <item.icon size={17} />
                {item.label}
              </button>
            ))}
          </div>
        );
      })()}

      {/* ───────────── Emoji picker (for input) ───────────── */}
      {showEmoji && (
        <div style={{ background: WA.inputBar, borderTop: `1px solid ${WA.border}`, padding: "10px 12px", flexShrink: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4 }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setNewMessage(m => m + e)}
                style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, lineHeight: 1, textAlign: "center" }}>
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ───────────── Reply preview bar ───────────── */}
      {replyTo && (
        <div style={{
          background: WA.replyBar, borderTop: `1px solid ${WA.replyBorder}`,
          padding: "8px 12px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }}>
          <div style={{ flex: 1, borderLeft: `4px solid ${WA.quoteLine}`, paddingLeft: 10, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: WA.quoteLine }}>
              {replyTo.sender_id === myId ? "You" : "Support Team"}
            </p>
            <p style={{ margin: 0, fontSize: 12.5, color: WA.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {replyTo.content}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: WA.sub, padding: 4, display: "flex", borderRadius: "50%", flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* ───────────── Input bar ───────────── */}
      <div style={{ background: WA.inputBar, padding: "8px 10px 10px", flexShrink: 0, display: "flex", alignItems: "flex-end", gap: 8 }}>
        {/* Pill */}
        <div style={{ flex: 1, background: WA.inputBg, borderRadius: 26, display: "flex", alignItems: "flex-end", padding: "6px 8px 6px 14px", boxShadow: "0 1px 3px rgba(0,0,0,.12)", minHeight: 44 }}>
          {/* Emoji toggle */}
          <button onClick={() => setShowEmoji(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px 4px 0", color: WA.emojiBtn, flexShrink: 0 }}>
            <Smile size={22} />
          </button>
          {/* Attachment */}
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px 4px 0", color: WA.emojiBtn, flexShrink: 0 }}>
            <Paperclip size={22} />
          </button>
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={e => {
              setNewMessage(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            rows={1}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              resize: "none", color: WA.inputTxt, fontSize: 15, lineHeight: 1.5,
              padding: "2px 0", fontFamily: "inherit", maxHeight: 120, overflowY: "auto",
            }}
          />
          {!newMessage && (
            <button style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0 4px 6px", color: WA.emojiBtn, flexShrink: 0 }}>
              <Mic size={22} />
            </button>
          )}
        </div>
        {/* Send button */}
        <button onClick={handleSend} disabled={!newMessage.trim()}
          style={{
            width: 46, height: 46, borderRadius: "50%", border: "none",
            background: WA.sendBtn, color: "#fff",
            cursor: newMessage.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: "0 2px 8px rgba(0,168,132,.4)",
            opacity: newMessage.trim() ? 1 : 0.7, transition: "opacity .15s",
          }}>
          <Send size={20} style={{ marginLeft: 2 }} />
        </button>
      </div>

      {/* ───────────── Scroll to bottom button ───────────── */}
      <style>{`
        .wa-msg-row:hover .wa-react-btn { opacity: 1 !important; }
        @keyframes waPickerIn { from { opacity:0; transform:scale(.85) translateY(6px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes waMenuIn  { from { opacity:0; transform:scale(.92); } to { opacity:1; transform:scale(1); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(134,150,160,.35); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default EmployeeSupportChat;
