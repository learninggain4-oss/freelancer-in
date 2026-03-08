import { useState, useEffect, useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Copy, Gift, Users, Check, Loader2, Share2, UserCheck, Briefcase, Clock, RefreshCw, Download } from "lucide-react";
import UserTotpSetupCard from "@/components/auth/UserTotpSetupCard";
import { format } from "date-fns";

interface ReferralEntry {
  referral_id: string;
  referred_name: string;
  referred_user_type: string;
  signup_bonus_paid: boolean;
  job_bonus_paid: boolean;
  created_at: string;
}

const AccountSettings = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState({ total: 0, signupPaid: 0, jobPaid: 0 });
  const [referralHistory, setReferralHistory] = useState<ReferralEntry[]>([]);
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const handleCheckUpdate = useCallback(async () => {
    setChecking(true);
    try {
      const registrations = await navigator.serviceWorker?.getRegistrations();
      if (registrations?.length) {
        await Promise.all(registrations.map((r) => r.update()));
      }
      await new Promise((r) => setTimeout(r, 1500));
      if (!needRefresh) {
        toast({ title: "You're up to date!", description: "No new updates available." });
      }
    } catch {
      toast({ title: "Could not check for updates", variant: "destructive" });
    } finally {
      setChecking(false);
    }
  }, [needRefresh, toast]);

  const handleUpdate = useCallback(() => {
    setUpdating(true);
    setUpdateProgress(0);
    const interval = setInterval(() => {
      setUpdateProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
    updateServiceWorker(true).finally(() => {
      clearInterval(interval);
      setUpdateProgress(100);
      setTimeout(() => window.location.reload(), 300);
    });
  }, [updateServiceWorker]);

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
        setReferralStats({
          total: arr.length,
          signupPaid: arr.filter((r) => r.signup_bonus_paid).length,
          jobPaid: arr.filter((r) => r.job_bonus_paid).length,
        });
      }

      if (settingsRes.data) {
        for (const s of settingsRes.data) {
          if (s.key === "referral_terms_conditions") setTerms(s.value);
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [profile]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast({ title: "Copied!", description: "Referral code copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleShare = async (type: "employee" | "client") => {
    const label = type === "employee" ? "Freelancer" : "Client";
    const link = `${window.location.origin}/register/${type}?ref=${referralCode}`;
    const text = `Join Freelancer as a ${label} using my referral code: ${referralCode}\nSign up at ${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join Freelancer as ${label}`, text });
      } catch { /* cancelled */ }
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6">
      <h2 className="text-2xl font-bold text-foreground">Account Settings</h2>

      <Tabs defaultValue="referral" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="referral">Invite & Earn</TabsTrigger>
          <TabsTrigger value="history">Referral History</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Tab: Invite & Earn */}
        <TabsContent value="referral" className="space-y-4 mt-4">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gift className="h-5 w-5 text-primary" />
                Invite & Earn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share your referral code with friends and earn bonuses when they join and complete work!
              </p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={referralCode}
                  className="font-mono text-lg font-bold tracking-widest text-center bg-background"
                />
                <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-xs gap-1.5" onClick={() => handleShare("employee")}>
                  <Share2 className="h-3.5 w-3.5" /> Invite as Employee
                </Button>
                <Button variant="outline" className="flex-1 text-xs gap-1.5" onClick={() => handleShare("client")}>
                  <Share2 className="h-3.5 w-3.5" /> Invite as Client
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-background p-3 text-center">
                  <Users className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                  <p className="text-lg font-bold text-foreground">{referralStats.total}</p>
                  <p className="text-xs text-muted-foreground">Referred</p>
                </div>
                <div className="rounded-lg bg-background p-3 text-center">
                  <p className="text-lg font-bold text-accent">{referralStats.signupPaid}</p>
                  <p className="text-xs text-muted-foreground">Signup Bonus</p>
                </div>
                <div className="rounded-lg bg-background p-3 text-center">
                  <p className="text-lg font-bold text-accent">{referralStats.jobPaid}</p>
                  <p className="text-xs text-muted-foreground">Job Bonus</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {terms && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Referral Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{terms.replace(/\\n/g, "\n")}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Referral History */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-primary" />
                Referral History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {referralHistory.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">No referrals yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Share your referral code with friends to start earning!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referralHistory.map((r) => (
                    <div key={r.referral_id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground truncate">{r.referred_name}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {r.referred_user_type === "employee" ? "Employee" : "Client"}
                          </Badge>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-3.5 w-3.5" />
                            <span className="text-xs">Signup</span>
                            {r.signup_bonus_paid ? (
                              <Badge className="h-4 px-1.5 text-[10px] bg-accent text-accent-foreground">Paid</Badge>
                            ) : (
                              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">Pending</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            <span className="text-xs">Job</span>
                            {r.job_bonus_paid ? (
                              <Badge className="h-4 px-1.5 text-[10px] bg-accent text-accent-foreground">Paid</Badge>
                            ) : (
                              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">Pending</Badge>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(r.created_at), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={needRefresh ? "border-primary/30 bg-primary/5" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Download className="h-5 w-5 text-primary" />
                App Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {updating ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Updating... {Math.min(Math.round(updateProgress), 100)}%</p>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-200"
                      style={{ width: `${Math.min(updateProgress, 100)}%` }}
                    />
                  </div>
                </div>
              ) : needRefresh ? (
                <>
                  <p className="text-sm text-muted-foreground">A new version is available. Update now to get the latest features and fixes.</p>
                  <Button onClick={handleUpdate} className="w-full gap-2">
                    <RefreshCw className="h-4 w-4" /> Update Now
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Your app is up to date.</p>
                  <Button variant="outline" onClick={handleCheckUpdate} disabled={checking} className="w-full gap-2">
                    {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Check for Updates
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Account */}
        <TabsContent value="account" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium">{profile?.full_name?.[0]}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">User Code</span>
                <Badge variant="secondary">{profile?.user_code?.[0]}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium">{profile?.email}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Type</span>
                <Badge>{profile?.user_type === "employee" ? "Employee" : "Client"}</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountSettings;
