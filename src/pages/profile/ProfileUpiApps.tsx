import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Phone, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
}

const BUCKET = "payment-method-logos";

const ProfileUpiApps = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    queryKey: ["employee-payment-apps", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_payment_apps" as any)
        .select("*")
        .eq("profile_id", profile!.id);
      if (error) throw error;
      return (data ?? []) as unknown as SavedApp[];
    },
  });

  const [localState, setLocalState] = useState<
    Record<string, { enabled: boolean; phone: string }>
  >({});

  useEffect(() => {
    const state: typeof localState = {};
    for (const m of methods) {
      const saved = savedApps.find((s) => s.payment_method_id === m.id);
      state[m.id] = {
        enabled: !!saved,
        phone: saved?.phone_number ?? "",
      };
    }
    setLocalState(state);
  }, [methods, savedApps]);

  const getLogoUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async ({ methodId, phone }: { methodId: string; phone: string }) => {
      const existing = savedApps.find((s) => s.payment_method_id === methodId);
      if (existing) {
        const { error } = await supabase
          .from("employee_payment_apps" as any)
          .update({ phone_number: phone, updated_at: new Date().toISOString() } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("employee_payment_apps" as any)
          .insert({
            profile_id: profile!.id,
            payment_method_id: methodId,
            phone_number: phone,
            is_primary: false,
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-payment-apps"] });
      toast.success("Payment app saved");
    },
    onError: () => toast.error("Failed to save"),
  });

  const removeMutation = useMutation({
    mutationFn: async (methodId: string) => {
      const existing = savedApps.find((s) => s.payment_method_id === methodId);
      if (!existing) return;
      const { error } = await supabase
        .from("employee_payment_apps" as any)
        .delete()
        .eq("id", existing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-payment-apps"] });
      toast.success("Payment app removed");
    },
    onError: () => toast.error("Failed to remove"),
  });

  const handleToggle = (methodId: string, enabled: boolean) => {
    setLocalState((prev) => ({
      ...prev,
      [methodId]: { ...prev[methodId], enabled },
    }));
    if (!enabled) {
      removeMutation.mutate(methodId);
    }
  };

  const handleSave = (methodId: string) => {
    const s = localState[methodId];
    if (!s?.phone?.trim()) {
      toast.error("Please enter a phone number");
      return;
    }
    saveMutation.mutate({ methodId, phone: s.phone.trim() });
  };

  const basePath = profile?.user_type === "client" ? "/client" : "/employee";
  const loading = loadingMethods || loadingSaved;
  const enabledCount = Object.values(localState).filter((s) => s.enabled).length;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`${basePath}/profile`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">UPI Payment Apps</h1>
      </div>

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
        <p className="text-center text-sm text-muted-foreground py-10">
          No payment methods available.
        </p>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => {
            const s = localState[m.id];
            if (!s) return null;
            const logoUrl = getLogoUrl(m.logo_path);
            return (
              <Card
                key={m.id}
                className={`transition-all duration-200 ${
                  s.enabled
                    ? "border-primary/30 shadow-md shadow-primary/5"
                    : "hover:border-muted-foreground/20"
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-border overflow-hidden p-1.5">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={m.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-primary font-bold text-base">
                            {m.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-foreground text-sm">
                          {m.name}
                        </span>
                        {s.enabled && s.phone && (
                          <p className="text-[11px] text-muted-foreground">
                            {s.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={s.enabled}
                      onCheckedChange={(v) => handleToggle(m.id, v)}
                    />
                  </div>

                  {s.enabled && (
                    <div className="space-y-3 pt-1 border-t border-border/50">
                      <div className="space-y-1.5 pt-3">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Phone Number
                        </Label>
                        <Input
                          placeholder="Enter phone number"
                          value={s.phone}
                          onChange={(e) =>
                            setLocalState((prev) => ({
                              ...prev,
                              [m.id]: {
                                ...prev[m.id],
                                phone: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>

                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleSave(m.id)}
                        disabled={saveMutation.isPending}
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  )}
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
