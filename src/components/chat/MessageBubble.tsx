import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { Message } from "@/hooks/use-realtime-messages";
import {
  MoreVertical, Pencil, Trash2, Reply, SmilePlus, Check, CheckCheck, FileIcon, Download,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

interface MessageBubbleProps {
  message: Message;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReaction: (messageId: string, emoji: string) => Promise<void>;
  onReply: (message: Message) => void;
  currentUserId: string;
}

const MessageBubble = ({
  message,
  onEdit,
  onDelete,
  onReaction,
  onReply,
  currentUserId,
}: MessageBubbleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const isMine = message.sender_id === currentUserId;

  useEffect(() => {
    if (!message.file_path) return;
    supabase.storage
      .from("chat-attachments")
      .createSignedUrl(message.file_path, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setFileUrl(data.signedUrl);
      });
  }, [message.file_path]);

  const handleSaveEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      await onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const senderName = Array.isArray((message.sender as any)?.full_name)
    ? (message.sender as any).full_name.join(" ")
    : (message.sender as any)?.full_name || "Unknown";

  // Parse @mentions
  const renderContent = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) =>
      part.startsWith("@") ? (
        <span key={i} className="font-semibold text-primary">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  // Group reactions by emoji
  const reactionGroups = new Map<string, string[]>();
  (message.reactions || []).forEach((r) => {
    const arr = reactionGroups.get(r.emoji) || [];
    arr.push(r.user_id);
    reactionGroups.set(r.emoji, arr);
  });

  if (message.is_deleted) {
    return (
      <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
        <div className="max-w-[75%] rounded-2xl px-3 py-2 text-sm italic text-muted-foreground bg-muted/50">
          🚫 This message was deleted
        </div>
      </div>
    );
  }

  const isImage = message.file_name?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

  return (
    <div className={cn("group flex gap-1", isMine ? "justify-end" : "justify-start")}>
      {/* Actions - show on hover for own messages */}
      {isMine && (
        <div className="flex items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <SmilePlus className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" side="top">
              <div className="flex gap-1">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className="hover:scale-125 transition-transform text-lg p-0.5"
                    onClick={() => onReaction(message.id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onReply(message)}>
            <Reply className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditContent(message.content); setIsEditing(true); }}>
                <Pencil className="mr-2 h-3 w-3" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(message.id)}>
                <Trash2 className="mr-2 h-3 w-3" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="max-w-[75%]">
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm",
            isMine
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {!isMine && (
            <p className="mb-0.5 text-[10px] font-medium opacity-70">{senderName}</p>
          )}

          {/* Reply reference */}
          {message.parent_message_id && (
            <div className={cn(
              "mb-1 rounded border-l-2 pl-2 py-0.5 text-[11px] opacity-80",
              isMine ? "border-primary-foreground/40" : "border-primary/40"
            )}>
              Replying to a message
            </div>
          )}

          {/* File attachment */}
          {fileUrl && (
            <div className="mb-1">
              {isImage ? (
                <img
                  src={fileUrl}
                  alt={message.file_name || "attachment"}
                  className="max-w-full rounded-lg max-h-48 object-cover cursor-pointer"
                  onClick={() => window.open(fileUrl, "_blank")}
                />
              ) : (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 rounded-lg p-2",
                    isMine ? "bg-primary-foreground/10" : "bg-background/50"
                  )}
                >
                  <FileIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate text-xs">{message.file_name}</span>
                  <Download className="h-3 w-3 shrink-0" />
                </a>
              )}
            </div>
          )}

          {/* Message content */}
          {isEditing ? (
            <div className="flex gap-1">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="h-7 text-xs bg-background text-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                autoFocus
              />
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={handleSaveEdit}>
                Save
              </Button>
            </div>
          ) : (
            <p>{message.content ? renderContent(message.content) : null}</p>
          )}

          {/* Timestamp + edited + read */}
          <div className={cn("mt-0.5 flex items-center gap-1 text-[10px]", isMine ? "text-primary-foreground/70 justify-end" : "text-muted-foreground")}>
            {message.edited_at && <span>(edited)</span>}
            <span>
              {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {isMine && (
              message.is_read ? (
                <CheckCheck className="h-3 w-3 text-accent" />
              ) : (
                <Check className="h-3 w-3" />
              )
            )}
          </div>
        </div>

        {/* Reactions display */}
        {reactionGroups.size > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Array.from(reactionGroups.entries()).map(([emoji, users]) => (
              <button
                key={emoji}
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs border transition-colors",
                  users.includes(currentUserId)
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:bg-muted"
                )}
                onClick={() => onReaction(message.id, emoji)}
              >
                <span>{emoji}</span>
                <span className="text-[10px] text-muted-foreground">{users.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread indicator */}
        {(message.reply_count ?? 0) > 0 && (
          <button
            className="mt-1 text-xs text-primary hover:underline"
            onClick={() => onReply(message)}
          >
            💬 {message.reply_count} {message.reply_count === 1 ? "reply" : "replies"}
          </button>
        )}
      </div>

      {/* Actions for other's messages */}
      {!isMine && (
        <div className="flex items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <SmilePlus className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" side="top">
              <div className="flex gap-1">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className="hover:scale-125 transition-transform text-lg p-0.5"
                    onClick={() => onReaction(message.id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onReply(message)}>
            <Reply className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
