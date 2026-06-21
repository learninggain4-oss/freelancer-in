import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Landmark,
  BadgeCheck,
  Clock,
  AlertCircle,
  Loader2,
  Upload,
  FileText,
  Pencil,
  Trash2,
  Camera,
} from "lucide-react";
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
import { toast } from "sonner";

// മുൻപ് നൽകിയ അതേ statusConfig
const statusConfig: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: any }
> = {
  pending: { variant: "secondary", label: "Pending", icon: Clock },
  under_process: { variant: "outline", label: "Under Process", icon: Loader2 },
  verified: { variant: "default", label: "Verified", icon: BadgeCheck },
  rejected: { variant: "destructive", label: "Rejected", icon: AlertCircle },
};

const BankVerificationCard = () => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [verifyingOCR, setVerifyingOCR] = useState(false);
  const [ocrVerified, setOcrVerified] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editing, setEditing] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ["bank-verifications", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("bank_verifications").select("*").eq("profile_id", profile!.id);
      if (error) throw error;
      return (data ?? []) as any[];
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

  const { data: userBankAccounts = [] } = useQuery({
    queryKey: ["user-bank-accounts-verify", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_bank_accounts" as any)
        .select("id, bank_name, bank_holder_name, bank_account_number, bank_ifsc_code")
        .eq("profile_id", profile!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const effectiveSelectedId =
    selectedAccountId ?? (userBankAccounts.length >= 1 ? (userBankAccounts[0] as any).id : null);
  const selectedAccount: any = userBankAccounts.find((a: any) => a.id === effectiveSelectedId);
  const verification: any = verifications.find((v: any) => v.bank_account_id === effectiveSelectedId) ?? null;
  const maskAcct = (v: string) => (!v ? "" : v.length <= 4 ? v : "•".repeat(v.length - 4) + v.slice(-4));

  const statusForAccount = (accId: string) =>
    verifications.find((v: any) => v.bank_account_id === accId)?.status ?? null;

  const attemptCount = verification?.attempt_count ?? 1;
  const attemptsRemaining = Math.max(0, maxAttempts - attemptCount);
  const canRetry = verification?.status === "rejected" && attemptsRemaining > 0;

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !user?.id) throw new Error("Not authenticated");
      if (!selectedAccount) throw new Error("Please select a bank account to verify");
      if (!selectedFile && !verification?.document_path) {
        throw new Error("Please upload a bank statement or signed proof from your bank");
      }

      let documentPath = verification?.document_path || null;
      let documentName = verification?.document_name || null;

      if (selectedFile) {
        setUploading(true);
        const ext = selectedFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("bank-documents").upload(path, selectedFile);
        if (uploadError) throw uploadError;
        documentPath = path;
        documentName = selectedFile.name;
      }

      const newAttemptCount = verification ? attemptCount + 1 : 1;

      if (verification) {
        const { error } = await supabase
          .from("bank_verifications")
          .update({
            status: "pending" as any,
            document_path: documentPath,
            document_name: documentName,
            attempt_count: newAttemptCount,
            rejection_reason: null,
          })
          .eq("id", verification.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bank_verifications").insert({
          profile_id: profile.id,
          bank_account_id: selectedAccount.id,
          status: "pending" as any,
          document_path: documentPath,
          document_name: documentName,
          attempt_count: 1,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Bank verification request submitted");
      queryClient.invalidateQueries({ queryKey: ["bank-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["bank-verification-status"] });
      setSelectedFile(null);
      setOcrVerified(false);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    },
    onError: (e: any) => toast.error(e.message),
    onSettled: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!verification?.id) throw new Error("Nothing to delete");
      if (verification?.document_path) {
        await supabase.storage.from("bank-documents").remove([verification.document_path]);
      }
      const { error } = await supabase.from("bank_verifications").delete().eq("id", verification.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bank verification deleted");
      queryClient.invalidateQueries({ queryKey: ["bank-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["bank-verification-status"] });
      setSelectedFile(null);
      setOcrVerified(false);
      setEditing(false);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateDocMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !verification?.id) throw new Error("Not authenticated");
      if (!selectedFile) throw new Error("Please select a new file");

      setUploading(true);
      const ext = selectedFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("bank-documents").upload(path, selectedFile);
      if (uploadError) throw uploadError;

      const { error } = await supabase
        .from("bank_verifications")
        .update({
          document_path: path,
          document_name: selectedFile.name,
        })
        .eq("id", verification.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document updated");
      queryClient.invalidateQueries({ queryKey: ["bank-verifications"] });
      setSelectedFile(null);
      setOcrVerified(false);
      setEditing(false);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    },
    onError: (e: any) => toast.error(e.message),
    onSettled: () => setUploading(false),
  });

  // Dynamic script loading വഴി Tesseract ലോഡ് ചെയ്യുന്ന ഫങ്ഷൻ
  const loadTesseract = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).Tesseract) {
        resolve((window as any).Tesseract);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
      script.onload = () => resolve((window as any).Tesseract);
      script.onerror = () => reject(new Error("Failed to load Tesseract OCR library"));
      document.head.appendChild(script);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }
    if (!selectedAccount) {
      toast.error("Please select a bank account first.");
      return;
    }

    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      setSelectedFile(file);
      setOcrVerified(true);
      return;
    }

    setVerifyingOCR(true);
    setOcrVerified(false);
    const toastId = toast.loading("Scanning photo for bank details...");

    try {
      // ഇൻസ്റ്റാൾ ചെയ്യാതെ തന്നെ CDN ലൂടെ Tesseract ഇവിടെ ലോഡ് ചെയ്യുന്നു
      const tesseractInstance = await loadTesseract();
      const result = await tesseractInstance.recognize(file, "eng");
      const detectedText = result.data.text.toLowerCase();

      const requiredName = selectedAccount.bank_holder_name.toLowerCase();
      const requiredNumber = selectedAccount.bank_account_number.toLowerCase();
      const requiredIfsc = selectedAccount.bank_ifsc_code.toLowerCase();

      const cleanString = (str: string) => str.replace(/[^a-z0-9]/g, "");
      const cleanedText = cleanString(detectedText);

      const matchName = detectedText.includes(requiredName) || cleanedText.includes(cleanString(requiredName));
      const matchNumber = detectedText.includes(requiredNumber) || cleanedText.includes(cleanString(requiredNumber));
      const matchIfsc = detectedText.includes(requiredIfsc) || cleanedText.includes(cleanString(requiredIfsc));

      if (!matchName || !matchNumber || !matchIfsc) {
        const missingFields = [];
        if (!matchName) missingFields.push("Account Holder Name");
        if (!matchNumber) missingFields.push("Account Number");
        if (!matchIfsc) missingFields.push("IFSC Code");

        toast.error(
          `Verification Failed! Cannot detect: ${missingFields.join(", ")}. Please ensure the photo is clear.`,
          {
            id: toastId,
            duration: 5000,
          },
        );

        setSelectedFile(null);
        if (fileRef.current) fileRef.current.value = "";
        if (cameraRef.current) cameraRef.current.value = "";
      } else {
        toast.success("Bank details detected successfully!", { id: toastId });
        setSelectedFile(file);
        setOcrVerified(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to read text from the image. Please try again with a clearer picture.", { id: toastId });
    } finally {
      setVerifyingOCR(false);
    }
  };

  const hasBankDetails = userBankAccounts.length > 0;
  const cfg = verification ? (statusConfig[verification.status] ?? statusConfig.pending) : null;
  const canSubmit =
    hasBankDetails &&
    !!selectedAccount &&
    ((selectedFile && ocrVerified) || (!selectedFile && verification?.document_path));
  const isPending = verification?.status === "pending";

  const statusBadge = (s: string | null) => {
    if (!s) return <span className="text-[10px] text-muted-foreground">Not submitted</span>;
    const c = statusConfig[s] ?? statusConfig.pending;
    return (
      <Badge variant={c.variant} className="text-[10px] px-1.5 py-0">
        {c.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Landmark className="h-4 w-4" /> Bank Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isLoading && userBankAccounts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">
              {userBankAccounts.length > 1 ? "Select bank account to verify" : "Bank account to verify"}
            </p>
            <div className="space-y-2">
              {userBankAccounts.map((acc: any) => {
                const isSel = effectiveSelectedId === acc.id;
                const accStatus = statusForAccount(acc.id);
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setSelectedFile(null);
                      setOcrVerified(false);
                      setEditing(false);
                    }}
                    className={`w-full rounded-md border p-3 text-left transition-colors ${
                      isSel ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{acc.bank_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{acc.bank_holder_name}</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span>A/C: {maskAcct(acc.bank_account_number)}</span>
                          <span>IFSC: {maskAcct(acc.bank_ifsc_code)}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {statusBadge(accStatus)}
                        {isSel && <BadgeCheck className="h-4 w-4 text-primary" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : verification ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={cfg!.variant}>{cfg!.label}</Badge>
              </div>
              {isPending && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditing(true);
                      setSelectedFile(null);
                      setOcrVerified(false);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Bank Verification?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove your verification request and uploaded document. You can submit again later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                          {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {verification.document_name && !editing && (
              <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="truncate text-muted-foreground">{verification.document_name}</span>
              </div>
            )}

            {isPending && editing && (
              <div className="space-y-2 rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Upload a new document to replace the current one.</p>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <input
                  ref={cameraRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                  capture="environment"
                />

                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => fileRef.current?.click()}
                      disabled={verifyingOCR}
                    >
                      <Upload className="h-3.5 w-3.5" /> File
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => cameraRef.current?.click()}
                      disabled={verifyingOCR}
                    >
                      <Camera className="h-3.5 w-3.5" /> Camera
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateDocMutation.mutate()}
                      disabled={updateDocMutation.isPending || !selectedFile || verifyingOCR || !ocrVerified}
                    >
                      {updateDocMutation.isPending ? "Updating..." : "Update Document"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(false);
                        setSelectedFile(null);
                        setOcrVerified(false);
                      }}
                      disabled={verifyingOCR}
                    >
                      Cancel
                    </Button>
                  </div>
                  {verifyingOCR && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" /> Scanning document text...
                    </div>
                  )}
                  {selectedFile && (
                    <span className="text-xs text-muted-foreground text-emerald-600 font-medium">
                      ✓ Ready: {selectedFile.name}
                    </span>
                  )}
                </div>
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
                      <span className="ml-1 font-medium">
                        Attempts remaining: {attemptsRemaining} of {maxAttempts}
                      </span>
                    </p>
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <input
                      ref={cameraRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*"
                      capture="environment"
                    />

                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => fileRef.current?.click()}
                          disabled={verifyingOCR}
                        >
                          <Upload className="h-3.5 w-3.5" /> Upload File
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => cameraRef.current?.click()}
                          disabled={verifyingOCR}
                        >
                          <Camera className="h-3.5 w-3.5" /> Take Photo
                        </Button>
                        <Button
                          size="sm"
                          className="ml-2"
                          onClick={() => submitMutation.mutate()}
                          disabled={submitMutation.isPending || !hasBankDetails || verifyingOCR || !canSubmit}
                        >
                          {submitMutation.isPending ? "Submitting..." : "Resubmit"}
                        </Button>
                      </div>
                      {verifyingOCR && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" /> Scanning photo text...
                        </div>
                      )}
                      {selectedFile && (
                        <span className="text-xs text-muted-foreground text-emerald-600 font-medium">
                          ✓ Ready: {selectedFile.name}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    <p className="font-medium">Maximum attempts reached</p>
                    <p className="text-xs">
                      You have used all {maxAttempts} verification attempts. Please contact support for assistance.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {hasBankDetails
                ? "Upload a bank statement or signed proof for the selected account, then submit for verification. Withdrawals require verified bank details."
                : "Add a bank account in your profile first, then upload proof and submit for verification."}
            </p>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <input
              ref={cameraRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
            />

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => fileRef.current?.click()}
                  disabled={!hasBankDetails || !selectedAccount || verifyingOCR}
                >
                  <Upload className="h-3.5 w-3.5" /> Upload File
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => cameraRef.current?.click()}
                  disabled={!hasBankDetails || !selectedAccount || verifyingOCR}
                >
                  <Camera className="h-3.5 w-3.5" /> Take Photo
                </Button>
                <Button
                  size="sm"
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending || uploading || verifyingOCR || !canSubmit}
                >
                  {submitMutation.isPending || uploading ? "Submitting..." : "Submit for Verification"}
                </Button>
              </div>
              {verifyingOCR && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" /> Scanning photo text...
                </div>
              )}
              {selectedFile && (
                <span className="text-xs text-muted-foreground text-emerald-600 font-medium">
                  ✓ Ready: {selectedFile.name}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BankVerificationCard;
