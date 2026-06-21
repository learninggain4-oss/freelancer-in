import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, CheckCircle2, Clock, Phone, Search, Send, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type Row = {
  id: string;
  full_name: string[] | string | null;
  user_code: string[] | string | null;
  email: string | null;
  user_type: string | null;
  mobile_number: string | null;
  verification: {
    id: string;
    otp: string | null;
    otp_sent_at: string | null;
    submitted_at: string | null;
    send_count: number | null;
    status: string | null;
    updated_at: string | null;
  } | null;
};

const valueOf = (v: string[] | string | null | undefined) =>
  Array.isArray(v) ? v[0] || "" : v || "";

const statusBadge = (status: string | null) => {
  if (status === "verified")     return <Badge variant="outline" className="gap-1" style={{ color: "#16a34a", borderColor: "#16a34a55" }}><CheckCircle2 className="h-3 w-3" />Verified</Badge>;
  if (status === "incorrect")    return <Badge variant="outline" className="gap-1" style={{ color: "#ef4444", borderColor: "#ef444455" }}><XCircle className="h-3 w-3" />Incorrect OTP</Badge>;
  if (status === "pending_review") return <Badge variant="outline" className="gap-1" style={{ color: "#f59e0b", borderColor: "#f59e0b55" }}><Clock className="h-3 w-3" />Pending Review</Badge>;
  if (status === "otp_sent")     return <Badge variant="outline" className="gap-1" style={{ color: "#3b82f6", borderColor: "#3b82f655" }}><Send className="h-3 w-3" />OTP Sent</Badge>;
  return <Badge variant="outline" className="gap-1" style={{ color: "#94a3b8", borderColor: "#94a3b855" }}><Phone className="h-3 w-3" />Not Started</Badge>;
};

const formatDt = (t: string | null | undefined) =>
  t ? new Date(t).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—";

const AdminMobileVerifications = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const queryKey = ["admin-mobile-verifications"];

  const { data: rows = [], isLoading } = useQuery({
    queryKey,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data: profiles, error } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, user_code, email, user_type, mobile_number")
        .not("mobile_number", "is", null)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(1000);
      if (error) throw error;

      const ids = (profiles ?? []).map((p: any) => p.id);
      let verMap = new Map<string, any>();
      if (ids.length) {
        const { data: vers } = await (supabase as any)
          .from("mobile_verifications")
          .select("id, profile_id, otp, otp_sent_at, submitted_at, send_count, status, updated_at")
          .in("profile_id", ids);
        (vers ?? []).forEach((v: any) => verMap.set(v.profile_id, v));
      }

      return (profiles ?? []).map((p: any) => ({
        ...p,
        verification: verMap.get(p.id) ?? null,
      })) as Row[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ row, status }: { row: Row; status: "verified" | "incorrect" }) => {
      if (!row.verification?.id) throw new Error("User has not sent an OTP yet");
      const { error } = await (supabase as any)
        .from("mobile_verifications")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", row.verification.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.status === "verified" ? "Marked as Verified" : "Marked as Incorrect OTP");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

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

  const verifiedCount = rows.filter((r) => r.verification?.status === "verified").length;
  const pendingCount = rows.filter((r) => r.verification?.status === "pending_review").length;


  return (
    <div className="space-y-6 p-4 md:p-6 min-h-screen" style={{ backgroundColor: T.bg, color: T.text }}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border p-6" style={{ background: T.card, borderColor: T.border }}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500/15 p-2">
            <ShieldCheck className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mobile Verifications</h1>
            <p className="text-sm" style={{ color: T.sub }}>Send OTPs and verify user mobile numbers</p>
          </div>
        </div>
        <Button onClick={() => navigate("/admin/mobile-verify-schedule")} className="gap-2">
          <CalendarClock className="h-4 w-4" /> Verify Setup Time
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card style={{ background: T.card, borderColor: T.border }}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: T.text }}>{rows.length}</p>
            <p className="text-xs" style={{ color: T.sub }}>Total Users</p>
          </CardContent>
        </Card>
        <Card style={{ background: T.card, borderColor: T.border }}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "#f59e0b" }}>{pendingCount}</p>
            <p className="text-xs" style={{ color: T.sub }}>OTP Sent</p>
          </CardContent>
        </Card>
        <Card style={{ background: T.card, borderColor: T.border }}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "#16a34a" }}>{verifiedCount}</p>
            <p className="text-xs" style={{ color: T.sub }}>Verified</p>
          </CardContent>
        </Card>
      </div>

      <Card style={{ background: T.card, borderColor: T.border }}>
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
                  {["User", "User Type", "Mobile Number", "Send OTP", "OTP", "Status", "Updated"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: T.sub }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, row) => (
                    <tr key={row} className="border-b" style={{ borderColor: T.border }}>
                      {Array.from({ length: 7 }).map((__, col) => (
                        <td key={col} className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((r) => (
                    <tr key={r.id} className="border-b last:border-0" style={{ borderColor: T.border }}>
                      <td className="px-3 py-3">
                        <p className="font-medium" style={{ color: T.text }}>{valueOf(r.full_name) || "User"}</p>
                        <p className="text-xs" style={{ color: T.sub }}>{valueOf(r.user_code) || r.email || "-"}</p>
                      </td>
                      <td className="px-3 py-3 capitalize" style={{ color: T.text }}>{r.user_type || "-"}</td>
                      <td className="px-3 py-3 font-mono" style={{ color: T.text }}>{r.mobile_number || "-"}</td>
                      <td className="px-3 py-3">
                        {r.verification?.send_count ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold" style={{ color: T.text }}>{r.verification.send_count}×</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          </div>
                        ) : (
                          <span style={{ color: T.sub }}>—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono text-base" style={{ color: T.text }}>
                        {r.verification?.otp || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          {statusBadge(r.verification?.status ?? null)}
                          {r.verification?.id && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-emerald-600" disabled={setStatus.isPending || r.verification?.status === "verified"} onClick={() => setStatus.mutate({ row: r, status: "verified" })}>
                                Verified
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-destructive" disabled={setStatus.isPending || r.verification?.status === "incorrect"} onClick={() => setStatus.mutate({ row: r, status: "incorrect" })}>
                                Incorrect OTP
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs" style={{ color: T.sub }}>
                        {formatDt(r.verification?.updated_at || r.verification?.otp_sent_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center" style={{ color: T.sub }}>No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMobileVerifications;
