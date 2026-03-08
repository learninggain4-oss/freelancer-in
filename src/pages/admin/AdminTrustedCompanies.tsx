import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  X,
  GripVertical,
  Building2,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TrustedCompany {
  id: string;
  name: string;
  logo_path: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminTrustedCompanies = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<TrustedCompany | null>(null);
  const [formName, setFormName] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formOrder, setFormOrder] = useState(0);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["admin-trusted-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trusted_companies")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as TrustedCompany[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const company = companies.find((c) => c.id === id);
      if (company?.logo_path) {
        await supabase.storage.from("company-logos").remove([company.logo_path]);
      }
      const { error } = await supabase.from("trusted_companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trusted-companies"] });
      toast.success("Company deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete company"),
  });

  const getLogoUrl = (logoPath: string | null) => {
    if (!logoPath) return null;
    const { data } = supabase.storage.from("company-logos").getPublicUrl(logoPath);
    return data.publicUrl;
  };

  const openAddDialog = () => {
    setEditingCompany(null);
    setFormName("");
    setFormActive(true);
    setFormOrder(companies.length > 0 ? Math.max(...companies.map((c) => c.display_order)) + 1 : 1);
    setLogoFile(null);
    setLogoPreview(null);
    setDialogOpen(true);
  };

  const openEditDialog = (company: TrustedCompany) => {
    setEditingCompany(company);
    setFormName(company.name);
    setFormActive(company.is_active);
    setFormOrder(company.display_order);
    setLogoFile(null);
    setLogoPreview(company.logo_path ? getLogoUrl(company.logo_path) : null);
    setDialogOpen(true);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be under 2MB");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Company name is required");
      return;
    }
    setSaving(true);
    try {
      let logoPath = editingCompany?.logo_path || null;

      // Upload new logo if provided
      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const fileName = `${Date.now()}-${formName.toLowerCase().replace(/\s+/g, "-")}.${ext}`;

        // Remove old logo if editing
        if (editingCompany?.logo_path) {
          await supabase.storage.from("company-logos").remove([editingCompany.logo_path]);
        }

        const { error: uploadError } = await supabase.storage
          .from("company-logos")
          .upload(fileName, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        logoPath = fileName;
      }

      if (editingCompany) {
        const { error } = await supabase
          .from("trusted_companies")
          .update({
            name: formName.trim(),
            logo_path: logoPath,
            display_order: formOrder,
            is_active: formActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCompany.id);
        if (error) throw error;
        toast.success("Company updated");
      } else {
        const { error } = await supabase.from("trusted_companies").insert({
          name: formName.trim(),
          logo_path: logoPath,
          display_order: formOrder,
          is_active: formActive,
        });
        if (error) throw error;
        toast.success("Company added");
      }

      queryClient.invalidateQueries({ queryKey: ["admin-trusted-companies"] });
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save company");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Trusted Companies</h2>
          <p className="text-sm text-muted-foreground">
            Manage companies displayed on the landing page carousel
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No trusted companies added yet</p>
            <Button onClick={openAddDialog} variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add First Company
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-background">
                    {company.logo_path ? (
                      <img
                        src={getLogoUrl(company.logo_path)!}
                        alt={company.name}
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{company.name}</h3>
                      <Badge variant={company.is_active ? "default" : "secondary"} className="shrink-0 text-[10px]">
                        {company.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Order: {company.display_order}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => openEditDialog(company)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => setDeleteId(company.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCompany ? "Edit Company" : "Add Company"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Google"
              />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border bg-muted">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Preview" className="h-12 w-12 object-contain" />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    Upload Logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">PNG or JPG, max 2MB</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formOrder}
                onChange={(e) => setFormOrder(Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label>Active (visible on landing page)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will remove the company from the landing page carousel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTrustedCompanies;
