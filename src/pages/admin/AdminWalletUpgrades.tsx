import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, Loader2, ArrowUpCircle, CheckCircle, XCircle, MessageSquare, Send, ArrowLeft, TrendingUp, Clock, Filter } from "lucide-react";
import { useUpgradeChat } from "@/hooks/use-upgrade-chat";
import { cn } from "@/lib/utils";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt, safeDist } from "@/lib/admin-date";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const AdminWalletUpgrades = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { theme } = useDashboardTheme();
  const tok = TH[theme];
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [rejectDialog, setRejectDialog] = useState<{ id: string; open: boolean }>({ id: "", open: false });
  const [rejectNotes, setRejectNotes] = useState("");
  const [chatRequestId, setChatRequestId] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-wallet-upgrades", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("wallet_upgrade_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      const profileIds = [...new Set((data || []).map((r: any) => r.profile_id))];
      if (profileIds.length === 0) return [];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, user_code, email").in("id", profileIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      return (data || []).map((r: any) => ({ ...r, profile: profileMap.get(r.profile_id) }));
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const req = requests.find((r: any) => r.id === requestId);
      if (!req) throw new Error("Request not found");
      const { data: walletType } = await supabase.from("wallet_types").select("id").eq("name", req.requested_wallet_type).single();
      if (walletType) await supabase.from("profiles").update({ wallet_type_id: walletType.id }).eq("id", req.profile_id);
      const { error } = await supabase.from("wallet_upgrade_requests").update({ status: "approved", reviewed_at: new Date().toISOString(), admin_notes: "Approved" }).eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Upgrade approved"); queryClient.invalidateQueries({ queryKey: ["admin-wallet-upgrades"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from("wallet_upgrade_requests").update({ status: "rejected", reviewed_at: new Date().toISOString(), admin_notes: notes || "Rejected" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Upgrade rejected"); setRejectDialog({ id: "", open: false }); setRejectNotes(""); queryClient.invalidateQueries({ queryKey: ["admin-wallet-upgrades"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const pendingCount = requests.filter((r: any) => r.status === "pending").length;
  const approvedCount = requests.filter((r: any) => r.status === "approved").length;

  const filtered = requests.filter((r: any) => {
    if (!search) return true;
    const name = r.profile?.full_name?.join(" ") || "";
    const code = r.profile?.user_code?.join("") || "";
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || code.toLowerCase().includes(q);
  });

  const statusStyle = (status: string) => {
    if (status === "pending") return { background: "rgba(251,191,36,.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,.25)" };
    if (status === "approved") return { background: "rgba(74,222,128,.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,.25)" };
    if (status === "rejected") return { background: "rgba(248,113,113,.15)", color: "#f87171", border: "1px solid rgba(248,113,113,.25)" };
    return { background: tok.badge, color: tok.badgeFg, border: `1px solid ${tok.border}` };
  };

  if (chatRequestId) {
    const chatReq = requests.find((r: any) => r.id === chatRequestId);
    return <AdminUpgradeChatPanel requestId={chatRequestId} request={chatReq} onBack={() => setChatRequestId(null)} profileId={profile?.id || ""} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: tok.bg, padding: "0 0 80px 0" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%)", padding: "28px 20px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.08)", filter: "blur(20px)" }} />
        <div style={{ position: "absolute", bottom: -20, left: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,.05)", filter: "blur(16px)" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,.2)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ color: "#fff", fontWeight: 700, fontSize: 20, margin: 0 }}>Wallet Upgrades</h1>
              <p style={{ color: "rgba(255,255,255,.75)", fontSize: 12, margin: "2px 0 0" }}>Manage tier upgrade requests</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <div style={{ background: "rgba(251,191,36,.25)", border: "1px solid rgba(251,191,36,.4)", borderRadius: 20, padding: "4px 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={12} color="#fbbf24" />
              <span style={{ color: "#fbbf24", fontSize: 12, fontWeight: 700 }}>{pendingCount} Pending</span>
            </div>
          )}
        </div>
        {/* Stat pills */}
        <div style={{ display: "flex", gap: 10, marginTop: 16, position: "relative", zIndex: 1 }}>
          {[
            { label: "Total", value: requests.length, color: "#a5b4fc" },
            { label: "Pending", value: pendingCount, color: "#fbbf24" },
            { label: "Approved", value: approvedCount, color: "#4ade80" },
          ].map((s) => (
            <div key={s.label} style={{ background: "rgba(255,255,255,.12)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "6px 14px", textAlign: "center" }}>
              <div style={{ color: s.color, fontWeight: 700, fontSize: 16 }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,.7)", fontSize: 10 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Search & Filter */}
        <div style={{ background: tok.card, border: `1px solid ${tok.border}`, backdropFilter: "blur(12px)", borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <Search size={15} color={tok.sub} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", background: tok.input, border: `1px solid ${tok.border}`, borderRadius: 10, padding: "9px 12px 9px 36px", color: tok.text, fontSize: 13, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", textTransform: "capitalize",
                  background: statusFilter === s ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : tok.input,
                  color: statusFilter === s ? "#fff" : tok.sub,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Loader2 className="animate-spin" size={28} color="#6366f1" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: tok.card, border: `1px solid ${tok.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <ArrowUpCircle size={28} color={tok.sub} />
            </div>
            <p style={{ color: tok.sub, fontSize: 14 }}>No upgrade requests found</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((req: any) => {
              const sStyle = statusStyle(req.status);
              const name = req.profile?.full_name?.join(" ") || "Unknown";
              const code = req.profile?.user_code?.join("") || "";
              return (
                <div key={req.id} style={{ background: tok.card, border: `1px solid ${tok.border}`, backdropFilter: "blur(12px)", borderRadius: 16, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <div style={{ color: tok.text, fontWeight: 700, fontSize: 14 }}>{name}</div>
                      <div style={{ color: tok.sub, fontSize: 11, marginTop: 2 }}>{code} • {req.profile?.email}</div>
                    </div>
                    <span style={{ ...sStyle, borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{req.status}</span>
                  </div>

                  {/* Tier arrow */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", background: tok.input, borderRadius: 10 }}>
                    <span style={{ color: tok.sub, fontSize: 12, padding: "2px 8px", background: tok.badge, borderRadius: 6 }}>{req.current_wallet_type}</span>
                    <ArrowUpCircle size={14} color="#6366f1" />
                    <span style={{ color: "#a5b4fc", fontSize: 12, fontWeight: 700, padding: "2px 8px", background: "rgba(99,102,241,.2)", borderRadius: 6 }}>{req.requested_wallet_type}</span>
                  </div>

                  {/* Meta */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ color: tok.sub, fontSize: 11 }}>{safeFmt(req.created_at, "dd MMM yyyy")}</span>
                    {req.admin_notes && <span style={{ color: tok.sub, fontSize: 11, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.admin_notes}</span>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setChatRequestId(req.id)}
                      style={{ flex: 1, padding: "7px 12px", borderRadius: 9, border: `1px solid ${tok.border}`, background: tok.input, color: tok.text, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                    >
                      <MessageSquare size={13} /> Chat
                    </button>
                    {req.status === "pending" && (
                      <>
                        <button
                          onClick={() => approveMutation.mutate(req.id)}
                          disabled={approveMutation.isPending}
                          style={{ flex: 1, padding: "7px 12px", borderRadius: 9, border: "1px solid rgba(74,222,128,.3)", background: "rgba(74,222,128,.1)", color: "#4ade80", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontWeight: 600 }}
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button
                          onClick={() => setRejectDialog({ id: req.id, open: true })}
                          style={{ flex: 1, padding: "7px 12px", borderRadius: 9, border: "1px solid rgba(248,113,113,.3)", background: "rgba(248,113,113,.1)", color: "#f87171", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontWeight: 600 }}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(o) => setRejectDialog({ ...rejectDialog, open: o })}>
        <DialogContent style={{ background: tok.bg, border: `1px solid ${tok.border}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: tok.text }}>Reject Upgrade Request</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (optional)..."
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            rows={3}
            style={{ background: tok.input, border: `1px solid ${tok.border}`, color: tok.text, borderRadius: 10 }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ id: "", open: false })}>Cancel</Button>
            <Button variant="destructive" onClick={() => rejectMutation.mutate({ id: rejectDialog.id, notes: rejectNotes })} disabled={rejectMutation.isPending}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AdminUpgradeChatPanel = ({
  requestId, request, onBack, profileId,
}: {
  requestId: string; request: any; onBack: () => void; profileId: string;
}) => {
  const { theme } = useDashboardTheme();
  const tok = TH[theme];
  const { messages, isLoading, sendMessage } = useUpgradeChat(requestId);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEmployeeTyping, setIsEmployeeTyping] = useState(false);
  const [employeeTypingName, setEmployeeTypingName] = useState("");
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isEmployeeTyping]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [newMessage]);

  useEffect(() => {
    const channel = supabase.channel(`upgrade-typing:${requestId}`)
      .on("broadcast", { event: "typing" }, (payload: any) => {
        const data = payload.payload;
        if (data?.userId === profileId) return;
        if (data?.isTyping) {
          setIsEmployeeTyping(true);
          setEmployeeTypingName(data?.userName || "Employee");
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsEmployeeTyping(false), 3000);
        } else {
          setIsEmployeeTyping(false);
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
  }, [requestId, profileId]);

  const broadcastAdminTyping = (typing: boolean) => {
    supabase.channel(`upgrade-typing:${requestId}`).send({ type: "broadcast", event: "typing", payload: { userId: profileId, userName: "Flexpay", isTyping: typing } });
  };

  const handleInputChange = (val: string) => { setNewMessage(val); broadcastAdminTyping(true); };

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content) return;
    try {
      await sendMessage(content);
      setNewMessage("");
      broadcastAdminTyping(false);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (e: any) { toast.error(e.message); }
  };

  const userName = request?.profile?.full_name?.join(" ") || "User";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 8rem)", background: tok.bg, borderRadius: 16, overflow: "hidden", border: `1px solid ${tok.border}` }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${tok.border}`, background: "linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.08))", backdropFilter: "blur(12px)" }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${tok.border}`, background: tok.input, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={16} color={tok.text} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: tok.text, fontWeight: 700, fontSize: 14 }}>{userName}</div>
          <div style={{ color: tok.sub, fontSize: 11 }}>{request?.current_wallet_type} → {request?.requested_wallet_type}</div>
        </div>
        {request?.status && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, ...{ pending: { background: "rgba(251,191,36,.15)", color: "#fbbf24" }, approved: { background: "rgba(74,222,128,.15)", color: "#4ade80" }, rejected: { background: "rgba(248,113,113,.15)", color: "#f87171" } }[request.status as string] || { background: tok.badge, color: tok.badgeFg } }}>
            {request.status}
          </span>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div style={{ padding: "16px" }}>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Loader2 className="animate-spin" size={24} color="#6366f1" /></div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: tok.card, border: `1px solid ${tok.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <MessageSquare size={28} color={tok.sub} />
              </div>
              <p style={{ color: tok.sub, fontSize: 13 }}>No messages yet. Start the conversation.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {messages.map((msg) => {
                const isMine = msg.sender_id === profileId;
                const isBotMsg = msg.content.startsWith("[BOT] ");
                const isSystemMsg = msg.content.startsWith("[SYSTEM] ");
                const displayContent = isBotMsg ? msg.content.slice(6) : isSystemMsg ? msg.content.slice(9) : msg.content;
                const senderLabel = isBotMsg ? "🤖 FlexPay Bot" : isMine ? "" : userName;

                if (isSystemMsg) {
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: "center" }}>
                      <div style={{ background: tok.input, borderRadius: 20, padding: "4px 16px" }}>
                        <p style={{ color: tok.sub, fontSize: 11, textAlign: "center" }}>{displayContent}</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isMine && !isBotMsg ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "75%", borderRadius: isMine && !isBotMsg ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      padding: "10px 14px",
                      background: isMine && !isBotMsg ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : isBotMsg ? "rgba(99,102,241,.1)" : tok.card,
                      border: `1px solid ${isMine && !isBotMsg ? "transparent" : tok.border}`,
                    }}>
                      {senderLabel && <p style={{ fontSize: 10, fontWeight: 700, color: "#a5b4fc", marginBottom: 4 }}>{senderLabel}</p>}
                      <p style={{ color: isMine && !isBotMsg ? "#fff" : tok.text, fontSize: 13, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>{displayContent}</p>
                      <p style={{ fontSize: 10, color: isMine && !isBotMsg ? "rgba(255,255,255,.6)" : tok.sub, marginTop: 4 }}>
                        {safeFmt(msg.created_at, "dd MMM yyyy — hh:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}

              {isEmployeeTyping && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ background: tok.card, border: `1px solid ${tok.border}`, borderRadius: "16px 16px 16px 4px", padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", gap: 3 }}>
                        {[0, 200, 400].map((d) => (
                          <span key={d} className="animate-bounce" style={{ width: 6, height: 6, borderRadius: "50%", background: tok.sub, display: "block", animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                      <span style={{ color: tok.sub, fontSize: 11 }}>{employeeTypingName} is typing...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div style={{ borderTop: `1px solid ${tok.border}`, background: tok.bg, padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          <textarea
            ref={textareaRef}
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            rows={2}
            style={{ flex: 1, minHeight: 56, maxHeight: 160, resize: "none", background: tok.input, border: `1px solid ${tok.border}`, borderRadius: 12, padding: "10px 14px", color: tok.text, fontSize: 13, fontFamily: "inherit" }}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            style={{ width: 44, height: 44, borderRadius: 12, border: "none", background: newMessage.trim() ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : tok.input, cursor: newMessage.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <Send size={18} color={newMessage.trim() ? "#fff" : tok.sub} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminWalletUpgrades;
