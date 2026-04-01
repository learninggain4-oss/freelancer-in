import { useState, useRef, useEffect, useMemo } from "react";
import { Send, HelpCircle, ArrowLeft, MessageCircle, Search, X, Zap, ChevronRight, Eye, BarChart3, Hash, Plus, Trash2, Edit2, Check, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useSupportChat, useAllConversations } from "@/hooks/use-support-chat";
import { useCustomQuickReplies } from "@/hooks/use-custom-quick-replies";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import SupportMessageBubble from "@/components/chat/SupportMessageBubble";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

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
  const { messages, isLoading: loadingMessages, sendMessage, toggleReaction } = useSupportChat(selectedConvId ?? undefined);
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
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSend = async (text?: string) => {
    const content = (text || newMessage).trim();
    if (!content) return;
    try {
      const isTemplate = allCategories.some((cat) => cat.templates.includes(content));
      if (isTemplate && profile?.id) {
        await trackUsage(content, findCategory(content), profile.id, selectedConvId || undefined);
      }
      await sendMessage(content);
      setNewMessage("");
      setQuickRepliesOpen(false);
      setPreviewTemplate(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleTemplateSelect = (template: string) => {
    setPreviewTemplate(template);
  };

  const handleConfirmPreview = () => {
    if (previewTemplate) handleSend(previewTemplate);
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

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (previewTemplate) {
        e.preventDefault();
        handleConfirmPreview();
      } else if (newMessage.startsWith("/")) {
        e.preventDefault();
      } else {
        handleSend();
      }
    }
    if (e.key === "Escape" && previewTemplate) {
      setPreviewTemplate(null);
    }
  };

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
      <div className="flex flex-col h-[calc(100vh-8rem)] -mt-2">
        {/* Header */}
        <div 
          className="flex items-center gap-3 p-4 border-b transition-all"
          style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)", borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}
        >
          <Button variant="ghost" size="icon" onClick={() => { setSelectedConvId(null); setPreviewTemplate(null); }} style={{ color: T.text }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold" style={{ color: T.text }}>{userName}</h2>
            <p className="text-xs capitalize" style={{ color: T.sub }}>
              {userType} • {getUserCode(selectedConv)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            style={{ color: T.text }}
            onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(""); }}
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="p-3 border-b animate-in slide-in-from-top duration-200" style={{ background: T.card, borderColor: T.border }}>
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-sm border-none"
              style={{ background: T.input, color: T.text }}
              autoFocus
            />
            {searchQuery && (
              <p className="text-[10px] mt-1" style={{ color: T.sub }}>
                {filteredMessages.length} result{filteredMessages.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" style={{ background: theme === "black" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" }}>
          {loadingMessages ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-3/4 rounded-2xl" style={{ background: T.border }} />
              ))}
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <MessageCircle className="h-12 w-12 mb-4 opacity-20" style={{ color: T.text }} />
              <p className="text-sm" style={{ color: T.sub }}>
                {searchQuery ? "No messages match your search." : "No messages yet. Start the conversation!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {filteredMessages.map((msg) => {
                const isAdmin = msg.sender_id === profile?.id;
                return (
                  <SupportMessageBubble
                    key={msg.id}
                    message={msg}
                    isMe={isAdmin}
                    senderLabel={isAdmin ? "You (Admin)" : userName}
                    currentUserId={profile?.id || ""}
                    onReaction={toggleReaction}
                  />
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Template preview banner */}
        {previewTemplate && (
          <div className="px-4 py-2 flex items-start gap-3 border-t animate-in slide-in-from-bottom duration-200" style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }}>
            <Eye className="h-4 w-4 mt-0.5 shrink-0" style={{ color: T.badgeFg }} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium mb-0.5" style={{ color: T.sub }}>Preview — press Enter to send</p>
              <p className="text-xs" style={{ color: T.text }}>{previewTemplate}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setPreviewTemplate(null)} style={{ color: T.sub }}>
                Cancel
              </Button>
              <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleConfirmPreview}>
                <Send className="h-3 w-3 mr-1" /> Send
              </Button>
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

        {/* Input area */}
        <div 
          className="p-4 border-t transition-all" 
          style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}
        >
          <div className="flex items-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl"
              style={{ background: quickRepliesOpen ? T.badge : T.input, color: quickRepliesOpen ? T.badgeFg : T.sub }}
              onClick={() => {
                setQuickRepliesOpen(!quickRepliesOpen);
                if (!quickRepliesOpen) {
                  setShowAddForm(false);
                  setShowAnalytics(false);
                  setShowManage(false);
                }
              }}
            >
              <Zap className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef as any}
                placeholder='Type a message or use "/" for quick replies...'
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleInputKeyDown}
                className="min-h-[44px] max-h-32 py-3 px-4 rounded-2xl resize-none border-none focus-visible:ring-1 focus-visible:ring-indigo-500/30"
                style={{ background: T.input, color: T.text }}
                rows={1}
              />
            </div>
            <Button
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
              onClick={() => handleSend()}
              disabled={!newMessage.trim() && !previewTemplate}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
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
                      {formatDistanceToNow(new Date(conv.created_at), { addSuffix: true })}
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
