import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Send, ArrowLeft, MessageCircle, Search, X, Zap, ChevronRight, Eye,
  BarChart3, Plus, Trash2, Edit2, Check, Settings2, MoreVertical,
  Smile, Paperclip, Mic, Camera, CornerUpLeft, Copy, Play, Pause, Square,
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
import { useQuery } from "@tanstack/react-query";
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // WhatsApp features state
  const [showHeaderMenu, setShowHeaderMenu]   = useState(false);
  const [confirmClear, setConfirmClear]       = useState(false);
  const [ctxMsg, setCtxMsg]                   = useState<any>(null);
  const [ctxPos, setCtxPos]                   = useState({ x: 0, y: 0 });
  const [replyTo, setReplyTo]                 = useState<any>(null);
  const [showEmoji, setShowEmoji]             = useState(false);
  const [isRecording, setIsRecording]         = useState(false);
  const [recordingTime, setRecordingTime]     = useState(0);
  const [showMicDenied, setShowMicDenied]     = useState(false);
  const [showCamDenied, setShowCamDenied]     = useState(false);
  const [showCamera, setShowCamera]           = useState(false);
  const [facingMode, setFacingMode]           = useState<"environment"|"user">("environment");
  const [cameraReady, setCameraReady]         = useState(false);
  const [voiceUrls, setVoiceUrls]             = useState<Record<string, string>>({});

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

  useEffect(() => {
    if (!searchOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, searchOpen]);

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
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (cancelledRef.current) { setRecordingTime(0); return; }
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const path = `support/${selectedConvId}/${Date.now()}.webm`;
        const { error } = await supabase.storage.from("support-files").upload(path, blob);
        if (error) { toast.error("Voice upload failed"); setRecordingTime(0); return; }
        await handleSend("", path, "voice.webm");
        setRecordingTime(0);
      };
      mr.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { setShowMicDenied(true); }
  };

  const stopRecording = (cancel = false) => {
    cancelledRef.current = cancel;
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
      <div className="flex flex-col h-[calc(100vh-8rem)] -mt-2" onClick={() => { setCtxMsg(null); setShowHeaderMenu(false); setShowEmoji(false); }}>
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
          <div onClick={e => e.stopPropagation()} style={{ position: "fixed", left: Math.min(ctxPos.x, window.innerWidth - 180), top: Math.min(ctxPos.y, window.innerHeight - 200), zIndex: 8000, background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, minWidth: 170, boxShadow: "0 8px 32px rgba(0,0,0,.3)", overflow: "hidden" }}>
            {[
              { icon: <CornerUpLeft size={14} />, label: "Reply", action: () => { setReplyTo(ctxMsg); setCtxMsg(null); } },
              { icon: <Copy size={14} />, label: "Copy", action: () => { navigator.clipboard.writeText(ctxMsg.content); toast.success("Copied"); setCtxMsg(null); } },
              { icon: <Trash2 size={14} />, label: "Delete", danger: true, action: () => handleDeleteMsg(ctxMsg) },
            ].map((item, i) => (
              <button key={i} onClick={item.action} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "none", border: "none", cursor: "pointer", color: item.danger ? "#f87171" : T.text, fontSize: 13, fontWeight: 600, borderBottom: i < 2 ? `1px solid ${T.border}` : "none" }}>
                <span style={{ color: item.danger ? "#f87171" : T.sub }}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex items-center gap-3 p-4 border-b transition-all" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)", borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
          <button onClick={() => { setSelectedConvId(null); setPreviewTemplate(null); setReplyTo(null); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 8 }}>
            <ArrowLeft size={18} style={{ color: T.sub }} />
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: T.text, margin: 0 }}>{userName}</p>
            <p style={{ fontSize: 11, color: T.sub, margin: 0, textTransform: "capitalize" }}>{userType} · {getUserCode(selectedConv)}</p>
          </div>
          <button onClick={() => { setSearchOpen(s => !s); setSearchQuery(""); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8 }}>
            <Search size={17} style={{ color: T.sub }} />
          </button>
          <div style={{ position: "relative" }}>
            <button onClick={e => { e.stopPropagation(); setShowHeaderMenu(s => !s); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8 }}>
              <MoreVertical size={17} style={{ color: T.sub }} />
            </button>
            {showHeaderMenu && (
              <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, minWidth: 180, background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,.3)", zIndex: 50 }}>
                <button onClick={() => { setShowHeaderMenu(false); setSearchOpen(s => !s); setSearchQuery(""); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "none", border: "none", cursor: "pointer", color: T.text, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>
                  <Search size={15} style={{ color: T.sub }} /> Search
                </button>
                <button onClick={() => { setShowHeaderMenu(false); setConfirmClear(true); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 13, fontWeight: 600 }}>
                  <Trash2 size={15} style={{ color: "#f87171" }} /> Clear History
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Search bar ── */}
        {searchOpen && (
          <div className="p-3 border-b animate-in slide-in-from-top duration-200" style={{ background: T.card, borderColor: T.border }}>
            <Input placeholder="Search messages..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9 text-sm border-none" style={{ background: T.input, color: T.text }} autoFocus />
            {searchQuery && <p className="text-[10px] mt-1" style={{ color: T.sub }}>{filteredMessages.length} result{filteredMessages.length !== 1 ? "s" : ""}</p>}
          </div>
        )}

        {/* ── Messages ── */}
        <ScrollArea className="flex-1 p-4" style={{ background: theme === "black" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" }}>
          {loadingMessages ? (
            <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-3/4 rounded-2xl" style={{ background: T.border }} />)}</div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <MessageCircle className="h-12 w-12 mb-4 opacity-20" style={{ color: T.text }} />
              <p className="text-sm" style={{ color: T.sub }}>{searchQuery ? "No messages match your search." : "No messages yet. Start the conversation!"}</p>
            </div>
          ) : (
            <div className="space-y-1 pb-4">
              {filteredMessages.map((msg) => {
                const isMine = msg.sender_id === profile?.id;
                const isVoice = msg.file_name?.startsWith("voice.");
                const isPhoto = msg.file_name === "photo.jpg";
                const isFile = msg.file_path && !isVoice && !isPhoto;
                const reactions = msg.reactions || [];
                const grouped = reactions.reduce<Record<string, {count:number;hasMe:boolean}>>((acc, r) => {
                  if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasMe: false };
                  acc[r.emoji].count++;
                  if (r.user_id === profile?.id) acc[r.emoji].hasMe = true;
                  return acc;
                }, {});

                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 4 }}>
                    <div style={{ maxWidth: "72%" }}>
                      <div
                        onContextMenu={e => { e.preventDefault(); setCtxMsg(msg); setCtxPos({ x: e.clientX, y: e.clientY }); }}
                        style={{ background: isMine ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : T.card, borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", border: isMine ? "none" : `1px solid ${T.border}`, cursor: "context-menu" }}
                      >
                        <p style={{ fontSize: 10, fontWeight: 600, color: isMine ? "rgba(255,255,255,.6)" : T.sub, marginBottom: 4 }}>{isMine ? "You (Admin)" : userName}</p>
                        {isVoice && voiceUrls[msg.id] ? (
                          <AdminVoicePlayer src={voiceUrls[msg.id]} isMe={isMine} subColor={T.sub} />
                        ) : isPhoto && msg.file_path ? (
                          <img src={`https://your-supabase-url/storage/v1/object/public/support-files/${msg.file_path}`} alt="Photo" style={{ maxWidth: 200, borderRadius: 12, display: "block" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : isFile ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Paperclip size={14} style={{ color: isMine ? "rgba(255,255,255,.7)" : T.sub }} />
                            <span style={{ fontSize: 13, color: isMine ? "#fff" : T.text }}>{msg.file_name}</span>
                          </div>
                        ) : (
                          <p style={{ fontSize: 13, color: isMine ? "#fff" : T.text, whiteSpace: "pre-wrap", margin: 0 }}>{msg.content}</p>
                        )}
                        <p style={{ fontSize: 10, color: isMine ? "rgba(255,255,255,.5)" : T.sub, marginTop: 4, textAlign: isMine ? "right" : "left" }}>
                          {new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </p>
                      </div>
                      {Object.keys(grouped).length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4, justifyContent: isMine ? "flex-end" : "flex-start" }}>
                          {Object.entries(grouped).map(([emoji, { count, hasMe }]) => (
                            <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)} style={{ display: "inline-flex", alignItems: "center", gap: 3, borderRadius: 20, border: hasMe ? "1px solid rgba(99,102,241,.5)" : `1px solid ${T.border}`, background: hasMe ? "rgba(99,102,241,.1)" : "transparent", padding: "2px 8px", fontSize: 12, cursor: "pointer", color: T.text }}>
                              {emoji}<span style={{ fontSize: 10, color: T.sub }}>{count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

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
          <div onClick={e => e.stopPropagation()} style={{ padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: 6, background: T.card, borderTop: `1px solid ${T.border}` }}>
            {ADMIN_EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => { setNewMessage(m => m + emoji); setShowEmoji(false); }} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", borderRadius: 8, padding: 4 }}>{emoji}</button>
            ))}
          </div>
        )}

        {/* ── Reply preview ── */}
        {replyTo && (
          <div style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 10, background: T.card, borderTop: `1px solid ${T.border}` }}>
            <CornerUpLeft size={14} style={{ color: "#6366f1", flexShrink: 0 }} />
            <p style={{ flex: 1, fontSize: 12, color: T.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.content.slice(0, 60)}</p>
            <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} style={{ color: T.sub }} /></button>
          </div>
        )}

        {/* ── Voice recording UI ── */}
        {isRecording && (
          <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, background: T.card, borderTop: `1px solid ${T.border}` }}>
            <button onClick={() => stopRecording(true)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} style={{ color: "#f87171" }} /></button>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, flex: 1 }}>
              {[4,7,11,8,14,10,6,13,9,12,7].map((h, i) => (
                <div key={i} style={{ width: 3, height: `${h}px`, borderRadius: 2, background: "#6366f1", animation: `voice-bar 0.8s ease-in-out ${i * 0.08}s infinite alternate` }} />
              ))}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#f87171", minWidth: 36 }}>{fmtDur(recordingTime)}</span>
            <button onClick={() => stopRecording(false)} style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Send size={16} style={{ color: "#fff" }} />
            </button>
          </div>
        )}

        {/* ── Input bar ── */}
        {!isRecording && (
          <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}`, background: T.card, backdropFilter: "blur(12px)", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
            <input type="file" ref={fileRef} style={{ display: "none" }} onChange={handleFileUpload} accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx" />
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              {/* Quick replies */}
              <button onClick={e => { e.stopPropagation(); setQuickRepliesOpen(o => !o); if (!quickRepliesOpen) { setShowAddForm(false); setShowAnalytics(false); setShowManage(false); } }} style={{ width: 36, height: 36, borderRadius: 10, background: quickRepliesOpen ? "rgba(99,102,241,.2)" : T.input, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Zap size={17} style={{ color: quickRepliesOpen ? "#6366f1" : T.sub }} />
              </button>
              {/* Emoji */}
              <button onClick={e => { e.stopPropagation(); setShowEmoji(o => !o); }} style={{ width: 36, height: 36, borderRadius: 10, background: showEmoji ? "rgba(99,102,241,.2)" : T.input, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Smile size={17} style={{ color: showEmoji ? "#6366f1" : T.sub }} />
              </button>
              {/* Text input */}
              <textarea
                ref={inputRef}
                placeholder='Type a message or use "/" for quick replies...'
                value={newMessage}
                onChange={e => { setNewMessage(e.target.value); e.target.style.height = "44px"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                onKeyDown={handleInputKeyDown}
                style={{ flex: 1, minHeight: 44, maxHeight: 120, padding: "12px 14px", borderRadius: 18, border: "none", outline: "none", resize: "none", background: T.input, color: T.text, fontSize: 13, fontFamily: "inherit", overflow: "auto" }}
                rows={1}
              />
              {/* File */}
              <button onClick={() => fileRef.current?.click()} style={{ width: 36, height: 36, borderRadius: 10, background: T.input, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Paperclip size={17} style={{ color: T.sub }} />
              </button>
              {/* Camera */}
              <button onClick={() => setShowCamera(true)} style={{ width: 36, height: 36, borderRadius: 10, background: T.input, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Camera size={17} style={{ color: T.sub }} />
              </button>
              {/* Mic / Send */}
              {newMessage.trim() || previewTemplate ? (
                <button onClick={() => handleSend()} style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Send size={17} style={{ color: "#fff" }} />
                </button>
              ) : (
                <button onMouseDown={startRecording} onMouseUp={() => stopRecording(false)} onTouchStart={startRecording} onTouchEnd={() => stopRecording(false)} style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Mic size={17} style={{ color: "#fff" }} />
                </button>
              )}
            </div>
          </div>
        )}
        <style>{`@keyframes voice-bar{from{transform:scaleY(0.4)}to{transform:scaleY(1.2)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Conversation list view
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>Help & Support</h1>
          <p className="text-sm" style={{ color: T.sub }}>Manage customer support conversations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: T.sub }} />
            <Input
              placeholder="Search conversations..."
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              className="h-10 pl-10 border-none rounded-xl"
              style={{ background: T.card, color: T.text, border: `1px solid ${T.border}` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed" style={{ borderColor: T.border, background: T.card }}>
            <MessageCircle className="h-12 w-12 mb-4 opacity-20" style={{ color: T.text }} />
            <p className="text-sm" style={{ color: T.sub }}>No conversations found</p>
          </div>
        ) : (
          filteredConversations.map((conv: any) => {
            const userName = getUserDisplayName(conv);
            const userCode = getUserCode(conv);
            const userType = (conv as any).user?.user_type || "";
            const isSelected = selectedConvId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className="group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border"
                style={{ 
                  background: isSelected ? T.badge : T.card, 
                  borderColor: isSelected ? T.badgeFg : T.border,
                  backdropFilter: "blur(12px)"
                }}
              >
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold"
                  style={{ background: T.input, color: T.badgeFg, border: `1px solid ${T.border}` }}
                >
                  {userName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate" style={{ color: T.text }}>{userName}</h3>
                    <span className="text-[10px]" style={{ color: T.sub }}>
                      {safeDist(conv.created_at, "—", { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-5 text-[10px] capitalize" style={{ background: T.nav, color: T.sub, borderColor: T.border }}>
                      {userType}
                    </Badge>
                    <span className="text-xs" style={{ color: T.sub }}>{userCode}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" style={{ color: T.sub }} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminHelpSupport;
