import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Calendar, Save, X, Edit, ArrowLeft, ShieldCheck, AtSign, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";

const ProfilePersonalInfo = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    mobileNumber: "",
    whatsappNumber: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
  });
  const [usernameCheck, setUsernameCheck] = useState<{ status: "idle" | "checking" | "available" | "taken" | "invalid"; message?: string }>({ status: "idle" });


  const { pathname } = useLocation();
  const base = pathname.startsWith("/freelancer") ? "/freelancer" : pathname.startsWith("/employer") ? "/employer" : "/employee";

  const startEditing = () => {
    setForm({
      fullName: Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name ?? "",
      username: (profile as any)?.username ?? "",
      mobileNumber: profile?.mobile_number ?? "",
      whatsappNumber: profile?.whatsapp_number ?? "",
      dateOfBirth: profile?.date_of_birth ?? "",
      gender: profile?.gender ?? "",
      maritalStatus: profile?.marital_status ?? "",
    });
    setUsernameCheck({ status: "idle" });
    setEditing(true);
  };

  // Debounced username availability check
  useEffect(() => {
    if (!editing) return;
    const username = form.username.trim().toLowerCase();
    const current = ((profile as any)?.username ?? "").toLowerCase();
    if (!username) { setUsernameCheck({ status: "idle" }); return; }
    if (username === current) { setUsernameCheck({ status: "available", message: "This is your current username" }); return; }
    if (!/^[a-zA-Z0-9_.]{3,30}$/.test(username)) {
      setUsernameCheck({ status: "invalid", message: "3–30 chars. Letters, numbers, dot, underscore." });
      return;
    }
    setUsernameCheck({ status: "checking" });
    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", profile!.id)
        .maybeSingle();
      if (error) { setUsernameCheck({ status: "idle" }); return; }
      setUsernameCheck(data ? { status: "taken", message: "Username already taken" } : { status: "available", message: "Username is available" });
    }, 450);
    return () => clearTimeout(t);
  }, [form.username, editing, profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Profile not found");
      const fullName = form.fullName.trim();
      const username = form.username.trim().toLowerCase();
      const mobileNumber = form.mobileNumber.replace(/\D/g, "");
      const whatsappNumber = form.whatsappNumber.replace(/\D/g, "");

      if (!fullName) throw new Error("Full name is required.");
      if (!username) throw new Error("Username is required.");
      if (!/^[a-zA-Z0-9_.]{3,30}$/.test(username)) throw new Error("Username: 3–30 chars, letters/numbers/./_ only.");
      if (mobileNumber && mobileNumber.length !== 10) throw new Error("Enter a valid 10-digit mobile number.");
      if (whatsappNumber && whatsappNumber.length !== 10) throw new Error("Enter a valid 10-digit WhatsApp number.");
      if (usernameCheck.status === "taken") throw new Error("Username already taken.");
      if (usernameCheck.status === "checking") throw new Error("Please wait — checking username…");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: [fullName],
          username,
          mobile_number: mobileNumber || null,
          whatsapp_number: whatsappNumber || null,
          date_of_birth: form.dateOfBirth || null,
          gender: form.gender || null,
          marital_status: form.maritalStatus || null,
        } as any)
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Personal information updated.");
      setEditing(false);
      refreshProfile();
    },
    onError: (e: any) => toast.error(e.message),
  });


  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value || "Not provided"}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`${base}/profile`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Personal Information</h1>
        {!editing && (
          <Button variant="outline" size="sm" className="ml-auto" onClick={startEditing}>
            <Edit className="mr-1 h-3 w-3" /> Edit
          </Button>
        )}
      </div>

      {editing ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="space-y-1">
              <Label className="text-xs">Full Name</Label>
              <Input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Username</Label>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-7 pr-8"
                  value={form.username}
                  placeholder="your_username"
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value.replace(/[^a-zA-Z0-9_.]/g, "").slice(0, 30) }))}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {usernameCheck.status === "checking" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  {usernameCheck.status === "available" && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                  {usernameCheck.status === "taken" && <X className="h-3.5 w-3.5 text-destructive" />}
                </div>
              </div>
              {usernameCheck.message && (
                <p className={`text-[11px] ${usernameCheck.status === "taken" || usernameCheck.status === "invalid" ? "text-destructive" : "text-muted-foreground"}`}>
                  {usernameCheck.message}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Mobile</Label>
                <Input
                  value={form.mobileNumber}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => setForm((p) => ({ ...p, mobileNumber: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">WhatsApp Number</Label>
                <Input
                  value={form.whatsappNumber}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => setForm((p) => ({ ...p, whatsappNumber: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date of Birth</Label>
              <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Gender</Label>
                <Select value={form.gender} onValueChange={(value) => setForm((p) => ({ ...p, gender: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Marital Status</Label>
                <Select value={form.maritalStatus} onValueChange={(value) => setForm((p) => ({ ...p, maritalStatus: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || usernameCheck.status === "checking" || usernameCheck.status === "taken" || usernameCheck.status === "invalid"}>
              <Save className="mr-1 h-3 w-3" /> Save
            </Button>

              <Button variant="outline" onClick={() => setEditing(false)}>
                <X className="mr-1 h-3 w-3" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-1 pt-6">
            <InfoRow icon={User} label="Full Name" value={Array.isArray(profile?.full_name) ? profile.full_name.join(" ") : profile?.full_name} />
            <InfoRow icon={AtSign} label="Username" value={(profile as any)?.username ? `@${(profile as any).username}` : null} />

            <div className="flex items-start gap-3 py-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="truncate text-sm font-medium text-foreground">{profile?.email || "Not provided"}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(`${base}/profile/change-email`)}>
                Change Email ID
              </Button>
            </div>
            <div className="flex items-start gap-3 py-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Mobile</p>
                <p className="truncate text-sm font-medium text-foreground">{profile?.mobile_number || "Not provided"}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(`${base}/profile/mobile-verify`)}>
                <ShieldCheck className="mr-1 h-3 w-3" /> Verify
              </Button>
            </div>
            <InfoRow icon={Phone} label="WhatsApp" value={profile?.whatsapp_number} />
            <InfoRow icon={Calendar} label="Date of Birth" value={profile?.date_of_birth} />
            <InfoRow icon={User} label="Gender" value={profile?.gender} />
            <InfoRow icon={User} label="Marital Status" value={profile?.marital_status} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfilePersonalInfo;
