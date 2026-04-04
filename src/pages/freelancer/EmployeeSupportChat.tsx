import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Send, Smile, CheckCheck, Check, Shield, Mic, MicOff,
  Paperclip, Reply, Copy, Trash2, X, Search, Phone, Video, Star,
  MoreVertical, ChevronDown, Download, FileText, Camera, Forward,
  Pencil, StopCircle, Image as ImageIcon, Play, Pause, Lock, Volume2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

/* ─────────────────────────── types ─────────────────────────── */
interface Reaction { id: string; message_id: string; user_id: string; emoji: string; }
interface Msg {
  id: string; chat_room_id: string; sender_id: string; content: string;
  is_read: boolean; is_deleted: boolean; edited_at: string | null;
  parent_message_id: string | null; created_at: string;
  file_path: string | null; file_name: string | null;
  reactions: Reaction[];
}

/* ─────────────────────────── palette ───────────────────────── */
const getWA = (dark: boolean) => ({
  bg: dark ? "#0b141a" : "#efeae2",
  bgPattern: dark
    ? "radial-gradient(circle,rgba(255,255,255,.035) 1px,transparent 1px)"
    : "radial-gradient(circle,rgba(0,0,0,.07) 1px,transparent 1px)",
  header: dark ? "#202c33" : "#075e54",
  headerText: "#fff", headerSub: "rgba(255,255,255,.72)",
  incoming: dark ? "#202c33" : "#ffffff",
  incomingTxt: dark ? "#e9edef" : "#111b21",
  outgoing: dark ? "#005c4b" : "#d9fdd3",
  outgoingTxt: dark ? "#e9edef" : "#111b21",
  inputBar: dark ? "#111b21" : "#f0f2f5",
  inputBg: dark ? "#2a3942" : "#ffffff",
  inputTxt: dark ? "#d1d7db" : "#111b21",
  sub: dark ? "#8696a0" : "#667781",
  border: dark ? "rgba(134,150,160,.15)" : "rgba(0,0,0,.08)",
  tickBlue: "#53bdeb", tickGrey: dark ? "#8696a0" : "#b0bec5",
  sendBtn: "#00a884", emojiBtn: dark ? "#8696a0" : "#54656f",
  avatar: dark ? "#2a3942" : "#dfe5e7",
  dateBg: dark ? "rgba(11,20,26,.85)" : "rgba(225,218,200,.85)",
  menu: dark ? "#233138" : "#ffffff",
  menuBorder: dark ? "rgba(134,150,160,.2)" : "rgba(0,0,0,.08)",
  quote: dark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)",
  quoteLine: "#00a884",
  replyBar: dark ? "#1f2c33" : "#f0f2f5",
  fileBg: dark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)",
  encryptedBg: dark ? "rgba(11,20,26,.8)" : "rgba(225,218,200,.8)",
  recBg: "#ef4444",
});

/* ─────────────────────────── helpers ───────────────────────── */
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtSecs = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function fmtDate(iso: string): string {
  const d = new Date(iso), today = new Date(), yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}
function getDateLabel(msgs: Msg[], idx: number): string | null {
  if (idx === 0) return fmtDate(msgs[0].created_at);
  const p = new Date(msgs[idx - 1].created_at), c = new Date(msgs[idx].created_at);
  return p.toDateString() !== c.toDateString() ? fmtDate(msgs[idx].created_at) : null;
}

function detectLinks(text: string): React.ReactNode[] {
  const urlRe = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRe);
  return parts.map((p, i) =>
    urlRe.test(p)
      ? <a key={i} href={p} target="_blank" rel="noopener noreferrer"
          style={{ color: "#53bdeb", textDecoration: "underline", wordBreak: "break-all" }}>{p}</a>
      : <span key={i}>{p}</span>
  );
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const EMOJIS = ["😊","😂","❤️","👍","🙏","😭","🔥","✅","💯","😍","🤔","👏","🎉","😅","💪","🙌","😎","🤝","💬","⭐","😮","😢","🥳","💔","👀","✨","🫶","🤩","😁","🙃","🥺","😬","🤣","😆","😇","🤗","🤫","😏","😒","🙄"];
const BUCKET = "chat-attachments";

const isImage = (name: string | null) => !!name?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
const isAudio = (name: string | null) => !!name?.match(/\.(webm|ogg|mp3|m4a|wav|aac)$/i);

