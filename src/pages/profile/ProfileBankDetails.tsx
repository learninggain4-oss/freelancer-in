import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Landmark, User, Save, X, Edit, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Bank {
  id: string;
  name: string;
  logo_path: string | null;
}

const ProfileBankDetails = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const base = profile?.user_type === "employee" ? "/employee" : "/client";

  // Fetch banks from database
  const { data: banks = [] } = useQuery({
    queryKey: ["banks-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banks")
        .select("id, name, logo_path")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Bank[];
    },
  });

  const getLogoUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from("bank-logos").getPublicUrl(path);
    return data.publicUrl;
  };

  const startEditing = () => {
    setForm({
      bank_holder_name: (profile as any)?.bank_holder_name ?? "",
      bank_name: profile?.bank_name ?? "",
      bank_account_number: profile?.bank_account_number ?? "",
      bank_ifsc_code: profile?.bank_ifsc_code ?? "",
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

  const selectedBank = banks.find((b) => b.name === (editing ? form.bank_name : profile?.bank_name));

  const InfoRow = ({ icon: Icon, label, value, logoUrl }: { icon: any; label: string; value: string | null | undefined; logoUrl?: string | null }) => (
    <div className="flex items-start gap-3 py-2">
      {logoUrl ? (
        <img src={logoUrl} alt="" className="mt-0.5 h-5 w-5 shrink-0 rounded object-contain" />
      ) : (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      )}
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
              <Select value={form.bank_name ?? ""} onValueChange={(val) => setForm((p) => ({ ...p, bank_name: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.name}>
                      <div className="flex items-center gap-2">
                        {bank.logo_path ? (
                          <img
                            src={getLogoUrl(bank.logo_path) || ""}
                            alt={bank.name}
                            className="h-5 w-5 rounded object-contain"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        ) : (
                          <Landmark className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{bank.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Account Number</Label>
              <Input value={form.bank_account_number ?? ""} onChange={(e) => setForm((p) => ({ ...p, bank_account_number: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">IFSC Code</Label>
              <Input value={form.bank_ifsc_code ?? ""} onChange={(e) => setForm((p) => ({ ...p, bank_ifsc_code: e.target.value }))} />
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
            <InfoRow
              icon={Landmark}
              label="Bank Name"
              value={profile?.bank_name}
              logoUrl={selectedBank ? getLogoUrl(selectedBank.logo_path) : null}
            />
            <InfoRow icon={Landmark} label="Account Number" value={profile?.bank_account_number} />
            <InfoRow icon={Landmark} label="IFSC Code" value={profile?.bank_ifsc_code} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileBankDetails;
