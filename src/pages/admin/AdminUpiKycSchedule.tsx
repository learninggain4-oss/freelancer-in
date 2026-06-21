import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, Loader2, Save, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", input: "rgba(255,255,255,.07)" },
  white: { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
  wb:    { card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", input: "#f8fafc" },
};

type Row = {
  id: string;
  full_name: string[] | string | null;
  user_code: string[] | string | null;
  email: string | null;
  user_type: string | null;
  mobile_number: string | null;
  kyc_window_start: string | null;
  kyc_window_end: string | null;
};

const valueOf = (v: string[] | string | null | undefined) =>
  Array.isArray(v) ? v[0] || "" : v || "";

const fmt = (t: string | null) => (t ? t.slice(0, 5) : "");

const AdminUpiKycSchedule = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);

  const queryKey = ["admin-upi-kyc-schedule"];

  const { data: rows = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, user_code, email, user_type, mobile_number, kyc_window_start, kyc_window_end")
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  useEffect(() => {
    if (editing) {
      setStart(fmt(editing.kyc_window_start));
      setEnd(fmt(editing.kyc_window_end));
    }
  }, [editing]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      valueOf(r.full_name).toLowerCase().includes(q) ||
      valueOf(r.user_code).toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      (r.mobile_number || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const save = async () => {
    if (!editing) return;
    if (!start || !end) {
      toast.error("Start and End time required");
      return;
    }
    if (start === end) {
      toast.error("Start and End time cannot be the same");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ kyc_window_start: start, kyc_window_end: end, kyc_window_changed_at: null })
      .eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Time window updated");
    setEditing(null);
    queryClient.invalidateQueries({ queryKey });
  };

  const clearWindow = async (id: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ kyc_window_start: null, kyc_window_end: null })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cleared");
    queryClient.invalidateQueries({ queryKey });
  };

  const configured = rows.filter((r) => r.kyc_window_start && r.kyc_window_end).length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/upi-kyc-management")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: T.text }}>
            KYC Enable Setup Time
          </h1>
          <p className="mt-1 text-sm" style={{ color: T.sub }}>
            Manage daily KYC Enable time windows for freelancers & employers.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card style={{ backgroundColor: T.card, borderColor: T.border }}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: "#6366f118", color: "#6366f1" }}>
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: T.text }}>{rows.length}</p>
              <p className="text-xs" style={{ color: T.sub }}>Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: T.card, borderColor: T.border }}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: "#16a34a18", color: "#16a34a" }}>
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: T.text }}>{configured}</p>
              <p className="text-xs" style={{ color: T.sub }}>Window Configured</p>
            </div>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: T.card, borderColor: T.border }}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: "#f59e0b18", color: "#f59e0b" }}>
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: T.text }}>{rows.length - configured}</p>
              <p className="text-xs" style={{ color: T.sub }}>Not Configured</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card style={{ backgroundColor: T.card, borderColor: T.border }}>
        <CardContent className="space-y-4 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: T.sub }} />
            <Input
              className="pl-9"
              placeholder="Search name, user code, email, mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ backgroundColor: T.input, color: T.text, borderColor: T.border }}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: T.border }}>
                  {["User", "User Type", "Start Time", "End Time", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: T.sub }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, row) => (
                    <tr key={row} className="border-b" style={{ borderColor: T.border }}>
                      {Array.from({ length: 6 }).map((__, col) => (
                        <td key={col} className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((r) => {
                    const configured = r.kyc_window_start && r.kyc_window_end;
                    return (
                      <tr key={r.id} className="border-b last:border-0" style={{ borderColor: T.border }}>
                        <td className="px-3 py-3">
                          <p className="font-medium" style={{ color: T.text }}>{valueOf(r.full_name) || "User"}</p>
                          <p className="text-xs" style={{ color: T.sub }}>{valueOf(r.user_code) || r.email || "-"}</p>
                        </td>
                        <td className="px-3 py-3 capitalize" style={{ color: T.text }}>{r.user_type || "-"}</td>
                        <td className="px-3 py-3 font-mono" style={{ color: T.text }}>{fmt(r.kyc_window_start) || "-"}</td>
                        <td className="px-3 py-3 font-mono" style={{ color: T.text }}>{fmt(r.kyc_window_end) || "-"}</td>
                        <td className="px-3 py-3">
                          {configured ? (
                            <Badge variant="default">Configured</Badge>
                          ) : (
                            <Badge variant="secondary">Not Set</Badge>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                              Edit
                            </Button>
                            {configured && (
                              <Button size="sm" variant="ghost" onClick={() => clearWindow(r.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center" style={{ color: T.sub }}>No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set KYC Enable Time Window</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {valueOf(editing?.full_name) || "User"} ({valueOf(editing?.user_code) || editing?.email})
            </p>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUpiKycSchedule;
