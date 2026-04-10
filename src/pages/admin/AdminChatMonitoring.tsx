import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare, Search, AlertTriangle, Download, Eye, X, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt } from "@/lib/admin-date";

const TH = {
  black: { card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)" },
  white: { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
  wb:    { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
};
const A1 = "#6366f1";
const PAGE_SIZE = 10;

const FLAGGED_KEYWORDS = ["scam", "fraud", "cheat", "fake", "payment outside", "upi direct", "whatsapp pay", "bypass", "threat", "abuse", "fake account", "report", "illegal", "block", "refund outside"];

const AdminChatMonitoring = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin-chat-monitor"],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("id,content,created_at,sender_id,receiver_id,is_flagged,sender:sender_id(full_name,user_code,user_type),receiver:receiver_id(full_name,user_code,user_type)")
        .order("created_at", { ascending: false })
        .limit(500);
      return (data || []).map((m: any) => ({
        ...m,
        autoFlagged: FLAGGED_KEYWORDS.some(kw => (m.content || "").toLowerCase().includes(kw)),
        flaggedKeywords: FLAGGED_KEYWORDS.filter(kw => (m.content || "").toLowerCase().includes(kw)),
      }));
    },
  });

  const filtered = messages.filter((m: any) => {
    const q = search.toLowerCase();
    const content = (m.content || "").toLowerCase();
    const senderName = (m.sender?.full_name || []).join(" ").toLowerCase();
    const mq = !q || content.includes(q) || senderName.includes(q);
    const mf = filter === "all" || (filter === "flagged" ? (m.is_flagged || m.autoFlagged) : filter === "auto" ? m.autoFlagged : !m.is_flagged && !m.autoFlagged);
    return mq && mf;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const autoFlaggedCount = messages.filter((m: any) => m.autoFlagged).length;
  const manualFlaggedCount = messages.filter((m: any) => m.is_flagged).length;

  const exportConversation = (m: any) => {
    const content = [
      `CONVERSATION EXPORT — FreeLan.space Admin`,
      `Date: ${safeFmt(m.created_at, "dd MMM yyyy HH:mm")}`,
      `From: ${(m.sender?.full_name || []).join(" ")} (${(m.sender?.user_code || []).join("")})`,
      `To: ${(m.receiver?.full_name || []).join(" ")} (${(m.receiver?.user_code || []).join("")})`,
      `---`,
      m.content,
      `---`,
      m.autoFlagged ? `⚠️ AUTO-FLAGGED Keywords: ${m.flaggedKeywords.join(", ")}` : "",
    ].filter(Boolean).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
    a.download = `Message_${m.id}_export.txt`;
    a.click();
    toast.success("Message exported");
  };

  const bs = (c: string, bg: string) => ({ background: bg, color: c, border: `1px solid ${c}33`, borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 as any });

  return (
    <div style={{ padding: "24px 16px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>Chat & Message Monitoring</h1>
        <p style={{ color: T.sub, fontSize: 13, marginTop: 4 }}>Monitor user conversations and auto-detect suspicious messages</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { l: "Total Messages", v: messages.length, c: "#6366f1" },
          { l: "Auto-Flagged", v: autoFlaggedCount, c: "#f87171" },
          { l: "Manual Flags", v: manualFlaggedCount, c: "#fbbf24" },
          { l: "Keywords Monitored", v: FLAGGED_KEYWORDS.length, c: "#10b981" },
        ].map(s => (
          <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(248,113,113,.06)", border: "1px solid rgba(248,113,113,.2)", borderRadius: 10, padding: "12px 18px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}><strong style={{ color: "#f87171" }}>🚨 Monitored Keywords:</strong></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {FLAGGED_KEYWORDS.map(kw => (
            <span key={kw} style={{ fontSize: 11, background: "rgba(248,113,113,.12)", color: "#f87171", border: "1px solid rgba(248,113,113,.3)", borderRadius: 5, padding: "2px 8px" }}>{kw}</span>
          ))}
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", flex: 1, minWidth: 180 }}>
            <Search size={13} color={T.sub} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search messages..." style={{ background: "none", border: "none", outline: "none", color: T.text, fontSize: 13, flex: 1 }} />
          </div>
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "6px 12px", fontSize: 13 }}>
            <option value="all">All Messages</option>
            <option value="flagged">All Flagged</option>
            <option value="auto">Auto-Flagged</option>
            <option value="clean">Clean</option>
          </select>
        </div>

        <div>
          {isLoading && <div style={{ padding: 32, textAlign: "center", color: T.sub }}>Loading messages...</div>}
          {!isLoading && messages.length === 0 && (
            <div style={{ padding: 48, textAlign: "center", color: T.sub }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
              <div>No messages table found or no messages yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Messages will appear here once users start chatting</div>
            </div>
          )}
          {paginated.map((m: any) => (
            <div key={m.id} style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}20`, background: m.autoFlagged ? "rgba(248,113,113,.03)" : m.is_flagged ? "rgba(251,191,36,.03)" : "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{(m.sender?.full_name || []).join(" ") || "User"}</span>
                  <span style={{ fontSize: 11, color: T.sub }}>→</span>
                  <span style={{ fontSize: 12, color: T.sub }}>{(m.receiver?.full_name || []).join(" ") || "User"}</span>
                  {m.autoFlagged && <span style={bs("#f87171", "rgba(248,113,113,.12)")}>🚨 Auto-Flagged</span>}
                  {m.is_flagged && !m.autoFlagged && <span style={bs("#fbbf24", "rgba(251,191,36,.12)")}>⚑ Flagged</span>}
                </div>
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  <button onClick={() => setSelected(m)} style={{ background: `${A1}15`, border: `1px solid ${A1}33`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: A1 }}><Eye size={12} /></button>
                  <button onClick={() => exportConversation(m)} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: T.sub }}><Download size={12} /></button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5, marginBottom: 4 }}>
                {(m.content || "").length > 120 ? (m.content || "").slice(0, 120) + "..." : m.content || "—"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {m.autoFlagged && m.flaggedKeywords.length > 0 && (
                  <div style={{ display: "flex", gap: 4 }}>
                    {m.flaggedKeywords.map((kw: string) => (
                      <span key={kw} style={{ fontSize: 10, background: "rgba(248,113,113,.12)", color: "#f87171", borderRadius: 4, padding: "1px 6px" }}>{kw}</span>
                    ))}
                  </div>
                )}
                <span style={{ fontSize: 11, color: T.sub, marginLeft: "auto" }}>{safeFmt(m.created_at, "dd MMM yyyy HH:mm")}</span>
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: T.sub }}>{filtered.length} messages</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: T.text, fontSize: 12 }}><ChevronLeft size={13} /></button>
              <span style={{ padding: "5px 10px", fontSize: 12, color: T.sub }}>{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: T.text, fontSize: 12 }}><ChevronRight size={13} /></button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: themeKey === "black" ? "#0f0f23" : "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, maxWidth: 520, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: 17, color: T.text, margin: 0 }}>Message Details</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.sub }}><X size={20} /></button>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, background: `${A1}08`, borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 2 }}>From</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{(selected.sender?.full_name || []).join(" ") || "User"}</div>
                <div style={{ fontSize: 11, color: T.sub }}>{selected.sender?.user_type}</div>
              </div>
              <div style={{ flex: 1, background: `${A1}08`, borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 2 }}>To</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{(selected.receiver?.full_name || []).join(" ") || "User"}</div>
                <div style={{ fontSize: 11, color: T.sub }}>{selected.receiver?.user_type}</div>
              </div>
            </div>
            <div style={{ background: T.input, borderRadius: 10, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Message Content</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{selected.content || "—"}</div>
            </div>
            {selected.autoFlagged && (
              <div style={{ background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#f87171", fontWeight: 700, marginBottom: 4 }}>🚨 Flagged Keywords Detected:</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {selected.flaggedKeywords.map((kw: string) => <span key={kw} style={{ fontSize: 11, background: "rgba(248,113,113,.12)", color: "#f87171", borderRadius: 4, padding: "2px 8px" }}>{kw}</span>)}
                </div>
              </div>
            )}
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 16 }}>Sent: {safeFmt(selected.created_at, "dd MMM yyyy HH:mm")}</div>
            <button onClick={() => { exportConversation(selected); setSelected(null); }} style={{ width: "100%", background: `linear-gradient(135deg,${A1},#8b5cf6)`, border: "none", borderRadius: 8, padding: "10px", cursor: "pointer", color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Download size={14} /> Export for Legal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChatMonitoring;
