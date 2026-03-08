import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, ArrowDownToLine, FileText, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  completed: "default",
  pending: "secondary",
  rejected: "destructive",
  in_progress: "outline",
  published: "outline",
  cancelled: "destructive",
};

const RequestStatusSection = () => {
  const { profile } = useAuth();

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["emp-request-applications", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("project_applications")
        .select("id, status, applied_at, project:project_id(name, amount, status)")
        .eq("employee_id", profile.id)
        .order("applied_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: withdrawals = [], isLoading: wLoading } = useQuery({
    queryKey: ["emp-request-withdrawals", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("withdrawals")
        .select("id, amount, method, status, requested_at, review_notes")
        .eq("employee_id", profile.id)
        .order("requested_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: submissions = [], isLoading: sLoading } = useQuery({
    queryKey: ["emp-request-submissions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("project_submissions")
        .select("id, notes, submitted_at, project:project_id(name, status)")
        .eq("employee_id", profile.id)
        .order("submitted_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: unreadMessages = [], isLoading: mLoading } = useQuery({
    queryKey: ["emp-request-messages", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      // Get chat rooms the employee is part of
      const { data: projects, error: pErr } = await supabase
        .from("projects")
        .select("id, name")
        .eq("assigned_employee_id", profile.id);
      if (pErr || !projects?.length) return [];

      const projectIds = projects.map((p: any) => p.id);
      const { data: rooms, error: rErr } = await supabase
        .from("chat_rooms")
        .select("id, project_id")
        .in("project_id", projectIds)
        .eq("type", "project");
      if (rErr || !rooms?.length) return [];

      const roomIds = rooms.map((r: any) => r.id);
      const { data: msgs, error: mErr } = await supabase
        .from("messages")
        .select("id, content, created_at, chat_room_id, is_read")
        .in("chat_room_id", roomIds)
        .neq("sender_id", profile.id)
        .eq("is_read", false)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (mErr) return [];

      // Map room_id to project name
      const roomProjectMap: Record<string, string> = {};
      rooms.forEach((r: any) => {
        const proj = projects.find((p: any) => p.id === r.project_id);
        if (proj) roomProjectMap[r.id] = proj.name;
      });

      return (msgs ?? []).map((m: any) => ({
        ...m,
        projectName: roomProjectMap[m.chat_room_id] || "Unknown Project",
      }));
    },
    enabled: !!profile?.id,
  });

  const renderSkeleton = () =>
    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />);

  const renderEmpty = (text: string) => (
    <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>
  );

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">Request Status</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="jobs" className="flex-1 gap-1 text-xs">
              <Briefcase className="h-3.5 w-3.5" /> Jobs
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex-1 gap-1 text-xs">
              <ArrowDownToLine className="h-3.5 w-3.5" /> Withdraw
            </TabsTrigger>
            <TabsTrigger value="submissions" className="flex-1 gap-1 text-xs">
              <FileText className="h-3.5 w-3.5" /> Submit
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex-1 gap-1 text-xs">
              <MessageSquare className="h-3.5 w-3.5" /> Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="mt-3 space-y-2">
            {appsLoading ? renderSkeleton() : applications.length > 0 ? (
              applications.map((app: any) => (
                <div key={app.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{(app.project as any)?.name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      ₹{Number((app.project as any)?.amount ?? 0).toLocaleString("en-IN")} • {new Date(app.applied_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={statusVariant[app.status] ?? "secondary"} className="ml-2 shrink-0">{app.status}</Badge>
                </div>
              ))
            ) : renderEmpty("No job applications yet")}
          </TabsContent>

          <TabsContent value="withdraw" className="mt-3 space-y-2">
            {wLoading ? renderSkeleton() : withdrawals.length > 0 ? (
              withdrawals.map((w: any) => (
                <div key={w.id} className="space-y-1 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">₹{Number(w.amount).toLocaleString("en-IN")}</p>
                      <p className="text-xs text-muted-foreground">{w.method} • {new Date(w.requested_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={statusVariant[w.status] ?? "secondary"} className="ml-2 shrink-0">{w.status}</Badge>
                  </div>
                  {w.status === "rejected" && w.review_notes && (
                    <p className="text-xs text-destructive">Reason: {w.review_notes}</p>
                  )}
                </div>
              ))
            ) : renderEmpty("No withdrawal requests yet")}
          </TabsContent>

          <TabsContent value="submissions" className="mt-3 space-y-2">
            {sLoading ? renderSkeleton() : submissions.length > 0 ? (
              submissions.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{(s.project as any)?.name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.notes ? s.notes.slice(0, 40) + (s.notes.length > 40 ? "…" : "") : "No notes"} • {new Date(s.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={statusVariant[(s.project as any)?.status] ?? "secondary"} className="ml-2 shrink-0">
                    {(s.project as any)?.status ?? "submitted"}
                  </Badge>
                </div>
              ))
            ) : renderEmpty("No submissions yet")}
          </TabsContent>

          <TabsContent value="messages" className="mt-3 space-y-2">
            {mLoading ? renderSkeleton() : unreadMessages.length > 0 ? (
              unreadMessages.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{m.projectName}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.content.slice(0, 50)}{m.content.length > 50 ? "…" : ""}</p>
                  </div>
                  <Badge variant="secondary" className="ml-2 shrink-0">Unread</Badge>
                </div>
              ))
            ) : renderEmpty("No unread messages")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RequestStatusSection;
