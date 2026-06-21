import { cn } from "@/lib/utils";
import type { SupportMessage, SupportReaction } from "@/hooks/use-support-chat";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SmilePlus } from "lucide-react";

const QUICK_EMOJIS = ["👍", "❤️", "😊", "🎉", "👏", "🙏"];

interface SupportMessageBubbleProps {
  message: SupportMessage;
  isMe: boolean;
  senderLabel: string;
  currentUserId: string;
  onReaction: (messageId: string, emoji: string) => Promise<void>;
}

const SupportMessageBubble = ({
  message,
  isMe,
  senderLabel,
  currentUserId,
  onReaction,
}: SupportMessageBubbleProps) => {
  const reactions = message.reactions || [];

  // Group reactions by emoji
  const grouped = reactions.reduce<Record<string, { count: number; hasMe: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasMe: false };
    acc[r.emoji].count++;
    if (r.user_id === currentUserId) acc[r.emoji].hasMe = true;
    return acc;
  }, {});

  return (
    <div className={cn("group flex gap-1", isMe ? "justify-end" : "justify-start")}>
      <div className="flex flex-col max-w-[75%]">
        <div
          className={cn(
            "rounded-lg px-3 py-2 relative",
            isMe
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          <p className="text-[10px] font-medium opacity-70 mb-0.5">{senderLabel}</p>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <p className="text-[10px] opacity-50 mt-0.5">
            {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Reactions display */}
        {Object.keys(grouped).length > 0 && (
          <div className={cn("flex flex-wrap gap-1 mt-1", isMe ? "justify-end" : "justify-start")}>
            {Object.entries(grouped).map(([emoji, { count, hasMe }]) => (
              <button
                key={emoji}
                onClick={() => onReaction(message.id, emoji)}
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors hover:bg-muted",
                  hasMe ? "border-primary/40 bg-primary/10" : "border-border bg-background"
                )}
              >
                {emoji} <span className="text-[10px] text-muted-foreground">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reaction picker trigger */}
      <div className={cn("self-center opacity-0 group-hover:opacity-100 transition-opacity", isMe ? "order-first" : "order-last")}>
        <Popover>
          <PopoverTrigger asChild>
            <button className="rounded-full p-1 hover:bg-muted transition-colors">
              <SmilePlus className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1.5" side="top" align="center">
            <div className="flex gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onReaction(message.id, emoji)}
                  className="rounded p-1 text-lg hover:bg-muted transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default SupportMessageBubble;
