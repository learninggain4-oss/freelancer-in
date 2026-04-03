import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle, X, Send, Headphones, Wifi, GripHorizontal,
  Maximize2, Minimize2, ChevronRight, Paperclip, Smile,
  CheckCheck, Clock as ClockIcon,
} from "lucide-react";
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
const POP_W = 350;
const POP_H = 500;
const GAP   = 10;

const QUICK_TOPICS = [
  { icon: "🔐", label: "M-Pin / Account Access" },
  { icon: "💳", label: "Payment Issue" },
  { icon: "🔧", label: "Technical Problem" },
  { icon: "💼", label: "Freelancer Services" },
  { icon: "📋", label: "Other Query" },
];

const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function fmtDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function getDateLabel(msgs: SupportMsg[], idx: number) {
  if (idx === 0) return fmtDate(msgs[0].created_at);
  const prev = new Date(msgs[idx - 1].created_at);
  const curr = new Date(msgs[idx].created_at);
  if (prev.toDateString() !== curr.toDateString()) return fmtDate(msgs[idx].created_at);
  return null;
}

const CSS_ID = "flexpay-support-css";
function injectCSS() {
  if (document.getElementById(CSS_ID)) return;
  const s = document.createElement("style");
  s.id = CSS_ID;
  s.textContent = `
@keyframes fpOpen {
  from { opacity:0; transform:translateY(10px) scale(.96); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes fpExpand {
  from { opacity:0; transform:scale(.97); }
  to   { opacity:1; transform:scale(1); }
}
@keyframes fpPulse {
  0%,100% { transform:scale(1); opacity:1; }
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
@keyframes fpSlideUp {
  from { opacity:0; transform:translateY(8px); }
  to   { opacity:1; transform:translateY(0); }
}
.fp-msg-in  { animation: fpSlideUp .18s ease; }
.fp-msg-out { animation: fpSlideUp .18s ease; }
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
  const [pos, setPos]           = useState({ left: -1, top: -1 });
  const [open, setOpen]         = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [convId, setConvId]     = useState<string | null>(null);
  const [msgs, setMsgs]         = useState<SupportMsg[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sending, setSending]   = useState(false);
  const [unread, setUnread]     = useState(0);
  const [popPos, setPopPos]     = useState({ left: 0, top: 0 });
  const [dragging, setDragging] = useState(false);
  const [showTopics, setShowTopics] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const openRef   = useRef(open);
  const posRef    = useRef(pos);
  openRef.current = open;
  posRef.current  = pos;

  useEffect(() => { injectCSS(); }, []);

  useEffect(() => {
    const left = window.innerWidth - BTN - 16;
    const top  = 62;
    setPos({ left, top });
  }, []);

  useEffect(() => {
    if (pos.left >= 0) setPopPos(calcPopup(pos.left, pos.top));
  }, [pos]);

  /* ── Theme colours ─────────────────────────────────────────────── */
  const isDark  = theme === "black";
  const accent  = isDark ? "#818cf8" : theme === "warm" ? "#d97706" : theme === "forest" ? "#16a34a" : theme === "ocean" ? "#0284c7" : "#4f46e5";
  const accentD = isDark ? "#6366f1" : theme === "warm" ? "#b45309" : theme === "forest" ? "#15803d" : theme === "ocean" ? "#0369a1" : "#3730a3";
  const cardBg  = isDark ? "#0f172a" : "#ffffff";
  const textC   = isDark ? "#f1f5f9" : "#0f172a";
  const subC    = isDark ? "#94a3b8" : "#64748b";
  const inputBg = isDark ? "#1e293b" : "#f8fafc";
  const borderC = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
  const inputBdr= isDark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.12)";
  const msgBg   = isDark ? "#0b1120" : "#f5f7fb";
  const sideB   = isDark ? "#0d1627" : "#f0f4ff";
  const glowSm  = `0 8px 28px ${accent}60`;
  const glowLg  = `0 14px 40px ${accent}90`;
  const hdr     = `linear-gradient(135deg, ${accent} 0%, ${accentD} 100%)`;

  /* ── Data loading ──────────────────────────────────────────────── */
  const loadMessages = useCallback(async (cid: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("id, content, sender_id, created_at, is_read")
      .eq("conversation_id", cid)
      .order("created_at", { ascending: true });
    if (data) {
      setMsgs(data as SupportMsg[]);
      if ((data as SupportMsg[]).length > 0) setShowTopics(false);
    }
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
          setShowTopics(false);
          if (!openRef.current && m.sender_id !== userId) setUnread(c => c + 1);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [convId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open, expanded]);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 180); }
  }, [open, expanded]);

  // ESC to collapse expanded view
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  /* ── Send ──────────────────────────────────────────────────────── */
  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || !convId || !userId || sending) return;
    setSending(true);
    setInput("");
    setShowTopics(false);
    try {
      const { data } = await supabase
        .from("support_messages")
        .insert({ conversation_id: convId, content, sender_id: userId, is_read: false })
        .select("id, content, sender_id, created_at, is_read").single();
      if (data) setMsgs(p => p.some(x => x.id === (data as SupportMsg).id) ? p : [...p, data as SupportMsg]);
    } catch { setInput(content); } finally { setSending(false); }
  }, [input, convId, userId, sending]);

  const sendTopic = useCallback((label: string) => {
    send(label);
  }, [send]);

  /* ── Drag (floating button) ────────────────────────────────────── */
  const startDrag = useCallback((startX: number, startY: number, onToggle?: () => void) => {
    const { left: sl, top: st } = posRef.current;
    let moved = false;
    const onMove = (cx: number, cy: number) => {
      const dx = cx - startX, dy = cy - startY;
      if (!moved && Math.hypot(dx, dy) > 6) moved = true;
      if (!moved) return;
      setDragging(true);
      const W = window.innerWidth, H = window.innerHeight;
      setPos({ left: clamp(sl + dx, 0, W - BTN), top: clamp(st + dy, 0, H - BTN) });
    };
    const onEnd = () => { cleanup(); setTimeout(() => setDragging(false), 50); if (!moved && onToggle) onToggle(); };
    const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const mu = () => onEnd();
    const tm = (e: TouchEvent) => { const t = e.touches[0]; onMove(t.clientX, t.clientY); };
    const te = () => onEnd();
    const cleanup = () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("touchend", te);
    };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    window.addEventListener("touchmove", tm, { passive: true });
    window.addEventListener("touchend", te);
  }, []);

  const handleBtnMouseDown  = (e: React.MouseEvent)  => { e.preventDefault(); startDrag(e.clientX, e.clientY, () => setOpen(o => !o)); };
  const handleBtnTouchStart = (e: React.TouchEvent)  => { const t = e.touches[0]; startDrag(t.clientX, t.clientY, () => setOpen(o => !o)); };
  const handleHdrMouseDown  = (e: React.MouseEvent)  => { if ((e.target as HTMLElement).closest("button")) return; e.preventDefault(); startDrag(e.clientX, e.clientY); };
  const handleHdrTouchStart = (e: React.TouchEvent)  => { if ((e.target as HTMLElement).closest("button")) return; const t = e.touches[0]; startDrag(t.clientX, t.clientY); };

  if (pos.left < 0) return null;

  /* ── Shared: header bar ─────────────────────────────────────────── */
  const HeaderBar = ({ big }: { big?: boolean }) => (
    <div
      onMouseDown={!big ? handleHdrMouseDown : undefined}
      onTouchStart={!big ? handleHdrTouchStart : undefined}
      style={{
        background: hdr,
        padding: big ? "16px 20px 14px" : "13px 14px 11px",
        display: "flex", alignItems: "center", gap: 12,
        cursor: !big ? "grab" : "default",
        userSelect: "none", flexShrink: 0,
      }}
    >
      <div style={{
        width: big ? 48 : 40, height: big ? 48 : 40, borderRadius: "50%",
        background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0,
      }}>
        <Headphones size={big ? 22 : 19} color="white" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: big ? 16 : 14, color: "white", letterSpacing: "-.2px" }}>
          Flexpay Support
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", animation: "fpPulse 2s ease-in-out infinite", flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: big ? 12 : 11, color: "rgba(255,255,255,.88)", fontWeight: 600 }}>
            Online · 24/7 Support
          </p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {!big && <GripHorizontal size={14} color="rgba(255,255,255,.5)" style={{ pointerEvents: "none" }} />}
        <button
          onClick={() => setExpanded(v => !v)}
          title={big ? "Minimize" : "Expand to full view"}
          style={{
            background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.22)",
            borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", color: "white", flexShrink: 0,
            transition: "background .15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.28)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.15)")}
        >
          {big ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <button
          onClick={() => { setOpen(false); setExpanded(false); }}
          style={{
            background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.22)",
            borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", color: "white", flexShrink: 0,
            transition: "background .15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.28)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.15)")}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );

  /* ── Shared: message thread ─────────────────────────────────────── */
  const MessageThread = ({ big }: { big?: boolean }) => (
    <div style={{
      flex: 1, overflowY: "auto", padding: big ? "20px 24px 12px" : "14px 13px 8px",
      display: "flex", flexDirection: "column", gap: big ? 12 : 10,
      background: msgBg,
      backgroundImage: isDark
        ? "radial-gradient(circle,rgba(255,255,255,.02) 1px,transparent 1px)"
        : "radial-gradient(circle,rgba(0,0,0,.025) 1px,transparent 1px)",
      backgroundSize: "22px 22px",
    }}>
      {/* Welcome bubble */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <div style={{ width: big?34:28, height: big?34:28, borderRadius: "50%", background: hdr, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 2px 8px ${accent}50` }}>
          <Headphones size={big?15:13} color="white" />
        </div>
        <div style={{ maxWidth: "78%", background: cardBg, borderRadius: "14px 14px 14px 2px", padding: big?"12px 16px":"10px 12px", boxShadow: "0 2px 8px rgba(0,0,0,.06)", border: `1px solid ${borderC}` }}>
          <p style={{ margin: 0, fontSize: big?14:13, color: textC, lineHeight: 1.6 }}>
            👋 Hi! Welcome to <strong style={{ color: accent }}>Flexpay Support</strong>. We're here to help you 24/7. How can we assist you today?
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 10, color: subC }}>Flexpay Support · Now</p>
        </div>
      </div>

      {/* Quick topic chips — shown only when conversation is fresh */}
      {showTopics && !loading && (
        <div style={{ paddingLeft: big?42:36 }}>
          <p style={{ margin: "2px 0 8px", fontSize: 11.5, color: subC }}>Choose a topic to get started:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {QUICK_TOPICS.map(t => (
              <button key={t.label} onClick={() => sendTopic(t.label)}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                  borderRadius: 20, border: `1.5px solid ${borderC}`, background: cardBg,
                  cursor: "pointer", fontSize: 12, fontWeight: 600, color: textC,
                  fontFamily: "inherit", transition: "all .15s",
                  boxShadow: "0 1px 4px rgba(0,0,0,.06)",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=accent; e.currentTarget.style.color=accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=borderC; e.currentTarget.style.color=textC; }}
              >
                <span>{t.icon}</span> {t.label} <ChevronRight size={11} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading dots */}
      {loading && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ width: big?34:28, height: big?34:28, borderRadius: "50%", background: hdr, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Headphones size={big?15:13} color="white" />
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

      {/* Messages with date separators */}
      {msgs.map((msg, idx) => {
        const out      = msg.sender_id === userId;
        const dateLabel = getDateLabel(msgs, idx);
        return (
          <div key={msg.id}>
            {dateLabel && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 8px" }}>
                <div style={{ flex: 1, height: 1, background: borderC }} />
                <span style={{ fontSize: 11, color: subC, fontWeight: 600, whiteSpace: "nowrap" }}>{dateLabel}</span>
                <div style={{ flex: 1, height: 1, background: borderC }} />
              </div>
            )}
            <div className={out ? "fp-msg-out" : "fp-msg-in"}
              style={{ display: "flex", flexDirection: out ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}>
              {!out && (
                <div style={{ width: big?34:28, height: big?34:28, borderRadius: "50%", background: hdr, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Headphones size={big?15:13} color="white" />
                </div>
              )}
              <div style={{
                maxWidth: "76%",
                background: out ? accent : cardBg,
                borderRadius: out ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                padding: big ? "11px 15px" : "10px 12px",
                boxShadow: out ? `0 3px 12px ${accent}50` : "0 2px 8px rgba(0,0,0,.06)",
                border: out ? "none" : `1px solid ${borderC}`,
              }}>
                <p style={{ margin: 0, fontSize: big?14:13, color: out ? "white" : textC, lineHeight: 1.6, wordBreak: "break-word" }}>
                  {msg.content}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, justifyContent: out ? "flex-end" : "flex-start" }}>
                  <p style={{ margin: 0, fontSize: 10, color: out ? "rgba(255,255,255,.6)" : subC }}>
                    {fmt(msg.created_at)}
                  </p>
                  {out && (
                    <CheckCheck size={11} color={msg.is_read ? "#4ade80" : "rgba(255,255,255,.55)"} />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {!loading && msgs.length === 0 && !showTopics && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Wifi size={28} color={subC} style={{ opacity: .35, display: "block", margin: "0 auto 8px" }} />
          <p style={{ margin: 0, fontSize: 12, color: subC, opacity: .7 }}>Start the conversation — we reply quickly!</p>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );

  /* ── Shared: input area ─────────────────────────────────────────── */
  const InputArea = ({ big }: { big?: boolean }) => (
    <div style={{
      padding: big ? "14px 20px 16px" : "10px 12px 14px",
      background: cardBg,
      borderTop: `1px solid ${borderC}`,
      flexShrink: 0,
    }}>
      {big && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {QUICK_TOPICS.map(t => (
            <button key={t.label} onClick={() => sendTopic(t.label)}
              style={{
                display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                borderRadius: 16, border: `1px solid ${borderC}`, background: inputBg,
                cursor: "pointer", fontSize: 11.5, fontWeight: 600, color: subC,
                fontFamily: "inherit", transition: "all .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=accent; e.currentTarget.style.color=accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=borderC; e.currentTarget.style.color=subC; }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", alignItems: big ? "flex-end" : "center", gap: 8 }}>
        {big ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            rows={3}
            style={{
              flex: 1, background: inputBg, border: `1.5px solid ${inputBdr}`,
              borderRadius: 14, padding: "11px 14px", fontSize: 14, color: textC,
              outline: "none", fontFamily: "inherit", resize: "none",
              transition: "border-color .15s", lineHeight: 1.5,
            }}
            onFocus={e => (e.target.style.borderColor = `${accent}80`)}
            onBlur={e => (e.target.style.borderColor = inputBdr)}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
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
        )}
        {big && (
          <>
            <button title="Attach file (coming soon)" style={{ background: "none", border: "none", cursor: "pointer", color: subC, padding: "4px 2px", flexShrink: 0 }}>
              <Paperclip size={18} />
            </button>
            <button title="Emoji (coming soon)" style={{ background: "none", border: "none", cursor: "pointer", color: subC, padding: "4px 2px", flexShrink: 0 }}>
              <Smile size={18} />
            </button>
          </>
        )}
        <button
          onClick={() => send()}
          disabled={!input.trim() || sending || !convId}
          style={{
            width: big ? 48 : 40, height: big ? 48 : 40, borderRadius: big ? 14 : 12,
            flexShrink: 0, border: "none",
            background: (!input.trim() || sending || !convId)
              ? (isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.05)")
              : accent,
            cursor: (!input.trim() || sending) ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all .15s",
            boxShadow: (!input.trim() || sending) ? "none" : `0 4px 16px ${accent}60`,
          }}
        >
          {sending
            ? <ClockIcon size={big?18:16} color={subC} />
            : <Send size={big?18:16} color={(!input.trim() || sending || !convId) ? subC : "white"} />}
        </button>
      </div>
      {big && (
        <p style={{ margin: "8px 0 0", fontSize: 11, color: subC, textAlign: "right" }}>
          Press <kbd style={{ background: inputBg, border: `1px solid ${borderC}`, borderRadius: 4, padding: "1px 5px", fontSize: 10 }}>Enter</kbd> to send
          &nbsp;·&nbsp;
          <kbd style={{ background: inputBg, border: `1px solid ${borderC}`, borderRadius: 4, padding: "1px 5px", fontSize: 10 }}>Shift+Enter</kbd> for new line
          &nbsp;·&nbsp;
          <kbd style={{ background: inputBg, border: `1px solid ${borderC}`, borderRadius: 4, padding: "1px 5px", fontSize: 10 }}>Esc</kbd> to minimize
        </p>
      )}
    </div>
  );

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <>
      {/* ══ EXPANDED (fullscreen) view ═══════════════════════════════ */}
      {open && expanded && (
        <>
          {/* Backdrop */}
          <div onClick={() => setExpanded(false)} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
            backdropFilter: "blur(6px)", zIndex: 10002,
          }} />
          {/* Modal */}
          <div style={{
            position: "fixed",
            top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: "min(900px, 94vw)",
            height: "min(680px, 90dvh)",
            borderRadius: 22,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            background: cardBg,
            border: `1px solid ${borderC}`,
            boxShadow: "0 32px 80px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.15)",
            zIndex: 10003,
            animation: "fpExpand .25s cubic-bezier(.22,1,.36,1)",
          }}>
            <HeaderBar big />

            {/* Body: sidebar + thread */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
              {/* Sidebar */}
              <div style={{
                width: 220, flexShrink: 0, borderRight: `1px solid ${borderC}`,
                background: sideB, padding: "18px 14px", overflowY: "auto",
                display: "flex", flexDirection: "column", gap: 6,
              }}>
                <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, color: subC, letterSpacing: 1, textTransform: "uppercase" }}>
                  Quick Topics
                </p>
                {QUICK_TOPICS.map(t => (
                  <button key={t.label} onClick={() => sendTopic(t.label)}
                    style={{
                      width: "100%", textAlign: "left", padding: "9px 12px",
                      borderRadius: 11, border: `1px solid ${borderC}`, background: cardBg,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                      fontSize: 12.5, fontWeight: 600, color: textC, fontFamily: "inherit",
                      transition: "all .15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=accent; e.currentTarget.style.background=`${accent}12`; e.currentTarget.style.color=accent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=borderC; e.currentTarget.style.background=cardBg; e.currentTarget.style.color=textC; }}
                  >
                    <span style={{ fontSize: 16 }}>{t.icon}</span> {t.label}
                  </button>
                ))}

                <div style={{ marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${borderC}` }}>
                  <div style={{ padding: "10px 12px", borderRadius: 11, background: isDark ? "#0f2d1a" : "#f0fdf4", border: "1px solid rgba(34,197,94,.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "fpPulse 2s ease-in-out infinite" }} />
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#22c55e" }}>ONLINE NOW</p>
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: subC, lineHeight: 1.5 }}>
                      Average reply time: <strong>under 5 min</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Message thread */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <MessageThread big />
                <InputArea big />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══ SMALL popup ══════════════════════════════════════════════ */}
      {open && !expanded && (
        <div style={{
          position: "fixed",
          left: popPos.left, top: popPos.top,
          width: POP_W, height: POP_H,
          borderRadius: 20, overflow: "hidden",
          display: "flex", flexDirection: "column",
          background: cardBg, border: `1px solid ${borderC}`,
          boxShadow: "0 24px 64px rgba(0,0,0,.22), 0 8px 24px rgba(0,0,0,.12)",
          zIndex: 10002,
          animation: "fpOpen .22s cubic-bezier(.22,1,.36,1)",
        }}>
          <HeaderBar />
          <MessageThread />
          <InputArea />
        </div>
      )}

      {/* ══ Floating button ══════════════════════════════════════════ */}
      <button
        onMouseDown={handleBtnMouseDown}
        onTouchStart={handleBtnTouchStart}
        title="Flexpay Support (24/7)"
        style={{
          position: "fixed", left: pos.left, top: pos.top,
          width: BTN, height: BTN, borderRadius: "50%",
          background: hdr, border: "none",
          cursor: dragging ? "grabbing" : "grab",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: glowSm, zIndex: 10001,
          touchAction: "none", userSelect: "none",
          ["--fp-g1" as string]: glowSm,
          ["--fp-g2" as string]: glowLg,
          animation: dragging ? "none" : "fpGlow 3s ease-in-out infinite",
          transition: "box-shadow .2s",
        }}
      >
        {open ? <X size={20} color="white" /> : <MessageCircle size={22} color="white" />}

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
