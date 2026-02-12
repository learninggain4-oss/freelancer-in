import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ProjectValidationControlsProps {
  projectId: string;
  projectStatus: string;
  isClient: boolean;
}

const ProjectValidationControls = ({
  projectId,
  projectStatus,
  isClient,
}: ProjectValidationControlsProps) => {
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const queryClient = useQueryClient();

  if (!isClient) return null;

  if (projectStatus === "completed") {
    return (
      <div className="flex items-center gap-2 border-b bg-accent/10 px-4 py-2">
        <ShieldCheck className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium text-accent">Project Approved & Completed</span>
      </div>
    );
  }

  if (projectStatus === "cancelled") {
    return (
      <div className="flex items-center gap-2 border-b bg-destructive/10 px-4 py-2">
        <XCircle className="h-4 w-4 text-destructive" />
        <span className="text-sm font-medium text-destructive">Project Rejected</span>
      </div>
    );
  }

  if (projectStatus !== "in_progress") return null;

  const handleApprove = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: "completed" as any })
        .eq("id", projectId);
      if (error) throw error;
      toast.success("Project approved and marked as completed!");
      queryClient.invalidateQueries({ queryKey: ["chat-room", projectId] });
      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          status: "cancelled" as any,
          remarks: rejectReason || "Rejected by client during validation",
        })
        .eq("id", projectId);
      if (error) throw error;
      toast.success("Project has been rejected.");
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["chat-room", projectId] });
      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 border-b bg-muted/50 px-4 py-3">
      <span className="flex-1 text-sm font-medium text-foreground">
        Validate this project:
      </span>

      {/* Approve */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" disabled={loading} className="gap-1">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
            Approve
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the project as completed. The employee's work will be accepted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>Confirm Approval</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={loading} className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
            Reject
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the project. Please provide a reason for rejection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for rejection (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectReason("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectValidationControls;
