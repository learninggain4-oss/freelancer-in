import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, ShieldCheck, Smartphone, Clock, CalendarClock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  name: string;
  is_active: boolean;
  display_order: number;
  logo_path: string | null;
}

interface SavedApp {
  id: string;
  profile_id: string;
  payment_method_id: string;
  phone_number: string | null;
  is_primary: boolean;
  kyc_status: string | null;
  kyc_enabled_at: string | null;
}

const BUCKET = "payment-method-logos";
const KYC_DURATION_MS = 30 * 60 * 1000;

const ProfileUpiApps = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: methods = [], isLoading: loadingMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });

  const { data: savedApps = [], isLoading: loadingSaved } = useQuery({
    queryKey: ["freelancer-payment-apps", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_payment_apps" as any)
        .select("*")
        .eq("profile_id", profile!.id);
      if (error) throw error;
      return (data ?? []) as unknown as SavedApp[];
    },
    refetchInterval: 10000,
  });

  const { data: kycWindow } = useQuery({
    queryKey: ["kyc-window", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("kyc_window_start, kyc_window_end, kyc_window_changed_at")
        .eq("id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data as {
        kyc_window_start: string | null;
        kyc_window_end: string | null;
        kyc_window_changed_at: string | null;
      } | null;
    },
  });

  const parseTimeToMinutes = (t: string | null | undefined) => {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const cooldownMsLeft = (() => {
    if (!kycWindow?.kyc_window_changed_at) return 0;
    const changed = new Date(kycWindow.kyc_window_changed_at).getTime();
    const elapsed = now - changed;
    const remaining = 24 * 60 * 60 * 1000 - elapsed;
    return remaining > 0 ? remaining : 0;
  })();

  const isInCooldown = cooldownMsLeft > 0;

  const formatCooldown = (ms: number) => {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return `${h}h ${m}m`;
  };

  const isWithinKycWindow = (() => {
    if (isInCooldown) return false;
    const s = parseTimeToMinutes(kycWindow?.kyc_window_start);
    const e = parseTimeToMinutes(kycWindow?.kyc_window_end);
    if (s == null || e == null) return false;
    const d = new Date(now);
    const cur = d.getHours() * 60 + d.getMinutes();
    if (s <= e) return cur >= s && cur <= e;
    return cur >= s || cur <= e;
  })();

  const fmtTime = (t: string | null | undefined) => {
    if (!t) return "";
    return t.slice(0, 5);
  };

  // Realtime updates
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel(`upi-apps-${profile.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_payment_apps", filter: `profile_id=eq.${profile.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["freelancer-payment-apps"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  const [localState, setLocalState] = useState<Record<string, { linked: boolean }>>({});

  useEffect(() => {
    const state: typeof localState = {};
    for (const m of methods) {
      const saved = savedApps.find((s) => s.payment_method_id === m.id);
      state[m.id] = { linked: !!saved };
    }
    setLocalState(state);
  }, [methods, savedApps]);

  const getLogoUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async (methodId: string) => {
      if (!profile?.id) throw new Error("User profile not found. Please log in again.");

      const { error } = await supabase
        .from("employee_payment_apps" as any)
        .upsert(
          {
            profile_id: profile.id,
            payment_method_id: methodId,
            phone_number: null,
            is_primary: false,
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: "profile_id,payment_method_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freelancer-payment-apps"] });
      toast.success("Payment app saved successfully");
    },
    onError: (error: any) => {
      console.error("Save Error:", error);
      toast.error(`Failed to save: ${error.message || "Database error"}`);
    },
  });

  const handleSave = (methodId: string) => {
    saveMutation.mutate(methodId);
  };

  const { pathname } = useLocation();
  const basePath = pathname.startsWith("/freelancer")
    ? "/freelancer"
    : pathname.startsWith("/employer")
      ? "/employer"
      : "/employee";
  const loading = loadingMethods || loadingSaved;
  const enabledCount = Object.values(localState).filter((s) => s.linked).length;

  const handleRestartKyc = async (saved: SavedApp, methodId: string) => {
    const { error } = await supabase
      .from("employee_payment_apps" as any)
      .update({
        kyc_status: "kyc_disconnect",
        kyc_enabled_at: null,
        otp_requested: false,
        otp_requested_at: null,
        otp_submitted_at: null,
        user_otp: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", saved.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["freelancer-payment-apps"] });
    navigate(`${basePath}/profile/upi-apps/${methodId}/kyc`);
  };

  const getKycInfo = (saved: SavedApp | undefined) => {
    if (!saved) return { state: "none" as const, remaining: 0 };
    if (saved.kyc_status === "kyc_enabled" && saved.kyc_enabled_at) {
      const remaining = new Date(saved.kyc_enabled_at).getTime() + KYC_DURATION_MS - now;
      if (remaining > 0) return { state: "enabled" as const, remaining };
      return { state: "expired" as const, remaining: 0 };
    }
    return { state: "disconnected" as const, remaining: 0 };
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/profile`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">UPI Payment Apps</h1>
      </div>

      {/* KYC Setup Time card */}
      <Card className="border-primary/20">
        <CardContent className="p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">KYC Enable Time</p>
              {kycWindow?.kyc_window_start && kycWindow?.kyc_window_end ? (
                <p className="text-[11px] text-muted-foreground">
                  Daily window: {fmtTime(kycWindow.kyc_window_start)} – {fmtTime(kycWindow.kyc_window_end)}
                  {" • "}
                  {isInCooldown ? (
                    <span className="text-amber-600 font-medium">Security hold: {formatCooldown(cooldownMsLeft)}</span>
                  ) : (
                    <span className={isWithinKycWindow ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                      {isWithinKycWindow ? "Active now" : "Inactive"}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">Not set up</p>
              )}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate(`${basePath}/profile/upi-apps/schedule`)}>
            Setup Time
          </Button>
        </CardContent>
      </Card>

      {/* Stats strip */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
          <Smartphone className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{enabledCount}</p>
          <p className="text-[10px] text-muted-foreground">Apps Linked</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : methods.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">No payment methods available.</p>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => {
            const s = localState[m.id];
            if (!s) return null;
            const logoUrl = getLogoUrl(m.logo_path);
            const saved = savedApps.find((sa) => sa.payment_method_id === m.id);
            const kyc = getKycInfo(saved);
            const minutes = Math.floor(kyc.remaining / 60000);
            const seconds = Math.floor((kyc.remaining % 60000) / 1000);
            const timeLabel = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
            return (
              <Card
                key={m.id}
                className={`transition-all duration-200 ${
                  s.linked ? "border-primary/30 shadow-md shadow-primary/5" : "hover:border-muted-foreground/20"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-border overflow-hidden p-1.5">
                        {logoUrl ? (
                          <img src={logoUrl} alt={m.name} className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-primary font-bold text-base">{m.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-foreground text-sm">{m.name}</span>
                        {s.linked && kyc.state === "enabled" && (
                          <p className="flex items-center gap-1 text-[11px] text-green-600 font-medium">
                            <ShieldCheck className="h-3 w-3" />
                            KYC Enabled
                            <span className="ml-1 inline-flex items-center gap-0.5 text-muted-foreground font-normal">
                              <Clock className="h-3 w-3" /> {timeLabel}
                            </span>
                          </p>
                        )}
                        {s.linked && kyc.state !== "enabled" && (
                          <p className="flex items-center gap-1 text-[11px] text-destructive">
                            <ShieldCheck className="h-3 w-3" />
                            KYC Disconnect
                          </p>
                        )}
                      </div>
                    </div>
                    {s.linked ? (
                      kyc.state === "enabled" ? (
                        <Button size="sm" variant="outline" disabled>
                          KYC Enabled
                        </Button>
                      ) : kyc.state === "expired" ? (
                        <Button
                          size="sm"
                          onClick={() => saved && handleRestartKyc(saved, m.id)}
                          disabled={!isWithinKycWindow}
                          title={
                            isInCooldown
                              ? `Security hold: new time window activates in ${formatCooldown(cooldownMsLeft)}`
                              : !isWithinKycWindow
                                ? "Outside your KYC enable time window"
                                : undefined
                          }
                        >
                          KYC Enable
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => navigate(`${basePath}/profile/upi-apps/${m.id}/kyc`)}
                          disabled={!isWithinKycWindow}
                          title={
                            isInCooldown
                              ? `Security hold: new time window activates in ${formatCooldown(cooldownMsLeft)}`
                              : !isWithinKycWindow
                                ? "Outside your KYC enable time window"
                                : undefined
                          }
                        >
                          KYC Enable
                        </Button>
                      )
                    ) : (
                      <Button size="sm" onClick={() => handleSave(m.id)} disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileUpiApps;
