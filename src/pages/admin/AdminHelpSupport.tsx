import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Send, ArrowLeft, MessageCircle, Search, X, Zap, ChevronRight, ChevronDown, Eye,
  BarChart3, Plus, Trash2, Edit2, Check, CheckCheck, Settings2, MoreVertical,
  Smile, Paperclip, Mic, Camera, CornerUpLeft, Copy, Play, Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSupportChat, useAllConversations } from "@/hooks/use-support-chat";
import { useCustomQuickReplies } from "@/hooks/use-custom-quick-replies";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { safeDist } from "@/lib/admin-date";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const ADMIN_EMOJIS = ["😊","😂","❤️","👍","👎","😢","😮","😡","🔥","💯","🙏","✅","❌","💪","🎉","😎","🤔","😍","👏","🤝","💼","⭐","🚀","💡","📞","📸","📁","💰","🎯","⚡"];

function fmtDur(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
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

function AdminVoicePlayer({ src, isMe, subColor }: { src: string; isMe: boolean; subColor: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dur, setDur] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = new Audio(src);
    audioRef.current = a;
    a.onloadedmetadata = () => setDur(Math.round(a.duration));
    a.ontimeupdate = () => setProgress((a.currentTime / (a.duration || 1)) * 100);
    a.onended = () => { setPlaying(false); setProgress(0); };
    return () => { a.pause(); a.src = ""; };
  }, [src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 160, maxWidth: 220 }}>
      <button onClick={toggle} style={{ width: 32, height: 32, borderRadius: "50%", background: isMe ? "rgba(255,255,255,.2)" : "rgba(99,102,241,.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {playing ? <Pause size={14} style={{ color: isMe ? "#fff" : "#6366f1" }} /> : <Play size={14} style={{ color: isMe ? "#fff" : "#6366f1" }} />}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 20, marginBottom: 4 }}>
          {[4,7,11,8,14,10,6,13,9,12].map((h, i) => (
            <div key={i} style={{ width: 3, height: playing ? `${h}px` : `${Math.max(3, h * (progress / 100 + 0.15))}px`, borderRadius: 2, background: i < (progress / 100) * 10 ? (isMe ? "#fff" : "#6366f1") : (isMe ? "rgba(255,255,255,.3)" : "rgba(99,102,241,.25)"), transition: "height .3s ease" }} />
          ))}
        </div>
        <div style={{ height: 2, background: isMe ? "rgba(255,255,255,.2)" : "rgba(99,102,241,.15)", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: isMe ? "#fff" : "#6366f1", borderRadius: 1, transition: "width .3s linear" }} />
        </div>
        <span style={{ fontSize: 10, color: isMe ? "rgba(255,255,255,.65)" : subColor, marginTop: 2, display: "block" }}>{dur ? fmtDur(dur) : "0:00"}</span>
      </div>
      <Mic size={12} style={{ color: isMe ? "rgba(255,255,255,.45)" : subColor, flexShrink: 0 }} />
    </div>
  );
}

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const BUILT_IN_CATEGORIES = [
  {
    label: "👋 Greetings",
    shortcut: "/greet",
    templates: [
      "Hi! How can I help you today?",
      "Hello! Thank you for reaching out to support.",
      "Welcome! I'm here to assist you.",
    ],
  },
  {
    label: "🔍 Gathering Info",
    shortcut: "/info",
    templates: [
      "Could you please provide more details about your issue?",
      "Can you share a screenshot so I can better understand the problem?",
      "What is your registered email or user code?",
      "When did you first notice this issue?",
    ],
  },
  {
    label: "⏳ In Progress",
    shortcut: "/status",
    templates: [
      "Thank you for your patience. We're looking into this now.",
      "We're working on this and will update you shortly.",
      "I've escalated this to the team. You'll hear back soon.",
      "This may take a little time. I'll keep you posted.",
    ],
  },
  {
    label: "💰 Payments & Wallet",
    shortcut: "/pay",
    templates: [
      "Your wallet balance has been updated. Please check now.",
      "The withdrawal is being processed and should reflect within 24 hours.",
      "Could you confirm your UPI ID or bank details for the transfer?",
      "The payment has been credited to your account successfully.",
    ],
  },
  {
    label: "📋 Projects & Jobs",
    shortcut: "/project",
    templates: [
      "Your project application has been received. The client will review it shortly.",
      "Please upload your submission files through the Projects tab.",
      "The project status has been updated. Please check your dashboard.",
    ],
  },
  {
    label: "✅ Resolution",
    shortcut: "/resolve",
    templates: [
      "Your issue has been resolved. Is there anything else I can help with?",
      "This has been fixed. Please try again and let me know if it works.",
      "I'm glad I could help! Feel free to reach out anytime.",
      "Closing this ticket. Don't hesitate to contact us again if needed.",
    ],
  },
  {
    label: "📧 Follow-up",
    shortcut: "/follow",
    templates: [
      "Please check your email for further instructions.",
      "I've sent you a notification with the details.",
      "You can track the status from your dashboard.",
      "Is there anything else you need help with?",
    ],
  },
];

// Hook for template analytics
const useTemplateAnalytics = () => {
  const queryClient = useQueryClient();

  const { data: analytics = [] } = useQuery({
    queryKey: ["quick-reply-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quick_reply_analytics")
        .select("template_text, category")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const usageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    analytics.forEach((a: any) => {
      counts[a.template_text] = (counts[a.template_text] || 0) + 1;
    });
    return counts;
  }, [analytics]);

  const trackUsage = async (templateText: string, category: string, userId: string, conversationId?: string) => {
    await supabase.from("quick_reply_analytics").insert({
      template_text: templateText,
      category,
      used_by: userId,
      conversation_id: conversationId || null,
    });
    queryClient.invalidateQueries({ queryKey: ["quick-reply-analytics"] });
  };

  return { usageCounts, trackUsage };
};

