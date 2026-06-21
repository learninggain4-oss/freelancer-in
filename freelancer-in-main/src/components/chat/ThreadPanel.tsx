import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import MessageBubble from "./MessageBubble";
import type { Message } from "@/hooks/use-realtime-messages";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ThreadPanelProps {
  parentMessage: Message;
  threadMessages: Message[];
  isLoading: boolean;
  currentUserId: string;
  onClose: () => void;
  onSendReply: (content: string, parentId: string) => Promise<void>;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReaction: (messageId: string, emoji: string) => Promise<void>;
}

const ThreadPanel = ({
  parentMessage,
  threadMessages,
  isLoading,
  currentUserId,
  onClose,
  onSendReply,
  onEdit,
  onDelete,
  onReaction,
}: ThreadPanelProps) => {
  const [reply, setReply] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  const handleSend = async () => {
    if (!reply.trim()) return;
    try {
      await onSendReply(reply.trim(), parentMessage.id);
      setReply("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const senderName = Array.isArray((parentMessage.sender as any)?.full_name)
    ? (parentMessage.sender as any).full_name.join(" ")
    : (parentMessage.sender as any)?.full_name || "Unknown";

  return (
    <div className="flex h-full flex-col border-l bg-background w-80">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-semibold">Thread</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Parent message */}
      <div className="border-b px-3 py-2">
        <p className="text-[10px] text-muted-foreground mb-0.5">{senderName}</p>
        <p className="text-sm">{parentMessage.content}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {new Date(parentMessage.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Thread replies */}
      <ScrollArea className="flex-1 px-3 py-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-3/4" />)}
          </div>
        ) : threadMessages.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">No replies yet</p>
        ) : (
          <div className="space-y-2">
            {threadMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                currentUserId={currentUserId}
                onEdit={onEdit}
                onDelete={onDelete}
                onReaction={onReaction}
                onReply={() => {}} // No nested threads
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Reply input */}
      <div className="flex items-center gap-2 border-t px-3 py-2">
        <Input
          placeholder="Reply..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 h-8 text-sm"
        />
        <Button size="icon" className="h-8 w-8" onClick={handleSend} disabled={!reply.trim()}>
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default ThreadPanel;
