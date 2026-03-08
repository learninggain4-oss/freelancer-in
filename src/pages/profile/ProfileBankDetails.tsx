import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, User, Save, X, Edit, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ProfileBankDetails = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const base = profile?.user_type === "employee" ? "/employee" : "/client";

  const startEditing = () => {
    setForm({
      bank_holder_name: (profile as any)?.bank_holder_name ?? "",
      bank_name: profile?.bank_name ?? "",
      bank_account_number: profile?.bank_account_number ?? "",
      bank_ifsc_code: profile?.bank_ifsc_code ?? "",
      upi_id: profile?.upi_id ?? "",
    });
    setEditing(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update(form as any).eq("id", profile!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Updated successfully.");
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
        <h1 className="text-xl font-bold text-foreground">Bank Details</h1>
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
              <Label className="text-xs">Account Holder Name</Label>
              <Input value={form.bank_holder_name ?? ""} onChange={(e) => setForm((p) => ({ ...p, bank_holder_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bank Name</Label>
              <Input value={form.bank_name ?? ""} onChange={(e) => setForm((p) => ({ ...p, bank_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Account Number</Label>
              <Input value={form.bank_account_number ?? ""} onChange={(e) => setForm((p) => ({ ...p, bank_account_number: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">IFSC Code</Label>
              <Input value={form.bank_ifsc_code ?? ""} onChange={(e) => setForm((p) => ({ ...p, bank_ifsc_code: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">UPI ID</Label>
              <Input value={form.upi_id ?? ""} onChange={(e) => setForm((p) => ({ ...p, upi_id: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
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
            <InfoRow icon={User} label="Account Holder Name" value={(profile as any)?.bank_holder_name} />
            <InfoRow icon={Landmark} label="Bank Name" value={profile?.bank_name} />
            <InfoRow icon={Landmark} label="Account Number" value={profile?.bank_account_number} />
            <InfoRow icon={Landmark} label="IFSC Code" value={profile?.bank_ifsc_code} />
            <InfoRow icon={Landmark} label="UPI ID" value={profile?.upi_id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileBankDetails;
