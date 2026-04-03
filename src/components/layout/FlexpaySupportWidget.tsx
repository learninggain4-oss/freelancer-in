import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Headphones, Wifi, GripHorizontal } from "lucide-react";
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

const BTN   = 56;
const POP_W = 340;
const POP_H = 492;
const GAP   = 10;

const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const CSS_ID = "flexpay-support-css";
function injectCSS() {
  if (document.getElementById(CSS_ID)) return;
  const s = document.createElement("style");
  s.id = CSS_ID;
  s.textContent = `
@keyframes fpOpen {
  from { opacity:0; transform:translateY(10px) scale(.96); }
  to   { opacity:1; transform:translateY(0)    scale(1); }
}
@keyframes fpPulse {
  0%,100% { transform:scale(1);   opacity:1; }
  50%      { transform:scale(1.5); opacity:.6; }
}
@keyframes fpDot {
  0%,80%,100% { transform:translateY(0); }
  40%          { transform:translateY(-5px); }
}
@keyframes fpGlow {
  0%,100% { box-shadow:var(--fp-g1); }
  50%      { box-shadow:var(--fp-g2); }
}
  `;
  document.head.appendChild(s);
}

function clamp(val: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, val));
}

function calcPopup(left: number, top: number): { left: number; top: number } {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const margin = 8;

  let pl = left + BTN - POP_W;
  let pt = top - POP_H - GAP;

  if (pt < margin) pt = top + BTN + GAP;
  if (pt + POP_H > H - margin) pt = top - POP_H - GAP;
  if (pt < margin) pt = margin;
  pl = clamp(pl, margin, W - POP_W - margin);

  return { left: pl, top: pt };
}

