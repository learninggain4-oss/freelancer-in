import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, Smartphone, Briefcase, Sparkles, Heart, BadgeCheck, ShieldCheck } from "lucide-react";

type Props = { profileId: string };

const useRows = <T,>(table: string, profileId: string, select = "*") => {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from(table as any).select(select).eq("profile_id", profileId);
      if (active) {
        setRows((data as T[]) || []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [table, profileId, select]);
  return { rows, loading };
};

const Empty = ({ label }: { label: string }) => (
  <p className="text-sm opacity-60 py-6 text-center">No {label} found.</p>
);

const SectionCard = ({ icon: Icon, title, color, children }: any) => (
  <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
    <CardHeader className="pb-3 border-b border-white/10">
      <CardTitle className="flex items-center gap-2 text-base font-bold">
        <Icon className="h-5 w-5" style={{ color }} />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-6">{children}</CardContent>
  </Card>
);

const Row = ({ children }: { children: any }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-white/10 bg-white/5">
    {children}
  </div>
);

export const BankAccountsViewer = ({ profileId }: Props) => {
  const { rows, loading } = useRows<any>("user_bank_accounts", profileId);
  return (
    <SectionCard icon={Landmark} title="Bank Accounts" color="#4ade80">
      {loading ? <Skeleton className="h-16 w-full" /> :
        rows.length === 0 ? <Empty label="bank accounts" /> :
        <div className="space-y-3">
          {rows.map((r) => (
            <Row key={r.id}>
              <div>
                <p className="font-bold">{r.bank_name}</p>
                <p className="text-xs opacity-70">{r.bank_holder_name}</p>
                <p className="text-xs font-mono mt-1">A/C: {r.bank_account_number} · IFSC: {r.bank_ifsc_code}</p>
              </div>
              {r.is_locked && <Badge variant="outline" className="text-amber-400 border-amber-500/30">Locked</Badge>}
            </Row>
          ))}
        </div>
      }
    </SectionCard>
  );
};

export const UpiPaymentAppsViewer = ({ profileId }: Props) => {
  const { rows, loading } = useRows<any>("employee_payment_apps", profileId, "*, payment_methods(name)");
  return (
    <SectionCard icon={Smartphone} title="UPI Payment Apps" color="#a78bfa">
      {loading ? <Skeleton className="h-16 w-full" /> :
        rows.length === 0 ? <Empty label="UPI apps" /> :
        <div className="space-y-3">
          {rows.map((r) => (
            <Row key={r.id}>
              <div>
                <p className="font-bold">{r.payment_methods?.name || "—"}</p>
                <p className="text-xs font-mono opacity-70">{r.phone_number}</p>
              </div>
              <div className="flex gap-2">
                {r.is_primary && <Badge className="bg-indigo-500/15 text-indigo-300 border-none">Primary</Badge>}
                <Badge variant="outline" className="capitalize">{r.kyc_status || "pending"}</Badge>
              </div>
            </Row>
          ))}
        </div>
      }
    </SectionCard>
  );
};

export const WorkExperiencesViewer = ({ profileId }: Props) => {
  const { rows, loading } = useRows<any>("work_experiences", profileId);
  return (
    <SectionCard icon={Briefcase} title="Work Experience" color="#60a5fa">
      {loading ? <Skeleton className="h-16 w-full" /> :
        rows.length === 0 ? <Empty label="work experiences" /> :
        <div className="space-y-3">
          {rows.map((r) => (
            <Row key={r.id}>
              <div className="flex-1">
                <p className="font-bold">{r.company_name} <span className="text-xs opacity-60">({r.company_type})</span></p>
                <p className="text-xs opacity-70 mt-1">{r.work_description}</p>
                <p className="text-xs font-mono mt-1 opacity-60">{r.start_year} – {r.is_current ? "Present" : r.end_year}</p>
              </div>
            </Row>
          ))}
        </div>
      }
    </SectionCard>
  );
};

export const ServicesViewer = ({ profileId }: Props) => {
  const { rows, loading } = useRows<any>("employee_services", profileId, "*, service_categories(name)");
  return (
    <SectionCard icon={Sparkles} title="Services" color="#f59e0b">
      {loading ? <Skeleton className="h-16 w-full" /> :
        rows.length === 0 ? <Empty label="services" /> :
        <div className="space-y-3">
          {rows.map((r) => (
            <Row key={r.id}>
              <div>
                <p className="font-bold">{r.service_title}</p>
                <p className="text-xs opacity-70">{r.service_categories?.name || "—"}</p>
              </div>
              <div className="text-right text-xs">
                <p>Rate: ₹{r.hourly_rate ?? "—"}/hr</p>
                <p className="opacity-70">Min Budget: ₹{r.minimum_budget ?? "—"}</p>
              </div>
            </Row>
          ))}
        </div>
      }
    </SectionCard>
  );
};

export const EmergencyContactsViewer = ({ profileId }: Props) => {
  const { rows, loading } = useRows<any>("employee_emergency_contacts", profileId);
  return (
    <SectionCard icon={Heart} title="Emergency Contacts" color="#f87171">
      {loading ? <Skeleton className="h-16 w-full" /> :
        rows.length === 0 ? <Empty label="emergency contacts" /> :
        <div className="space-y-3">
          {rows.map((r) => (
            <Row key={r.id}>
              <div>
                <p className="font-bold">{r.contact_name}</p>
                <p className="text-xs opacity-70">{r.relationship}</p>
              </div>
              <p className="text-sm font-mono">{r.contact_phone}</p>
            </Row>
          ))}
        </div>
      }
    </SectionCard>
  );
};

export const AadhaarVerificationViewer = ({ profileId }: Props) => {
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("aadhaar_verifications").select("*").eq("profile_id", profileId).maybeSingle();
      setRow(data); setLoading(false);
    })();
  }, [profileId]);
  return (
    <SectionCard icon={BadgeCheck} title="Self Real Name Verification" color="#4ade80">
      {loading ? <Skeleton className="h-16 w-full" /> :
        !row ? <Empty label="Aadhaar verification" /> :
        <div className="space-y-2 text-sm">
          <p><span className="opacity-60">Name on Aadhaar:</span> <span className="font-bold">{row.name_on_aadhaar}</span></p>
          <p><span className="opacity-60">Aadhaar #:</span> <span className="font-mono">{row.aadhaar_number}</span></p>
          <p><span className="opacity-60">DOB:</span> {row.dob_on_aadhaar}</p>
          <p><span className="opacity-60">Address:</span> {row.address_on_aadhaar}</p>
          <p className="pt-2"><Badge className="capitalize">{row.status}</Badge>
            {row.rejection_reason && <span className="ml-2 text-xs text-red-400">{row.rejection_reason}</span>}
          </p>
        </div>
      }
    </SectionCard>
  );
};

export const BankVerificationViewer = ({ profileId }: Props) => {
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("bank_verifications").select("*").eq("profile_id", profileId).maybeSingle();
      setRow(data); setLoading(false);
    })();
  }, [profileId]);
  return (
    <SectionCard icon={ShieldCheck} title="Self Bank Verification" color="#60a5fa">
      {loading ? <Skeleton className="h-16 w-full" /> :
        !row ? <Empty label="bank verification" /> :
        <div className="space-y-2 text-sm">
          <p><span className="opacity-60">Document:</span> {row.document_name || "—"}</p>
          <p><span className="opacity-60">Attempts:</span> {row.attempt_count ?? 0}</p>
          <p className="pt-2"><Badge className="capitalize">{row.status}</Badge>
            {row.rejection_reason && <span className="ml-2 text-xs text-red-400">{row.rejection_reason}</span>}
          </p>
        </div>
      }
    </SectionCard>
  );
};
