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
import { Search, X, ChevronLeft, ChevronRight, Pencil, Users, Wallet, FolderOpen, ShieldOff, ShieldCheck, Trash2, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const PAGE_SIZE = 15;

type ClientRow = {
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

const AdminClients = () => {
  const { theme, themeKey } = useDashboardTheme();
  const T = TH[themeKey];
  const navigate = useNavigate();
  const [employers, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({});
  const [confirmAction, setConfirmAction] = useState<{ type: "block" | "unblock" | "delete"; employer: ClientRow } | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: cls }, { data: projs }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, user_code, email, approval_status, available_balance, hold_balance, is_disabled, created_at, mobile_number")
        .eq("user_type", "client")
        .order("created_at", { ascending: false }),
      supabase
        .from("projects")
        .select("client_id"),
    ]);

    setClients((cls as ClientRow[]) || []);

    const pc: Record<string, number> = {};
    (projs || []).forEach((p: any) => { pc[p.client_id] = (pc[p.client_id] || 0) + 1; });
    setProjectCounts(pc);

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggleBlock = async (employer: ClientRow) => {
    setProcessing(true);
    const newDisabled = !employer.is_disabled;
    const { error } = await supabase
      .from("profiles")
      .update({ is_disabled: newDisabled, disabled_reason: newDisabled ? "Blocked by admin" : null })
      .eq("id", employer.id);
    setProcessing(false);
    setConfirmAction(null);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(newDisabled ? "Employer blocked" : "Employer unblocked");
      fetchData();
    }
  };

  const handlePermanentDelete = async (employer: ClientRow) => {
    setProcessing(true);
    const { data, error } = await supabase.functions.invoke("admin-user-management", {
      body: { action: "permanent_delete", profile_id: employer.id },
    });
    setProcessing(false);
    setConfirmAction(null);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Delete failed");
    } else {
      toast.success("Employer permanently deleted");
      fetchData();
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return employers;
    return employers.filter((c) => {
      const name = (c.full_name?.[0] || "").toLowerCase();
      const code = (c.user_code?.[0] || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      return name.includes(q) || code.includes(q) || email.includes(q);
    });
  }, [employers, searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalBalance = employers.reduce((s, c) => s + Number(c.available_balance), 0);
  const activeCount = employers.filter((c) => c.approval_status === "approved" && !c.is_disabled).length;
  const totalProjects = Object.values(projectCounts).reduce((s, v) => s + v, 0);

  const statusBadge = (c: ClientRow) => {
    if (c.is_disabled) return <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30">Disabled</Badge>;
    const map: Record<string, string> = {
      pending: "bg-warning/15 text-warning border-warning/30",
      approved: "bg-accent/15 text-accent border-accent/30",
      rejected: "bg-destructive/15 text-destructive border-destructive/30",
    };
    return <Badge variant="outline" className={map[c.approval_status] || ""}>{c.approval_status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div 
        className="relative overflow-hidden rounded-3xl p-8 mb-8"
        style={{ background: `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)` }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <Building className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Employers</h2>
              <p className="text-indigo-100 opacity-80">Manage platform employers and their projects</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-none backdrop-blur-md" style={{ background: T.card }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: T.sub }}>Total Employers</CardTitle>
            <Users className="h-5 w-5 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ color: T.text }}>
              {employers.length} 
              <span className="text-sm font-normal ml-2" style={{ color: T.sub }}>({activeCount} active)</span>
            </p>
          </CardContent>
        </Card>
        <Card className="border-none backdrop-blur-md" style={{ background: T.card }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: T.sub }}>Total Balance</CardTitle>
            <Wallet className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ color: T.text }}>₹{totalBalance.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border-none backdrop-blur-md" style={{ background: T.card }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: T.sub }}>Total Projects</CardTitle>
            <FolderOpen className="h-5 w-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ color: T.text }}>{totalProjects}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div 
        className="relative max-w-md p-1 rounded-2xl border backdrop-blur-md"
        style={{ background: T.card, borderColor: T.border }}
      >
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: T.sub }} />
        <Input 
          placeholder="Search by name, email, or code…" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="pl-10 pr-10 border-none h-11 rounded-xl"
          style={{ background: T.input, color: T.text }}
        />
        {searchQuery && (
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 hover:bg-white/10" 
            onClick={() => setSearchQuery("")}
          >
            <X className="h-3.5 w-3.5" style={{ color: T.sub }} />
          </Button>
        )}
      </div>

      {/* Table */}
      <div 
        className="overflow-x-auto rounded-2xl border backdrop-blur-md"
        style={{ background: T.card, borderColor: T.border }}
      >
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: T.border }}>
              <TableHead style={{ color: T.sub }}>Name</TableHead>
              <TableHead style={{ color: T.sub }}>Code</TableHead>
              <TableHead style={{ color: T.sub }}>Email</TableHead>
              <TableHead className="text-right" style={{ color: T.sub }}>Balance</TableHead>
              <TableHead className="text-center" style={{ color: T.sub }}>Projects</TableHead>
              <TableHead style={{ color: T.sub }}>Status</TableHead>
              <TableHead className="text-right" style={{ color: T.sub }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center" style={{ color: T.sub }}>Loading…</TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center" style={{ color: T.sub }}>No employers found</TableCell>
              </TableRow>
            ) : (
              paginated.map((c) => (
                <TableRow key={c.id} style={{ borderColor: T.border }}>
                  <TableCell className="font-medium" style={{ color: T.text }}>{c.full_name?.[0] || "—"}</TableCell>
                  <TableCell className="font-mono text-xs" style={{ color: T.sub }}>{c.user_code?.[0] || "—"}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-sm" style={{ color: T.sub }}>{c.email}</TableCell>
                  <TableCell className="text-right font-mono text-sm" style={{ color: T.text }}>₹{Number(c.available_balance).toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-center" style={{ color: T.text }}>{projectCounts[c.id] || 0}</TableCell>
                  <TableCell>{statusBadge(c)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => navigate(`/admin/users/${c.id}`)}
                        className="hover:bg-white/10"
                        style={{ color: T.sub }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={c.is_disabled ? "Unblock" : "Block"}
                        className={c.is_disabled ? "text-accent hover:text-accent hover:bg-white/10" : "text-warning hover:text-warning hover:bg-white/10"}
                        onClick={() => setConfirmAction({ type: c.is_disabled ? "unblock" : "block", employer: c })}
                      >
                        {c.is_disabled ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Delete Permanently"
                        className="text-destructive hover:text-destructive hover:bg-white/10"
                        onClick={() => setConfirmAction({ type: "delete", employer: c })}
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
          <p className="text-sm" style={{ color: T.sub }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button 
              size="icon" 
              variant="outline" 
              className="h-8 w-8" 
              disabled={page <= 1} 
              onClick={() => setCurrentPage(page - 1)}
              style={{ background: T.nav, borderColor: T.border, color: T.text }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="outline" 
              className="h-8 w-8" 
              disabled={page >= totalPages} 
              onClick={() => setCurrentPage(page + 1)}
              style={{ background: T.nav, borderColor: T.border, color: T.text }}
            >
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
              {confirmAction?.type === "delete"
                ? "Permanently Delete Employer?"
                : confirmAction?.type === "block"
                ? "Block Employer?"
                : "Unblock Employer?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "delete"
                ? `This will permanently delete "${confirmAction.employer.full_name?.[0]}" and all their data. This CANNOT be undone.`
                : confirmAction?.type === "block"
                ? `This will block "${confirmAction?.employer.full_name?.[0]}" from logging in. You can unblock them later.`
                : `This will re-enable login access for "${confirmAction?.employer.full_name?.[0]}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={processing}
              className={confirmAction?.type === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              onClick={() => {
                if (!confirmAction) return;
                if (confirmAction.type === "delete") handlePermanentDelete(confirmAction.employer);
                else handleToggleBlock(confirmAction.employer);
              }}
            >
              {processing ? "Processing…" : confirmAction?.type === "delete" ? "Delete" : confirmAction?.type === "block" ? "Block" : "Unblock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminClients;
