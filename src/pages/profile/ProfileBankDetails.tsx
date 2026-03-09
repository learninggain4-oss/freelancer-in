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
  { name: "State Bank of India (SBI)", logo: "https://logo.clearbit.com/sbi.co.in", color: "bg-blue-600" },
  { name: "HDFC Bank", logo: "https://logo.clearbit.com/hdfcbank.com", color: "bg-blue-800" },
  { name: "ICICI Bank", logo: "https://logo.clearbit.com/icicibank.com", color: "bg-orange-600" },
  { name: "Punjab National Bank (PNB)", logo: "https://logo.clearbit.com/pnbindia.in", color: "bg-red-700" },
  { name: "Bank of Baroda", logo: "https://logo.clearbit.com/bankofbaroda.in", color: "bg-orange-500" },
  { name: "Canara Bank", logo: "https://logo.clearbit.com/canarabank.com", color: "bg-yellow-600" },
  { name: "Axis Bank", logo: "https://logo.clearbit.com/axisbank.com", color: "bg-pink-700" },
  { name: "Union Bank of India", logo: "https://logo.clearbit.com/unionbankofindia.co.in", color: "bg-blue-700" },
  { name: "Bank of India", logo: "https://logo.clearbit.com/bankofindia.co.in", color: "bg-orange-700" },
  { name: "Indian Bank", logo: "https://logo.clearbit.com/indianbank.in", color: "bg-blue-900" },
  { name: "Central Bank of India", logo: "https://logo.clearbit.com/centralbankofindia.co.in", color: "bg-red-600" },
  { name: "Indian Overseas Bank", logo: "https://logo.clearbit.com/iob.in", color: "bg-red-800" },
  { name: "UCO Bank", logo: "https://logo.clearbit.com/ucobank.com", color: "bg-purple-700" },
  { name: "IDBI Bank", logo: "https://logo.clearbit.com/idbibank.in", color: "bg-green-700" },
  { name: "Kotak Mahindra Bank", logo: "https://logo.clearbit.com/kotak.com", color: "bg-red-600" },
  { name: "IndusInd Bank", logo: "https://logo.clearbit.com/indusind.com", color: "bg-blue-600" },
  { name: "Yes Bank", logo: "https://logo.clearbit.com/yesbank.in", color: "bg-blue-500" },
  { name: "Federal Bank", logo: "https://logo.clearbit.com/federalbank.co.in", color: "bg-yellow-700" },
  { name: "South Indian Bank", logo: "https://logo.clearbit.com/southindianbank.com", color: "bg-blue-800" },
  { name: "RBL Bank", logo: "https://logo.clearbit.com/rblbank.com", color: "bg-orange-600" },
  { name: "Bandhan Bank", logo: "https://logo.clearbit.com/bandhanbank.com", color: "bg-orange-500" },
  { name: "IDFC First Bank", logo: "https://logo.clearbit.com/idfcfirstbank.com", color: "bg-red-500" },
  { name: "Karnataka Bank", logo: "https://logo.clearbit.com/karnatakabank.com", color: "bg-blue-700" },
  { name: "City Union Bank", logo: "https://logo.clearbit.com/cityunionbank.com", color: "bg-blue-600" },
  { name: "Karur Vysya Bank", logo: "https://logo.clearbit.com/kvb.co.in", color: "bg-green-600" },
  { name: "Tamilnad Mercantile Bank", logo: "https://logo.clearbit.com/tmb.in", color: "bg-red-700" },
  { name: "DCB Bank", logo: "https://logo.clearbit.com/dcbbank.com", color: "bg-blue-500" },
  { name: "Jammu & Kashmir Bank", logo: "https://logo.clearbit.com/jkbank.com", color: "bg-green-800" },
  { name: "Punjab & Sind Bank", logo: "https://logo.clearbit.com/psbindia.com", color: "bg-blue-800" },
  { name: "Bank of Maharashtra", logo: "https://logo.clearbit.com/bankofmaharashtra.in", color: "bg-green-700" },
  { name: "India Post Payments Bank", logo: "https://logo.clearbit.com/ippbonline.com", color: "bg-red-600" },
  { name: "Paytm Payments Bank", logo: "https://logo.clearbit.com/paytmbank.com", color: "bg-blue-500" },
  { name: "Airtel Payments Bank", logo: "https://logo.clearbit.com/airtel.in", color: "bg-red-500" },
  { name: "Fino Payments Bank", logo: "https://logo.clearbit.com/finobank.com", color: "bg-yellow-500" },
  { name: "Other", logo: "", color: "bg-muted" },
];

const BankLogo = ({ bank, size = "sm" }: { bank: typeof INDIAN_BANKS[0] | undefined; size?: "sm" | "md" }) => {
  const [imgError, setImgError] = useState(false);
  const sizeClass = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const textSize = size === "sm" ? "text-[8px]" : "text-[10px]";
  
  if (!bank || !bank.logo || imgError) {
    const initials = bank?.name?.slice(0, 2).toUpperCase() || "OT";
    return (
      <div className={`${sizeClass} rounded-full ${bank?.color || "bg-muted"} flex items-center justify-center shrink-0`}>
        <span className={`${textSize} font-bold text-white`}>{initials}</span>
      </div>
    );
  }
  
  return (
    <img
      src={bank.logo}
      alt={bank.name}
      className={`${sizeClass} rounded-full object-contain bg-white shrink-0`}
      onError={() => setImgError(true)}
    />
  );
};

const ProfileBankDetails = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const base = profile?.user_type === "employee" ? "/employee" : "/client";

  const selectedBank = INDIAN_BANKS.find((b) => b.name === form.bank_name);
  const displayBank = INDIAN_BANKS.find((b) => b.name === profile?.bank_name);

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

  const InfoRow = ({ icon: Icon, label, value, bank }: { icon: any; label: string; value: string | null | undefined; bank?: typeof INDIAN_BANKS[0] }) => (
    <div className="flex items-start gap-3 py-2">
      {bank ? (
        <BankLogo bank={bank} size="md" />
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
                  <SelectValue placeholder="Select bank">
                    {selectedBank && (
                      <div className="flex items-center gap-2">
                        <BankLogo bank={selectedBank} />
                        <span className="truncate">{selectedBank.name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_BANKS.map((bank) => (
                    <SelectItem key={bank.name} value={bank.name}>
                      <div className="flex items-center gap-2">
                        <BankLogo bank={bank} />
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
            <InfoRow icon={Landmark} label="Bank Name" value={profile?.bank_name} bank={displayBank} />
            <InfoRow icon={Landmark} label="Account Number" value={profile?.bank_account_number} />
            <InfoRow icon={Landmark} label="IFSC Code" value={profile?.bank_ifsc_code} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileBankDetails;
