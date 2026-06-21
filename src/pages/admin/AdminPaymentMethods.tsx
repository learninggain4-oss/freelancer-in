import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2, X, CreditCard, GripVertical, Check, Upload } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: {
    bg: "#070714",
    card: "rgba(255,255,255,.05)",
    border: "rgba(255,255,255,.08)",
    text: "#e2e8f0",
    sub: "#94a3b8",
    input: "rgba(255,255,255,.07)",
    nav: "rgba(255,255,255,.04)",
    badge: "rgba(99,102,241,.2)",
    badgeFg: "#a5b4fc",
  },
  white: {
    bg: "#f0f4ff",
    card: "#ffffff",
    border: "rgba(0,0,0,.08)",
    text: "#1e293b",
    sub: "#64748b",
    input: "#f8fafc",
    nav: "#f1f5f9",
    badge: "rgba(99,102,241,.1)",
    badgeFg: "#4f46e5",
  },
  wb: {
    bg: "#f0f4ff",
    card: "#ffffff",
    border: "rgba(0,0,0,.08)",
    text: "#1e293b",
    sub: "#64748b",
    input: "#f8fafc",
    nav: "#f1f5f9",
    badge: "rgba(99,102,241,.1)",
    badgeFg: "#4f46e5",
  },
};

type PaymentMethod = {
  id: string;
  name: string;
  is_active: boolean;
  display_order: number;
  logo_path: string | null;
  created_at: string;
  updated_at: string;
};

const BUCKET = "payment-method-logos";

const AdminPaymentMethods = () => {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: methods = [], isLoading } = useQuery({
    queryKey: ["admin-payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });

  const getLogoUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const maxOrder = methods.reduce((m, r) => Math.max(m, r.display_order), 0);
      const { error } = await supabase.from("payment_methods").insert({
        name,
        display_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      setNewName("");
      setShowAdd(false);
      toast.success("Payment method added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("payment_methods").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      toast.success("Status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("payment_methods").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      setEditId(null);
      toast.success("Name updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      toast.success("Payment method deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleLogoUpload = async (methodId: string, file: File) => {
    setUploadingId(methodId);
    try {
      const ext = file.name.split(".").pop();
      const path = `logos/${methodId}.${ext}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("payment_methods")
        .update({ logo_path: path })
        .eq("id", methodId);
      if (updateError) throw updateError;

      qc.invalidateQueries({ queryKey: ["admin-payment-methods"] });
      toast.success("Logo uploaded");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 min-h-screen" style={{ backgroundColor: T.bg, color: T.text }}>
      <div
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6 rounded-2xl border"
        style={{
          background: `linear-gradient(135deg, ${T.card} 0%, rgba(99,102,241,0.05) 100%)`,
          borderColor: T.border,
        }}
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-indigo-500/20">
              <CreditCard className="h-6 w-6 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Payment Methods</h2>
          </div>
          <p style={{ color: T.sub }}>Manage wallet recharge options</p>
        </div>
        <Button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 gap-2 h-11"
        >
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAdd ? "Cancel" : "Add Method"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr,2fr] gap-6">
        <div className="space-y-6">
          {showAdd && (
            <Card
              className="border-none shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300"
              style={{ backgroundColor: T.card }}
            >
              <CardHeader className="pb-3 border-b border-white/5 bg-white/5">
                <CardTitle className="text-sm font-bold uppercase tracking-widest" style={{ color: T.sub }}>
                  New Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label style={{ color: T.sub }}>Method Name</Label>
                  <Input
                    className="border-white/10 h-11"
                    style={{ backgroundColor: T.input, color: T.text }}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. GPay, PhonePe, Paytm"
                    onKeyDown={(e) => e.key === "Enter" && newName.trim() && addMutation.mutate(newName.trim())}
                  />
                </div>
                <Button
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                  onClick={() => newName.trim() && addMutation.mutate(newName.trim())}
                  disabled={addMutation.isPending || !newName.trim()}
                >
                  {addMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Method
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="border-none shadow-xl overflow-hidden" style={{ backgroundColor: T.card }}>
          <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
            <CardTitle
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
              style={{ color: T.sub }}
            >
              <CreditCard className="h-4 w-4 text-indigo-400" />
              Active Payment Methods ({methods.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && uploadingId) handleLogoUpload(uploadingId, f);
                e.target.value = "";
              }}
            />
            {methods.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="p-4 rounded-full bg-white/5 mb-4">
                  <CreditCard className="h-8 w-8 opacity-20" />
                </div>
                <p style={{ color: T.sub }}>No payment methods configured yet.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {methods.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-4 rounded-2xl border p-4 transition-all hover:scale-[1.01] hover:shadow-lg group"
                    style={{ backgroundColor: "rgba(255,255,255,0.02)", borderColor: T.border }}
                  >
                    <div className="cursor-grab active:cursor-grabbing opacity-20 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="h-4 w-4" />
                    </div>

                    <span className="text-xs font-mono opacity-40 w-8">#{m.display_order}</span>

                    {/* Logo */}
                    <div
                      className="h-12 w-12 rounded-xl bg-white flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500/50 transition-all border border-white/10 shrink-0"
                      onClick={() => {
                        setUploadingId(m.id);
                        fileInputRef.current?.click();
                      }}
                    >
                      {uploadingId === m.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                      ) : m.logo_path ? (
                        <img
                          src={getLogoUrl(m.logo_path)!}
                          alt={m.name}
                          className="h-full w-full object-contain p-1.5"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-0.5 opacity-30">
                          <Upload className="h-4 w-4" />
                          <span className="text-[8px] font-bold">LOGO</span>
                        </div>
                      )}
                    </div>

                    {editId === m.id ? (
                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-10 flex-1 border-white/20"
                          style={{ backgroundColor: T.input }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && editName.trim())
                              updateMutation.mutate({ id: m.id, name: editName.trim() });
                            if (e.key === "Escape") setEditId(null);
                          }}
                          autoFocus
                        />
                        <Button
                          size="icon"
                          className="h-10 w-10 bg-indigo-600 text-white rounded-xl"
                          onClick={() => editName.trim() && updateMutation.mutate({ id: m.id, name: editName.trim() })}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 rounded-xl"
                          onClick={() => setEditId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold truncate block">{m.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${m.is_active ? "bg-emerald-500" : "bg-white/20"}`}
                          />
                          <span className="text-[10px] font-bold tracking-widest uppercase opacity-50">
                            {m.is_active ? "Online" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Switch
                        checked={m.is_active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: m.id, is_active: checked })}
                      />

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 rounded-xl hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setEditId(m.id);
                          setEditName(m.name);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-10 w-10 rounded-xl hover:bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-white/10" style={{ backgroundColor: T.bg }}>
                          <AlertDialogHeader>
                            <AlertDialogTitle style={{ color: T.text }}>Delete Method?</AlertDialogTitle>
                            <AlertDialogDescription style={{ color: T.sub }}>
                              This will permanently remove "{m.name}" from recharge options.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-white/10" style={{ color: T.text }}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(m.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Delete Permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPaymentMethods;
