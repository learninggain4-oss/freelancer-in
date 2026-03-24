import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpgradeChat } from "@/hooks/use-upgrade-chat";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const UpgradeChat = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: request, isLoading: loadingRequest } = useQuery({
    queryKey: ["upgrade-request-detail", requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const { data, error } = await supabase
        .from("wallet_upgrade_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });

  const { messages, isLoading: loadingMessages, sendMessage } = useUpgradeChat(requestId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [newMessage]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content) return;
    try {
      await sendMessage(content);
      setNewMessage("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loadingRequest) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-muted-foreground">Upgrade request not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col bg-background">
      {/* Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5">
        <div className="absolute inset-0 backdrop-blur-xl" />
        <div className="relative flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-xl hover:bg-background/60"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-foreground">Wallet Upgrade</h2>
            <span className="text-[11px] font-medium text-primary/80">
              {request.current_wallet_type} → {request.requested_wallet_type}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-medium text-accent">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.02)_0%,transparent_70%)]" />
        <div className="relative px-4 py-3">
          {loadingMessages ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                  <Skeleton className={cn("h-14 rounded-2xl", i % 2 === 0 ? "w-3/5" : "w-2/5")} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <ShieldCheck className="h-9 w-9 text-primary/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Wallet Upgrade Payment</p>
              <p className="text-xs text-muted-foreground/70">Chat with admin to complete your upgrade payment</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => {
                const isMine = msg.sender_id === profile?.id;
                return (
                  <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      )}
                    >
                      {!isMine && (
                        <p className="text-[10px] font-semibold text-primary mb-1">Admin</p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={cn("text-[10px] mt-1", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                        {format(new Date(msg.created_at), "hh:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-gradient-to-t from-background to-background/80">
        <div className="flex items-end gap-2 px-4 py-3">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={2}
              className="min-h-[56px] max-h-[160px] resize-none rounded-xl border-border/60 bg-muted/30 text-sm leading-relaxed focus-visible:ring-primary/30 transition-all"
            />
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200 disabled:shadow-none disabled:opacity-40 shrink-0"
          >
            <Send className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeChat;
