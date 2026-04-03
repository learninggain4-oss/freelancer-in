import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Copy, Gift, Users, Check, Loader2, Share2, UserCheck,
  Briefcase, Clock, Sparkles, Trophy, ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

interface ReferralEntry {
  referral_id: string;
  referred_name: string;
  referred_user_type: string;
  signup_bonus_paid: boolean;
  job_bonus_paid: boolean;
  created_at: string;
}

const GetFree = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState({ total: 0, signupPaid: 0, jobPaid: 0 });
  const [referralHistory, setReferralHistory] = useState<ReferralEntry[]>([]);
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      const [profRes, historyRes, settingsRes] = await Promise.all([
        supabase.from("profiles").select("referral_code").eq("id", profile.id).single(),
        supabase.rpc("get_referral_history"),
        supabase.from("app_settings").select("key, value").in("key", ["referral_terms_conditions"]),
      ]);
      if (profRes.data) setReferralCode((profRes.data as any).referral_code || "");
      if (historyRes.data) {
        const arr = historyRes.data as any as ReferralEntry[];
        setReferralHistory(arr);
        setReferralStats({ total: arr.length, signupPaid: arr.filter((r) => r.signup_bonus_paid).length, jobPaid: arr.filter((r) => r.job_bonus_paid).length });
      }
      if (settingsRes.data) {
        for (const s of settingsRes.data) { if (s.key === "referral_terms_conditions") setTerms(s.value); }
      }
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast({ title: "Copied!", description: "Referral code copied" });
      setTimeout(() => setCopied(false), 2000);
    } catch { toast({ title: "Failed to copy", variant: "destructive" }); }
  };

  const handleShare = async (type: "employee" | "client") => {
    const label = type === "employee" ? "Freelancer" : "Employer";
    const link = `${window.location.origin}/register/${type}?ref=${referralCode}`;
    const text = `Join Freelancer as a ${label} using my referral code: ${referralCode}\nSign up at ${link}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Join Freelancer as ${label}`, text }); } catch {}
    } else { handleCopy(); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5 p-4 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent via-accent/80 to-emerald-500/70 p-5 text-white">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5 blur-xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Get Free</h1>
            <p className="text-xs opacity-80">Invite friends & earn rewards</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5 animate-fade-in-up">
        {[
          { icon: Users, value: referralStats.total, label: "Referred", color: "text-primary", bg: "bg-primary/10" },
          { icon: Trophy, value: referralStats.signupPaid, label: "Signup Bonus", color: "text-accent", bg: "bg-accent/10" },
          { icon: Briefcase, value: referralStats.jobPaid, label: "Job Bonus", color: "text-warning", bg: "bg-warning/10" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center p-3 gap-1">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
                <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
              </div>
              <span className="text-xl font-bold text-foreground">{s.value}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="referral" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl">
          <TabsTrigger value="referral" className="gap-1.5 rounded-lg text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Invite & Earn
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 rounded-lg text-xs font-semibold">
            <Clock className="h-3.5 w-3.5" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="referral" className="space-y-4 mt-4">
          {/* Referral Code Card */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-accent via-emerald-400 to-accent" />
            <CardContent className="space-y-4 p-4">
              <p className="text-sm text-muted-foreground">Share your referral code and earn bonuses when friends join and complete work!</p>
              <div className="flex items-center gap-2">
                <Input readOnly value={referralCode} className="font-mono text-lg font-bold tracking-widest text-center bg-muted/30 h-12 rounded-xl" />
                <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0 h-12 w-12 rounded-xl">
                  {copied ? <Check className="h-5 w-5 text-accent" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="gap-1.5 rounded-xl h-11" onClick={() => handleShare("employee")}>
                  <Share2 className="h-4 w-4" /> As Employee
                </Button>
                <Button variant="outline" className="gap-1.5 rounded-xl h-11" onClick={() => handleShare("client")}>
                  <Share2 className="h-4 w-4" /> As Client
                </Button>
              </div>
            </CardContent>
          </Card>

          {terms && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Terms & Conditions</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-line text-xs text-muted-foreground">{terms.replace(/\\n/g, "\n")}</p></CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3 mt-4">
          {referralHistory.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
                <Users className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">No referrals yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Share your code to start earning!</p>
            </div>
          ) : (
            referralHistory.map((r) => (
              <Card key={r.referral_id} className="border-0 shadow-sm">
                <CardContent className="flex items-start gap-3 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{r.referred_name}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{r.referred_user_type}</Badge>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5" /><span className="text-xs">Signup</span>
                        <Badge className={`h-4 px-1.5 text-[10px] border-0 ${r.signup_bonus_paid ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                          {r.signup_bonus_paid ? "Paid" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" /><span className="text-xs">Job</span>
                        <Badge className={`h-4 px-1.5 text-[10px] border-0 ${r.job_bonus_paid ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                          {r.job_bonus_paid ? "Paid" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> {format(new Date(r.created_at), "dd MMM yyyy")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GetFree;
