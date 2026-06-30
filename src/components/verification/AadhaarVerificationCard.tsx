import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  ShieldCheck,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Pencil,
  Trash2,
  Loader2,
  FileImage,
  User,
  Calendar,
  MapPin,
  Hash,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const AadhaarVerificationCard = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    aadhaar_number: "",
    confirm_aadhaar_number: "",
    name_on_aadhaar: "",
    dob_on_aadhaar: "",
    address_on_aadhaar: "",
  });
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);

  const { data: verification, isLoading } = useQuery({
    queryKey: ["aadhaar-verification", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aadhaar_verifications")
        .select(
          "id, aadhaar_number, name_on_aadhaar, dob_on_aadhaar, address_on_aadhaar, front_image_path, back_image_path, status, rejection_reason, created_at, verified_at",
        )
        .eq("profile_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const cleanAadhaar = (num: string) => num.replace(/\s/g, "");

  const isAadhaarMatch =
    form.aadhaar_number &&
    form.confirm_aadhaar_number &&
    cleanAadhaar(form.aadhaar_number) === cleanAadhaar(form.confirm_aadhaar_number);

  const speakSubmissionStatus = (status: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      let message = "Thank you for your submission. Your identity documents are being processed.";

      if (status === "pending") {
        message =
          "Thank you for your submission. Your identity number is being verified automatically. Please wait while we complete the verification process.";
      } else if (status === "under_process") {
        message =
          "Our team is actively reviewing your submission and verifying the uploaded document images. You will be updated shortly.";
      }

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error("Not authenticated");
      const isEditMode = !!verification && verification.status === "pending";
      if (!isEditMode && (!frontFile || !backFile)) throw new Error("Upload both sides of your ID card");

      const aadhaarClean = cleanAadhaar(form.aadhaar_number);
      if (aadhaarClean.length !== 12) throw new Error("Identification number must be 12 digits");
      if (aadhaarClean !== cleanAadhaar(form.confirm_aadhaar_number)) {
        throw new Error("Numbers do not match");
      }

      let frontPath = verification?.front_image_path ?? "";
      let backPath = verification?.back_image_path ?? "";

      if (frontFile) {
        const fp = `${user.id}/aadhaar-front-${Date.now()}`;
        const { error: fe } = await supabase.storage.from("aadhaar-documents").upload(fp, frontFile);
        if (fe) throw fe;
        frontPath = fp;
      }

      if (backFile) {
        const bp = `${user.id}/aadhaar-back-${Date.now()}`;
        const { error: be } = await supabase.storage.from("aadhaar-documents").upload(bp, backFile);
        if (be) throw be;
        backPath = bp;
      }

      const payload = {
        profile_id: profile.id,
        aadhaar_number: aadhaarClean,
        name_on_aadhaar: form.name_on_aadhaar,
        dob_on_aadhaar: form.dob_on_aadhaar,
        address_on_aadhaar: form.address_on_aadhaar,
        front_image_path: frontPath,
        back_image_path: backPath,
        status: "pending" as const,
      };

      if (verification) {
        const { error } = await supabase.from("aadhaar_verifications").update(payload).eq("id", verification.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("aadhaar_verifications").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Verification submitted for review");
      speakSubmissionStatus("pending");
      queryClient.invalidateQueries({ queryKey: ["aadhaar-verification"] });
      setFrontFile(null);
      setBackFile(null);
      setEditing(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!verification) throw new Error("No verification to delete");
      await supabase.storage
        .from("aadhaar-documents")
        .remove([verification.front_image_path, verification.back_image_path].filter(Boolean) as string[]);
      const { error } = await supabase.from("aadhaar_verifications").delete().eq("id", verification.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Verification data removed");
      queryClient.invalidateQueries({ queryKey: ["aadhaar-verification"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <Card className="border-muted/40 shadow-sm">
        <CardContent className="p-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading verification data...</p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      color:
        "text-amber-600 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-amber-500/15 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-pulse",
      badge: "secondary" as const,
      label: "Pending Review",
      description:
        "Thank you for your submission. Your data is being verified automatically. Please wait while we complete the verification process.",
    },
    under_process: {
      icon: Loader2,
      color: "text-blue-600 bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]",
      badge: "secondary" as const,
      label: "Under Process",
      description:
        "Our team is actively reviewing your submission and verifying the uploaded document images. You will be updated shortly.",
    },
    verified: {
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
      badge: "default" as const,
      label: "Verified Pro",
      description: "Your professional identity verification is successful. Your profile has been officially verified.",
    },
    rejected: {
      icon: XCircle,
      color: "text-rose-600 bg-rose-500/10 border-rose-500/20",
      badge: "destructive" as const,
      label: "Rejected",
      description:
        "Your verification request has been rejected. Please look at the reason below and submit valid documents again.",
    },
  };

  const isPending = verification?.status === "pending";
  const isUnderProcess = verification?.status === "under_process";

  // Trigger TTS voice when component transitions to under_process state
  if (isUnderProcess) {
    speakSubmissionStatus("under_process");
  }

  if (verification && verification.status !== "rejected" && !editing) {
    const cfg = statusConfig[verification.status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = cfg.icon;

    return (
      <Card
        className={`overflow-hidden border-muted/50 shadow-md transition-all duration-300 hover:shadow-lg ${isPending ? "border-amber-500/40 shadow-[0_4px_25px_rgba(245,158,11,0.1)] scale-[1.01]" : ""}`}
      >
        <CardHeader className="bg-muted/30 border-b border-muted/20 pb-4">
          <CardTitle className="flex items-center justify-between text-base font-semibold">
            <span className="flex items-center gap-2 text-foreground">
              <ShieldCheck
                className={`h-5 w-5 text-primary ${isPending ? "animate-bounce" : ""}`}
                style={isPending ? { animationDuration: "2s" } : undefined}
              />
              Identity Verification Status
            </span>
            {isPending && (
              <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-muted-foreground/20 hover:bg-background transition-transform active:scale-95"
                  onClick={() => {
                    setForm({
                      aadhaar_number: verification.aadhaar_number,
                      confirm_aadhaar_number: verification.aadhaar_number,
                      name_on_aadhaar: verification.name_on_aadhaar,
                      dob_on_aadhaar: verification.dob_on_aadhaar,
                      address_on_aadhaar: verification.address_on_aadhaar,
                    });
                    setEditing(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Remove Aadhaar document"
                      className="h-8 w-8 rounded-full text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive transition-transform active:scale-95"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Verification Submission?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove your submitted information and document images. You will need to
                        complete verification again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90 rounded-lg"
                        onClick={() => deleteMutation.mutate()}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Delete Completely
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className={`flex items-start gap-3 rounded-xl p-4 border transition-all duration-500 ${cfg.color}`}>
            <Icon
              className={`h-6 w-6 shrink-0 mt-0.5 ${verification.status === "under_process" ? "animate-spin" : ""} ${isPending ? "animate-spin" : ""}`}
              style={isPending ? { animationDuration: "3s" } : undefined}
            />
            <div className="animate-in fade-in slide-in-from-left-2 duration-500 flex-1">
              <div className="font-bold text-sm tracking-wide flex items-center justify-between gap-1.5">
                <span className="flex items-center gap-2">
                  {cfg.label}
                  {isPending && <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />}
                  {isUnderProcess && <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
                </span>
                {isPending && (
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-bold tracking-wider animate-pulse border-amber-500/40 bg-amber-500/10 text-amber-700"
                  >
                    Verifying
                  </Badge>
                )}
                {isUnderProcess && (
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-bold tracking-wider animate-pulse border-blue-500/40 bg-blue-500/10 text-blue-700"
                  >
                    Processing
                  </Badge>
                )}
              </div>
              <div className="text-xs opacity-95 mt-1.5 whitespace-pre-line leading-relaxed font-medium">
                {cfg.description}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 rounded-xl border border-muted/40 p-4 bg-muted/10 text-sm animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block">Full Name</span>
              <p className="font-medium text-foreground flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" /> {verification.name_on_aadhaar}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block">ID Number</span>
              <p className="font-medium tracking-wider text-foreground flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                {"XXXX XXXX " + (verification.aadhaar_number ? verification.aadhaar_number.slice(-4) : "—")}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block">Date of Birth</span>
              <p className="font-medium text-foreground flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {verification.dob_on_aadhaar}
              </p>
            </div>
            <div className="space-y-1 sm:col-span-2 border-t border-muted/30 pt-3 mt-1">
              <span className="text-xs font-medium text-muted-foreground block">Address Provided</span>
              <p className="font-medium text-foreground leading-relaxed flex items-start gap-2 pt-0.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                {verification.address_on_aadhaar}
              </p>
            </div>
          </div>

          {verification.status === "verified" && verification.verified_at && (
            <p className="text-xs text-center text-muted-foreground font-medium bg-muted/20 py-2 rounded-lg">
              Verified officially on{" "}
              {new Date(verification.verified_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const isResubmit = verification?.status === "rejected";
  const isEdit = editing && isPending;

  return (
    <Card className="border-muted/50 shadow-md">
      <CardHeader className="pb-4 border-b border-muted/20 bg-muted/10">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" /> Identity Verification
        </CardTitle>
        <CardDescription>Verify your identity by providing documentation securely.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {isResubmit && (
          <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-600">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
            <div>
              <p className="font-semibold">Previous Submission Rejected</p>
              {verification?.rejection_reason && (
                <p className="mt-1 text-xs text-rose-600/90 leading-relaxed">{verification.rejection_reason}</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Identity Card Number</Label>
              <Input
                placeholder="1234 5678 9012"
                maxLength={14}
                value={form.aadhaar_number}
                className="h-10 border-muted-foreground/20 focus-visible:ring-primary rounded-lg"
                onChange={(e) => setForm((p) => ({ ...p, aadhaar_number: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Confirm Number</Label>
              <div className="relative">
                <Input
                  placeholder="Re-enter card number"
                  maxLength={14}
                  value={form.confirm_aadhaar_number}
                  className={`h-10 border-muted-foreground/20 rounded-lg pr-10 focus-visible:ring-primary ${
                    form.confirm_aadhaar_number && !isAadhaarMatch ? "border-rose-500 focus-visible:ring-rose-500" : ""
                  }`}
                  onChange={(e) => setForm((p) => ({ ...p, confirm_aadhaar_number: e.target.value }))}
                />
                {isAadhaarMatch && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-in fade-in zoom-in-75 duration-200">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                )}
              </div>
              {form.confirm_aadhaar_number && !isAadhaarMatch && (
                <p className="text-[11px] text-rose-500 font-medium mt-0.5">Numbers do not match</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Full Name (As printed on card)</Label>
              <Input
                placeholder="Name printed on identity card"
                value={form.name_on_aadhaar}
                className="h-10 border-muted-foreground/20 rounded-lg"
                onChange={(e) => setForm((p) => ({ ...p, name_on_aadhaar: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Date of Birth</Label>
              <Input
                type="date"
                value={form.dob_on_aadhaar}
                className="h-10 border-muted-foreground/20 rounded-lg"
                onChange={(e) => setForm((p) => ({ ...p, dob_on_aadhaar: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground/80">Full Address</Label>
            <Textarea
              placeholder="Complete residential address as printed on your card"
              value={form.address_on_aadhaar}
              onChange={(e) => setForm((p) => ({ ...p, address_on_aadhaar: e.target.value }))}
              className="min-h-[80px] border-muted-foreground/20 rounded-lg resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Front Side Image</Label>
              <input
                ref={frontRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)}
              />
              <div
                onClick={() => frontRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${frontFile ? "border-primary/50 bg-primary/5" : "border-muted-foreground/20 hover:bg-muted/20"}`}
              >
                <div
                  className={`p-2.5 rounded-full mb-2 ${frontFile ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  <FileImage className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold max-w-[180px] truncate text-foreground">
                  {frontFile ? frontFile.name : "Click to upload front"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {frontFile ? "Image ready" : "JPG, PNG formats"}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Back Side Image</Label>
              <input
                ref={backRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setBackFile(e.target.files?.[0] ?? null)}
              />
              <div
                onClick={() => backRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${backFile ? "border-primary/50 bg-primary/5" : "border-muted-foreground/20 hover:bg-muted/20"}`}
              >
                <div
                  className={`p-2.5 rounded-full mb-2 ${backFile ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  <FileImage className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold max-w-[180px] truncate text-foreground">
                  {backFile ? backFile.name : "Click to upload back"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {backFile ? "Image ready" : "JPG, PNG formats"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            className="w-full h-10 font-semibold rounded-lg shadow-sm"
            disabled={
              submitMutation.isPending ||
              !form.aadhaar_number ||
              !form.confirm_aadhaar_number ||
              !isAadhaarMatch ||
              !form.name_on_aadhaar ||
              !form.dob_on_aadhaar ||
              !form.address_on_aadhaar ||
              (!isEdit && (!frontFile || !backFile))
            }
            onClick={() => submitMutation.mutate()}
          >
            {submitMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
              </span>
            ) : isEdit ? (
              "Update Verification Data"
            ) : isResubmit ? (
              "Resubmit Document"
            ) : (
              "Submit Identity Documents"
            )}
          </Button>

          {isEdit && (
            <Button
              variant="outline"
              className="w-full h-10 rounded-lg text-muted-foreground"
              onClick={() => setEditing(false)}
            >
              Cancel Changes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AadhaarVerificationCard;
