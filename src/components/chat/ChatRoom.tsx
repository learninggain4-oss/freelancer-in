import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ChatRoom = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get or find chat room for this project
  const { data: chatRoom, isLoading: loadingRoom } = useQuery({
    queryKey: ["chat-room", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("chat_rooms")
        .select("*, project:project_id(name, client_id, assigned_employee_id)")
        .eq("project_id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const { messages, isLoading: loadingMessages, sendMessage } = useRealtimeMessages(chatRoom?.id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    try {
      await sendMessage(newMessage.trim());
      setNewMessage("");
    } catch (e: any) {
      toast.error(e.message);
    }
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
    <div className="flex h-[calc(100vh-5rem)] flex-col">
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
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isMine = msg.sender_id === profile?.id;
              return (
                <div
                  key={msg.id}
                  className={cn("flex", isMine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                      isMine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {!isMine && (
                      <p className="mb-0.5 text-[10px] font-medium opacity-70">
                        {(msg.sender as any)?.full_name}
                      </p>
                    )}
                    <p>{msg.content}</p>
                    <p className={cn("mt-0.5 text-[10px]", isMine ? "text-primary-foreground/70" : "text-muted-foreground")}>
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

export default ChatRoom;