// ---- Custom Template Form ----
const CustomTemplateForm = ({ onClose, profileId }: { onClose: () => void; profileId: string }) => {
  const { addReply, customCategories } = useCustomQuickReplies();
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [templateText, setTemplateText] = useState("");
  const [shortcut, setShortcut] = useState("");

  const existingCategories = [
    ...BUILT_IN_CATEGORIES.map((c) => c.label),
    ...Object.keys(customCategories),
  ];
  const uniqueCategories = [...new Set(existingCategories)];

  const handleSubmit = () => {
    const cat = newCategory.trim() || category;
    if (!cat || !templateText.trim()) {
      toast.error("Category and template text are required");
      return;
    }
    addReply.mutate({
      category: cat,
      template_text: templateText.trim(),
      shortcut: shortcut.trim() || undefined,
      created_by: profileId,
    }, { onSuccess: onClose });
  };

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-background">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Add Custom Template</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-[11px] text-muted-foreground font-medium">Category</label>
          <Select value={category} onValueChange={(v) => { setCategory(v); setNewCategory(""); }}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {uniqueCategories.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
              ))}
              <SelectItem value="__new__" className="text-xs text-primary">+ New Category</SelectItem>
            </SelectContent>
          </Select>
          {category === "__new__" && (
            <Input
              placeholder="New category name (e.g. 🔧 Technical)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="h-8 text-xs mt-1"
              autoFocus
            />
          )}
        </div>

        <div>
          <label className="text-[11px] text-muted-foreground font-medium">Template Text</label>
          <Textarea
            placeholder="Type the response template..."
            value={templateText}
            onChange={(e) => setTemplateText(e.target.value)}
            className="text-xs min-h-[60px]"
          />
        </div>

        <div>
          <label className="text-[11px] text-muted-foreground font-medium">Shortcut (optional)</label>
          <Input
            placeholder="e.g. /tech"
            value={shortcut}
            onChange={(e) => setShortcut(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <Button size="sm" className="w-full h-8 text-xs" onClick={handleSubmit} disabled={addReply.isPending}>
          {addReply.isPending ? "Adding..." : "Add Template"}
        </Button>
      </div>
    </div>
  );
};

