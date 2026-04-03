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
import { CheckCircle, XCircle, Loader2, ShieldCheck, CreditCard, Clock, ClipboardCheck, BadgeCheck, IndianRupee, LifeBuoy, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

/** Freelancer view for cancelled projects - shows Help - Recovery Money button */
const CancelledEmployeeView = ({ projectId }: { projectId: string }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { data: existingRequest } = useQuery({
    queryKey: ["recovery-request", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("recovery_requests")
        .select("id, status")
        .eq("project_id", projectId)
        .maybeSingle();
      return data;
    },
  });

  const handleRecovery = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // Get project details for held amount
      const { data: project } = await supabase
        .from("projects")
        .select("amount, validation_fees, assigned_employee_id")
        .eq("id", projectId)
        .single();
      if (!project) throw new Error("Project not found");

      const heldAmount = Number(project.amount || 0) + Number(project.validation_fees || 0);

      // Create recovery request
      const { data: req, error: reqErr } = await supabase
        .from("recovery_requests")
        .insert({
          project_id: projectId,
          employee_id: profile.id,
          held_amount: heldAmount,
        })
        .select("id")
        .single();
      if (reqErr) throw reqErr;

      // Create support chat room
      const { data: room, error: roomErr } = await supabase
        .from("chat_rooms")
        .insert({
          project_id: projectId,
          type: "support",
          recovery_request_id: req.id,
        })
        .select("id")
        .single();
      if (roomErr) throw roomErr;

      toast.success("Recovery request submitted. Customer Service will assist you.");
      navigate(`/freelancer/projects/support-chat/${projectId}?room=${room.id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openExistingChat = async () => {
    if (!existingRequest) return;
    const { data: room } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("recovery_request_id", existingRequest.id)
      .eq("type", "support")
      .maybeSingle();
    if (room) {
      navigate(`/freelancer/projects/support-chat/${projectId}?room=${room.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-2 border-b bg-destructive/10 px-4 py-3">
      <div className="flex items-center gap-2">
        <XCircle className="h-4 w-4 text-destructive" />
        <span className="text-sm font-medium text-destructive">Project Rejected — Balance on Hold</span>
      </div>
      {existingRequest ? (
        <div className="flex items-center gap-2">
          {existingRequest.status === "pending" ? (
            <Button size="sm" variant="outline" onClick={openExistingChat} className="gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              Open Customer Service Chat
            </Button>
          ) : existingRequest.status === "resolved" ? (
            <span className="text-xs text-accent font-medium">✓ Recovery completed — balance released</span>
          ) : (
            <span className="text-xs text-destructive font-medium">Recovery request was rejected</span>
          )}
        </div>
      ) : (
        <Button
          size="sm"
          onClick={handleRecovery}
          disabled={loading}
          className="gap-1 w-fit"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LifeBuoy className="h-3.5 w-3.5" />}
          Help - Amount Recovery
        </Button>
      )}
    </div>
  );
};

interface ProjectValidationControlsProps {
  projectId: string;
  projectStatus: string;
  isClient: boolean;
  amount: number;
  validationFees: number;
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
  amount,
  validationFees,
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
    if (!isClient) {
      return <CancelledEmployeeView projectId={projectId} />;
    }
    return (
      <div className="flex items-center gap-2 border-b bg-destructive/10 px-4 py-2">
        <XCircle className="h-4 w-4 text-destructive" />
        <span className="text-sm font-medium text-destructive">Project Rejected</span>
      </div>
    );
  }

  // === Freelancer sees status banners only ===
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
      `/functions/v1/wallet-operations`,
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
      description: "The validation fees will be deducted from your wallet and held for the freelancer.",
    },
    payment_processing: {
      icon: <BadgeCheck className="h-3 w-3" />,
      text: "Validation Confirm",
      description: "The budget amount will be deducted from your wallet and held for the freelancer.",
    },
    validation: {
      icon: <CheckCircle className="h-3 w-3" />,
      text: "Final Confirm",
      description: "The total held amount (validation fees + budget) will be released to the freelancer's available balance. This cannot be undone.",
    },
  };

  const current = confirmLabel[projectStatus];

  return (
    <div className="flex flex-col gap-2 border-b bg-muted/50 px-4 py-3">
      {/* Fee Summary */}
      <div className="flex flex-wrap gap-3 rounded-md bg-background/80 px-3 py-2 text-xs">
        <div className="flex items-center gap-1">
          <IndianRupee className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Validation Fees:</span>
          <span className="font-semibold text-foreground">₹{validationFees.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex items-center gap-1">
          <IndianRupee className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Budget:</span>
          <span className="font-semibold text-foreground">₹{amount.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-semibold text-primary">₹{(amount + validationFees).toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Step indicators */}
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
                This will cancel the project. The held balance will remain on hold.
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
