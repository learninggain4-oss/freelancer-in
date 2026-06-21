import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, AlertCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function ForgotEmailDialog({ open, onOpenChange }: Props) {
  const [mobile, setMobile] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ email: string | null; error?: string } | null>(null);

  const reset = () => {
    setMobile(""); setDob(""); setResult(null); setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile)) {
      setResult({ email: null, error: "Enter a valid 10-digit mobile number" });
      return;
    }
    if (!dob) {
      setResult({ email: null, error: "Select your date of birth" });
      return;
    }
    setLoading(true); setResult(null);
    const { data, error } = await supabase.rpc("lookup_email_by_mobile_dob", {
      p_mobile: mobile,
      p_dob: dob,
    });
    setLoading(false);
    if (error) {
      setResult({ email: null, error: "Something went wrong. Please try again." });
      return;
    }
    if (!data) {
      setResult({ email: null, error: "No account found with that mobile number and date of birth." });
      return;
    }
    setResult({ email: data as string });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Forgot your email?
          </DialogTitle>
          <DialogDescription>
            Enter your registered mobile number and date of birth. We'll show a hint of your email.
          </DialogDescription>
        </DialogHeader>

        {result?.email ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Your registered email:</p>
            <p className="text-lg font-semibold tracking-wide">{result.email}</p>
            <p className="text-xs text-muted-foreground">
              For security, only part of your email is shown. Use this hint to recall your full email.
            </p>
            <Button className="w-full mt-2" onClick={() => { reset(); onOpenChange(false); }}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fe-mobile">Mobile number</Label>
              <Input
                id="fe-mobile"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fe-dob">Date of birth</Label>
              <Input
                id="fe-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {result?.error && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 text-destructive p-3 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{result.error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Searching...</> : "Find my email"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