/* ─────────── Audio player component ─────────── */
function AudioPlayer({ url, dark, isMe }: { url: string; dark: boolean; isMe: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const WA = getWA(dark);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.onloadedmetadata = () => setDuration(a.duration);
    a.ontimeupdate = () => { setCurrent(a.currentTime); setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0); };
    a.onended = () => setPlaying(false);
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); } else { a.play(); setPlaying(true); }
  };

  const barColor = isMe ? (dark ? "#b2dfdb" : "#075e54") : (dark ? "#8696a0" : "#667781");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200, paddingBottom: 4 }}>
      <audio ref={audioRef} src={url} preload="metadata" style={{ display: "none" }} />
      <button onClick={toggle}
        style={{ width: 38, height: 38, borderRadius: "50%", background: isMe ? "#075e54" : WA.sendBtn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {playing ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" style={{ marginLeft: 2 }} />}
      </button>
      {/* Waveform bars */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 2, height: 28, position: "relative" }}>
        {Array.from({ length: 28 }).map((_, i) => {
          const h = 6 + Math.sin(i * 1.2) * 8 + Math.cos(i * 0.8) * 5;
          const filled = (i / 28) * 100 <= progress;
          return <div key={i} style={{ width: 3, height: Math.abs(h), borderRadius: 2, background: filled ? WA.sendBtn : barColor, transition: "background .1s", flexShrink: 0 }} />;
        })}
        <input type="range" min={0} max={duration || 1} step={0.1} value={current}
          onChange={e => { if (audioRef.current) { audioRef.current.currentTime = +e.target.value; setCurrent(+e.target.value); } }}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} />
      </div>
      <span style={{ fontSize: 11, color: isMe ? (dark ? "#b2dfdb" : "#075e54") : WA.sub, minWidth: 32 }}>
        {fmtSecs(playing ? Math.round(current) : Math.round(duration))}
      </span>
    </div>
  );
}

