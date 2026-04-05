import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isFunctionUnavailableError, readFunctionJson } from "@/lib/function-response";
import { callEdgeFunction } from "@/lib/supabase-functions";

async function serverFetch<T>(functionName: string, body?: object): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await callEdgeFunction(functionName, { body, token });
  return readFunctionJson<T>(res, "M-Pin is not available right now.");
}

type Step = "idle" | "verify_current" | "enter_new" | "confirm_new";
type MpinStatus = { hasPin: boolean; unavailable?: boolean };

const PinInput = ({ value, onChange, placeholder = "••••", disabled }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => (
  <input
    type="password"
    inputMode="numeric"
    maxLength={4}
    value={value}
    disabled={disabled}
    onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
    placeholder={placeholder}
    className="w-full rounded-lg border bg-background px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
    autoComplete="off"
  />
);

const UserMpinCard = () => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("idle");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["user-mpin-status"],
    queryFn: async () => {
      try {
        return await serverFetch<MpinStatus>("mpin-status");
      } catch (error) {
        if (isFunctionUnavailableError(error)) {
          return { hasPin: false, unavailable: true } satisfies MpinStatus;
        }
        throw error;
      }
    },
  });

  const reset = () => {
    setStep("idle");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
  };

  const handleStart = () => {
    if (status?.unavailable) {
      toast.error("M-Pin is not available right now.");
      return;
    }
    if (status?.hasPin) {
      setStep("verify_current");
    } else {
      setStep("enter_new");
    }
  };

  const handleVerifyCurrent = async () => {
    if (currentPin.length < 4) { toast.error("Enter your current PIN"); return; }
    setLoading(true);
    try {
      const data = await serverFetch<{ valid: boolean }>("mpin-verify", { pin: currentPin });
      if (data.valid) {
        setStep("enter_new");
      } else {
        toast.error("Incorrect PIN");
      }
    } catch (e: any) {
      toast.error(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPin = async () => {
    if (newPin.length !== 4) { toast.error("PIN must be exactly 4 digits"); return; }
    if (newPin !== confirmPin) { toast.error("PINs do not match"); return; }
    setLoading(true);
    try {
      await serverFetch<{ success?: boolean }>("mpin-set", { pin: newPin });
      toast.success(status?.hasPin ? "M-Pin changed successfully!" : "M-Pin created successfully!");
      reset();
      queryClient.invalidateQueries({ queryKey: ["user-mpin-status"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to set PIN");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const hasPin = status?.hasPin ?? false;
  const unavailable = status?.unavailable ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" />
          M-Pin (Login Security PIN)
          {hasPin ? (
            <Badge variant="default" className="ml-2">Set</Badge>
          ) : (
            <Badge variant="secondary" className="ml-2">Not Set</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {step === "idle" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {unavailable
                ? "M-Pin is temporarily unavailable right now."
                : hasPin
                ? "Your M-Pin is set. You can change it at any time by verifying your current PIN first."
                : "Create a 4-digit M-Pin to secure your account. You'll be asked for this PIN every time you log in."}
            </p>
            <Button onClick={handleStart} disabled={unavailable}>
              <KeyRound className="mr-2 h-4 w-4" />
              {hasPin ? "Change M-Pin" : "Create M-Pin"}
            </Button>
          </div>
        )}

        {step === "verify_current" && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Enter your current M-Pin to continue:</p>
            <PinInput value={currentPin} onChange={setCurrentPin} disabled={loading} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} disabled={loading}>Cancel</Button>
              <Button onClick={handleVerifyCurrent} disabled={loading || currentPin.length < 4} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
              </Button>
            </div>
          </div>
        )}

        {step === "enter_new" && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Enter a new 4-digit M-Pin:</p>
            <PinInput value={newPin} onChange={setNewPin} placeholder="New PIN" disabled={loading} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} disabled={loading}>Cancel</Button>
              <Button onClick={() => { if (newPin.length === 4) setStep("confirm_new"); else toast.error("PIN must be exactly 4 digits"); }} disabled={loading || newPin.length !== 4} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "confirm_new" && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Confirm your new M-Pin:</p>
            <PinInput value={confirmPin} onChange={setConfirmPin} placeholder="Confirm PIN" disabled={loading} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setStep("enter_new"); setConfirmPin(""); }} disabled={loading}>Back</Button>
              <Button onClick={handleSetPin} disabled={loading || confirmPin.length !== 4} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : hasPin ? "Change PIN" : "Save PIN"}
              </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default UserMpinCard;
