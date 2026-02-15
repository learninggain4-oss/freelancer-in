import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { CheckCircle, XCircle, Loader2, ShieldCheck, CreditCard, Clock, ClipboardCheck, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ProjectValidationControlsProps {
  projectId: string;
  projectStatus: string;
  isClient: boolean;
}

const STEP_LABELS: Record<string, { step: number; label: string }> = {
  in_progress: { step: 1, label: "Job Confirmation" },
  job_confirmed: { step: 2, label: "Payment Process" },
  payment_processing: { step: 3, label: "Validation" },
  validation: { step: 4, label: "Final Confirmation" },
};

const ProjectValidationControls = ({
  projectId,
  projectStatus,
  isClient,
}: ProjectValidationControlsProps) => {
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["chat-room", projectId] });
    queryClient.invalidateQueries({ queryKey: ["client-projects"] });
  };

  // === Terminal statuses — both roles see banners ===
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

  // === Employee sees status banners only ===
  if (!isClient) {
    const stepInfo = STEP_LABELS[projectStatus];
    if (!stepInfo) return null;
    return (
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Step {stepInfo.step}/4: {stepInfo.label} — Awaiting Client Action
        </span>
      </div>
    );
  }

  // === Client action buttons ===
  const stepInfo = STEP_LABELS[projectStatus];
  if (!stepInfo) return null;

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

  const handleConfirm = async () => {
    setLoading(true);
    try {
      switch (projectStatus) {
        case "in_progress":
          await callWalletOperation("confirm_job");
          toast.success("Job confirmed! Proceed to Payment Process.");
          break;
        case "job_confirmed":
          await callWalletOperation("hold_project_payment");
          toast.success("Payment processing initiated — amount held.");
          break;
        case "payment_processing":
          await callWalletOperation("confirm_validation");
          toast.success("Validation confirmed! Final confirmation pending.");
          break;
        case "validation":
          await callWalletOperation("release_project_payment");
          toast.success("Project completed — payment released!");
          break;
      }
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      if (projectStatus === "payment_processing" || projectStatus === "validation") {
        await callWalletOperation("refund_project_payment");
        toast.success("Project rejected — payment refunded.");
      } else {
        const { error } = await supabase
          .from("projects")
          .update({
            status: "cancelled" as any,
            remarks: rejectReason || "Rejected by client",
          })
          .eq("id", projectId);
        if (error) throw error;
        toast.success("Project has been rejected.");
      }
      setRejectReason("");
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmLabel: Record<string, { icon: React.ReactNode; text: string; description: string }> = {
    in_progress: {
      icon: <ClipboardCheck className="h-3 w-3" />,
      text: "Job Confirm",
      description: "Confirm the job is valid and proceed to payment processing.",
    },
    job_confirmed: {
      icon: <CreditCard className="h-3 w-3" />,
      text: "Payment Process",
      description: "The project budget will be deducted from your wallet and held for the employee.",
    },
    payment_processing: {
      icon: <BadgeCheck className="h-3 w-3" />,
      text: "Validation Confirm",
      description: "Confirm validation of the work and proceed to final confirmation.",
    },
    validation: {
      icon: <CheckCircle className="h-3 w-3" />,
      text: "Final Confirm",
      description: "The held amount will be released to the employee. This cannot be undone.",
    },
  };

  const current = confirmLabel[projectStatus];

  return (
    <div className="flex flex-col gap-2 border-b bg-muted/50 px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {[1, 2, 3, 4].map((s) => (
          <span
            key={s}
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
              s === stepInfo.step
                ? "bg-primary text-primary-foreground"
                : s < stepInfo.step
                ? "bg-accent/20 text-accent"
                : "bg-muted-foreground/20 text-muted-foreground"
            }`}
          >
            {s}
          </span>
        ))}
        <span className="ml-1 font-medium text-foreground">
          Step {stepInfo.step}: {stepInfo.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" disabled={loading} className="gap-1">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : current.icon}
              {current.text}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{current.text}?</AlertDialogTitle>
              <AlertDialogDescription>{current.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
                {projectStatus === "payment_processing" || projectStatus === "validation"
                  ? "This will cancel the project and refund the held payment."
                  : "This will cancel the project."}
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
    </div>
  );
};

export default ProjectValidationControls;
