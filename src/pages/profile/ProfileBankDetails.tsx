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
  { name: "State Bank of India (SBI)", logo: "https://logo.clearbit.com/sbi.co.in" },
  { name: "HDFC Bank", logo: "https://logo.clearbit.com/hdfcbank.com" },
  { name: "ICICI Bank", logo: "https://logo.clearbit.com/icicibank.com" },
  { name: "Punjab National Bank (PNB)", logo: "https://logo.clearbit.com/pnbindia.in" },
  { name: "Bank of Baroda", logo: "https://logo.clearbit.com/bankofbaroda.in" },
  { name: "Canara Bank", logo: "https://logo.clearbit.com/canarabank.com" },
  { name: "Axis Bank", logo: "https://logo.clearbit.com/axisbank.com" },
  { name: "Union Bank of India", logo: "https://logo.clearbit.com/unionbankofindia.co.in" },
  { name: "Bank of India", logo: "https://logo.clearbit.com/bankofindia.co.in" },
  { name: "Indian Bank", logo: "https://logo.clearbit.com/indianbank.in" },
  { name: "Central Bank of India", logo: "https://logo.clearbit.com/centralbankofindia.co.in" },
  { name: "Indian Overseas Bank", logo: "https://logo.clearbit.com/iob.in" },
  { name: "UCO Bank", logo: "https://logo.clearbit.com/ucobank.com" },
  { name: "IDBI Bank", logo: "https://logo.clearbit.com/idbibank.in" },
  { name: "Kotak Mahindra Bank", logo: "https://logo.clearbit.com/kotak.com" },
  { name: "IndusInd Bank", logo: "https://logo.clearbit.com/indusind.com" },
  { name: "Yes Bank", logo: "https://logo.clearbit.com/yesbank.in" },
  { name: "Federal Bank", logo: "https://logo.clearbit.com/federalbank.co.in" },
  { name: "South Indian Bank", logo: "https://logo.clearbit.com/southindianbank.com" },
  { name: "RBL Bank", logo: "https://logo.clearbit.com/rblbank.com" },
  { name: "Bandhan Bank", logo: "https://logo.clearbit.com/bandhanbank.com" },
  { name: "IDFC First Bank", logo: "https://logo.clearbit.com/idfcfirstbank.com" },
  { name: "Karnataka Bank", logo: "https://logo.clearbit.com/karnatakabank.com" },
  { name: "City Union Bank", logo: "https://logo.clearbit.com/cityunionbank.com" },
  { name: "Karur Vysya Bank", logo: "https://logo.clearbit.com/kvb.co.in" },
  { name: "Tamilnad Mercantile Bank", logo: "https://logo.clearbit.com/tmb.in" },
  { name: "DCB Bank", logo: "https://logo.clearbit.com/dcbbank.com" },
  { name: "Jammu & Kashmir Bank", logo: "https://logo.clearbit.com/jkbank.com" },
  { name: "Punjab & Sind Bank", logo: "https://logo.clearbit.com/punjabandsindbank.co.in" },
  { name: "Bank of Maharashtra", logo: "https://logo.clearbit.com/bankofmaharashtra.in" },
  { name: "India Post Payments Bank", logo: "https://logo.clearbit.com/ippbonline.com" },
  { name: "Paytm Payments Bank", logo: "https://logo.clearbit.com/paytm.com" },
  { name: "Airtel Payments Bank", logo: "https://logo.clearbit.com/airtel.in" },
  { name: "Fino Payments Bank", logo: "https://logo.clearbit.com/finobank.com" },
  { name: "Other", logo: null },
];

const BankLogo = ({ bankName, className = "h-5 w-5" }: { bankName: string | null | undefined; className?: string }) => {
  const bank = INDIAN_BANKS.find((b) => b.name === bankName);
  if (!bank?.logo) return <Landmark className={`${className} text-muted-foreground`} />;
  return (
    <img
      src={bank.logo}
      alt={bank.name}
      className={`${className} rounded-sm object-contain`}
      onError={(e) => {
        e.currentTarget.style.display = "none";
        e.currentTarget.nextElementSibling?.classList.remove("hidden");
      }}
    />
  );
};

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

  const InfoRow = ({ icon: Icon, label, value, bankLogo }: { icon: any; label: string; value: string | null | undefined; bankLogo?: boolean }) => (
    <div className="flex items-start gap-3 py-2">
      {bankLogo ? (
        <div className="mt-0.5 shrink-0">
          <BankLogo bankName={value} className="h-5 w-5" />
        </div>
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
                  {INDIAN_BANKS.map((bank) => (
                    <SelectItem key={bank.name} value={bank.name}>
                      <div className="flex items-center gap-2">
                        {bank.logo ? (
                          <img
                            src={bank.logo}
                            alt={bank.name}
                            className="h-5 w-5 rounded-sm object-contain"
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
            <InfoRow icon={Landmark} label="Bank Name" value={profile?.bank_name} bankLogo />
            <InfoRow icon={Landmark} label="Account Number" value={profile?.bank_account_number} />
            <InfoRow icon={Landmark} label="IFSC Code" value={profile?.bank_ifsc_code} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileBankDetails;
