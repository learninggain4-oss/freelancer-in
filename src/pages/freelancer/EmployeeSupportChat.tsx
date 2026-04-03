import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send, Smile, CheckCheck, Check, Shield, Mic } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

/* ─────────────── WhatsApp palette ─────────────── */
const getWA = (dark: boolean) => ({
  bgColor:      dark ? "#0b141a" : "#efeae2",
  bgPattern:    dark
    ? "radial-gradient(circle, rgba(255,255,255,.03) 1px, transparent 1px)"
    : "radial-gradient(circle, rgba(0,0,0,.07) 1px, transparent 1px)",
  headerBg:     dark ? "#202c33" : "#075e54",
  headerText:   "#fff",
  headerSub:    "rgba(255,255,255,.72)",
  incoming:     dark ? "#202c33" : "#fff",
  incomingText: dark ? "#e9edef" : "#111b21",
  outgoing:     dark ? "#005c4b" : "#d9fdd3",
  outgoingText: dark ? "#e9edef" : "#111b21",
  inputBg:      dark ? "#202c33" : "#fff",
  inputText:    dark ? "#d1d7db" : "#111b21",
  inputBarBg:   dark ? "#111b21" : "#f0f2f5",
  subText:      dark ? "#8696a0" : "#667781",
  tickBlue:     "#53bdeb",
  tickGrey:     dark ? "#8696a0" : "#b0bec5",
  border:       dark ? "rgba(134,150,160,.12)" : "rgba(0,0,0,.08)",
  emojiBtn:     dark ? "#8696a0" : "#54656f",
  sendBtn:      "#00a884",
  avatarBg:     dark ? "#2a3942" : "#dfe5e7",
});

const EMOJIS = ["😊","😂","❤️","👍","🙏","😭","🔥","✅","💯","😍","🤔","👏","🎉","😅","💪","🙌","😎","🤝","💬","⭐"];

