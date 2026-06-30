import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Phone ഐക്കൺ ഇറക്കുമതി ചെയ്തു
import { ArrowLeft, Send, MessageSquareText, ShieldCheck, Paperclip, Phone } from "lucide-react";
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

  // Audio Call Handler - അപ്ഡേറ്റ് ചെയ്തത്
  const handleAudioCall = () => {
    toast.info("Audio call starting...");
    console.log("Audio call initiated for project:", projectId);
    // പുതിയ കാൾ പേജിലേക്ക് പോകുന്നു
    navigate(`/project/${projectId}/call`);
  };

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

  const { data: threadMessages = [], isLoading: loadingThread } = useThreadMessages(threadParent?.id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [newMessage]);

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
        pendingFile?.name,
      );
      setNewMessage("");
      setPendingFile(null);
      broadcastTyping(false);
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
    return <div className="flex h-full flex-col items-center justify-center gap-4 p-6">Loading...</div>;
  }

  if (!chatRoom) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
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
    <div className="flex h-[calc(100dvh-5rem-88px)] lg:h-[calc(100dvh-5rem)] bg-background">
      <div className="flex flex-1 flex-col relative">
        {/* Header - Call button added */}
        <div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5">
          <div className="absolute inset-0 backdrop-blur-xl" />
          <div className="relative flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-foreground truncate">{projectData?.name ?? "Project Chat"}</h2>
            </div>

            {/* Audio Call Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleAudioCall}
              className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <Phone className="h-4 w-4 text-primary" />
            </Button>

            <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-medium text-accent">Online</span>
            </div>
          </div>
        </div>

        <ProjectValidationControls
          projectId={projectId!}
          projectStatus={projectData?.status ?? ""}
          isClient={profile?.user_type === "Employer" && projectData?.client_id === profile?.id}
          amount={Number(projectData?.amount ?? 0)}
          validationFees={Number(projectData?.validation_fees ?? 0)}
        />

        <ScrollArea className="flex-1 relative p-4">
          <div className="flex flex-col gap-4">
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
            <div ref={bottomRef} className="h-2" />
          </div>
        </ScrollArea>

        {/* Input Area - always sits above the bottom navigation */}
        <div className="p-3 bg-background border-t z-10 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.1)]">
          {!isClosed ? (
            <div className="flex flex-col gap-2">
              <TypingIndicator typingUsers={typingUsers} />

              {pendingFile && (
                <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 p-2 rounded-md">
                  <Paperclip className="h-4 w-4" />
                  <span className="truncate">{pendingFile.name}</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 ml-auto" onClick={() => setPendingFile(null)}>
                    Remove
                  </Button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <ChatFileUpload onFileUploaded={handleFileUploaded} />
                <Textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="min-h-[44px] max-h-[160px] resize-none py-3"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  onClick={handleSend}
                  disabled={!newMessage.trim() && !pendingFile}
                  className="h-[44px] w-[44px] shrink-0 rounded-full"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center p-3 text-muted-foreground text-sm flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              This project is {projectData?.status}. Chat is closed.
            </div>
          )}
        </div>
      </div>

      {/* Thread Panel */}
      {threadParent && (
        <ThreadPanel
          parentMessage={threadParent}
          threadMessages={threadMessages}
          isLoading={loadingThread}
          onClose={() => setThreadParent(null)}
          onSendReply={(content, parentId) => handleThreadSend(content, parentId)}
          onEdit={editMessage}
          onDelete={deleteMessage}
          onReaction={toggleReaction}
          currentUserId={profile?.id || ""}
        />
      )}
    </div>
  );
};

export default ChatRoom;
