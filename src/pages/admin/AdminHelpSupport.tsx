import { useState, useRef, useEffect } from "react";
import { Send, HelpCircle, ArrowLeft, MessageCircle } from "lucide-react";
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

const AdminHelpSupport = () => {
  const { profile } = useAuth();
  const { data: conversations = [], isLoading: loadingConvs } = useAllConversations();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const { messages, isLoading: loadingMessages, sendMessage } = useSupportChat(selectedConvId ?? undefined);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find((c: any) => c.id === selectedConvId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content) return;
    try {
      await sendMessage(content);
      setNewMessage("");
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

  // Chat view when a conversation is selected
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
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-2 py-2">
          {loadingMessages ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-3/4" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => {
                const isAdmin = msg.sender_id === profile?.id;
                const senderLabel = isAdmin ? "You (Admin)" : userName;
                return (
                  <div
                    key={msg.id}
                    className={cn("flex", isAdmin ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-lg px-3 py-2",
                        isAdmin
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <p className="text-[10px] font-medium opacity-70 mb-0.5">{senderLabel}</p>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-[10px] opacity-50 mt-0.5">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="flex items-center gap-2 border-t pt-3">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!newMessage.trim()}>
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

      {conversations.length === 0 ? (
        <div className="py-12 text-center">
          <MessageCircle className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No support conversations yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv: any) => {
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
