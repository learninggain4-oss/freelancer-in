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
      <div className="flex h-[calc(100vh-10rem)] flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b pb-3 mb-2">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedConvId(null); setPreviewTemplate(null); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">{userName}</h2>
            <p className="text-xs text-muted-foreground capitalize">
              {userType} • {getUserCode(selectedConv)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(""); }}
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="border-b pb-2 mb-2">
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
            {searchQuery && (
              <p className="text-[10px] text-muted-foreground mt-1">
                {filteredMessages.length} result{filteredMessages.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-2 py-2">
          {loadingMessages ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-3/4" />
              ))}
            </div>
          ) : filteredMessages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery ? "No messages match your search." : "No messages yet. Start the conversation!"}
            </p>
          ) : (
            <div className="space-y-2">
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
          <div className="border-t bg-accent/10 px-3 py-2 flex items-start gap-2">
            <Eye className="h-4 w-4 text-accent-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Preview — press Enter to send</p>
              <p className="text-xs text-foreground">{previewTemplate}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setPreviewTemplate(null)}>
                Cancel
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={handleConfirmPreview}>
                <Send className="h-3 w-3 mr-1" /> Send
              </Button>
            </div>
          </div>
        )}

        {/* Quick replies template library */}
        {quickRepliesOpen && (
          <div className="border-t bg-muted/30 max-h-72 overflow-hidden flex flex-col">
            <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">Quick Replies</span>
              <Button
                variant={showAnalytics ? "secondary" : "ghost"}
                size="sm"
                className="h-5 px-1.5 text-[10px]"
                onClick={() => { setShowAnalytics(!showAnalytics); setShowAddForm(false); setShowManage(false); }}
                title="Analytics"
              >
                <BarChart3 className="h-3 w-3" />
              </Button>
              <Button
                variant={showAddForm ? "secondary" : "ghost"}
                size="sm"
                className="h-5 px-1.5 text-[10px]"
                onClick={() => { setShowAddForm(!showAddForm); setShowAnalytics(false); setShowManage(false); }}
                title="Add custom template"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant={showManage ? "secondary" : "ghost"}
                size="sm"
                className="h-5 px-1.5 text-[10px]"
                onClick={() => { setShowManage(!showManage); setShowAnalytics(false); setShowAddForm(false); }}
                title="Manage custom templates"
              >
                <Settings2 className="h-3 w-3" />
              </Button>
              <Input
                placeholder="Search templates..."
                value={templateSearch}
                onChange={(e) => { setTemplateSearch(e.target.value); setActiveCategory(null); }}
                className="ml-auto h-6 w-36 text-[11px] px-2"
              />
            </div>

            {/* Shortcut hints */}
            <div className="px-3 pb-1">
              <p className="text-[9px] text-muted-foreground truncate">
                Shortcuts: {allCategories.filter((c) => c.shortcut).map((c) => c.shortcut).join(" • ")}
              </p>
            </div>

            {/* Add custom template form */}
            {showAddForm && profile?.id ? (
              <ScrollArea className="flex-1 px-3 pb-2">
                <CustomTemplateForm onClose={() => setShowAddForm(false)} profileId={profile.id} />
              </ScrollArea>
            ) : showManage && profile?.id ? (
              <ScrollArea className="flex-1 px-3 pb-2">
                <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Manage Custom Templates</p>
                <CustomTemplatesManager profileId={profile.id} />
              </ScrollArea>
            ) : showAnalytics ? (
              <ScrollArea className="flex-1 px-3 pb-2">
                <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Most Used Templates</p>
                {topTemplates.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground py-2">No template usage data yet.</p>
                ) : (
                  <div className="space-y-1">
                    {topTemplates.map(([text, count], i) => (
                      <button
                        key={i}
                        onClick={() => handleTemplateSelect(text)}
                        className="flex w-full items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-left transition-colors hover:bg-primary/5"
                      >
                        <span className="text-xs text-foreground flex-1 truncate">{text}</span>
                        <Badge variant="secondary" className="text-[9px] shrink-0">
                          <Hash className="h-2.5 w-2.5 mr-0.5" />{count}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            ) : templateSearch ? (
              <ScrollArea className="flex-1 px-3 pb-2">
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {allCategories.flatMap((cat) =>
                    cat.templates
                      .filter((t) => t.toLowerCase().includes(templateSearch.toLowerCase()))
                      .map((t) => ({ text: t, label: cat.label }))
                  ).map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleTemplateSelect(item.text)}
                      className="rounded-full border bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-primary/10 hover:border-primary/30 flex items-center gap-1.5"
                    >
                      <span>{item.text.length > 55 ? item.text.slice(0, 55) + "…" : item.text}</span>
                      {usageCounts[item.text] > 0 && (
                        <Badge variant="outline" className="text-[8px] h-4 px-1">{usageCounts[item.text]}</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <ScrollArea className="flex-1 px-3 pb-2">
                <div className="space-y-1.5 pt-1">
                  {allCategories.map((cat) => (
                    <div key={cat.label}>
                      <button
                        onClick={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
                        className={cn(
                          "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                          activeCategory === cat.label
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <span>{cat.label}</span>
                        {cat.isCustom && (
                          <Badge variant="outline" className="text-[8px] h-3.5 px-1">Custom</Badge>
                        )}
                        {cat.shortcut && (
                          <code className="ml-1 text-[9px] text-muted-foreground font-mono">{cat.shortcut}</code>
                        )}
                        <ChevronRight className={cn("ml-auto h-3 w-3 transition-transform", activeCategory === cat.label && "rotate-90")} />
                      </button>
                      {activeCategory === cat.label && (
                        <div className="flex flex-wrap gap-1.5 pl-2 pt-1 pb-1">
                          {cat.templates.map((reply, ri) => (
                            <button
                              key={ri}
                              onClick={() => handleTemplateSelect(reply)}
                              className="rounded-full border bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-primary/10 hover:border-primary/30 flex items-center gap-1.5"
                            >
                              <span>{reply}</span>
                              {usageCounts[reply] > 0 && (
                                <Badge variant="outline" className="text-[8px] h-4 px-1">{usageCounts[reply]}</Badge>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 border-t pt-3">
          <Button
            variant={quickRepliesOpen ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => { setQuickRepliesOpen(!quickRepliesOpen); setShowAnalytics(false); setShowAddForm(false); setShowManage(false); }}
            title="Quick replies"
          >
            <Zap className="h-4 w-4" />
          </Button>
          <Input
            ref={inputRef}
            placeholder="Type a message or /shortcut..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="flex-1"
          />
          <Button size="icon" onClick={() => previewTemplate ? handleConfirmPreview() : handleSend()} disabled={!newMessage.trim() && !previewTemplate}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Conversation list
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Help & Support</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name, code, or email..."
          value={convSearch}
          onChange={(e) => setConvSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredConversations.length === 0 ? (
        <div className="py-12 text-center">
          <MessageCircle className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {convSearch ? "No users match your search." : "No support conversations yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conv: any) => {
            const name = getUserDisplayName(conv);
            const code = getUserCode(conv);
            const userType = conv.user?.user_type || "";
            const lastMsg = conv.last_message;
            const unread = conv.unread_count || 0;

            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{name}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">{userType}</Badge>
                    {code && (
                      <span className="text-[10px] text-muted-foreground">{code}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {lastMsg?.content || "No messages yet"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {lastMsg && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: true })}
                    </span>
                  )}
                  {unread > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {unread}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminHelpSupport;
