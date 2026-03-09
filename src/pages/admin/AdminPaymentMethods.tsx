import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, Edit2, X, CreditCard,
  GripVertical, Check, Upload, Image as ImageIcon,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

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

  const { data: bannerPath } = useQuery({
    queryKey: ["upi-banner-setting"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "upi_banner_path")
        .maybeSingle();
      return data?.value || "";
    },
  });

  const getLogoUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const getBannerUrl = (path: string) => {
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

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true });
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

  const handleBannerUpload = async (file: File) => {
    setBannerUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `banners/upi-banner.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("app_settings")
        .upsert({ key: "upi_banner_path", value: path });
      if (updateError) throw updateError;

      qc.invalidateQueries({ queryKey: ["upi-banner-setting"] });
      toast.success("Banner uploaded");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBannerUploading(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Payment Methods</h2>
        <Button onClick={() => setShowAdd(!showAdd)} size="sm" className="gap-1">
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAdd ? "Cancel" : "Add Method"}
        </Button>
      </div>

      {/* Banner Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-primary" />
            UPI Page Banner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bannerPath && getBannerUrl(bannerPath) && (
            <img
              src={getBannerUrl(bannerPath)!}
              alt="UPI Banner"
              className="w-full h-32 object-cover rounded-lg border"
            />
          )}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleBannerUpload(f);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={bannerUploading}
            onClick={() => bannerInputRef.current?.click()}
          >
            {bannerUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {bannerPath ? "Change Banner" : "Upload Banner"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Recommended: 1920x1080 for best quality
          </p>
        </CardContent>
      </Card>

      {showAdd && (
        <Card>
          <CardContent className="flex items-end gap-3 pt-4">
            <div className="flex-1">
              <Label>Method Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. GPay, PhonePe, Paytm"
                onKeyDown={(e) => e.key === "Enter" && newName.trim() && addMutation.mutate(newName.trim())}
              />
            </div>
            <Button
              onClick={() => newName.trim() && addMutation.mutate(newName.trim())}
              disabled={addMutation.isPending || !newName.trim()}
              className="gap-1"
            >
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" />
            All Payment Methods ({methods.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            <p className="py-6 text-center text-sm text-muted-foreground">No payment methods yet.</p>
          ) : (
            <div className="space-y-2">
              {methods.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                  <span className="text-xs font-mono text-muted-foreground w-6">#{m.display_order}</span>

                  {/* Logo */}
                  <div
                    className="h-10 w-10 rounded-lg border bg-white flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
                    onClick={() => {
                      setUploadingId(m.id);
                      fileInputRef.current?.click();
                    }}
                  >
                    {uploadingId === m.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : m.logo_path ? (
                      <img
                        src={getLogoUrl(m.logo_path)!}
                        alt={m.name}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {editId === m.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editName.trim())
                            updateMutation.mutate({ id: m.id, name: editName.trim() });
                          if (e.key === "Escape") setEditId(null);
                        }}
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => editName.trim() && updateMutation.mutate({ id: m.id, name: editName.trim() })}
                      >
                        <Check className="h-3.5 w-3.5 text-accent" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditId(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <span className="flex-1 text-sm font-medium text-foreground">{m.name}</span>
                  )}

                  <Badge variant={m.is_active ? "default" : "secondary"} className="text-[10px]">
                    {m.is_active ? "Active" : "Disabled"}
                  </Badge>

                  <Switch
                    checked={m.is_active}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: m.id, is_active: checked })}
                  />

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => { setEditId(m.id); setEditName(m.name); }}
                  >
                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{m.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove this payment method.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(m.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPaymentMethods;
