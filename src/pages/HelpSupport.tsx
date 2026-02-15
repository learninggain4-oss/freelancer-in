import { useState, useRef, useEffect } from "react";
import { Send, HelpCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useSupportChat, useMyConversation } from "@/hooks/use-support-chat";
import { toast } from "sonner";
import SupportMessageBubble from "@/components/chat/SupportMessageBubble";

const HelpSupport = () => {
  const { profile } = useAuth();
  const { data: conversation, isLoading: loadingConv } = useMyConversation();
  const { messages, isLoading: loadingMessages, sendMessage, toggleReaction } = useSupportChat(conversation?.id);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, searchOpen]);

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

  const filteredMessages = searchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

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
        <div className="border-b px-4 py-2">
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
          {searchQuery && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {filteredMessages.length} result{filteredMessages.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-2">
        {loadingMessages ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-3/4" />
            ))}
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="py-8 text-center">
            <HelpCircle className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No messages match your search."
                : "Welcome to Help & Support! Send a message and our team will get back to you."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMessages.map((msg) => (
              <SupportMessageBubble
                key={msg.id}
                message={msg}
                isMe={msg.sender_id === profile?.id}
                senderLabel={msg.sender_id === profile?.id ? "You" : "Support Team"}
                currentUserId={profile?.id || ""}
                onReaction={toggleReaction}
              />
            ))}
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
