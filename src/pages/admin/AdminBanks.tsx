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
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

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
  const { theme } = useDashboardTheme();
  const T = TH[theme];
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
    <div className="space-y-6 p-4 min-h-screen" style={{ backgroundColor: T.bg, color: T.text }}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6 rounded-2xl border" style={{ background: `linear-gradient(135deg, ${T.card} 0%, rgba(99,102,241,0.05) 100%)`, borderColor: T.border }}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-indigo-500/20">
              <Landmark className="h-6 w-6 text-indigo-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Banks</h1>
          </div>
          <p style={{ color: T.sub }}>Manage bank names, logos, account digits & IFSC codes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20">
              <Plus className="mr-2 h-4 w-4" /> Add Bank
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/10" style={{ backgroundColor: T.bg }}>
            <DialogHeader>
              <DialogTitle style={{ color: T.text }}>{editingBank ? "Edit Bank" : "Add New Bank"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label style={{ color: T.sub }}>Bank Name</Label>
                <Input
                  className="border-white/10 h-11"
                  style={{ backgroundColor: T.input, color: T.text }}
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. State Bank of India"
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.sub }}>Account Number Digits</Label>
                <Input
                  type="number"
                  className="border-white/10 h-11"
                  style={{ backgroundColor: T.input, color: T.text }}
                  min={1}
                  max={30}
                  value={form.account_number_digits}
                  onChange={(e) => setForm((p) => ({ ...p, account_number_digits: e.target.value }))}
                  placeholder="e.g. 11"
                />
                <p className="text-[10px] opacity-50 uppercase tracking-wider font-bold" style={{ color: T.text }}>Required for validation</p>
              </div>
              <div className="space-y-2">
                <Label style={{ color: T.sub }}>Logo</Label>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-white/10 bg-white/5">
                  {(editingBank?.logo_path || logoFile) && (
                    <div className="h-16 w-16 rounded-xl bg-white p-2 flex items-center justify-center overflow-hidden">
                      <img src={logoFile ? URL.createObjectURL(logoFile) : (getLogoUrl(editingBank!.logo_path) || "")} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 h-16 text-sm hover:bg-white/5 transition-colors">
                    <Upload className="h-4 w-4" />
                    {logoFile ? "Change Image" : "Upload Logo"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Active Status</Label>
                  <p className="text-[10px] opacity-50" style={{ color: T.text }}>Show this bank to users</p>
                </div>
                <Switch checked={form.is_active} onCheckedChange={(val) => setForm((p) => ({ ...p, is_active: val }))} />
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => saveMutation.mutate()} disabled={!form.name.trim() || saveMutation.isPending || uploading}>
                  {saveMutation.isPending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Bank"}
                </Button>
                <Button variant="outline" className="h-11 border-white/10" onClick={closeDialog}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-xl overflow-hidden" style={{ backgroundColor: T.card }}>
        <CardHeader className="border-b border-white/5 bg-white/5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Landmark className="h-5 w-5 text-indigo-500" />
            Bank Registry
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full opacity-10" />)}
            </div>
          ) : banks.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
               <div className="p-4 rounded-full bg-white/5 mb-4">
                  <Landmark className="h-8 w-8 opacity-20" />
                </div>
               <p style={{ color: T.sub }}>No banks registered yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="w-12 text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>#</TableHead>
                    <TableHead className="w-16 text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>Logo</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>Bank Name</TableHead>
                    <TableHead className="w-24 text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>Digits</TableHead>
                    <TableHead className="w-24 text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>IFSC</TableHead>
                    <TableHead className="w-20 text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>Status</TableHead>
                    <TableHead className="w-28 text-right text-[10px] uppercase font-bold tracking-widest" style={{ color: T.sub }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banks.map((bank, idx) => {
                    const bankIfsc = getIfscForBank(bank.id);
                    const isExpanded = expandedBankId === bank.id;
                    return (
                      <Fragment key={bank.id}>
                        <TableRow 
                          className={`cursor-pointer border-white/5 transition-colors ${isExpanded ? 'bg-indigo-500/5' : 'hover:bg-white/5'}`} 
                          onClick={() => setExpandedBankId(isExpanded ? null : bank.id)}
                        >
                          <TableCell className="text-xs font-mono opacity-40">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="h-10 w-10 rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden border border-white/10">
                              {bank.logo_path ? (
                                <img src={getLogoUrl(bank.logo_path) || ""} alt={bank.name} className="max-h-full max-w-full object-contain" />
                              ) : (
                                <Landmark className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold tracking-tight">{bank.name}</TableCell>
                          <TableCell>
                            {bank.account_number_digits ? (
                              <Badge variant="outline" className="gap-1.5 border-white/10 font-mono text-xs" style={{ backgroundColor: T.nav, color: T.text }}>
                                <Hash className="h-3 w-3 opacity-40" />
                                {bank.account_number_digits}
                              </Badge>
                            ) : (
                              <span className="text-xs opacity-20">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className="gap-1.5 border-none font-bold" style={{ backgroundColor: T.badge, color: T.badgeFg }}>
                              <FileCode2 className="h-3 w-3" />
                              {bankIfsc.length}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                               <div className={`h-1.5 w-1.5 rounded-full ${bank.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                               <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: bank.is_active ? '#10b981' : '#f43f5e' }}>
                                 {bank.is_active ? "Active" : "Hidden"}
                               </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 rounded-lg" onClick={() => openEdit(bank)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10 text-red-400 rounded-lg" onClick={() => { if (confirm(`Delete "${bank.name}"?`)) deleteMutation.mutate(bank.id); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className={`h-8 w-8 hover:bg-white/10 rounded-lg transition-transform ${isExpanded ? 'rotate-180 text-indigo-400' : ''}`} onClick={() => setExpandedBankId(isExpanded ? null : bank.id)}>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${bank.id}-ifsc`} className="bg-black/20 hover:bg-black/20 border-white/5">
                            <TableCell colSpan={7} className="p-6">
                              <IfscPanel
                                T={T}
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
                      </Fragment>
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
  T,
  bankId,
  bankName,
  ifscCodes,
  ifscForm,
  setIfscForm,
  onAdd,
  onDelete,
  isAdding,
}: {
  T: any;
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-widest" style={{ color: T.sub }}>IFSC Codes: {bankName}</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-3 items-end p-4 rounded-2xl border border-white/5 bg-white/5 shadow-inner">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">IFSC Code</Label>
          <Input
            value={ifscForm.ifsc_code}
            onChange={(e) => setIfscForm({ ...ifscForm, ifsc_code: e.target.value })}
            placeholder="e.g. SBIN0001234"
            className="h-10 border-white/10"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: T.text }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Branch Name</Label>
          <Input
            value={ifscForm.branch_name}
            onChange={(e) => setIfscForm({ ...ifscForm, branch_name: e.target.value })}
            placeholder="e.g. Mumbai Main"
            className="h-10 border-white/10"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: T.text }}
          />
        </div>
        <Button
          className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 px-6"
          disabled={!ifscForm.ifsc_code.trim() || isAdding}
          onClick={() => onAdd(ifscForm.ifsc_code, ifscForm.branch_name)}
        >
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          Add Code
        </Button>
      </div>

      {ifscCodes.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-white/5 opacity-50">
           <p className="text-sm">No IFSC codes mapped to this bank.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-white/5 overflow-hidden shadow-xl">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="text-[10px] uppercase font-bold tracking-widest h-10">IFSC Code</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest h-10">Branch Office</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest h-10 w-12 text-right">Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ifscCodes.map((code) => (
                <TableRow key={code.id} className="hover:bg-white/5 border-white/5">
                  <TableCell className="font-mono text-sm font-bold text-indigo-400 py-3">{code.ifsc_code}</TableCell>
                  <TableCell className="text-sm py-3" style={{ color: T.sub }}>{code.branch_name || "—"}</TableCell>
                  <TableCell className="py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10 text-red-400 rounded-lg" onClick={() => { if (confirm("Delete this IFSC code?")) onDelete(code.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
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
