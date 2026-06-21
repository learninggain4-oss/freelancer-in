import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Send,
  Search,
  X,
  HelpCircle,
  Smile,
  Paperclip,
  Mic,
  ChevronDown,
  Check,
  CheckCheck,
  CornerUpLeft,
  Copy,
  Trash2,
  ArrowLeft,
  MoreVertical,
  Camera,
  Play,
  Pause,
  Square,
  Star,
  Forward,
  ImageIcon,
  FileText,
  Lock,
  Volume2,
  Phone,
  Video,
  ZoomIn,
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

const fmtSecs = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function fmtDate(iso: string) {
  const d = new Date(iso),
    now = new Date();
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
const EMOJIS = [
  "😊",
  "😂",
  "❤️",
  "👍",
  "🙏",
  "😭",
  "🔥",
  "✅",
  "💯",
  "😍",
  "🤔",
  "👏",
  "🎉",
  "😅",
  "💪",
  "🙌",
  "😎",
  "🤝",
  "💬",
  "⭐",
  "😮",
  "😢",
  "🥳",
  "💔",
  "👀",
  "✨",
  "🫶",
  "🤩",
  "😁",
  "🙃",
  "🥺",
  "😬",
  "🤣",
  "😆",
  "😇",
  "🤗",
  "🤫",
  "😏",
  "😒",
  "🙄",
];

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
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dur, setDur] = useState(0);
  const [cur, setCur] = useState(0);
  const aRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    supabase.storage
      .from("support-files")
      .createSignedUrl(filePath, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setUrl(data.signedUrl);
      });
  }, [filePath]);

  const toggle = () => {
    const a = aRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play()
        .then(() => setPlaying(true))
        .catch(() => {});
    }
  };

  const barColor = isMe ? (WA.header === "#075e54" ? "#3e8e6e" : "#3d8c6e") : WA.sub;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200, paddingBottom: 4 }}>
      <audio
        ref={aRef}
        src={url ?? undefined}
        preload="metadata"
        onLoadedMetadata={() => {
          if (aRef.current) setDur(aRef.current.duration);
        }}
        onTimeUpdate={() => {
          const a = aRef.current;
          if (a && a.duration) {
            setCur(a.currentTime);
            setProgress((a.currentTime / a.duration) * 100);
          }
        }}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          setCur(0);
        }}
        style={{ display: "none" }}
      />
      <button
        onClick={toggle}
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: WA.sendBtn,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {playing ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" style={{ marginLeft: 2 }} />}
      </button>
      <div style={{ flex: 1, position: "relative", height: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2, height: "100%" }}>
          {Array.from({ length: 26 }).map((_, i) => {
            const h = 5 + Math.abs(Math.sin(i * 1.1) * 9 + Math.cos(i * 0.7) * 4);
            return (
              <div
                key={i}
                style={{
                  width: 3,
                  height: Math.abs(h),
                  borderRadius: 2,
                  flexShrink: 0,
                  background: (i / 26) * 100 <= progress ? WA.sendBtn : barColor,
                  transition: "background .1s",
                }}
              />
            );
          })}
        </div>
        <input
          type="range"
          min={0}
          max={dur || 1}
          step={0.1}
          value={cur}
          onChange={(e) => {
            if (aRef.current) {
              aRef.current.currentTime = +e.target.value;
              setCur(+e.target.value);
            }
          }}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }}
        />
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
    supabase.storage
      .from("support-files")
      .createSignedUrl(filePath, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setUrl(data.signedUrl);
      });
  }, [filePath]);
  if (!url)
    return (
      <div
        style={{
          width: 180,
          height: 120,
          borderRadius: 10,
          background: "rgba(128,128,128,.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ImageIcon size={24} style={{ opacity: 0.5 }} />
      </div>
    );
  return (
    <div
      style={{ position: "relative", cursor: "pointer", borderRadius: 10, overflow: "hidden", maxWidth: 220 }}
      onClick={() => onClick(url)}
    >
      <img src={url} alt="attachment" style={{ width: "100%", maxWidth: 220, display: "block", borderRadius: 10 }} />
      <div
        style={{
          position: "absolute",
          bottom: 6,
          right: 8,
          background: "rgba(0,0,0,.45)",
          borderRadius: 12,
          padding: "1px 6px",
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
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
  const {
    messages,
    isLoading: loadingMessages,
    sendMessage,
    deleteMessage,
    clearHistory,
    toggleReaction,
  } = useSupportChat(conversation?.id);

  /* ─── UI state ─── */
  const [newMessage, setNewMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [ctxMsg, setCtxMsg] = useState<any>(null);
  const [ctxPos, setCtxPos] = useState({ x: 0, y: 0, isMe: false });
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [typing, setTyping] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showMicDenied, setShowMicDenied] = useState(false);
  const [showCamDenied, setShowCamDenied] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("messages");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showStarred, setShowStarred] = useState(false);
  const [starred, setStarred] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("wa_sup_starred") || "[]"));
    } catch {
      return new Set();
    }
  });

  /* ─── Refs ─── */
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const cancelledRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const touchStartXRef = useRef(0);
  const touchMsgRef = useRef<any>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraReady, setCameraReady] = useState(false);

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
      const { data } = await supabase
        .from("profiles")
        .select("profile_photo_path, full_name")
        .eq("id", agentSenderId)
        .maybeSingle();
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
    const close = () => {
      setCtxMsg(null);
      setShowHeaderMenu(false);
      setShowAttachMenu(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [ctxMsg, showHeaderMenu, showAttachMenu]);

  const filteredMessages = useMemo(() => {
    let msgs = messages;
    if (showStarred) msgs = msgs.filter((m) => starred.has(m.id));
    if (searchQuery) msgs = msgs.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
    return msgs;
  }, [messages, searchQuery, showStarred, starred]);

  const unreadCount = useMemo(
    () => messages.filter((m) => !m.is_read && m.sender_id !== profile?.id).length,
    [messages, profile?.id],
  );

  /* ─── Send ─── */
  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content) return;
    try {
      const msgContent = replyTo ? `[Reply to: "${replyTo.content.slice(0, 40)}…"]\n${content}` : content;
      await sendMessage(msgContent);
      setNewMessage("");
      setReplyTo(null);
      setShowEmoji(false);
      if (inputRef.current) inputRef.current.style.height = "auto";
      setTimeout(() => scrollToBottom(), 100);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  /* ─── File upload ─── */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversation?.id || !profile?.id) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Max file size: 20 MB");
      return;
    }
    setShowAttachMenu(false);
    try {
      const ext = file.name.split(".").pop();
      const path = `support/${conversation.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("support-files").upload(path, file);
      if (upErr) throw upErr;
      const label = file.type.startsWith("image/") ? "📷 Photo" : `📎 ${file.name}`;
      await sendMessage(label, path, file.name);
      setTimeout(() => scrollToBottom(), 100);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    e.target.value = "";
  };

  /* ─── Camera ─── */
  const stopCameraStream = () => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
  };
  const openCamera = async (mode: "environment" | "user" = facingMode) => {
    try {
      stopCameraStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      cameraStreamRef.current = stream;
      setFacingMode(mode);
      setShowCamera(true);
      setCameraReady(false);
      setShowAttachMenu(false);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 80);
    } catch (err: any) {
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") setShowCamDenied(true);
      else toast.error("Could not access camera");
    }
  };
  const closeCamera = () => {
    stopCameraStream();
    setShowCamera(false);
    setCameraReady(false);
  };
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !conversation?.id || !profile?.id) return;
    const v = videoRef.current,
      c = canvasRef.current;
    c.width = v.videoWidth || 1280;
    c.height = v.videoHeight || 720;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    if (facingMode === "user") {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob(
      async (blob) => {
        if (!blob) return;
        closeCamera();
        try {
          const path = `support/${conversation!.id}/${Date.now()}.jpg`;
          const { error } = await supabase.storage
            .from("support-files")
            .upload(path, blob, { contentType: "image/jpeg" });
          if (error) throw error;
          await sendMessage("📷 Photo", path, "photo.jpg");
          setTimeout(() => scrollToBottom(), 100);
        } catch (err: any) {
          toast.error(err.message || "Failed to send photo");
        }
      },
      "image/jpeg",
      0.92,
    );
  };

  /* ─── Voice recording (Robust implementation) ─── */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const mr = new MediaRecorder(stream, { mimeType });

      audioChunksRef.current = [];
      cancelledRef.current = false;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        if (cancelledRef.current) {
          audioChunksRef.current = [];
          return;
        }

        // Wait slightly to ensure data flush
        await new Promise((r) => setTimeout(r, 200));

        const ext = mimeType.includes("webm") ? "webm" : "ogg";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });

        if (blob.size < 1000) {
          toast.error("Recording too short");
          return;
        }

        try {
          if (!conversation?.id || !profile?.id) return;
          const path = `support/${conversation.id}/${Date.now()}.${ext}`;
          const { error } = await supabase.storage.from("support-files").upload(path, blob, { contentType: mimeType });
          if (error) throw error;
          await sendMessage("🎤 Voice message", path, `voice.${ext}`);
          setTimeout(() => scrollToBottom(), 100);
        } catch (err: any) {
          toast.error(err.message || "Failed to send voice message");
        }
      };

      mr.start(100);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (err: any) {
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") setShowMicDenied(true);
      else toast.error("Could not access microphone");
    }
  };

  const stopAndSend = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    cancelledRef.current = false;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (!mediaRecorderRef.current) return;
    cancelledRef.current = true;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordingTime(0);
  };

  /* ─── Context menu ─── */
  const openCtxMenu = (e: React.MouseEvent | React.TouchEvent, msg: any) => {
    e.preventDefault();
    e.stopPropagation();
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
    if (dx > 55 && touchMsgRef.current) {
      setReplyTo(touchMsgRef.current);
      inputRef.current?.focus();
    }
    touchMsgRef.current = null;
  };

  /* ─── Star ─── */
  const toggleStar = (msgId: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      next.has(msgId) ? next.delete(msgId) : next.add(msgId);
      try {
        localStorage.setItem("wa_sup_starred", JSON.stringify([...next]));
      } catch {}
      return next;
    });
    setCtxMsg(null);
  };

  /* ─── Forward (copy) ─── */
  const handleForward = (msg: any) => {
    navigator.clipboard
      .writeText(`[Forwarded from Support]\n${msg.content}`)
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
    } catch (e: any) {
      toast.error(e.message || "Failed to delete message");
    }
  };

  /* ─── Clear history ─── */
  const handleClearHistory = async () => {
    setConfirmClear(false);
    setShowHeaderMenu(false);
    if (!conversation?.id) return;
    try {
      await clearHistory(conversation.id);
      toast.success("Chat history cleared");
    } catch (e: any) {
      toast.error(e.message || "Failed to clear history");
    }
  };

  /* ─── Loading ─── */
  if (loadingConv) {
    return (
      <div style={{ background: WA.bg, display: "flex", flexDirection: "column", height: "calc(100vh - 5rem)" }}>
        <div style={{ background: WA.header, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.2)" }} />
          <div>
            <div
              style={{ width: 110, height: 13, borderRadius: 8, background: "rgba(255,255,255,.2)", marginBottom: 6 }}
            />
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 56,
          left: 0,
          right: 0,
          bottom: 70,
          zIndex: 40,
          background: WA.bg,
        }}
        onClick={() => {
          setCtxMsg(null);
          setShowHeaderMenu(false);
          setShowAttachMenu(false);
        }}
      >
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
        <div
          style={{
            background: WA.header,
            padding: "10px 8px 10px 4px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
            zIndex: 20,
          }}
        >
          <button
            onClick={() => setActiveTab("dashboard")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 4px 6px 8px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ArrowLeft size={20} color="#fff" />
          </button>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
              cursor: "pointer",
            }}
          >
            {agentProfile?.profile_photo_path ? (
              <img
                src={agentProfile.profile_photo_path}
                alt="Support"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>FI</span>
            )}
          </div>
          <div style={{ flex: 1, cursor: "pointer" }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#fff", margin: 0, lineHeight: 1.2 }}>
              Flexpay Support (24/7)
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.8)", margin: 0, lineHeight: 1.2 }}>
              {typing ? "typing..." : "online"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSearchOpen((s) => !s);
                setSearchQuery("");
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 8,
                borderRadius: 8,
                display: "flex",
              }}
            >
              <Search size={20} color="rgba(255,255,255,.85)" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHeaderMenu((s) => !s);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 8,
                borderRadius: 8,
                display: "flex",
                position: "relative",
              }}
            >
              <MoreVertical size={20} color="rgba(255,255,255,.85)" />
              {showHeaderMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    right: 0,
                    minWidth: 190,
                    background: WA.menu,
                    border: `1px solid ${WA.menuBorder}`,
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(0,0,0,.28)",
                    zIndex: 50,
                  }}
                >
                  {[
                    {
                      label: "Search",
                      icon: Search,
                      action: () => {
                        setShowHeaderMenu(false);
                        setSearchOpen((s) => !s);
                        setSearchQuery("");
                      },
                    },
                    {
                      label: showStarred ? "All Messages" : "Starred Messages",
                      icon: Star,
                      action: () => {
                        setShowStarred((s) => !s);
                        setShowHeaderMenu(false);
                      },
                    },
                    {
                      label: "Clear History",
                      icon: Trash2,
                      action: () => {
                        setShowHeaderMenu(false);
                        setConfirmClear(true);
                      },
                      danger: true,
                    },
                  ].map((item, i, arr) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={item.action}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "13px 18px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: (item as any).danger ? "#ef4444" : dark ? "#e9edef" : "#111b21",
                          fontSize: 14,
                          fontWeight: 500,
                          borderBottom: i < arr.length - 1 ? `1px solid ${WA.menuBorder}` : "none",
                          textAlign: "left",
                        }}
                      >
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
          <div
            style={{
              background: dark ? "#111b21" : "#f0f2f5",
              padding: "8px 12px",
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexShrink: 0,
              borderBottom: `1px solid ${WA.border}`,
            }}
          >
            <Search size={16} style={{ color: WA.sub, flexShrink: 0 }} />
            <input
              ref={searchRef}
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                color: dark ? "#d1d7db" : "#111b21",
                fontSize: 14,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={16} style={{ color: WA.sub }} />
              </button>
            )}
          </div>
        )}

        {/* ══ Chat area ══ */}
        <div
          className="wa-scroll"
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 8px 12px",
            position: "relative",
            background: WA.bg,
            backgroundImage: WA.bgPattern,
            backgroundSize: "20px 20px",
          }}
        >
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
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "rgba(0,168,132,.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <HelpCircle size={30} style={{ color: WA.sendBtn }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: dark ? "#e9edef" : "#111b21", margin: "0 0 6px" }}>
                {showStarred ? "No starred messages" : "Start a conversation"}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {filteredMessages.map((msg, idx) => {
                const isMe = msg.sender_id === profile?.id;
                const nextSame =
                  idx < filteredMessages.length - 1 && filteredMessages[idx + 1].sender_id === msg.sender_id;
                const isLast = !nextSame;

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                      marginBottom: isLast ? 6 : 1,
                      padding: "0 4px",
                      position: "relative",
                    }}
                  >
                    <div style={{ maxWidth: "78%", position: "relative" }}>
                      <div
                        style={{
                          background: isMe ? WA.outgoing : WA.incoming,
                          borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                          padding: "6px 9px 5px",
                          boxShadow: "0 1px 2px rgba(0,0,0,.15)",
                          wordBreak: "break-word",
                        }}
                      >
                        {(() => {
                          const fn = msg.file_name;
                          const fp = msg.file_path;
                          if (fp && isAudio(fn)) return <VoicePlayer filePath={fp} isMe={isMe} WA={WA} />;
                          if (fp && isImage(fn)) return <ImageBubble filePath={fp} onClick={setLightboxUrl} />;
                          return (
                            <p style={{ margin: 0, fontSize: 14, color: isMe ? WA.outgoingTxt : WA.incomingTxt }}>
                              {msg.content}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} style={{ height: 2 }} />
            </div>
          )}
        </div>

        {/* ══ Input bar ══ */}
        <div
          style={{
            background: WA.inputBar,
            padding: "8px 10px",
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            borderTop: `1px solid ${WA.border}`,
            flexShrink: 0,
          }}
        >
          {isRecording ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={cancelRecording} style={{ background: "none", border: "none", color: "#ef4444" }}>
                <X size={22} />
              </button>
              <div style={{ flex: 1, height: 4, background: WA.border, borderRadius: 2 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min((recordingTime / 180) * 100, 100)}%`,
                    background: "#ef4444",
                  }}
                />
              </div>
              <span>{fmtSecs(recordingTime)}</span>
              <button onClick={stopAndSend} style={{ background: WA.sendBtn, borderRadius: "50%", padding: 10 }}>
                <Send size={20} color="#fff" />
              </button>
            </div>
          ) : (
            <>
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Message"
                style={{ flex: 1, borderRadius: 22, padding: "8px 14px", border: "none" }}
              />
              {newMessage.trim() ? (
                <button onClick={handleSend} style={{ background: WA.sendBtn, borderRadius: "50%", padding: 10 }}>
                  <Send size={20} color="#fff" />
                </button>
              ) : (
                <button
                  onTouchStart={startRecording}
                  onMouseDown={startRecording}
                  style={{ background: WA.sendBtn, borderRadius: "50%", padding: 10 }}
                >
                  <Mic size={20} color="#fff" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return <div>Dashboard Placeholder</div>;
};

export default HelpSupport;
