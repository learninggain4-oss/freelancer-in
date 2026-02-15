import { useState, useRef, useEffect } from "react";
import { Send, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useSupportChat, useMyConversation } from "@/hooks/use-support-chat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const HelpSupport = () => {
  const { profile } = useAuth();
  const { data: conversation, isLoading: loadingConv } = useMyConversation();
  const { messages, isLoading: loadingMessages, sendMessage } = useSupportChat(conversation?.id);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

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

  if (loadingConv) {
    return (
      <div className="flex h-full flex-col p-4">
        <Skeleton className="mb-4 h-10 w-full" />
        <Skeleton className="flex-1" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <HelpCircle className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-foreground">Help & Support</h2>
          <p className="text-xs text-muted-foreground">Chat with our support team</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="text-[10px] text-muted-foreground">Online</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-2">
        {loadingMessages ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-3/4" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="py-8 text-center">
            <HelpCircle className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Welcome to Help & Support! Send a message and our team will get back to you.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isMe = msg.sender_id === profile?.id;
              const senderName = isMe
                ? "You"
                : "Support Team";
              return (
                <div
                  key={msg.id}
                  className={cn("flex", isMe ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-3 py-2",
                      isMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <p className="text-[10px] font-medium opacity-70 mb-0.5">{senderName}</p>
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
      <div className="flex items-center gap-2 border-t px-4 py-3">
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
};

export default HelpSupport;
