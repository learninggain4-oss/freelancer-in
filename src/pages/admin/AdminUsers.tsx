import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction, getToken } from "@/lib/supabase-functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  CheckCircle, XCircle, Eye, EyeOff, Copy, RefreshCw, Search, X,
  ChevronLeft, ChevronRight, Pencil, ShieldOff, ShieldCheck, Trash2,
  UserPlus, Users, KeyRound, Shield, Download, Calendar, ClipboardCopy,
  MessageSquare, Wallet, RotateCcw, SlidersHorizontal, NotebookPen,
  BadgeIndianRupee, SendHorizonal, Phone, MapPin, GraduationCap, Briefcase,
  LogOut, ArrowLeftRight, Mail, History, FileText, Link2, Network, Star,
  AlertTriangle, Megaphone, BarChart3, TrendingUp, Activity, Zap, Fingerprint,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import UserDetailDialog, { type FullProfile } from "@/components/admin/UserDetailDialog";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const PAGE_SIZE = 15;


const AdminUsers = () => {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<FullProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<FullProfile | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "view" | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{ type: "block" | "unblock" | "delete" | "reset_mpin"; user: FullProfile } | null>(null);
  const [actionProcessing, setActionProcessing] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteType, setInviteType] = useState<string>("employee");
  const [inviteProcessing, setInviteProcessing] = useState(false);
  const [adminEmailMap, setAdminEmailMap] = useState<Map<string, { isSuperAdmin: boolean }>>(new Map());
  const [bankVerifMap, setBankVerifMap] = useState<Map<string, string>>(new Map());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Quick Preview
  const [previewUser, setPreviewUser] = useState<FullProfile | null>(null);

  // Admin Notes
  const [notesDialogUser, setNotesDialogUser] = useState<FullProfile | null>(null);
  const [notesText, setNotesText] = useState("");
  const [notesProcessing, setNotesProcessing] = useState(false);

  // Wallet Adjustment
  const [walletDialogUser, setWalletDialogUser] = useState<FullProfile | null>(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletDir, setWalletDir] = useState<"add" | "deduct">("add");
  const [walletDesc, setWalletDesc] = useState("");
  const [walletProcessing, setWalletProcessing] = useState(false);

  // Send Notification
  const [msgDialogUser, setMsgDialogUser] = useState<FullProfile | null>(null);
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgProcessing, setMsgProcessing] = useState(false);

  // Password Reset processing per-user
  const [pwResetUserId, setPwResetUserId] = useState<string | null>(null);

  // View mode: grid cards or table
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Force Logout
  const [logoutUserId, setLogoutUserId] = useState<string | null>(null);

  // Change User Type
  const [changeTypeUser, setChangeTypeUser] = useState<FullProfile | null>(null);
  const [changeTypeTo, setChangeTypeTo] = useState<string>("");
  const [changeTypeProcessing, setChangeTypeProcessing] = useState(false);

  // Impersonation (Login as User)
  const [impersonateUserId, setImpersonateUserId] = useState<string | null>(null);

  // Advanced Filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [kycFilter, setKycFilter] = useState<string>("all");
  const [walletMin, setWalletMin] = useState<string>("");
  const [walletMax, setWalletMax] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");

  // Preview Transaction Summary
  type TxnRow = { id: string; created_at: string; type: string; amount: number; description: string | null; status: string | null };
  const [previewTxns, setPreviewTxns] = useState<TxnRow[]>([]);
  const [previewTxnsLoading, setPreviewTxnsLoading] = useState(false);

  // Send Custom Email
  const [emailDialogUser, setEmailDialogUser] = useState<FullProfile | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailProcessing, setEmailProcessing] = useState(false);

  // Referral Chain (Quick Preview)
  type ReferralPerson = { id: string; full_name: string[] | null; email: string | null; user_code: string[] | null; user_type: string | null; created_at?: string };
  type ReferralChain = { referral_code: string | null; referred_by: string | null; referrer: ReferralPerson | null; referrals: ReferralPerson[] };
  const [previewReferral, setPreviewReferral] = useState<ReferralChain | null>(null);
  const [previewReferralLoading, setPreviewReferralLoading] = useState(false);

  // Admin Audit Log
  type AuditLog = { id: string; action: string; admin_id: string; target_profile_id: string | null; target_profile_name: string | null; details: any; created_at: string; profiles?: { full_name: string[] | null; email: string | null } | null };
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTargetUser, setAuditTargetUser] = useState<FullProfile | null>(null);

  // KYC Document Viewer
  type KycDoc = { id: string; status: string; rejection_reason: string | null; created_at: string; verified_at: string | null; document_path: string | null; document_name: string | null; attempt_count: number | null; doc_url: string | null };
  const [kycDialogUser, setKycDialogUser] = useState<FullProfile | null>(null);
  const [kycDocs, setKycDocs] = useState<KycDoc[]>([]);
  const [kycLoading, setKycLoading] = useState(false);

  // Aadhaar Verification Viewer
  type AadhaarRecord = { id: string; status: string; is_cleared: boolean; rejection_reason: string | null; created_at: string; verified_at: string | null; aadhaar_number: string; name_on_aadhaar: string; dob_on_aadhaar: string; address_on_aadhaar: string; front_image_path: string | null; back_image_path: string | null; front_url: string | null; back_url: string | null };
  const [aadhaarDialogUser, setAadhaarDialogUser] = useState<FullProfile | null>(null);
  const [aadhaarRecords, setAadhaarRecords] = useState<AadhaarRecord[]>([]);
  const [aadhaarLoading, setAadhaarLoading] = useState(false);

  // User Statistics (Quick Preview)
  type UserStats = { projects_posted: number; services_listed: number; review_count: number; avg_rating: string | null; total_earned: number };
  const [previewStats, setPreviewStats] = useState<UserStats | null>(null);
  const [previewStatsLoading, setPreviewStatsLoading] = useState(false);

  // Warning System
  const [warningDialogUser, setWarningDialogUser] = useState<FullProfile | null>(null);
  const [warningLevel, setWarningLevel] = useState<string>("minor");
  const [warningReason, setWarningReason] = useState("");
  const [warningProcessing, setWarningProcessing] = useState(false);

  // Bulk Notify
  const [bulkNotifyOpen, setBulkNotifyOpen] = useState(false);
  const [bulkNotifyTitle, setBulkNotifyTitle] = useState("");
  const [bulkNotifyMsg, setBulkNotifyMsg] = useState("");
  const [bulkNotifyProcessing, setBulkNotifyProcessing] = useState(false);

  const [viewSecurityUser, setViewSecurityUser] = useState<FullProfile | null>(null);
  type SecurityData = {
    mpin: string | null;
    mpin_set: boolean;
    security_questions_done: boolean;
    answered_questions: { idx: number; question: string; answer: string | null }[];
    totp_enabled: boolean;
    totp_code: string | null;
    totp_secret: string | null;
  };
  const [securityData, setSecurityData] = useState<SecurityData | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityDenied, setSecurityDenied] = useState(false);
  const [showMpin, setShowMpin] = useState(false);
  const [showTotpSecret, setShowTotpSecret] = useState(false);
  const [totpSecsLeft, setTotpSecsLeft] = useState(30);

  const fetchProfiles = async () => {
    setLoading(true);
    const [{ data }, { data: bankData }, token] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, user_id, full_name, user_code, email, user_type, approval_status, mobile_number, whatsapp_number, gender, date_of_birth, marital_status, education_level, previous_job_details, work_experience, education_background, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, created_at, approval_notes, approved_at, is_disabled, available_balance, coin_balance, hold_balance, last_seen_at, registration_ip, registration_city, registration_country, registration_region")
        .order("created_at", { ascending: false }),
      supabase.from("bank_verifications").select("profile_id, status"),
      getToken(),
    ]);
    setProfiles((data as FullProfile[]) || []);
    // Build bank verification map
    const bvMap = new Map<string, string>();
    (bankData || []).forEach((bv: { profile_id: string; status: string }) => {
      bvMap.set(bv.profile_id, bv.status);
    });
    setBankVerifMap(bvMap);
    // Fetch admin list to detect admin / super admin users
    try {
      const res = await callEdgeFunction("admin-list", { method: "GET", token });
      const adminData = await res.json();
      const map = new Map<string, { isSuperAdmin: boolean }>();
      (adminData.admins || []).forEach((a: { email: string; is_super_admin: boolean }) => {
        if (a.email) map.set(a.email.toLowerCase(), { isSuperAdmin: a.is_super_admin });
      });
      setAdminEmailMap(map);
    } catch { /* non-critical */ }
    setLoading(false);
  };

  const getUserTypeLabel = (email: string | null | undefined, userType: string | null | undefined): string => {
    if (email) {
      const adminInfo = adminEmailMap.get(email.toLowerCase());
      if (adminInfo?.isSuperAdmin) return "Super Admin";
      if (adminInfo) return "Admin";
    }
    if (userType === "employee") return "Freelancer";
    if (userType === "client") return "Employer";
    return userType || "—";
  };

  useEffect(() => { fetchProfiles(); }, []);

  // Fetch transaction summary + referral chain + user stats whenever preview sheet opens
  useEffect(() => {
    if (!previewUser) { setPreviewTxns([]); setPreviewReferral(null); setPreviewStats(null); return; }
    // Transactions
    setPreviewTxnsLoading(true);
    supabase
      .from("transactions")
      .select("id, created_at, type, amount, description, status")
      .eq("profile_id", previewUser.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setPreviewTxns((data as any[]) || []);
        setPreviewTxnsLoading(false);
      });
    // Referral chain
    setPreviewReferralLoading(true);
    getToken().then((token) =>
      callEdgeFunction("admin-user-management", {
        body: { action: "get_referral_chain", profile_id: previewUser.id },
        token,
      }).then((res) => res.json()).then((data) => {
        if (data?.success) setPreviewReferral(data);
        setPreviewReferralLoading(false);
      }).catch(() => setPreviewReferralLoading(false))
    );
    // User stats
    setPreviewStatsLoading(true);
    getToken().then((token) =>
      callEdgeFunction("admin-user-management", {
        body: { action: "get_user_stats", profile_id: previewUser.id },
        token,
      }).then((res) => res.json()).then((data) => {
        if (data?.success) setPreviewStats(data as UserStats);
        setPreviewStatsLoading(false);
      }).catch(() => setPreviewStatsLoading(false))
    );
  }, [previewUser]);

  useEffect(() => {
    if (!viewSecurityUser) return;
    const tick = () => setTotpSecsLeft(30 - (Math.floor(Date.now() / 1000) % 30));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [viewSecurityUser]);

  const handleViewSecurity = async (user: FullProfile) => {
    setViewSecurityUser(user);
    setSecurityData(null);
    setSecurityDenied(false);
    setSecurityLoading(true);
    setShowMpin(false);
    setShowTotpSecret(false);
    try {
      const token = await getToken();
      const res = await callEdgeFunction("admin-view-security", {
        body: { profile_id: user.id },
        token,
      });
      const data = await res.json();
      if (res.status === 403) {
        setSecurityDenied(true);
      } else if (!res.ok || data?.error) {
        toast.error(data?.error || "Failed to load security data");
        setViewSecurityUser(null);
      } else {
        setSecurityData(data);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load security data");
      setViewSecurityUser(null);
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleRefreshTotp = async () => {
    if (!viewSecurityUser) return;
    setSecurityLoading(true);
    try {
      const token = await getToken();
      const res = await callEdgeFunction("admin-view-security", {
        body: { profile_id: viewSecurityUser.id },
        token,
      });
      const data = await res.json();
      if (res.ok && !data?.error) setSecurityData(data);
    } catch { /* ignore */ } finally {
      setSecurityLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedUser || !actionType || actionType === "view") return;
    setProcessing(true);
    const status = actionType === "approve" ? "approved" : "rejected";
    const { error } = await supabase
      .from("profiles")
      .update({
        approval_status: status as any,
        approval_notes: notes || null,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", selectedUser.id);

    if (error) {
      const { toast } = await import("sonner");
      toast.error("Failed to update user status");
    } else {
      const { toast } = await import("sonner");
      toast.success(`User ${status} successfully`);
      // Audit log
      logAdminAction(status === "approved" ? "approve_user" : "reject_user", selectedUser, { notes: notes || null });
      // Auto-notify user about status change
      if (selectedUser.user_id) {
        try {
          const tkn = await getToken();
          await callEdgeFunction("admin-user-management", {
            body: {
              action: "send_notification",
              target_user_id: selectedUser.user_id,
              title: status === "approved" ? "🎉 Account Approved!" : "Account Application Update",
              message: status === "approved"
                ? "Congratulations! Your account has been approved. You now have full access to all platform features."
                : `Your account application has been reviewed.${notes ? ` Reason: ${notes}` : " Please contact support for more information."}`,
            },
            token: tkn,
          });
        } catch { /* non-critical */ }
      }
      fetchProfiles();
    }
    setProcessing(false);
    handleClose();
  };

  const handleClose = () => {
    setSelectedUser(null);
    setActionType(null);
    setNotes("");
  };

  const handleForceLogout = async (u: FullProfile) => {
    if (!u.user_id) return;
    setLogoutUserId(u.id);
    try {
      const tkn = await getToken();
      const res = await callEdgeFunction("admin-user-management", {
        body: { action: "revoke_sessions", user_id: u.user_id },
        token: tkn,
      });
      const { toast } = await import("sonner");
      if (res.ok) {
        toast.success(`${u.full_name || u.email} logged out from all sessions`);
        // Notify user
        try {
          await callEdgeFunction("admin-user-management", {
            body: {
              action: "send_notification",
              target_user_id: u.user_id,
              title: "Security Alert",
              message: "You have been logged out of all active sessions by an administrator. Please log in again.",
            },
            token: tkn,
          });
        } catch { /* non-critical */ }
      } else {
        toast.error("Failed to force logout");
      }
    } catch {
      const { toast } = await import("sonner");
      toast.error("Failed to force logout");
    }
    setLogoutUserId(null);
  };

  const handleChangeType = async () => {
    if (!changeTypeUser || !changeTypeTo) return;
    setChangeTypeProcessing(true);
    const { error } = await supabase
      .from("profiles")
      .update({ user_type: changeTypeTo })
      .eq("id", changeTypeUser.id);
    const { toast } = await import("sonner");
    if (error) {
      toast.error("Failed to change user type");
    } else {
      const label = changeTypeTo === "employee" ? "Freelancer" : "Employer";
      toast.success(`User type changed to ${label}`);
      logAdminAction("change_user_type", changeTypeUser, { from: changeTypeUser.user_type, to: changeTypeTo });
      // Auto-notify user
      if (changeTypeUser.user_id) {
        try {
          const tkn = await getToken();
          await callEdgeFunction("admin-user-management", {
            body: {
              action: "send_notification",
              target_user_id: changeTypeUser.user_id,
              title: "Account Type Updated",
              message: `Your account type has been changed to ${label} by the admin team. Please refresh the app to see the changes.`,
            },
            token: tkn,
          });
        } catch { /* non-critical */ }
      }
      fetchProfiles();
      setChangeTypeUser(null);
      setChangeTypeTo("");
    }
    setChangeTypeProcessing(false);
  };

  const handleImpersonate = async (u: FullProfile) => {
    if (!u.email) return;
    setImpersonateUserId(u.id);
    // Pre-open the new tab synchronously (inside the click event) to avoid
    // browser popup blocking — then point it to the magic link once ready
    const newTab = window.open("", "_blank");
    if (newTab) newTab.document.write("<html><body style='background:#0f0f0f;color:#888;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0'><p>Generating secure login link…</p></body></html>");
    try {
      const tkn = await getToken();
      const dashPath = (u.user_type === "client") ? "employer" : "freelancer";
      const redirectTo = `https://www.freelan.space/${dashPath}/dashboard`;
      const res = await callEdgeFunction("admin-user-management", {
        body: { action: "generate_magic_link", email: u.email, redirect_to: redirectTo },
        token: tkn,
      });
      const data = await res.json();
      if (data.link) {
        if (newTab) {
          newTab.location.href = data.link;
        } else {
          // Fallback: popup was blocked — show copyable link
          window.open(data.link, "_blank", "noopener,noreferrer");
        }
        toast.success("Login link opened in new tab — logged in as this user");
      } else {
        if (newTab) newTab.close();
        toast.error(data.error || "Failed to generate login link");
      }
    } catch {
      if (newTab) newTab.close();
      toast.error("Failed to generate login link");
    }
    setImpersonateUserId(null);
  };

  const handleToggleBlock = async (user: FullProfile) => {
    setActionProcessing(true);
    const newDisabled = !(user as any).is_disabled;
    const { error } = await supabase
      .from("profiles")
      .update({ is_disabled: newDisabled, disabled_reason: newDisabled ? "Blocked by admin" : null })
      .eq("id", user.id);
    setActionProcessing(false);
    setConfirmAction(null);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(newDisabled ? "User blocked" : "User unblocked");
      logAdminAction(newDisabled ? "block_user" : "unblock_user", user, {});
      fetchProfiles();
    }
  };

  const handlePermanentDelete = async (user: FullProfile) => {
    setActionProcessing(true);
    try {
      const tkn = await getToken();
      const res = await callEdgeFunction("admin-user-management", {
        body: { action: "permanent_delete", profile_id: user.id },
        token: tkn,
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        toast.error(data?.error || "Delete failed");
      } else {
        toast.success("User permanently deleted");
        fetchProfiles();
      }
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setActionProcessing(false);
      setConfirmAction(null);
    }
  };

  const handleResetMpin = async (user: FullProfile) => {
    setActionProcessing(true);
    try {
      const token = await getToken();
      const res = await callEdgeFunction("admin-user-management", { method: "POST", body: { action: "reset_mpin", profile_id: user.id }, token });
      const data = await res.json();
      if (!res.ok || data?.error) {
        toast.error(data?.error || "Security reset failed");
      } else {
        toast.success(`Security reset done for ${user.full_name?.[0] || user.email}. They will be prompted to set up M-Pin, Security Questions, and Google Auth on next login.`);
      }
    } catch (err: any) {
      toast.error(err.message || "Security reset failed");
    } finally {
      setActionProcessing(false);
      setConfirmAction(null);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) { toast.error("Email is required"); return; }
    setInviteProcessing(true);
    try {
      const tkn = await getToken();
      const res = await callEdgeFunction("admin-user-management", {
        body: { action: "invite_user", email: inviteEmail.trim().toLowerCase(), user_type: inviteType },
        token: tkn,
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        toast.error(data?.error || "Failed to send invite");
      } else {
        toast.success(data?.message || "Invite sent successfully");
        setInviteOpen(false);
        setInviteEmail("");
        setInviteType("freelancer");
        fetchProfiles();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite");
    } finally {
      setInviteProcessing(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-warning/15 text-warning border-warning/30",
      approved: "bg-accent/15 text-accent border-accent/30",
      rejected: "bg-destructive/15 text-destructive border-destructive/30",
    };
    return <Badge variant="outline" className={map[status] || ""}>{status}</Badge>;
  };

  const kycBadge = (profileId: string) => {
    const status = bankVerifMap.get(profileId);
    if (!status) return <span style={{ color: T.sub, fontSize: 11 }}>—</span>;
    const cfg: Record<string, { cls: string; label: string }> = {
      approved: { cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "✓ KYC" },
      pending: { cls: "bg-warning/15 text-warning border-warning/30", label: "⏳ KYC" },
      rejected: { cls: "bg-destructive/15 text-destructive border-destructive/30", label: "✗ KYC" },
      submitted: { cls: "bg-blue-500/15 text-blue-400 border-blue-500/30", label: "📄 KYC" },
    };
    const c = cfg[status] || { cls: "bg-muted text-muted-foreground", label: status };
    return <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${c.cls}`}>{c.label}</Badge>;
  };

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const fmtLastSeen = (iso: string | null | undefined) => {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 2) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return fmtDate(iso);
  };

  const handleBulkApprove = async (users: FullProfile[]) => {
    const targets = users.filter((u) => selectedIds.has(u.id) && u.approval_status === "pending");
    if (targets.length === 0) { toast.error("No pending users selected"); return; }
    setBulkProcessing(true);
    const { error } = await supabase
      .from("profiles")
      .update({ approval_status: "approved" as any, approved_at: new Date().toISOString() })
      .in("id", targets.map((u) => u.id));
    setBulkProcessing(false);
    if (error) { toast.error("Bulk approve failed"); } else {
      toast.success(`${targets.length} user(s) approved`);
      setSelectedIds(new Set());
      fetchProfiles();
    }
  };

  const handleBulkReject = async (users: FullProfile[]) => {
    const targets = users.filter((u) => selectedIds.has(u.id) && u.approval_status === "pending");
    if (targets.length === 0) { toast.error("No pending users selected"); return; }
    setBulkProcessing(true);
    const { error } = await supabase
      .from("profiles")
      .update({ approval_status: "rejected" as any })
      .in("id", targets.map((u) => u.id));
    setBulkProcessing(false);
    if (error) { toast.error("Bulk reject failed"); } else {
      toast.success(`${targets.length} user(s) rejected`);
      setSelectedIds(new Set());
      fetchProfiles();
    }
  };

  const handleExportCsv = (users: FullProfile[]) => {
    const rows = [
      ["Name", "Code", "Type", "Email", "Status", "Balance (₹)", "Coins", "KYC Status", "Joined", "Last Seen"],
      ...users.map((u) => [
        u.full_name?.[0] || "",
        u.user_code?.[0] || "",
        getUserTypeLabel(u.email, u.user_type),
        u.email,
        u.approval_status,
        (u.available_balance ?? 0).toFixed(2),
        (u.coin_balance ?? 0).toString(),
        bankVerifMap.get(u.id) || "—",
        fmtDate(u.created_at),
        fmtLastSeen(u.last_seen_at),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${users.length} users`);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("User ID copied to clipboard");
  };

  const handleOpenNotes = (u: FullProfile) => {
    setNotesDialogUser(u);
    setNotesText((u as any).approval_notes || "");
  };

  const handleSaveNotes = async () => {
    if (!notesDialogUser) return;
    setNotesProcessing(true);
    try {
      const token = await getToken();
      const res = await callEdgeFunction("admin-user-management", {
        body: { action: "save_admin_notes", profile_id: notesDialogUser.id, notes: notesText },
        token,
      });
      const data = await res.json();
      if (!res.ok || data?.error) { toast.error(data?.error || "Failed to save notes"); }
      else {
        toast.success("Notes saved");
        setProfiles((prev) => prev.map((p) => p.id === notesDialogUser.id ? { ...p, approval_notes: notesText } : p));
        setNotesDialogUser(null);
      }
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setNotesProcessing(false); }
  };

  const handleWalletAdjust = async () => {
    if (!walletDialogUser) return;
    const amt = parseFloat(walletAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setWalletProcessing(true);
    try {
      const token = await getToken();
      const action = walletDir === "add" ? "admin_wallet_add" : "admin_wallet_deduct";
      const res = await callEdgeFunction("wallet-operations", {
        body: { action, target_profile_id: walletDialogUser.id, amount: amt, description: walletDesc || undefined },
        token,
      });
      const data = await res.json();
      if (!res.ok || data?.error) { toast.error(data?.error || "Wallet operation failed"); }
      else {
        toast.success(`₹${amt.toLocaleString("en-IN")} ${walletDir === "add" ? "added to" : "deducted from"} wallet`);
        setProfiles((prev) => prev.map((p) => p.id === walletDialogUser.id ? { ...p, available_balance: data.new_balance ?? p.available_balance } : p));
        setWalletDialogUser(null);
        setWalletAmount("");
        setWalletDesc("");
      }
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setWalletProcessing(false); }
  };

  // ── Send Custom Email ────────────────────────────────────────────────────
  const handleSendEmail = async () => {
    if (!emailDialogUser) return;
    if (!emailSubject.trim() || !emailBody.trim()) { toast.error("Subject and message are required"); return; }
    if (!emailDialogUser.user_id) { toast.error("User has no auth account"); return; }
    setEmailProcessing(true);
    try {
      const token = await getToken();
      const res = await callEdgeFunction("admin-user-management", {
        body: { action: "send_email", target_user_id: emailDialogUser.user_id, target_profile_id: emailDialogUser.id, subject: emailSubject, message: emailBody },
        token,
      });
      const data = await res.json();
      if (!res.ok || data?.error) { toast.error(data?.error || "Failed to send email"); }
      else {
        toast.success(data.via === "smtp" ? "Email sent successfully via SMTP" : "Message sent via in-app notification");
        setEmailDialogUser(null);
        setEmailSubject("");
        setEmailBody("");
      }
    } catch (e: any) { toast.error(e.message || "Failed to send"); }
    finally { setEmailProcessing(false); }
  };

  // ── Admin Audit Log ──────────────────────────────────────────────────────
  const handleOpenAuditLog = async (u?: FullProfile | null) => {
    setAuditTargetUser(u || null);
    setAuditLogOpen(true);
    setAuditLoading(true);
    setAuditLogs([]);
    try {
      const token = await getToken();
      const res = await callEdgeFunction("admin-user-management", {
        body: { action: "get_audit_log", ...(u ? { target_profile_id: u.id } : {}) },
        token,
      });
      const data = await res.json();
      if (!res.ok || data?.error) { toast.error(data?.error || "Failed to load audit log"); }
      else { setAuditLogs(data.logs || []); }
    } catch (e: any) { toast.error(e.message || "Failed to load audit log"); }
    finally { setAuditLoading(false); }
  };

  // ── Profile Completion % ─────────────────────────────────────────────────
  const calcProfileCompletion = (p: FullProfile): number => {
    const fields = [
      p.full_name?.[0], p.email, p.mobile_number, p.date_of_birth,
      p.gender, p.education_level, p.work_experience, p.previous_job_details,
      p.education_background, p.emergency_contact_name,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  // ── Issue Warning ────────────────────────────────────────────────────────
  const handleIssueWarning = async () => {
    if (!warningDialogUser || !warningReason.trim()) return;
    setWarningProcessing(true);
    try {
      const token = await getToken();
      const res = await callEdgeFunction("admin-user-management", {
        body: { action: "issue_warning", target_profile_id: warningDialogUser.id, target_user_id: warningDialogUser.user_id, warning_level: warningLevel, reason: warningReason.trim() },
        token,
      });
      const data = await res.json();
      if (!res.ok || data?.error) { toast.error(data?.error || "Failed to issue warning"); }
      else { toast.success(data.message || "Warning issued"); setWarningDialogUser(null); setWarningReason(""); setWarningLevel("minor"); }
    } catch (e: any) { toast.error(e.message || "Failed to issue warning"); }
    finally { setWarningProcessing(false); }
  };

  // ── Bulk Notify ──────────────────────────────────────────────────────────
  const handleBulkNotify = async () => {
    if (!bulkNotifyTitle.trim() || !bulkNotifyMsg.trim()) return;
    const targetUserIds = filtered.map((p) => p.user_id).filter(Boolean) as string[];
    if (targetUserIds.length === 0) { toast.error("No users with accounts in current filter"); return; }
    if (targetUserIds.length > 500) { toast.error("Too many users (max 500). Narrow your filter."); return; }
    setBulkNotifyProcessing(true);
    try {
      const token = await getToken();
      const res = await callEdgeFunction("admin-user-management", {
        body: { action: "bulk_notify", target_user_ids: targetUserIds, title: bulkNotifyTitle.trim(), message: bulkNotifyMsg.trim() },
        token,
      });
      const data = await res.json();
      if (!res.ok || data?.error) { toast.error(data?.error || "Failed to send"); }
      else { toast.success(`Notification sent to ${data.sent} users`); setBulkNotifyOpen(false); setBulkNotifyTitle(""); setBulkNotifyMsg(""); }
    } catch (e: any) { toast.error(e.message || "Failed to send"); }
    finally { setBulkNotifyProcessing(false); }
  };

  const logAdminAction = async (auditAction: string, targetUser: FullProfile, details?: Record<string, unknown>) => {
    try {
      const token = await getToken();
      await callEdgeFunction("admin-user-management", {
        body: { action: "log_audit", audit_action: auditAction, target_profile_id: targetUser.id, target_profile_name: targetUser.full_name?.[0] || targetUser.email || null, details: details || null },
        token,
      });
    } catch { /* non-critical */ }
  };

  // ── KYC Document Viewer ───────────────────────────────────────────────────
  const handleOpenKycDocs = async (u: FullProfile) => {
    setKycDialogUser(u);
    setKycLoading(true);
    setKycDocs([]);
    try {
      const token = await getToken();
      const res = await callEdgeFunction("admin-user-management", {
        body: { action: "get_kyc_docs", profile_id: u.id },
        token,
      });
      const data = await res.json();
      if (!res.ok || data?.error) { toast.error(data?.error || "Failed to load KYC docs"); }
      else { setKycDocs(data.docs || []); }
    } catch (e: any) { toast.error(e.message || "Failed to load KYC docs"); }
    finally { setKycLoading(false); }
  };

  // ── Aadhaar Verification Viewer ──────────────────────────────────────────
  const handleOpenAadhaarDocs = async (u: FullProfile) => {
    setAadhaarDialogUser(u);
    setAadhaarLoading(true);
    setAadhaarRecords([]);
    try {
      const token = await getToken();
      const res = await callEdgeFunction("admin-user-management", {
        body: { action: "get_aadhaar_docs", profile_id: u.id },
        token,
      });
      const data = await res.json();
      if (!res.ok || data?.error) { toast.error(data?.error || "Failed to load Aadhaar records"); }
      else { setAadhaarRecords(data.records || []); }
    } catch (e: any) { toast.error(e.message || "Failed to load Aadhaar records"); }
    finally { setAadhaarLoading(false); }
  };

  const handlePasswordReset = async (u: FullProfile) => {
    if (!u.email) { toast.error("User has no email"); return; }
    setPwResetUserId(u.id);
    try {
      const token = await getToken();
      const res = await callEdgeFunction("admin-user-management", {
        body: { action: "send_password_reset", email: u.email },
        token,
      });
      const data = await res.json();
      if (!res.ok || data?.error) { toast.error(data?.error || "Failed to send reset email"); }
      else { toast.success(`Password reset email sent to ${u.email}`); }
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setPwResetUserId(null); }
  };

  const handleSendNotification = async () => {
    if (!msgDialogUser) return;
    if (!msgTitle.trim() || !msgBody.trim()) { toast.error("Title and message are required"); return; }
    setMsgProcessing(true);
    try {
      const token = await getToken();
      const res = await callEdgeFunction("admin-user-management", {
        body: { action: "send_notification", target_user_id: msgDialogUser.user_id, title: msgTitle, message: msgBody },
        token,
      });
      const data = await res.json();
      if (!res.ok || data?.error) { toast.error(data?.error || "Failed to send notification"); }
      else {
        toast.success("Notification sent successfully");
        setMsgDialogUser(null);
        setMsgTitle("");
        setMsgBody("");
      }
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setMsgProcessing(false); }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return profiles.filter((p) => {
      if (typeFilter !== "all" && p.user_type !== typeFilter) return false;
      if (dateFrom) {
        const joined = new Date(p.created_at);
        if (joined < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const joined = new Date(p.created_at);
        const toDate = new Date(dateTo);
        toDate.setDate(toDate.getDate() + 1);
        if (joined > toDate) return false;
      }
      // Advanced: KYC filter
      if (kycFilter !== "all") {
        const kycStatus = bankVerifMap.get(p.id) || "not_submitted";
        if (kycFilter === "not_submitted" ? kycStatus !== "not_submitted" && kycStatus !== undefined : kycStatus !== kycFilter) {
          if (kycFilter === "not_submitted" && (kycStatus === "approved" || kycStatus === "pending")) return false;
          if (kycFilter !== "not_submitted" && kycStatus !== kycFilter) return false;
        }
      }
      // Advanced: wallet range
      if (walletMin !== "" && (p.available_balance ?? 0) < parseFloat(walletMin)) return false;
      if (walletMax !== "" && (p.available_balance ?? 0) > parseFloat(walletMax)) return false;
      // Advanced: city
      if (cityFilter.trim()) {
        const city = ((p as any).registration_city || "").toLowerCase();
        const country = ((p as any).registration_country || "").toLowerCase();
        const region = ((p as any).registration_region || "").toLowerCase();
        const cf = cityFilter.toLowerCase().trim();
        if (!city.includes(cf) && !country.includes(cf) && !region.includes(cf)) return false;
      }
      if (!q) return true;
      const name = (p.full_name?.[0] || "").toLowerCase();
      const code = (p.user_code?.[0] || "").toLowerCase();
      const email = (p.email || "").toLowerCase();
      const ip = ((p as any).registration_ip || "").toLowerCase();
      return name.includes(q) || code.includes(q) || email.includes(q) || ip.includes(q);
    });
  }, [profiles, searchQuery, typeFilter, dateFrom, dateTo, kycFilter, walletMin, walletMax, cityFilter, bankVerifMap]);

  const filterByStatus = (status: string | null) =>
    status ? filtered.filter((p) => p.approval_status === status) : filtered;

  const hasAdvancedFilters = kycFilter !== "all" || walletMin !== "" || walletMax !== "" || cityFilter !== "";

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, typeFilter, dateFrom, dateTo, kycFilter, walletMin, walletMax, cityFilter]);

  // Avatar initials + color
  const avatarColor = (name: string) => {
    const colors = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
    return colors[Math.abs(h) % colors.length];
  };

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  const UserTable = ({ users }: { users: FullProfile[] }) => {
    const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
    const page = Math.min(currentPage, totalPages);
    const paginated = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const pageIds = paginated.map((u) => u.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    const anySelected = users.some((u) => selectedIds.has(u.id));
    const selectedCount = users.filter((u) => selectedIds.has(u.id)).length;

    const toggleAll = () => {
      if (allPageSelected) {
        setSelectedIds((prev) => { const n = new Set(prev); pageIds.forEach((id) => n.delete(id)); return n; });
      } else {
        setSelectedIds((prev) => { const n = new Set(prev); pageIds.forEach((id) => n.add(id)); return n; });
      }
    };

    const toggleOne = (id: string) => {
      setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    };

    if (loading) return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <RefreshCw className="h-8 w-8 animate-spin" style={{ color: "#6366f1" }} />
        <p className="text-sm" style={{ color: T.sub }}>Loading users…</p>
      </div>
    );

    if (users.length === 0) return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl border"
           style={{ background: T.card, borderColor: T.border }}>
        <div className="p-4 rounded-2xl" style={{ background: T.nav }}>
          <Users className="h-8 w-8" style={{ color: T.sub }} />
        </div>
        <p className="font-semibold" style={{ color: T.text }}>No users found</p>
        <p className="text-sm" style={{ color: T.sub }}>Try adjusting your filters</p>
      </div>
    );

    return (
      <div className="space-y-3">
        {/* Bulk Action Bar */}
        {anySelected && (
          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl border backdrop-blur-md animate-in slide-in-from-top-2 duration-200"
               style={{ background: "rgba(99,102,241,.12)", borderColor: "rgba(99,102,241,.35)" }}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                   style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                {selectedCount}
              </div>
              <span className="text-sm font-medium" style={{ color: T.text }}>users selected</span>
            </div>
            <div className="h-4 w-px mx-1" style={{ background: T.border }} />
            <Button size="sm" className="h-8 gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm"
              disabled={bulkProcessing} onClick={() => handleBulkApprove(users)}>
              <CheckCircle className="h-3.5 w-3.5" />
              Bulk Approve
            </Button>
            <Button size="sm" variant="destructive" className="h-8 gap-1.5 rounded-lg shadow-sm"
              disabled={bulkProcessing} onClick={() => handleBulkReject(users)}>
              <XCircle className="h-3.5 w-3.5" />
              Bulk Reject
            </Button>
            <Button size="sm" variant="ghost" className="h-8 ml-auto rounded-lg text-xs" style={{ color: T.sub }}
              onClick={() => setSelectedIds(new Set())}>
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: T.border, background: T.nav }}>
                  <TableHead className="w-12 pl-4">
                    <Checkbox checked={allPageSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                  </TableHead>
                  <TableHead className="min-w-[200px]" style={{ color: T.sub, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>User</TableHead>
                  <TableHead style={{ color: T.sub, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Code</TableHead>
                  <TableHead style={{ color: T.sub, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Role</TableHead>
                  <TableHead style={{ color: T.sub, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Status</TableHead>
                  <TableHead style={{ color: T.sub, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Wallet</TableHead>
                  <TableHead style={{ color: T.sub, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Joined</TableHead>
                  <TableHead style={{ color: T.sub, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Last Seen</TableHead>
                  <TableHead className="text-right pr-4" style={{ color: T.sub, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((u, idx) => {
                  const name = u.full_name?.[0] || u.email || "?";
                  const isAdmin = !!adminEmailMap.get(u.email?.toLowerCase() ?? "");
                  const isSA = adminEmailMap.get(u.email?.toLowerCase() ?? "")?.isSuperAdmin;
                  const label = getUserTypeLabel(u.email, u.user_type);
                  const color = avatarColor(name);
                  const initials = getInitials(name);
                  const kyvStatus = bankVerifMap.get(u.id);
                  const isOnline = u.last_seen_at && (Date.now() - new Date(u.last_seen_at).getTime()) < 5 * 60 * 1000;

                  return (
                    <TableRow
                      key={u.id}
                      style={{
                        borderColor: T.border,
                        background: selectedIds.has(u.id) ? "rgba(99,102,241,.06)" : "transparent",
                      }}
                      className="transition-colors hover:bg-white/[0.03]"
                    >
                      {/* Checkbox */}
                      <TableCell className="pl-4 w-12">
                        {!isAdmin ? (
                          <Checkbox checked={selectedIds.has(u.id)} onCheckedChange={() => toggleOne(u.id)} aria-label="Select" />
                        ) : <span />}
                      </TableCell>

                      {/* User */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                                 style={{ background: color }}>
                              {initials}
                            </div>
                            {isOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 bg-emerald-400"
                                    style={{ borderColor: T.card }} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate max-w-[160px]" style={{ color: T.text }}>{name}</p>
                            <p className="text-xs truncate max-w-[160px]" style={{ color: T.sub }}>{u.email}</p>
                            {(() => {
                              const pct = calcProfileCompletion(u);
                              const clr = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
                              return (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: T.border }}>
                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: clr }} />
                                  </div>
                                  <span className="text-[10px]" style={{ color: clr }}>{pct}%</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </TableCell>

                      {/* Code */}
                      <TableCell>
                        <span className="font-mono text-xs px-2 py-1 rounded-md" style={{ background: T.nav, color: T.sub }}>
                          {u.user_code?.[0] || "—"}
                        </span>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        {(() => {
                          const roleMap: Record<string, { bg: string; color: string; border: string }> = {
                            "Super Admin": { bg: "rgba(245,158,11,.12)", color: "#f59e0b", border: "rgba(245,158,11,.3)" },
                            "Admin": { bg: "rgba(99,102,241,.12)", color: "#a5b4fc", border: "rgba(99,102,241,.3)" },
                            "Freelancer": { bg: "rgba(16,185,129,.1)", color: "#34d399", border: "rgba(16,185,129,.25)" },
                            "Employer": { bg: "rgba(59,130,246,.1)", color: "#60a5fa", border: "rgba(59,130,246,.25)" },
                          };
                          const r = roleMap[label] || { bg: T.nav, color: T.sub, border: T.border };
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                                  style={{ background: r.bg, color: r.color, borderColor: r.border }}>
                              {isSA ? "⭐" : label === "Admin" ? "🔒" : label === "Freelancer" ? "💼" : "🏢"} {label}
                            </span>
                          );
                        })()}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          {/* Approval */}
                          {(() => {
                            const s = u.approval_status;
                            const cfg: Record<string, { dot: string; label: string; cls: string }> = {
                              approved: { dot: "#10b981", label: "Approved", cls: "text-emerald-400" },
                              pending:  { dot: "#f59e0b", label: "Pending",  cls: "text-amber-400" },
                              rejected: { dot: "#ef4444", label: "Rejected", cls: "text-red-400" },
                            };
                            const c = cfg[s] || { dot: "#94a3b8", label: s, cls: "text-slate-400" };
                            return (
                              <span className="flex items-center gap-1.5 text-xs font-medium">
                                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
                                <span className={c.cls}>{c.label}</span>
                              </span>
                            );
                          })()}
                          {/* KYC */}
                          {kyvStatus && (() => {
                            const kCfg: Record<string, { dot: string; label: string; cls: string }> = {
                              approved: { dot: "#10b981", label: "KYC ✓", cls: "text-emerald-400" },
                              pending:  { dot: "#f59e0b", label: "KYC Pending", cls: "text-amber-400" },
                              submitted:{ dot: "#3b82f6", label: "KYC Submitted", cls: "text-blue-400" },
                              rejected: { dot: "#ef4444", label: "KYC ✗", cls: "text-red-400" },
                            };
                            const k = kCfg[kyvStatus] || { dot: "#94a3b8", label: `KYC ${kyvStatus}`, cls: "text-slate-400" };
                            return (
                              <span className="flex items-center gap-1.5 text-xs font-medium">
                                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: k.dot }} />
                                <span className={k.cls}>{k.label}</span>
                              </span>
                            );
                          })()}
                          {/* Blocked */}
                          {u.is_disabled && (
                            <span className="flex items-center gap-1.5 text-xs font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                              <span className="text-red-400">Blocked</span>
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Wallet */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold tabular-nums" style={{ color: T.text }}>
                            ₹{(u.available_balance ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </p>
                          {(u.coin_balance ?? 0) > 0 && (
                            <p className="text-xs" style={{ color: T.sub }}>🪙 {u.coin_balance} coins</p>
                          )}
                          {(u.hold_balance ?? 0) > 0 && (
                            <p className="text-xs" style={{ color: T.sub }}>🔒 ₹{u.hold_balance} hold</p>
                          )}
                        </div>
                      </TableCell>

                      {/* Joined */}
                      <TableCell>
                        <p className="text-sm whitespace-nowrap" style={{ color: T.text }}>{fmtDate(u.created_at)}</p>
                      </TableCell>

                      {/* Last Seen */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {isOnline && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />}
                          <p className="text-sm whitespace-nowrap" style={{ color: isOnline ? "#34d399" : T.sub }}>
                            {fmtLastSeen(u.last_seen_at)}
                          </p>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-4">
                        {isAdmin ? (
                          <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ color: isSA ? "#f59e0b" : "#a5b4fc", background: isSA ? "rgba(245,158,11,.1)" : "rgba(99,102,241,.1)" }}>
                            {isSA ? "⭐ Protected" : "🔒 Admin"}
                          </span>
                        ) : (
                          <div className="flex justify-end items-center gap-0.5 flex-wrap">
                            {/* Copy User ID */}
                            <Button size="icon" variant="ghost" title="Copy User ID"
                              className="h-8 w-8 rounded-lg hover:bg-white/10"
                              style={{ color: T.sub }}
                              onClick={() => handleCopyId(u.id)}>
                              <ClipboardCopy className="h-3.5 w-3.5" />
                            </Button>
                            {/* Quick Preview */}
                            <Button size="icon" variant="ghost" title="Quick preview"
                              className="h-8 w-8 rounded-lg hover:bg-indigo-500/10 text-indigo-400"
                              onClick={() => setPreviewUser(u)}>
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                            </Button>
                            {/* Admin Notes */}
                            <Button size="icon" variant="ghost" title="Admin notes"
                              className="h-8 w-8 rounded-lg hover:bg-amber-500/10"
                              style={{ color: (u as any).approval_notes ? "#f59e0b" : T.sub }}
                              onClick={() => handleOpenNotes(u)}>
                              <NotebookPen className="h-3.5 w-3.5" />
                            </Button>
                            {/* Wallet Adjustment */}
                            <Button size="icon" variant="ghost" title="Wallet adjustment"
                              className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 text-emerald-400"
                              onClick={() => { setWalletDialogUser(u); setWalletAmount(""); setWalletDir("add"); setWalletDesc(""); }}>
                              <BadgeIndianRupee className="h-3.5 w-3.5" />
                            </Button>
                            {/* Send Notification */}
                            <Button size="icon" variant="ghost" title="Send notification"
                              className="h-8 w-8 rounded-lg hover:bg-blue-500/10 text-blue-400"
                              onClick={() => { setMsgDialogUser(u); setMsgTitle(""); setMsgBody(""); }}>
                              <MessageSquare className="h-3.5 w-3.5" />
                            </Button>
                            {/* Force Password Reset */}
                            <Button size="icon" variant="ghost" title="Send password reset email"
                              className="h-8 w-8 rounded-lg hover:bg-orange-500/10 text-orange-400"
                              disabled={pwResetUserId === u.id}
                              onClick={() => handlePasswordReset(u)}>
                              {pwResetUserId === u.id
                                ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                : <RotateCcw className="h-3.5 w-3.5" />}
                            </Button>
                            <Button size="icon" variant="ghost" title="Edit profile"
                              className="h-8 w-8 rounded-lg hover:bg-white/10"
                              style={{ color: T.sub }}
                              onClick={() => navigate(`/admin/users/${u.id}`)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" title="View full details"
                              className="h-8 w-8 rounded-lg hover:bg-white/10"
                              style={{ color: T.sub }}
                              onClick={() => { setSelectedUser(u); setActionType("view"); }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {u.approval_status === "pending" && (<>
                              <Button size="icon" variant="ghost" title="Approve"
                                className="h-8 w-8 rounded-lg text-emerald-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                                onClick={() => { setSelectedUser(u); setActionType("approve"); }}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" title="Reject"
                                className="h-8 w-8 rounded-lg text-red-400 hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => { setSelectedUser(u); setActionType("reject"); }}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>)}
                            <Button size="icon" variant="ghost"
                              title={u.is_disabled ? "Unblock user" : "Block user"}
                              className={`h-8 w-8 rounded-lg ${u.is_disabled ? "text-emerald-400 hover:bg-emerald-500/10" : "text-amber-400 hover:bg-amber-500/10"}`}
                              onClick={() => setConfirmAction({ type: u.is_disabled ? "unblock" : "block", user: u })}>
                              {u.is_disabled ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                            </Button>
                            <Button size="icon" variant="ghost" title="Security details"
                              className="h-8 w-8 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => handleViewSecurity(u)}>
                              <Shield className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Reset security"
                              className="h-8 w-8 rounded-lg hover:bg-violet-500/10"
                              style={{ color: "#a78bfa" }}
                              onClick={() => setConfirmAction({ type: "reset_mpin", user: u })}>
                              <KeyRound className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Force logout all sessions"
                              className="h-8 w-8 rounded-lg hover:bg-rose-500/10"
                              style={{ color: "#fb7185" }}
                              disabled={logoutUserId === u.id}
                              onClick={() => handleForceLogout(u)}>
                              {logoutUserId === u.id
                                ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                : <LogOut className="h-3.5 w-3.5" />}
                            </Button>
                            <Button size="icon" variant="ghost" title="Change user type"
                              className="h-8 w-8 rounded-lg hover:bg-cyan-500/10"
                              style={{ color: "#22d3ee" }}
                              onClick={() => { setChangeTypeUser(u); setChangeTypeTo(u.user_type === "employee" ? "client" : "employee"); }}>
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Login as this user"
                              className="h-8 w-8 rounded-lg hover:bg-indigo-500/10"
                              style={{ color: "#a5b4fc" }}
                              disabled={impersonateUserId === u.id}
                              onClick={() => handleImpersonate(u)}>
                              {impersonateUserId === u.id
                                ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                            <Button size="icon" variant="ghost" title="Delete permanently"
                              className="h-8 w-8 rounded-lg text-red-400 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => setConfirmAction({ type: "delete", user: u })}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination inside the card */}
          {users.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: T.border }}>
              <p className="text-xs" style={{ color: T.sub }}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, users.length)} of <span className="font-semibold" style={{ color: T.text }}>{users.length}</span> users
              </p>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" disabled={page <= 1}
                  style={{ color: T.sub }} onClick={() => setCurrentPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "ellipsis" ? (
                      <span key={`e${i}`} className="px-1 text-xs" style={{ color: T.sub }}>…</span>
                    ) : (
                      <Button key={p} size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-xs font-medium"
                        onClick={() => setCurrentPage(p)}
                        style={p === page
                          ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" }
                          : { color: T.sub }}>
                        {p}
                      </Button>
                    )
                  )}
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" disabled={page >= totalPages}
                  style={{ color: T.sub }} onClick={() => setCurrentPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Stats derived from ALL profiles (not filtered)
  const stats = useMemo(() => ({
    total:      profiles.length,
    pending:    profiles.filter((p) => p.approval_status === "pending").length,
    approved:   profiles.filter((p) => p.approval_status === "approved" && !p.is_disabled).length,
    rejected:   profiles.filter((p) => p.approval_status === "rejected").length,
    blocked:    profiles.filter((p) => p.is_disabled).length,
    freelancers:profiles.filter((p) => p.user_type === "employee").length,
    employers:  profiles.filter((p) => p.user_type === "client").length,
  }), [profiles]);

  // ── User Card Grid ──────────────────────────────────────
  const UserGrid = ({ users }: { users: FullProfile[] }) => {
    const CARD_PAGE = 18;
    const totalPages = Math.max(1, Math.ceil(users.length / CARD_PAGE));
    const page = Math.min(currentPage, totalPages);
    const paginated = users.slice((page - 1) * CARD_PAGE, page * CARD_PAGE);

    if (loading) return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
        </div>
        <p className="text-sm font-medium" style={{ color: T.sub }}>Loading users…</p>
      </div>
    );

    if (users.length === 0) return (
      <div className="flex flex-col items-center justify-center py-28 gap-4">
        <div className="h-20 w-20 rounded-3xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.1))", border: `1px solid rgba(99,102,241,.2)` }}>
          <Users className="h-9 w-9" style={{ color: "#6366f1" }} />
        </div>
        <p className="text-lg font-bold" style={{ color: T.text }}>No users found</p>
        <p className="text-sm" style={{ color: T.sub }}>Try adjusting your search or filters</p>
      </div>
    );

    const ROLE_GRAD: Record<string, string> = {
      "Super Admin": "linear-gradient(135deg,#92400e,#d97706)",
      "Admin":       "linear-gradient(135deg,#3730a3,#6366f1)",
      "Freelancer":  "linear-gradient(135deg,#065f46,#10b981)",
      "Employer":    "linear-gradient(135deg,#1e3a8a,#3b82f6)",
    };
    const STATUS_RING: Record<string, string> = {
      approved: "#10b981",
      pending:  "#f59e0b",
      rejected: "#ef4444",
    };

    return (
      <div className="space-y-5">
        {/* Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map((u) => {
            const name = u.full_name?.[0] || u.email || "?";
            const label = getUserTypeLabel(u.email, u.user_type);
            const isAdmin = !!adminEmailMap.get(u.email?.toLowerCase() ?? "");
            const isSA = adminEmailMap.get(u.email?.toLowerCase() ?? "")?.isSuperAdmin;
            const color = avatarColor(name);
            const initials = getInitials(name);
            const kyvStatus = bankVerifMap.get(u.id);
            const isOnline = u.last_seen_at && (Date.now() - new Date(u.last_seen_at).getTime()) < 5 * 60_000;
            const ringColor = u.is_disabled ? "#ef4444" : (STATUS_RING[u.approval_status] || "#94a3b8");
            const gradTop = ROLE_GRAD[label] || "linear-gradient(135deg,#334155,#475569)";
            const isSelected = selectedIds.has(u.id);

            return (
              <div key={u.id}
                className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl"
                style={{
                  background: T.card,
                  border: `1px solid ${isSelected ? "rgba(99,102,241,.6)" : T.border}`,
                  boxShadow: isSelected ? "0 0 0 2px rgba(99,102,241,.3)" : undefined,
                }}>

                {/* Gradient Band */}
                <div className="h-24 relative" style={{ background: gradTop }}>
                  {/* Decorative circles */}
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                  <div className="absolute -right-2 top-8 h-12 w-12 rounded-full bg-white/5" />

                  {/* Checkbox — top left */}
                  {!isAdmin && (
                    <div className="absolute top-3 left-3 z-10">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => setSelectedIds((prev) => { const n = new Set(prev); n.has(u.id) ? n.delete(u.id) : n.add(u.id); return n; })}
                        className="border-white/60 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-indigo-600"
                      />
                    </div>
                  )}

                  {/* Online badge — top right */}
                  {isOnline && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-semibold text-white">Online</span>
                    </div>
                  )}
                </div>

                {/* Avatar — overlapping band */}
                <div className="flex justify-center -mt-10 mb-3 relative z-10">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white shadow-xl"
                         style={{ background: color, border: `3px solid ${ringColor}`, boxShadow: `0 0 0 3px ${ringColor}30, 0 8px 24px rgba(0,0,0,.25)` }}>
                      {initials}
                    </div>
                    {/* Status ring glow */}
                    <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: `0 0 12px ${ringColor}50` }} />
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-5 pb-4 space-y-3">
                  {/* Name + Email */}
                  <div className="text-center">
                    <h3 className="font-bold text-base truncate" style={{ color: T.text }}>{name}</h3>
                    <p className="text-xs truncate" style={{ color: T.sub }}>{u.email}</p>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-md" style={{ background: T.nav, color: T.sub }}>
                      {u.user_code?.[0] || "—"}
                    </span>
                    {(() => {
                      const roleColors: Record<string, { bg: string; color: string }> = {
                        "Super Admin": { bg: "rgba(245,158,11,.15)", color: "#f59e0b" },
                        "Admin":       { bg: "rgba(99,102,241,.15)", color: "#a5b4fc" },
                        "Freelancer":  { bg: "rgba(16,185,129,.12)", color: "#34d399" },
                        "Employer":    { bg: "rgba(59,130,246,.12)", color: "#60a5fa" },
                      };
                      const rc = roleColors[label] || { bg: T.nav, color: T.sub };
                      return (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: rc.bg, color: rc.color }}>
                          {isSA ? "⭐" : label === "Admin" ? "🔒" : label === "Freelancer" ? "💼" : "🏢"} {label}
                        </span>
                      );
                    })()}
                    {kyvStatus === "approved" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400">✓ KYC</span>
                    )}
                    {kyvStatus === "pending" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400">⏳ KYC</span>
                    )}
                    {u.is_disabled && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-400">🚫 Blocked</span>
                    )}
                  </div>

                  {/* Status strip */}
                  <div className="flex items-center justify-center gap-1">
                    {[
                      { v: u.approval_status, map: { approved:"bg-emerald-500/10 text-emerald-400", pending:"bg-amber-500/10 text-amber-400", rejected:"bg-red-500/10 text-red-400" } },
                    ].map((s, i) => (
                      <span key={i} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${s.map[s.v as keyof typeof s.map] || "bg-slate-500/10 text-slate-400"}`}>
                        {s.v}
                      </span>
                    ))}
                  </div>

                  {/* Wallet */}
                  <div className="rounded-xl px-4 py-3 text-center" style={{ background: T.nav }}>
                    <p className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: T.sub }}>Wallet Balance</p>
                    <p className="text-xl font-extrabold tabular-nums" style={{ color: "#10b981" }}>
                      ₹{(u.available_balance ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </p>
                    {((u.coin_balance ?? 0) > 0 || (u.hold_balance ?? 0) > 0) && (
                      <div className="flex justify-center gap-3 mt-1">
                        {(u.coin_balance ?? 0) > 0 && <p className="text-[10px]" style={{ color: T.sub }}>🪙 {u.coin_balance}</p>}
                        {(u.hold_balance ?? 0) > 0 && <p className="text-[10px]" style={{ color: T.sub }}>🔒 ₹{u.hold_balance}</p>}
                      </div>
                    )}
                  </div>

                  {/* Joined + Last seen */}
                  <div className="flex justify-between text-[10px]" style={{ color: T.sub }}>
                    <span>📅 {fmtDate(u.created_at)}</span>
                    <span style={{ color: isOnline ? "#34d399" : T.sub }}>👁 {fmtLastSeen(u.last_seen_at)}</span>
                  </div>

                  {/* IP / Location */}
                  {((u as any).registration_city || (u as any).registration_country || (u as any).registration_ip) && (
                    <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px]" style={{ background: T.nav }}>
                      <MapPin className="h-3 w-3 shrink-0" style={{ color: "#6366f1" }} />
                      <span className="truncate font-medium" style={{ color: T.sub }}>
                        {[(u as any).registration_city, (u as any).registration_country].filter(Boolean).join(", ") || (u as any).registration_ip}
                      </span>
                      {(u as any).registration_ip && (u as any).registration_city && (
                        <span className="ml-auto font-mono shrink-0" style={{ color: T.sub }}>
                          {(u as any).registration_ip}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  {isAdmin ? (
                    <div className="rounded-xl py-2 text-center text-xs font-bold" style={{ background: isSA ? "rgba(245,158,11,.1)" : "rgba(99,102,241,.1)", color: isSA ? "#f59e0b" : "#a5b4fc" }}>
                      {isSA ? "⭐ Super Admin Protected" : "🔒 Admin Account"}
                    </div>
                  ) : (
                    <div className="space-y-1 pt-1">
                      {/* Row 1 — 4 main actions */}
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { icon: <SlidersHorizontal className="h-3.5 w-3.5" />, title: "Preview",     cls: "hover:bg-indigo-500/15 text-indigo-400",  action: () => setPreviewUser(u) },
                          { icon: <NotebookPen className="h-3.5 w-3.5" />,       title: "Notes",        cls: (u as any).approval_notes ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20" : "hover:bg-amber-500/10 text-amber-400", action: () => handleOpenNotes(u) },
                          { icon: <BadgeIndianRupee className="h-3.5 w-3.5" />,  title: "Wallet",       cls: "hover:bg-emerald-500/15 text-emerald-400", action: () => { setWalletDialogUser(u); setWalletAmount(""); setWalletDir("add"); setWalletDesc(""); } },
                          { icon: <MessageSquare className="h-3.5 w-3.5" />,     title: "Notify",       cls: "hover:bg-blue-500/15 text-blue-400",       action: () => { setMsgDialogUser(u); setMsgTitle(""); setMsgBody(""); } },
                        ].map((btn, i) => (
                          <button key={i} title={btn.title}
                            className={`h-8 w-full rounded-lg flex items-center justify-center transition-colors ${btn.cls}`}
                            onClick={btn.action}>{btn.icon}</button>
                        ))}
                      </div>
                      {/* Row 2 — 4 more actions */}
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { icon: <Pencil className="h-3.5 w-3.5" />,   title: "Edit Profile",       cls: "hover:bg-white/10",           color: T.sub, action: () => navigate(`/admin/users/${u.id}`) },
                          { icon: <Eye className="h-3.5 w-3.5" />,       title: "Full Details",       cls: "hover:bg-white/10",           color: T.sub, action: () => { setSelectedUser(u); setActionType("view"); } },
                          { icon: logoutUserId === u.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />,
                            title: "Force Logout",  cls: "hover:bg-rose-500/10",        color: "#fb7185",
                            action: () => handleForceLogout(u) },
                          { icon: <ArrowLeftRight className="h-3.5 w-3.5" />, title: "Change Type",   cls: "hover:bg-cyan-500/10",        color: "#22d3ee",
                            action: () => { setChangeTypeUser(u); setChangeTypeTo(u.user_type === "employee" ? "client" : "employee"); } },
                        ].map((btn, i) => (
                          <button key={i} title={btn.title} disabled={btn.title === "Force Logout" && logoutUserId === u.id}
                            className={`h-8 w-full rounded-lg flex items-center justify-center transition-colors ${btn.cls}`}
                            style={{ color: btn.color }}
                            onClick={btn.action}>{btn.icon}</button>
                        ))}
                      </div>

                      {/* Impersonate — full width featured button */}
                      <button
                        className="w-full h-8 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[.98]"
                        style={{
                          background: impersonateUserId === u.id ? "rgba(99,102,241,.2)" : "rgba(99,102,241,.1)",
                          border: "1px solid rgba(99,102,241,.25)",
                          color: "#a5b4fc",
                        }}
                        disabled={impersonateUserId === u.id}
                        onClick={() => handleImpersonate(u)}
                        title="Login as this user in a new tab">
                        {impersonateUserId === u.id
                          ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                          : <><Eye className="h-3.5 w-3.5" /> Login as User</>}
                      </button>
                    </div>
                  )}
                  {!isAdmin && (
                    <div className="flex gap-1 pt-0">
                      {u.approval_status === "pending" && (<>
                        <button title="Approve"
                          className="flex-1 h-8 rounded-lg flex items-center justify-center gap-1 text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                          onClick={() => { setSelectedUser(u); setActionType("approve"); }}>
                          <CheckCircle className="h-3 w-3" /> Approve
                        </button>
                        <button title="Reject"
                          className="flex-1 h-8 rounded-lg flex items-center justify-center gap-1 text-[11px] font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          onClick={() => { setSelectedUser(u); setActionType("reject"); }}>
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      </>)}
                      {u.approval_status !== "pending" && (
                        <div className="flex w-full gap-1">
                          <button title={u.is_disabled ? "Unblock" : "Block"}
                            className={`flex-1 h-8 rounded-lg flex items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${u.is_disabled ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400" : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400"}`}
                            onClick={() => setConfirmAction({ type: u.is_disabled ? "unblock" : "block", user: u })}>
                            {u.is_disabled ? <ShieldCheck className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
                            {u.is_disabled ? "Unblock" : "Block"}
                          </button>
                          <button title="Security"
                            className="flex-1 h-8 rounded-lg flex items-center justify-center gap-1 text-[11px] font-semibold bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 transition-colors"
                            onClick={() => handleViewSecurity(u)}>
                            <Shield className="h-3 w-3" /> Security
                          </button>
                          <button title="Delete"
                            className="h-8 w-8 rounded-lg flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors shrink-0"
                            onClick={() => setConfirmAction({ type: "delete", user: u })}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {users.length > CARD_PAGE && (
          <div className="flex items-center justify-center gap-2">
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" disabled={page <= 1}
              style={{ color: T.sub }} onClick={() => setCurrentPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "e")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("e");
                acc.push(p); return acc;
              }, [])
              .map((p, i) => p === "e"
                ? <span key={`e${i}`} className="w-6 text-center text-xs" style={{ color: T.sub }}>…</span>
                : <Button key={p} size="icon" variant="ghost" className="h-8 w-8 rounded-xl text-xs font-bold"
                    onClick={() => setCurrentPage(p)}
                    style={p === page ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" } : { color: T.sub }}>
                    {p}
                  </Button>
              )}
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" disabled={page >= totalPages}
              style={{ color: T.sub }} onClick={() => setCurrentPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* ══════════════════════════════════════════════════
           HERO — Mission Control Header
      ══════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl" style={{ minHeight: 220, background: "linear-gradient(125deg,#0f0c29 0%,#302b63 40%,#24243e 100%)" }}>
        {/* Animated blobs */}
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(99,102,241,.35)" }} />
        <div className="absolute -bottom-16 right-10 h-56 w-56 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(139,92,246,.3)" }} />
        <div className="absolute top-10 right-1/3 h-40 w-40 rounded-full blur-2xl pointer-events-none" style={{ background: "rgba(236,72,153,.15)" }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative z-10 px-6 sm:px-8 pt-7 pb-6">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mb-7">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 8px 32px rgba(99,102,241,.45)" }}>
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -inset-1 rounded-2xl opacity-30 blur-md" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">User Management</h1>
                  <span className="hidden sm:inline-flex h-6 items-center px-2 rounded-full text-[10px] font-bold" style={{ background: "rgba(99,102,241,.3)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.4)" }}>
                    COMMAND CENTER
                  </span>
                </div>
                <p className="text-sm" style={{ color: "rgba(199,210,254,.7)" }}>
                  Manage, approve, and oversee all platform users in real-time
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="sm"
                className="h-9 gap-2 rounded-xl text-white border"
                style={{ background: "rgba(255,255,255,.08)", borderColor: "rgba(255,255,255,.15)" }}
                onClick={() => fetchProfiles()} disabled={loading}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="ghost" size="sm"
                className="h-9 gap-2 rounded-xl text-white border"
                style={{ background: "rgba(255,255,255,.08)", borderColor: "rgba(255,255,255,.15)" }}
                onClick={() => handleOpenAuditLog(null)}>
                <History className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Audit Log</span>
              </Button>
              <Button size="sm"
                className="h-9 gap-2 rounded-xl font-semibold shadow-lg"
                style={{ background: "linear-gradient(135deg,#fff,#e0e7ff)", color: "#4f46e5" }}
                onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-3.5 w-3.5" />
                Invite User
              </Button>
            </div>
          </div>

          {/* Stats grid — 7 tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {[
              { label: "Total Users",  value: stats.total,       icon: "👥", from: "#6366f1", to: "#8b5cf6" },
              { label: "Pending",      value: stats.pending,     icon: "⏳", from: "#d97706", to: "#f59e0b" },
              { label: "Approved",     value: stats.approved,    icon: "✅", from: "#059669", to: "#10b981" },
              { label: "Rejected",     value: stats.rejected,    icon: "❌", from: "#dc2626", to: "#ef4444" },
              { label: "Blocked",      value: stats.blocked,     icon: "🚫", from: "#9f1239", to: "#e11d48" },
              { label: "Freelancers",  value: stats.freelancers, icon: "💼", from: "#0284c7", to: "#38bdf8" },
              { label: "Employers",    value: stats.employers,   icon: "🏢", from: "#7e22ce", to: "#c084fc" },
            ].map((s) => (
              <div key={s.label} className="relative rounded-xl p-3 overflow-hidden cursor-default group/stat"
                style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", backdropFilter: "blur(12px)" }}>
                <div className="absolute inset-0 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300 rounded-xl"
                  style={{ background: `linear-gradient(135deg,${s.from}22,${s.to}22)` }} />
                <div className="relative">
                  <p className="text-xl font-black text-white leading-none tabular-nums">{s.value}</p>
                  <p className="text-[10px] font-medium mt-1" style={{ color: "rgba(199,210,254,.65)" }}>{s.icon} {s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
           COMMAND BAR — Search + Filters + View Toggle
      ══════════════════════════════════════════════════ */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
        {/* Primary row */}
        <div className="flex flex-col sm:flex-row gap-2 p-3 border-b" style={{ borderColor: T.border }}>
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none" style={{ color: T.sub }} />
            <Input
              placeholder="Search name, email, user code…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 border-none h-10 rounded-xl text-sm font-medium"
              style={{ background: T.input, color: T.text }}
            />
            {searchQuery && (
              <button className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-white/10 transition-colors"
                onClick={() => setSearchQuery("")}>
                <X className="h-3.5 w-3.5" style={{ color: T.sub }} />
              </button>
            )}
          </div>
          {/* Type filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[145px] border-none h-10 rounded-xl text-sm font-medium"
              style={{ background: T.input, color: T.text }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ background: T.card, borderColor: T.border }}>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="employee">Freelancers</SelectItem>
              <SelectItem value="client">Employers</SelectItem>
            </SelectContent>
          </Select>
          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-xl p-1 h-10" style={{ background: T.input }}>
            <button
              className="h-8 px-3 rounded-lg text-xs font-bold transition-all"
              style={viewMode === "grid" ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" } : { color: T.sub }}
              onClick={() => setViewMode("grid")}>
              ⊞ Grid
            </button>
            <button
              className="h-8 px-3 rounded-lg text-xs font-bold transition-all"
              style={viewMode === "table" ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" } : { color: T.sub }}
              onClick={() => setViewMode("table")}>
              ≡ Table
            </button>
          </div>
          {/* Export */}
          <Button variant="outline" size="sm"
            className="h-10 gap-2 rounded-xl text-sm shrink-0"
            style={{ borderColor: T.border, color: T.text }}
            onClick={() => handleExportCsv(filtered)}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
        {/* Secondary row — date range + result count + Advanced toggle */}
        <div className="flex flex-wrap items-center gap-2 px-3 py-2">
          <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: T.sub }} />
          <span className="text-xs" style={{ color: T.sub }}>From</span>
          <Input type="date" value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
            className="border-none h-7 rounded-lg text-xs px-2 w-auto"
            style={{ background: T.input, color: T.text }} />
          <span className="text-xs" style={{ color: T.sub }}>to</span>
          <Input type="date" value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
            className="border-none h-7 rounded-lg text-xs px-2 w-auto"
            style={{ background: T.input, color: T.text }} />
          {(dateFrom || dateTo) && (
            <button className="flex items-center gap-1 text-xs rounded-lg px-2 py-1 transition-colors hover:bg-white/10"
              style={{ color: T.sub }}
              onClick={() => { setDateFrom(""); setDateTo(""); }}>
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          {/* Advanced Filters toggle */}
          <button
            className="flex items-center gap-1 text-xs font-semibold rounded-lg px-2.5 py-1.5 transition-all"
            style={{
              background: showAdvancedFilters ? "rgba(99,102,241,.2)" : T.input,
              color: hasAdvancedFilters ? "#a5b4fc" : T.sub,
              border: hasAdvancedFilters ? "1px solid rgba(99,102,241,.4)" : `1px solid ${T.border}`,
            }}
            onClick={() => setShowAdvancedFilters((p) => !p)}>
            ⚙ Advanced {hasAdvancedFilters && "●"}
          </button>
          <div className="ml-auto flex items-center gap-2">
            {filtered.length > 0 && (
              <button
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{ background: "rgba(139,92,246,.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,.3)" }}
                onClick={() => { setBulkNotifyOpen(true); setBulkNotifyTitle(""); setBulkNotifyMsg(""); }}>
                <Megaphone className="h-3.5 w-3.5" />
                Notify {filtered.length < profiles.length ? `${filtered.length} Filtered` : "All"} Users
              </button>
            )}
            <span className="text-xs font-medium" style={{ color: T.sub }}>
              {filtered.length < profiles.length
                ? <><span style={{ color: T.text }}>{filtered.length}</span> / {profiles.length} users</>
                : <><span style={{ color: T.text }}>{profiles.length}</span> users total</>}
            </span>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="border-t px-3 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-200"
            style={{ borderColor: T.border, background: "rgba(99,102,241,.04)" }}>
            {/* KYC Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.sub }}>KYC Status</label>
              <Select value={kycFilter} onValueChange={setKycFilter}>
                <SelectTrigger className="border-none h-8 rounded-lg text-xs" style={{ background: T.input, color: T.text }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: T.card, borderColor: T.border }}>
                  <SelectItem value="all">All KYC</SelectItem>
                  <SelectItem value="approved">✓ KYC Approved</SelectItem>
                  <SelectItem value="pending">⏳ KYC Pending</SelectItem>
                  <SelectItem value="not_submitted">— Not Submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Wallet Min */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.sub }}>Wallet Min (₹)</label>
              <Input type="number" placeholder="0" value={walletMin}
                onChange={(e) => setWalletMin(e.target.value)}
                className="border-none h-8 rounded-lg text-xs" style={{ background: T.input, color: T.text }} />
            </div>

            {/* Wallet Max */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.sub }}>Wallet Max (₹)</label>
              <Input type="number" placeholder="99999" value={walletMax}
                onChange={(e) => setWalletMax(e.target.value)}
                className="border-none h-8 rounded-lg text-xs" style={{ background: T.input, color: T.text }} />
            </div>

            {/* City / Country / Region */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.sub }}>City / Country</label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: T.sub }} />
                <Input placeholder="Mumbai, India…" value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="border-none h-8 rounded-lg text-xs pl-7" style={{ background: T.input, color: T.text }} />
              </div>
            </div>

            {/* Clear Advanced */}
            {hasAdvancedFilters && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button className="text-xs px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1"
                  style={{ color: "#a5b4fc" }}
                  onClick={() => { setKycFilter("all"); setWalletMin(""); setWalletMax(""); setCityFilter(""); }}>
                  <X className="h-3 w-3" /> Clear Advanced Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
           STATUS TABS + USER GRID / TABLE
      ══════════════════════════════════════════════════ */}
      <Tabs defaultValue="pending" className="w-full" onValueChange={() => { setSelectedIds(new Set()); setCurrentPage(1); }}>
        {/* Tab pills */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <TabsList className="h-auto p-1 rounded-2xl gap-1" style={{ background: T.nav }}>
            {[
              { value: "pending",  label: "Pending",   count: filterByStatus("pending").length,  dot: "#f59e0b", glow: "rgba(245,158,11,.3)" },
              { value: "approved", label: "Approved",  count: filterByStatus("approved").length, dot: "#10b981", glow: "rgba(16,185,129,.3)" },
              { value: "rejected", label: "Rejected",  count: filterByStatus("rejected").length, dot: "#ef4444", glow: "rgba(239,68,68,.3)" },
              { value: "all",      label: "All Users", count: filterByStatus(null).length,       dot: "#6366f1", glow: "rgba(99,102,241,.3)" },
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}
                className="rounded-xl px-4 py-2 text-sm font-semibold gap-2 transition-all data-[state=active]:shadow-md"
                style={{ color: T.sub }}>
                <span className="h-2 w-2 rounded-full shrink-0 transition-all" style={{ background: tab.dot }} />
                {tab.label}
                <span className="text-[11px] font-black px-2 py-0.5 rounded-lg min-w-[24px] text-center"
                  style={{ background: T.card, color: T.text }}>
                  {tab.count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Bulk action strip (shown when items selected) */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border animate-in slide-in-from-right-3 duration-200"
              style={{ background: "rgba(99,102,241,.1)", borderColor: "rgba(99,102,241,.3)" }}>
              <span className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-black text-white"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>{selectedIds.size}</span>
              <span className="text-sm font-medium" style={{ color: T.text }}>selected</span>
              <Button size="sm" className="h-7 gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white border-none text-xs"
                disabled={bulkProcessing} onClick={() => handleBulkApprove(filterByStatus(null))}>
                <CheckCircle className="h-3 w-3" /> Approve
              </Button>
              <Button size="sm" variant="destructive" className="h-7 gap-1 rounded-lg text-xs"
                disabled={bulkProcessing} onClick={() => handleBulkReject(filterByStatus(null))}>
                <XCircle className="h-3 w-3" /> Reject
              </Button>
              <button className="text-xs rounded-lg px-2 py-1 hover:bg-white/10 transition-colors" style={{ color: T.sub }}
                onClick={() => setSelectedIds(new Set())}>
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-4">
          {["pending", "approved", "rejected", "all"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {viewMode === "grid"
                ? <UserGrid users={filterByStatus(tab === "all" ? null : tab)} />
                : <UserTable users={filterByStatus(tab === "all" ? null : tab)} />}
            </TabsContent>
          ))}
        </div>
      </Tabs>

      <UserDetailDialog
        user={selectedUser}
        actionType={actionType}
        notes={notes}
        onNotesChange={setNotes}
        processing={processing}
        onAction={handleAction}
        onClose={handleClose}
      />

      {/* Block / Delete / Reset M-Pin Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "delete"
                ? "Permanently Delete User?"
                : confirmAction?.type === "block"
                ? "Block User?"
                : confirmAction?.type === "reset_mpin"
                ? "Full Security Reset?"
                : "Unblock User?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "delete"
                ? `This will permanently delete "${confirmAction.user.full_name?.[0]}" and all their data. This CANNOT be undone.`
                : confirmAction?.type === "block"
                ? `This will block "${confirmAction?.user.full_name?.[0]}" from logging in. You can unblock them later.`
                : confirmAction?.type === "reset_mpin"
                ? `This will fully reset the security setup for "${confirmAction?.user.full_name?.[0] || confirmAction?.user.email}". On their next login they will be required to set up: M-Pin → Security Questions → Google Authenticator.`
                : `This will re-enable login access for "${confirmAction?.user.full_name?.[0]}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={actionProcessing}
              className={
                confirmAction?.type === "delete"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : confirmAction?.type === "reset_mpin"
                  ? "bg-violet-600 text-white hover:bg-violet-700"
                  : ""
              }
              onClick={() => {
                if (!confirmAction) return;
                if (confirmAction.type === "delete") handlePermanentDelete(confirmAction.user);
                else if (confirmAction.type === "reset_mpin") handleResetMpin(confirmAction.user);
                else handleToggleBlock(confirmAction.user);
              }}
            >
              {actionProcessing
                ? "Processing…"
                : confirmAction?.type === "delete"
                ? "Delete"
                : confirmAction?.type === "reset_mpin"
                ? "Reset Security"
                : confirmAction?.type === "block"
                ? "Block"
                : "Unblock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Send an invite email. The user will receive a link to set their password and complete registration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-type">User Type</Label>
              <Select value={inviteType} onValueChange={setInviteType}>
                <SelectTrigger id="invite-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Freelancer</SelectItem>
                  <SelectItem value="client">Employer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviteProcessing}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser} disabled={inviteProcessing || !inviteEmail.trim()}>
              {inviteProcessing ? "Sending…" : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Quick Preview Sheet ────────────────────────── */}
      <Sheet open={!!previewUser} onOpenChange={(open) => !open && setPreviewUser(null)}>
        <SheetContent side="right" className="w-full sm:w-[440px] overflow-y-auto p-0"
          style={{ background: T.card, borderColor: T.border }}>
          {previewUser && (() => {
            const pu = previewUser;
            const name = pu.full_name?.[0] || pu.email || "?";
            const color = avatarColor(name);
            const initials = getInitials(name);
            const label = getUserTypeLabel(pu.email, pu.user_type);
            const kyvStatus = bankVerifMap.get(pu.id);
            const isOnline = pu.last_seen_at && (Date.now() - new Date(pu.last_seen_at).getTime()) < 5 * 60 * 1000;
            const roleMap: Record<string, { bg: string; color: string }> = {
              "Super Admin": { bg: "rgba(245,158,11,.12)", color: "#f59e0b" },
              "Admin": { bg: "rgba(99,102,241,.12)", color: "#a5b4fc" },
              "Freelancer": { bg: "rgba(16,185,129,.1)", color: "#34d399" },
              "Employer": { bg: "rgba(59,130,246,.1)", color: "#60a5fa" },
            };
            const r = roleMap[label] || { bg: T.nav, color: T.sub };
            return (
              <>
                {/* Header */}
                <div className="p-6 border-b" style={{ borderColor: T.border, background: "linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.1))" }}>
                  <SheetHeader className="mb-0">
                    <SheetTitle style={{ color: T.text }} className="sr-only">User Preview</SheetTitle>
                    <SheetDescription className="sr-only">Quick preview of user profile</SheetDescription>
                  </SheetHeader>
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-lg"
                           style={{ background: color }}>
                        {initials}
                      </div>
                      {isOnline && <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 bg-emerald-400" style={{ borderColor: T.card }} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-lg truncate" style={{ color: T.text }}>{name}</h2>
                      <p className="text-sm truncate" style={{ color: T.sub }}>{pu.email}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: r.bg, color: r.color }}>
                          {label}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md" style={{ background: T.nav, color: T.sub }}>
                          {pu.user_code?.[0] || "—"}
                        </span>
                        {isOnline && <span className="text-xs text-emerald-400 font-medium">● Online</span>}
                      </div>
                      {/* Profile Completion Bar */}
                      {(() => {
                        const pct = calcProfileCompletion(pu);
                        const clr = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
                        return (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.sub }}>Profile Completion</span>
                              <span className="text-[10px] font-bold" style={{ color: clr }}>{pct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: clr }} />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                  {/* Status row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Approval", value: pu.approval_status, dot: pu.approval_status === "approved" ? "#10b981" : pu.approval_status === "pending" ? "#f59e0b" : "#ef4444" },
                      { label: "KYC", value: kyvStatus || "—", dot: kyvStatus === "approved" ? "#10b981" : kyvStatus === "pending" ? "#f59e0b" : "#94a3b8" },
                      { label: "Account", value: pu.is_disabled ? "Blocked" : "Active", dot: pu.is_disabled ? "#ef4444" : "#10b981" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: T.nav }}>
                        <p className="text-xs capitalize" style={{ color: T.sub }}>{s.label}</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
                          <p className="text-xs font-semibold capitalize" style={{ color: T.text }}>{s.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator style={{ background: T.border }} />

                  {/* ── User Statistics ── */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: T.sub }}>
                      <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
                      Activity Stats
                    </p>
                    {previewStatsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <RefreshCw className="h-4 w-4 animate-spin" style={{ color: T.sub }} />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Projects Posted", value: previewStats?.projects_posted ?? 0, icon: <Briefcase className="h-3.5 w-3.5" />, color: "#6366f1" },
                          { label: "Services Listed", value: previewStats?.services_listed ?? 0, icon: <Zap className="h-3.5 w-3.5" />, color: "#8b5cf6" },
                          { label: "Reviews Received", value: previewStats?.review_count ?? 0, icon: <Star className="h-3.5 w-3.5" />, color: "#f59e0b" },
                          { label: "Avg Rating", value: previewStats?.avg_rating ? `${previewStats.avg_rating} ⭐` : "—", icon: <TrendingUp className="h-3.5 w-3.5" />, color: "#10b981" },
                        ].map((s) => (
                          <div key={s.label} className="rounded-xl p-3" style={{ background: T.nav }}>
                            <div className="flex items-center gap-1.5 mb-1" style={{ color: s.color }}>
                              {s.icon}
                              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.sub }}>{s.label}</span>
                            </div>
                            <p className="text-sm font-bold" style={{ color: T.text }}>{typeof s.value === "number" ? s.value.toLocaleString("en-IN") : s.value}</p>
                          </div>
                        ))}
                        <div className="col-span-2 rounded-xl p-3" style={{ background: T.nav }}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Activity className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.sub }}>Total Earned (Credits)</span>
                          </div>
                          <p className="text-sm font-bold text-emerald-400">
                            ₹{(previewStats?.total_earned ?? 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator style={{ background: T.border }} />

                  {/* Wallet */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: T.sub }}>
                      <Wallet className="h-3.5 w-3.5 inline mr-1.5" />Wallet
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Available", value: `₹${(pu.available_balance ?? 0).toLocaleString("en-IN")}`, color: "#10b981" },
                        { label: "Hold", value: `₹${(pu.hold_balance ?? 0).toLocaleString("en-IN")}`, color: "#f59e0b" },
                        { label: "Coins", value: `${pu.coin_balance ?? 0} 🪙`, color: "#a78bfa" },
                      ].map((w) => (
                        <div key={w.label} className="rounded-xl p-3" style={{ background: T.nav }}>
                          <p className="text-xs" style={{ color: T.sub }}>{w.label}</p>
                          <p className="font-bold text-sm mt-0.5" style={{ color: w.color }}>{w.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator style={{ background: T.border }} />

                  {/* Details */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: T.sub }}>Details</p>
                    <div className="space-y-2">
                      {[
                        { icon: <Phone className="h-3.5 w-3.5" />, label: "Phone", value: pu.mobile_number || "—" },
                        { icon: <GraduationCap className="h-3.5 w-3.5" />, label: "Education", value: pu.education_level || "—" },
                        { icon: <Briefcase className="h-3.5 w-3.5" />, label: "Experience", value: pu.work_experience || "—" },
                        { icon: <MapPin className="h-3.5 w-3.5" />, label: "City", value: pu.registration_city || "—" },
                        { icon: <Calendar className="h-3.5 w-3.5" />, label: "Joined", value: fmtDate(pu.created_at) },
                        { icon: <Eye className="h-3.5 w-3.5" />, label: "Last seen", value: fmtLastSeen(pu.last_seen_at) },
                      ].map((d) => (
                        <div key={d.label} className="flex items-center justify-between gap-2 py-1.5">
                          <div className="flex items-center gap-2" style={{ color: T.sub }}>
                            {d.icon}
                            <span className="text-xs">{d.label}</span>
                          </div>
                          <span className="text-xs font-medium text-right" style={{ color: T.text }}>{d.value}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between gap-2 py-1.5">
                        <div className="flex items-center gap-2" style={{ color: T.sub }}>
                          <ClipboardCopy className="h-3.5 w-3.5" />
                          <span className="text-xs">User ID</span>
                        </div>
                        <button className="font-mono text-xs truncate max-w-[160px] text-right hover:text-indigo-400 transition-colors"
                          style={{ color: T.sub }}
                          onClick={() => handleCopyId(pu.id)}>
                          {pu.id.substring(0, 16)}… <Copy className="h-2.5 w-2.5 inline" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Admin Notes preview */}
                  {(pu as any).approval_notes && (
                    <>
                      <Separator style={{ background: T.border }} />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.sub }}>
                          <NotebookPen className="h-3.5 w-3.5 inline mr-1.5 text-amber-400" />Admin Notes
                        </p>
                        <p className="text-sm rounded-xl p-3 whitespace-pre-wrap" style={{ background: T.nav, color: T.text }}>
                          {(pu as any).approval_notes}
                        </p>
                      </div>
                    </>
                  )}

                  <Separator style={{ background: T.border }} />

                  {/* ── Transaction Summary ── */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: T.sub }}>
                      <BadgeIndianRupee className="h-3.5 w-3.5 text-emerald-400" />
                      Recent Transactions
                    </p>
                    {previewTxnsLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <RefreshCw className="h-4 w-4 animate-spin" style={{ color: T.sub }} />
                      </div>
                    ) : previewTxns.length === 0 ? (
                      <div className="rounded-xl py-5 text-center text-xs" style={{ background: T.nav, color: T.sub }}>
                        No transactions yet
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {previewTxns.map((txn) => {
                          const isCredit = txn.type?.includes("credit") || txn.type?.includes("add") || txn.type?.includes("deposit") || txn.type?.includes("earning");
                          const amt = txn.amount ?? 0;
                          return (
                            <div key={txn.id}
                              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                              style={{ background: T.nav }}>
                              {/* Type icon */}
                              <div className="h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-sm"
                                style={{ background: isCredit ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)" }}>
                                {isCredit ? "↑" : "↓"}
                              </div>
                              {/* Details */}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate capitalize" style={{ color: T.text }}>
                                  {txn.type?.replace(/_/g, " ") || "Transaction"}
                                </p>
                                <p className="text-[10px] truncate" style={{ color: T.sub }}>
                                  {txn.description || fmtDate(txn.created_at)}
                                </p>
                              </div>
                              {/* Amount */}
                              <div className="text-right shrink-0">
                                <p className="text-sm font-bold tabular-nums"
                                  style={{ color: isCredit ? "#10b981" : "#ef4444" }}>
                                  {isCredit ? "+" : "−"}₹{Math.abs(amt).toLocaleString("en-IN")}
                                </p>
                                {txn.status && (
                                  <p className="text-[10px] capitalize" style={{ color: T.sub }}>{txn.status}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── Referral Chain ── */}
                  <Separator style={{ background: T.border }} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: T.sub }}>
                      <Network className="h-3.5 w-3.5 text-violet-400" />
                      Referral Chain
                      {previewReferral?.referral_code && (
                        <span className="ml-auto font-mono text-[10px] px-2 py-0.5 rounded-md" style={{ background: T.nav, color: T.sub }}>
                          Code: {previewReferral.referral_code}
                        </span>
                      )}
                    </p>
                    {previewReferralLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <RefreshCw className="h-4 w-4 animate-spin" style={{ color: T.sub }} />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Referrer */}
                        <div className="rounded-xl p-3" style={{ background: T.nav }}>
                          <p className="text-[10px] uppercase font-semibold mb-1.5" style={{ color: T.sub }}>Referred By</p>
                          {previewReferral?.referrer ? (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                style={{ background: avatarColor(previewReferral.referrer.full_name?.[0] || previewReferral.referrer.email || "?") }}>
                                {getInitials(previewReferral.referrer.full_name?.[0] || previewReferral.referrer.email || "?")}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate" style={{ color: T.text }}>
                                  {previewReferral.referrer.full_name?.[0] || previewReferral.referrer.email}
                                </p>
                                <p className="text-[10px] font-mono" style={{ color: T.sub }}>
                                  {previewReferral.referrer.user_code?.[0] || "—"}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs" style={{ color: T.sub }}>No referrer (organic signup)</p>
                          )}
                        </div>
                        {/* Referrals */}
                        <div className="rounded-xl p-3" style={{ background: T.nav }}>
                          <p className="text-[10px] uppercase font-semibold mb-1.5" style={{ color: T.sub }}>
                            Referred {previewReferral?.referrals?.length ?? 0} user{(previewReferral?.referrals?.length ?? 0) !== 1 ? "s" : ""}
                          </p>
                          {(previewReferral?.referrals || []).length === 0 ? (
                            <p className="text-xs" style={{ color: T.sub }}>No referrals yet</p>
                          ) : (
                            <div className="space-y-1.5 max-h-28 overflow-y-auto">
                              {(previewReferral?.referrals || []).map((r) => (
                                <div key={r.id} className="flex items-center gap-2">
                                  <Star className="h-3 w-3 shrink-0" style={{ color: "#a78bfa" }} />
                                  <span className="text-xs font-medium truncate" style={{ color: T.text }}>
                                    {r.full_name?.[0] || r.email}
                                  </span>
                                  <span className="text-[10px] font-mono ml-auto shrink-0" style={{ color: T.sub }}>
                                    {r.user_code?.[0] || "—"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator style={{ background: T.border }} />

                  {/* Login as User — inside preview */}
                  <button
                    className="w-full h-9 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all hover:scale-[1.01]"
                    style={{
                      background: impersonateUserId === pu.id ? "rgba(99,102,241,.2)" : "linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.1))",
                      border: "1px solid rgba(99,102,241,.3)",
                      color: "#a5b4fc",
                    }}
                    disabled={impersonateUserId === pu.id}
                    onClick={() => handleImpersonate(pu)}>
                    {impersonateUserId === pu.id
                      ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generating magic link…</>
                      : <><Eye className="h-4 w-4" /> Login as {pu.full_name?.[0] || "User"}</>}
                  </button>

                  <Separator style={{ background: T.border }} />

                  {/* Quick actions inside preview */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="gap-2 rounded-xl text-xs h-9"
                      style={{ borderColor: T.border, color: T.text }}
                      onClick={() => { setPreviewUser(null); handleOpenNotes(pu); }}>
                      <NotebookPen className="h-3.5 w-3.5 text-amber-400" />
                      Edit Notes
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 rounded-xl text-xs h-9"
                      style={{ borderColor: T.border, color: T.text }}
                      onClick={() => { setPreviewUser(null); setWalletDialogUser(pu); setWalletAmount(""); setWalletDir("add"); setWalletDesc(""); }}>
                      <BadgeIndianRupee className="h-3.5 w-3.5 text-emerald-400" />
                      Adjust Wallet
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 rounded-xl text-xs h-9"
                      style={{ borderColor: T.border, color: T.text }}
                      onClick={() => { setPreviewUser(null); setMsgDialogUser(pu); setMsgTitle(""); setMsgBody(""); }}>
                      <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                      Send Notification
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 rounded-xl text-xs h-9"
                      style={{ borderColor: T.border, color: T.text }}
                      onClick={() => { setPreviewUser(null); setEmailDialogUser(pu); setEmailSubject(""); setEmailBody(""); }}>
                      <Mail className="h-3.5 w-3.5 text-rose-400" />
                      Send Email
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 rounded-xl text-xs h-9"
                      style={{ borderColor: T.border, color: T.text }}
                      onClick={() => { setPreviewUser(null); handleOpenKycDocs(pu); }}>
                      <FileText className="h-3.5 w-3.5 text-cyan-400" />
                      KYC Docs
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 rounded-xl text-xs h-9"
                      style={{ borderColor: T.border, color: T.text }}
                      onClick={() => { setPreviewUser(null); handleOpenAadhaarDocs(pu); }}>
                      <Fingerprint className="h-3.5 w-3.5 text-violet-400" />
                      Aadhaar
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 rounded-xl text-xs h-9"
                      style={{ borderColor: T.border, color: T.text }}
                      onClick={() => { setPreviewUser(null); handleOpenAuditLog(pu); }}>
                      <History className="h-3.5 w-3.5 text-orange-400" />
                      Audit Log
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 rounded-xl text-xs h-9"
                      style={{ borderColor: T.border, color: T.text }}
                      onClick={() => { setPreviewUser(null); setWarningDialogUser(pu); setWarningLevel("minor"); setWarningReason(""); }}>
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
                      Issue Warning
                    </Button>
                    <Button size="sm" variant="outline" className="col-span-2 gap-2 rounded-xl text-xs h-9"
                      style={{ borderColor: T.border, color: T.text }}
                      onClick={() => { setPreviewUser(null); navigate(`/admin/users/${pu.id}`); }}>
                      <Pencil className="h-3.5 w-3.5 text-indigo-400" />
                      Edit Full Profile
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── Admin Notes Dialog ─────────────────────────── */}
      <Dialog open={!!notesDialogUser} onOpenChange={(open) => !open && setNotesDialogUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <NotebookPen className="h-5 w-5 text-amber-400" />
              Admin Internal Notes
            </DialogTitle>
            <DialogDescription>
              {notesDialogUser?.full_name?.[0] || notesDialogUser?.email} — Notes are admin-only, never shown to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add internal notes about this user (e.g. 'Verified via phone call on 5 Apr', 'Suspicious activity suspected'…)"
              rows={6}
              className="resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground">
              These notes are stored as internal admin records and are not visible to the user.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogUser(null)} disabled={notesProcessing}>Cancel</Button>
            <Button onClick={handleSaveNotes} disabled={notesProcessing} className="bg-amber-500 hover:bg-amber-600 text-white">
              {notesProcessing ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save Notes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Wallet Adjustment Dialog ───────────────────── */}
      <Dialog open={!!walletDialogUser} onOpenChange={(open) => !open && setWalletDialogUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeIndianRupee className="h-5 w-5 text-emerald-400" />
              Wallet Adjustment
            </DialogTitle>
            <DialogDescription>
              {walletDialogUser?.full_name?.[0] || walletDialogUser?.email}
              {walletDialogUser && (
                <span className="ml-1 font-semibold text-foreground">
                  — Current: ₹{(walletDialogUser.available_balance ?? 0).toLocaleString("en-IN")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Add / Deduct toggle */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={walletDir === "add" ? "default" : "outline"}
                className={`h-10 gap-2 rounded-xl ${walletDir === "add" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                onClick={() => setWalletDir("add")}>
                <CheckCircle className="h-4 w-4" /> Add
              </Button>
              <Button
                variant={walletDir === "deduct" ? "default" : "outline"}
                className={`h-10 gap-2 rounded-xl ${walletDir === "deduct" ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
                onClick={() => setWalletDir("deduct")}>
                <XCircle className="h-4 w-4" /> Deduct
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                className="text-lg font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason / Description (optional)</Label>
              <Input
                placeholder="e.g. Bonus, Refund, Penalty…"
                value={walletDesc}
                onChange={(e) => setWalletDesc(e.target.value)}
              />
            </div>
            {walletAmount && parseFloat(walletAmount) > 0 && (
              <div className="rounded-xl p-3 text-center text-sm font-medium"
                   style={{ background: walletDir === "add" ? "rgba(16,185,129,.1)" : "rgba(239,68,68,.1)", color: walletDir === "add" ? "#10b981" : "#ef4444" }}>
                {walletDir === "add" ? "+" : "−"}₹{parseFloat(walletAmount).toLocaleString("en-IN")} will be {walletDir === "add" ? "credited to" : "deducted from"} wallet
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalletDialogUser(null)} disabled={walletProcessing}>Cancel</Button>
            <Button
              onClick={handleWalletAdjust}
              disabled={walletProcessing || !walletAmount || parseFloat(walletAmount) <= 0}
              className={walletDir === "add" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}>
              {walletProcessing
                ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Processing…</>
                : walletDir === "add" ? "Add to Wallet" : "Deduct from Wallet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Send Notification Dialog ───────────────────── */}
      <Dialog open={!!msgDialogUser} onOpenChange={(open) => !open && setMsgDialogUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              Send Notification
            </DialogTitle>
            <DialogDescription>
              Send an in-app notification to {msgDialogUser?.full_name?.[0] || msgDialogUser?.email}.
              They will see this in their notification bell.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Notification Title</Label>
              <Input
                placeholder="e.g. Account Update, Important Notice…"
                value={msgTitle}
                onChange={(e) => setMsgTitle(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your message here…"
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                rows={4}
                className="resize-none text-sm"
                maxLength={500}
              />
              <p className="text-xs text-right text-muted-foreground">{msgBody.length}/500</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMsgDialogUser(null)} disabled={msgProcessing}>Cancel</Button>
            <Button
              onClick={handleSendNotification}
              disabled={msgProcessing || !msgTitle.trim() || !msgBody.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              {msgProcessing
                ? <><RefreshCw className="h-4 w-4 animate-spin" />Sending…</>
                : <><SendHorizonal className="h-4 w-4" />Send Notification</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Issue Warning Dialog ─────────────────────────── */}
      <Dialog open={!!warningDialogUser} onOpenChange={(open) => !open && setWarningDialogUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Issue Formal Warning
            </DialogTitle>
            <DialogDescription>
              Issue an official warning to {warningDialogUser?.full_name?.[0] || warningDialogUser?.email}. The user will receive an in-app notification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Warning Level</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: "minor", label: "⚠️ Minor", desc: "First notice", color: "#f59e0b" },
                  { val: "moderate", label: "🔶 Moderate", desc: "Second notice", color: "#fb923c" },
                  { val: "severe", label: "🔴 Severe", desc: "Serious breach", color: "#ef4444" },
                  { val: "final", label: "🚫 Final", desc: "Last warning", color: "#dc2626" },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setWarningLevel(opt.val)}
                    className="flex flex-col items-start p-3 rounded-xl border text-left transition-all"
                    style={{
                      borderColor: warningLevel === opt.val ? opt.color : "rgba(255,255,255,.1)",
                      background: warningLevel === opt.val ? `${opt.color}20` : "transparent",
                    }}>
                    <span className="text-sm font-semibold" style={{ color: warningLevel === opt.val ? opt.color : "#94a3b8" }}>{opt.label}</span>
                    <span className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason / Message to User</Label>
              <Textarea
                placeholder="Explain the reason for this warning. This will be sent to the user as an in-app notification…"
                value={warningReason}
                onChange={(e) => setWarningReason(e.target.value)}
                rows={4}
                className="resize-none text-sm"
                maxLength={1000}
              />
              <p className="text-xs text-right text-muted-foreground">{warningReason.length}/1000</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarningDialogUser(null)} disabled={warningProcessing}>Cancel</Button>
            <Button
              onClick={handleIssueWarning}
              disabled={warningProcessing || !warningReason.trim()}
              className="gap-2"
              style={{ background: "#d97706", color: "#fff" }}>
              {warningProcessing
                ? <><RefreshCw className="h-4 w-4 animate-spin" />Sending…</>
                : <><AlertTriangle className="h-4 w-4" />Issue Warning</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Notify Dialog ────────────────────────────── */}
      <Dialog open={bulkNotifyOpen} onOpenChange={(open) => { if (!open) setBulkNotifyOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-violet-400" />
              Notify {filtered.length < profiles.length ? `${filtered.length} Filtered` : "All"} Users
            </DialogTitle>
            <DialogDescription>
              Send an in-app notification to all users currently matching the active search/filter ({filtered.length} users). Max 500 users per send.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Notification Title</Label>
              <Input
                placeholder="e.g. Platform Update, Action Required…"
                value={bulkNotifyTitle}
                onChange={(e) => setBulkNotifyTitle(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your announcement or message here…"
                value={bulkNotifyMsg}
                onChange={(e) => setBulkNotifyMsg(e.target.value)}
                rows={5}
                className="resize-none text-sm"
                maxLength={1000}
              />
              <p className="text-xs text-right text-muted-foreground">{bulkNotifyMsg.length}/1000</p>
            </div>
            {filtered.length > 500 && (
              <p className="text-xs rounded-lg px-3 py-2 bg-red-500/10 text-red-400">
                ⚠ Current filter has {filtered.length} users. Bulk send is limited to 500. Please narrow your filter.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkNotifyOpen(false)} disabled={bulkNotifyProcessing}>Cancel</Button>
            <Button
              onClick={handleBulkNotify}
              disabled={bulkNotifyProcessing || !bulkNotifyTitle.trim() || !bulkNotifyMsg.trim() || filtered.length > 500}
              className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
              {bulkNotifyProcessing
                ? <><RefreshCw className="h-4 w-4 animate-spin" />Sending…</>
                : <><Megaphone className="h-4 w-4" />Send to {Math.min(filtered.length, 500)} users</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Send Email Dialog ────────────────────────────── */}
      <Dialog open={!!emailDialogUser} onOpenChange={(open) => !open && setEmailDialogUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-rose-400" />
              Send Email / Message
            </DialogTitle>
            <DialogDescription>
              Compose a message for {emailDialogUser?.full_name?.[0] || emailDialogUser?.email}.
              Delivered via in-app notification (SMTP optional via env vars).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="e.g. Important Update, Action Required…"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Message Body</Label>
              <Textarea
                placeholder="Write your message here…"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={6}
                className="resize-none text-sm"
                maxLength={2000}
              />
              <p className="text-xs text-right text-muted-foreground">{emailBody.length}/2000</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogUser(null)} disabled={emailProcessing}>Cancel</Button>
            <Button
              onClick={handleSendEmail}
              disabled={emailProcessing || !emailSubject.trim() || !emailBody.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white gap-2">
              {emailProcessing
                ? <><RefreshCw className="h-4 w-4 animate-spin" />Sending…</>
                : <><Mail className="h-4 w-4" />Send</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── KYC Document Viewer Dialog ────────────────────── */}
      <Dialog open={!!kycDialogUser} onOpenChange={(open) => !open && setKycDialogUser(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-400" />
              KYC Documents
            </DialogTitle>
            <DialogDescription>
              Bank verification records for {kycDialogUser?.full_name?.[0] || kycDialogUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {kycLoading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : kycDocs.length === 0 ? (
              <div className="rounded-xl py-10 text-center" style={{ background: T.nav }}>
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium" style={{ color: T.sub }}>No KYC documents submitted</p>
              </div>
            ) : (
              <div className="space-y-4">
                {kycDocs.map((doc, i) => (
                  <div key={doc.id} className="rounded-xl border p-4 space-y-3" style={{ background: T.nav, borderColor: T.border }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color: T.sub }}>Attempt #{(doc.attempt_count ?? i + 1)}</span>
                        <Badge variant="outline" className={
                          doc.status === "approved" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                          doc.status === "pending" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" :
                          doc.status === "rejected" ? "bg-red-500/15 text-red-400 border-red-500/30" :
                          "bg-blue-500/15 text-blue-400 border-blue-500/30"
                        }>{doc.status}</Badge>
                      </div>
                      <span className="text-xs" style={{ color: T.sub }}>{fmtDate(doc.created_at)}</span>
                    </div>
                    {doc.document_name && (
                      <p className="text-xs font-mono" style={{ color: T.sub }}>
                        <FileText className="h-3 w-3 inline mr-1" />
                        {doc.document_name}
                      </p>
                    )}
                    {doc.rejection_reason && (
                      <p className="text-xs rounded-lg px-3 py-2 bg-red-500/10 text-red-400">
                        Rejection: {doc.rejection_reason}
                      </p>
                    )}
                    {doc.doc_url ? (
                      <div className="space-y-2">
                        <a href={doc.doc_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                          <Link2 className="h-3.5 w-3.5" />
                          View Document (opens in new tab)
                        </a>
                        {/\.(jpg|jpeg|png|webp|gif)$/i.test(doc.document_path || "") && (
                          <img
                            src={doc.doc_url}
                            alt="KYC Document"
                            className="w-full rounded-lg object-contain max-h-48 border"
                            style={{ borderColor: T.border }}
                          />
                        )}
                      </div>
                    ) : doc.document_path ? (
                      <p className="text-xs" style={{ color: T.sub }}>Document exists but preview unavailable</p>
                    ) : null}
                    {doc.verified_at && (
                      <p className="text-xs" style={{ color: T.sub }}>
                        Verified: {fmtDate(doc.verified_at)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Aadhaar Verification Viewer ───────────────────── */}
      <Dialog open={!!aadhaarDialogUser} onOpenChange={(open) => !open && setAadhaarDialogUser(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-violet-400" />
              Aadhaar Verification
            </DialogTitle>
            <DialogDescription>
              Aadhaar records for {aadhaarDialogUser?.full_name?.[0] || aadhaarDialogUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {aadhaarLoading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : aadhaarRecords.length === 0 ? (
              <div className="rounded-xl py-10 text-center" style={{ background: T.nav }}>
                <Fingerprint className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium" style={{ color: T.sub }}>No Aadhaar records submitted</p>
              </div>
            ) : (
              <div className="space-y-5">
                {aadhaarRecords.map((rec, i) => (
                  <div key={rec.id} className="rounded-xl border p-4 space-y-3" style={{ background: T.nav, borderColor: T.border }}>
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color: T.sub }}>Record #{i + 1}</span>
                        <Badge variant="outline" className={
                          rec.status === "verified" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                          rec.status === "pending"  ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" :
                          rec.status === "rejected" ? "bg-red-500/15 text-red-400 border-red-500/30" :
                          "bg-blue-500/15 text-blue-400 border-blue-500/30"
                        }>{rec.status}</Badge>
                        {rec.is_cleared && <Badge variant="outline" className="bg-slate-500/15 text-slate-400 border-slate-500/30 text-[10px]">Cleared</Badge>}
                      </div>
                      <span className="text-xs" style={{ color: T.sub }}>{fmtDate(rec.created_at)}</span>
                    </div>
                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <div><span className="font-semibold" style={{ color: T.sub }}>Name: </span><span style={{ color: T.text }}>{rec.name_on_aadhaar || "—"}</span></div>
                      <div><span className="font-semibold" style={{ color: T.sub }}>DOB: </span><span style={{ color: T.text }}>{rec.dob_on_aadhaar || "—"}</span></div>
                      <div className="col-span-2"><span className="font-semibold" style={{ color: T.sub }}>Aadhaar No: </span><span style={{ color: T.text }} className="font-mono tracking-widest">{rec.aadhaar_number ? `${rec.aadhaar_number.slice(0, 4)} ${rec.aadhaar_number.slice(4, 8)} ${rec.aadhaar_number.slice(8)}` : "—"}</span></div>
                      <div className="col-span-2"><span className="font-semibold" style={{ color: T.sub }}>Address: </span><span style={{ color: T.text }}>{rec.address_on_aadhaar || "—"}</span></div>
                    </div>
                    {/* Rejection reason */}
                    {rec.rejection_reason && (
                      <p className="text-xs rounded-lg px-3 py-2 bg-red-500/10 text-red-400">Rejection: {rec.rejection_reason}</p>
                    )}
                    {/* Images */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold" style={{ color: T.sub }}>Front Side</p>
                        {rec.front_url ? (
                          <a href={rec.front_url} target="_blank" rel="noopener noreferrer">
                            <img src={rec.front_url} alt="Aadhaar Front" className="w-full rounded-lg object-cover border max-h-36 hover:opacity-90 transition-opacity cursor-zoom-in" style={{ borderColor: T.border }} />
                          </a>
                        ) : (
                          <div className="w-full rounded-lg flex items-center justify-center max-h-36 h-24 text-xs" style={{ background: T.card, color: T.sub, borderColor: T.border, border: `1px dashed ${T.border}` }}>
                            {rec.front_image_path ? "Preview unavailable" : "Not uploaded"}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold" style={{ color: T.sub }}>Back Side</p>
                        {rec.back_url ? (
                          <a href={rec.back_url} target="_blank" rel="noopener noreferrer">
                            <img src={rec.back_url} alt="Aadhaar Back" className="w-full rounded-lg object-cover border max-h-36 hover:opacity-90 transition-opacity cursor-zoom-in" style={{ borderColor: T.border }} />
                          </a>
                        ) : (
                          <div className="w-full rounded-lg flex items-center justify-center max-h-36 h-24 text-xs" style={{ background: T.card, color: T.sub, borderColor: T.border, border: `1px dashed ${T.border}` }}>
                            {rec.back_image_path ? "Preview unavailable" : "Not uploaded"}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Click-to-open links */}
                    <div className="flex gap-3">
                      {rec.front_url && <a href={rec.front_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"><Link2 className="h-3 w-3" />Open Front</a>}
                      {rec.back_url && <a href={rec.back_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"><Link2 className="h-3 w-3" />Open Back</a>}
                    </div>
                    {rec.verified_at && <p className="text-xs" style={{ color: T.sub }}>Verified: {fmtDate(rec.verified_at)}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Admin Audit Log Sheet ─────────────────────────── */}
      <Sheet open={auditLogOpen} onOpenChange={(open) => { if (!open) { setAuditLogOpen(false); setAuditTargetUser(null); } }}>
        <SheetContent side="right" className="w-full sm:w-[520px] overflow-y-auto p-0" style={{ background: T.card, borderColor: T.border }}>
          <SheetHeader className="p-6 border-b" style={{ borderColor: T.border, background: "linear-gradient(135deg,rgba(249,115,22,.1),rgba(234,88,12,.06))" }}>
            <SheetTitle className="flex items-center gap-2" style={{ color: T.text }}>
              <History className="h-5 w-5 text-orange-400" />
              {auditTargetUser ? `Audit: ${auditTargetUser.full_name?.[0] || auditTargetUser.email}` : "Full Admin Audit Log"}
            </SheetTitle>
            <SheetDescription style={{ color: T.sub }}>
              {auditTargetUser ? "All admin actions taken on this user" : "Last 100 admin actions across the platform"}
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            {auditLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-6 w-6 animate-spin" style={{ color: T.sub }} />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: T.sub }}>
                <History className="h-10 w-10 opacity-30" />
                <p className="text-sm">No audit records found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log) => {
                  const actionColors: Record<string, string> = {
                    approve_user: "#10b981", reject_user: "#ef4444", block_user: "#ef4444",
                    unblock_user: "#10b981", force_logout: "#f59e0b", permanent_delete: "#ef4444",
                    impersonate_user: "#8b5cf6", send_email: "#3b82f6", change_user_type: "#6366f1",
                    wallet_add: "#10b981", wallet_deduct: "#ef4444", send_notification: "#3b82f6",
                  };
                  const clr = actionColors[log.action] || "#94a3b8";
                  const adminName = (log as any).profiles?.full_name?.[0] || (log as any).profiles?.email || "Admin";
                  return (
                    <div key={log.id} className="rounded-xl p-3 border space-y-1.5" style={{ background: T.nav, borderColor: T.border }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: clr }} />
                          <span className="text-xs font-bold capitalize truncate" style={{ color: T.text }}>
                            {log.action.replace(/_/g, " ")}
                          </span>
                        </div>
                        <span className="text-[10px] shrink-0" style={{ color: T.sub }}>
                          {new Date(log.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {log.target_profile_name && !auditTargetUser && (
                        <p className="text-xs" style={{ color: T.sub }}>
                          Target: <span style={{ color: T.text }}>{log.target_profile_name}</span>
                        </p>
                      )}
                      <p className="text-[10px]" style={{ color: T.sub }}>
                        By: {adminName}
                      </p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="rounded-lg px-2 py-1.5 text-[10px] font-mono" style={{ background: T.card, color: T.sub }}>
                          {JSON.stringify(log.details)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Security View Dialog */}
      <Dialog open={!!viewSecurityUser} onOpenChange={(open) => { if (!open) { setViewSecurityUser(null); setSecurityData(null); setSecurityDenied(false); setShowTotpSecret(false); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              Security Details
            </DialogTitle>
            <DialogDescription>
              {viewSecurityUser?.full_name?.[0] || viewSecurityUser?.email}
            </DialogDescription>
          </DialogHeader>

          {securityLoading && !securityData && !securityDenied ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : securityDenied ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <Shield className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold text-sm">Super Admin Access Required</p>
              <p className="text-xs text-muted-foreground">Only super admins can view user security details.</p>
            </div>
          ) : securityData ? (
            <div className="space-y-5 py-2">

              {/* M-Pin */}
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">🔐 M-Pin</p>
                {securityData.mpin_set ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl tracking-widest font-bold">
                      {showMpin ? securityData.mpin ?? "••••" : "••••"}
                    </span>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowMpin(v => !v)}>
                      {showMpin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    {showMpin && securityData.mpin && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(securityData.mpin!); toast.success("M-Pin copied"); }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not set</p>
                )}
              </div>

              {/* Security Questions */}
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">🛡️ Security Questions</p>
                {securityData.security_questions_done && securityData.answered_questions.length > 0 ? (
                  <>
                    {/* If NO answers have plaintext — old account, show reset prompt */}
                    {securityData.answered_questions.every(q => q.answer == null) ? (
                      <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 space-y-2">
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          Answers are encrypted (account set up before answer-visibility feature).
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Reset this user's security so they re-setup with visible answers, or have them use "Forgot PIN" — answers will be captured automatically during that flow.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                          disabled={actionProcessing}
                          onClick={async () => {
                            if (!viewSecurityUser) return;
                            setActionProcessing(true);
                            try {
                              const token = await getToken();
                              const r = await callEdgeFunction("admin-user-management", { method: "POST", body: { action: "reset_mpin", profile_id: viewSecurityUser.id }, token });
                              if (r.ok) {
                                toast.success("Security reset done. User will re-setup on next login.");
                                setViewSecurityUser(null);
                                setSecurityData(null);
                              } else {
                                const d = await r.json();
                                toast.error(d.error || "Reset failed");
                              }
                            } catch { toast.error("Reset failed"); }
                            finally { setActionProcessing(false); }
                          }}
                        >
                          {actionProcessing ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <ShieldOff className="h-3 w-3 mr-1" />}
                          Reset Security Now
                        </Button>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {securityData.answered_questions.map((q) => (
                          <li key={q.idx} className="text-sm space-y-0.5">
                            <div className="flex items-start gap-2">
                              <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                              <span className="font-medium">{q.question}</span>
                            </div>
                            {q.answer != null ? (
                              <p className="ml-5 text-xs text-muted-foreground italic">
                                Answer: <span className="font-mono text-foreground not-italic">{q.answer}</span>
                              </p>
                            ) : (
                              <p className="ml-5 text-xs text-muted-foreground italic">Answer: (encrypted)</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not set up</p>
                )}
              </div>

              {/* Google Authenticator */}
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">📱 Google Authenticator</p>
                {securityData.totp_enabled && securityData.totp_code ? (
                  <>
                    {/* Current code */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Current Code</p>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-3xl tracking-[0.3em] font-bold text-emerald-400">
                          {securityData.totp_code}
                        </span>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-muted-foreground">{totpSecsLeft}s</span>
                          <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${(totpSecsLeft / 30) * 100}%` }} />
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleRefreshTotp} disabled={securityLoading}>
                          <RefreshCw className={`h-4 w-4 ${securityLoading ? "animate-spin" : ""}`} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(securityData.totp_code!); toast.success("TOTP code copied"); }}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Secret key */}
                    {securityData.totp_secret && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Authenticator Secret Key</p>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded tracking-widest break-all">
                            {showTotpSecret ? securityData.totp_secret : "•".repeat(securityData.totp_secret.length)}
                          </span>
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setShowTotpSecret(v => !v)}>
                            {showTotpSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          {showTotpSecret && (
                            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(securityData.totp_secret!); toast.success("Secret key copied"); }}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not set up</p>
                )}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setViewSecurityUser(null); setSecurityData(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change User Type Dialog ───────────────────────── */}
      <Dialog open={!!changeTypeUser} onOpenChange={(o) => { if (!o) { setChangeTypeUser(null); setChangeTypeTo(""); } }}>
        <DialogContent className="max-w-sm rounded-2xl" style={{ background: "#1e1e2e", borderColor: "rgba(99,102,241,.3)" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ArrowLeftRight className="h-5 w-5 text-cyan-400" />
              Change User Type
            </DialogTitle>
            <DialogDescription style={{ color: "rgba(199,210,254,.6)" }}>
              Update account type for{" "}
              <span className="font-semibold text-white">{changeTypeUser?.full_name || changeTypeUser?.email}</span>.
              The user will be notified automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Current type */}
            <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,.05)" }}>
              <div>
                <p className="text-[10px] font-medium mb-0.5" style={{ color: "rgba(199,210,254,.5)" }}>CURRENT TYPE</p>
                <p className="text-sm font-bold text-white">
                  {changeTypeUser?.user_type === "employee" ? "💼 Freelancer" : "🏢 Employer"}
                </p>
              </div>
              <ArrowLeftRight className="h-5 w-5" style={{ color: "#22d3ee" }} />
              <div className="text-right">
                <p className="text-[10px] font-medium mb-0.5" style={{ color: "rgba(199,210,254,.5)" }}>CHANGE TO</p>
                <p className="text-sm font-bold" style={{ color: "#22d3ee" }}>
                  {changeTypeTo === "employee" ? "💼 Freelancer" : "🏢 Employer"}
                </p>
              </div>
            </div>

            {/* Warning */}
            <div className="rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)", color: "#fbbf24" }}>
              ⚠️ This changes the user's account role. Their existing profile data will be preserved.
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="rounded-xl border-white/20 text-white hover:bg-white/10"
              onClick={() => { setChangeTypeUser(null); setChangeTypeTo(""); }}>
              Cancel
            </Button>
            <Button size="sm"
              className="rounded-xl font-bold"
              style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)", color: "#fff" }}
              disabled={changeTypeProcessing}
              onClick={handleChangeType}>
              {changeTypeProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
              {changeTypeProcessing ? "Changing…" : "Confirm Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
