import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search, X, ChevronLeft, ChevronRight, LogOut, Trash2, Users, Activity, ShieldOff, Command, ShieldCheck, Mail
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt, safeDist } from "@/lib/admin-date";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const PAGE_SIZE = 15;

type SessionUser = {
  auth_user_id: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
  profile_id: string | null;
  full_name: string | null;
  user_code: string | null;
  user_type: string | null;
  is_disabled: boolean;
  approval_status: string | null;
};

const AdminSessions = () => {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{
    type: "force_logout" | "permanent_delete";
    user: SessionUser;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "list_users_sessions" },
      });
      if (error) throw error;
      return (data?.users || []) as SessionUser[];
    },
  });

  const filtered = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.email || "").toLowerCase().includes(q) ||
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.user_code || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const recentlyActive = users.filter((u) => {
    if (!u.last_sign_in_at) return false;
    const diff = Date.now() - new Date(u.last_sign_in_at).getTime();
    return diff < 24 * 60 * 60 * 1000; // 24 hours
  }).length;

  const disabledCount = users.filter((u) => u.is_disabled).length;

  const handleAction = async () => {
    if (!confirmAction) return;
    setProcessing(true);

    const body =
      confirmAction.type === "force_logout"
        ? { action: "force_logout", user_id: confirmAction.user.auth_user_id }
        : { action: "permanent_delete", profile_id: confirmAction.user.profile_id };

    const { data, error } = await supabase.functions.invoke("admin-user-management", { body });

    setProcessing(false);
    setConfirmAction(null);

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Action failed");
    } else {
      toast.success(data?.message || "Action completed");
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "Never";
    try { return safeFmt(d, "dd MMM yyyy, HH:mm"); } catch { return "—"; }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8 border"
        style={{ 
          background: theme === 'black' 
            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
            : 'linear-gradient(135deg, #6366f1 0%, #a5b4fc 100%)',
          borderColor: T.border 
        }}
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5 blur-xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl">
            <Command className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Sessions & User Control</h1>
            <p className="text-white/80 font-medium">Manage active sessions and account access</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Auth Users", value: users.length, icon: Users, color: "text-blue-400" },
          { label: "Active (24h)", value: recentlyActive, icon: Activity, color: "text-emerald-400" },
          { label: "Blocked", value: disabledCount, icon: ShieldOff, color: "text-destructive" },
        ].map((s, idx) => (
          <Card key={idx} style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium" style={{ color: T.sub }}>{s.label}</p>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-3xl font-bold" style={{ color: T.text }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, or code…" 
            value={searchQuery} 
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
            className="pl-9 pr-9" 
            style={{ background: T.input, borderColor: T.border, color: T.text }}
          />
          {searchQuery && (
            <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2" onClick={() => setSearchQuery("")}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <Card style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-none overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader style={{ background: T.nav }}>
                  <TableRow style={{ borderColor: T.border }} className="hover:bg-transparent">
                    <TableHead style={{ color: T.sub }}>User</TableHead>
                    <TableHead style={{ color: T.sub }}>Type</TableHead>
                    <TableHead style={{ color: T.sub }}>Account Info</TableHead>
                    <TableHead style={{ color: T.sub }}>Last Session</TableHead>
                    <TableHead style={{ color: T.sub }}>Status</TableHead>
                    <TableHead style={{ color: T.sub }} className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow style={{ borderColor: T.border }}>
                      <TableCell colSpan={6} className="py-24 text-center" style={{ color: T.sub }}>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-24 text-center" style={{ color: T.sub }}>No users found</TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((u) => (
                      <TableRow key={u.auth_user_id} style={{ borderColor: T.border }} className="hover:bg-white/5 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-semibold" style={{ color: T.text }}>{u.full_name || "No profile"}</p>
                            <p className="text-xs font-mono opacity-60" style={{ color: T.sub }}>{u.user_code || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.user_type ? (
                            <Badge variant="outline" className="capitalize border-white/10" style={{ color: T.sub }}>{u.user_type}</Badge>
                          ) : (
                            <span className="text-xs opacity-40" style={{ color: T.sub }}>—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 max-w-[180px]">
                            <Mail className="h-3.5 w-3.5 opacity-50" style={{ color: T.sub }} />
                            <span className="text-sm truncate" style={{ color: T.text }}>{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium" style={{ color: T.text }}>{formatDate(u.last_sign_in_at)}</span>
                            <span className="text-[10px] opacity-50" style={{ color: T.sub }}>Sign-in Time</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.is_disabled ? (
                            <Badge className="bg-destructive/15 text-destructive border-none">Blocked</Badge>
                          ) : u.approval_status === "approved" ? (
                            <Badge className="bg-accent/15 text-accent border-none">Active</Badge>
                          ) : u.approval_status ? (
                            <Badge className="bg-warning/15 text-warning border-none">{u.approval_status}</Badge>
                          ) : (
                            <Badge variant="outline" className="opacity-40 border-white/10" style={{ color: T.sub }}>No profile</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {u.profile_id && (
                              <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl border-white/10 bg-white/5 hover:bg-white/10" title="Edit Profile" onClick={() => navigate(`/admin/users/${u.profile_id}`)}>
                                <Search className="h-4 w-4" style={{ color: T.sub }} />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="outline"
                              title="Force Logout"
                              className="h-9 w-9 rounded-xl border-white/10 bg-white/5 hover:bg-warning/10 text-warning hover:text-warning"
                              onClick={() => setConfirmAction({ type: "force_logout", user: u })}
                            >
                              <LogOut className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              title="Permanently Delete"
                              className="h-9 w-9 rounded-xl border-white/10 bg-white/5 hover:bg-destructive/10 text-destructive hover:text-destructive"
                              onClick={() => setConfirmAction({ type: "permanent_delete", user: u })}
                              disabled={!u.profile_id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm" style={{ color: T.sub }}>
          <p>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl border-white/10 bg-white/5 hover:bg-white/10" disabled={page <= 1} onClick={() => setCurrentPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl border-white/10 bg-white/5 hover:bg-white/10" disabled={page >= totalPages} onClick={() => setCurrentPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="bg-[#0a0a1a]/95 backdrop-blur-xl border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {confirmAction?.type === "force_logout" ? "Force Logout User?" : "Permanently Delete User?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {confirmAction?.type === "force_logout"
                ? `This will sign out "${confirmAction.user.full_name || confirmAction.user.email}" from all devices and sessions immediately.`
                : `This will permanently delete "${confirmAction?.user.full_name || confirmAction?.user.email}" and all their data. This action CANNOT be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing} className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={processing}
              className={confirmAction?.type === "permanent_delete" ? "bg-destructive text-white hover:bg-destructive/90" : "bg-primary text-white hover:bg-primary/90"}
            >
              {processing ? "Processing…" : confirmAction?.type === "force_logout" ? "Force Logout" : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSessions;
