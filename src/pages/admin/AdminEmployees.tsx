import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Search, X, ChevronLeft, ChevronRight, Pencil, Eye, Users, Wallet, Briefcase, ShieldOff, ShieldCheck, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const PAGE_SIZE = 15;

type EmployeeRow = {
  id: string;
  full_name: string[];
  user_code: string[];
  email: string;
  approval_status: string;
  available_balance: number;
  hold_balance: number;
  is_disabled: boolean;
  created_at: string;
  mobile_number: string | null;
};

const AdminEmployees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({});
  const [withdrawalCounts, setWithdrawalCounts] = useState<Record<string, number>>({});
  const [confirmAction, setConfirmAction] = useState<{ type: "block" | "unblock" | "delete"; employee: EmployeeRow } | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: emps }, { data: apps }, { data: wds }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, user_code, email, approval_status, available_balance, hold_balance, is_disabled, created_at, mobile_number")
        .eq("user_type", "employee")
        .order("created_at", { ascending: false }),
      supabase
        .from("project_applications")
        .select("employee_id, status")
        .eq("status", "approved"),
      supabase
        .from("withdrawals")
        .select("employee_id, status")
        .eq("status", "pending"),
    ]);

    setEmployees((emps as EmployeeRow[]) || []);

    const pc: Record<string, number> = {};
    (apps || []).forEach((a: any) => { pc[a.employee_id] = (pc[a.employee_id] || 0) + 1; });
    setProjectCounts(pc);

    const wc: Record<string, number> = {};
    (wds || []).forEach((w: any) => { wc[w.employee_id] = (wc[w.employee_id] || 0) + 1; });
    setWithdrawalCounts(wc);

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggleBlock = async (employee: EmployeeRow) => {
    setProcessing(true);
    const newDisabled = !employee.is_disabled;
    const { error } = await supabase
      .from("profiles")
      .update({ is_disabled: newDisabled, disabled_reason: newDisabled ? "Blocked by admin" : null })
      .eq("id", employee.id);
    setProcessing(false);
    setConfirmAction(null);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(newDisabled ? "User blocked" : "User unblocked");
      fetchData();
    }
  };

  const handlePermanentDelete = async (employee: EmployeeRow) => {
    setProcessing(true);
    const { data, error } = await supabase.functions.invoke("admin-user-management", {
      body: { action: "permanent_delete", profile_id: employee.id },
    });
    setProcessing(false);
    setConfirmAction(null);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Delete failed");
    } else {
      toast.success("Employee permanently deleted");
      fetchData();
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter((e) => {
      const name = (e.full_name?.[0] || "").toLowerCase();
      const code = (e.user_code?.[0] || "").toLowerCase();
      const email = (e.email || "").toLowerCase();
      return name.includes(q) || code.includes(q) || email.includes(q);
    });
  }, [employees, searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalBalance = employees.reduce((s, e) => s + Number(e.available_balance), 0);
  const activeCount = employees.filter((e) => e.approval_status === "approved" && !e.is_disabled).length;
  const pendingWd = Object.values(withdrawalCounts).reduce((s, v) => s + v, 0);

  const statusBadge = (e: EmployeeRow) => {
    if (e.is_disabled) return <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30">Disabled</Badge>;
    const map: Record<string, string> = {
      pending: "bg-warning/15 text-warning border-warning/30",
      approved: "bg-accent/15 text-accent border-accent/30",
      rejected: "bg-destructive/15 text-destructive border-destructive/30",
    };
    return <Badge variant="outline" className={map[e.approval_status] || ""}>{e.approval_status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Employees</h2>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{employees.length} <span className="text-sm font-normal text-muted-foreground">({activeCount} active)</span></p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            <Wallet className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">₹{totalBalance.toLocaleString("en-IN")}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Withdrawals</CardTitle>
            <Briefcase className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{pendingWd}</p></CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, email, or code…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-9" />
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
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-center">Projects</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No employees found</TableCell></TableRow>
            ) : (
              paginated.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.full_name?.[0] || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{e.user_code?.[0] || "—"}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-sm">{e.email}</TableCell>
                  <TableCell className="text-right font-mono text-sm">₹{Number(e.available_balance).toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-center">{projectCounts[e.id] || 0}</TableCell>
                  <TableCell>{statusBadge(e)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/users/${e.id}`)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
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
          <p className="text-sm text-muted-foreground">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page <= 1} onClick={() => setCurrentPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setCurrentPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmployees;
