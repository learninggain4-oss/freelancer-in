import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface TotpVerifyDialogProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  title?: string;
  description?: string;
}

const TotpVerifyDialog = ({
  open,
  onClose,
  onVerified,
  title = "Two-Factor Verification",
  description = "Enter the 6-digit code from your Google Authenticator app.",
}: TotpVerifyDialogProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error("Enter a 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-totp", {
        body: { action: "verify", code },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      if (res.data?.valid) {
        setCode("");
        onVerified();
      } else {
        toast.error("Invalid verification code");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length === 6) {
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setCode(""); onClose(); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={handleKeyDown}
            maxLength={6}
            className="font-mono text-center text-2xl tracking-[0.5em]"
            autoFocus
          />
          <Button className="w-full" onClick={handleVerify} disabled={loading || code.length !== 6}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Verify
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TotpVerifyDialog;