const fmt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const EmployeeSupportChat = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room");
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { theme } = useDashboardTheme();
  const WA = getWA(theme === "black");

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
  } = useRealtimeMessages(chatRoom?.id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [newMessage]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (content) {
      try {
        await sendMessage(content);
        setNewMessage("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        setShowEmoji(false);
      } catch (e: any) {
        toast.error(e.message);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Loading ── */
  if (loadingRoom) {
    const isDark = theme === "black";
    return (
      <div style={{ background: WA.bgColor, display: "flex", flexDirection: "column", height: "calc(100vh - 5rem)" }}>
        <div style={{ background: WA.headerBg, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
          <Skeleton style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.25)" }} />
          <div style={{ flex: 1 }}>
            <Skeleton style={{ width: 120, height: 14, borderRadius: 8, background: "rgba(255,255,255,.25)", marginBottom: 6 }} />
            <Skeleton style={{ width: 60, height: 10, borderRadius: 8, background: "rgba(255,255,255,.18)" }} />
          </div>
        </div>
        <div style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-start" : "flex-end" }}>
              <Skeleton style={{
                width: `${i % 2 === 0 ? 65 : 45}%`, height: 52, borderRadius: 12,
                background: i % 2 === 0
                  ? (isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.07)")
                  : "rgba(0,168,132,.18)"
              }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── No room ── */
  if (!chatRoom) {
    return (
      <div style={{ background: WA.bgColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 5rem)", gap: 16, padding: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: WA.incoming, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,.2)" }}>
          <Shield size={36} style={{ color: WA.subText }} />
        </div>
        <p style={{ color: WA.incomingText, fontWeight: 700, fontSize: 17, margin: 0 }}>Support Chat Unavailable</p>
        <p style={{ color: WA.subText, fontSize: 13, textAlign: "center", margin: 0 }}>No support channel found for this project.</p>
        <button onClick={() => navigate(-1)}
          style={{ marginTop: 8, padding: "10px 28px", borderRadius: 24, border: "none", background: WA.sendBtn, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Go Back
        </button>
      </div>
    );
  }

  const myId = profile?.id || "";

  /* ─────────── Main Chat UI ─────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 5rem)", background: WA.bgColor, overflow: "hidden" }}>

      {/* ── Header ── */}
      <div style={{ background: WA.headerBg, display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,.25)" }}>
        <button onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", color: "#fff" }}>
          <ArrowLeft size={22} />
        </button>
        {/* Avatar */}
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: WA.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          <Shield size={20} style={{ color: WA.headerBg }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: WA.headerText, lineHeight: 1.2 }}>Support Team</p>
          <p style={{ margin: 0, fontSize: 12, color: WA.headerSub, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            Online
          </p>
        </div>
      </div>

      {/* ── Chat area ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 8px 8px", backgroundImage: WA.bgPattern, backgroundSize: "20px 20px" }}>
        {loadingMessages ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 4px" }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-start" : "flex-end" }}>
                <Skeleton style={{ width: `${i % 2 === 0 ? 55 : 40}%`, height: 48, borderRadius: 10, background: "rgba(128,128,128,.18)" }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          /* Empty state */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12, padding: 24 }}>
            <div style={{ background: WA.incoming, borderRadius: 16, padding: "12px 20px", maxWidth: 280, boxShadow: "0 1px 2px rgba(0,0,0,.15)", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: theme === "black" ? "rgba(0,168,132,.15)" : "rgba(7,94,84,.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <Shield size={22} style={{ color: WA.sendBtn }} />
              </div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: WA.incomingText }}>Support Chat</p>
              <p style={{ margin: "6px 0 0", fontSize: 12.5, color: WA.subText, lineHeight: 1.55 }}>
                Describe your issue and our team will assist you shortly.
              </p>
            </div>
          </div>
        ) : (
          /* Messages */
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {messages.map((msg: any) => {
              const isMe = msg.sender_id === myId;
              return (
                <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", padding: "2px 6px" }}>
                  <div style={{
                    maxWidth: "72%",
                    background: isMe ? WA.outgoing : WA.incoming,
                    color: isMe ? WA.outgoingText : WA.incomingText,
                    borderRadius: isMe ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                    padding: "8px 12px 6px",
                    boxShadow: "0 1px 2px rgba(0,0,0,.13)",
                    position: "relative",
                  }}>
                    {/* Sender name for incoming */}
                    {!isMe && (
                      <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 700, color: WA.sendBtn }}>Support Team</p>
                    )}
                    {/* Message text */}
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
                      {msg.content}
                    </p>
                    {/* Time + tick row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 3 }}>
                      <span style={{ fontSize: 11, color: WA.subText }}>
                        {fmt(msg.created_at)}
                      </span>
                      {isMe && (
                        msg.is_read
                          ? <CheckCheck size={14} style={{ color: WA.tickBlue }} />
                          : <CheckCheck size={14} style={{ color: WA.tickGrey }} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Emoji picker ── */}
      {showEmoji && (
        <div style={{ background: WA.inputBarBg, borderTop: `1px solid ${WA.border}`, padding: "10px 12px", flexShrink: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4 }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setNewMessage(m => m + e)}
                style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: 6, lineHeight: 1, textAlign: "center" }}>
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      <div style={{ background: WA.inputBarBg, padding: "8px 10px 10px", flexShrink: 0, display: "flex", alignItems: "flex-end", gap: 8 }}>
        {/* Text input pill */}
        <div style={{ flex: 1, background: WA.inputBg, borderRadius: 26, display: "flex", alignItems: "flex-end", padding: "6px 8px 6px 14px", boxShadow: "0 1px 3px rgba(0,0,0,.12)", minHeight: 44 }}>
          {/* Emoji toggle */}
          <button onClick={() => setShowEmoji(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px 4px 0", color: WA.emojiBtn, flexShrink: 0, lineHeight: 0 }}>
            <Smile size={22} />
          </button>
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={e => {
              setNewMessage(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            rows={1}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              resize: "none",
              color: WA.inputText,
              fontSize: 15,
              lineHeight: 1.5,
              padding: "2px 0",
              fontFamily: "inherit",
              maxHeight: 120,
              overflowY: "auto",
            }}
          />
          {/* Mic when empty */}
          {!newMessage && (
            <button style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0 4px 6px", color: WA.emojiBtn, flexShrink: 0, lineHeight: 0 }}>
              <Mic size={22} />
            </button>
          )}
        </div>
        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!newMessage.trim()}
          style={{
            width: 46, height: 46, borderRadius: "50%", border: "none",
            background: newMessage.trim() ? WA.sendBtn : WA.sendBtn,
            color: "#fff", cursor: newMessage.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: "0 2px 8px rgba(0,168,132,.4)",
            opacity: newMessage.trim() ? 1 : 0.7,
            transition: "opacity .15s",
          }}>
          <Send size={20} style={{ marginLeft: 2 }} />
        </button>
      </div>
    </div>
  );
};

export default EmployeeSupportChat;
