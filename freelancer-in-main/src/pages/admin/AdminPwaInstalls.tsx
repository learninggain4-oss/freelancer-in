import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Smartphone, Download, XCircle, CheckCircle2, Search,
  Monitor, Clock, Users, Loader2, AppWindow, CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt, safeDist } from "@/lib/admin-date";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const AdminPwaInstalls = () => {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [search, setSearch] = useState("");

  const { data: installs = [], isLoading } = useQuery({
    queryKey: ["admin-pwa-installs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pwa_install_status" as any)
        .select("*, profile:profile_id(full_name, user_code, user_type, email)")
        .order("last_checked_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const stats = {
    total: installs.length,
    installed: installs.filter((i) => i.is_installed || i.is_standalone).length,
    prompted: installs.filter((i) => i.prompt_shown).length,
    dismissed: installs.filter((i) => i.prompt_shown && i.prompt_accepted === false).length,
  };

  const filtered = installs.filter((i: any) => {
    const name = Array.isArray(i.profile?.full_name) ? i.profile.full_name.join(" ") : i.profile?.full_name || "";
    const code = Array.isArray(i.profile?.user_code) ? i.profile.user_code.join("") : i.profile?.user_code || "";
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || code.toLowerCase().includes(q) || i.profile?.email?.toLowerCase().includes(q);
  });

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
            <AppWindow className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">App Install Status</h1>
            <p className="text-white/80 font-medium">Track Progressive Web App installation across users</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Tracked", value: stats.total, icon: Users, color: "text-blue-400" },
          { label: "Installed", value: stats.installed, icon: Download, color: "text-emerald-400" },
          { label: "Prompted", value: stats.prompted, icon: Monitor, color: "text-amber-400" },
          { label: "Dismissed", value: stats.dismissed, icon: XCircle, color: "text-destructive" },
        ].map((s, idx) => (
          <Card key={idx} style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-none">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="rounded-2xl bg-white/5 p-3 mb-3 border border-white/5">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <p className="text-sm font-medium" style={{ color: T.sub }}>{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: T.text }}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Users List */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search by name, code, or email..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-11" 
            style={{ background: T.input, borderColor: T.border, color: T.text }}
          />
        </div>

        <Card style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-none overflow-hidden">
          <CardHeader className="flex-row items-center justify-between pb-3 border-b" style={{ borderColor: T.border }}>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold" style={{ color: T.text }}>Detailed Status List</CardTitle>
            </div>
            <Badge variant="outline" className="border-white/10" style={{ color: T.sub }}>{filtered.length} Users</Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl opacity-20" />)
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-24 text-center" style={{ color: T.sub }}>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-6">
                  <Smartphone className="h-8 w-8 opacity-20" />
                </div>
                <p className="text-lg font-medium">No install data tracked yet</p>
                <p className="text-sm">Wait for users to visit the platform</p>
              </div>
            ) : (
              filtered.map((item: any) => {
                const name = Array.isArray(item.profile?.full_name) ? item.profile.full_name.join(" ") : item.profile?.full_name || "User";
                const code = Array.isArray(item.profile?.user_code) ? item.profile.user_code.join("") : item.profile?.user_code || "";
                const isInstalled = item.is_installed || item.is_standalone;

                return (
                  <div key={item.id} style={{ background: T.nav, borderColor: T.border }} className="flex items-center gap-4 rounded-2xl border p-4 hover:bg-white/5 transition-colors">
                    <div 
                      style={{ 
                        background: isInstalled ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)",
                        borderColor: isInstalled ? "rgba(34,197,94,0.1)" : "transparent"
                      }} 
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
                    >
                      {isInstalled ? <CheckCircle className="h-6 w-6 text-emerald-400" /> : <Monitor className="h-6 w-6 opacity-40" style={{ color: T.sub }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold truncate" style={{ color: T.text }}>{name}</p>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono opacity-60 border-white/10" style={{ color: T.sub }}>{code}</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize border-white/10" style={{ color: T.sub }}>{item.profile?.user_type}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] font-medium" style={{ color: T.sub }}>
                        {item.is_standalone && <Badge className="h-4 px-1.5 text-[9px] bg-emerald-500/20 text-emerald-400 border-none">Standalone</Badge>}
                        {item.prompt_shown && (
                          <span className="flex items-center gap-1">
                            Prompt: {item.prompt_accepted === true ? <span className="text-emerald-400">✅ Accepted</span> : item.prompt_accepted === false ? <span className="text-destructive">❌ Dismissed</span> : <span className="text-amber-400">⏳ Shown</span>}
                          </span>
                        )}
                        <span className="flex items-center gap-1 ml-auto opacity-60">
                          <Clock className="h-3 w-3" />
                          {safeFmt(item.last_checked_at, "dd MMM, hh:mm a")}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      style={{ 
                        background: isInstalled ? "rgba(16,185,129,0.15)" : "transparent",
                        color: isInstalled ? "#4ade80" : T.sub,
                        borderColor: isInstalled ? "transparent" : T.border
                      }} 
                      className="shrink-0 text-[10px] font-bold"
                    >
                      {isInstalled ? "INSTALLED" : "BROWSER"}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPwaInstalls;
