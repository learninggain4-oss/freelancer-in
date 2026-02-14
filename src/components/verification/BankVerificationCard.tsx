import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Landmark, BadgeCheck, Clock, AlertCircle, Loader2, Upload, FileText } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: any }> = {
  pending: { variant: "secondary", label: "Pending", icon: Clock },
  under_process: { variant: "outline", label: "Under Process", icon: Loader2 },
  verified: { variant: "default", label: "Verified", icon: BadgeCheck },
  rejected: { variant: "destructive", label: "Rejected", icon: AlertCircle },
};

const BankVerificationCard = () => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const { data: maxAttempts = 9 } = useQuery({
    queryKey: ["max-bank-verification-attempts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "max_bank_verification_attempts")
        .maybeSingle();
      return data ? Number(data.value) : 9;
    },
  });

  const attemptCount = (verification as any)?.attempt_count ?? 1;
  const attemptsRemaining = Math.max(0, maxAttempts - attemptCount);
  const canRetry = verification?.status === "rejected" && attemptsRemaining > 0;

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !user?.id) throw new Error("Not authenticated");
      if (!profile.bank_account_number && !profile.upi_id) {
        throw new Error("Please add bank details or UPI ID in your profile first");
      }
      if (!selectedFile && !verification?.document_path) {
        throw new Error("Please upload a bank statement or signed proof from your bank");
      }

      let documentPath = verification?.document_path || null;
      let documentName = verification?.document_name || null;

      if (selectedFile) {
        setUploading(true);
        const ext = selectedFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("bank-documents")
          .upload(path, selectedFile);
        if (uploadError) throw uploadError;
        documentPath = path;
        documentName = selectedFile.name;
      }

      const newAttemptCount = verification ? attemptCount + 1 : 1;

      const { error } = await supabase
        .from("bank_verifications")
        .upsert({
          profile_id: profile.id,
          status: "pending" as any,
          document_path: documentPath,
          document_name: documentName,
          attempt_count: newAttemptCount,
          rejection_reason: null,
        }, { onConflict: "profile_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bank verification request submitted");
      queryClient.invalidateQueries({ queryKey: ["bank-verification"] });
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (e: any) => toast.error(e.message),
    onSettled: () => setUploading(false),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }
    setSelectedFile(file);
  };

  const hasBankDetails = profile?.bank_account_number || profile?.upi_id;
  const cfg = verification ? statusConfig[verification.status] ?? statusConfig.pending : null;
  const canSubmit = hasBankDetails && (selectedFile || verification?.document_path);

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

            {verification.document_name && (
              <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="truncate text-muted-foreground">{verification.document_name}</span>
              </div>
            )}

            {verification.status === "rejected" && verification.rejection_reason && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <p className="font-medium">Rejection Reason:</p>
                <p className="text-xs">{verification.rejection_reason}</p>
              </div>
            )}

            {verification.status === "rejected" && (
              <>
                {canRetry ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Upload a new bank statement or signed proof from your bank.
                      <span className="ml-1 font-medium">Attempts remaining: {attemptsRemaining} of {maxAttempts}</span>
                    </p>
                    <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                      <Upload className="h-3.5 w-3.5" />
                      {selectedFile ? selectedFile.name : "Choose File"}
                    </Button>
                    <Button size="sm" className="ml-2" onClick={() => submitMutation.mutate()}
                      disabled={submitMutation.isPending || !hasBankDetails || (!selectedFile && !verification.document_path)}>
                      {submitMutation.isPending ? "Submitting..." : "Resubmit for Verification"}
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    <p className="font-medium">Maximum attempts reached</p>
                    <p className="text-xs">You have used all {maxAttempts} verification attempts. Please contact support for assistance.</p>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {hasBankDetails
                ? "Upload a bank statement or signed proof from your bank, then submit for verification. Withdrawals require verified bank details."
                : "Add bank details or UPI ID in your profile first, then upload proof and submit for verification."}
            </p>
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()} disabled={!hasBankDetails}>
                <Upload className="h-3.5 w-3.5" />
                {selectedFile ? selectedFile.name : "Upload Bank Proof"}
              </Button>
              <Button size="sm" onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending || !canSubmit}>
                {submitMutation.isPending || uploading ? "Submitting..." : "Submit for Verification"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BankVerificationCard;