const FlexpaySupportWidget = ({ theme, userId, profileId }: Props) => {
  const [pos, setPos]       = useState({ left: -1, top: -1 });
  const [open, setOpen]     = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [msgs, setMsgs]     = useState<SupportMsg[]>([]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unread, setUnread]   = useState(0);
  const [popPos, setPopPos]   = useState({ left: 0, top: 0 });
  const [dragging, setDragging] = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const openRef    = useRef(open);
  const posRef     = useRef(pos);
  openRef.current  = open;
  posRef.current   = pos;

  useEffect(() => { injectCSS(); }, []);

  useEffect(() => {
    const left = window.innerWidth - BTN - 16;
    const top  = 62;
    setPos({ left, top });
  }, []);

  useEffect(() => {
    if (pos.left >= 0) setPopPos(calcPopup(pos.left, pos.top));
  }, [pos]);

  const isDark   = theme === "black";
  const accent   = isDark ? "#818cf8" : theme === "warm" ? "#d97706" : theme === "forest" ? "#16a34a" : theme === "ocean" ? "#0284c7" : "#4f46e5";
  const accentD  = isDark ? "#6366f1" : theme === "warm" ? "#b45309" : theme === "forest" ? "#15803d" : theme === "ocean" ? "#0369a1" : "#3730a3";
  const cardBg   = isDark ? "#0f172a" : "#ffffff";
  const textC    = isDark ? "#f1f5f9" : "#0f172a";
  const subC     = isDark ? "#94a3b8" : "#64748b";
  const inputBg  = isDark ? "#1e293b" : "#f8fafc";
  const borderC  = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
  const inputBdr = isDark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.12)";
  const msgBg    = isDark ? "#0b1120" : "#f8fafc";
  const glowSm   = `0 8px 28px ${accent}60`;
  const glowLg   = `0 14px 40px ${accent}90`;
  const hdr      = `linear-gradient(135deg, ${accent} 0%, ${accentD} 100%)`;

  const loadMessages = useCallback(async (cid: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("id, content, sender_id, created_at, is_read")
      .eq("conversation_id", cid)
      .order("created_at", { ascending: true });
    if (data) setMsgs(data as SupportMsg[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open || !profileId) return;
    setLoading(true);
    (async () => {
      try {
        const { data: ex } = await supabase
          .from("support_conversations").select("id").eq("user_id", profileId).maybeSingle();
        if (ex) { setConvId(ex.id); await loadMessages(ex.id); return; }
        const { data: cr } = await supabase
          .from("support_conversations").insert({ user_id: profileId }).select("id").single();
        if (cr) { setConvId(cr.id); setMsgs([]); }
      } catch { } finally { setLoading(false); }
    })();
  }, [open, profileId, loadMessages]);

  useEffect(() => {
    if (!convId) return;
    const ch = supabase.channel(`fp-${convId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const m = payload.new as SupportMsg;
          setMsgs(p => p.some(x => x.id === m.id) ? p : [...p, m]);
          if (!openRef.current && m.sender_id !== userId) setUnread(c => c + 1);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [convId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 120); }
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
        .select("id, content, sender_id, created_at, is_read").single();
      if (data) setMsgs(p => p.some(x => x.id === (data as SupportMsg).id) ? p : [...p, data as SupportMsg]);
    } catch { setInput(content); } finally { setSending(false); }
  };

  const startDrag = useCallback((
    startX: number, startY: number,
    onToggle?: () => void,
  ) => {
    const { left: sl, top: st } = posRef.current;
    let moved = false;

    const onMove = (cx: number, cy: number) => {
      const dx = cx - startX, dy = cy - startY;
      if (!moved && Math.hypot(dx, dy) > 6) moved = true;
      if (!moved) return;
      setDragging(true);
      const W = window.innerWidth, H = window.innerHeight;
      setPos({
        left: clamp(sl + dx, 0, W - BTN),
        top:  clamp(st + dy, 0, H - BTN),
      });
    };

    const onEnd = () => {
      cleanup();
      setTimeout(() => setDragging(false), 50);
      if (!moved && onToggle) onToggle();
    };

    const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const mu = () => onEnd();
    const tm = (e: TouchEvent) => { const t = e.touches[0]; onMove(t.clientX, t.clientY); };
    const te = () => onEnd();

    const cleanup = () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup",  mu);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("touchend",  te);
    };

    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup",   mu);
    window.addEventListener("touchmove", tm, { passive: true });
    window.addEventListener("touchend",  te);
  }, []);

  const handleBtnMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY, () => setOpen(o => !o));
  };
  const handleBtnTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY, () => setOpen(o => !o));
  };

  const handleHdrMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };
  const handleHdrTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  };

  if (pos.left < 0) return null;

  return (
    <>
      {open && (
        <div style={{
          position: "fixed",
          left: popPos.left,
          top:  popPos.top,
          width: POP_W,
          height: POP_H,
          borderRadius: 20,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: cardBg,
          border: `1px solid ${borderC}`,
          boxShadow: "0 24px 64px rgba(0,0,0,.22), 0 8px 24px rgba(0,0,0,.12)",
          zIndex: 10002,
          animation: "fpOpen .22s cubic-bezier(.22,1,.36,1)",
        }}>
          <div
            onMouseDown={handleHdrMouseDown}
            onTouchStart={handleHdrTouchStart}
            style={{
              background: hdr, padding: "13px 14px 11px",
              display: "flex", alignItems: "center", gap: 10,
              cursor: "grab", userSelect: "none", flexShrink: 0,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Headphones size={19} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "white", letterSpacing: "-.2px" }}>
                Flexpay Support
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", animation: "fpPulse 2s ease-in-out infinite", flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,.88)", fontWeight: 600 }}>Online · 24/7 Support</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <GripHorizontal size={14} color="rgba(255,255,255,.5)" style={{ pointerEvents: "none" }} />
              <button
                onClick={() => setOpen(false)}
                style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.22)", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", flexShrink: 0, transition: "background .15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.28)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.15)")}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div style={{
            flex: 1, overflowY: "auto", padding: "14px 13px 8px",
            display: "flex", flexDirection: "column", gap: 10,
            background: msgBg,
            backgroundImage: isDark
              ? "radial-gradient(circle,rgba(255,255,255,.025) 1px,transparent 1px)"
              : "radial-gradient(circle,rgba(0,0,0,.035) 1px,transparent 1px)",
            backgroundSize: "20px 20px",
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: hdr, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 2px 8px ${accent}50` }}>
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
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: hdr, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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

            {msgs.map(msg => {
              const out = msg.sender_id === userId;
              return (
                <div key={msg.id} style={{ display: "flex", flexDirection: out ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}>
                  {!out && (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: hdr, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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

            {!loading && msgs.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <Wifi size={28} color={subC} style={{ opacity: .35, display: "block", margin: "0 auto 8px" }} />
                <p style={{ margin: 0, fontSize: 12, color: subC, opacity: .7 }}>Start the conversation — we reply quickly!</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{
            padding: "10px 12px 14px", background: cardBg,
            borderTop: `1px solid ${borderC}`,
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a message..."
              style={{
                flex: 1, background: inputBg, border: `1px solid ${inputBdr}`,
                borderRadius: 12, padding: "9px 13px", fontSize: 13, color: textC,
                outline: "none", fontFamily: "inherit", transition: "border-color .15s",
              }}
              onFocus={e => (e.target.style.borderColor = `${accent}80`)}
              onBlur={e => (e.target.style.borderColor = inputBdr)}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending || !convId}
              style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0, border: "none",
                background: (!input.trim() || sending || !convId) ? (isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.05)") : accent,
                cursor: (!input.trim() || sending) ? "default" : "pointer",
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
        onMouseDown={handleBtnMouseDown}
        onTouchStart={handleBtnTouchStart}
        title="Flexpay Support (24/7)"
        style={{
          position: "fixed",
          left: pos.left,
          top: pos.top,
          width: BTN, height: BTN,
          borderRadius: "50%",
          background: hdr,
          border: "none",
          cursor: dragging ? "grabbing" : "grab",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: glowSm,
          zIndex: 10001,
          touchAction: "none",
          userSelect: "none",
          ["--fp-g1" as string]: glowSm,
          ["--fp-g2" as string]: glowLg,
          animation: dragging ? "none" : "fpGlow 3s ease-in-out infinite",
          transition: "box-shadow .2s",
        }}
      >
        {open
          ? <X size={20} color="white" />
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
            pointerEvents: "none",
          }}>
            {unread > 9 ? "9+" : unread}
          </div>
        )}

        {!open && (
          <div style={{
            position: "absolute", bottom: -3, right: 1,
            background: "white", borderRadius: 20, padding: "1px 5px",
            fontSize: 8, fontWeight: 800, color: accent,
            letterSpacing: .4, whiteSpace: "nowrap",
            boxShadow: "0 2px 6px rgba(0,0,0,.18)",
            pointerEvents: "none",
          }}>
            24/7
          </div>
        )}
      </button>
    </>
  );
};

export default FlexpaySupportWidget;
