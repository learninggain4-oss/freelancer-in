import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, User, Edit } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const AdminProfileEdits = () => {
  const { profile: adminProfile } = useAuth();
  const queryClient = useQueryClient();
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-edit-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, user_code, user_type, email, edit_request_status, edit_requested_at")
        .eq("edit_request_status", "requested" as any)
        .order("edit_requested_at" as any, { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["admin-edit-requests-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, user_code, user_type, email, edit_request_status, edit_requested_at, edit_reviewed_at")
        .in("edit_request_status", ["approved", "rejected", "used"] as any[])
        .order("edit_reviewed_at" as any, { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const updateData: Record<string, any> = {
        edit_request_status: status,
        edit_reviewed_at: new Date().toISOString(),
        edit_reviewed_by: adminProfile?.id,
      };
      if (status === "rejected" && reason) {
        updateData.edit_request_reason = reason;
      }
      const { error } = await supabase.from("profiles").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(`Edit request ${vars.status}`);
      setRejectReasons((p) => { const n = { ...p }; delete n[vars.id]; return n; });
      queryClient.invalidateQueries({ queryKey: ["admin-edit-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-edit-requests-history"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getName = (p: any) => Array.isArray(p.full_name) ? p.full_name.join(" ") : p.full_name;
  const getCode = (p: any) => Array.isArray(p.user_code) ? p.user_code.join("") : p.user_code;

  const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
    approved: "default",
    used: "default",
    rejected: "destructive",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Profile Edit Requests</h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Edit className="h-4 w-4" /> Pending Requests ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : requests.length > 0 ? (
            requests.map((r: any) => (
              <div key={r.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="flex items-center gap-1 text-sm font-medium text-foreground">
                      <User className="h-3 w-3" /> {getName(r)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getCode(r)} • {r.user_type} • {r.email}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Requested: {new Date(r.edit_requested_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary">requested</Badge>
                </div>
                <Textarea
                  placeholder="Rejection reason (optional)"
                  value={rejectReasons[r.id] || ""}
                  onChange={(e) => setRejectReasons((p) => ({ ...p, [r.id]: e.target.value }))}
                  className="min-h-[50px] text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => updateMutation.mutate({ id: r.id, status: "approved" })} disabled={updateMutation.isPending}>
                    <Check className="mr-1 h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-destructive" onClick={() => updateMutation.mutate({ id: r.id, status: "rejected", reason: rejectReasons[r.id] })} disabled={updateMutation.isPending}>
                    <X className="mr-1 h-3 w-3" /> Reject
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No pending edit requests</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">History</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {history.length > 0 ? (
            history.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{getName(r)}</p>
                  <p className="text-xs text-muted-foreground">
                    {getCode(r)} • {r.user_type} • {r.edit_reviewed_at ? new Date(r.edit_reviewed_at).toLocaleDateString() : "—"}
                  </p>
                </div>
                <Badge variant={statusVariant[r.edit_request_status] ?? "secondary"}>
                  {r.edit_request_status}
                </Badge>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No history yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfileEdits;
