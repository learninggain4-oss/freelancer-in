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
import { CheckCircle, XCircle, Loader2, ShieldCheck, CreditCard, Clock } from "lucide-react";
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

  // === Status banners visible to both client and employee ===

  if (projectStatus === "completed") {
    return (
      <div className="flex items-center gap-2 border-b bg-accent/10 px-4 py-2">
        <ShieldCheck className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium text-accent">Project Completed — Payment Released</span>
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

  if (projectStatus === "payment_processing") {
    // Employee sees status only; client gets Success/Reject buttons
    if (!isClient) {
      return (
        <div className="flex items-center gap-2 border-b bg-warning/10 px-4 py-2">
          <Clock className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium text-warning">Payment Processing — Awaiting Client Approval</span>
        </div>
      );
    }
  }

  if (projectStatus === "in_progress" && !isClient) {
    return (
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Awaiting Client Validation</span>
      </div>
    );
  }

  // Only clients see action buttons from here
  if (!isClient) return null;
  if (projectStatus !== "in_progress" && projectStatus !== "payment_processing") return null;

  const callWalletOperation = async (action: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(
      `https://maysttckdfnnzvfeujaj.supabase.co/functions/v1/wallet-operations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, project_id: projectId }),
      }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Operation failed");
    return json;
  };

  const handlePaymentProcess = async () => {
    setLoading(true);
    try {
      await callWalletOperation("hold_project_payment");
      toast.success("Payment processing initiated — amount held for employee.");
      queryClient.invalidateQueries({ queryKey: ["chat-room", projectId] });
      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async () => {
    setLoading(true);
    try {
      await callWalletOperation("release_project_payment");
      toast.success("Project completed — payment released to employee!");
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
      if (projectStatus === "payment_processing") {
        // Refund: return held amount to client, release employee hold
        await callWalletOperation("refund_project_payment");
        toast.success("Project rejected — payment refunded.");
      } else {
        const { error } = await supabase
          .from("projects")
          .update({
            status: "cancelled" as any,
            remarks: rejectReason || "Rejected by client during validation",
          })
          .eq("id", projectId);
        if (error) throw error;
        toast.success("Project has been rejected.");
      }
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
    <div className="flex flex-wrap items-center gap-3 border-b bg-muted/50 px-4 py-3">
      <span className="flex-1 text-sm font-medium text-foreground">
        {projectStatus === "in_progress" ? "Validate this project:" : "Payment held — Finalize:"}
      </span>

      {/* Payment Process — only in in_progress */}
      {projectStatus === "in_progress" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={loading} className="gap-1 border-warning/30 text-warning hover:bg-warning/10">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
              Payment Process
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Initiate Payment Processing?</AlertDialogTitle>
              <AlertDialogDescription>
                The project budget amount will be deducted from your wallet and held for the employee. You can then approve (Success) or reject the project.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePaymentProcess}>Confirm Payment</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Success — only in payment_processing */}
      {projectStatus === "payment_processing" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" disabled={loading} className="gap-1">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
              Success
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark Project as Successful?</AlertDialogTitle>
              <AlertDialogDescription>
                The held amount will be released to the employee's available balance. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSuccess}>Confirm Success</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Reject — available in both states */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={loading} className="gap-1 border-destructive/30 text-destructive hover:bg-destructive/10">
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