/* ════════════════════════ main component ════════════════════════ */
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

  /* ─── UI state ─── */
  const [newMessage, setNewMessage]       = useState("");
  const [showEmoji, setShowEmoji]         = useState(false);
  const [replyTo, setReplyTo]             = useState<Msg | null>(null);
  const [pickerMsgId, setPickerMsgId]     = useState<string | null>(null);
  const [contextMenu, setContextMenu]     = useState<{ msgId: string; x: number; y: number } | null>(null);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [editContent, setEditContent]     = useState("");
  const [copiedId, setCopiedId]           = useState<string | null>(null);
  const [showSearch, setShowSearch]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const [starred, setStarred]             = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("wa_starred_support") || "[]")); } catch { return new Set(); }
  });
  const [uploading, setUploading]         = useState(false);
  const [isRecording, setIsRecording]     = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const [supportTyping, setSupportTyping] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [lightboxUrl, setLightboxUrl]     = useState<string | null>(null);
  const [fileUrls, setFileUrls]           = useState<Record<string, string>>({});
  const [showMoreMenu, setShowMoreMenu]   = useState(false);
  const [showStarred, setShowStarred]     = useState(false);

  /* ─── Refs ─── */
  const bottomRef        = useRef<HTMLDivElement>(null);
  const textareaRef      = useRef<HTMLTextAreaElement>(null);
  const searchRef        = useRef<HTMLInputElement>(null);
  const chatAreaRef      = useRef<HTMLDivElement>(null);
  const fileInputRef     = useRef<HTMLInputElement>(null);
  const cameraInputRef   = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);
  const recordTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceChRef    = useRef<any>(null);
  const touchStartXRef   = useRef(0);
  const touchMsgRef      = useRef<Msg | null>(null);
  const editInputRef     = useRef<HTMLTextAreaElement>(null);

  /* ─── Chat room ─── */
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

  /* ─── Messages ─── */
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["wa-support-msgs", chatRoom?.id],
    queryFn: async () => {
      if (!chatRoom?.id) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("id,chat_room_id,sender_id,content,is_read,is_deleted,edited_at,parent_message_id,created_at,file_path,file_name")
        .eq("chat_room_id", chatRoom.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const ids = (data || []).map((m: any) => m.id);
      let rxns: any[] = [];
      if (ids.length > 0) {
        const { data: r } = await supabase.from("message_reactions").select("*").in("message_id", ids);
        rxns = r || [];
      }
      return (data || []).map((m: any) => ({ ...m, reactions: rxns.filter((r) => r.message_id === m.id) })) as Msg[];
    },
    enabled: !!chatRoom?.id,
    staleTime: 3000,
  });

  /* ─── Signed URLs for attachments ─── */
  useEffect(() => {
    const fileMsgs = messages.filter((m) => m.file_path && !fileUrls[m.id]);
    if (fileMsgs.length === 0) return;
    fileMsgs.forEach(async (m) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(m.file_path!, 3600);
      if (data?.signedUrl) setFileUrls(prev => ({ ...prev, [m.id]: data.signedUrl }));
    });
  }, [messages]);

  /* ─── Realtime messages + reactions ─── */
  useEffect(() => {
    if (!chatRoom?.id) return;
    const ch = supabase.channel(`wa-sup-${chatRoom.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `chat_room_id=eq.${chatRoom.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["wa-support-msgs", chatRoom.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["wa-support-msgs", chatRoom.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [chatRoom?.id, queryClient]);

  /* ─── Presence / typing ─── */
  useEffect(() => {
    if (!chatRoom?.id || !profile?.id) return;
    const ch = supabase.channel(`presence:sup:${chatRoom.id}`)
      .on("presence", { event: "sync" }, () => {
        const state = ch.presenceState<{ user_id: string; typing: boolean }>();
        const others = Object.values(state).flat().filter((s) => s.user_id !== profile.id);
        setSupportTyping(others.some((s) => s.typing));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await ch.track({ user_id: profile.id, typing: false });
      });
    presenceChRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [chatRoom?.id, profile?.id]);

  /* ─── Mark as read ─── */
  useEffect(() => {
    if (!chatRoom?.id || !profile?.id || messages.length === 0) return;
    const ids = messages.filter((m) => !m.is_read && m.sender_id !== profile.id).map((m) => m.id);
    if (ids.length > 0) supabase.from("messages").update({ is_read: true }).in("id", ids).then();
  }, [messages, chatRoom?.id, profile?.id]);

  /* ─── Auto scroll ─── */
  useEffect(() => {
    if (!showScrollBtn) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ─── Textarea resize ─── */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [newMessage]);

  /* ─── Focus edit input ─── */
  useEffect(() => {
    if (editingId) setTimeout(() => editInputRef.current?.focus(), 50);
  }, [editingId]);

  /* ─── Search focus ─── */
  useEffect(() => {
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 100);
  }, [showSearch]);

  /* ─── Close context menu on outside click ─── */
  useEffect(() => {
    if (!contextMenu && !showMoreMenu) return;
    const close = () => { setContextMenu(null); setShowMoreMenu(false); };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu, showMoreMenu]);

  const myId   = profile?.id || "";
  const msgMap = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  /* ─── Handlers ─── */

  /* Send */
  const handleSend = useCallback(async () => {
    const content = newMessage.trim();
    if (!content || !chatRoom?.id || !profile?.id) return;
    // Stop typing indicator
    presenceChRef.current?.track({ user_id: profile.id, typing: false });
    try {
      const ins: any = { chat_room_id: chatRoom.id, sender_id: profile.id, content };
      if (replyTo) ins.parent_message_id = replyTo.id;
      await supabase.from("messages").insert(ins);
      setNewMessage(""); setReplyTo(null); setShowEmoji(false);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (e: any) { toast.error(e.message); }
  }, [newMessage, chatRoom?.id, profile?.id, replyTo]);

  /* Typing indicator */
  const handleTyping = useCallback((val: string) => {
    setNewMessage(val);
    if (!profile?.id) return;
    presenceChRef.current?.track({ user_id: profile.id, typing: val.length > 0 });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      presenceChRef.current?.track({ user_id: profile.id, typing: false });
    }, 3000);
  }, [profile?.id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") setReplyTo(null);
  };

  /* Reaction */
  const handleReaction = useCallback(async (msgId: string, emoji: string) => {
    setPickerMsgId(null); setContextMenu(null);
    if (!profile?.id) return;
    const msg = messages.find((m) => m.id === msgId);
    const existing = msg?.reactions.find((r) => r.user_id === profile.id && r.emoji === emoji);
    if (existing) await supabase.from("message_reactions").delete().eq("id", existing.id);
    else await supabase.from("message_reactions").insert({ message_id: msgId, user_id: profile.id, emoji });
  }, [messages, profile?.id]);

  /* Copy */
  const handleCopy = useCallback((content: string, msgId: string) => {
    navigator.clipboard.writeText(content).then(() => { setCopiedId(msgId); setTimeout(() => setCopiedId(null), 2000); });
    setContextMenu(null);
  }, []);

  /* Delete */
  const handleDelete = useCallback(async (msgId: string) => {
    setContextMenu(null);
    const { error } = await supabase
      .from("messages")
      .update({ is_deleted: true, content: "" })
      .eq("id", msgId)
      .eq("sender_id", myId);
    if (error) {
      toast.error("Could not delete message. Please try again.");
    } else {
      queryClient.invalidateQueries({ queryKey: ["wa-support-msgs", chatRoom?.id] });
    }
  }, [myId, chatRoom?.id, queryClient]);

  /* Edit */
  const handleEdit = useCallback(async () => {
    if (!editingId || !editContent.trim()) return;
    await supabase.from("messages").update({ content: editContent.trim(), edited_at: new Date().toISOString() }).eq("id", editingId);
    setEditingId(null); setEditContent("");
  }, [editingId, editContent]);

  /* Star */
  const toggleStar = useCallback((msgId: string) => {
    setStarred(prev => {
      const next = new Set(prev);
      next.has(msgId) ? next.delete(msgId) : next.add(msgId);
      try { localStorage.setItem("wa_starred_support", JSON.stringify([...next])); } catch {}
      return next;
    });
    setContextMenu(null);
  }, []);

  /* Forward (copy with context) */
  const handleForward = useCallback((msg: Msg) => {
    navigator.clipboard.writeText(`[Forwarded from Support]\n${msg.content}`).then(() => toast.success("Message copied to clipboard"));
    setContextMenu(null);
  }, []);

  /* File upload */
  const uploadFile = useCallback(async (file: File) => {
    if (!profile?.id || !chatRoom?.id) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("Max file size: 20 MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${profile.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) throw error;
      const isImg = file.type.startsWith("image/");
      const ins: any = {
        chat_room_id: chatRoom.id, sender_id: profile.id,
        content: isImg ? "📷 Photo" : `📎 ${file.name}`,
        file_path: path, file_name: file.name,
      };
      if (replyTo) ins.parent_message_id = replyTo.id;
      await supabase.from("messages").insert(ins);
      setReplyTo(null);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  }, [profile?.id, chatRoom?.id, replyTo]);

  /* Voice recording */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (!profile?.id || !chatRoom?.id || audioChunksRef.current.length === 0) return;
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const path = `${profile.id}/voice_${Date.now()}.webm`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, blob);
        if (error) { toast.error("Voice upload failed"); return; }
        await supabase.from("messages").insert({
          chat_room_id: chatRoom.id, sender_id: profile.id,
          content: "🎤 Voice message", file_path: path, file_name: "voice.webm",
        });
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      };
      mr.start(200);
      mediaRecorderRef.current = mr;
      setIsRecording(true); setRecordingSecs(0);
      recordTimerRef.current = setInterval(() => setRecordingSecs((s) => s + 1), 1000);
    } catch { toast.error("Microphone access denied"); }
  }, [profile?.id, chatRoom?.id]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
    setRecordingSecs(0);
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      audioChunksRef.current = [];
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
    setRecordingSecs(0);
  }, []);

  /* Swipe to reply */
  const onTouchStart = useCallback((e: React.TouchEvent, msg: Msg) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchMsgRef.current = msg;
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    if (dx > 55 && touchMsgRef.current) { setReplyTo(touchMsgRef.current); textareaRef.current?.focus(); }
    touchMsgRef.current = null;
  }, []);

  /* Scroll tracking */
  const handleScroll = useCallback(() => {
    const el = chatAreaRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 150);
  }, []);

  /* Filtered messages */
  const visibleMsgs = useMemo(() =>
    searchQuery
      ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
      : showStarred
        ? messages.filter((m) => starred.has(m.id))
        : messages,
    [messages, searchQuery, showStarred, starred]
  );

  /* ─────────────────── Loading screen ─────────────────── */
  if (loadingRoom) {
    return (
      <div style={{ background: WA.bg, display: "flex", flexDirection: "column", height: "calc(100vh - 5rem)" }}>
        <div style={{ background: WA.header, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          {[32, 120, 60].map((w, i) => <Skeleton key={i} style={{ width: w, height: i === 0 ? 32 : i === 1 ? 13 : 9, borderRadius: i === 0 ? "50%" : 8, background: "rgba(255,255,255,.22)", marginBottom: i === 1 ? 5 : 0 }} />)}
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
  if (!chatRoom) {
    return (
      <div style={{ background: WA.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 5rem)", gap: 16, padding: 24 }}>
        <div style={{ width: 76, height: 76, borderRadius: "50%", background: WA.incoming, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,.18)" }}>
          <Shield size={34} style={{ color: WA.sub }} />
        </div>
        <p style={{ color: WA.incomingTxt, fontWeight: 700, fontSize: 17, margin: 0 }}>Support Chat Unavailable</p>
        <button onClick={() => navigate(-1)}
          style={{ padding: "10px 28px", borderRadius: 24, border: "none", background: WA.sendBtn, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Go Back
        </button>
      </div>
    );
  }

  /* ═══════════════════════ RENDER ═══════════════════════════ */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 5rem)", background: WA.bg, overflow: "hidden", position: "relative" }}
      onClick={() => { setContextMenu(null); setShowMoreMenu(false); setPickerMsgId(null); }}>

      {/* ─── Lightbox ─── */}
      {lightboxUrl && (
        <div onClick={() => setLightboxUrl(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.95)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button onClick={() => setLightboxUrl(null)}
            style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={22} />
          </button>
          <img src={lightboxUrl} alt="attachment" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, objectFit: "contain" }} />
          <a href={lightboxUrl} download target="_blank" rel="noopener noreferrer"
            style={{ position: "absolute", bottom: 24, right: 24, background: WA.sendBtn, borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
            <Download size={20} color="#fff" />
          </a>
        </div>
      )}

      {/* ─── File inputs (hidden) ─── */}
      <input ref={fileInputRef} type="file" style={{ display: "none" }}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.mp4,.mov"
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
      <input ref={cameraInputRef} type="file" capture="environment" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />

      {/* ─── Header ─── */}
      <div style={{ background: WA.header, display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,.25)", zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#fff", display: "flex" }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: WA.avatar, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Shield size={20} style={{ color: WA.header }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#fff", lineHeight: 1.2 }}>Support Team</p>
          <p style={{ margin: 0, fontSize: 12, color: WA.headerSub, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            Online · 24/7
          </p>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {[
            { Icon: Video, label: "Video call" },
            { Icon: Phone, label: "Call" },
            { Icon: Search, label: "Search", action: () => { setShowSearch(v => !v); setSearchQuery(""); } },
          ].map(({ Icon, label, action }) => (
            <button key={label} onClick={action} title={label}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#fff", display: "flex", borderRadius: 8 }}>
              <Icon size={20} />
            </button>
          ))}
          {/* More menu */}
          <div style={{ position: "relative" }}>
            <button onClick={e => { e.stopPropagation(); setShowMoreMenu(v => !v); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#fff", display: "flex", borderRadius: 8 }}>
              <MoreVertical size={20} />
            </button>
            {showMoreMenu && (
              <div onClick={e => e.stopPropagation()} style={{ position: "absolute", right: 0, top: "100%", background: WA.menu, border: `1px solid ${WA.menuBorder}`, borderRadius: 10, boxShadow: "0 8px 28px rgba(0,0,0,.25)", zIndex: 100, minWidth: 180, overflow: "hidden", animation: "waMenuIn .15s ease" }}>
                {[
                  { label: "⭐ Starred messages", action: () => { setShowStarred(v => !v); setShowMoreMenu(false); } },
                  { label: "🔍 Search", action: () => { setShowSearch(true); setShowMoreMenu(false); } },
                  { label: "🗑️ Clear chat", action: async () => { if (confirm("Clear all messages?")) { await supabase.from("messages").update({ is_deleted: true, content: "" }).eq("chat_room_id", chatRoom.id); } setShowMoreMenu(false); } },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: isDark ? "#e9edef" : "#111b21", textAlign: "left", fontFamily: "inherit", display: "block", transition: "background .1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >{item.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Search / starred banner ─── */}
      {(showSearch || showStarred) && (
        <div style={{ background: WA.header, padding: "8px 12px 10px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {showSearch && (
            <>
              <input ref={searchRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages..." style={{ flex: 1, background: "rgba(255,255,255,.15)", border: "none", borderRadius: 20, padding: "7px 14px", color: "#fff", fontSize: 14, outline: "none" }} />
              <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff" }}><X size={18} /></button>
            </>
          )}
          {showStarred && !showSearch && (
            <>
              <Star size={16} color="#fff" fill="#fff" />
              <span style={{ flex: 1, color: "#fff", fontSize: 14 }}>Starred Messages ({messages.filter(m => starred.has(m.id)).length})</span>
              <button onClick={() => setShowStarred(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff" }}><X size={18} /></button>
            </>
          )}
        </div>
      )}

      {/* ─── E2E notice ─── */}
      <div style={{ display: "flex", justifyContent: "center", padding: "6px 12px 2px", flexShrink: 0 }}>
        <div style={{ background: WA.encryptedBg, backdropFilter: "blur(4px)", padding: "4px 12px", borderRadius: 14, display: "flex", alignItems: "center", gap: 5, boxShadow: "0 1px 4px rgba(0,0,0,.1)" }}>
          <Lock size={11} style={{ color: WA.sub }} />
          <span style={{ fontSize: 11, color: WA.sub }}>Messages are end-to-end encrypted</span>
        </div>
      </div>

      {/* ─── Chat area ─── */}
      <div ref={chatAreaRef} onScroll={handleScroll}
        style={{ flex: 1, overflowY: "auto", padding: "6px 6px 4px", backgroundImage: WA.bgPattern, backgroundSize: "20px 20px", position: "relative" }}>
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
            <div style={{ background: WA.incoming, borderRadius: 16, padding: "14px 22px", maxWidth: 280, boxShadow: "0 1px 2px rgba(0,0,0,.13)", textAlign: "center" }}>
              <Shield size={36} style={{ color: WA.sendBtn, display: "block", margin: "0 auto 10px" }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: WA.incomingTxt }}>
                {searchQuery ? "No messages found" : showStarred ? "No starred messages" : "Support Chat"}
              </p>
              {!searchQuery && !showStarred && <p style={{ margin: "6px 0 0", fontSize: 12.5, color: WA.sub, lineHeight: 1.55 }}>Describe your issue and our team will help you shortly.</p>}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {visibleMsgs.map((msg, idx) => {
              const isMe     = msg.sender_id === myId;
              const dateLabel = getDateLabel(visibleMsgs, idx);
              const parent   = msg.parent_message_id ? msgMap.get(msg.parent_message_id) : null;
              const showPicker = pickerMsgId === msg.id;
              const fileUrl  = fileUrls[msg.id];
              const isImg    = isImage(msg.file_name);
              const isVoice  = isAudio(msg.file_name);
              const isDoc    = msg.file_path && !isImg && !isVoice;
              const isStarred = starred.has(msg.id);
              const isEditing = editingId === msg.id;

              const grouped = (msg.reactions || []).reduce<Record<string, { count: number; hasMe: boolean }>>((acc, r) => {
                if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasMe: false };
                acc[r.emoji].count++;
                if (r.user_id === myId) acc[r.emoji].hasMe = true;
                return acc;
              }, {});

              return (
                <div key={msg.id}>
                  {dateLabel && (
                    <div style={{ display: "flex", justifyContent: "center", margin: "10px 0 6px" }}>
                      <span style={{ background: WA.dateBg, backdropFilter: "blur(4px)", padding: "4px 14px", borderRadius: 20, fontSize: 12, color: isDark ? "#e9edef" : "#54656f", fontWeight: 600, boxShadow: "0 1px 4px rgba(0,0,0,.12)" }}>
                        {dateLabel}
                      </span>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", padding: "2px 8px", position: "relative" }}
                    onTouchStart={e => onTouchStart(e, msg)}
                    onTouchEnd={onTouchEnd}>

                    {!isMe && (
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: WA.avatar, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 6, marginBottom: 2, alignSelf: "flex-end" }}>
                        <Shield size={13} style={{ color: WA.header }} />
                      </div>
                    )}

                    <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 3 }}>
                      {/* Reaction picker */}
                      {showPicker && (
                        <div onClick={e => e.stopPropagation()}
                          style={{ display: "flex", gap: 3, padding: "6px 10px", background: WA.menu, borderRadius: 24, boxShadow: "0 6px 24px rgba(0,0,0,.25)", border: `1px solid ${WA.menuBorder}`, animation: "waPickerIn .15s ease" }}>
                          {QUICK_REACTIONS.map(e => (
                            <button key={e} onClick={() => handleReaction(msg.id, e)}
                              style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", padding: "2px 4px", borderRadius: 8, lineHeight: 1, transition: "transform .1s" }}
                              onMouseEnter={ev => (ev.currentTarget.style.transform = "scale(1.3)")}
                              onMouseLeave={ev => (ev.currentTarget.style.transform = "scale(1)")}
                            >{e}</button>
                          ))}
                        </div>
                      )}

                      {/* Bubble */}
                      <div style={{ position: "relative" }}>
                        <div
                          onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setContextMenu({ msgId: msg.id, x: e.clientX, y: e.clientY }); }}
                          onDoubleClick={() => setReplyTo(msg)}
                          style={{ background: isMe ? WA.outgoing : WA.incoming, borderRadius: isMe ? "12px 2px 12px 12px" : "2px 12px 12px 12px", padding: "7px 11px 5px", boxShadow: "0 1px 2px rgba(0,0,0,.13)", cursor: "default", minWidth: isVoice ? 220 : 80 }}>
                          {!isMe && <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#00a884" }}>Support Team</p>}

                          {/* Star indicator */}
                          {isStarred && <Star size={11} fill={WA.sub} style={{ color: WA.sub, float: "right", marginLeft: 4, marginTop: 2 }} />}

                          {/* Quoted reply */}
                          {parent && !parent.is_deleted && (
                            <div style={{ background: WA.quote, borderLeft: `4px solid ${WA.quoteLine}`, borderRadius: "6px 6px 6px 0", padding: "5px 10px", marginBottom: 6, overflow: "hidden" }}>
                              <p style={{ margin: "0 0 1px", fontSize: 12, fontWeight: 700, color: WA.quoteLine }}>
                                {parent.sender_id === myId ? "You" : "Support Team"}
                              </p>
                              <p style={{ margin: 0, fontSize: 12, color: WA.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                                {parent.file_name ? `📎 ${parent.file_name}` : parent.content}
                              </p>
                            </div>
                          )}

                          {/* Deleted */}
                          {msg.is_deleted ? (
                            <p style={{ margin: 0, fontSize: 13.5, color: WA.sub, fontStyle: "italic", lineHeight: 1.5 }}>🚫 This message was deleted</p>
                          ) : isEditing ? (
                            /* Edit mode */
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} ref={editInputRef}
                                style={{ background: "none", border: `1px solid ${WA.quoteLine}`, borderRadius: 8, padding: "6px 8px", color: isMe ? WA.outgoingTxt : WA.incomingTxt, fontSize: 14, lineHeight: 1.5, fontFamily: "inherit", resize: "none", minWidth: 160, outline: "none" }}
                                rows={3} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEdit(); } if (e.key === "Escape") { setEditingId(null); } }} />
                              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                <button onClick={() => setEditingId(null)} style={{ padding: "3px 10px", borderRadius: 12, border: `1px solid ${WA.border}`, background: "none", cursor: "pointer", fontSize: 12, color: WA.sub }}>Cancel</button>
                                <button onClick={handleEdit} style={{ padding: "3px 10px", borderRadius: 12, border: "none", background: WA.sendBtn, cursor: "pointer", fontSize: 12, color: "#fff" }}>Save</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Image */}
                              {isImg && fileUrl && (
                                <img src={fileUrl} alt={msg.file_name || "photo"} onClick={() => setLightboxUrl(fileUrl)}
                                  style={{ maxWidth: 240, maxHeight: 220, width: "100%", borderRadius: 8, objectFit: "cover", cursor: "pointer", display: "block", marginBottom: 4 }} />
                              )}
                              {/* Voice */}
                              {isVoice && fileUrl && <AudioPlayer url={fileUrl} dark={isDark} isMe={isMe} />}
                              {/* Doc */}
                              {isDoc && (
                                <a href={fileUrl || "#"} target="_blank" rel="noopener noreferrer"
                                  style={{ display: "flex", alignItems: "center", gap: 10, background: WA.fileBg, borderRadius: 10, padding: "10px 12px", textDecoration: "none", marginBottom: 4, maxWidth: 240 }}>
                                  <div style={{ width: 40, height: 40, borderRadius: 10, background: WA.sendBtn, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <FileText size={20} color="#fff" />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isMe ? WA.outgoingTxt : WA.incomingTxt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.file_name}</p>
                                    <p style={{ margin: 0, fontSize: 11, color: WA.sub }}>Document</p>
                                  </div>
                                  <Download size={16} style={{ color: WA.sub, flexShrink: 0 }} />
                                </a>
                              )}
                              {/* Text (with link detection) */}
                              {(!isImg && !isVoice || msg.content !== "📷 Photo" && msg.content !== "🎤 Voice message") && (
                                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, wordBreak: "break-word", whiteSpace: "pre-wrap", color: isMe ? WA.outgoingTxt : WA.incomingTxt }}>
                                  {detectLinks(msg.content)}
                                  {msg.edited_at && <span style={{ fontSize: 10, color: WA.sub, marginLeft: 5, fontStyle: "italic" }}>edited</span>}
                                </p>
                              )}
                            </>
                          )}

                          {/* Time + ticks */}
                          {!isEditing && (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: 3 }}>
                              {copiedId === msg.id && <span style={{ fontSize: 10, color: WA.sub }}>Copied!</span>}
                              <span style={{ fontSize: 11, color: WA.sub }}>{fmtTime(msg.created_at)}</span>
                              {isMe && !msg.is_deleted && (
                                msg.is_read
                                  ? <CheckCheck size={14} style={{ color: WA.tickBlue }} />
                                  : <Check size={14} style={{ color: WA.tickGrey }} />
                              )}
                            </div>
                          )}

                          {/* React button on hover */}
                          {!msg.is_deleted && !isEditing && (
                            <button onClick={e => { e.stopPropagation(); setPickerMsgId(pickerMsgId === msg.id ? null : msg.id); }}
                              className="wa-react-btn"
                              style={{ position: "absolute", bottom: -10, [isMe ? "left" : "right"]: -10, background: WA.menu, border: `1px solid ${WA.menuBorder}`, borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, lineHeight: 1, boxShadow: "0 2px 8px rgba(0,0,0,.18)", opacity: 0, transition: "opacity .15s" }}>
                              😊
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reaction pills */}
                      {Object.keys(grouped).length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                          {Object.entries(grouped).map(([emoji, { count, hasMe }]) => (
                            <button key={emoji} onClick={() => handleReaction(msg.id, emoji)}
                              style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 9px", borderRadius: 12, border: `1.5px solid ${hasMe ? "#00a884" : WA.border}`, background: hasMe ? (isDark ? "rgba(0,168,132,.2)" : "rgba(0,168,132,.10)") : (isDark ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.9)"), cursor: "pointer", fontSize: 14, fontWeight: 600, boxShadow: "0 1px 3px rgba(0,0,0,.1)" }}>
                              {emoji}<span style={{ fontSize: 11, color: WA.sub }}>{count}</span>
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
            {supportTyping && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, padding: "2px 8px" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: WA.avatar, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Shield size={13} style={{ color: WA.header }} />
                </div>
                <div style={{ background: WA.incoming, borderRadius: "2px 12px 12px 12px", padding: "10px 16px", boxShadow: "0 1px 2px rgba(0,0,0,.13)" }}>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: WA.sub, animation: `waDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ─── Context Menu ─── */}
      {contextMenu && (() => {
        const msg = msgMap.get(contextMenu.msgId);
        if (!msg) return null;
        const isMe = msg.sender_id === myId;
        return (
          <div onClick={e => e.stopPropagation()} style={{ position: "fixed", top: Math.min(contextMenu.y, window.innerHeight - 280), left: Math.min(contextMenu.x, window.innerWidth - 190), background: WA.menu, border: `1px solid ${WA.menuBorder}`, borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,.28)", zIndex: 1000, minWidth: 180, overflow: "hidden", animation: "waMenuIn .15s ease" }}>
            {!msg.is_deleted && (
              <div style={{ display: "flex", gap: 0, padding: "10px 12px 8px", borderBottom: `1px solid ${WA.menuBorder}` }}>
                {QUICK_REACTIONS.map(e => (
                  <button key={e} onClick={() => handleReaction(msg.id, e)}
                    style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 8, lineHeight: 1, transition: "transform .1s" }}
                    onMouseEnter={ev => (ev.currentTarget.style.transform = "scale(1.25)")}
                    onMouseLeave={ev => (ev.currentTarget.style.transform = "scale(1)")}
                  >{e}</button>
                ))}
              </div>
            )}
            {[
              { icon: Reply, label: "Reply", action: () => { setReplyTo(msg); setContextMenu(null); textareaRef.current?.focus(); } },
              { icon: Star, label: starred.has(msg.id) ? "Unstar" : "Star", action: () => toggleStar(msg.id) },
              { icon: Copy, label: "Copy", action: () => handleCopy(msg.content, msg.id), hide: msg.is_deleted },
              { icon: Forward, label: "Forward", action: () => handleForward(msg), hide: msg.is_deleted },
              { icon: Pencil, label: "Edit", action: () => { setEditingId(msg.id); setEditContent(msg.content); setContextMenu(null); }, hide: !isMe || msg.is_deleted },
              { icon: Trash2, label: "Delete", action: () => handleDelete(msg.id), hide: !isMe || msg.is_deleted, danger: true },
            ].filter(item => !item.hide).map(item => (
              <button key={item.label} onClick={item.action}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, color: item.danger ? "#ef4444" : (isDark ? "#e9edef" : "#111b21"), textAlign: "left", transition: "background .1s" }}
                onMouseEnter={ev => (ev.currentTarget.style.background = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)")}
                onMouseLeave={ev => (ev.currentTarget.style.background = "none")}>
                <item.icon size={17} />{item.label}
              </button>
            ))}
          </div>
        );
      })()}

      {/* ─── Scroll-to-bottom FAB ─── */}
      {showScrollBtn && (
        <button onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
          style={{ position: "absolute", bottom: 100, right: 16, width: 44, height: 44, borderRadius: "50%", background: WA.menu, border: `1px solid ${WA.menuBorder}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,.22)", zIndex: 20 }}>
          <ChevronDown size={22} style={{ color: WA.sub }} />
        </button>
      )}

      {/* ─── Emoji picker (compose) ─── */}
      {showEmoji && (
        <div style={{ background: WA.inputBar, borderTop: `1px solid ${WA.border}`, padding: "10px 12px", flexShrink: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4 }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setNewMessage(m => m + e)}
                style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, lineHeight: 1, textAlign: "center" }}>{e}</button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Reply preview ─── */}
      {replyTo && (
        <div style={{ background: WA.replyBar, borderTop: `1px solid ${WA.border}`, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <Reply size={18} style={{ color: WA.sendBtn, flexShrink: 0 }} />
          <div style={{ flex: 1, borderLeft: `4px solid ${WA.quoteLine}`, paddingLeft: 10, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: WA.quoteLine }}>{replyTo.sender_id === myId ? "You" : "Support Team"}</p>
            <p style={{ margin: 0, fontSize: 12.5, color: WA.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {replyTo.file_name ? `📎 ${replyTo.file_name}` : replyTo.content}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: WA.sub, padding: 4, display: "flex", borderRadius: "50%" }}><X size={18} /></button>
        </div>
      )}

      {/* ─── Recording UI ─── */}
      {isRecording && (
        <div style={{ background: WA.inputBar, borderTop: `1px solid ${WA.border}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button onClick={cancelRecording} style={{ background: "none", border: "none", cursor: "pointer", color: WA.sub }}><X size={22} /></button>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: WA.recBg, animation: "waRecPulse 1s ease-in-out infinite", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 15, color: isDark ? "#e9edef" : "#111b21", fontWeight: 500 }}>Recording… {fmtSecs(recordingSecs)}</span>
          <button onClick={stopRecording}
            style={{ width: 46, height: 46, borderRadius: "50%", border: "none", background: WA.sendBtn, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,168,132,.4)" }}>
            <Send size={20} style={{ marginLeft: 2 }} />
          </button>
        </div>
      )}

      {/* ─── Input bar ─── */}
      {!isRecording && (
        <div style={{ background: WA.inputBar, padding: "8px 10px 10px", flexShrink: 0 }}>
          {/* Uploading indicator */}
          {uploading && (
            <div style={{ padding: "4px 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${WA.sendBtn}`, borderTopColor: "transparent", animation: "waSpin 0.7s linear infinite" }} />
              <span style={{ fontSize: 12, color: WA.sub }}>Uploading…</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            {/* Pill */}
            <div style={{ flex: 1, background: WA.inputBg, borderRadius: 26, display: "flex", alignItems: "flex-end", padding: "6px 8px 6px 12px", boxShadow: "0 1px 3px rgba(0,0,0,.12)", minHeight: 44 }}>
              <button onClick={() => setShowEmoji(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px 4px 0", color: WA.emojiBtn, flexShrink: 0 }}><Smile size={22} /></button>

              {/* Attachment dropdown */}
              <div style={{ position: "relative" }}>
                <button onClick={e => { e.stopPropagation(); setShowMoreMenu(false); fileInputRef.current?.click(); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px 4px 0", color: WA.emojiBtn, flexShrink: 0 }}>
                  <Paperclip size={22} />
                </button>
              </div>

              {/* Camera */}
              <button onClick={() => cameraInputRef.current?.click()}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px 4px 0", color: WA.emojiBtn, flexShrink: 0 }}>
                <Camera size={22} />
              </button>

              <textarea ref={textareaRef} value={newMessage}
                onChange={e => { handleTyping(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message" rows={1}
                style={{ flex: 1, background: "none", border: "none", outline: "none", resize: "none", color: WA.inputTxt, fontSize: 15, lineHeight: 1.5, padding: "2px 0", fontFamily: "inherit", maxHeight: 120, overflowY: "auto" }} />
            </div>

            {/* Send / Mic */}
            {newMessage.trim() ? (
              <button onClick={handleSend}
                style={{ width: 46, height: 46, borderRadius: "50%", border: "none", background: WA.sendBtn, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,168,132,.4)" }}>
                <Send size={20} style={{ marginLeft: 2 }} />
              </button>
            ) : (
              <button
                onMouseDown={startRecording}
                onTouchStart={startRecording}
                style={{ width: 46, height: 46, borderRadius: "50%", border: "none", background: WA.sendBtn, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,168,132,.4)" }}>
                <Mic size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Styles ─── */}
      <style>{`
        .wa-msg-row:hover .wa-react-btn { opacity: 1 !important; }
        @keyframes waPickerIn { from { opacity:0; transform:scale(.85) translateY(6px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes waMenuIn  { from { opacity:0; transform:scale(.92); } to { opacity:1; transform:scale(1); } }
        @keyframes waDot { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-5px); } }
        @keyframes waRecPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(1.3); } }
        @keyframes waSpin { to { transform:rotate(360deg); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(134,150,160,.35); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default EmployeeSupportChat;
