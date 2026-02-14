import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Landmark, BadgeCheck, Clock, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: any }> = {
  pending: { variant: "secondary", label: "Pending", icon: Clock },
  under_process: { variant: "outline", label: "Under Process", icon: Loader2 },
  verified: { variant: "default", label: "Verified", icon: BadgeCheck },
  rejected: { variant: "destructive", label: "Rejected", icon: AlertCircle },
};

const BankVerificationCard = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: verification, isLoading } = useQuery({
    queryKey: ["bank-verification", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_verifications")
        .select("*")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Not authenticated");
      if (!profile.bank_account_number && !profile.upi_id) {
        throw new Error("Please add bank details or UPI ID in your profile first");
      }
      const { error } = await supabase
        .from("bank_verifications")
        .upsert({ profile_id: profile.id, status: "pending" as any }, { onConflict: "profile_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bank verification request submitted");
      queryClient.invalidateQueries({ queryKey: ["bank-verification"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const hasBankDetails = profile?.bank_account_number || profile?.upi_id;
  const cfg = verification ? statusConfig[verification.status] ?? statusConfig.pending : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Landmark className="h-4 w-4" /> Bank Verification
          {verification?.status === "verified" && (
            <BadgeCheck className="h-4 w-4 text-accent" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : verification ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={cfg!.variant}>{cfg!.label}</Badge>
            </div>
            {verification.status === "rejected" && verification.rejection_reason && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <p className="font-medium">Rejection Reason:</p>
                <p className="text-xs">{verification.rejection_reason}</p>
              </div>
            )}
            {verification.status === "rejected" && (
              <Button size="sm" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !hasBankDetails}>
                Resubmit for Verification
              </Button>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {hasBankDetails
                ? "Submit your bank details for admin verification. Withdrawals require verified bank details."
                : "Add bank details or UPI ID in your profile first, then submit for verification."}
            </p>
            <Button size="sm" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !hasBankDetails}>
              {submitMutation.isPending ? "Submitting..." : "Submit for Verification"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BankVerificationCard;
