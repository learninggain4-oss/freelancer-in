import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Briefcase, Receipt, Wallet, Bell, Fingerprint, Landmark, LifeBuoy,
  Pencil, ChevronUp, Save, EyeOff,
} from "lucide-react";
import { toast } from "sonner";

type Props = { profileId: string };

// Generic expandable row item
type EntityItem = Record<string, any> & { id: string; is_cleared?: boolean };

const ClearButton = ({ item, onClear, onRestore }: { item: EntityItem; onClear: () => void; onRestore: () => void }) => (
  item.is_cleared ? (
    <Button size="sm" variant="outline" onClick={onRestore}>Restore</Button>
  ) : (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-destructive">
          <EyeOff className="mr-1 h-3 w-3" /> Clear
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear this record?</AlertDialogTitle>
          <AlertDialogDescription>Soft-delete — can be restored later.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onClear}>Clear</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
);

// ─── Jobs Section ──────────────────────────────────────────────
const JobsSection = ({ profileId }: Props) => {
  const qc = useQueryClient();
  const [showCleared, setShowCleared] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["profile-jobs", profileId, showCleared],
    queryFn: async () => {
      let q = supabase.from("projects").select("*").or(`client_id.eq.${profileId},assigned_employee_id.eq.${profileId}`).order("created_at", { ascending: false }).limit(50);
      if (!showCleared) q = q.eq("is_cleared", false);
      const { data } = await q;
      return (data || []) as EntityItem[];
    },
  });

  const clearMut = useMutation({
    mutationFn: async ({ id, clear }: { id: string; clear: boolean }) => {
      const { error } = await supabase.from("projects").update({ is_cleared: clear }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["profile-jobs"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const editMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("projects").update({
        name: data.name, amount: Number(data.amount), status: data.status, remarks: data.remarks,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Job updated"); setEditId(null); qc.invalidateQueries({ queryKey: ["profile-jobs"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (item: EntityItem) => {
    if (editId === item.id) { setEditId(null); return; }
    setEditForm({ name: item.name, amount: item.amount, status: item.status, remarks: item.remarks || "" });
    setEditId(item.id);
  };

  const statusBadge: Record<string, string> = {
    draft: "bg-muted text-muted-foreground", open: "bg-primary/15 text-primary border-primary/30",
    in_progress: "bg-warning/15 text-warning border-warning/30", completed: "bg-accent/15 text-accent border-accent/30",
    cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Briefcase className="h-4 w-4" /> Jobs ({jobs.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Switch checked={showCleared} onCheckedChange={setShowCleared} id="pj-cleared" />
            <Label htmlFor="pj-cleared" className="text-xs text-muted-foreground">Show cleared</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? <Skeleton className="h-16 w-full" /> : jobs.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No jobs</p>
        ) : jobs.map((j) => (
          <div key={j.id} className={`rounded-lg border p-3 space-y-2 ${j.is_cleared ? "opacity-50 border-dashed" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm text-foreground">{j.name}</p>
                <p className="text-xs text-muted-foreground">₹{Number(j.amount).toLocaleString("en-IN")} · {new Date(j.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className={statusBadge[j.status] || ""}>{j.status}</Badge>
                {j.is_cleared && <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Cleared</Badge>}
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => startEdit(j)}>
                {editId === j.id ? <><ChevronUp className="mr-1 h-3 w-3" />Close</> : <><Pencil className="mr-1 h-3 w-3" />Edit</>}
              </Button>
              <ClearButton item={j} onClear={() => clearMut.mutate({ id: j.id, clear: true })} onRestore={() => clearMut.mutate({ id: j.id, clear: false })} />
            </div>
            {editId === j.id && (
              <div className="mt-2 space-y-3 rounded-lg border bg-muted/30 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={editForm.name} onChange={(e) => setEditForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-xs">Amount</Label><Input type="number" value={editForm.amount} onChange={(e) => setEditForm((f: any) => ({ ...f, amount: e.target.value }))} /></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={editForm.status} onValueChange={(v) => setEditForm((f: any) => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["draft","open","in_progress","job_confirmed","payment_processing","validation","completed","cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Remarks</Label><Input value={editForm.remarks} onChange={(e) => setEditForm((f: any) => ({ ...f, remarks: e.target.value }))} /></div>
                </div>
                <Button className="w-full" size="sm" onClick={() => editMut.mutate({ id: j.id, data: editForm })} disabled={editMut.isPending}>
                  <Save className="mr-1 h-3 w-3" /> {editMut.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// ─── Transactions Section ──────────────────────────────────────
const TransactionsSection = ({ profileId }: Props) => {
  const qc = useQueryClient();
  const [showCleared, setShowCleared] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["profile-transactions", profileId, showCleared],
    queryFn: async () => {
      let q = supabase.from("transactions").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(50);
      if (!showCleared) q = q.eq("is_cleared", false);
      const { data } = await q;
      return (data || []) as EntityItem[];
    },
  });

  const clearMut = useMutation({
    mutationFn: async ({ id, clear }: { id: string; clear: boolean }) => {
      const { error } = await supabase.from("transactions").update({ is_cleared: clear }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["profile-transactions"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const editMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("transactions").update({
        amount: Number(data.amount), type: data.type, description: data.description,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Transaction updated"); setEditId(null); qc.invalidateQueries({ queryKey: ["profile-transactions"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (item: EntityItem) => {
    if (editId === item.id) { setEditId(null); return; }
    setEditForm({ amount: item.amount, type: item.type, description: item.description });
    setEditId(item.id);
  };

  const typeBadge: Record<string, string> = {
    credit: "bg-accent/15 text-accent border-accent/30", debit: "bg-destructive/15 text-destructive border-destructive/30",
    hold: "bg-warning/15 text-warning border-warning/30", release: "bg-primary/15 text-primary border-primary/30",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Receipt className="h-4 w-4" /> Transactions ({items.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Switch checked={showCleared} onCheckedChange={setShowCleared} id="pt-cleared" />
            <Label htmlFor="pt-cleared" className="text-xs text-muted-foreground">Show cleared</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? <Skeleton className="h-16 w-full" /> : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No transactions</p>
        ) : items.map((t) => (
          <div key={t.id} className={`rounded-lg border p-3 space-y-2 ${t.is_cleared ? "opacity-50 border-dashed" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={typeBadge[t.type] || ""}>{t.type}</Badge>
                  <span className="font-semibold text-sm">₹{Number(t.amount).toLocaleString("en-IN")}</span>
                  {t.is_cleared && <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Cleared</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(t.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => startEdit(t)}>
                {editId === t.id ? <><ChevronUp className="mr-1 h-3 w-3" />Close</> : <><Pencil className="mr-1 h-3 w-3" />Edit</>}
              </Button>
              <ClearButton item={t} onClear={() => clearMut.mutate({ id: t.id, clear: true })} onRestore={() => clearMut.mutate({ id: t.id, clear: false })} />
            </div>
            {editId === t.id && (
              <div className="mt-2 space-y-3 rounded-lg border bg-muted/30 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={editForm.type} onValueChange={(v) => setEditForm((f: any) => ({ ...f, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["credit","debit","hold","release"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Amount</Label><Input type="number" value={editForm.amount} onChange={(e) => setEditForm((f: any) => ({ ...f, amount: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">Description</Label><Textarea value={editForm.description} onChange={(e) => setEditForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} /></div>
                <Button className="w-full" size="sm" onClick={() => editMut.mutate({ id: t.id, data: editForm })} disabled={editMut.isPending}>
                  <Save className="mr-1 h-3 w-3" /> {editMut.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// ─── Withdrawals Section ───────────────────────────────────────
const WithdrawalsSection = ({ profileId }: Props) => {
  const qc = useQueryClient();
  const [showCleared, setShowCleared] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["profile-withdrawals", profileId, showCleared],
    queryFn: async () => {
      let q = supabase.from("withdrawals").select("*").eq("employee_id", profileId).order("requested_at", { ascending: false }).limit(50);
      if (!showCleared) q = q.eq("is_cleared", false);
      const { data } = await q;
      return (data || []) as EntityItem[];
    },
  });

  const clearMut = useMutation({
    mutationFn: async ({ id, clear }: { id: string; clear: boolean }) => {
      const { error } = await supabase.from("withdrawals").update({ is_cleared: clear }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["profile-withdrawals"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const editMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("withdrawals").update({
        amount: Number(data.amount), status: data.status, review_notes: data.review_notes,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Withdrawal updated"); setEditId(null); qc.invalidateQueries({ queryKey: ["profile-withdrawals"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (item: EntityItem) => {
    if (editId === item.id) { setEditId(null); return; }
    setEditForm({ amount: item.amount, status: item.status, review_notes: item.review_notes || "" });
    setEditId(item.id);
  };

  const statusBadge: Record<string, string> = {
    pending: "bg-warning/15 text-warning border-warning/30", approved: "bg-accent/15 text-accent border-accent/30",
    rejected: "bg-destructive/15 text-destructive border-destructive/30", completed: "bg-primary/15 text-primary border-primary/30",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Wallet className="h-4 w-4" /> Withdrawals ({items.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Switch checked={showCleared} onCheckedChange={setShowCleared} id="pw-cleared" />
            <Label htmlFor="pw-cleared" className="text-xs text-muted-foreground">Show cleared</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? <Skeleton className="h-16 w-full" /> : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No withdrawals</p>
        ) : items.map((w) => (
          <div key={w.id} className={`rounded-lg border p-3 space-y-2 ${w.is_cleared ? "opacity-50 border-dashed" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <span className="font-semibold text-sm">₹{Number(w.amount).toLocaleString("en-IN")}</span>
                <span className="ml-2 text-xs uppercase text-muted-foreground">{w.method}</span>
                {w.is_cleared && <Badge variant="outline" className="ml-2 text-[10px] border-destructive/30 text-destructive">Cleared</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className={statusBadge[w.status] || ""}>{w.status}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(w.requested_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => startEdit(w)}>
                {editId === w.id ? <><ChevronUp className="mr-1 h-3 w-3" />Close</> : <><Pencil className="mr-1 h-3 w-3" />Edit</>}
              </Button>
              <ClearButton item={w} onClear={() => clearMut.mutate({ id: w.id, clear: true })} onRestore={() => clearMut.mutate({ id: w.id, clear: false })} />
            </div>
            {editId === w.id && (
              <div className="mt-2 space-y-3 rounded-lg border bg-muted/30 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1"><Label className="text-xs">Amount</Label><Input type="number" value={editForm.amount} onChange={(e) => setEditForm((f: any) => ({ ...f, amount: e.target.value }))} /></div>
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={editForm.status} onValueChange={(v) => setEditForm((f: any) => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["pending","approved","rejected","completed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1"><Label className="text-xs">Review Notes</Label><Textarea value={editForm.review_notes} onChange={(e) => setEditForm((f: any) => ({ ...f, review_notes: e.target.value }))} rows={2} /></div>
                <Button className="w-full" size="sm" onClick={() => editMut.mutate({ id: w.id, data: editForm })} disabled={editMut.isPending}>
                  <Save className="mr-1 h-3 w-3" /> {editMut.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// ─── Notifications Section ─────────────────────────────────────
const NotificationsSection = ({ profileId }: Props) => {
  const qc = useQueryClient();
  const [showCleared, setShowCleared] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["profile-notifications", profileId, showCleared],
    queryFn: async () => {
      // notifications uses user_id (auth uid), but we have profile_id — need to get user_id first
      const { data: prof } = await supabase.from("profiles").select("user_id").eq("id", profileId).single();
      if (!prof) return [];
      let q = supabase.from("notifications").select("*").eq("user_id", prof.user_id).order("created_at", { ascending: false }).limit(50);
      if (!showCleared) q = q.eq("is_cleared", false);
      const { data } = await q;
      return (data || []) as EntityItem[];
    },
  });

  const clearMut = useMutation({
    mutationFn: async ({ id, clear }: { id: string; clear: boolean }) => {
      const { error } = await supabase.from("notifications").update({ is_cleared: clear }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["profile-notifications"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const editMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("notifications").update({
        title: data.title, message: data.message, type: data.type, is_read: data.is_read,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Notification updated"); setEditId(null); qc.invalidateQueries({ queryKey: ["profile-notifications"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (item: EntityItem) => {
    if (editId === item.id) { setEditId(null); return; }
    setEditForm({ title: item.title, message: item.message, type: item.type, is_read: item.is_read });
    setEditId(item.id);
  };

  const typeBadge: Record<string, string> = {
    info: "bg-primary/15 text-primary border-primary/30", success: "bg-accent/15 text-accent border-accent/30",
    warning: "bg-warning/15 text-warning border-warning/30", error: "bg-destructive/15 text-destructive border-destructive/30",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4" /> Notifications ({items.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Switch checked={showCleared} onCheckedChange={setShowCleared} id="pn-cleared" />
            <Label htmlFor="pn-cleared" className="text-xs text-muted-foreground">Show cleared</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? <Skeleton className="h-16 w-full" /> : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No notifications</p>
        ) : items.map((n) => (
          <div key={n.id} className={`rounded-lg border p-3 space-y-2 ${n.is_cleared ? "opacity-50 border-dashed" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">{n.title}</span>
                  <Badge variant="outline" className={typeBadge[n.type] || ""}>{n.type}</Badge>
                  {!n.is_read && <Badge variant="secondary" className="text-[10px]">Unread</Badge>}
                  {n.is_cleared && <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Cleared</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{n.message}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(n.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => startEdit(n)}>
                {editId === n.id ? <><ChevronUp className="mr-1 h-3 w-3" />Close</> : <><Pencil className="mr-1 h-3 w-3" />Edit</>}
              </Button>
              <ClearButton item={n} onClear={() => clearMut.mutate({ id: n.id, clear: true })} onRestore={() => clearMut.mutate({ id: n.id, clear: false })} />
            </div>
            {editId === n.id && (
              <div className="mt-2 space-y-3 rounded-lg border bg-muted/30 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={editForm.title} onChange={(e) => setEditForm((f: any) => ({ ...f, title: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-xs">Type</Label><Input value={editForm.type} onChange={(e) => setEditForm((f: any) => ({ ...f, type: e.target.value }))} placeholder="info / success / warning / error" /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">Message</Label><Textarea value={editForm.message} onChange={(e) => setEditForm((f: any) => ({ ...f, message: e.target.value }))} rows={2} /></div>
                <div className="flex items-center gap-2">
                  <Switch checked={editForm.is_read} onCheckedChange={(v) => setEditForm((f: any) => ({ ...f, is_read: v }))} />
                  <Label className="text-xs">Mark as read</Label>
                </div>
                <Button className="w-full" size="sm" onClick={() => editMut.mutate({ id: n.id, data: editForm })} disabled={editMut.isPending}>
                  <Save className="mr-1 h-3 w-3" /> {editMut.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// ─── Aadhaar Verification Section ──────────────────────────────
const AadhaarSection = ({ profileId }: Props) => {
  const qc = useQueryClient();
  const [showCleared, setShowCleared] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["profile-aadhaar", profileId, showCleared],
    queryFn: async () => {
      let q = supabase.from("aadhaar_verifications").select("*").eq("profile_id", profileId).order("created_at", { ascending: false });
      if (!showCleared) q = q.eq("is_cleared", false);
      const { data } = await q;
      return (data || []) as EntityItem[];
    },
  });

  const clearMut = useMutation({
    mutationFn: async ({ id, clear }: { id: string; clear: boolean }) => {
      const { error } = await supabase.from("aadhaar_verifications").update({ is_cleared: clear }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["profile-aadhaar"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const editMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("aadhaar_verifications").update({
        status: data.status, rejection_reason: data.rejection_reason || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Aadhaar record updated"); setEditId(null); qc.invalidateQueries({ queryKey: ["profile-aadhaar"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (item: EntityItem) => {
    if (editId === item.id) { setEditId(null); return; }
    setEditForm({ status: item.status, rejection_reason: item.rejection_reason || "" });
    setEditId(item.id);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Fingerprint className="h-4 w-4" /> Aadhaar Verification ({items.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Switch checked={showCleared} onCheckedChange={setShowCleared} id="pa-cleared" />
            <Label htmlFor="pa-cleared" className="text-xs text-muted-foreground">Show cleared</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? <Skeleton className="h-16 w-full" /> : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No Aadhaar records</p>
        ) : items.map((a) => (
          <div key={a.id} className={`rounded-lg border p-3 space-y-2 ${a.is_cleared ? "opacity-50 border-dashed" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm text-foreground">{a.name_on_aadhaar}</p>
                <p className="text-xs text-muted-foreground">DOB: {a.dob_on_aadhaar} · {new Date(a.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline">{a.status}</Badge>
                {a.is_cleared && <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Cleared</Badge>}
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => startEdit(a)}>
                {editId === a.id ? <><ChevronUp className="mr-1 h-3 w-3" />Close</> : <><Pencil className="mr-1 h-3 w-3" />Edit</>}
              </Button>
              <ClearButton item={a} onClear={() => clearMut.mutate({ id: a.id, clear: true })} onRestore={() => clearMut.mutate({ id: a.id, clear: false })} />
            </div>
            {editId === a.id && (
              <div className="mt-2 space-y-3 rounded-lg border bg-muted/30 p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm((f: any) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["not_submitted","pending","under_process","verified","rejected"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Rejection Reason</Label><Input value={editForm.rejection_reason} onChange={(e) => setEditForm((f: any) => ({ ...f, rejection_reason: e.target.value }))} /></div>
                <Button className="w-full" size="sm" onClick={() => editMut.mutate({ id: a.id, data: editForm })} disabled={editMut.isPending}>
                  <Save className="mr-1 h-3 w-3" /> {editMut.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// ─── Bank Verification Section ─────────────────────────────────
const BankSection = ({ profileId }: Props) => {
  const qc = useQueryClient();
  const [showCleared, setShowCleared] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["profile-bank", profileId, showCleared],
    queryFn: async () => {
      let q = supabase.from("bank_verifications").select("*").eq("profile_id", profileId).order("created_at", { ascending: false });
      if (!showCleared) q = q.eq("is_cleared", false);
      const { data } = await q;
      return (data || []) as EntityItem[];
    },
  });

  const clearMut = useMutation({
    mutationFn: async ({ id, clear }: { id: string; clear: boolean }) => {
      const { error } = await supabase.from("bank_verifications").update({ is_cleared: clear }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["profile-bank"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const editMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("bank_verifications").update({
        status: data.status, rejection_reason: data.rejection_reason || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Bank record updated"); setEditId(null); qc.invalidateQueries({ queryKey: ["profile-bank"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (item: EntityItem) => {
    if (editId === item.id) { setEditId(null); return; }
    setEditForm({ status: item.status, rejection_reason: item.rejection_reason || "" });
    setEditId(item.id);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Landmark className="h-4 w-4" /> Bank Verification ({items.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Switch checked={showCleared} onCheckedChange={setShowCleared} id="pb-cleared" />
            <Label htmlFor="pb-cleared" className="text-xs text-muted-foreground">Show cleared</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? <Skeleton className="h-16 w-full" /> : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No bank verification records</p>
        ) : items.map((b) => (
          <div key={b.id} className={`rounded-lg border p-3 space-y-2 ${b.is_cleared ? "opacity-50 border-dashed" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm text-foreground">{b.document_name || "Bank Document"}</p>
                <p className="text-xs text-muted-foreground">Attempts: {b.attempt_count} · {new Date(b.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline">{b.status}</Badge>
                {b.is_cleared && <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Cleared</Badge>}
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => startEdit(b)}>
                {editId === b.id ? <><ChevronUp className="mr-1 h-3 w-3" />Close</> : <><Pencil className="mr-1 h-3 w-3" />Edit</>}
              </Button>
              <ClearButton item={b} onClear={() => clearMut.mutate({ id: b.id, clear: true })} onRestore={() => clearMut.mutate({ id: b.id, clear: false })} />
            </div>
            {editId === b.id && (
              <div className="mt-2 space-y-3 rounded-lg border bg-muted/30 p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm((f: any) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["pending","under_process","verified","rejected"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Rejection Reason</Label><Input value={editForm.rejection_reason} onChange={(e) => setEditForm((f: any) => ({ ...f, rejection_reason: e.target.value }))} /></div>
                <Button className="w-full" size="sm" onClick={() => editMut.mutate({ id: b.id, data: editForm })} disabled={editMut.isPending}>
                  <Save className="mr-1 h-3 w-3" /> {editMut.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// ─── Recovery Section ──────────────────────────────────────────
const RecoverySection = ({ profileId }: Props) => {
  const qc = useQueryClient();
  const [showCleared, setShowCleared] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["profile-recovery", profileId, showCleared],
    queryFn: async () => {
      let q = supabase.from("recovery_requests").select("*, project:projects(name)").eq("employee_id", profileId).order("created_at", { ascending: false });
      if (!showCleared) q = q.eq("is_cleared", false);
      const { data } = await q;
      return (data || []) as EntityItem[];
    },
  });

  const clearMut = useMutation({
    mutationFn: async ({ id, clear }: { id: string; clear: boolean }) => {
      const { error } = await supabase.from("recovery_requests").update({ is_cleared: clear }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["profile-recovery"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const editMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("recovery_requests").update({
        status: data.status, admin_notes: data.admin_notes || null, held_amount: Number(data.held_amount),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Recovery updated"); setEditId(null); qc.invalidateQueries({ queryKey: ["profile-recovery"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (item: EntityItem) => {
    if (editId === item.id) { setEditId(null); return; }
    setEditForm({ status: item.status, admin_notes: item.admin_notes || "", held_amount: item.held_amount });
    setEditId(item.id);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><LifeBuoy className="h-4 w-4" /> Recovery Requests ({items.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Switch checked={showCleared} onCheckedChange={setShowCleared} id="pr-cleared" />
            <Label htmlFor="pr-cleared" className="text-xs text-muted-foreground">Show cleared</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? <Skeleton className="h-16 w-full" /> : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No recovery requests</p>
        ) : items.map((r) => (
          <div key={r.id} className={`rounded-lg border p-3 space-y-2 ${r.is_cleared ? "opacity-50 border-dashed" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm text-foreground">{(r.project as any)?.name || "Unknown Project"}</p>
                <p className="text-xs text-muted-foreground">Held: ₹{Number(r.held_amount).toLocaleString("en-IN")} · {new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline">{r.status}</Badge>
                {r.is_cleared && <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Cleared</Badge>}
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => startEdit(r)}>
                {editId === r.id ? <><ChevronUp className="mr-1 h-3 w-3" />Close</> : <><Pencil className="mr-1 h-3 w-3" />Edit</>}
              </Button>
              <ClearButton item={r} onClear={() => clearMut.mutate({ id: r.id, clear: true })} onRestore={() => clearMut.mutate({ id: r.id, clear: false })} />
            </div>
            {editId === r.id && (
              <div className="mt-2 space-y-3 rounded-lg border bg-muted/30 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={editForm.status} onValueChange={(v) => setEditForm((f: any) => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["pending","in_progress","resolved","rejected"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Held Amount</Label><Input type="number" value={editForm.held_amount} onChange={(e) => setEditForm((f: any) => ({ ...f, held_amount: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">Admin Notes</Label><Textarea value={editForm.admin_notes} onChange={(e) => setEditForm((f: any) => ({ ...f, admin_notes: e.target.value }))} rows={2} /></div>
                <Button className="w-full" size="sm" onClick={() => editMut.mutate({ id: r.id, data: editForm })} disabled={editMut.isPending}>
                  <Save className="mr-1 h-3 w-3" /> {editMut.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// ─── Main Export ────────────────────────────────────────────────
const UserEntityManager = ({ profileId }: Props) => (
  <Tabs defaultValue="jobs" className="w-full">
    <TabsList className="flex-wrap h-auto gap-1">
      <TabsTrigger value="jobs"><Briefcase className="mr-1 h-3 w-3" />Jobs</TabsTrigger>
      <TabsTrigger value="transactions"><Receipt className="mr-1 h-3 w-3" />Transactions</TabsTrigger>
      <TabsTrigger value="withdrawals"><Wallet className="mr-1 h-3 w-3" />Withdrawals</TabsTrigger>
      <TabsTrigger value="notifications"><Bell className="mr-1 h-3 w-3" />Notifications</TabsTrigger>
      <TabsTrigger value="aadhaar"><Fingerprint className="mr-1 h-3 w-3" />Aadhaar</TabsTrigger>
      <TabsTrigger value="bank"><Landmark className="mr-1 h-3 w-3" />Bank</TabsTrigger>
      <TabsTrigger value="recovery"><LifeBuoy className="mr-1 h-3 w-3" />Recovery</TabsTrigger>
    </TabsList>
    <TabsContent value="jobs"><JobsSection profileId={profileId} /></TabsContent>
    <TabsContent value="transactions"><TransactionsSection profileId={profileId} /></TabsContent>
    <TabsContent value="withdrawals"><WithdrawalsSection profileId={profileId} /></TabsContent>
    <TabsContent value="notifications"><NotificationsSection profileId={profileId} /></TabsContent>
    <TabsContent value="aadhaar"><AadhaarSection profileId={profileId} /></TabsContent>
    <TabsContent value="bank"><BankSection profileId={profileId} /></TabsContent>
    <TabsContent value="recovery"><RecoverySection profileId={profileId} /></TabsContent>
  </Tabs>
);

export default UserEntityManager;