// ---- Custom Templates Manager ----
const CustomTemplatesManager = ({ profileId }: { profileId: string }) => {
  const { customReplies, customCategories, deleteReply, updateReply } = useCustomQuickReplies();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  if (customReplies.length === 0) {
    return <p className="text-[10px] text-muted-foreground py-2">No custom templates yet.</p>;
  }

  return (
    <div className="space-y-2">
      {Object.entries(customCategories).map(([cat, replies]) => (
        <div key={cat}>
          <p className="text-[10px] font-medium text-muted-foreground mb-1">{cat}</p>
          <div className="space-y-1">
            {replies.map((r) => (
              <div key={r.id} className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 text-xs">
                {editingId === r.id ? (
                  <>
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="h-6 text-[11px] flex-1"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={() => {
                        if (editText.trim()) {
                          updateReply.mutate({ id: r.id, template_text: editText.trim() });
                        }
                        setEditingId(null);
                      }}
                    >
                      <Check className="h-3 w-3 text-primary" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-foreground truncate">{r.template_text}</span>
                    {r.shortcut && (
                      <code className="text-[9px] text-muted-foreground font-mono">{r.shortcut}</code>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={() => { setEditingId(r.id); setEditText(r.template_text); }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 text-destructive"
                      onClick={() => deleteReply.mutate(r.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminHelpSupport = () => {
  const { profile } = useAuth();
  const { theme } = useDashboardTheme();
  const T = TH[theme];

  // WhatsApp-style color palette mapped to dark / light theme
  const WA = theme === "black" ? {
    bg:           "#0b141a",
    chatBg:       "#0b141a",
    chatPattern:  "radial-gradient(circle, rgba(134,150,160,.04) 1px, transparent 1px)",
    header:       "#202c33",
    headerText:   "#e9edef",
    headerSub:    "#8696a0",
    outgoing:     "#005c4b",
    outgoingText: "#e9edef",
    outgoingTime: "rgba(233,237,239,.55)",
    incoming:     "#202c33",
    incomingText: "#e9edef",
    incomingTime: "#8696a0",
    inputBar:     "#202c33",
    input:        "#2a3942",
    inputText:    "#e9edef",
    border:       "rgba(134,150,160,.15)",
    tickSent:     "#8696a0",
    tickRead:     "#53bdeb",
    ctxMenu:      "#233138",
    ctxBorder:    "rgba(134,150,160,.2)",
    dateBg:       "rgba(32,44,51,.92)",
    dateText:     "#8696a0",
    scrollBtn:    "rgba(32,44,51,.95)",
    convBg:       "#111b21",
    convItem:     "#202c33",
    convHover:    "#2a3942",
    unreadBg:     "#00a884",
    unreadText:   "#fff",
    avatarBg:     "#2a3942",
    avatarText:   "#8696a0",
    searchBg:     "#2a3942",
    subText:      "#8696a0",
    replyBg:      "rgba(0,168,132,.12)",
    replyBorder:  "#00a884",
    emojiPicker:  "#233138",
  } : {
    bg:           "#efeae2",
    chatBg:       "#efeae2",
    chatPattern:  "radial-gradient(circle, rgba(0,0,0,.05) 1px, transparent 1px)",
    header:       "#075e54",
    headerText:   "#ffffff",
    headerSub:    "rgba(255,255,255,.75)",
    outgoing:     "#d9fdd3",
    outgoingText: "#111b21",
    outgoingTime: "#667781",
    incoming:     "#ffffff",
    incomingText: "#111b21",
    incomingTime: "#667781",
    inputBar:     "#f0f2f5",
    input:        "#ffffff",
    inputText:    "#111b21",
    border:       "rgba(0,0,0,.08)",
    tickSent:     "#667781",
    tickRead:     "#53bdeb",
    ctxMenu:      "#ffffff",
    ctxBorder:    "rgba(0,0,0,.1)",
    dateBg:       "rgba(255,255,255,.9)",
    dateText:     "#667781",
    scrollBtn:    "rgba(255,255,255,.95)",
    convBg:       "#ffffff",
    convItem:     "#ffffff",
    convHover:    "#f5f5f5",
    unreadBg:     "#00a884",
    unreadText:   "#fff",
    avatarBg:     "#dfe5e7",
    avatarText:   "#667781",
    searchBg:     "#f0f2f5",
    subText:      "#667781",
    replyBg:      "rgba(7,94,84,.08)",
    replyBorder:  "#075e54",
    emojiPicker:  "#ffffff",
  };
  const { data: conversations = [], isLoading: loadingConvs } = useAllConversations();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const { messages, isLoading: loadingMessages, sendMessage, deleteMessage, clearHistory, toggleReaction } = useSupportChat(selectedConvId ?? undefined);
  const { customReplies, customCategories } = useCustomQuickReplies();
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [convSearch, setConvSearch] = useState("");
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // WhatsApp features state
  const [showHeaderMenu, setShowHeaderMenu]     = useState(false);
  const [confirmClear, setConfirmClear]         = useState(false);
  const [ctxMsg, setCtxMsg]                     = useState<any>(null);
  const [ctxPos, setCtxPos]                     = useState({ x: 0, y: 0 });
  const [replyTo, setReplyTo]                   = useState<any>(null);
  const [showEmoji, setShowEmoji]               = useState(false);
  const [isRecording, setIsRecording]           = useState(false);
  const [recordingTime, setRecordingTime]       = useState(0);
  const [showMicDenied, setShowMicDenied]       = useState(false);
  const [showCamDenied, setShowCamDenied]       = useState(false);
  const [showCamera, setShowCamera]             = useState(false);
  const [facingMode, setFacingMode]             = useState<"environment"|"user">("environment");
  const [cameraReady, setCameraReady]           = useState(false);
  const [voiceUrls, setVoiceUrls]               = useState<Record<string, string>>({});
  const [photoUrls, setPhotoUrls]               = useState<Record<string, string>>({});
  const [showScrollBtn, setShowScrollBtn]       = useState(false);
  const [showReactionFor, setShowReactionFor]   = useState<string | null>(null);
  const [typing, setTyping]                     = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileRef            = useRef<HTMLInputElement>(null);
  const mediaRecorderRef   = useRef<MediaRecorder | null>(null);
  const audioChunksRef     = useRef<Blob[]>([]);
  const recordingTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const cancelledRef       = useRef(false);
  const videoRef           = useRef<HTMLVideoElement>(null);
  const canvasRef          = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef    = useRef<MediaStream | null>(null);

  const { usageCounts, trackUsage } = useTemplateAnalytics();

  // Merge built-in + custom categories
  const allCategories = useMemo(() => {
    const cats = BUILT_IN_CATEGORIES.map((c) => ({
      label: c.label,
      shortcut: c.shortcut,
      templates: c.templates,
      isCustom: false,
    }));

    Object.entries(customCategories).forEach(([catName, replies]) => {
      const existingIdx = cats.findIndex((c) => c.label === catName);
      if (existingIdx !== -1) {
        // Merge into existing
        cats[existingIdx].templates = [
          ...cats[existingIdx].templates,
          ...replies.map((r) => r.template_text),
        ];
      } else {
        // New custom category
        const firstShortcut = replies.find((r) => r.shortcut)?.shortcut || undefined;
        cats.push({
          label: catName,
          shortcut: firstShortcut || "",
          templates: replies.map((r) => r.template_text),
          isCustom: true,
        });
      }
    });

    return cats;
  }, [customCategories]);

  const selectedConv = conversations.find((c: any) => c.id === selectedConvId);

  // Auto-scroll disabled per admin preference

  // Keyboard shortcut detection
  useEffect(() => {
    if (!newMessage.startsWith("/")) return;
    const cmd = newMessage.toLowerCase().trim();
    const match = allCategories.findIndex((cat) => cat.shortcut === cmd);
    if (match !== -1) {
      setQuickRepliesOpen(true);
      setActiveCategory(allCategories[match].label);
    }
  }, [newMessage, allCategories]);

  const findCategory = (templateText: string): string => {
    for (const cat of allCategories) {
      if (cat.templates.includes(templateText)) return cat.label;
    }
    return "Custom";
  };

  // Resolve voice signed URLs
  useEffect(() => {
    const voiceMsgs = messages.filter(m => m.file_path && m.file_name?.startsWith("voice."));
    voiceMsgs.forEach(async m => {
      if (m.file_path && !voiceUrls[m.id]) {
        const { data } = await supabase.storage.from("support-files").createSignedUrl(m.file_path, 3600);
        if (data?.signedUrl) setVoiceUrls(prev => ({ ...prev, [m.id]: data.signedUrl }));
      }
    });
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve photo signed URLs
  useEffect(() => {
    const photoMsgs = messages.filter(m => m.file_path && m.file_name === "photo.jpg");
    photoMsgs.forEach(async m => {
      if (m.file_path && !photoUrls[m.id]) {
        const { data } = await supabase.storage.from("support-files").createSignedUrl(m.file_path, 3600);
        if (data?.signedUrl) setPhotoUrls(prev => ({ ...prev, [m.id]: data.signedUrl }));
      }
    });
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);


  // Scroll watcher for scroll-to-bottom button
  const handleMsgScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };

  // Typing simulation — show "typing..." after user sends a message
  useEffect(() => {
    if (messages.length > 0 && selectedConvId) {
      const last = messages[messages.length - 1];
      if (last.sender_id !== profile?.id) {
        setTyping(false);
      }
    }
  }, [messages, selectedConvId, profile?.id]);

  // Camera stream management
  useEffect(() => {
    if (!showCamera) { cameraStreamRef.current?.getTracks().forEach(t => t.stop()); setCameraReady(false); return; }
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        cameraStreamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
        setCameraReady(true);
      } catch { setShowCamera(false); setShowCamDenied(true); }
    })();
    return () => { cameraStreamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [showCamera, facingMode]);

  const handleSend = async (text?: string, filePath?: string, fileName?: string) => {
    const content = (text || newMessage).trim();
    const replyPrefix = replyTo ? `[Reply to: "${replyTo.content.slice(0, 40)}…"]\n` : "";
    const finalContent = filePath ? (content || fileName || "") : (replyPrefix + content);
    if (!finalContent && !filePath) return;
    try {
      const isTemplate = allCategories.some((cat) => cat.templates.includes(finalContent));
      if (isTemplate && profile?.id) {
        await trackUsage(finalContent, findCategory(finalContent), profile.id, selectedConvId || undefined);
      }
      await sendMessage(finalContent, filePath, fileName);
      setNewMessage("");
      setReplyTo(null);
      setQuickRepliesOpen(false);
      setPreviewTemplate(null);
      if (inputRef.current) inputRef.current.style.height = "44px";
      // Simulate user typing response
      setTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 3000);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteMsg = async (msg: any) => {
    try {
      await deleteMessage(msg.id, msg.sender_id);
      toast.success("Message deleted");
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
    setCtxMsg(null);
  };

  const handleClearHistory = async () => {
    if (!selectedConvId) return;
    try {
      await clearHistory(selectedConvId);
      toast.success("Chat history cleared");
    } catch (e: any) {
      toast.error(e.message || "Clear failed");
    }
    setConfirmClear(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConvId) return;
    const ext = file.name.split(".").pop() || "bin";
    const path = `support/${selectedConvId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("support-files").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    await handleSend("", path, file.name);
    if (fileRef.current) fileRef.current.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      cancelledRef.current = false;
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (cancelledRef.current) { setRecordingTime(0); return; }
        const ext = mimeType.includes("webm") ? "webm" : "ogg";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 500) { setRecordingTime(0); return; }
        const path = `support/${selectedConvId}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("support-files").upload(path, blob, { contentType: mimeType });
        if (error) { toast.error("Voice upload failed"); setRecordingTime(0); return; }
        await handleSend("", path, `voice.${ext}`);
        setRecordingTime(0);
      };
      mr.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err: any) {
      const denied = err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
      if (denied) setShowMicDenied(true);
      else toast.error("Could not access microphone");
    }
  };

  const stopRecording = (cancel = false) => {
    cancelledRef.current = cancel;
    recordingStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaRecorderRef.current?.stop();
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    setIsRecording(false);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(async (blob) => {
      if (!blob || !selectedConvId) return;
      const path = `support/${selectedConvId}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("support-files").upload(path, blob, { contentType: "image/jpeg" });
      if (error) { toast.error("Photo upload failed"); return; }
      setShowCamera(false);
      await handleSend("", path, "photo.jpg");
    }, "image/jpeg", 0.85);
  };

  const handleTemplateSelect = (template: string) => {
    setPreviewTemplate(template);
  };

  const handleConfirmPreview = () => {
    if (previewTemplate) handleSend(previewTemplate);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (previewTemplate) handleConfirmPreview();
      else handleSend();
    }
  };

  const getUserDisplayName = (conv: any) => {
    const user = conv.user;
    if (!user) return "Unknown User";
    const name = Array.isArray(user.full_name) ? user.full_name.join(" ") : user.full_name;
    return name || "Unknown User";
  };

  const getUserCode = (conv: any) => {
    const user = conv.user;
    if (!user?.user_code) return "";
    return Array.isArray(user.user_code) ? user.user_code[0] : user.user_code;
  };

  const filteredMessages = searchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const filteredConversations = convSearch
    ? conversations.filter((c: any) => {
        const name = getUserDisplayName(c).toLowerCase();
        const code = getUserCode(c).toLowerCase();
        const q = convSearch.toLowerCase();
        return name.includes(q) || code.includes(q) || (c.user?.email || "").toLowerCase().includes(q);
      })
    : conversations;

  const topTemplates = useMemo(() => {
    return Object.entries(usageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }, [usageCounts]);

  if (loadingConvs) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-bold text-foreground">Help & Support</h1>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Chat view
  if (selectedConvId && selectedConv) {
    const userName = getUserDisplayName(selectedConv);
    const userType = (selectedConv as any).user?.user_type || "";

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 8rem)", marginTop: -8, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.3)" }}
        onClick={() => { setCtxMsg(null); setShowHeaderMenu(false); setShowEmoji(false); setShowReactionFor(null); }}>
        {/* ── Camera overlay ── */}
        {showCamera && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 20px" }}>
              <button onClick={() => setShowCamera(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={24} style={{ color: "#fff" }} />
              </button>
              <button onClick={() => setFacingMode(f => f === "environment" ? "user" : "environment")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#fff" }}>⟳</button>
            </div>
            <video ref={videoRef} playsInline muted style={{ flex: 1, objectFit: "cover", width: "100%" }} />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            {!cameraReady && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 40, height: 40, border: "3px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /></div>}
            <div style={{ padding: 32, display: "flex", justifyContent: "center" }}>
              <button onClick={capturePhoto} style={{ width: 72, height: 72, borderRadius: "50%", background: "#fff", border: "4px solid rgba(255,255,255,.5)", cursor: "pointer" }} />
            </div>
          </div>
        )}

        {/* ── Confirm clear dialog ── */}
        {confirmClear && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setConfirmClear(false)}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 28, maxWidth: 320, width: "90%", margin: "0 auto" }} onClick={e => e.stopPropagation()}>
              <p style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 8 }}>Clear Chat History?</p>
              <p style={{ fontSize: 13, color: T.sub, marginBottom: 24 }}>All messages in this conversation will be permanently deleted.</p>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: `1px solid ${T.border}`, background: "transparent", color: T.text, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleClearHistory} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Clear All</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Permission dialogs ── */}
        {showMicDenied && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowMicDenied(false)}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 24, maxWidth: 320, width: "90%" }} onClick={e => e.stopPropagation()}>
              <p style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 8 }}>Microphone Access Denied</p>
              <p style={{ fontSize: 12, color: T.sub, marginBottom: 16 }}>Enable microphone in your browser/system settings, then try again.</p>
              <button onClick={() => setShowMicDenied(false)} style={{ width: "100%", padding: "10px 0", borderRadius: 12, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Dismiss</button>
            </div>
          </div>
        )}
        {showCamDenied && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowCamDenied(false)}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 24, maxWidth: 320, width: "90%" }} onClick={e => e.stopPropagation()}>
              <p style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 8 }}>Camera Access Denied</p>
              <p style={{ fontSize: 12, color: T.sub, marginBottom: 16 }}>Enable camera in your browser/system settings, then try again.</p>
              <button onClick={() => setShowCamDenied(false)} style={{ width: "100%", padding: "10px 0", borderRadius: 12, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Dismiss</button>
            </div>
          </div>
        )}

        {/* ── Context menu ── */}
        {ctxMsg && (
          <div onClick={e => e.stopPropagation()} style={{ position: "fixed", left: Math.min(ctxPos.x, window.innerWidth - 190), top: Math.min(ctxPos.y, window.innerHeight - 180), zIndex: 8000, background: WA.ctxMenu, border: `1px solid ${WA.ctxBorder}`, borderRadius: 10, minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,.3)", overflow: "hidden" }}>
            {[
              { icon: <CornerUpLeft size={15} />, label: "Reply", action: () => { setReplyTo(ctxMsg); setCtxMsg(null); } },
              { icon: <Copy size={15} />, label: "Copy", action: () => { navigator.clipboard.writeText(ctxMsg.content); toast.success("Copied"); setCtxMsg(null); } },
              { icon: <Trash2 size={15} />, label: "Delete", danger: true, action: () => handleDeleteMsg(ctxMsg) },
            ].map((item, i) => (
              <button key={i} onClick={item.action} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", background: "none", border: "none", cursor: "pointer", color: item.danger ? "#f87171" : WA.incomingText, fontSize: 13.5, fontWeight: 400, borderBottom: i < 2 ? `1px solid ${WA.ctxBorder}` : "none" }}>
                <span style={{ color: item.danger ? "#f87171" : WA.subText }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        )}

        {/* ── WhatsApp Header ── */}
        <div style={{ background: WA.header, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, zIndex: 20 }}>
          <button onClick={() => { setSelectedConvId(null); setPreviewTemplate(null); setReplyTo(null); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 2px", display: "flex", alignItems: "center" }}>
            <ArrowLeft size={20} style={{ color: WA.headerText }} />
          </button>
          {/* Avatar */}
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: WA.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid rgba(255,255,255,.15)" }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: theme === "black" ? "#e9edef" : "#fff" }}>{userName.charAt(0).toUpperCase()}</span>
          </div>
          {/* Name + status */}
          <div style={{ flex: 1, cursor: "pointer" }}>
            <p style={{ fontWeight: 600, fontSize: 15, color: WA.headerText, margin: 0, lineHeight: 1.2 }}>{userName}</p>
            <p style={{ fontSize: 12, color: WA.headerSub, margin: 0 }}>
              {typing ? (
                <span style={{ color: "#4ade80" }}>typing…</span>
              ) : (() => {
                const lsa = (selectedConv as any).user?.last_seen_at;
                const online = lsa ? (Date.now() - new Date(lsa).getTime()) < 5 * 60 * 1000 : false;
                return online
                  ? <span style={{ color: "#25d366" }}>Online</span>
                  : lsa
                    ? `last seen ${safeDist(lsa, "", { addSuffix: true })}`
                    : `${userType} · ${getUserCode(selectedConv)}`;
              })()}
            </p>
          </div>
          {/* Actions */}
          <button onClick={() => { setSearchOpen(s => !s); setSearchQuery(""); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center" }}>
            <Search size={20} style={{ color: WA.headerText }} />
          </button>
          <div style={{ position: "relative" }}>
            <button onClick={e => { e.stopPropagation(); setShowHeaderMenu(s => !s); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center" }}>
              <MoreVertical size={20} style={{ color: WA.headerText }} />
            </button>
            {showHeaderMenu && (
              <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, minWidth: 190, background: WA.ctxMenu, border: `1px solid ${WA.ctxBorder}`, borderRadius: 10, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.3)", zIndex: 50 }}>
                <button onClick={() => { setShowHeaderMenu(false); setSearchOpen(s => !s); setSearchQuery(""); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "none", border: "none", cursor: "pointer", color: WA.incomingText, fontSize: 13.5, fontWeight: 500, borderBottom: `1px solid ${WA.ctxBorder}` }}>
                  <Search size={16} style={{ color: WA.subText }} /> Search
                </button>
                <button onClick={() => { setShowHeaderMenu(false); setConfirmClear(true); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 13.5, fontWeight: 500 }}>
                  <Trash2 size={16} style={{ color: "#f87171" }} /> Clear History
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Search bar ── */}
        {searchOpen && (
          <div style={{ background: WA.searchBg, borderBottom: `1px solid ${WA.border}`, padding: "8px 14px", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
            <Search size={15} style={{ color: WA.subText, flexShrink: 0 }} />
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search messages…"
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: WA.incomingText, fontSize: 13 }} />
            {searchQuery && <span style={{ fontSize: 11, color: WA.subText }}>{filteredMessages.length} found</span>}
            <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} style={{ color: WA.subText }} /></button>
          </div>
        )}

        {/* ── Messages (WhatsApp chat background) ── */}
        <div
          ref={scrollRef}
          onScroll={handleMsgScroll}
          style={{ flex: 1, overflowY: "auto", padding: "8px 12px 12px", background: WA.chatBg, backgroundImage: WA.chatPattern, backgroundSize: "20px 20px", position: "relative" }}
        >
          {/* Reaction emoji picker */}
          {showReactionFor && (
            <div onClick={e => e.stopPropagation()} style={{ position: "fixed", bottom: 200, right: 24, zIndex: 8500, background: WA.ctxMenu, border: `1px solid ${WA.ctxBorder}`, borderRadius: 20, padding: "10px 12px", display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 280, boxShadow: "0 8px 32px rgba(0,0,0,.3)" }}>
              {ADMIN_EMOJIS.slice(0, 16).map(e => (
                <button key={e} onClick={() => { toggleReaction(showReactionFor, e); setShowReactionFor(null); }} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", borderRadius: 8, padding: 4, lineHeight: 1 }}>{e}</button>
              ))}
            </div>
          )}

          {loadingMessages ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 0" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-end" : "flex-start" }}>
                  <div style={{ width: `${45 + (i % 3) * 15}%`, height: 60, borderRadius: 12, background: WA.border }} />
                </div>
              ))}
            </div>
          ) : filteredMessages.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "48px 0" }}>
              <MessageCircle style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.2, color: WA.subText }} />
              <p style={{ fontSize: 13, color: WA.subText }}>{searchQuery ? "No messages match your search." : "No messages yet. Start the conversation!"}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingBottom: 8 }}>
              {filteredMessages.map((msg, idx) => {
                const isMine = msg.sender_id === profile?.id;
                const isVoice = msg.file_name?.startsWith("voice.");
                const isPhoto = msg.file_name === "photo.jpg";
                const isFile  = !!msg.file_path && !isVoice && !isPhoto;
                const reactions = msg.reactions || [];
                const grouped = reactions.reduce<Record<string, {count:number;hasMe:boolean}>>((acc, r) => {
                  if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasMe: false };
                  acc[r.emoji].count++;
                  if (r.user_id === profile?.id) acc[r.emoji].hasMe = true;
                  return acc;
                }, {});
                const showDate = idx === 0 || !isSameDay(filteredMessages[idx - 1].created_at, msg.created_at);
                const bubbleBg  = isMine ? WA.outgoing  : WA.incoming;
                const bubbleClr = isMine ? WA.outgoingText : WA.incomingText;
                const timeClr   = isMine ? WA.outgoingTime : WA.incomingTime;

                return (
                  <div key={msg.id}>
                    {/* ── Date separator ── */}
                    {showDate && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "14px 0 10px" }}>
                        <span style={{ fontSize: 11.5, fontWeight: 500, color: WA.dateText, background: WA.dateBg, padding: "4px 14px", borderRadius: 20, boxShadow: "0 1px 4px rgba(0,0,0,.12)" }}>
                          {formatDateLabel(msg.created_at)}
                        </span>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 3, paddingLeft: isMine ? 48 : 0, paddingRight: isMine ? 0 : 48 }}>
                      <div style={{ maxWidth: "78%", position: "relative" }}>
                        {/* WhatsApp bubble tail */}
                        {isMine ? (
                          <div style={{ position: "absolute", right: -7, top: 0, width: 0, height: 0, borderLeft: `8px solid ${bubbleBg}`, borderTop: "8px solid transparent", borderBottom: 0, borderRight: 0 }} />
                        ) : (
                          <div style={{ position: "absolute", left: -7, top: 0, width: 0, height: 0, borderRight: `8px solid ${bubbleBg}`, borderTop: "8px solid transparent", borderBottom: 0, borderLeft: 0 }} />
                        )}

                        <div
                          onContextMenu={e => { e.preventDefault(); setCtxMsg(msg); setCtxPos({ x: e.clientX, y: e.clientY }); setShowReactionFor(null); }}
                          style={{ background: bubbleBg, borderRadius: isMine ? "8px 0 8px 8px" : "0 8px 8px 8px", padding: "7px 12px 6px", boxShadow: "0 1px 2px rgba(0,0,0,.15)", cursor: "context-menu", minWidth: 80 }}
                        >
                          {/* Sender label for incoming only */}
                          {!isMine && <p style={{ fontSize: 11.5, fontWeight: 600, color: "#00a884", marginBottom: 3, margin: "0 0 3px" }}>Support Agent</p>}

                          {isVoice && voiceUrls[msg.id] ? (
                            <AdminVoicePlayer src={voiceUrls[msg.id]} isMe={isMine} subColor={timeClr} />
                          ) : isPhoto ? (
                            photoUrls[msg.id]
                              ? <img src={photoUrls[msg.id]} alt="Photo" style={{ maxWidth: 220, borderRadius: 8, display: "block", margin: "0 0 2px" }} />
                              : <div style={{ width: 220, height: 140, borderRadius: 8, background: "rgba(0,0,0,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 24, height: 24, border: "2px solid rgba(255,255,255,.5)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /></div>
                          ) : isFile ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,.06)", borderRadius: 8, padding: "8px 10px" }}>
                              <Paperclip size={16} style={{ color: bubbleClr, opacity: 0.7 }} />
                              <span style={{ fontSize: 13, color: bubbleClr }}>{msg.file_name}</span>
                            </div>
                          ) : (
                            <p style={{ fontSize: 14, color: bubbleClr, whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.45, wordBreak: "break-word" }}>{msg.content}</p>
                          )}

                          {/* Timestamp + ticks */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: 3 }}>
                            <span style={{ fontSize: 11, color: timeClr, whiteSpace: "nowrap" }}>
                              {new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                            </span>
                            {isMine && (
                              msg.is_read
                                ? <CheckCheck size={14} style={{ color: WA.tickRead }} />
                                : <Check size={14} style={{ color: WA.tickSent }} />
                            )}
                          </div>
                        </div>

                        {/* Reactions row */}
                        {Object.keys(grouped).length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4, justifyContent: isMine ? "flex-end" : "flex-start" }}>
                            {Object.entries(grouped).map(([emoji, { count, hasMe }]) => (
                              <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)} style={{ display: "inline-flex", alignItems: "center", gap: 3, borderRadius: 20, border: hasMe ? "1px solid #00a884" : `1px solid ${WA.border}`, background: hasMe ? "rgba(0,168,132,.12)" : WA.dateBg, padding: "2px 8px", fontSize: 12, cursor: "pointer", color: bubbleClr, boxShadow: "0 1px 3px rgba(0,0,0,.1)" }}>
                                {emoji}<span style={{ fontSize: 10, color: WA.subText }}>{count}</span>
                              </button>
                            ))}
                            <button onClick={e => { e.stopPropagation(); setShowReactionFor(showReactionFor === msg.id ? null : msg.id); }} style={{ display: "inline-flex", alignItems: "center", borderRadius: 20, border: `1px solid ${WA.border}`, background: WA.dateBg, padding: "2px 8px", fontSize: 12, cursor: "pointer", color: WA.subText }}>+</button>
                          </div>
                        )}
                        {Object.keys(grouped).length === 0 && (
                          <div style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginTop: 1 }}>
                            <button onClick={e => { e.stopPropagation(); setShowReactionFor(showReactionFor === msg.id ? null : msg.id); }} style={{ opacity: 0, transition: "opacity .2s", fontSize: 12, background: "none", border: "none", cursor: "pointer", color: WA.subText }} onMouseEnter={e => (e.currentTarget.style.opacity = "1")} onMouseLeave={e => (e.currentTarget.style.opacity = "0")}>😊</button>
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

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <button onClick={() => scrollToBottom()} style={{ position: "sticky", bottom: 12, float: "right", width: 40, height: 40, borderRadius: "50%", background: WA.incoming, boxShadow: "0 4px 16px rgba(0,0,0,.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none", zIndex: 10 }}>
              <ChevronDown size={20} style={{ color: WA.subText }} />
            </button>
          )}
        </div>

        {/* ── Template preview banner ── */}
        {previewTemplate && (
          <div className="px-4 py-2 flex items-start gap-3 border-t animate-in slide-in-from-bottom duration-200" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }}>
            <Eye className="h-4 w-4 mt-0.5 shrink-0" style={{ color: T.badgeFg }} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium mb-0.5" style={{ color: T.sub }}>Preview — press Enter to send</p>
              <p className="text-xs" style={{ color: T.text }}>{previewTemplate}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setPreviewTemplate(null)} style={{ color: T.sub }}>Cancel</Button>
              <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleConfirmPreview}><Send className="h-3 w-3 mr-1" /> Send</Button>
            </div>
          </div>
        )}

        {/* Quick replies template library */}
        {quickRepliesOpen && (
          <div className="flex flex-col max-h-80 border-t overflow-hidden animate-in slide-in-from-bottom duration-300" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(16px)" }}>
            <div className="flex items-center gap-2 px-4 pt-3 pb-2">
              <Zap className="h-4 w-4" style={{ color: T.badgeFg }} />
              <span className="text-xs font-semibold" style={{ color: T.text }}>Quick Replies</span>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  style={{ background: showAnalytics ? T.badge : "transparent", color: showAnalytics ? T.badgeFg : T.sub }}
                  onClick={() => { setShowAnalytics(!showAnalytics); setShowAddForm(false); setShowManage(false); }}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  style={{ background: showAddForm ? T.badge : "transparent", color: showAddForm ? T.badgeFg : T.sub }}
                  onClick={() => { setShowAddForm(!showAddForm); setShowAnalytics(false); setShowManage(false); }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  style={{ background: showManage ? T.badge : "transparent", color: showManage ? T.badgeFg : T.sub }}
                  onClick={() => { setShowManage(!showManage); setShowAnalytics(false); setShowAddForm(false); }}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="ml-auto relative w-40">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: T.sub }} />
                <Input
                  placeholder="Search..."
                  value={templateSearch}
                  onChange={(e) => { setTemplateSearch(e.target.value); setActiveCategory(null); }}
                  className="h-7 text-[11px] pl-7 border-none"
                  style={{ background: T.input, color: T.text }}
                />
              </div>
            </div>

            <ScrollArea className="flex-1 px-4 pb-4">
              {showAddForm && profile?.id ? (
                <div className="py-2">
                  <CustomTemplateForm onClose={() => setShowAddForm(false)} profileId={profile.id} />
                </div>
              ) : showManage && profile?.id ? (
                <div className="py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: T.sub }}>Manage Custom Templates</p>
                  <CustomTemplatesManager profileId={profile.id} />
                </div>
              ) : showAnalytics ? (
                <div className="py-2 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: T.sub }}>Usage Analytics</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl border" style={{ background: T.input, borderColor: T.border }}>
                        <p className="text-[10px]" style={{ color: T.sub }}>Total Used</p>
                        <p className="text-lg font-bold" style={{ color: T.text }}>{Object.values(usageCounts).reduce((a, b) => a + b, 0)}</p>
                      </div>
                      <div className="p-3 rounded-xl border" style={{ background: T.input, borderColor: T.border }}>
                        <p className="text-[10px]" style={{ color: T.sub }}>Templates</p>
                        <p className="text-lg font-bold" style={{ color: T.text }}>{allCategories.reduce((acc, cat) => acc + cat.templates.length, 0)}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: T.sub }}>Top Templates</p>
                    <div className="space-y-1">
                      {topTemplates.length === 0 ? (
                        <p className="text-xs italic" style={{ color: T.sub }}>No data yet</p>
                      ) : (
                        topTemplates.map(([text, count]) => (
                          <div key={text} className="flex items-center justify-between p-2 rounded-lg" style={{ background: T.input }}>
                            <span className="text-xs truncate flex-1 mr-2" style={{ color: T.text }}>{text}</span>
                            <Badge variant="secondary" className="h-5 text-[10px]" style={{ background: T.badge, color: T.badgeFg }}>{count}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  {/* Categories Row */}
                  {!templateSearch && (
                    <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                      {allCategories.map((cat) => (
                        <Button
                          key={cat.label}
                          variant="ghost"
                          size="sm"
                          className="h-7 px-3 text-[11px] rounded-full whitespace-nowrap shrink-0 border transition-all"
                          style={{ 
                            background: activeCategory === cat.label ? T.badge : "transparent", 
                            color: activeCategory === cat.label ? T.badgeFg : T.text,
                            borderColor: activeCategory === cat.label ? T.badgeFg : T.border
                          }}
                          onClick={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
                        >
                          {cat.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Templates Grid */}
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {allCategories
                      .filter(cat => !activeCategory || cat.label === activeCategory)
                      .flatMap(cat => cat.templates.map(t => ({ text: t, category: cat.label })))
                      .filter(t => !templateSearch || t.text.toLowerCase().includes(templateSearch.toLowerCase()))
                      .map((t, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleTemplateSelect(t.text)}
                          className="text-left p-3 rounded-xl border text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                          style={{ 
                            background: previewTemplate === t.text ? T.badge : T.input, 
                            borderColor: previewTemplate === t.text ? T.badgeFg : T.border,
                            color: previewTemplate === t.text ? T.badgeFg : T.text
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{t.category}</span>
                            {usageCounts[t.text] > 0 && (
                              <span className="text-[9px] font-mono opacity-60">{usageCounts[t.text]} uses</span>
                            )}
                          </div>
                          <p className="line-clamp-2 leading-relaxed">{t.text}</p>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* ── Emoji picker ── */}
        {showEmoji && (
          <div onClick={e => e.stopPropagation()} style={{ padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: 6, background: WA.inputBar, borderTop: `1px solid ${WA.border}` }}>
            {ADMIN_EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => { setNewMessage(m => m + emoji); setShowEmoji(false); }} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", borderRadius: 8, padding: 4 }}>{emoji}</button>
            ))}
          </div>
        )}

        {/* ── Reply preview ── */}
        {replyTo && (
          <div style={{ padding: "8px 14px 4px", display: "flex", alignItems: "center", gap: 10, background: WA.inputBar, borderTop: `1px solid ${WA.border}`, borderLeft: `4px solid ${WA.replyBorder}` }}>
            <CornerUpLeft size={14} style={{ color: "#00a884", flexShrink: 0 }} />
            <p style={{ flex: 1, fontSize: 12, color: WA.subText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.content.slice(0, 60)}</p>
            <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} style={{ color: WA.subText }} /></button>
          </div>
        )}

        {/* ── Voice recording UI ── */}
        {isRecording && (
          <div style={{ padding: "10px 14px", borderTop: `1px solid ${WA.border}`, background: WA.inputBar, display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => stopRecording(true)} style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(239,68,68,.12)", border: "1.5px solid rgba(239,68,68,.35)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <X size={17} style={{ color: "#ef4444" }} />
            </button>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: WA.input, border: "1.5px solid rgba(239,68,68,.35)", borderRadius: 22, padding: "8px 14px" }}>
              <span style={{ animation: "rec-pulse 1.1s ease-in-out infinite", display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", minWidth: 38, fontVariantNumeric: "tabular-nums" }}>{fmtDur(recordingTime)}</span>
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 2, height: 22, overflow: "hidden" }}>
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} style={{ width: 3, borderRadius: 2, background: "rgba(239,68,68,.65)", animation: `voice-bar ${0.5 + (i % 7) * 0.09}s ease-in-out infinite alternate`, flexShrink: 0 }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: WA.subText, whiteSpace: "nowrap" }}>← Slide to cancel</span>
            </div>
            <button onClick={() => stopRecording(false)} style={{ width: 44, height: 44, borderRadius: "50%", background: "#00a884", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 12px rgba(0,168,132,.45)" }}>
              <Send size={17} style={{ color: "#fff", transform: "translateX(1px)" }} />
            </button>
          </div>
        )}

        {/* ── WhatsApp Input bar ── */}
        {!isRecording && (
          <div style={{ padding: "8px 12px", background: WA.inputBar, flexShrink: 0 }}>
            <input type="file" ref={fileRef} style={{ display: "none" }} onChange={handleFileUpload} accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx" />
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>

              {/* ── Left icons: Zap · Emoji · Attach ── */}
              <button onClick={e => { e.stopPropagation(); setQuickRepliesOpen(o => !o); if (!quickRepliesOpen) { setShowAddForm(false); setShowAnalytics(false); setShowManage(false); } }} title="Quick Replies"
                style={{ width: 36, height: 36, borderRadius: "50%", background: quickRepliesOpen ? "rgba(0,168,132,.18)" : "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Zap size={20} style={{ color: quickRepliesOpen ? "#00a884" : WA.subText }} />
              </button>
              <button onClick={e => { e.stopPropagation(); setShowEmoji(o => !o); }} title="Emoji"
                style={{ width: 36, height: 36, borderRadius: "50%", background: showEmoji ? "rgba(0,168,132,.18)" : "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Smile size={20} style={{ color: showEmoji ? "#00a884" : WA.subText }} />
              </button>
              <button onClick={() => fileRef.current?.click()} title="Attach file"
                style={{ width: 36, height: 36, borderRadius: "50%", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Paperclip size={20} style={{ color: WA.subText }} />
              </button>

              {/* ── Textarea ── */}
              <textarea
                ref={inputRef}
                placeholder="Type a message…"
                value={newMessage}
                onChange={e => { setNewMessage(e.target.value); e.target.style.height = "42px"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                onKeyDown={handleInputKeyDown}
                style={{ flex: 1, minHeight: 42, maxHeight: 120, padding: "10px 14px", borderRadius: 22, border: "none", outline: "none", resize: "none", background: WA.input, color: WA.inputText, fontSize: 14, fontFamily: "inherit", overflow: "auto", lineHeight: 1.4 }}
                rows={1}
              />

              {/* ── Right: Voice · Camera · Send ── */}
              <button onClick={startRecording} title="Voice message"
                style={{ width: 42, height: 42, borderRadius: "50%", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Mic size={22} style={{ color: WA.subText }} />
              </button>
              <button onClick={() => setShowCamera(true)} title="Camera"
                style={{ width: 42, height: 42, borderRadius: "50%", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Camera size={22} style={{ color: WA.subText }} />
              </button>
              <button onClick={() => handleSend()} title="Send" disabled={!newMessage.trim() && !previewTemplate}
                style={{ width: 44, height: 44, borderRadius: "50%", background: (newMessage.trim() || previewTemplate) ? "#00a884" : WA.searchBg, border: "none", cursor: (newMessage.trim() || previewTemplate) ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .2s", boxShadow: (newMessage.trim() || previewTemplate) ? "0 2px 8px rgba(0,168,132,.4)" : "none" }}>
                <Send size={18} style={{ color: (newMessage.trim() || previewTemplate) ? "#fff" : WA.subText, transform: "translateX(1px)" }} />
              </button>
            </div>
          </div>
        )}
        <style>{`
          @keyframes voice-bar { from { height: 4px; } to { height: 18px; } }
          @keyframes rec-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.7)} }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes typing-bounce { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-5px);opacity:1} }
        `}</style>
      </div>
    );
  }

  // Conversation list view — WhatsApp style
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "calc(100vh - 8rem)", marginTop: -8, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.25)", background: WA.convBg }}>

      {/* ── Conversations header ── */}
      <div style={{ background: WA.header, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: 20, color: WA.headerText, margin: 0 }}>Support Inbox</h1>
          <p style={{ fontSize: 12, color: WA.headerSub, margin: 0 }}>Customer conversations</p>
        </div>
        <div style={{ position: "relative", width: 200 }}>
          <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: WA.subText }} />
          <input
            placeholder="Search…"
            value={convSearch}
            onChange={(e) => setConvSearch(e.target.value)}
            style={{ width: "100%", height: 36, paddingLeft: 32, paddingRight: 12, borderRadius: 22, border: "none", outline: "none", background: theme === "black" ? "#111b21" : "rgba(255,255,255,.2)", color: WA.headerText, fontSize: 13 }}
          />
        </div>
      </div>

      {/* ── Conversation list ── */}
      <div style={{ flex: 1, overflowY: "auto", background: WA.convBg }}>
        {loadingConvs ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: `1px solid ${WA.border}` }}>
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: WA.border, flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ height: 13, width: "55%", borderRadius: 8, background: WA.border }} />
                  <div style={{ height: 11, width: "80%", borderRadius: 8, background: WA.border }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 40 }}>
            <MessageCircle style={{ width: 52, height: 52, marginBottom: 16, opacity: 0.15, color: WA.subText }} />
            <p style={{ fontSize: 14, color: WA.subText }}>No conversations found</p>
          </div>
        ) : (
          filteredConversations.map((conv: any) => {
            const userName = getUserDisplayName(conv);
            const userCode = getUserCode(conv);
            const userType = (conv as any).user?.user_type || "";
            const isSelected = selectedConvId === conv.id;
            const initial = userName.charAt(0).toUpperCase();
            // Deterministic avatar colour per initial
            const avatarColors = ["#128c7e","#075e54","#25d366","#34b7f1","#e91e63","#9c27b0","#3f51b5"];
            const avatarBg = avatarColors[initial.charCodeAt(0) % avatarColors.length];

            const lastSeenAt = (conv as any).user?.last_seen_at;
            const isOnline = lastSeenAt
              ? (Date.now() - new Date(lastSeenAt).getTime()) < 5 * 60 * 1000
              : false;
            const lastSeenLabel = lastSeenAt
              ? isOnline
                ? "Online"
                : safeDist(lastSeenAt, "Never", { addSuffix: true })
              : "Never seen";

            return (
              <div
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "13px 20px",
                  borderBottom: `1px solid ${WA.border}`,
                  background: isSelected ? (theme === "black" ? "#2a3942" : "#f0f2f5") : WA.convItem,
                  cursor: "pointer", transition: "background .15s"
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = WA.convHover; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = WA.convItem; }}
              >
                {/* Circular avatar with online dot */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 50, height: 50, borderRadius: "50%", background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>{initial}</span>
                  </div>
                  {isOnline && (
                    <span style={{ position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: "50%", background: "#25d366", border: `2px solid ${WA.convItem}` }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: WA.incomingText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>{userName}</span>
                    <span style={{ fontSize: 11, color: isOnline ? "#25d366" : WA.subText, whiteSpace: "nowrap", flexShrink: 0, fontWeight: isOnline ? 600 : 400 }}>
                      {lastSeenLabel}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: WA.subText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {userCode} · <span style={{ textTransform: "capitalize" }}>{userType}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminHelpSupport;
