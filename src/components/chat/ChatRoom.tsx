import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeMessages, useThreadMessages, type Message } from "@/hooks/use-realtime-messages";
import { useTypingIndicator } from "@/hooks/use-chat-presence";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import MessageBubble from "./MessageBubble";
import ThreadPanel from "./ThreadPanel";
import TypingIndicator from "./TypingIndicator";
import ChatFileUpload from "./ChatFileUpload";
import ProjectValidationControls from "./ProjectValidationControls";

const ChatRoom = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [threadParent, setThreadParent] = useState<Message | null>(null);
  const [pendingFile, setPendingFile] = useState<{ path: string; name: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Get chat room
  const { data: chatRoom, isLoading: loadingRoom } = useQuery({
    queryKey: ["chat-room", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("chat_rooms")
        .select("*, project:project_id(name, client_id, assigned_employee_id, status, amount, validation_fees)")
        .eq("project_id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const {
    messages,
    isLoading: loadingMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
  } = useRealtimeMessages(chatRoom?.id);

  const { typingUsers, broadcastTyping } = useTypingIndicator(chatRoom?.id);

  // Thread messages (called unconditionally at top level)
  const { data: threadMessages = [], isLoading: loadingThread } = useThreadMessages(threadParent?.id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Typing handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    broadcastTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => broadcastTyping(false), 2000);
  };

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content && !pendingFile) return;
    try {
      await sendMessage(
        content || (pendingFile ? `📎 ${pendingFile.name}` : ""),
        undefined,
        pendingFile?.path,
        pendingFile?.name
      );
      setNewMessage("");
      setPendingFile(null);
      broadcastTyping(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleFileUploaded = (path: string, name: string) => {
    setPendingFile({ path, name });
  };

  const handleReply = (message: Message) => {
    setThreadParent(message);
  };

  const handleThreadSend = async (content: string, parentId: string) => {
    await sendMessage(content, parentId);
  };

  if (loadingRoom) {
    return (
      <div className="flex h-full flex-col p-4">
        <Skeleton className="mb-4 h-10 w-full" />
        <Skeleton className="flex-1" />
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
        <p className="text-sm text-muted-foreground">No chat room found for this project.</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)]">
      {/* Main chat */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">
              {(chatRoom as any).project?.name ?? "Project Chat"}
            </h2>
            <p className="text-xs text-muted-foreground">Validation Chat</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-[10px] text-muted-foreground">Online</span>
          </div>
        </div>

        {/* Validation controls for client */}
        <ProjectValidationControls
          projectId={projectId!}
          projectStatus={(chatRoom as any).project?.status ?? ""}
          isClient={profile?.user_type === "client" && (chatRoom as any).project?.client_id === profile?.id}
          amount={Number((chatRoom as any).project?.amount ?? 0)}
          validationFees={Number((chatRoom as any).project?.validation_fees ?? 0)}
        />

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-2">
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
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  currentUserId={profile?.id || ""}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  onReaction={toggleReaction}
                  onReply={handleReply}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Typing indicator */}
        <TypingIndicator typingUsers={typingUsers} />

        {/* Pending file */}
        {pendingFile && (
          <div className="flex items-center gap-2 px-4 py-1 text-xs text-muted-foreground">
            <span>📎 {pendingFile.name}</span>
            <button className="text-destructive hover:underline" onClick={() => setPendingFile(null)}>
              Remove
            </button>
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 border-t px-4 py-3">
          <ChatFileUpload onFileUploaded={handleFileUploaded} />
          <Input
            placeholder="Type a message... (use @name to mention)"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() && !pendingFile}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Thread panel */}
      {threadParent && (
        <ThreadPanel
          parentMessage={threadParent}
          threadMessages={threadMessages}
          isLoading={loadingThread}
          currentUserId={profile?.id || ""}
          onClose={() => setThreadParent(null)}
          onSendReply={handleThreadSend}
          onEdit={editMessage}
          onDelete={deleteMessage}
          onReaction={toggleReaction}
        />
      )}
    </div>
  );
};

export default ChatRoom;
