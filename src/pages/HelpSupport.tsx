import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Send, Search, X, HelpCircle, Smile, Paperclip, Mic,
  ChevronDown, Check, CheckCheck, CornerUpLeft, Copy, Trash2,
  ArrowLeft, MoreVertical, Camera, Play, Pause, Square,
  Star, Forward, ImageIcon, FileText, Lock, Volume2,
  Phone, Video, ZoomIn,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useSupportChat, useMyConversation } from "@/hooks/use-support-chat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

/* ─── helpers ─── */
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

const fmtSecs = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function fmtDate(iso: string) {
  const d = new Date(iso), now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" });
}
function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

const isImage = (name: string | null) => !!name?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
const isAudio = (name: string | null) => !!name?.match(/\.(webm|ogg|mp3|m4a|wav|aac)$/i);

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const EMOJIS = ["😊","😂","❤️","👍","🙏","😭","🔥","✅","💯","😍","🤔","👏","🎉","😅","💪","🙌","😎","🤝","💬","⭐","😮","😢","🥳","💔","👀","✨","🫶","🤩","😁","🙃","🥺","😬","🤣","😆","😇","🤗","🤫","😏","😒","🙄"];

const QUICK_REPLIES = [
  "Hello! How can I help you?",
  "I need help with my account",
  "My payment is pending",
  "I have a project issue",
];

/* ─── WhatsApp palette ─── */
const getWA = (dark: boolean) => ({
  bg: dark ? "#0b141a" : "#efeae2",
  bgPattern: dark
    ? "radial-gradient(circle,rgba(255,255,255,.03) 1px,transparent 1px)"
    : "radial-gradient(circle,rgba(0,0,0,.07) 1px,transparent 1px)",
  header: dark ? "#202c33" : "#075e54",
  headerText: "#fff",
  headerSub: "rgba(255,255,255,.72)",
  incoming: dark ? "#202c33" : "#ffffff",
  incomingTxt: dark ? "#e9edef" : "#111b21",
  outgoing: dark ? "#005c4b" : "#d9fdd3",
  outgoingTxt: dark ? "#e9edef" : "#111b21",
  inputBar: dark ? "#111b21" : "#f0f2f5",
  inputBg: dark ? "#2a3942" : "#ffffff",
  inputTxt: dark ? "#d1d7db" : "#111b21",
  sub: dark ? "#8696a0" : "#667781",
  border: dark ? "rgba(134,150,160,.15)" : "rgba(0,0,0,.08)",
  tickBlue: "#53bdeb",
  tickGrey: dark ? "#8696a0" : "#b0bec5",
  sendBtn: "#00a884",
  emojiBtn: dark ? "#8696a0" : "#54656f",
  avatar: dark ? "#2a3942" : "#dfe5e7",
  dateBg: dark ? "rgba(11,20,26,.85)" : "rgba(225,218,200,.85)",
  menu: dark ? "#233138" : "#ffffff",
  menuBorder: dark ? "rgba(134,150,160,.2)" : "rgba(0,0,0,.08)",
  quote: dark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)",
  quoteLine: "#00a884",
  replyBar: dark ? "#1f2c33" : "#f0f2f5",
  encryptedBg: dark ? "rgba(11,20,26,.8)" : "rgba(225,218,200,.8)",
});

