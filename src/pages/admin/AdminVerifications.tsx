import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, CheckCircle2, XCircle, Clock, Search, Eye, User } from "lucide-react";
import { toast } from "sonner";

type Verification = {
  id: string;
  profile_id: string;
  aadhaar_number: string;
  name_on_aadhaar: string;
  dob_on_aadhaar: string;
  address_on_aadhaar: string;
  front_image_path: string;
  back_image_path: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  verified_at: string | null;
  profiles: {
    full_name: string[];
    user_code: string[];
    email: string;
    user_type: string;
    date_of_birth: string | null;
    mobile_number: string | null;
  };
};

const AdminVerifications = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pending");
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [backUrl, setBackUrl] = useState<string | null>(null);

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ["admin-verifications"],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aadhaar_verifications")
        .select("id, profile_id, aadhaar_number, name_on_aadhaar, dob_on_aadhaar, address_on_aadhaar, front_image_path, back_image_path, status, rejection_reason, created_at, verified_at, profiles!aadhaar_verifications_profile_id_fkey(full_name, user_code, email, user_type, date_of_birth, mobile_number)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Verification[];
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, status, reason, profileId, nameOnAadhaar }: { id: string; status: string; reason?: string; profileId: string; nameOnAadhaar: string }) => {
      const update: Record<string, unknown> = {
        status,
        verified_by: profile!.id,
        verified_at: new Date().toISOString(),
      };
      if (reason) update.rejection_reason = reason;
      const { error } = await supabase.from("aadhaar_verifications").update(update).eq("id", id);
      if (error) throw error;

      // Update profile name to verified Aadhaar name on approval
      if (status === "verified") {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: [nameOnAadhaar] })
          .eq("id", profileId);
        if (profileError) throw profileError;
      }
    },
    onSuccess: (_, vars) => {
      toast.success(`Verification ${vars.status}${vars.status === "verified" ? " — profile name updated" : ""}`);
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setSelectedVerification(null);
      setRejectReason("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openDetail = async (v: Verification) => {
    setSelectedVerification(v);
    setRejectReason("");
    // Get signed URLs for images
    const { data: fData } = await supabase.storage.from("aadhaar-documents").createSignedUrl(v.front_image_path, 300);
    const { data: bData } = await supabase.storage.from("aadhaar-documents").createSignedUrl(v.back_image_path, 300);
    setFrontUrl(fData?.signedUrl ?? null);
    setBackUrl(bData?.signedUrl ?? null);
  };

  const filtered = verifications.filter((v) => {
    const statusMatch = tab === "all" || v.status === tab;
    if (!statusMatch) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      v.name_on_aadhaar.toLowerCase().includes(s) ||
      v.aadhaar_number.includes(s) ||
      v.profiles?.full_name?.[0]?.toLowerCase().includes(s) ||
      v.profiles?.user_code?.[0]?.toLowerCase().includes(s) ||
      v.profiles?.email?.toLowerCase().includes(s)
    );
  });

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      under_process: { variant: "outline", label: "Under Process" },
      verified: { variant: "default", label: "Verified" },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const cfg = map[status] ?? map.pending;
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Aadhaar Verifications</h1>
        <p className="text-sm text-muted-foreground">Review and manage identity verification submissions</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, Aadhaar, email, or code..." className="pl-9"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="under_process">Processing</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
          ) : filtered.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No verifications found</CardContent></Card>
          ) : (
            filtered.map((v) => (
              <Card key={v.id} className="cursor-pointer transition-colors hover:bg-muted/30" onClick={() => openDetail(v)}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{v.profiles?.full_name?.[0] ?? "—"}</span>
                      <Badge variant="outline" className="text-[10px]">{v.profiles?.user_type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {v.profiles?.user_code?.[0]} • Aadhaar name: {v.name_on_aadhaar}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(v.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(v.status)}
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedVerification} onOpenChange={(open) => { if (!open) { setSelectedVerification(null); setFrontUrl(null); setBackUrl(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Verification Details
            </DialogTitle>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-4">
              {/* Profile info */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Profile Information</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> {selectedVerification.profiles?.full_name?.[0]}</p>
                  <p><span className="text-muted-foreground">Code:</span> {selectedVerification.profiles?.user_code?.[0]}</p>
                  <p><span className="text-muted-foreground">Type:</span> {selectedVerification.profiles?.user_type}</p>
                  <p><span className="text-muted-foreground">Email:</span> {selectedVerification.profiles?.email}</p>
                  <p><span className="text-muted-foreground">Mobile:</span> {selectedVerification.profiles?.mobile_number ?? "—"}</p>
                  <p><span className="text-muted-foreground">Profile DOB:</span> {selectedVerification.profiles?.date_of_birth ?? "—"}</p>
                </CardContent>
              </Card>

              {/* Aadhaar info */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Aadhaar Details</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Aadhaar Number:</span> {selectedVerification.aadhaar_number}</p>
                  <p><span className="text-muted-foreground">Name on Aadhaar:</span> {selectedVerification.name_on_aadhaar}</p>
                  <p><span className="text-muted-foreground">DOB on Aadhaar:</span> {selectedVerification.dob_on_aadhaar}</p>
                  <p><span className="text-muted-foreground">Address:</span> {selectedVerification.address_on_aadhaar}</p>
                  {/* Name match indicator */}
                  {selectedVerification.profiles?.full_name?.[0] && (
                    <div className="mt-2 flex items-center gap-2">
                      {selectedVerification.name_on_aadhaar.toLowerCase().trim() === selectedVerification.profiles.full_name[0].toLowerCase().trim()
                        ? <><CheckCircle2 className="h-4 w-4 text-accent" /><span className="text-accent text-xs font-medium">Name matches profile</span></>
                        : <><XCircle className="h-4 w-4 text-warning" /><span className="text-warning text-xs font-medium">Name does not match profile ({selectedVerification.profiles.full_name[0]})</span></>
                      }
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Aadhaar Card Images</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Front Side</p>
                    {frontUrl ? <img src={frontUrl} alt="Aadhaar front" className="w-full rounded-md border" /> : <Skeleton className="h-40 w-full" />}
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Back Side</p>
                    {backUrl ? <img src={backUrl} alt="Aadhaar back" className="w-full rounded-md border" /> : <Skeleton className="h-40 w-full" />}
                  </div>
                </CardContent>
              </Card>

              {/* Status & Actions */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                {statusBadge(selectedVerification.status)}
              </div>

              {(selectedVerification.status === "pending" || selectedVerification.status === "under_process") && (
                <div className="space-y-3 rounded-lg border p-3">
                  <Textarea placeholder="Rejection reason (required only for rejection)" value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)} className="min-h-[60px]" />
                  <div className="flex flex-wrap gap-2">
                    {selectedVerification.status === "pending" && (
                      <Button variant="secondary" className="flex-1" disabled={actionMutation.isPending}
                        onClick={() => actionMutation.mutate({ id: selectedVerification.id, status: "under_process", profileId: selectedVerification.profile_id, nameOnAadhaar: selectedVerification.name_on_aadhaar })}>
                        <Clock className="mr-1 h-3 w-3" /> Under Process
                      </Button>
                    )}
                    <Button className="flex-1" disabled={actionMutation.isPending}
                      onClick={() => actionMutation.mutate({ id: selectedVerification.id, status: "verified", profileId: selectedVerification.profile_id, nameOnAadhaar: selectedVerification.name_on_aadhaar })}>
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Verify
                    </Button>
                    <Button variant="outline" className="flex-1 text-destructive" disabled={actionMutation.isPending || !rejectReason.trim()}
                      onClick={() => actionMutation.mutate({ id: selectedVerification.id, status: "rejected", reason: rejectReason, profileId: selectedVerification.profile_id, nameOnAadhaar: selectedVerification.name_on_aadhaar })}>
                      <XCircle className="mr-1 h-3 w-3" /> Reject
                    </Button>
                  </div>
                </div>
              )}

              {selectedVerification.rejection_reason && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-medium">Rejection Reason:</p>
                  <p className="text-xs">{selectedVerification.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerifications;
