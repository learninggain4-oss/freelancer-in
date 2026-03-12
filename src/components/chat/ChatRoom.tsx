import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, MessageSquareText, ShieldCheck, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import PaymentExchangePanel from "./PaymentExchangePanel";

const ChatRoom = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [threadParent, setThreadParent] = useState<Message | null>(null);
  const [pendingFile, setPendingFile] = useState<{ path: string; name: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
        .eq("type", "project")
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

  // Thread messages
  const { data: threadMessages = [], isLoading: loadingThread } = useThreadMessages(threadParent?.id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [newMessage]);

  // Typing handler
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
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
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <MessageSquareText className="h-7 w-7 text-primary/50 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2 w-full max-w-sm">
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-3 w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
          <MessageSquareText className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No chat room found for this project.</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const projectData = (chatRoom as any).project;
  const isClosed = projectData?.status === "cancelled" || projectData?.status === "completed";

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-background">
      {/* Main chat */}
      <div className="flex flex-1 flex-col">
        {/* Header — gradient + glassmorphism */}
        <div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5">
          <div className="absolute inset-0 backdrop-blur-xl" />
          <div className="relative flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-xl hover:bg-background/60 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-foreground truncate">
                {projectData?.name ?? "Project Chat"}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-primary/80">Validation Chat</span>
                {projectData?.status && (
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    projectData.status === "completed" && "bg-accent/15 text-accent",
                    projectData.status === "cancelled" && "bg-destructive/15 text-destructive",
                    projectData.status === "validation" && "bg-warning/15 text-warning",
                    !["completed", "cancelled", "validation"].includes(projectData.status) && "bg-primary/10 text-primary"
                  )}>
                    {projectData.status.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-medium text-accent">Online</span>
            </div>
          </div>
        </div>

        {/* Validation controls for client */}
        <ProjectValidationControls
          projectId={projectId!}
          projectStatus={projectData?.status ?? ""}
          isClient={profile?.user_type === "client" && projectData?.client_id === profile?.id}
          amount={Number(projectData?.amount ?? 0)}
          validationFees={Number(projectData?.validation_fees ?? 0)}
        />

        {/* Payment Exchange */}
        <PaymentExchangePanel
          projectId={projectId!}
          projectStatus={projectData?.status ?? ""}
          isClient={profile?.user_type === "client" && projectData?.client_id === profile?.id}
          employeeId={projectData?.assigned_employee_id ?? null}
        />

        {/* Messages area with subtle pattern bg */}
        <ScrollArea className="flex-1 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.02)_0%,transparent_70%)]" />
          <div className="relative px-4 py-3">
            {loadingMessages ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                    <Skeleton className={cn("h-14 rounded-2xl", i % 2 === 0 ? "w-3/5" : "w-2/5")} />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <MessageSquareText className="h-9 w-9 text-primary/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground/70">Start the conversation!</p>
              </div>
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
          </div>
        </ScrollArea>

        {/* Typing indicator */}
        <TypingIndicator typingUsers={typingUsers} />

        {/* Pending file chip */}
        {pendingFile && (
          <div className="flex items-center gap-2 mx-4 mb-1 rounded-lg bg-primary/5 border border-primary/10 px-3 py-1.5">
            <Paperclip className="h-3.5 w-3.5 text-primary/60" />
            <span className="text-xs text-foreground/80 truncate flex-1">{pendingFile.name}</span>
            <button
              className="text-[11px] font-medium text-destructive hover:underline"
              onClick={() => setPendingFile(null)}
            >
              Remove
            </button>
          </div>
        )}

        {/* Input area — large textarea, Enter does NOT send */}
        {isClosed ? (
          <div className="flex items-center justify-center gap-2 border-t bg-muted/30 px-4 py-4">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">This chat is closed.</span>
          </div>
        ) : (
          <div className="border-t bg-gradient-to-t from-background to-background/80">
            <div className="flex items-end gap-2 px-4 py-3">
              <ChatFileUpload onFileUploaded={handleFileUploaded} />
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  rows={2}
                  className="min-h-[56px] max-h-[160px] resize-none rounded-xl border-border/60 bg-muted/30 text-sm leading-relaxed pr-3 focus-visible:ring-primary/30 transition-all"
                />
              </div>
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!newMessage.trim() && !pendingFile}
                className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200 disabled:shadow-none disabled:opacity-40 shrink-0"
              >
                <Send className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>
        )}
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
