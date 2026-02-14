import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ShieldCheck, Upload, AlertTriangle, CheckCircle2, Clock, XCircle, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AadhaarVerificationCard = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    aadhaar_number: "",
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
        .select("id, aadhaar_number, name_on_aadhaar, dob_on_aadhaar, address_on_aadhaar, front_image_path, back_image_path, status, rejection_reason, created_at, verified_at")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error("Not authenticated");
      const isEditMode = !!verification && verification.status === "pending";
      if (!isEditMode && (!frontFile || !backFile)) throw new Error("Upload both sides of Aadhaar card");
      if (form.aadhaar_number.replace(/\s/g, "").length !== 12) throw new Error("Aadhaar number must be 12 digits");

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
        aadhaar_number: form.aadhaar_number.replace(/\s/g, ""),
        name_on_aadhaar: form.name_on_aadhaar,
        dob_on_aadhaar: form.dob_on_aadhaar,
        address_on_aadhaar: form.address_on_aadhaar,
        front_image_path: frontPath,
        back_image_path: backPath,
        status: "pending" as const,
      };

      if (verification) {
        const { error } = await supabase
          .from("aadhaar_verifications")
          .update(payload)
          .eq("id", verification.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("aadhaar_verifications")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Aadhaar verification submitted for review");
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
      // Delete uploaded images from storage
      await supabase.storage.from("aadhaar-documents").remove([verification.front_image_path, verification.back_image_path].filter(Boolean) as string[]);
      const { error } = await supabase.from("aadhaar_verifications").delete().eq("id", verification.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aadhaar verification deleted");
      queryClient.invalidateQueries({ queryKey: ["aadhaar-verification"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Card><CardContent className="p-6 text-center text-muted-foreground">Loading...</CardContent></Card>;

  const statusConfig = {
    pending: { icon: Clock, color: "text-warning", badge: "secondary" as const, label: "Pending Review" },
    under_process: { icon: Clock, color: "text-primary", badge: "secondary" as const, label: "Under Process" },
    verified: { icon: CheckCircle2, color: "text-accent", badge: "default" as const, label: "Verified" },
    rejected: { icon: XCircle, color: "text-destructive", badge: "destructive" as const, label: "Rejected" },
  };

  const isPending = verification?.status === "pending";

  // If editing a pending verification, show the form
  if (editing && verification && isPending) {
    // Fall through to the form below by treating as resubmit
  }
  // Show status if already submitted and not editing
  else if (verification && verification.status !== "rejected") {
    const cfg = statusConfig[verification.status as keyof typeof statusConfig];
    const Icon = cfg?.icon ?? Clock;
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Aadhaar Verification
            </span>
            {isPending && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                  setForm({
                    aadhaar_number: verification.aadhaar_number,
                    name_on_aadhaar: verification.name_on_aadhaar,
                    dob_on_aadhaar: verification.dob_on_aadhaar,
                    address_on_aadhaar: verification.address_on_aadhaar,
                  });
                  setEditing(true);
                }}>
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
                      <AlertDialogTitle>Delete Aadhaar Verification?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete your submitted Aadhaar verification. You can submit a new one later.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                        {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${cfg?.color}`} />
            <Badge variant={cfg?.badge}>{cfg?.label}</Badge>
          </div>
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {verification.name_on_aadhaar}</p>
            <p><span className="text-muted-foreground">Aadhaar:</span> {"XXXX-XXXX-" + verification.aadhaar_number.slice(-4)}</p>
            <p><span className="text-muted-foreground">DOB:</span> {verification.dob_on_aadhaar}</p>
          </div>
          {verification.status === "verified" && verification.verified_at && (
            <p className="text-xs text-muted-foreground">Verified on {new Date(verification.verified_at).toLocaleDateString()}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show form for new submission, resubmission after rejection, or editing pending
  const isResubmit = verification?.status === "rejected";
  const isEdit = editing && isPending;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" /> Aadhaar Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isResubmit && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Previous submission rejected</p>
              {verification?.rejection_reason && <p className="mt-1 text-xs">{verification.rejection_reason}</p>}
            </div>
          </div>
        )}

        {!isResubmit && (
          <p className="text-sm text-muted-foreground">
            Verify your identity by providing your Aadhaar card details. This helps us ensure the authenticity of our platform users.
          </p>
        )}

        <div className="space-y-3">
          <div>
            <Label>Aadhaar Number</Label>
            <Input placeholder="1234 5678 9012" maxLength={14} value={form.aadhaar_number}
              onChange={(e) => setForm((p) => ({ ...p, aadhaar_number: e.target.value }))} />
          </div>
          <div>
            <Label>Name (as on Aadhaar)</Label>
            <Input placeholder="Full name as printed on card" value={form.name_on_aadhaar}
              onChange={(e) => setForm((p) => ({ ...p, name_on_aadhaar: e.target.value }))} />
          </div>
          <div>
            <Label>Date of Birth (as on Aadhaar)</Label>
            <Input type="date" value={form.dob_on_aadhaar}
              onChange={(e) => setForm((p) => ({ ...p, dob_on_aadhaar: e.target.value }))} />
          </div>
          <div>
            <Label>Address (as on Aadhaar)</Label>
            <Textarea placeholder="Full address as printed on card" value={form.address_on_aadhaar}
              onChange={(e) => setForm((p) => ({ ...p, address_on_aadhaar: e.target.value }))} className="min-h-[60px]" />
          </div>
          <div>
            <Label>Front Side of Aadhaar Card</Label>
            <input ref={frontRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)} />
            <Button variant="outline" size="sm" className="mt-1 w-full" onClick={() => frontRef.current?.click()}>
              <Upload className="mr-2 h-3 w-3" /> {frontFile ? frontFile.name : "Upload front image"}
            </Button>
          </div>
          <div>
            <Label>Back Side of Aadhaar Card</Label>
            <input ref={backRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => setBackFile(e.target.files?.[0] ?? null)} />
            <Button variant="outline" size="sm" className="mt-1 w-full" onClick={() => backRef.current?.click()}>
              <Upload className="mr-2 h-3 w-3" /> {backFile ? backFile.name : "Upload back image"}
            </Button>
          </div>
        </div>

        {isEdit && (
          <Button variant="outline" className="w-full" onClick={() => setEditing(false)}>Cancel</Button>
        )}
        <Button className="w-full" disabled={submitMutation.isPending || !form.aadhaar_number || !form.name_on_aadhaar || !form.dob_on_aadhaar || !form.address_on_aadhaar || (!isEdit && (!frontFile || !backFile))}
          onClick={() => submitMutation.mutate()}>
          {submitMutation.isPending ? "Submitting..." : isEdit ? "Update Verification" : isResubmit ? "Resubmit for Verification" : "Submit for Verification"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AadhaarVerificationCard;
