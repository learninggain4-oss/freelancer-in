import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Headphones, ChevronDown, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";

interface SupportMsg {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

interface Props {
  theme: DashboardTheme;
  userId: string;
  profileId: string;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const CSS_ID = "flexpay-support-css";

function injectCSS() {
  if (document.getElementById(CSS_ID)) return;
  const s = document.createElement("style");
  s.id = CSS_ID;
  s.textContent = `
@keyframes fpWidgetOpen {
  from { opacity: 0; transform: translate(var(--fpx,0px),var(--fpy,0px)) translateY(12px) scale(.96); }
  to   { opacity: 1; transform: translate(var(--fpx,0px),var(--fpy,0px)) translateY(0)    scale(1); }
}
@keyframes fpPulse {
  0%,100% { transform: scale(1);   opacity: 1; }
  50%      { transform: scale(1.4); opacity: .7; }
}
@keyframes fpDot {
  0%,80%,100% { transform: translateY(0); }
  40%          { transform: translateY(-5px); }
}
@keyframes fpBtnPulse {
  0%,100% { box-shadow: var(--fp-glow); }
  50%      { box-shadow: var(--fp-glow-lg); }
}
  `;
  document.head.appendChild(s);
}

const FlexpaySupportWidget = ({ theme, userId, profileId }: Props) => {
  const [open, setOpen]               = useState(false);
  const [convId, setConvId]           = useState<string | null>(null);
  const [messages, setMessages]       = useState<SupportMsg[]>([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [sending, setSending]         = useState(false);
  const [unread, setUnread]           = useState(0);
  const [offset, setOffset]           = useState({ x: 0, y: 0 });

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const openRef    = useRef(open);
  openRef.current  = open;

  useEffect(() => { injectCSS(); }, []);

  const isDark   = theme === "black";
  const isWarm   = theme === "warm";
  const isForest = theme === "forest";
  const isOcean  = theme === "ocean";

  const accent = isDark ? "#818cf8" : isWarm ? "#d97706" : isForest ? "#16a34a" : isOcean ? "#0284c7" : "#4f46e5";
  const accentD = isDark ? "#6366f1" : isWarm ? "#b45309" : isForest ? "#15803d" : isOcean ? "#0369a1" : "#3730a3";

  const cardBg     = isDark ? "#0f172a" : "#ffffff";
  const msgInBg    = isDark ? "#1e293b" : "#f1f5f9";
  const textC      = isDark ? "#f1f5f9" : "#0f172a";
  const subC       = isDark ? "#94a3b8" : "#64748b";
  const inputBg    = isDark ? "#1e293b" : "#f8fafc";
  const borderC    = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
  const inputBdrC  = isDark ? "rgba(255,255,255,.1)"  : "rgba(0,0,0,.1)";

  const glowSm = `0 8px 24px ${accent}60`;
  const glowLg = `0 12px 36px ${accent}88`;

  const loadMessages = async (cid: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("id, content, sender_id, created_at, is_read")
      .eq("conversation_id", cid)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as SupportMsg[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!open || !profileId) return;
    setLoading(true);

    (async () => {
      try {
        const { data: existing } = await supabase
          .from("support_conversations")
          .select("id")
          .eq("user_id", profileId)
          .maybeSingle();

        if (existing) {
          setConvId(existing.id);
          await loadMessages(existing.id);
          return;
        }

        const { data: created } = await supabase
          .from("support_conversations")
          .insert({ user_id: profileId })
          .select("id")
          .single();

        if (created) {
          setConvId(created.id);
          setMessages([]);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [open, profileId]);

  useEffect(() => {
    if (!convId) return;
    const ch = supabase
      .channel(`fp-support-${convId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const msg = payload.new as SupportMsg;
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
          if (!openRef.current && msg.sender_id !== userId) {
            setUnread(c => c + 1);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [convId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const send = async () => {
    if (!input.trim() || !convId || !userId || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    try {
      const { data } = await supabase
        .from("support_messages")
        .insert({ conversation_id: convId, content, sender_id: userId, is_read: false })
        .select("id, content, sender_id, created_at, is_read")
        .single();
      if (data) setMessages(prev => prev.some(m => m.id === (data as SupportMsg).id) ? prev : [...prev, data as SupportMsg]);
    } catch {
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    const ox = offset.x, oy = offset.y;
    const onMove = (ev: MouseEvent) => setOffset({ x: ox + (ev.clientX - sx), y: oy + (ev.clientY - sy) });
    const onUp   = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const t0 = e.touches[0];
    const sx = t0.clientX, sy = t0.clientY;
    const ox = offset.x, oy = offset.y;
    const onMove = (ev: TouchEvent) => { const t = ev.touches[0]; setOffset({ x: ox + (t.clientX - sx), y: oy + (t.clientY - sy) }); };
    const onEnd  = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
  };

  const popStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 162,
    right: 16,
    width: 340,
    height: 490,
    borderRadius: 20,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    background: cardBg,
    border: `1px solid ${borderC}`,
    boxShadow: "0 24px 64px rgba(0,0,0,.22), 0 8px 24px rgba(0,0,0,.14)",
    zIndex: 9998,
    transform: `translate(${offset.x}px, ${offset.y}px)`,
    animation: "fpWidgetOpen .22s cubic-bezier(.22,1,.36,1)",
    willChange: "transform",
  };

  const hdrGrad = `linear-gradient(135deg, ${accent} 0%, ${accentD} 100%)`;

  return (
    <div style={{ position: "fixed", bottom: 90, right: 16, zIndex: 9999 }}>
      {open && (
        <div style={popStyle}>
          <div
            onMouseDown={handleHeaderMouseDown}
            onTouchStart={handleHeaderTouchStart}
            style={{
              background: hdrGrad,
              padding: "14px 14px 12px",
              display: "flex", alignItems: "center", gap: 10,
              cursor: "grab", userSelect: "none", flexShrink: 0,
            }}
          >
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Headphones size={20} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "white", letterSpacing: "-0.2px" }}>
                Flexpay Support
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", animation: "fpPulse 2s ease-in-out infinite", flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,.88)", fontWeight: 600 }}>
                  Online · 24/7 Support
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", flexShrink: 0, transition: "background .15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.25)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.15)")}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{
            flex: 1, overflowY: "auto", padding: "14px 13px 8px",
            display: "flex", flexDirection: "column", gap: 10,
            background: isDark ? "#0b1120" : "#f8fafc",
            backgroundImage: isDark
              ? "radial-gradient(circle, rgba(255,255,255,.025) 1px, transparent 1px)"
              : "radial-gradient(circle, rgba(0,0,0,.04) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: hdrGrad, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 2px 8px ${accent}50` }}>
                <Headphones size={13} color="white" />
              </div>
              <div style={{ maxWidth: "76%", background: cardBg, borderRadius: "14px 14px 14px 2px", padding: "10px 12px", boxShadow: "0 2px 8px rgba(0,0,0,.06)", border: `1px solid ${borderC}` }}>
                <p style={{ margin: 0, fontSize: 13, color: textC, lineHeight: 1.55 }}>
                  👋 Hi! Welcome to <strong style={{ color: accent }}>Flexpay Support</strong>. We're here to help you 24/7. How can we assist you today?
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 10, color: subC }}>Flexpay Support · Now</p>
              </div>
            </div>

            {loading && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: hdrGrad, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Headphones size={13} color="white" />
                </div>
                <div style={{ background: cardBg, borderRadius: "14px 14px 14px 2px", padding: "12px 16px", border: `1px solid ${borderC}` }}>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: accent, animation: `fpDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map(msg => {
              const out = msg.sender_id === userId;
              return (
                <div key={msg.id} style={{ display: "flex", flexDirection: out ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}>
                  {!out && (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: hdrGrad, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Headphones size={13} color="white" />
                    </div>
                  )}
                  <div style={{
                    maxWidth: "76%",
                    background: out ? accent : cardBg,
                    borderRadius: out ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    padding: "10px 12px",
                    boxShadow: out ? `0 3px 12px ${accent}50` : "0 2px 8px rgba(0,0,0,.06)",
                    border: out ? "none" : `1px solid ${borderC}`,
                  }}>
                    <p style={{ margin: 0, fontSize: 13, color: out ? "white" : textC, lineHeight: 1.55, wordBreak: "break-word" }}>
                      {msg.content}
                    </p>
                    <p style={{ margin: "3px 0 0", fontSize: 10, color: out ? "rgba(255,255,255,.6)" : subC, textAlign: out ? "right" : "left" }}>
                      {fmt(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}

            {!loading && messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <Wifi size={28} color={subC} style={{ opacity: .4, margin: "0 auto 8px" }} />
                <p style={{ margin: 0, fontSize: 12, color: subC, opacity: .7 }}>Start the conversation — we reply quickly!</p>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div style={{
            padding: "10px 12px 14px",
            background: cardBg,
            borderTop: `1px solid ${borderC}`,
            display: "flex", alignItems: "center", gap: 8,
            flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a message..."
              style={{
                flex: 1, background: inputBg, border: `1px solid ${inputBdrC}`,
                borderRadius: 12, padding: "9px 13px", fontSize: 13, color: textC,
                outline: "none", fontFamily: "inherit",
                transition: "border-color .15s",
              }}
              onFocus={e => (e.target.style.borderColor = `${accent}80`)}
              onBlur={e => (e.target.style.borderColor = inputBdrC)}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending || !convId}
              style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: (!input.trim() || sending || !convId) ? (isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.05)") : accent,
                border: "none", cursor: (!input.trim() || sending) ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .15s",
                boxShadow: (!input.trim() || sending) ? "none" : `0 4px 14px ${accent}60`,
              }}
            >
              <Send size={16} color={(!input.trim() || sending || !convId) ? subC : "white"} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => { setOpen(o => !o); if (!open) setOffset({ x: 0, y: 0 }); }}
        title="Flexpay Support (24/7)"
        style={{
          width: 56, height: 56, borderRadius: "50%",
          background: hdrGrad,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: glowSm,
          position: "relative",
          transition: "transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s",
          ["--fp-glow" as string]: glowSm,
          ["--fp-glow-lg" as string]: glowLg,
          animation: "fpBtnPulse 3s ease-in-out infinite",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = glowLg; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = glowSm; }}
      >
        {open
          ? <ChevronDown size={22} color="white" />
          : <MessageCircle size={22} color="white" />}

        {!open && unread > 0 && (
          <div style={{
            position: "absolute", top: -4, right: -4,
            width: 20, height: 20, borderRadius: "50%",
            background: "#ef4444", color: "white",
            fontSize: 11, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid white",
            animation: "fpPulse 1.5s ease-in-out infinite",
          }}>
            {unread > 9 ? "9+" : unread}
          </div>
        )}

        {!open && (
          <div style={{
            position: "absolute", bottom: -2, right: 2,
            background: "white", borderRadius: 20, padding: "2px 6px",
            fontSize: 9, fontWeight: 800, color: accent,
            letterSpacing: .3, whiteSpace: "nowrap",
            boxShadow: "0 2px 6px rgba(0,0,0,.15)",
          }}>
            24/7
          </div>
        )}
      </button>
    </div>
  );
};

export default FlexpaySupportWidget;
