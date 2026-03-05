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
  Search, X, ChevronLeft, ChevronRight, LogOut, Trash2, Users, Activity, ShieldOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

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
    try { return format(new Date(d), "dd MMM yyyy, HH:mm"); } catch { return "—"; }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Sessions & User Control</h2>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Auth Users</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{users.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active (24h)</CardTitle>
            <Activity className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{recentlyActive}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blocked</CardTitle>
            <ShieldOff className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{disabledCount}</p></CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, email, or code…" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-9 pr-9" />
        {searchQuery && (
          <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2" onClick={() => setSearchQuery("")}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No users found</TableCell></TableRow>
            ) : (
              paginated.map((u) => (
                <TableRow key={u.auth_user_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{u.full_name || "No profile"}</p>
                      <p className="text-xs text-muted-foreground font-mono">{u.user_code || "—"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.user_type ? (
                      <Badge variant="secondary" className="capitalize">{u.user_type}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate text-sm">{u.email}</TableCell>
                  <TableCell className="text-sm">{formatDate(u.last_sign_in_at)}</TableCell>
                  <TableCell>
                    {u.is_disabled ? (
                      <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30">Blocked</Badge>
                    ) : u.approval_status === "approved" ? (
                      <Badge variant="outline" className="bg-accent/15 text-accent border-accent/30">Active</Badge>
                    ) : u.approval_status ? (
                      <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30">{u.approval_status}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">No profile</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {u.profile_id && (
                        <Button size="icon" variant="ghost" title="Edit Profile" onClick={() => navigate(`/admin/users/${u.profile_id}`)}>
                          <Search className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Force Logout"
                        className="text-warning hover:text-warning"
                        onClick={() => setConfirmAction({ type: "force_logout", user: u })}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Permanently Delete"
                        className="text-destructive hover:text-destructive"
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

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page <= 1} onClick={() => setCurrentPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setCurrentPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "force_logout" ? "Force Logout User?" : "Permanently Delete User?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "force_logout"
                ? `This will sign out "${confirmAction.user.full_name || confirmAction.user.email}" from all devices and sessions immediately.`
                : `This will permanently delete "${confirmAction?.user.full_name || confirmAction?.user.email}" and all their data. This action CANNOT be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={processing}
              className={confirmAction?.type === "permanent_delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
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
