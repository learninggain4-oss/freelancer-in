import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, Loader2, ArrowUpCircle, CheckCircle, XCircle, MessageSquare, Send, ArrowLeft } from "lucide-react";
import { useUpgradeChat } from "@/hooks/use-upgrade-chat";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const AdminWalletUpgrades = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [rejectDialog, setRejectDialog] = useState<{ id: string; open: boolean }>({ id: "", open: false });
  const [rejectNotes, setRejectNotes] = useState("");
  const [chatRequestId, setChatRequestId] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-wallet-upgrades", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("wallet_upgrade_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const profileIds = [...new Set((data || []).map((r: any) => r.profile_id))];
      if (profileIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, user_code, email")
        .in("id", profileIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      return (data || []).map((r: any) => ({
        ...r,
        profile: profileMap.get(r.profile_id),
      }));
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const req = requests.find((r: any) => r.id === requestId);
      if (!req) throw new Error("Request not found");

      const { data: walletType } = await supabase
        .from("wallet_types")
        .select("id")
        .eq("name", req.requested_wallet_type)
        .single();

      if (walletType) {
        await supabase
          .from("profiles")
          .update({ wallet_type_id: walletType.id })
          .eq("id", req.profile_id);
      }

      const { error } = await supabase
        .from("wallet_upgrade_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          admin_notes: "Approved",
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Upgrade approved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-upgrades"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("wallet_upgrade_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          admin_notes: notes || "Rejected",
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Upgrade rejected");
      setRejectDialog({ id: "", open: false });
      setRejectNotes("");
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-upgrades"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const pendingCount = requests.filter((r: any) => r.status === "pending").length;

  const filtered = requests.filter((r: any) => {
    if (!search) return true;
    const name = r.profile?.full_name?.join(" ") || "";
    const code = r.profile?.user_code?.join("") || "";
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || code.toLowerCase().includes(q);
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // If chat is open, show chat panel
  if (chatRequestId) {
    const chatReq = requests.find((r: any) => r.id === chatRequestId);
    return (
      <AdminUpgradeChatPanel
        requestId={chatRequestId}
        request={chatReq}
        onBack={() => setChatRequestId(null)}
        profileId={profile?.id || ""}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallet Upgrades</h1>
          <p className="text-sm text-muted-foreground">Manage wallet tier upgrade requests</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-yellow-500 text-white text-sm px-3 py-1">
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? "default" : "outline"}
                  onClick={() => setStatusFilter(s)}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <ArrowUpCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No upgrade requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Current Tier</TableHead>
                    <TableHead>Requested Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((req: any) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{req.profile?.full_name?.join(" ") || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{req.profile?.user_code?.join("") || ""}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{req.current_wallet_type}</TableCell>
                      <TableCell className="text-sm font-medium">{req.requested_wallet_type}</TableCell>
                      <TableCell>{statusBadge(req.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(req.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{req.admin_notes || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1.5 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => setChatRequestId(req.id)}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Chat
                          </Button>
                          {req.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => approveMutation.mutate(req.id)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => setRejectDialog({ id: req.id, open: true })}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(o) => setRejectDialog({ ...rejectDialog, open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Upgrade Request</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (optional)..."
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ id: "", open: false })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate({ id: rejectDialog.id, notes: rejectNotes })}
              disabled={rejectMutation.isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/** Admin chat panel for a specific upgrade request */
const AdminUpgradeChatPanel = ({
  requestId,
  request,
  onBack,
  profileId,
}: {
  requestId: string;
  request: any;
  onBack: () => void;
  profileId: string;
}) => {
  const { messages, isLoading, sendMessage } = useUpgradeChat(requestId);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [newMessage]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content) return;
    try {
      await sendMessage(content);
      setNewMessage("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const userName = request?.profile?.full_name?.join(" ") || "User";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-background rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-foreground">{userName}</h2>
          <span className="text-[11px] text-muted-foreground">
            {request?.current_wallet_type} → {request?.requested_wallet_type}
          </span>
        </div>
        {request?.status && (
          <Badge variant="outline" className="capitalize">{request.status}</Badge>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No messages yet. Start the conversation.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => {
                const isMine = msg.sender_id === profileId;
                const isBotMsg = msg.content.startsWith("[BOT] ");
                const isSystemMsg = msg.content.startsWith("[SYSTEM] ");
                const displayContent = isBotMsg
                  ? msg.content.slice(6)
                  : isSystemMsg
                    ? msg.content.slice(9)
                    : msg.content;

                if (isSystemMsg) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="rounded-full bg-muted px-4 py-1.5">
                        <p className="text-[11px] text-muted-foreground text-center">{displayContent}</p>
                      </div>
                    </div>
                  );
                }

                const senderLabel = isBotMsg ? "🤖 FlexPay Bot" : isMine ? "" : userName;

                return (
                  <div key={msg.id} className={cn("flex", isMine && !isBotMsg ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                        isMine && !isBotMsg
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : isBotMsg
                            ? "bg-accent/10 text-foreground rounded-bl-md border border-accent/20"
                            : "bg-muted text-foreground rounded-bl-md"
                      )}
                    >
                      {senderLabel && (
                        <p className="text-[10px] font-semibold text-primary mb-1">{senderLabel}</p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{displayContent}</p>
                      <p className={cn("text-[10px] mt-1", isMine && !isBotMsg ? "text-primary-foreground/60" : "text-muted-foreground")}>
                        {format(new Date(msg.created_at), "hh:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-background">
        <div className="flex items-end gap-2 px-4 py-3">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={2}
              className="min-h-[56px] max-h-[160px] resize-none rounded-xl border-border/60 bg-muted/30 text-sm"
            />
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="h-11 w-11 rounded-xl shrink-0"
          >
            <Send className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminWalletUpgrades;
