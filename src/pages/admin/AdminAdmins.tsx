import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, ShieldOff, ShieldCheck, UserMinus, UserPlus, Crown,
  RefreshCw, Star, Mail, Phone, Clock, Shield, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { toast } from "sonner";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { callEdgeFunction } from "@/lib/supabase-functions";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const PAGE_SIZE = 15;

type AdminRow = {
  role_id: string;
  user_id: string;
  profile_id: string | null;
  full_name: string | null;
  email: string;
  user_type: string | null;
  approval_status: string | null;
  is_disabled: boolean;
  mobile_number: string | null;
  role_created_at: string;
  last_sign_in: string | null;
  is_super_admin: boolean;
};

async function callAdmin(fnName: string, body?: object) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const res = await callEdgeFunction(fnName, body ? { method: "POST", body, token } : { method: "GET", token });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || "Request failed");
  return data;
}

function fmt(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const AdminAdmins = () => {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<AdminRow | null>(null);
  const [confirmBlock, setConfirmBlock] = useState<AdminRow | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-list"],
    queryFn: async () => {
      const d = await callAdmin("admin-list");
      return d.admins as AdminRow[];
    },
  });

  const admins = data || [];

  const filtered = useMemo(() => {
    if (search.length < 2) return admins;
    const q = search.toLowerCase();
    return admins.filter(a =>
      (a.full_name || "").toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.mobile_number || "").includes(q)
    );
  }, [admins, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAddAdmin = async () => {
    if (!addEmail.trim()) return;
    setAddLoading(true);
    try {
      await callAdmin("admin-manage", { action: "grant", target_email: addEmail.trim() });
      toast.success("Admin role granted successfully");
      setAddOpen(false);
      setAddEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin-list"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to grant admin role");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRevoke = async (admin: AdminRow) => {
    setProcessing(true);
    try {
      await callAdmin("admin-manage", { action: "revoke", user_id: admin.user_id });
      toast.success(`Admin role removed for ${admin.email}`);
      setConfirmRevoke(null);
      queryClient.invalidateQueries({ queryKey: ["admin-list"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to revoke role");
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleBlock = async (admin: AdminRow) => {
    if (!admin.profile_id) { toast.error("No profile found for this admin"); return; }
    setProcessing(true);
    try {
      const d = await callAdmin("admin-manage", { action: "toggle_block", profile_id: admin.profile_id });
      toast.success(d.is_disabled ? "Admin account blocked" : "Admin account unblocked");
      setConfirmBlock(null);
      queryClient.invalidateQueries({ queryKey: ["admin-list"] });
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setProcessing(false);
    }
  };

  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 };
  const inp  = { background: T.input, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, outline: "none", padding: "9px 14px", fontSize: 14, width: "100%" };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px" }}>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
        <div className="flex items-center gap-3">
          <div style={{ background: "rgba(99,102,241,.15)", borderRadius: 12, padding: 10 }}>
            <Crown className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 style={{ color: T.text, fontWeight: 700, fontSize: 22, margin: 0 }}>Admin Management</h1>
            <p style={{ color: T.sub, fontSize: 13, margin: 0 }}>Manage admin accounts and permissions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isLoading} style={{ color: T.sub }}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <UserPlus className="h-4 w-4 mr-1.5" /> Add Admin
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Admins", value: admins.length, icon: Crown, color: "#6366f1" },
          { label: "Super Admins", value: admins.filter(a => a.is_super_admin).length, icon: Star, color: "#f59e0b" },
          { label: "Blocked",      value: admins.filter(a => a.is_disabled).length,    icon: ShieldOff, color: "#ef4444" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ ...card, padding: "18px 20px" }} className="flex items-center gap-3">
            <div style={{ background: `${color}18`, borderRadius: 10, padding: 9 }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <div style={{ color: T.text, fontWeight: 700, fontSize: 22 }}>{value}</div>
              <div style={{ color: T.sub, fontSize: 12 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={card}>
        {/* Search */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }} className="flex items-center gap-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            style={{ ...inp, padding: "6px 0", border: "none", background: "transparent", flexGrow: 1 }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: T.sub, cursor: "pointer", background: "none", border: "none" }}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" /> Loading admins…
          </div>
        ) : pageData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Shield className="h-8 w-8 text-muted-foreground" />
            <p style={{ color: T.sub, fontSize: 14 }}>{search ? "No admins match your search" : "No admin accounts found"}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: T.border }}>
                {["Admin", "Role", "Status", "Last Login", "Added On", "Actions"].map(h => (
                  <TableHead key={h} style={{ color: T.sub, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.map(admin => (
                <TableRow key={admin.user_id} style={{ borderColor: T.border }}>
                  {/* Admin info */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: admin.is_super_admin ? "rgba(245,158,11,.15)" : "rgba(99,102,241,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {admin.is_super_admin
                          ? <Star className="h-5 w-5 text-amber-400" />
                          : <Crown className="h-4 w-4 text-indigo-400" />}
                      </div>
                      <div>
                        <div style={{ color: T.text, fontWeight: 600, fontSize: 14 }}>
                          {admin.full_name || "—"}
                        </div>
                        <div className="flex items-center gap-1" style={{ color: T.sub, fontSize: 12 }}>
                          <Mail className="h-3 w-3" />
                          {admin.email}
                        </div>
                        {admin.mobile_number && (
                          <div className="flex items-center gap-1" style={{ color: T.sub, fontSize: 11 }}>
                            <Phone className="h-3 w-3" />
                            {admin.mobile_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Role */}
                  <TableCell>
                    {admin.is_super_admin ? (
                      <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 border text-xs font-semibold">
                        <Star className="h-3 w-3 mr-1" /> Super Admin
                      </Badge>
                    ) : (
                      <Badge className="bg-indigo-500/15 text-indigo-400 border-indigo-500/30 border text-xs font-semibold">
                        <Crown className="h-3 w-3 mr-1" /> Admin
                      </Badge>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {admin.is_disabled ? (
                      <Badge variant="destructive" className="text-xs">Blocked</Badge>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 border text-xs">Active</Badge>
                    )}
                  </TableCell>

                  {/* Last login */}
                  <TableCell>
                    <div className="flex items-center gap-1" style={{ color: T.sub, fontSize: 12 }}>
                      <Clock className="h-3 w-3" />
                      {fmt(admin.last_sign_in)}
                    </div>
                  </TableCell>

                  {/* Role added */}
                  <TableCell style={{ color: T.sub, fontSize: 12 }}>
                    {fmt(admin.role_created_at)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    {admin.is_super_admin ? (
                      <span style={{ color: T.sub, fontSize: 11, fontStyle: "italic" }}>Protected</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1"
                          style={{ color: admin.is_disabled ? "#10b981" : "#ef4444" }}
                          onClick={() => setConfirmBlock(admin)}
                        >
                          {admin.is_disabled
                            ? <><ShieldCheck className="h-3 w-3" /> Unblock</>
                            : <><ShieldOff className="h-3 w-3" /> Block</>}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 text-red-500 hover:text-red-600"
                          onClick={() => setConfirmRevoke(admin)}
                        >
                          <UserMinus className="h-3 w-3" /> Remove Role
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 20px" }} className="flex items-center justify-between">
            <span style={{ color: T.sub, fontSize: 13 }}>
              {filtered.length} admin{filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span style={{ color: T.text, fontSize: 13 }}>{page} / {totalPages}</span>
              <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={addOpen} onOpenChange={o => { if (!o) { setAddOpen(false); setAddEmail(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-400" />
              Add New Admin
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Enter the email address of an existing user to grant them admin access.
            </p>
            <input
              type="email"
              value={addEmail}
              onChange={e => setAddEmail(e.target.value)}
              placeholder="user@example.com"
              style={inp}
              onKeyDown={e => e.key === "Enter" && handleAddAdmin()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setAddEmail(""); }} disabled={addLoading}>Cancel</Button>
            <Button onClick={handleAddAdmin} disabled={addLoading || !addEmail.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {addLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
              Grant Admin Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirm */}
      <AlertDialog open={!!confirmRevoke} onOpenChange={o => { if (!o) setConfirmRevoke(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Role</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove admin access for <strong>{confirmRevoke?.email}</strong>. They will no longer be able to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRevoke && handleRevoke(confirmRevoke)}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : null}
              Remove Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Confirm */}
      <AlertDialog open={!!confirmBlock} onOpenChange={o => { if (!o) setConfirmBlock(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmBlock?.is_disabled ? "Unblock Admin" : "Block Admin"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmBlock?.is_disabled
                ? `This will restore login access for ${confirmBlock?.email}.`
                : `This will block ${confirmBlock?.email} from logging in.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmBlock && handleToggleBlock(confirmBlock)}
              disabled={processing}
              className={confirmBlock?.is_disabled ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
            >
              {processing ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : null}
              {confirmBlock?.is_disabled ? "Unblock" : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default AdminAdmins;
