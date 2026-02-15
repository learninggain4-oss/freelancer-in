import { useState, useRef, useEffect } from "react";
import { Send, HelpCircle, ArrowLeft, MessageCircle, Search, X, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSupportChat, useAllConversations } from "@/hooks/use-support-chat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import SupportMessageBubble from "@/components/chat/SupportMessageBubble";

const QUICK_REPLY_CATEGORIES = [
  {
    label: "👋 Greetings",
    templates: [
      "Hi! How can I help you today?",
      "Hello! Thank you for reaching out to support.",
      "Welcome! I'm here to assist you.",
    ],
  },
  {
    label: "🔍 Gathering Info",
    templates: [
      "Could you please provide more details about your issue?",
      "Can you share a screenshot so I can better understand the problem?",
      "What is your registered email or user code?",
      "When did you first notice this issue?",
    ],
  },
  {
    label: "⏳ In Progress",
    templates: [
      "Thank you for your patience. We're looking into this now.",
      "We're working on this and will update you shortly.",
      "I've escalated this to the team. You'll hear back soon.",
      "This may take a little time. I'll keep you posted.",
    ],
  },
  {
    label: "💰 Payments & Wallet",
    templates: [
      "Your wallet balance has been updated. Please check now.",
      "The withdrawal is being processed and should reflect within 24 hours.",
      "Could you confirm your UPI ID or bank details for the transfer?",
      "The payment has been credited to your account successfully.",
    ],
  },
  {
    label: "📋 Projects & Jobs",
    templates: [
      "Your project application has been received. The client will review it shortly.",
      "Please upload your submission files through the Projects tab.",
      "The project status has been updated. Please check your dashboard.",
    ],
  },
  {
    label: "✅ Resolution",
    templates: [
      "Your issue has been resolved. Is there anything else I can help with?",
      "This has been fixed. Please try again and let me know if it works.",
      "I'm glad I could help! Feel free to reach out anytime.",
      "Closing this ticket. Don't hesitate to contact us again if needed.",
    ],
  },
  {
    label: "📧 Follow-up",
    templates: [
      "Please check your email for further instructions.",
      "I've sent you a notification with the details.",
      "You can track the status from your dashboard.",
      "Is there anything else you need help with?",
    ],
  },
];

const AdminHelpSupport = () => {
  const { profile } = useAuth();
  const { data: conversations = [], isLoading: loadingConvs } = useAllConversations();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const { messages, isLoading: loadingMessages, sendMessage, toggleReaction } = useSupportChat(selectedConvId ?? undefined);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [convSearch, setConvSearch] = useState("");
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find((c: any) => c.id === selectedConvId);

  useEffect(() => {
    if (!searchOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, searchOpen]);

  const handleSend = async (text?: string) => {
    const content = (text || newMessage).trim();
    if (!content) return;
    try {
      await sendMessage(content);
      setNewMessage("");
      setQuickRepliesOpen(false);
    } catch (e: any) {
      toast.error(e.message);
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
          <Button variant="ghost" size="icon" onClick={() => setSelectedConvId(null)}>
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

        {/* Quick replies template library */}
        {quickRepliesOpen && (
          <div className="border-t bg-muted/30 max-h-56 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-3 pt-2 pb-1">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">Quick Replies</span>
              <Input
                placeholder="Search templates..."
                value={templateSearch}
                onChange={(e) => { setTemplateSearch(e.target.value); setActiveCategory(null); }}
                className="ml-auto h-6 w-40 text-[11px] px-2"
              />
            </div>
            <ScrollArea className="flex-1 px-3 pb-2">
              {templateSearch ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_REPLY_CATEGORIES.flatMap((cat) =>
                    cat.templates.filter((t) =>
                      t.toLowerCase().includes(templateSearch.toLowerCase())
                    )
                  ).map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(reply)}
                      className="rounded-full border bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-primary/10 hover:border-primary/30"
                    >
                      {reply.length > 55 ? reply.slice(0, 55) + "…" : reply}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  {QUICK_REPLY_CATEGORIES.map((cat, ci) => (
                    <div key={ci}>
                      <button
                        onClick={() => setActiveCategory(activeCategory === ci ? null : ci)}
                        className={cn(
                          "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                          activeCategory === ci
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <span>{cat.label}</span>
                        <ChevronRight className={cn("ml-auto h-3 w-3 transition-transform", activeCategory === ci && "rotate-90")} />
                      </button>
                      {activeCategory === ci && (
                        <div className="flex flex-wrap gap-1.5 pl-2 pt-1 pb-1">
                          {cat.templates.map((reply, ri) => (
                            <button
                              key={ri}
                              onClick={() => handleSend(reply)}
                              className="rounded-full border bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-primary/10 hover:border-primary/30"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 border-t pt-3">
          <Button
            variant={quickRepliesOpen ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setQuickRepliesOpen(!quickRepliesOpen)}
            title="Quick replies"
          >
            <Zap className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button size="icon" onClick={() => handleSend()} disabled={!newMessage.trim()}>
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

      {/* Search conversations */}
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
