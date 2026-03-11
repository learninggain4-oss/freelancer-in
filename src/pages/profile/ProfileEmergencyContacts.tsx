import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, User, Phone, ArrowLeft, Plus, Save, X, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ProfileEmergencyContacts = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const base = profile?.user_type === "employee" ? "/employee" : "/client";

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ contact_name: "", relationship: "", contact_phone: "" });

  const { data: emergencyContacts = [] } = useQuery({
    queryKey: ["emergency-contacts", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("employee_emergency_contacts")
        .select("*")
        .eq("profile_id", profile!.id)
        .order("created_at");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.contact_name.trim() || !form.relationship.trim() || !form.contact_phone.trim()) {
        throw new Error("All fields are required.");
      }
      const { error } = await supabase.from("employee_emergency_contacts").insert({
        profile_id: profile!.id,
        contact_name: form.contact_name.trim(),
        relationship: form.relationship.trim(),
        contact_phone: form.contact_phone.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Emergency contact added.");
      setAdding(false);
      setForm({ contact_name: "", relationship: "", contact_phone: "" });
      queryClient.invalidateQueries({ queryKey: ["emergency-contacts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`${base}/profile`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Emergency Contacts</h1>
        {!adding && (
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => setAdding(true)}>
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        )}
      </div>

      {adding && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="space-y-1">
              <Label className="text-xs">Contact Name *</Label>
              <Input value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Relationship *</Label>
              <Input value={form.relationship} onChange={(e) => setForm((p) => ({ ...p, relationship: e.target.value }))} placeholder="e.g. Father, Mother, Spouse" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone Number *</Label>
              <Input value={form.contact_phone} onChange={(e) => setForm((p) => ({ ...p, contact_phone: e.target.value }))} />
            </div>
            <p className="text-xs text-muted-foreground">⚠️ Once added, emergency contacts cannot be changed. Contact admin to modify.</p>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save className="mr-1 h-3 w-3" /> Save
              </Button>
              <Button variant="outline" onClick={() => setAdding(false)}>
                <X className="mr-1 h-3 w-3" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {emergencyContacts.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertCircle className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No emergency contacts added</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emergencyContacts.map((c: any, i: number) => (
                <div key={c.id} className={i > 0 ? "border-t pt-3" : ""}>
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{c.contact_name}</p>
                      <p className="text-xs text-muted-foreground">{c.relationship}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Phone className="h-3 w-3" />
                        <span>{c.contact_phone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileEmergencyContacts;