/* ─── VoicePlayer ─── */
function VoicePlayer({ filePath, isMe, WA }: { filePath: string; isMe: boolean; WA: ReturnType<typeof getWA> }) {
  const [url, setUrl]       = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dur, setDur]       = useState(0);
  const [cur, setCur]       = useState(0);
  const aRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    supabase.storage.from("support-files").createSignedUrl(filePath, 3600)
      .then(({ data }) => { if (data?.signedUrl) setUrl(data.signedUrl); });
  }, [filePath]);

  const toggle = () => {
    const a = aRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const barColor = isMe ? (WA.header === "#075e54" ? "#3e8e6e" : "#3d8c6e") : WA.sub;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200, paddingBottom: 4 }}>
      <audio ref={aRef} src={url ?? undefined} preload="metadata"
        onLoadedMetadata={() => { if (aRef.current) setDur(aRef.current.duration); }}
        onTimeUpdate={() => { const a = aRef.current; if (a && a.duration) { setCur(a.currentTime); setProgress((a.currentTime / a.duration) * 100); } }}
        onEnded={() => { setPlaying(false); setProgress(0); setCur(0); }}
        style={{ display: "none" }} />
      <button onClick={toggle}
        style={{ width: 38, height: 38, borderRadius: "50%", background: WA.sendBtn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {playing ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" style={{ marginLeft: 2 }} />}
      </button>
      <div style={{ flex: 1, position: "relative", height: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2, height: "100%" }}>
          {Array.from({ length: 26 }).map((_, i) => {
            const h = 5 + Math.abs(Math.sin(i * 1.1) * 9 + Math.cos(i * 0.7) * 4);
            return (
              <div key={i} style={{ width: 3, height: Math.abs(h), borderRadius: 2, flexShrink: 0,
                background: (i / 26) * 100 <= progress ? WA.sendBtn : barColor, transition: "background .1s" }} />
            );
          })}
        </div>
        <input type="range" min={0} max={dur || 1} step={0.1} value={cur}
          onChange={e => { if (aRef.current) { aRef.current.currentTime = +e.target.value; setCur(+e.target.value); } }}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
        <Mic size={11} style={{ color: isMe ? WA.headerSub : WA.sub }} />
        <span style={{ fontSize: 10, color: isMe ? WA.headerSub : WA.sub, minWidth: 30 }}>
          {fmtSecs(playing ? Math.round(cur) : Math.round(dur))}
        </span>
      </div>
    </div>
  );
}

/* ─── ImageBubble ─── */
function ImageBubble({ filePath, onClick }: { filePath: string; onClick: (url: string) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from("support-files").createSignedUrl(filePath, 3600)
      .then(({ data }) => { if (data?.signedUrl) setUrl(data.signedUrl); });
  }, [filePath]);
  if (!url) return <div style={{ width: 180, height: 120, borderRadius: 10, background: "rgba(128,128,128,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><ImageIcon size={24} style={{ opacity: .5 }} /></div>;
  return (
    <div style={{ position: "relative", cursor: "pointer", borderRadius: 10, overflow: "hidden", maxWidth: 220 }} onClick={() => onClick(url)}>
      <img src={url} alt="attachment" style={{ width: "100%", maxWidth: 220, display: "block", borderRadius: 10 }} />
      <div style={{ position: "absolute", bottom: 6, right: 8, background: "rgba(0,0,0,.45)", borderRadius: 12, padding: "1px 6px", display: "flex", alignItems: "center", gap: 3 }}>
        <ZoomIn size={10} style={{ color: "#fff" }} />
      </div>
    </div>
  );
}

/* ════════════════════════ MAIN COMPONENT ════════════════════════ */
const HelpSupport = () => {
  const { profile } = useAuth();
  const { themeKey } = useDashboardTheme();
  const dark = themeKey === "black";
  const WA = getWA(dark);

  const { data: conversation, isLoading: loadingConv } = useMyConversation();
  const { messages, isLoading: loadingMessages, sendMessage, deleteMessage, clearHistory, toggleReaction } = useSupportChat(conversation?.id);

  /* ─── UI state ─── */
  const [newMessage, setNewMessage]       = useState("");
  const [showEmoji, setShowEmoji]         = useState(false);
  const [replyTo, setReplyTo]             = useState<any>(null);
  const [ctxMsg, setCtxMsg]               = useState<any>(null);
  const [ctxPos, setCtxPos]               = useState({ x: 0, y: 0, isMe: false });
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [typing, setTyping]               = useState(false);
  const [expandedFaq, setExpandedFaq]     = useState<string | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [confirmClear, setConfirmClear]   = useState(false);
  const [isRecording, setIsRecording]     = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showMicDenied, setShowMicDenied] = useState(false);
  const [showCamDenied, setShowCamDenied] = useState(false);
  const [searchOpen, setSearchOpen]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const [activeTab, setActiveTab]         = useState("messages");
  const [lightboxUrl, setLightboxUrl]     = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showStarred, setShowStarred]     = useState(false);
  const [starred, setStarred]             = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("wa_sup_starred") || "[]")); } catch { return new Set(); }
  });

  /* ─── Refs ─── */
  const scrollRef          = useRef<HTMLDivElement>(null);
  const bottomRef          = useRef<HTMLDivElement>(null);
  const inputRef           = useRef<HTMLTextAreaElement>(null);
  const fileRef            = useRef<HTMLInputElement>(null);
  const searchRef          = useRef<HTMLInputElement>(null);
  const typingTimer        = useRef<any>(null);
  const mediaRecorderRef   = useRef<MediaRecorder | null>(null);
  const audioChunksRef     = useRef<Blob[]>([]);
  const recordingTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const cancelledRef       = useRef(false);
  const videoRef           = useRef<HTMLVideoElement>(null);
  const canvasRef          = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef    = useRef<MediaStream | null>(null);
  const touchStartXRef     = useRef(0);
  const touchMsgRef        = useRef<any>(null);

  const [showCamera, setShowCamera]     = useState(false);
  const [facingMode, setFacingMode]     = useState<"environment" | "user">("environment");
  const [cameraReady, setCameraReady]   = useState(false);

  /* ─── FAQs ─── */
  const { data: faqs = [] } = useQuery({
    queryKey: ["help-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faqs").select("*").eq("is_active", true).order("display_order");
      if (error) throw error;
      return data || [];
    },
  });

  /* ─── Agent profile ─── */
  const agentSenderId = messages.find((m) => m.sender_id !== profile?.id)?.sender_id ?? null;
  const { data: agentProfile } = useQuery({
    queryKey: ["support-agent-profile", agentSenderId],
    queryFn: async () => {
      if (!agentSenderId) return null;
      const { data } = await supabase.from("profiles").select("profile_photo_path, full_name").eq("id", agentSenderId).maybeSingle();
      return data ?? null;
    },
    enabled: !!agentSenderId,
    staleTime: 60_000,
  });

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    if (activeTab === "messages") scrollToBottom(false);
  }, [messages.length, activeTab]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };

  /* ─── Typing simulation ─── */
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

  /* ─── Textarea auto-resize ─── */
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [newMessage]);

  /* ─── Search focus ─── */
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  /* ─── Close menus on outside click ─── */
  useEffect(() => {
    if (!ctxMsg && !showHeaderMenu && !showAttachMenu) return;
    const close = () => { setCtxMsg(null); setShowHeaderMenu(false); setShowAttachMenu(false); };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [ctxMsg, showHeaderMenu, showAttachMenu]);

  const filteredMessages = useMemo(() => {
    let msgs = messages;
    if (showStarred) msgs = msgs.filter(m => starred.has(m.id));
    if (searchQuery) msgs = msgs.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
    return msgs;
  }, [messages, searchQuery, showStarred, starred]);

  const unreadCount = useMemo(
    () => messages.filter(m => !m.is_read && m.sender_id !== profile?.id).length,
    [messages, profile?.id]
  );

  /* ─── Send ─── */
  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content) return;
    try {
      const msgContent = replyTo
        ? `[Reply to: "${replyTo.content.slice(0, 40)}…"]\n${content}`
        : content;
      await sendMessage(msgContent);
      setNewMessage(""); setReplyTo(null); setShowEmoji(false);
      if (inputRef.current) inputRef.current.style.height = "auto";
      setTimeout(() => scrollToBottom(), 100);
    } catch (e: any) { toast.error(e.message); }
  };

  /* ─── File upload ─── */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversation?.id || !profile?.id) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("Max file size: 20 MB"); return; }
    setShowAttachMenu(false);
    try {
      const ext  = file.name.split(".").pop();
      const path = `support/${conversation.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("support-files").upload(path, file);
      if (upErr) throw upErr;
      const label = file.type.startsWith("image/") ? "📷 Photo" : `📎 ${file.name}`;
      await sendMessage(label, path, file.name);
      setTimeout(() => scrollToBottom(), 100);
    } catch (err: any) { toast.error(err.message || "Upload failed"); }
    e.target.value = "";
  };

  /* ─── Camera ─── */
  const stopCameraStream = () => {
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    cameraStreamRef.current = null;
  };
  const openCamera = async (mode: "environment" | "user" = facingMode) => {
    try {
      stopCameraStream();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } } });
      cameraStreamRef.current = stream;
      setFacingMode(mode); setShowCamera(true); setCameraReady(false); setShowAttachMenu(false);
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      }, 80);
    } catch (err: any) {
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") setShowCamDenied(true);
      else toast.error("Could not access camera");
    }
  };
  const closeCamera = () => { stopCameraStream(); setShowCamera(false); setCameraReady(false); };
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !conversation?.id || !profile?.id) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    if (facingMode === "user") { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob(async (blob) => {
      if (!blob) return;
      closeCamera();
      try {
        const path = `support/${conversation!.id}/${Date.now()}.jpg`;
        const { error } = await supabase.storage.from("support-files").upload(path, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        await sendMessage("📷 Photo", path, "photo.jpg");
        setTimeout(() => scrollToBottom(), 100);
      } catch (err: any) { toast.error(err.message || "Failed to send photo"); }
    }, "image/jpeg", 0.92);
  };

  /* ─── Voice recording ─── */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const mr = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = []; cancelledRef.current = false;
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        if (cancelledRef.current) { audioChunksRef.current = []; return; }
        const ext = mimeType.includes("webm") ? "webm" : "ogg";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 500) return;
        try {
          if (!conversation?.id || !profile?.id) return;
          const path = `support/${conversation.id}/${Date.now()}.${ext}`;
          const { error } = await supabase.storage.from("support-files").upload(path, blob, { contentType: mimeType });
          if (error) throw error;
          await sendMessage("🎤 Voice message", path, `voice.${ext}`);
          setTimeout(() => scrollToBottom(), 100);
        } catch (err: any) { toast.error(err.message || "Failed to send voice message"); }
      };
      mr.start(100); mediaRecorderRef.current = mr;
      setIsRecording(true); setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err: any) {
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") setShowMicDenied(true);
      else toast.error("Could not access microphone");
    }
  };
  const stopAndSend = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    cancelledRef.current = false;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };
  const cancelRecording = () => {
    if (!mediaRecorderRef.current) return;
    cancelledRef.current = true;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaRecorderRef.current.stop();
    setIsRecording(false); setRecordingTime(0);
  };

  /* ─── Context menu ─── */
  const openCtxMenu = (e: React.MouseEvent | React.TouchEvent, msg: any) => {
    e.preventDefault(); e.stopPropagation();
    const isMe = msg.sender_id === profile?.id;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(rect.left, window.innerWidth - 210);
    const y = Math.min(rect.bottom + 6, window.innerHeight - 280);
    setCtxPos({ x, y, isMe });
    setCtxMsg(msg);
  };

  /* ─── Swipe to reply ─── */
  const onTouchStart = (e: React.TouchEvent, msg: any) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchMsgRef.current = msg;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    if (dx > 55 && touchMsgRef.current) { setReplyTo(touchMsgRef.current); inputRef.current?.focus(); }
    touchMsgRef.current = null;
  };

  /* ─── Star ─── */
  const toggleStar = (msgId: string) => {
    setStarred(prev => {
      const next = new Set(prev);
      next.has(msgId) ? next.delete(msgId) : next.add(msgId);
      try { localStorage.setItem("wa_sup_starred", JSON.stringify([...next])); } catch {}
      return next;
    });
    setCtxMsg(null);
  };

  /* ─── Forward (copy) ─── */
  const handleForward = (msg: any) => {
    navigator.clipboard.writeText(`[Forwarded from Support]\n${msg.content}`)
      .then(() => toast.success("Message copied to clipboard"));
    setCtxMsg(null);
  };

  /* ─── Copy ─── */
  const handleCopy = (msg: any) => {
    navigator.clipboard.writeText(msg.content).then(() => toast.success("Copied!"));
    setCtxMsg(null);
  };

  /* ─── Delete ─── */
  const handleDelete = async (msg: any) => {
    setCtxMsg(null);
    try {
      await deleteMessage(msg.id, msg.sender_id);
    } catch (e: any) { toast.error(e.message || "Failed to delete message"); }
  };

  /* ─── Clear history ─── */
  const handleClearHistory = async () => {
    setConfirmClear(false); setShowHeaderMenu(false);
    if (!conversation?.id) return;
    try {
      await clearHistory(conversation.id);
      toast.success("Chat history cleared");
    } catch (e: any) { toast.error(e.message || "Failed to clear history"); }
  };

  /* ─── Loading ─── */
  if (loadingConv) {
    return (
      <div style={{ background: WA.bg, display: "flex", flexDirection: "column", height: "calc(100vh - 5rem)" }}>
        <div style={{ background: WA.header, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.2)" }} />
          <div>
            <div style={{ width: 110, height: 13, borderRadius: 8, background: "rgba(255,255,255,.2)", marginBottom: 6 }} />
            <div style={{ width: 60, height: 9, borderRadius: 8, background: "rgba(255,255,255,.15)" }} />
          </div>
        </div>
        <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {[70, 55, 80, 60].map((w, i) => (
            <div key={i} style={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-end" : "flex-start" }}>
              <Skeleton style={{ width: `${w}%`, height: 44, borderRadius: 16, background: "rgba(128,128,128,.15)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ────────────────── MESSAGES TAB ────────────────── */
  if (activeTab === "messages") {
    return (
      <div style={{ display: "flex", flexDirection: "column", position: "fixed", top: 56, left: 0, right: 0, bottom: 70, zIndex: 40, background: WA.bg }}
        onClick={() => { setCtxMsg(null); setShowHeaderMenu(false); setShowAttachMenu(false); }}>

        {/* ══ Global styles ══ */}
        <style>{`
          @keyframes wa-bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
          @keyframes wa-spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
          @keyframes wa-rec { 0%,100%{opacity:1} 50%{opacity:.3} }
          .wa-scroll::-webkit-scrollbar{display:none}
          .wa-scroll{scrollbar-width:none}
          .wa-send-btn:active{transform:scale(.92)}
          .wa-bubble:active{opacity:.85}
        `}</style>

        {/* ══ Header ══ */}
        <div style={{ background: WA.header, padding: "10px 8px 10px 4px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, zIndex: 20 }}>
          <button onClick={() => setActiveTab("dashboard")} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 4px 6px 8px", display: "flex", alignItems: "center" }}>
            <ArrowLeft size={20} color="#fff" />
          </button>
          {/* Avatar */}
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", cursor: "pointer" }}>
            {agentProfile?.profile_photo_path
              ? <img src={agentProfile.profile_photo_path} alt="Support" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>FI</span>}
          </div>
          <div style={{ flex: 1, cursor: "pointer" }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#fff", margin: 0, lineHeight: 1.2 }}>Flexpay Support (24/7)</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.8)", margin: 0, lineHeight: 1.2 }}>
              {typing ? "typing..." : "online"}
            </p>
          </div>
          {/* Header icons */}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button onClick={e => { e.stopPropagation(); setSearchOpen(s => !s); setSearchQuery(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 8, display: "flex" }}>
              <Search size={20} color="rgba(255,255,255,.85)" />
            </button>
            <button onClick={e => { e.stopPropagation(); setShowHeaderMenu(s => !s); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", position: "relative" }}>
              <MoreVertical size={20} color="rgba(255,255,255,.85)" />
              {showHeaderMenu && (
                <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, minWidth: 190, background: WA.menu, border: `1px solid ${WA.menuBorder}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.28)", zIndex: 50 }}>
                  {[
                    { label: "Search", icon: Search, action: () => { setShowHeaderMenu(false); setSearchOpen(s => !s); setSearchQuery(""); } },
                    { label: showStarred ? "All Messages" : "Starred Messages", icon: Star, action: () => { setShowStarred(s => !s); setShowHeaderMenu(false); } },
                    { label: "Clear History", icon: Trash2, action: () => { setShowHeaderMenu(false); setConfirmClear(true); }, danger: true },
                  ].map((item, i, arr) => {
                    const Icon = item.icon;
                    return (
                      <button key={item.label} onClick={item.action}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", background: "none", border: "none", cursor: "pointer", color: (item as any).danger ? "#ef4444" : (dark ? "#e9edef" : "#111b21"), fontSize: 14, fontWeight: 500, borderBottom: i < arr.length - 1 ? `1px solid ${WA.menuBorder}` : "none", textAlign: "left" }}>
                        <Icon size={16} style={{ color: (item as any).danger ? "#ef4444" : WA.sub }} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* ══ Search bar ══ */}
        {searchOpen && (
          <div style={{ background: dark ? "#111b21" : "#f0f2f5", padding: "8px 12px", display: "flex", gap: 10, alignItems: "center", flexShrink: 0, borderBottom: `1px solid ${WA.border}` }}>
            <Search size={16} style={{ color: WA.sub, flexShrink: 0 }} />
            <input ref={searchRef} autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: dark ? "#d1d7db" : "#111b21", fontSize: 14 }} />
            {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} style={{ color: WA.sub }} /></button>}
          </div>
        )}

        {/* ══ Starred filter badge ══ */}
        {showStarred && (
          <div style={{ background: WA.inputBar, padding: "6px 14px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <Star size={13} style={{ color: "#fbbf24", fill: "#fbbf24" }} />
            <span style={{ fontSize: 12, color: WA.sub, fontWeight: 600 }}>Starred Messages</span>
            <button onClick={() => setShowStarred(false)} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "auto", padding: 2 }}><X size={13} style={{ color: WA.sub }} /></button>
          </div>
        )}

        {/* ══ Chat area ══ */}
        <div className="wa-scroll" ref={scrollRef} onScroll={handleScroll}
          style={{ flex: 1, overflowY: "auto", padding: "8px 8px 12px", position: "relative",
            background: WA.bg, backgroundImage: WA.bgPattern, backgroundSize: "20px 20px" }}>

          {/* E2E encrypted notice */}
          <div style={{ display: "flex", justifyContent: "center", margin: "10px 0 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: WA.encryptedBg, backdropFilter: "blur(6px)", borderRadius: 10, padding: "5px 12px", maxWidth: "85%" }}>
              <Lock size={11} style={{ color: WA.sub, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: WA.sub, textAlign: "center", lineHeight: 1.4 }}>
                Messages are end-to-end encrypted. No one outside this chat can read them.
              </span>
            </div>
          </div>

          {/* Messages */}
          {loadingMessages ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[70, 50, 80, 55].map((w, i) => (
                <div key={i} style={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-end" : "flex-start" }}>
                  <div style={{ width: `${w}%`, height: 44, borderRadius: 10, background: "rgba(128,128,128,.18)" }} />
                </div>
              ))}
            </div>
          ) : filteredMessages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(0,168,132,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <HelpCircle size={30} style={{ color: WA.sendBtn }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: dark ? "#e9edef" : "#111b21", margin: "0 0 6px" }}>
                {showStarred ? "No starred messages" : "Start a conversation"}
              </p>
              <p style={{ fontSize: 12, color: WA.sub, margin: "0 0 20px" }}>Our support team is here to help you.</p>
              {!showStarred && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                  {QUICK_REPLIES.map(qr => (
                    <button key={qr} onClick={() => { setNewMessage(qr); inputRef.current?.focus(); }}
                      style={{ fontSize: 12, padding: "7px 14px", borderRadius: 20, border: `1px solid rgba(0,168,132,.4)`, background: "rgba(0,168,132,.08)", color: WA.sendBtn, cursor: "pointer", fontWeight: 500 }}>
                      {qr}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {filteredMessages.map((msg, idx) => {
                const isMe = msg.sender_id === profile?.id;
                const showDate = idx === 0 || !isSameDay(filteredMessages[idx - 1].created_at, msg.created_at);
                const prevSame = idx > 0 && filteredMessages[idx - 1].sender_id === msg.sender_id;
                const nextSame = idx < filteredMessages.length - 1 && filteredMessages[idx + 1].sender_id === msg.sender_id;
                const isFirst = !prevSame;
                const isLast  = !nextSame;
                const myReaction = msg.reactions?.find((r: any) => r.user_id === profile?.id)?.emoji;
                const reactionCounts: Record<string, number> = msg.reactions?.reduce((acc: any, r: any) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {}) ?? {};
                const isStarred = starred.has(msg.id);
                const isReply = msg.content.startsWith("[Reply to:");

                /* Bubble tail (only on last bubble in a group) */
                const tailStyle: React.CSSProperties = isLast ? {
                  ...(isMe ? {
                    borderTopRightRadius: 0,
                    clipPath: "none",
                  } : {
                    borderTopLeftRadius: 0,
                    clipPath: "none",
                  })
                } : {};

                return (
                  <div key={msg.id}>
                    {/* Date separator */}
                    {showDate && (
                      <div style={{ display: "flex", justifyContent: "center", margin: "14px 0 8px" }}>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: dark ? "#8696a0" : "#667781", background: WA.dateBg, backdropFilter: "blur(8px)", borderRadius: 8, padding: "3px 10px" }}>
                          {fmtDate(msg.created_at)}
                        </span>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: isLast ? 6 : 1, padding: "0 4px", position: "relative" }}
                      onTouchStart={e => onTouchStart(e, msg)}
                      onTouchEnd={onTouchEnd}>

                      {/* Support avatar */}
                      {!isMe && isLast && (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#00a884", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 6, alignSelf: "flex-end", fontSize: 10, color: "#fff", fontWeight: 800, overflow: "hidden" }}>
                          {agentProfile?.profile_photo_path
                            ? <img src={agentProfile.profile_photo_path} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : "FI"}
                        </div>
                      )}
                      {!isMe && !isLast && <div style={{ width: 34, flexShrink: 0 }} />}

                      <div style={{ maxWidth: "78%", position: "relative" }}>
                        {/* Bubble */}
                        <div className="wa-bubble"
                          onContextMenu={e => openCtxMenu(e, msg)}
                          onTouchStart={e => {
                            const timer = setTimeout(() => openCtxMenu(e as any, msg), 500);
                            e.currentTarget.addEventListener("touchend", () => clearTimeout(timer), { once: true });
                          }}
                          style={{
                            background: isMe ? WA.outgoing : WA.incoming,
                            borderRadius: isMe
                              ? (isLast ? "12px 12px 2px 12px" : "12px")
                              : (isLast ? "12px 12px 12px 2px" : "12px"),
                            padding: "6px 9px 5px",
                            boxShadow: "0 1px 2px rgba(0,0,0,.15)",
                            cursor: "pointer",
                            position: "relative",
                            wordBreak: "break-word",
                          }}>

                          {/* Forwarded label */}
                          {msg.content.startsWith("[Forwarded") && (
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                              <Forward size={12} style={{ color: WA.sub }} />
                              <span style={{ fontSize: 11, color: WA.sub, fontStyle: "italic" }}>Forwarded</span>
                            </div>
                          )}

                          {/* Sender name (support only, first bubble) */}
                          {!isMe && isFirst && (
                            <p style={{ fontSize: 12, fontWeight: 700, color: WA.sendBtn, margin: "0 0 3px" }}>
                              {agentProfile?.full_name?.[0] ?? "Flexpay Support"}
                            </p>
                          )}

                          {/* Reply quote */}
                          {isReply && (() => {
                            const lines = msg.content.split("\n");
                            const quotedText = lines[0].replace('[Reply to: "', "").replace('…"]', "");
                            const actual = lines.slice(1).join("\n");
                            return (
                              <>
                                <div style={{ background: isMe ? "rgba(0,0,0,.08)" : "rgba(0,0,0,.05)", borderLeft: `4px solid ${WA.quoteLine}`, borderRadius: "4px 8px 8px 4px", padding: "4px 8px", marginBottom: 5 }}>
                                  <p style={{ fontSize: 11, color: WA.quoteLine, margin: "0 0 2px", fontWeight: 600 }}>Reply</p>
                                  <p style={{ fontSize: 12, color: isMe ? WA.outgoingTxt : WA.incomingTxt, margin: 0, opacity: .8 }}>{quotedText}</p>
                                </div>
                                <p style={{ margin: 0, fontSize: 14, color: isMe ? WA.outgoingTxt : WA.incomingTxt, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{actual}</p>
                              </>
                            );
                          })()}

                          {/* Content */}
                          {!isReply && (() => {
                            const fn = msg.file_name;
                            const fp = msg.file_path;
                            if (fp && isAudio(fn)) return <VoicePlayer filePath={fp} isMe={isMe} WA={WA} />;
                            if (fp && isImage(fn)) return <ImageBubble filePath={fp} onClick={setLightboxUrl} />;
                            if (fp && fn && !isImage(fn) && !isAudio(fn)) {
                              return (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,168,132,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <FileText size={20} style={{ color: WA.sendBtn }} />
                                  </div>
                                  <div>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isMe ? WA.outgoingTxt : WA.incomingTxt }}>{fn}</p>
                                    <p style={{ margin: 0, fontSize: 11, color: WA.sub }}>Document</p>
                                  </div>
                                </div>
                              );
                            }
                            return <p style={{ margin: 0, fontSize: 14, color: isMe ? WA.outgoingTxt : WA.incomingTxt, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{msg.content}</p>;
                          })()}

                          {/* Time + star + ticks */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 3 }}>
                            {isStarred && <Star size={10} style={{ color: "#fbbf24", fill: "#fbbf24" }} />}
                            <span style={{ fontSize: 11, color: WA.sub }}>{fmtTime(msg.created_at)}</span>
                            {isMe && (
                              msg.is_read
                                ? <CheckCheck size={14} style={{ color: WA.tickBlue }} />
                                : <Check size={14} style={{ color: WA.tickGrey }} />
                            )}
                          </div>
                        </div>

                        {/* Reaction chips */}
                        {Object.keys(reactionCounts).length > 0 && (
                          <div style={{ display: "flex", gap: 3, marginTop: 3, justifyContent: isMe ? "flex-end" : "flex-start", flexWrap: "wrap" }}>
                            {Object.entries(reactionCounts).map(([emoji, count]: any) => (
                              <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)}
                                style={{ fontSize: 12, padding: "2px 7px", borderRadius: 12, background: myReaction === emoji ? "rgba(0,168,132,.2)" : WA.dateBg, border: `1px solid ${myReaction === emoji ? WA.sendBtn : WA.border}`, cursor: "pointer", color: dark ? "#e9edef" : "#111b21" }}>
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
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginLeft: 34, marginBottom: 4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: WA.sendBtn, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 800, flexShrink: 0 }}>FI</div>
                  <div style={{ background: WA.incoming, borderRadius: "12px 12px 12px 2px", padding: "10px 14px", display: "flex", gap: 4, alignItems: "center", boxShadow: "0 1px 2px rgba(0,0,0,.15)" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: WA.sub, animation: "wa-bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} style={{ height: 2 }} />
            </div>
          )}

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <button onClick={() => scrollToBottom()}
              style={{ position: "sticky", bottom: 10, float: "right", marginRight: 8, width: 40, height: 40, borderRadius: "50%", background: WA.incoming, boxShadow: "0 2px 12px rgba(0,0,0,.25)", border: `1px solid ${WA.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }}>
              <ChevronDown size={20} style={{ color: dark ? "#e9edef" : "#111b21" }} />
              {unreadCount > 0 && (
                <div style={{ position: "absolute", top: -4, right: -4, background: WA.sendBtn, borderRadius: "50%", width: 18, height: 18, fontSize: 10, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{unreadCount}</div>
              )}
            </button>
          )}
        </div>

        {/* ══ Context menu (WhatsApp style) ══ */}
        {ctxMsg && (
          <div onClick={e => e.stopPropagation()} style={{ position: "fixed", left: Math.min(ctxPos.x, window.innerWidth - 215), top: Math.min(ctxPos.y, window.innerHeight - 290), zIndex: 60, background: WA.menu, border: `1px solid ${WA.menuBorder}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.3)", minWidth: 210 }}>
            {/* Quick emoji strip */}
            <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 12px", borderBottom: `1px solid ${WA.menuBorder}`, background: dark ? "#1a2329" : "#f9fafb" }}>
              {QUICK_EMOJIS.map(e => {
                const myR = ctxMsg.reactions?.find((r: any) => r.user_id === profile?.id)?.emoji;
                return (
                  <button key={e} onClick={() => { toggleReaction(ctxMsg.id, e); setCtxMsg(null); }}
                    style={{ fontSize: 22, background: myR === e ? "rgba(0,168,132,.15)" : "none", border: "none", cursor: "pointer", padding: "3px 4px", borderRadius: 8, transform: myR === e ? "scale(1.22)" : "scale(1)", transition: "all .15s" }}>
                    {e}
                  </button>
                );
              })}
            </div>
            {/* Actions */}
            {[
              { icon: CornerUpLeft, label: "Reply",   color: dark ? "#e9edef" : "#111b21", action: () => { setReplyTo(ctxMsg); setCtxMsg(null); inputRef.current?.focus(); } },
              { icon: Copy,         label: "Copy",    color: dark ? "#e9edef" : "#111b21", action: () => handleCopy(ctxMsg) },
              { icon: Star,         label: starred.has(ctxMsg.id) ? "Unstar" : "Star", color: "#fbbf24", action: () => toggleStar(ctxMsg.id) },
              { icon: Forward,      label: "Forward", color: dark ? "#e9edef" : "#111b21", action: () => handleForward(ctxMsg) },
              ...(ctxMsg.sender_id === profile?.id
                ? [{ icon: Trash2, label: "Delete", color: "#ef4444", action: () => handleDelete(ctxMsg) }]
                : []),
            ].map((item, i, arr) => {
              const Icon = item.icon;
              return (
                <button key={item.label} onClick={item.action}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px 18px", background: "none", border: "none", cursor: "pointer", color: item.color, fontSize: 14, fontWeight: 500, borderBottom: i < arr.length - 1 ? `1px solid ${WA.menuBorder}` : "none", textAlign: "left" }}>
                  <Icon size={16} style={{ color: item.color }} /> {item.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ══ Reply bar ══ */}
        {replyTo && (
          <div style={{ background: WA.replyBar, padding: "8px 14px 8px 16px", display: "flex", alignItems: "center", gap: 10, borderTop: `1px solid ${WA.border}`, flexShrink: 0 }}>
            <div style={{ flex: 1, borderLeft: `4px solid ${WA.quoteLine}`, paddingLeft: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: WA.sendBtn, margin: "0 0 2px" }}>Reply</p>
              <p style={{ fontSize: 12, color: WA.sub, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <X size={18} style={{ color: WA.sub }} />
            </button>
          </div>
        )}

        {/* ══ Emoji picker ══ */}
        {showEmoji && (
          <div style={{ background: dark ? "#111b21" : "#f0f2f5", padding: "10px 10px 6px", borderTop: `1px solid ${WA.border}`, flexShrink: 0, maxHeight: 190, overflowY: "auto" }} className="wa-scroll">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setNewMessage(m => m + e)}
                  style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", padding: "3px 4px", borderRadius: 8, lineHeight: 1 }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ Attach menu popup ══ */}
        {showAttachMenu && (
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 65, left: 12, background: WA.menu, border: `1px solid ${WA.menuBorder}`, borderRadius: 14, padding: "10px 6px", boxShadow: "0 8px 32px rgba(0,0,0,.28)", zIndex: 50, display: "flex", gap: 2 }}>
            {[
              { icon: ImageIcon, label: "Photos", color: "#a855f7", action: () => { fileRef.current?.setAttribute("accept", "image/*"); fileRef.current?.click(); } },
              { icon: FileText,  label: "File",   color: "#3b82f6", action: () => { fileRef.current?.setAttribute("accept", "*/*"); fileRef.current?.click(); } },
              { icon: Camera,    label: "Camera", color: "#00a884", action: () => openCamera() },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button key={item.label} onClick={item.action}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 14px", background: "none", border: "none", cursor: "pointer", borderRadius: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${item.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={20} style={{ color: item.color }} />
                  </div>
                  <span style={{ fontSize: 11, color: WA.sub, fontWeight: 500 }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ══ Input bar ══ */}
        <input type="file" ref={fileRef} accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
        {isRecording ? (
          <div style={{ background: WA.inputBar, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, borderTop: `1px solid ${WA.border}`, flexShrink: 0 }}>
            <button onClick={cancelRecording} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
              <X size={22} style={{ color: "#ef4444" }} />
            </button>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", animation: "wa-rec 1.2s infinite" }} />
              <div style={{ flex: 1, height: 2, background: WA.border, borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${Math.min((recordingTime / 180) * 100, 100)}%`, background: "#ef4444", borderRadius: 2, transition: "width 1s linear" }} />
              </div>
              <span style={{ fontSize: 14, color: "#ef4444", fontVariantNumeric: "tabular-nums", fontWeight: 600, minWidth: 36 }}>
                {fmtSecs(recordingTime)}
              </span>
            </div>
            <button onClick={stopAndSend}
              style={{ width: 46, height: 46, borderRadius: "50%", background: WA.sendBtn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Send size={20} color="#fff" />
            </button>
          </div>
        ) : (
          <div style={{ background: WA.inputBar, padding: "8px 10px", display: "flex", alignItems: "flex-end", gap: 8, borderTop: `1px solid ${WA.border}`, flexShrink: 0 }}>
            {/* Emoji + attach */}
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <button onClick={e => { e.stopPropagation(); setShowEmoji(s => !s); setShowAttachMenu(false); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }}>
                <Smile size={22} style={{ color: WA.emojiBtn }} />
              </button>
              <button onClick={e => { e.stopPropagation(); setShowAttachMenu(s => !s); setShowEmoji(false); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }}>
                <Paperclip size={22} style={{ color: WA.emojiBtn }} />
              </button>
            </div>

            {/* Text input */}
            <div style={{ flex: 1, background: WA.inputBg, borderRadius: 22, padding: "8px 14px", display: "flex", alignItems: "center" }}>
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } if (e.key === "Escape") setReplyTo(null); }}
                placeholder="Message"
                rows={1}
                style={{ flex: 1, background: "none", border: "none", outline: "none", resize: "none", fontSize: 15, color: WA.inputTxt, lineHeight: 1.4, maxHeight: 120, overflow: "auto", fontFamily: "inherit" }}
              />
            </div>

            {/* Send / mic */}
            {newMessage.trim() ? (
              <button onClick={handleSend} className="wa-send-btn"
                style={{ width: 46, height: 46, borderRadius: "50%", background: WA.sendBtn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Send size={20} color="#fff" />
              </button>
            ) : (
              <button onTouchStart={startRecording} onMouseDown={startRecording}
                style={{ width: 46, height: 46, borderRadius: "50%", background: WA.sendBtn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Mic size={20} color="#fff" />
              </button>
            )}
          </div>
        )}

        {/* ══ Image lightbox ══ */}
        {lightboxUrl && (
          <div onClick={() => setLightboxUrl(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <div style={{ position: "absolute", top: 16, right: 16 }}>
              <button onClick={() => setLightboxUrl(null)} style={{ background: "rgba(255,255,255,.15)", border: "none", cursor: "pointer", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={20} color="#fff" />
              </button>
            </div>
            <img src={lightboxUrl} alt="Full size" style={{ maxWidth: "95vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 8 }} onClick={e => e.stopPropagation()} />
          </div>
        )}

        {/* ══ Clear history confirm ══ */}
        {confirmClear && (
          <div onClick={() => setConfirmClear(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: WA.menu, border: `1px solid ${WA.menuBorder}`, borderRadius: 20, padding: 24, maxWidth: 320, width: "100%", boxShadow: "0 16px 48px rgba(0,0,0,.4)" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(239,68,68,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Trash2 size={22} style={{ color: "#ef4444" }} />
              </div>
              <p style={{ fontWeight: 800, fontSize: 16, color: dark ? "#e9edef" : "#111b21", textAlign: "center", margin: "0 0 8px" }}>Clear Chat History?</p>
              <p style={{ fontSize: 13, color: WA.sub, textAlign: "center", margin: "0 0 16px", lineHeight: 1.5 }}>All messages will be permanently deleted. This cannot be undone.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1px solid ${WA.border}`, background: "none", cursor: "pointer", color: WA.sub, fontSize: 14, fontWeight: 600 }}>Cancel</button>
                <button onClick={handleClearHistory} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#ef4444", cursor: "pointer", color: "#fff", fontSize: 14, fontWeight: 700 }}>Clear All</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ Camera overlay ══ */}
        {showCamera && (
          <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 100, display: "flex", flexDirection: "column" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "linear-gradient(to bottom,rgba(0,0,0,.55),transparent)" }}>
              <button onClick={closeCamera} style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.18)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={20} color="#fff" />
              </button>
              <button onClick={() => openCamera(facingMode === "environment" ? "user" : "environment")} style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.18)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
              </button>
            </div>
            <video ref={videoRef} playsInline muted onCanPlay={() => setCameraReady(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: facingMode === "user" ? "scaleX(-1)" : "none" }} />
            {!cameraReady && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,.3)", borderTop: "3px solid #fff", borderRadius: "50%", animation: "wa-spin .8s linear infinite" }} />
              </div>
            )}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 0 44px", background: "linear-gradient(to top,rgba(0,0,0,.6),transparent)" }}>
              <button onClick={capturePhoto} disabled={!cameraReady}
                style={{ width: 72, height: 72, borderRadius: "50%", background: "none", border: "4px solid #fff", cursor: cameraReady ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", opacity: cameraReady ? 1 : .4, boxShadow: "0 0 0 3px rgba(255,255,255,.25)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff" }} />
              </button>
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        )}

        {/* ══ Mic denied dialog ══ */}
        {showMicDenied && (
          <div onClick={() => setShowMicDenied(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: WA.menu, border: `1px solid ${WA.menuBorder}`, borderRadius: 20, padding: 24, maxWidth: 320, width: "100%", boxShadow: "0 16px 48px rgba(0,0,0,.4)" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(239,68,68,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Mic size={24} style={{ color: "#ef4444" }} />
              </div>
              <p style={{ fontWeight: 800, fontSize: 16, color: dark ? "#e9edef" : "#111b21", textAlign: "center", margin: "0 0 8px" }}>Microphone Access Denied</p>
              <p style={{ fontSize: 13, color: WA.sub, textAlign: "center", margin: "0 0 20px", lineHeight: 1.5 }}>Please allow microphone access in your browser settings and try again.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowMicDenied(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1px solid ${WA.border}`, background: "none", cursor: "pointer", color: WA.sub, fontSize: 14, fontWeight: 600 }}>Dismiss</button>
                <button onClick={() => { setShowMicDenied(false); setTimeout(startRecording, 300); }} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: WA.sendBtn, cursor: "pointer", color: "#fff", fontSize: 14, fontWeight: 700 }}>Try Again</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ Camera denied dialog ══ */}
        {showCamDenied && (
          <div onClick={() => setShowCamDenied(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: WA.menu, border: `1px solid ${WA.menuBorder}`, borderRadius: 20, padding: 24, maxWidth: 320, width: "100%", boxShadow: "0 16px 48px rgba(0,0,0,.4)" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(239,68,68,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Camera size={24} style={{ color: "#ef4444" }} />
              </div>
              <p style={{ fontWeight: 800, fontSize: 16, color: dark ? "#e9edef" : "#111b21", textAlign: "center", margin: "0 0 8px" }}>Camera Access Denied</p>
              <p style={{ fontSize: 13, color: WA.sub, textAlign: "center", margin: "0 0 20px", lineHeight: 1.5 }}>Please allow camera access in your browser settings and try again.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowCamDenied(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1px solid ${WA.border}`, background: "none", cursor: "pointer", color: WA.sub, fontSize: 14, fontWeight: 600 }}>Dismiss</button>
                <button onClick={() => { setShowCamDenied(false); setTimeout(() => openCamera(), 300); }} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: WA.sendBtn, cursor: "pointer", color: "#fff", fontSize: 14, fontWeight: 700 }}>Try Again</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ────────────────── DASHBOARD TAB ────────────────── */
  return (
    <div style={{ minHeight: "calc(100vh - 8rem)", background: dark ? "#0b141a" : "#f0f9ff", padding: "16px 12px 20px" }}>

      {/* Header */}
      <div style={{ background: dark ? "#202c33" : "#075e54", borderRadius: 18, padding: "18px 18px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <HelpCircle size={26} color="#fff" />
        </div>
        <div>
          <p style={{ fontWeight: 800, fontSize: 17, color: "#fff", margin: "0 0 3px" }}>Flexpay Support (24/7)</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", margin: 0 }}>We're here to help — always online</p>
        </div>
      </div>

      {/* Live chat button */}
      <button onClick={() => setActiveTab("messages")}
        style={{ width: "100%", background: "#00a884", border: "none", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", marginBottom: 16, boxShadow: "0 4px 16px rgba(0,168,132,.35)" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Chat with Support</span>
      </button>

      {/* FAQs */}
      {faqs.length > 0 && (
        <div style={{ background: dark ? "#202c33" : "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,.08)" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${WA.border}` }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: dark ? "#e9edef" : "#111b21", margin: 0 }}>Frequently Asked Questions</p>
          </div>
          {faqs.map((faq: any, i: number) => (
            <div key={faq.id} style={{ borderBottom: i < faqs.length - 1 ? `1px solid ${WA.border}` : "none" }}>
              <button onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: dark ? "#e9edef" : "#111b21", flex: 1, lineHeight: 1.4 }}>{faq.question}</span>
                <ChevronDown size={16} style={{ color: WA.sub, flexShrink: 0, transform: expandedFaq === faq.id ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
              </button>
              {expandedFaq === faq.id && (
                <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${WA.border}` }}>
                  <p style={{ fontSize: 13.5, color: WA.sub, margin: 0, lineHeight: 1.6 }}>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* E2E notice */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0" }}>
        <Lock size={12} style={{ color: WA.sub }} />
        <p style={{ fontSize: 12, color: WA.sub, margin: 0 }}>Your conversations are end-to-end encrypted</p>
      </div>
    </div>
  );
};

export default HelpSupport;
