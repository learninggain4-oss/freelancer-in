import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Phone, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  name: string;
  is_active: boolean;
  display_order: number;
}

interface SavedApp {
  id: string;
  profile_id: string;
  payment_method_id: string;
  phone_number: string | null;
  is_primary: boolean;
}

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
    Record<string, { enabled: boolean; phone: string; is_primary: boolean }>
  >({});

  useEffect(() => {
    const state: typeof localState = {};
    for (const m of methods) {
      const saved = savedApps.find((s) => s.payment_method_id === m.id);
      state[m.id] = {
        enabled: !!saved,
        phone: saved?.phone_number ?? "",
        is_primary: saved?.is_primary ?? false,
      };
    }
    setLocalState(state);
  }, [methods, savedApps]);

  const saveMutation = useMutation({
    mutationFn: async ({
      methodId,
      phone,
      isPrimary,
    }: {
      methodId: string;
      phone: string;
      isPrimary: boolean;
    }) => {
      const existing = savedApps.find((s) => s.payment_method_id === methodId);
      if (existing) {
        const { error } = await supabase
          .from("employee_payment_apps" as any)
          .update({
            phone_number: phone,
            is_primary: isPrimary,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("employee_payment_apps" as any)
          .insert({
            profile_id: profile!.id,
            payment_method_id: methodId,
            phone_number: phone,
            is_primary: isPrimary,
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
    saveMutation.mutate({
      methodId,
      phone: s.phone.trim(),
      isPrimary: s.is_primary,
    });
  };

  const basePath = profile?.user_type === "client" ? "/client" : "/employee";
  const loading = loadingMethods || loadingSaved;

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/profile`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">UPI Payment Apps</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Select your preferred UPI payment apps and link your phone number.
      </p>

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
            return (
              <Card key={m.id} className={s.enabled ? "border-primary/30" : ""}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary font-bold text-sm">
                        {m.name.charAt(0)}
                      </div>
                      <span className="font-medium text-foreground">{m.name}</span>
                    </div>
                    <Switch
                      checked={s.enabled}
                      onCheckedChange={(v) => handleToggle(m.id, v)}
                    />
                  </div>

                  {s.enabled && (
                    <div className="space-y-3 pt-1">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          <Phone className="inline h-3 w-3 mr-1" />
                          Phone Number
                        </Label>
                        <Input
                          placeholder="Enter phone number"
                          value={s.phone}
                          onChange={(e) =>
                            setLocalState((prev) => ({
                              ...prev,
                              [m.id]: { ...prev[m.id], phone: e.target.value },
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          id={`primary-${m.id}`}
                          checked={s.is_primary}
                          onCheckedChange={(v) =>
                            setLocalState((prev) => ({
                              ...prev,
                              [m.id]: { ...prev[m.id], is_primary: v },
                            }))
                          }
                        />
                        <Label htmlFor={`primary-${m.id}`} className="text-xs flex items-center gap-1">
                          <Star className="h-3 w-3" /> Set as primary
                        </Label>
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
