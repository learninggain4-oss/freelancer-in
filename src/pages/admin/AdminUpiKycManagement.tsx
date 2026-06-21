import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Clock, Copy, Download, Search, ShieldCheck, Smartphone, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)" },
  white: { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
  wb:    { card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc" },
};

type UpiKycRecord = {
  id: string;
  profile_id: string;
  payment_method_id: string;
  phone_number: string | null;
  is_primary: boolean;
  kyc_status?: string | null;
  otp_requested?: boolean | null;
  otp_request_count?: number | null;
  user_otp?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  profiles?: {
    full_name?: string[] | string | null;
    user_code?: string[] | string | null;
    email?: string | null;
    user_type?: string | null;
    mobile_number?: string | null;
  } | null;
  payment_methods?: {
    name?: string | null;
    logo_path?: string | null;
  } | null;
};

const STATUS_OPTIONS = ["kyc_enabled", "kyc_disconnect"] as const;
const STATUS_LABELS: Record<string, string> = {
  kyc_enabled: "KYC Enabled",
  kyc_disconnect: "KYC Disconnect",
};

const valueOf = (value: string[] | string | null | undefined) => {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
};

const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "kyc_enabled") return "default";
  if (s === "kyc_disconnect") return "destructive";
  return "secondary";
};

const AdminUpiKycManagement = () => {
  const { themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const queryKey = ["admin-upi-kyc-management"];

  const { data: records = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_payment_apps" as any)
        .select("id, profile_id, payment_method_id, phone_number, is_primary, kyc_status, otp_requested, otp_request_count, user_otp, created_at, updated_at, profiles(full_name, user_code, email, user_type, mobile_number), payment_methods(name, logo_path)")
        .order("updated_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as UpiKycRecord[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-upi-kyc-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_payment_apps" },
        () => {
          queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    const patch: any = { kyc_status: status, updated_at: new Date().toISOString() };
    if (status === "kyc_enabled") patch.kyc_enabled_at = new Date().toISOString();
    const { error } = await supabase
      .from("employee_payment_apps" as any)
      .update(patch)
      .eq("id", id);
    setUpdatingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Status updated");
    queryClient.invalidateQueries({ queryKey });
  };

  const copyText = async (text: string, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      const name = valueOf(r.profiles?.full_name).toLowerCase();
      const code = valueOf(r.profiles?.user_code).toLowerCase();
      return (
        name.includes(q) ||
        code.includes(q) ||
        (r.profiles?.email || "").toLowerCase().includes(q) ||
        (r.profiles?.mobile_number || "").toLowerCase().includes(q) ||
        (r.payment_methods?.name || "").toLowerCase().includes(q) ||
        (r.phone_number || "").toLowerCase().includes(q)
      );
    });
  }, [records, search]);

  const verifiedCount = records.filter((r) => r.kyc_status === "kyc_enabled").length;
  const pendingCount = records.filter((r) => (r.kyc_status || "") !== "kyc_enabled").length;

  const exportCsv = () => {
    const rows = [
      ["Name", "User Code", "Email", "User Type", "UPI App", "KYC Phone", "Send OTP", "OTP", "Status", "Updated At"],
      ...filtered.map((r) => [
        valueOf(r.profiles?.full_name),
        valueOf(r.profiles?.user_code),
        r.profiles?.email || "",
        r.profiles?.user_type || "",
        r.payment_methods?.name || "",
        r.phone_number || "",
        r.otp_requested ? "Yes" : "No",
        r.user_otp || "",
        STATUS_LABELS[r.kyc_status || ""] || "",
        r.updated_at || r.created_at || "",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `upi_kyc_management_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("UPI KYC CSV exported");
  };

  const statCards = [
    { label: "Total UPI Apps", value: records.length, icon: Smartphone, color: "#6366f1" },
    { label: "KYC Enabled", value: verifiedCount, icon: ShieldCheck, color: "#16a34a" },
    { label: "KYC Disconnect", value: pendingCount, icon: User, color: "#f59e0b" },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: T.text }}>UPI KYC Management</h1>
          <p className="mt-1 text-sm" style={{ color: T.sub }}>Live monitor of UPI app KYC submissions from freelancer and employer profiles.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/upi-kyc-schedule")}>
            <Clock className="h-4 w-4" />
            KYC Setup Time
          </Button>
          <Button className="gap-2" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} style={{ backgroundColor: T.card, borderColor: T.border }}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: `${color}18`, color }}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: T.text }}>{value}</p>
                <p className="text-xs" style={{ color: T.sub }}>{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card style={{ backgroundColor: T.card, borderColor: T.border }}>
        <CardContent className="space-y-4 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: T.sub }} />
            <Input
              className="pl-9"
              placeholder="Search name, user code, email, phone, or UPI app..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ backgroundColor: T.input, color: T.text, borderColor: T.border }}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: T.border }}>
                  {["User", "User Type", "UPI App", "KYC Phone", "Send OTP", "OTP", "Status", "Updated"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: T.sub }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, row) => (
                    <tr key={row} className="border-b" style={{ borderColor: T.border }}>
                      {Array.from({ length: 8 }).map((__, col) => (
                        <td key={col} className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((r) => {
                    const status = r.kyc_status || "kyc_disconnect";
                    return (
                      <tr key={r.id} className="border-b last:border-0" style={{ borderColor: T.border }}>
                        <td className="px-3 py-3">
                          <p className="font-medium" style={{ color: T.text }}>{valueOf(r.profiles?.full_name) || "User"}</p>
                          <p className="text-xs" style={{ color: T.sub }}>{valueOf(r.profiles?.user_code) || r.profiles?.email || "-"}</p>
                        </td>
                        <td className="px-3 py-3 capitalize" style={{ color: T.text }}>{r.profiles?.user_type || "-"}</td>
                        <td className="px-3 py-3 font-medium" style={{ color: T.text }}>{r.payment_methods?.name || "-"}</td>
                        <td className="px-3 py-3 font-mono" style={{ color: T.text }}>
                          <div className="flex items-center gap-1.5">
                            <span>{r.phone_number || "-"}</span>
                            {r.phone_number && (
                              <button
                                type="button"
                                onClick={() => copyText(r.phone_number || "", "Phone")}
                                className="rounded p-1 hover:bg-foreground/10"
                                title="Copy phone"
                              >
                                <Copy className="h-3.5 w-3.5" style={{ color: T.sub }} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {r.otp_requested ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-500/15 text-green-600">
                                <Check className="h-4 w-4" />
                              </span>
                              <Badge variant="secondary" className="font-mono">x{r.otp_request_count || 0}</Badge>
                            </div>
                          ) : (
                            <span className="text-xs" style={{ color: T.sub }}>—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 font-mono" style={{ color: T.text }}>
                          <div className="flex items-center gap-1.5">
                            <span>{r.user_otp || "-"}</span>
                            {r.user_otp && (
                              <button
                                type="button"
                                onClick={() => copyText(r.user_otp || "", "OTP")}
                                className="rounded p-1 hover:bg-foreground/10"
                                title="Copy OTP"
                              >
                                <Copy className="h-3.5 w-3.5" style={{ color: T.sub }} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={statusVariant(status)}>{STATUS_LABELS[status] || status}</Badge>
                            <Select
                              value={STATUS_OPTIONS.includes(status as any) ? status : undefined}
                              onValueChange={(v) => updateStatus(r.id, v)}
                              disabled={updatingId === r.id}
                            >
                              <SelectTrigger className="h-8 w-[160px]" style={{ backgroundColor: T.input, color: T.text, borderColor: T.border }}>
                                <SelectValue placeholder="Set status" />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((s) => (
                                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                        <td className="px-3 py-3" style={{ color: T.sub }}>
                          {r.updated_at || r.created_at ? new Date(r.updated_at || r.created_at || "").toLocaleString("en-IN") : "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center" style={{ color: T.sub }}>No UPI KYC records found</td>
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

export default AdminUpiKycManagement;
