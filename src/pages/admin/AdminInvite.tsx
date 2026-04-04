import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail, Users, Link2, Clock, Copy, Check, Send, RefreshCw,
  MessageCircle, Smartphone, Upload, X, UserCheck, Building2,
  CheckCircle2, XCircle, AlertCircle, QrCode, Share2, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", inputBorder:"rgba(255,255,255,.12)", tab:"rgba(255,255,255,.04)", tabActive:"rgba(99,102,241,.2)", tabActiveFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", inputBorder:"rgba(0,0,0,.12)", tab:"#f1f5f9", tabActive:"rgba(99,102,241,.12)", tabActiveFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", inputBorder:"rgba(0,0,0,.12)", tab:"#f1f5f9", tabActive:"rgba(99,102,241,.12)", tabActiveFg:"#4f46e5" },
};

const APP_URL = typeof window !== "undefined" ? window.location.origin : "https://freelancer-india.lovable.app";

async function callServer(body: object) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch("/functions/v1/admin-invite", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || "Request failed");
  return data;
}

async function callUserMgmt(body: object) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch("/functions/v1/admin-user-management", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || "Request failed");
  return data;
}

type Tab = "email" | "bulk" | "link" | "history";
type UserType = "employee" | "client";

type InviteResult = { email: string; success: boolean; error?: string };
type HistoryRow = { id: string; email: string; user_type: string; approval_status: string; created_at: string };

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "email",   label: "Email Invite",  icon: Mail },
  { id: "bulk",    label: "Bulk Invite",   icon: Users },
  { id: "link",    label: "Invite Link",   icon: Link2 },
  { id: "history", label: "History",       icon: Clock },
];

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const AdminInvite = () => {
  const { themeKey } = useDashboardTheme();
  const T = TH[themeKey];

  const [tab, setTab] = useState<Tab>("email");
  const [userType, setUserType] = useState<UserType>("employee");

  // Single email
  const [singleEmail, setSingleEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Bulk
  const [bulkText, setBulkText] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);
  const [bulkResults, setBulkResults] = useState<InviteResult[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Link
  const [linkType, setLinkType] = useState<UserType>("employee");
  const [linkCopied, setLinkCopied] = useState(false);
  const [msgCopied, setMsgCopied] = useState(false);

  // History
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 };
  const inp = { background: T.input, border: `1px solid ${T.inputBorder}`, borderRadius: 10, color: T.text, padding: "10px 14px", fontSize: 14, width: "100%", outline: "none" };

  const inviteLink = `${APP_URL}/register?type=${linkType === "employee" ? "freelancer" : "employer"}`;
  const inviteMsg = `🎉 Freelancer India-ൽ join ചെയ്യൂ — India's #1 freelance platform!\n\nRegister here: ${inviteLink}\n\nSkilled freelancers & employers connect, collaborate, and get paid. 💼`;

  // ── Single email invite
  const handleSingleInvite = async () => {
    if (!singleEmail.trim() || !singleEmail.includes("@")) { toast.error("Valid email required"); return; }
    setSendingEmail(true);
    try {
      await callUserMgmt({ action: "invite_user", email: singleEmail.trim().toLowerCase(), user_type: userType });
      toast.success(`Invitation sent to ${singleEmail}`);
      setSingleEmail("");
    } catch (e: any) { toast.error(e.message || "Failed to send invite"); }
    finally { setSendingEmail(false); }
  };

  // ── Bulk invite
  const parseBulkEmails = (text: string) =>
    text.split(/[\n,;]+/).map(e => e.trim()).filter(e => e.includes("@"));

  const handleBulkInvite = async () => {
    const emails = parseBulkEmails(bulkText);
    if (!emails.length) { toast.error("No valid emails found"); return; }
    setSendingBulk(true);
    setBulkResults([]);
    try {
      const data = await callServer({ action: "bulk_invite", emails, user_type: userType });
      setBulkResults(data.results || []);
      const ok = (data.results || []).filter((r: InviteResult) => r.success).length;
      toast.success(`${ok}/${emails.length} invitations sent`);
    } catch (e: any) { toast.error(e.message || "Bulk invite failed"); }
    finally { setSendingBulk(false); }
  };

  // ── CSV upload
  const handleCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const emails = text.split(/[\n,]+/).map(l => l.trim()).filter(l => l.includes("@"));
      setBulkText(emails.join("\n"));
      toast.success(`${emails.length} emails loaded from CSV`);
      setTab("bulk");
    };
    reader.readAsText(file);
  };

  // ── Copy helpers
  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };
  const copyMsg = () => {
    navigator.clipboard.writeText(inviteMsg);
    setMsgCopied(true);
    toast.success("Message copied!");
    setTimeout(() => setMsgCopied(false), 2000);
  };

  // ── WhatsApp & SMS share
  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteMsg)}`, "_blank");
  };
  const shareSMS = () => {
    window.open(`sms:?body=${encodeURIComponent(inviteMsg)}`, "_blank");
  };
  const shareEmail = () => {
    const subject = "Join Freelancer India — India's #1 Freelance Platform";
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(inviteMsg)}`, "_blank");
  };
  const shareNative = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Freelancer India Invite", text: inviteMsg, url: inviteLink }); }
      catch {}
    } else copyLink();
  };

  // ── History
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await callServer({ action: "history" });
      setHistory(data.invited || []);
      setHistoryLoaded(true);
    } catch (e: any) { toast.error(e.message); }
    finally { setHistoryLoading(false); }
  };

  // ── UserType selector
  const UserTypeSelector = () => (
    <div className="flex gap-2">
      {([["employee","Freelancer",UserCheck,"#6366f1"], ["client","Employer",Building2,"#f59e0b"]] as const).map(([val, label, Icon, color]) => (
        <button
          key={val}
          onClick={() => setUserType(val as UserType)}
          style={{
            padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, border: "2px solid",
            borderColor: userType === val ? color : T.border,
            background: userType === val ? `${color}18` : "transparent",
            color: userType === val ? color : T.sub,
            transition: "all .15s",
          }}
        >
          <Icon className="h-4 w-4" /> {label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
        <div className="flex items-center gap-3">
          <div style={{ background: "rgba(99,102,241,.15)", borderRadius: 12, padding: 10 }}>
            <Mail className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 style={{ color: T.text, fontWeight: 700, fontSize: 22, margin: 0 }}>Invite Users</h1>
            <p style={{ color: T.sub, fontSize: 13, margin: 0 }}>Send invitations via email, bulk, or shareable link</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}` }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); if (id === "history" && !historyLoaded) loadHistory(); }}
              style={{
                flex: 1, padding: "14px 8px", display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", outline: "none",
                borderBottom: tab === id ? "2px solid #6366f1" : "2px solid transparent",
                background: tab === id ? T.tabActive : "transparent",
                color: tab === id ? T.tabActiveFg : T.sub,
                transition: "all .15s", borderRadius: "8px 8px 0 0",
              }}
            >
              <Icon className="h-4 w-4" /> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>

          {/* ── EMAIL INVITE ── */}
          {tab === "email" && (
            <div className="space-y-5">
              <div>
                <p style={{ color: T.sub, fontSize: 13, marginBottom: 16 }}>
                  Enter an email address to send an invitation. The user will receive an email with a magic link to set up their account.
                </p>
                <label style={{ color: T.sub, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>INVITE AS</label>
                <UserTypeSelector />
              </div>

              <div>
                <label style={{ color: T.sub, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>EMAIL ADDRESS</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={singleEmail}
                    onChange={e => setSingleEmail(e.target.value)}
                    placeholder="user@example.com"
                    style={{ ...inp, flex: 1 }}
                    onKeyDown={e => e.key === "Enter" && handleSingleInvite()}
                  />
                  <Button
                    onClick={handleSingleInvite}
                    disabled={sendingEmail || !singleEmail.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5"
                  >
                    {sendingEmail ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="ml-1.5">Send</span>
                  </Button>
                </div>
              </div>

              {/* Info box */}
              <div style={{ background: "rgba(99,102,241,.08)", border: `1px solid rgba(99,102,241,.2)`, borderRadius: 10, padding: "14px 16px" }}>
                <p style={{ color: T.sub, fontSize: 13, margin: 0 }}>
                  ✉️ The user will receive a <strong style={{ color: T.text }}>secure magic link</strong> via email to set their password and complete registration automatically.
                </p>
              </div>
            </div>
          )}

          {/* ── BULK INVITE ── */}
          {tab === "bulk" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p style={{ color: T.sub, fontSize: 13, margin: 0 }}>
                    Paste multiple emails (one per line, or comma-separated), or upload a CSV file.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  style={{ borderColor: T.border, color: T.sub }}
                >
                  <Upload className="h-4 w-4 mr-1.5" /> Upload CSV
                </Button>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { if (e.target.files?.[0]) handleCSV(e.target.files[0]); }} />
              </div>

              <div>
                <label style={{ color: T.sub, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>INVITE AS</label>
                <UserTypeSelector />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label style={{ color: T.sub, fontSize: 12, fontWeight: 600 }}>EMAIL ADDRESSES</label>
                  {bulkText && (
                    <span style={{ color: T.sub, fontSize: 12 }}>
                      {parseBulkEmails(bulkText).length} valid emails
                    </span>
                  )}
                </div>
                <textarea
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  placeholder={"john@example.com\njane@example.com\nbob@example.com"}
                  rows={8}
                  style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 13 }}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleBulkInvite}
                  disabled={sendingBulk || !bulkText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {sendingBulk ? <RefreshCw className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
                  Send {parseBulkEmails(bulkText).length > 0 ? `${parseBulkEmails(bulkText).length} Invites` : "Invites"}
                </Button>
                {bulkText && (
                  <Button variant="outline" onClick={() => { setBulkText(""); setBulkResults([]); }} style={{ borderColor: T.border, color: T.sub }}>
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                )}
              </div>

              {/* Results */}
              {bulkResults.length > 0 && (
                <div style={{ background: T.tab, borderRadius: 10, padding: 16 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ color: T.text, fontWeight: 600, fontSize: 14 }}>Results</span>
                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 border text-xs">
                      {bulkResults.filter(r => r.success).length} sent
                    </Badge>
                    {bulkResults.some(r => !r.success) && (
                      <Badge variant="destructive" className="text-xs">
                        {bulkResults.filter(r => !r.success).length} failed
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {bulkResults.map((r, i) => (
                      <div key={i} className="flex items-center gap-2" style={{ fontSize: 13 }}>
                        {r.success
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                        <span style={{ color: T.text }}>{r.email}</span>
                        {r.error && <span style={{ color: "#ef4444", fontSize: 11 }}>— {r.error}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── INVITE LINK ── */}
          {tab === "link" && (
            <div className="space-y-6">
              <div>
                <label style={{ color: T.sub, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>REGISTRATION TYPE</label>
                <div className="flex gap-2">
                  {([["employee","Freelancer",UserCheck,"#6366f1"], ["client","Employer",Building2,"#f59e0b"]] as const).map(([val, label, Icon, color]) => (
                    <button
                      key={val}
                      onClick={() => setLinkType(val as UserType)}
                      style={{
                        padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6, border: "2px solid",
                        borderColor: linkType === val ? color : T.border,
                        background: linkType === val ? `${color}18` : "transparent",
                        color: linkType === val ? color : T.sub, transition: "all .15s",
                      }}
                    >
                      <Icon className="h-4 w-4" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Invite Link */}
              <div>
                <label style={{ color: T.sub, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>INVITE LINK</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ ...inp, flexGrow: 1, fontFamily: "monospace", fontSize: 12, color: T.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {inviteLink}
                  </div>
                  <Button onClick={copyLink} variant="outline" style={{ borderColor: T.border, color: T.sub, minWidth: 90 }}>
                    {linkCopied ? <><Check className="h-4 w-4 mr-1 text-emerald-500" /> Copied</> : <><Copy className="h-4 w-4 mr-1" /> Copy</>}
                  </Button>
                </div>
              </div>

              {/* Share via */}
              <div>
                <label style={{ color: T.sub, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 12 }}>SHARE VIA</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "WhatsApp", icon: MessageCircle, color: "#25d366", action: shareWhatsApp },
                    { label: "Email",    icon: Mail,          color: "#6366f1", action: shareEmail },
                    { label: "SMS",      icon: Smartphone,    color: "#3b82f6", action: shareSMS },
                    { label: "Share",    icon: Share2,        color: "#f59e0b", action: shareNative },
                  ].map(({ label, icon: Icon, color, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      style={{
                        padding: "14px 8px", borderRadius: 12, display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 6, cursor: "pointer", border: `1px solid ${T.border}`,
                        background: `${color}10`, transition: "all .15s",
                      }}
                      className="hover:scale-105"
                    >
                      <div style={{ background: `${color}20`, borderRadius: 10, padding: 8 }}>
                        <Icon className="h-5 w-5" style={{ color }} />
                      </div>
                      <span style={{ color: T.text, fontSize: 12, fontWeight: 600 }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Invite Message */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label style={{ color: T.sub, fontSize: 12, fontWeight: 600 }}>INVITE MESSAGE</label>
                  <Button size="sm" variant="ghost" onClick={copyMsg} style={{ color: T.sub, fontSize: 12 }}>
                    {msgCopied ? <><Check className="h-3 w-3 mr-1 text-emerald-500" /> Copied</> : <><Copy className="h-3 w-3 mr-1" /> Copy</>}
                  </Button>
                </div>
                <div style={{ ...inp, whiteSpace: "pre-wrap", fontSize: 13, fontFamily: "inherit", lineHeight: 1.6 }}>
                  {inviteMsg}
                </div>
              </div>

              {/* QR hint */}
              <div style={{ background: "rgba(99,102,241,.08)", border: `1px solid rgba(99,102,241,.2)`, borderRadius: 10, padding: "14px 16px" }} className="flex items-start gap-3">
                <QrCode className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <p style={{ color: T.sub, fontSize: 13, margin: 0 }}>
                  To generate a QR code, visit{" "}
                  <a href={`https://qr.io/?url=${encodeURIComponent(inviteLink)}`} target="_blank" rel="noreferrer" style={{ color: "#6366f1", textDecoration: "underline" }}>
                    qr.io
                  </a>{" "}
                  and paste your invite link to create a scannable QR code.
                </p>
              </div>
            </div>
          )}

          {/* ── HISTORY ── */}
          {tab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p style={{ color: T.sub, fontSize: 13, margin: 0 }}>
                  Users who received invitations (pending registration completion).
                </p>
                <Button size="sm" variant="ghost" onClick={loadHistory} disabled={historyLoading} style={{ color: T.sub }}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${historyLoading ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center py-12 gap-2" style={{ color: T.sub }}>
                  <RefreshCw className="h-5 w-5 animate-spin" /> Loading history…
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <AlertCircle className="h-8 w-8" style={{ color: T.sub }} />
                  <p style={{ color: T.sub, fontSize: 14 }}>No pending invitations found</p>
                </div>
              ) : (
                <div style={{ borderRadius: 10, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                  {history.map((h, i) => (
                    <div
                      key={h.id}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px", borderBottom: i < history.length - 1 ? `1px solid ${T.border}` : "none",
                        flexWrap: "wrap", gap: 8,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: h.user_type === "employee" ? "rgba(99,102,241,.15)" : "rgba(245,158,11,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {h.user_type === "employee"
                            ? <UserCheck className="h-4 w-4 text-indigo-400" />
                            : <Building2 className="h-4 w-4 text-amber-400" />}
                        </div>
                        <div>
                          <div style={{ color: T.text, fontSize: 14, fontWeight: 600 }}>{h.email}</div>
                          <div style={{ color: T.sub, fontSize: 12 }}>
                            {h.user_type === "employee" ? "Freelancer" : "Employer"} · Invited {fmt(h.created_at)}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 border text-xs">
                        Pending Registration
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminInvite;
