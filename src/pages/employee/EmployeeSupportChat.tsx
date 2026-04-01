import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send, MessageSquareText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import MessageBubble from "@/components/chat/MessageBubble";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const EmployeeSupportChat = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room");
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { theme } = useDashboardTheme();
  const T = TH[theme];

  const { data: chatRoom, isLoading: loadingRoom } = useQuery({
    queryKey: ["support-chat-room", roomId],
    queryFn: async () => {
      if (!roomId) return null;
      const { data, error } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("id", roomId)
        .eq("type", "support")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!roomId,
  });

  const {
    messages,
    isLoading: loadingMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
  } = useRealtimeMessages(chatRoom?.id);

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

  const handleSend = async () => {
    const content = newMessage.trim();
    if (content) {
      try {
        await sendMessage(content);
        setNewMessage("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      } catch (e: any) {
        toast.error(e.message);
      }
    }
  };

  if (loadingRoom) {
    return (
      <div style={{ background: T.bg }} className="flex h-full flex-col items-center justify-center gap-6 p-6">
        <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)" }} className="h-24 w-24 rounded-[2rem] animate-pulse flex items-center justify-center shadow-2xl border border-white/5">
          <MessageSquareText className="h-10 w-10 text-[#6366f1]/50" />
        </div>
        <Skeleton style={{ background: T.card }} className="h-4 w-48 rounded-full" />
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div style={{ background: T.bg }} className="flex h-full flex-col items-center justify-center gap-6 p-6">
        <div style={{ background: T.card, borderColor: T.border }} className="h-24 w-24 rounded-[2rem] border flex items-center justify-center shadow-2xl">
          <MessageSquareText style={{ color: T.sub }} className="h-10 w-10 opacity-30" />
        </div>
        <div className="text-center">
          <p style={{ color: T.text }} className="text-lg font-black uppercase tracking-widest">Signal Lost</p>
          <p style={{ color: T.sub }} className="text-xs font-bold mt-2 opacity-60">Support channel not detected.</p>
        </div>
        <Button style={{ background: T.card, borderColor: T.border, color: T.text }} variant="outline" size="lg" onClick={() => navigate(-1)} className="gap-3 rounded-2xl border-2 font-black uppercase tracking-widest text-xs px-8">
          <ArrowLeft className="h-5 w-5" /> Retreat
        </Button>
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, color: T.text }} className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden">
      {/* Header — glassmorphism */}
      <div style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(20px)" }} className="relative z-10 border-b shadow-2xl">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            style={{ background: T.nav, color: T.text }}
            className="h-11 w-11 rounded-2xl hover:bg-white/5 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h2 style={{ color: T.text }} className="text-lg font-black uppercase tracking-tight">Command Support</h2>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#4ade80] animate-pulse shadow-[0_0_8px_#4ade80]" />
              <span style={{ color: "#4ade80" }} className="text-[10px] font-black uppercase tracking-[0.2em]">Operational</span>
            </div>
          </div>
          <div style={{ background: "rgba(99,102,241,0.1)", color: "#a5b4fc", borderColor: "rgba(99,102,241,0.2)" }} className="flex items-center gap-2 rounded-xl px-4 py-2 border shadow-lg">
             <ShieldCheck className="h-4 w-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">Secure</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08)_0%,transparent_75%)] pointer-events-none" />
        <div className="relative px-4 py-6">
          {loadingMessages ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                  <Skeleton style={{ background: T.card }} className={cn("h-16 rounded-3xl border border-white/5", i % 2 === 0 ? "w-3/4" : "w-1/2")} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)" }} className="h-32 w-32 rounded-[3rem] flex items-center justify-center shadow-2xl border border-white/5">
                <ShieldCheck className="h-14 w-14 text-[#6366f1]/40" />
              </div>
              <div className="text-center px-8">
                <p style={{ color: T.text }} className="text-xl font-black uppercase tracking-widest leading-tight">Terminal Ready</p>
                <p style={{ color: T.sub }} className="text-xs font-bold mt-3 opacity-60 leading-relaxed uppercase tracking-tighter">Commanders are standing by. Describe your objective or report issues here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  currentUserId={profile?.id || ""}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  onReaction={toggleReaction}
                  onReply={() => {}}
                  senderDisplayName={
                    msg.sender_id !== profile?.id ? "Command Center" : undefined
                  }
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input — large textarea */}
      <div style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(20px)" }} className="border-t p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        <div className="flex items-end gap-3 max-w-5xl mx-auto">
          <div className="flex-1 relative group">
            <Textarea
              ref={textareaRef}
              placeholder="Transmit status report..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ background: T.input, color: T.text, borderColor: T.border }}
              className="min-h-[64px] max-h-[160px] resize-none rounded-2xl border-2 px-5 py-4 text-sm font-medium leading-relaxed focus-visible:ring-[#6366f1]/30 transition-all placeholder:opacity-30 shadow-inner"
            />
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim()}
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
            className="h-14 w-14 rounded-2xl text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 active:scale-90 disabled:opacity-30 disabled:shadow-none shrink-0 border-0"
          >
            <Send className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSupportChat;
