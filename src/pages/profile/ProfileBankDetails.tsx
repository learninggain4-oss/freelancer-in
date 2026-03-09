import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Landmark, User, Save, X, Edit, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const INDIAN_BANKS = [
  { name: "State Bank of India (SBI)", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/SBI-logo.svg/100px-SBI-logo.svg.png" },
  { name: "HDFC Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/HDFC_Bank_Logo.svg/100px-HDFC_Bank_Logo.svg.png" },
  { name: "ICICI Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/ICICI_Bank_Logo.svg/100px-ICICI_Bank_Logo.svg.png" },
  { name: "Punjab National Bank (PNB)", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Punjab_National_Bank_logo.svg/100px-Punjab_National_Bank_logo.svg.png" },
  { name: "Bank of Baroda", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Bank_of_Baroda_logo.svg/100px-Bank_of_Baroda_logo.svg.png" },
  { name: "Canara Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Canara_Bank_Logo.svg/100px-Canara_Bank_Logo.svg.png" },
  { name: "Axis Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Axis_Bank_logo.svg/100px-Axis_Bank_logo.svg.png" },
  { name: "Union Bank of India", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Union_Bank_of_India_Logo.svg/100px-Union_Bank_of_India_Logo.svg.png" },
  { name: "Bank of India", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Bank_of_India_logo.svg/100px-Bank_of_India_logo.svg.png" },
  { name: "Indian Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Indian_Bank_logo.svg/100px-Indian_Bank_logo.svg.png" },
  { name: "Central Bank of India", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Central_Bank_of_India_Logo.svg/100px-Central_Bank_of_India_Logo.svg.png" },
  { name: "Indian Overseas Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Indian_Overseas_Bank_Logo.svg/100px-Indian_Overseas_Bank_Logo.svg.png" },
  { name: "UCO Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/UCO_Bank_Logo.svg/100px-UCO_Bank_Logo.svg.png" },
  { name: "IDBI Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/IDBI_Bank_Logo.svg/100px-IDBI_Bank_Logo.svg.png" },
  { name: "Kotak Mahindra Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Kotak_Mahindra_Bank_logo.svg/100px-Kotak_Mahindra_Bank_logo.svg.png" },
  { name: "IndusInd Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/IndusInd_Bank_logo.svg/100px-IndusInd_Bank_logo.svg.png" },
  { name: "Yes Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Yes_Bank_Logo.svg/100px-Yes_Bank_Logo.svg.png" },
  { name: "Federal Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Federal_Bank_logo.svg/100px-Federal_Bank_logo.svg.png" },
  { name: "South Indian Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/South_Indian_Bank_Logo.svg/100px-South_Indian_Bank_Logo.svg.png" },
  { name: "RBL Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/RBL_Bank_Logo.svg/100px-RBL_Bank_Logo.svg.png" },
  { name: "Bandhan Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Bandhan_Bank_Logo.svg/100px-Bandhan_Bank_Logo.svg.png" },
  { name: "IDFC First Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/IDFC_First_Bank_logo.svg/100px-IDFC_First_Bank_logo.svg.png" },
  { name: "Karnataka Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Karnataka_Bank_Logo.svg/100px-Karnataka_Bank_Logo.svg.png" },
  { name: "City Union Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/City_Union_Bank_logo.svg/100px-City_Union_Bank_logo.svg.png" },
  { name: "Karur Vysya Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Karur_Vysya_Bank_logo.svg/100px-Karur_Vysya_Bank_logo.svg.png" },
  { name: "Tamilnad Mercantile Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Tamilnad_Mercantile_Bank_Logo.svg/100px-Tamilnad_Mercantile_Bank_Logo.svg.png" },
  { name: "DCB Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/DCB_Bank_Logo.svg/100px-DCB_Bank_Logo.svg.png" },
  { name: "Jammu & Kashmir Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/J%26K_Bank_logo.svg/100px-J%26K_Bank_logo.svg.png" },
  { name: "Punjab & Sind Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Punjab_and_Sind_Bank_logo.svg/100px-Punjab_and_Sind_Bank_logo.svg.png" },
  { name: "Bank of Maharashtra", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Bank_of_Maharashtra_logo.svg/100px-Bank_of_Maharashtra_logo.svg.png" },
  { name: "India Post Payments Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/India_Post_Payments_Bank_logo.svg/100px-India_Post_Payments_Bank_logo.svg.png" },
  { name: "Paytm Payments Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/100px-Paytm_Logo_%28standalone%29.svg.png" },
  { name: "Airtel Payments Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Airtel_Payments_Bank_logo.svg/100px-Airtel_Payments_Bank_logo.svg.png" },
  { name: "Fino Payments Bank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Fino_Payments_Bank_Logo.svg/100px-Fino_Payments_Bank_Logo.svg.png" },
  { name: "Other", logo: null },
];

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
              <Select value={form.bank_name ?? ""} onValueChange={(val) => setForm((p) => ({ ...p, bank_name: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {INDIAN_BANKS.map((bank) => (
                    <SelectItem key={bank.name} value={bank.name}>
                      <div className="flex items-center gap-2">
                        {bank.logo && (
                          <img 
                            src={bank.logo} 
                            alt={bank.name} 
                            className="h-5 w-5 object-contain"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
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
            <InfoRow icon={Landmark} label="Bank Name" value={profile?.bank_name} />
            <InfoRow icon={Landmark} label="Account Number" value={profile?.bank_account_number} />
            <InfoRow icon={Landmark} label="IFSC Code" value={profile?.bank_ifsc_code} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileBankDetails;
