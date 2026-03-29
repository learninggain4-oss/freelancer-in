import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Smartphone, Download, XCircle, CheckCircle2, Search,
  Monitor, Clock, Users, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

const AdminPwaInstalls = () => {
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent/60 p-6 text-primary-foreground">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5 blur-xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">App Install Status</h1>
            <p className="text-sm opacity-80">Track PWA installation across users</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Users, value: stats.total, label: "Tracked", color: "text-primary", bg: "bg-primary/10" },
          { icon: Download, value: stats.installed, label: "Installed", color: "text-accent", bg: "bg-accent/10" },
          { icon: Monitor, value: stats.prompted, label: "Prompted", color: "text-warning", bg: "bg-warning/10" },
          { icon: XCircle, value: stats.dismissed, label: "Dismissed", color: "text-destructive", bg: "bg-destructive/10" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} mb-2`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, code, or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Users List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex-row items-center gap-2 pb-3">
          <Smartphone className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-semibold">Install Status</CardTitle>
          <Badge variant="secondary" className="ml-auto text-[10px]">{filtered.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Smartphone className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No install data tracked yet</p>
            </div>
          ) : (
            filtered.map((item: any) => {
              const name = Array.isArray(item.profile?.full_name) ? item.profile.full_name.join(" ") : item.profile?.full_name || "User";
              const code = Array.isArray(item.profile?.user_code) ? item.profile.user_code.join("") : item.profile?.user_code || "";
              const isInstalled = item.is_installed || item.is_standalone;

              return (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/30 transition-colors">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isInstalled ? "bg-accent/10" : "bg-muted"}`}>
                    {isInstalled ? <CheckCircle2 className="h-5 w-5 text-accent" /> : <Monitor className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{code}</Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{item.profile?.user_type}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                      {item.is_standalone && <Badge className="h-4 px-1.5 text-[10px] bg-accent text-accent-foreground border-0">Standalone</Badge>}
                      {item.prompt_shown && (
                        <span>
                          Prompt: {item.prompt_accepted === true ? "✅ Accepted" : item.prompt_accepted === false ? "❌ Dismissed" : "⏳ Shown"}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(item.last_checked_at), "dd MMM, hh:mm a")}
                      </span>
                    </div>
                  </div>
                  <Badge className={`shrink-0 text-[10px] border-0 ${isInstalled ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                    {isInstalled ? "Installed" : "Browser"}
                  </Badge>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPwaInstalls;
