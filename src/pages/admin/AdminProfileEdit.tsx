import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Briefcase,
  AlertCircle,
  ShieldCheck,
  ShieldOff,
  RotateCcw,
  BadgeCheck,
  Wallet,
  MapPin,
  Globe,
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

type ProfileData = {
  id: string;
  full_name: string[];
  user_code: string[];
  email: string;
  user_type: string;
  approval_status: string;
  mobile_number: string | null;
  whatsapp_number: string | null;
  gender: string | null;
  date_of_birth: string | null;
  marital_status: string | null;
  education_level: string | null;
  previous_job_details: string | null;
  work_experience: string | null;
  education_background: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  upi_id: string | null;
  bank_account_number: string | null;
  bank_ifsc_code: string | null;
  bank_name: string | null;
  available_balance: number;
  hold_balance: number;
  approval_notes: string | null;
  is_disabled: boolean;
  disabled_reason: string | null;
  created_at: string;
  approved_at: string | null;
};

type RegistrationMeta = {
  ip_address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
};

const AdminProfileEdit = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [regMeta, setRegMeta] = useState<RegistrationMeta | null>(null);

  // Form state
  const [form, setForm] = useState({
    full_name: "",
    user_code: "",
    email: "",
    mobile_number: "",
    whatsapp_number: "",
    gender: "",
    date_of_birth: "",
    marital_status: "",
    education_level: "",
    previous_job_details: "",
    work_experience: "",
    education_background: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    approval_status: "",
    approval_notes: "",
    is_disabled: false,
    disabled_reason: "",
    upi_id: "",
    bank_name: "",
    bank_account_number: "",
    bank_ifsc_code: "",
  });

  useEffect(() => {
    if (!profileId) return;
    const fetchData = async () => {
      setLoading(true);
      const [{ data: p }, { data: av }, { data: meta }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, user_code, email, user_type, approval_status, mobile_number, whatsapp_number, gender, date_of_birth, marital_status, education_level, previous_job_details, work_experience, education_background, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, upi_id, bank_account_number, bank_ifsc_code, bank_name, available_balance, hold_balance, approval_notes, is_disabled, disabled_reason, created_at, approved_at")
          .eq("id", profileId)
          .single(),
        supabase
          .from("aadhaar_verifications")
          .select("status")
          .eq("profile_id", profileId)
          .maybeSingle(),
        supabase
          .from("registration_metadata" as any)
          .select("ip_address, city, region, country, latitude, longitude")
          .eq("profile_id", profileId)
          .maybeSingle(),
      ]);
      if (p) {
        setProfile(p as ProfileData);
        setForm({
          full_name: p.full_name?.[0] || "",
          user_code: p.user_code?.[0] || "",
          email: p.email || "",
          mobile_number: p.mobile_number || "",
          whatsapp_number: p.whatsapp_number || "",
          gender: p.gender || "",
          date_of_birth: p.date_of_birth || "",
          marital_status: p.marital_status || "",
          education_level: p.education_level || "",
          previous_job_details: p.previous_job_details || "",
          work_experience: p.work_experience || "",
          education_background: p.education_background || "",
          emergency_contact_name: p.emergency_contact_name || "",
          emergency_contact_phone: p.emergency_contact_phone || "",
          emergency_contact_relationship: p.emergency_contact_relationship || "",
          approval_status: p.approval_status || "pending",
          approval_notes: p.approval_notes || "",
          is_disabled: p.is_disabled ?? false,
          disabled_reason: p.disabled_reason || "",
          upi_id: p.upi_id || "",
          bank_name: p.bank_name || "",
          bank_account_number: p.bank_account_number || "",
          bank_ifsc_code: p.bank_ifsc_code || "",
        });
      }
      setAadhaarVerified(av?.status === "verified");
      setRegMeta((meta as unknown as RegistrationMeta) || null);
      setLoading(false);
    };
    fetchData();
  }, [profileId]);

  const updateField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: [form.full_name],
        user_code: [form.user_code],
        email: form.email,
        mobile_number: form.mobile_number || null,
        whatsapp_number: form.whatsapp_number || null,
        gender: (form.gender || null) as any,
        date_of_birth: form.date_of_birth || null,
        marital_status: (form.marital_status || null) as any,
        education_level: form.education_level || null,
        previous_job_details: form.previous_job_details || null,
        work_experience: form.work_experience || null,
        education_background: form.education_background || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        emergency_contact_relationship: form.emergency_contact_relationship || null,
        approval_status: form.approval_status as any,
        approval_notes: form.approval_notes || null,
        is_disabled: form.is_disabled,
        disabled_reason: form.disabled_reason || null,
        upi_id: form.upi_id || null,
        bank_name: form.bank_name || null,
        bank_account_number: form.bank_account_number || null,
        bank_ifsc_code: form.bank_ifsc_code || null,
        approved_at: form.approval_status === "approved" ? new Date().toISOString() : profile.approved_at,
      })
      .eq("id", profile.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to save changes: " + error.message);
    } else {
      toast.success("Profile updated successfully");
      // Refresh
      setProfile((prev) =>
        prev ? { ...prev, full_name: [form.full_name], email: form.email, approval_status: form.approval_status } : prev
      );
    }
  };

  const handleResetBalance = async () => {
    if (!profile) return;
    const { error } = await supabase
      .from("profiles")
      .update({ available_balance: 0, hold_balance: 0 })
      .eq("id", profile.id);
    if (error) {
      toast.error("Failed to reset balance");
    } else {
      toast.success("Balance reset to ₹0");
      setProfile((prev) => (prev ? { ...prev, available_balance: 0, hold_balance: 0 } : prev));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium text-muted-foreground">Profile not found</p>
        <Button variant="outline" onClick={() => navigate("/admin/users")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              {form.full_name || "User"}
              {aadhaarVerified && <BadgeCheck className="h-5 w-5 text-accent" />}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{profile.user_code?.[0]}</span>
              <Badge variant="secondary" className="capitalize">{profile.user_type}</Badge>
              <Badge
                variant="outline"
                className={
                  form.approval_status === "approved"
                    ? "bg-accent/15 text-accent border-accent/30"
                    : form.approval_status === "rejected"
                    ? "bg-destructive/15 text-destructive border-destructive/30"
                    : "bg-warning/15 text-warning border-warning/30"
                }
              >
                {form.approval_status}
              </Badge>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {/* Account Status & Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" /> Account Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Approval Status</Label>
              <Select value={form.approval_status} onValueChange={(v) => updateField("approval_status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Approval Notes</Label>
              <Input
                value={form.approval_notes}
                onChange={(e) => updateField("approval_notes", e.target.value)}
                placeholder="Reason for status change…"
              />
            </div>
          </div>

          <Separator />

          {/* Disable/Enable Account */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {form.is_disabled ? (
                  <ShieldOff className="h-4 w-4 text-destructive" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-accent" />
                )}
                <p className="text-sm font-medium">
                  Account {form.is_disabled ? "Disabled" : "Active"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {form.is_disabled
                  ? "This user cannot log in. Toggle to re-enable access."
                  : "This user can log in normally. Toggle to block access."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_disabled}
                onCheckedChange={(checked) => updateField("is_disabled", checked)}
              />
              <span className="text-sm text-muted-foreground">
                {form.is_disabled ? "Disabled" : "Enabled"}
              </span>
            </div>
          </div>

          {form.is_disabled && (
            <div className="space-y-2">
              <Label>Reason for disabling</Label>
              <Input
                value={form.disabled_reason}
                onChange={(e) => updateField("disabled_reason", e.target.value)}
                placeholder="e.g. Suspicious activity, policy violation…"
              />
            </div>
          )}

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Balance</p>
              <p className="text-sm text-muted-foreground">
                Available: <span className="font-semibold text-foreground">₹{profile.available_balance}</span>
                {" · "}
                Hold: <span className="font-semibold text-foreground">₹{profile.hold_balance}</span>
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive">
                  <RotateCcw className="mr-1 h-3 w-3" /> Reset Balance
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset balance to ₹0?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will set both available and hold balances to ₹0 for {form.full_name}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetBalance}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>User Code</Label>
              <Input value={form.user_code} onChange={(e) => updateField("user_code", e.target.value)} placeholder="e.g. EMP00001" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <Input value={form.mobile_number} onChange={(e) => updateField("mobile_number", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp Number</Label>
              <Input value={form.whatsapp_number} onChange={(e) => updateField("whatsapp_number", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={(e) => updateField("date_of_birth", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Marital Status</Label>
              <Select value={form.marital_status} onValueChange={(v) => updateField("marital_status", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Education Level</Label>
              <Input value={form.education_level} onChange={(e) => updateField("education_level", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4" /> Professional Background
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-1">
            <div className="space-y-2">
              <Label>Previous Job Details</Label>
              <Textarea value={form.previous_job_details} onChange={(e) => updateField("previous_job_details", e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Work Experience</Label>
              <Textarea value={form.work_experience} onChange={(e) => updateField("work_experience", e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Education Background</Label>
              <Textarea value={form.education_background} onChange={(e) => updateField("education_background", e.target.value)} rows={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial / Payment Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" /> Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>UPI ID</Label>
              <Input value={form.upi_id} onChange={(e) => updateField("upi_id", e.target.value)} placeholder="e.g. name@upi" />
            </div>
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input value={form.bank_name} onChange={(e) => updateField("bank_name", e.target.value)} placeholder="e.g. State Bank of India" />
            </div>
            <div className="space-y-2">
              <Label>Bank Account Number</Label>
              <Input value={form.bank_account_number} onChange={(e) => updateField("bank_account_number", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bank IFSC Code</Label>
              <Input value={form.bank_ifsc_code} onChange={(e) => updateField("bank_ifsc_code", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4" /> Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.emergency_contact_name} onChange={(e) => updateField("emergency_contact_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.emergency_contact_phone} onChange={(e) => updateField("emergency_contact_phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Input value={form.emergency_contact_relationship} onChange={(e) => updateField("emergency_contact_relationship", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Metadata */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" /> Registration Metadata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">IP Address</p>
              <p className="font-mono font-medium">{regMeta?.ip_address || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="font-medium">
                {[regMeta?.city, regMeta?.region, regMeta?.country]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Coordinates</p>
              {regMeta?.latitude && regMeta?.longitude ? (
                <div className="flex items-center gap-2">
                  <p className="font-mono font-medium">
                    {regMeta.latitude}, {regMeta.longitude}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${regMeta.latitude},${regMeta.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <MapPin className="h-3 w-3" /> Map
                  </a>
                </div>
              ) : (
                <p className="font-medium">—</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Registered</p>
              <p className="font-medium">{new Date(profile.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Approved At</p>
              <p className="font-medium">{profile.approved_at ? new Date(profile.approved_at).toLocaleString() : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Aadhaar Verified</p>
              <p className="font-medium">{aadhaarVerified ? "Yes ✓" : "No"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfileEdit;
