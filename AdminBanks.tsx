import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Upload, Landmark, ChevronDown, ChevronUp, Hash, FileCode2 } from "lucide-react";
import { toast } from "sonner";

interface Bank {
  id: string;
  name: string;
  logo_path: string | null;
  is_active: boolean;
  display_order: number;
  account_number_digits: number | null;
}

interface IfscCode {
  id: string;
  bank_id: string;
  ifsc_code: string;
  branch_name: string;
  created_at: string;
}

const AdminBanks = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [form, setForm] = useState({ name: "", is_active: true, account_number_digits: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [expandedBankId, setExpandedBankId] = useState<string | null>(null);
  const [ifscForm, setIfscForm] = useState({ ifsc_code: "", branch_name: "" });

  const { data: banks = [], isLoading } = useQuery({
    queryKey: ["admin-banks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banks")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Bank[];
    },
  });

  const { data: ifscCodes = [] } = useQuery({
    queryKey: ["admin-bank-ifsc-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_ifsc_codes")
        .select("*")
        .order("ifsc_code", { ascending: true });
      if (error) throw error;
      return data as IfscCode[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let logo_path = editingBank?.logo_path || null;

      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("bank-logos")
          .upload(fileName, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        logo_path = fileName;
      }

      const digits = form.account_number_digits ? parseInt(form.account_number_digits) : null;

      if (editingBank) {
        const { error } = await supabase
          .from("banks")
          .update({ name: form.name, is_active: form.is_active, logo_path, account_number_digits: digits })
          .eq("id", editingBank.id);
        if (error) throw error;
      } else {
        const maxOrder = banks.length > 0 ? Math.max(...banks.map((b) => b.display_order)) + 1 : 1;
        const { error } = await supabase
          .from("banks")
          .insert({ name: form.name, is_active: form.is_active, logo_path, display_order: maxOrder, account_number_digits: digits });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingBank ? "Bank updated" : "Bank added");
      queryClient.invalidateQueries({ queryKey: ["admin-banks"] });
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
    onSettled: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bank deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-banks"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addIfscMutation = useMutation({
    mutationFn: async ({ bankId, ifsc_code, branch_name }: { bankId: string; ifsc_code: string; branch_name: string }) => {
      const { error } = await supabase
        .from("bank_ifsc_codes")
        .insert({ bank_id: bankId, ifsc_code: ifsc_code.toUpperCase(), branch_name });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("IFSC code added");
      queryClient.invalidateQueries({ queryKey: ["admin-bank-ifsc-codes"] });
      setIfscForm({ ifsc_code: "", branch_name: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteIfscMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bank_ifsc_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("IFSC code deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-bank-ifsc-codes"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (bank: Bank) => {
    setEditingBank(bank);
    setForm({ name: bank.name, is_active: bank.is_active, account_number_digits: bank.account_number_digits?.toString() || "" });
    setLogoFile(null);
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingBank(null);
    setForm({ name: "", is_active: true, account_number_digits: "" });
    setLogoFile(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingBank(null);
    setLogoFile(null);
  };

  const getLogoUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from("bank-logos").getPublicUrl(path);
    return data.publicUrl;
  };

  const getIfscForBank = (bankId: string) => ifscCodes.filter((c) => c.bank_id === bankId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Banks</h1>
          <p className="text-sm text-muted-foreground">Manage bank names, logos, account digits & IFSC codes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}>
              <Plus className="mr-1 h-4 w-4" /> Add Bank
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBank ? "Edit Bank" : "Add Bank"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. State Bank of India"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number Digits</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={form.account_number_digits}
                  onChange={(e) => setForm((p) => ({ ...p, account_number_digits: e.target.value }))}
                  placeholder="e.g. 11"
                />
                <p className="text-xs text-muted-foreground">How many digits does this bank's account number have?</p>
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-3">
                  {editingBank?.logo_path && !logoFile && (
                    <img src={getLogoUrl(editingBank.logo_path) || ""} alt="Current logo" className="h-10 w-10 rounded object-contain border" />
                  )}
                  {logoFile && (
                    <img src={URL.createObjectURL(logoFile)} alt="New logo" className="h-10 w-10 rounded object-contain border" />
                  )}
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    {logoFile ? "Change" : "Upload Logo"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(val) => setForm((p) => ({ ...p, is_active: val }))} />
                <Label>Active</Label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={() => saveMutation.mutate()} disabled={!form.name.trim() || saveMutation.isPending || uploading}>
                  {saveMutation.isPending || uploading ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" /> Bank List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : banks.length === 0 ? (
            <p className="text-muted-foreground">No banks added yet.</p>
          ) : (
            <div className="space-y-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="w-16">Logo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-24">Digits</TableHead>
                    <TableHead className="w-24">IFSC</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banks.map((bank, idx) => {
                    const bankIfsc = getIfscForBank(bank.id);
                    const isExpanded = expandedBankId === bank.id;
                    return (
                      <>
                        <TableRow key={bank.id} className="cursor-pointer" onClick={() => setExpandedBankId(isExpanded ? null : bank.id)}>
                          <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell>
                            {bank.logo_path ? (
                              <img src={getLogoUrl(bank.logo_path) || ""} alt={bank.name} className="h-8 w-8 rounded object-contain" />
                            ) : (
                              <Landmark className="h-6 w-6 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{bank.name}</TableCell>
                          <TableCell>
                            {bank.account_number_digits ? (
                              <Badge variant="secondary" className="gap-1">
                                <Hash className="h-3 w-3" />
                                {bank.account_number_digits}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <FileCode2 className="h-3 w-3" />
                              {bankIfsc.length}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              bank.is_active
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            }`}>
                              {bank.is_active ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(bank)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete "${bank.name}"?`)) deleteMutation.mutate(bank.id); }}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setExpandedBankId(isExpanded ? null : bank.id)}>
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${bank.id}-ifsc`}>
                            <TableCell colSpan={7} className="bg-muted/30 p-4">
                              <IfscPanel
                                bankId={bank.id}
                                bankName={bank.name}
                                ifscCodes={bankIfsc}
                                ifscForm={ifscForm}
                                setIfscForm={setIfscForm}
                                onAdd={(ifsc, branch) => addIfscMutation.mutate({ bankId: bank.id, ifsc_code: ifsc, branch_name: branch })}
                                onDelete={(id) => deleteIfscMutation.mutate(id)}
                                isAdding={addIfscMutation.isPending}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function IfscPanel({
  bankId,
  bankName,
  ifscCodes,
  ifscForm,
  setIfscForm,
  onAdd,
  onDelete,
  isAdding,
}: {
  bankId: string;
  bankName: string;
  ifscCodes: IfscCode[];
  ifscForm: { ifsc_code: string; branch_name: string };
  setIfscForm: (v: { ifsc_code: string; branch_name: string }) => void;
  onAdd: (ifsc: string, branch: string) => void;
  onDelete: (id: string) => void;
  isAdding: boolean;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground">IFSC Codes for {bankName}</h4>
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">IFSC Code</Label>
          <Input
            value={ifscForm.ifsc_code}
            onChange={(e) => setIfscForm({ ...ifscForm, ifsc_code: e.target.value })}
            placeholder="e.g. SBIN0001234"
            className="h-8 text-sm"
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Branch Name</Label>
          <Input
            value={ifscForm.branch_name}
            onChange={(e) => setIfscForm({ ...ifscForm, branch_name: e.target.value })}
            placeholder="e.g. Mumbai Main"
            className="h-8 text-sm"
          />
        </div>
        <Button
          size="sm"
          className="h-8"
          disabled={!ifscForm.ifsc_code.trim() || isAdding}
          onClick={() => onAdd(ifscForm.ifsc_code, ifscForm.branch_name)}
        >
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      {ifscCodes.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No IFSC codes added yet.</p>
      ) : (
        <div className="max-h-48 overflow-y-auto rounded border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs h-8">IFSC Code</TableHead>
                <TableHead className="text-xs h-8">Branch</TableHead>
                <TableHead className="text-xs h-8 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ifscCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="text-xs font-mono py-1.5">{code.ifsc_code}</TableCell>
                  <TableCell className="text-xs py-1.5">{code.branch_name || "—"}</TableCell>
                  <TableCell className="py-1.5">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { if (confirm("Delete this IFSC code?")) onDelete(code.id); }}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default AdminBanks;
