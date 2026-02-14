import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Copy, Gift, Users, Check, Loader2, Share2 } from "lucide-react";

const AccountSettings = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState({ total: 0, signupPaid: 0, jobPaid: 0 });
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!profile) return;

      // Fetch referral code from profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", profile.id)
        .single();
      if (prof) setReferralCode((prof as any).referral_code || "");

      // Fetch referral stats
      const { data: refs } = await supabase
        .from("referrals" as any)
        .select("signup_bonus_paid, job_bonus_paid")
        .eq("referrer_id", profile.id);
      if (refs) {
        const arr = refs as any[];
        setReferralStats({
          total: arr.length,
          signupPaid: arr.filter((r) => r.signup_bonus_paid).length,
          jobPaid: arr.filter((r) => r.job_bonus_paid).length,
        });
      }

      // Fetch terms
      const { data: settings } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["referral_terms_conditions", "referral_signup_bonus", "referral_job_bonus"]);
      if (settings) {
        for (const s of settings) {
          if (s.key === "referral_terms_conditions") setTerms(s.value);
        }
      }

      setLoading(false);
    };
    fetch();
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

  const handleShare = async () => {
    const text = `Join Freelancer using my referral code: ${referralCode}\nSign up at ${window.location.origin}/register/employee`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join Freelancer", text });
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

      {/* Referral Code Card */}
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

          {/* Code display */}
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={referralCode}
              className="font-mono text-lg font-bold tracking-widest text-center bg-background"
            />
            <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={handleShare} className="shrink-0">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats */}
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

      {/* Terms & Conditions */}
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

      {/* Account Info */}
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
    </div>
  );
};

export default AccountSettings;
