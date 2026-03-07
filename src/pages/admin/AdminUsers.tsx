import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CheckCircle, XCircle, Eye, Search, X, ChevronLeft, ChevronRight, Pencil, ShieldOff, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import UserDetailDialog, { type FullProfile } from "@/components/admin/UserDetailDialog";

const PAGE_SIZE = 15;

const AdminUsers = () => {
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
  const [confirmAction, setConfirmAction] = useState<{ type: "block" | "unblock" | "delete"; user: FullProfile } | null>(null);
  const [actionProcessing, setActionProcessing] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteType, setInviteType] = useState<string>("employee");
  const [inviteProcessing, setInviteProcessing] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, user_code, email, user_type, approval_status, mobile_number, whatsapp_number, gender, date_of_birth, marital_status, education_level, previous_job_details, work_experience, education_background, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, created_at, approval_notes, approved_at, is_disabled")
      .order("created_at", { ascending: false });
    setProfiles((data as FullProfile[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

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
      fetchProfiles();
    }
  };

  const handlePermanentDelete = async (user: FullProfile) => {
    setActionProcessing(true);
    const { data, error } = await supabase.functions.invoke("admin-user-management", {
      body: { action: "permanent_delete", profile_id: user.id },
    });
    setActionProcessing(false);
    setConfirmAction(null);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Delete failed");
    } else {
      toast.success("User permanently deleted");
      fetchProfiles();
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) { toast.error("Email is required"); return; }
    setInviteProcessing(true);
    const { data, error } = await supabase.functions.invoke("admin-user-management", {
      body: { action: "invite_user", email: inviteEmail.trim().toLowerCase(), user_type: inviteType },
    });
    setInviteProcessing(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Failed to send invite");
    } else {
      toast.success(data?.message || "Invite sent successfully");
      setInviteOpen(false);
      setInviteEmail("");
      setInviteType("employee");
      fetchProfiles();
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

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return profiles.filter((p) => {
      if (typeFilter !== "all" && p.user_type !== typeFilter) return false;
      if (!q) return true;
      const name = (p.full_name?.[0] || "").toLowerCase();
      const code = (p.user_code?.[0] || "").toLowerCase();
      const email = (p.email || "").toLowerCase();
      return name.includes(q) || code.includes(q) || email.includes(q);
    });
  }, [profiles, searchQuery, typeFilter]);

  const filterByStatus = (status: string | null) =>
    status ? filtered.filter((p) => p.approval_status === status) : filtered;

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, typeFilter]);

  const UserTable = ({ users }: { users: FullProfile[] }) => {
    const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
    const page = Math.min(currentPage, totalPages);
    const paginated = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
      <div className="space-y-3">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No users found</TableCell>
                </TableRow>
              ) : (
                paginated.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name?.[0] || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{u.user_code?.[0] || "—"}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{u.user_type}</Badge></TableCell>
                    <TableCell className="max-w-[160px] truncate text-sm">{u.email}</TableCell>
                    <TableCell>{statusBadge(u.approval_status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/users/${u.id}`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setSelectedUser(u); setActionType("view"); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {u.approval_status === "pending" && (
                          <>
                            <Button size="icon" variant="ghost" className="text-accent hover:text-accent" onClick={() => { setSelectedUser(u); setActionType("approve"); }}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { setSelectedUser(u); setActionType("reject"); }}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          title={(u as any).is_disabled ? "Unblock" : "Block"}
                          className={(u as any).is_disabled ? "text-accent hover:text-accent" : "text-warning hover:text-warning"}
                          onClick={() => setConfirmAction({ type: (u as any).is_disabled ? "unblock" : "block", user: u })}
                        >
                          {(u as any).is_disabled ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Delete Permanently"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setConfirmAction({ type: "delete", user: u })}
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
        {users.length > PAGE_SIZE && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, users.length)} of {users.length}
            </p>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="h-8 w-8" disabled={page <= 1} onClick={() => setCurrentPage(page - 1)}>
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
                    <span key={`e${i}`} className="px-1 text-sm text-muted-foreground">…</span>
                  ) : (
                    <Button key={p} size="icon" variant={p === page ? "default" : "outline"} className="h-8 w-8 text-xs" onClick={() => setCurrentPage(p)}>
                      {p}
                    </Button>
                  )
                )}
              <Button size="icon" variant="outline" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setCurrentPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">User Management</h2>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or code…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="User type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({filterByStatus("pending").length})</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="pending"><UserTable users={filterByStatus("pending")} /></TabsContent>
        <TabsContent value="approved"><UserTable users={filterByStatus("approved")} /></TabsContent>
        <TabsContent value="rejected"><UserTable users={filterByStatus("rejected")} /></TabsContent>
        <TabsContent value="all"><UserTable users={filterByStatus(null)} /></TabsContent>
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

      {/* Block/Delete Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "delete"
                ? "Permanently Delete User?"
                : confirmAction?.type === "block"
                ? "Block User?"
                : "Unblock User?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "delete"
                ? `This will permanently delete "${confirmAction.user.full_name?.[0]}" and all their data. This CANNOT be undone.`
                : confirmAction?.type === "block"
                ? `This will block "${confirmAction?.user.full_name?.[0]}" from logging in. You can unblock them later.`
                : `This will re-enable login access for "${confirmAction?.user.full_name?.[0]}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={actionProcessing}
              className={confirmAction?.type === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              onClick={() => {
                if (!confirmAction) return;
                if (confirmAction.type === "delete") handlePermanentDelete(confirmAction.user);
                else handleToggleBlock(confirmAction.user);
              }}
            >
              {actionProcessing ? "Processing…" : confirmAction?.type === "delete" ? "Delete" : confirmAction?.type === "block" ? "Block" : "Unblock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
