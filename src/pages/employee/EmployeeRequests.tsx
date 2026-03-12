import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare, ArrowLeft, ClipboardList, Clock, CheckCircle2,
  XCircle, ChevronRight, Send, Inbox,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  pending: { color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", icon: Clock, label: "Pending" },
  approved: { color: "text-accent", bg: "bg-accent/10", border: "border-accent/20", icon: CheckCircle2, label: "Approved" },
  rejected: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", icon: XCircle, label: "Rejected" },
};

const EmployeeRequests = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["employee-requests", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("project_applications")
        .select("*, project:project_id(name, amount, status)")
        .eq("employee_id", profile.id)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const counts = {
    pending: requests.filter((r: any) => r.status === "pending").length,
    approved: requests.filter((r: any) => r.status === "approved").length,
    rejected: requests.filter((r: any) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 text-primary-foreground">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-primary-foreground/5 blur-xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}
              className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20 rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">My Requests</h1>
              <p className="text-xs text-primary-foreground/70">{requests.length} total applications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-2.5">
        {(["pending", "approved", "rejected"] as const).map((status) => {
          const cfg = statusConfig[status];
          return (
            <Card key={status} className={cn("border", cfg.border, "overflow-hidden")}>
              <CardContent className="flex flex-col items-center p-3 gap-1">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", cfg.bg)}>
                  <cfg.icon className={cn("h-4 w-4", cfg.color)} />
                </div>
                <span className="text-lg font-bold text-foreground leading-none">{counts[status]}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{cfg.label}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Request Cards */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : requests.length > 0 ? (
          requests.map((r: any) => {
            const cfg = statusConfig[r.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            return (
              <Card key={r.id} className={cn("overflow-hidden border-0 shadow-md transition-all hover:shadow-lg")}>
                <div className={cn("h-0.5", cfg.bg.replace("/10", ""))} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", cfg.bg)}>
                        <StatusIcon className={cn("h-5 w-5", cfg.color)} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{r.project?.name ?? "Project"}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Applied {format(new Date(r.applied_at), "dd MMM yyyy")}
                        </p>
                        {r.project?.amount && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Budget: ₹{Number(r.project.amount).toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge className={cn(cfg.bg, cfg.color, "border-0 font-semibold text-xs")}>
                        {cfg.label}
                      </Badge>
                      {r.status === "approved" && (
                        <Button size="sm" variant="outline"
                          className="h-8 text-xs gap-1.5 border-accent/30 text-accent hover:bg-accent/10"
                          onClick={() => navigate(`/employee/projects/chat/${r.project_id}`)}>
                          <MessageSquare className="h-3 w-3" /> Chat
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No applications yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">
              Browse available jobs and apply to get started
            </p>
            <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => navigate("/employee/projects")}>
              <Send className="h-3.5 w-3.5" /> Browse Jobs
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeRequests;
