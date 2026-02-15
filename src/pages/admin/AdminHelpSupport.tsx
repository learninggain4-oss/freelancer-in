import { useState, useRef, useEffect } from "react";
import { Send, HelpCircle, ArrowLeft, MessageCircle, Search, X, Zap } from "lucide-react";
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

const QUICK_REPLIES = [
  "Hi! How can I help you today?",
  "Thank you for reaching out. Let me look into this for you.",
  "Could you please provide more details about your issue?",
  "Your issue has been resolved. Is there anything else I can help with?",
  "We're working on this and will update you shortly.",
  "Please check your email for further instructions.",
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

        {/* Quick replies */}
        {quickRepliesOpen && (
          <div className="border-t px-3 py-2 bg-muted/30">
            <p className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
              <Zap className="h-3 w-3" /> Quick Replies
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(reply)}
                  className="rounded-full border bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-primary/10 hover:border-primary/30"
                >
                  {reply.length > 45 ? reply.slice(0, 45) + "…" : reply}
                </button>
              ))}
            </div>
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
