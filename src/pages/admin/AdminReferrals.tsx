import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Users, IndianRupee, Gift, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const PAGE_SIZE = 15;

const AdminReferrals = () => {
  const { theme } = useDashboardTheme();
  const T = TH[theme];
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["admin-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select(`
          id,
          created_at,
          signup_bonus_paid,
          job_bonus_paid,
          referrer:referrer_id(id, full_name, user_code, user_type),
          referred:referred_id(id, full_name, user_code, user_type, approval_status)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const filtered = referrals.filter((r: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const referrerName = (r.referrer?.full_name || []).join(" ").toLowerCase();
    const referredName = (r.referred?.full_name || []).join(" ").toLowerCase();
    const referrerCode = (r.referrer?.user_code || []).join("").toLowerCase();
    const referredCode = (r.referred?.user_code || []).join("").toLowerCase();
    return referrerName.includes(q) || referredName.includes(q) || referrerCode.includes(q) || referredCode.includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalReferrals = referrals.length;
  const signupBonusesPaid = referrals.filter((r: any) => r.signup_bonus_paid).length;
  const jobBonusesPaid = referrals.filter((r: any) => r.job_bonus_paid).length;

  const getName = (profile: any) => (profile?.full_name || []).join(" ") || "—";
  const getCode = (profile: any) => (profile?.user_code || []).join("") || "—";

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
            <Share2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Referrals & Affiliates</h1>
            <p className="text-white/80 font-medium">Track platform growth and bonus payouts</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {[
          { label: "Total Referrals", value: totalReferrals, icon: Users, color: "text-blue-400" },
          { label: "Signup Bonuses Paid", value: signupBonusesPaid, icon: Gift, color: "text-emerald-400" },
          { label: "Job Bonuses Paid", value: jobBonusesPaid, icon: IndianRupee, color: "text-amber-400" },
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
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
            style={{ background: T.input, borderColor: T.border, color: T.text }}
          />
        </div>

        <Card style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-none overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader style={{ background: T.nav }}>
                  <TableRow style={{ borderColor: T.border }} className="hover:bg-transparent">
                    <TableHead style={{ color: T.sub }}>Referrer</TableHead>
                    <TableHead style={{ color: T.sub }}>Referred User</TableHead>
                    <TableHead style={{ color: T.sub }}>Type</TableHead>
                    <TableHead style={{ color: T.sub }}>Status</TableHead>
                    <TableHead style={{ color: T.sub }}>Signup Bonus</TableHead>
                    <TableHead style={{ color: T.sub }}>Job Bonus</TableHead>
                    <TableHead style={{ color: T.sub }}>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} style={{ borderColor: T.border }}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-20 opacity-20" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12" style={{ color: T.sub }}>
                        No referrals found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((r: any) => (
                      <TableRow key={r.id} style={{ borderColor: T.border }} className="hover:bg-white/5 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-semibold" style={{ color: T.text }}>{getName(r.referrer)}</p>
                            <p className="text-xs font-mono" style={{ color: T.sub }}>{getCode(r.referrer)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold" style={{ color: T.text }}>{getName(r.referred)}</p>
                            <p className="text-xs font-mono" style={{ color: T.sub }}>{getCode(r.referred)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize border-white/10" style={{ color: T.sub }}>
                            {r.referred?.user_type || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            style={{ 
                              background: r.referred?.approval_status === "approved" ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)",
                              color: r.referred?.approval_status === "approved" ? "#4ade80" : T.sub,
                              borderColor: "transparent"
                            }}
                            className="capitalize"
                          >
                            {r.referred?.approval_status || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            style={{ 
                              background: r.signup_bonus_paid ? "rgba(99,102,241,0.2)" : "transparent",
                              color: r.signup_bonus_paid ? T.badgeFg : T.sub,
                              borderColor: r.signup_bonus_paid ? "transparent" : T.border
                            }}
                            variant={r.signup_bonus_paid ? "default" : "outline"}
                          >
                            {r.signup_bonus_paid ? "Paid" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            style={{ 
                              background: r.job_bonus_paid ? "rgba(99,102,241,0.2)" : "transparent",
                              color: r.job_bonus_paid ? T.badgeFg : T.sub,
                              borderColor: r.job_bonus_paid ? "transparent" : T.border
                            }}
                            variant={r.job_bonus_paid ? "default" : "outline"}
                          >
                            {r.job_bonus_paid ? "Paid" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-medium" style={{ color: T.sub }}>
                          {format(new Date(r.created_at), "dd MMM yyyy")}
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: T.sub }}>
          <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              disabled={page === 1} 
              onClick={() => setPage(page - 1)}
              style={{ background: T.card, borderColor: T.border }}
              className="rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              disabled={page === totalPages} 
              onClick={() => setPage(page + 1)}
              style={{ background: T.card, borderColor: T.border }}
              className="rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReferrals;
