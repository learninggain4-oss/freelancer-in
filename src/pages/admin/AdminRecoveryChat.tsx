import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle, XCircle, Loader2, IndianRupee, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MessageBubble from "@/components/chat/MessageBubble";

const AdminRecoveryChat = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room");
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch chat room
  const { data: chatRoom, isLoading: loadingRoom } = useQuery({
    queryKey: ["support-chat-room", roomId],
    queryFn: async () => {
      if (!roomId) return null;
      const { data, error } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("id", roomId)
        .eq("type", "support")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!roomId,
  });

  // Fetch recovery request with employee & project details
  const { data: recoveryRequest } = useQuery({
    queryKey: ["recovery-request-detail", chatRoom?.recovery_request_id],
    queryFn: async () => {
      if (!chatRoom?.recovery_request_id) return null;
      const { data, error } = await supabase
        .from("recovery_requests")
        .select(`
          *,
          employee:profiles!recovery_requests_employee_id_fkey(id, full_name, user_code, hold_balance, available_balance),
          project:projects!recovery_requests_project_id_fkey(id, name, amount, validation_fees, status)
        `)
        .eq("id", chatRoom.recovery_request_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!chatRoom?.recovery_request_id,
  });

  const {
    messages,
    isLoading: loadingMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
  } = useRealtimeMessages(chatRoom?.id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content) return;
    try {
      await sendMessage(content);
      setNewMessage("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleEditAmount = async () => {
    if (!recoveryRequest) return;
    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount) || newAmount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("recovery_requests")
        .update({ held_amount: newAmount })
        .eq("id", recoveryRequest.id);
      if (error) throw error;
      toast.success("Amount updated successfully");
      setEditingAmount(false);
      queryClient.invalidateQueries({ queryKey: ["recovery-request-detail"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!recoveryRequest) return;
    setActionLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(
        `https://maysttckdfnnzvfeujaj.supabase.co/functions/v1/wallet-operations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "admin_release_held_balance",
            project_id: recoveryRequest.project_id,
            admin_notes: adminNotes || "",
            recovery_request_id: recoveryRequest.id,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Operation failed");

      toast.success("Held balance released to employee's available balance.");
      queryClient.invalidateQueries({ queryKey: ["recovery-request-detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin-recovery-requests"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!recoveryRequest) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("recovery_requests")
        .update({
          status: "rejected",
          admin_notes: adminNotes || "Rejected by admin",
          resolved_at: new Date().toISOString(),
          resolved_by: profile?.id,
        })
        .eq("id", recoveryRequest.id);
      if (error) throw error;

      toast.success("Recovery request rejected.");
      queryClient.invalidateQueries({ queryKey: ["recovery-request-detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin-recovery-requests"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingRoom) {
    return (
      <div className="flex h-full flex-col p-4">
        <Skeleton className="mb-4 h-10 w-full" />
        <Skeleton className="flex-1" />
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
        <p className="text-sm text-muted-foreground">Support chat room not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/recovery-requests")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Recovery Requests
        </Button>
      </div>
    );
  }

  const employeeName = recoveryRequest?.employee?.full_name?.[0] || "Unknown Employee";
  const employeeCode = recoveryRequest?.employee?.user_code?.[0] || "";
  const heldAmount = Number(recoveryRequest?.held_amount || 0);
  const requestStatus = recoveryRequest?.status || "pending";

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/recovery-requests")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-foreground">
            Help - Amount Recovery
          </h2>
          <p className="text-xs text-muted-foreground">
            {employeeName} ({employeeCode})
          </p>
        </div>
        <Badge
          variant={requestStatus === "pending" ? "outline" : requestStatus === "resolved" ? "default" : "destructive"}
          className={requestStatus === "pending" ? "border-warning text-warning" : requestStatus === "resolved" ? "bg-accent text-accent-foreground" : ""}
        >
          {requestStatus}
        </Badge>
      </div>

      {/* Recovery Details & Controls */}
      {recoveryRequest && (
        <div className="space-y-2 border-b bg-muted/50 px-4 py-3">
          {/* Amount display with edit */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Held Amount:</span>
              {editingAmount ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="h-7 w-28 text-sm"
                  />
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleEditAmount} disabled={actionLoading}>
                    <CheckCircle className="h-3.5 w-3.5 text-accent" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingAmount(false)}>
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-destructive">₹{heldAmount.toLocaleString("en-IN")}</span>
                  {requestStatus === "pending" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => { setEditAmount(String(heldAmount)); setEditingAmount(true); }}
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Project: {recoveryRequest.project?.name || "Unknown"} • Employee Hold Balance: ₹{Number(recoveryRequest.employee?.hold_balance || 0).toLocaleString("en-IN")}
          </div>

          {/* Admin actions */}
          {requestStatus === "pending" && (
            <div className="space-y-2">
              <Textarea
                placeholder="Admin notes (optional)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" disabled={actionLoading} className="gap-1">
                      {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      Release Balance
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Release ₹{heldAmount.toLocaleString("en-IN")} to {employeeName}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will transfer the held amount to the employee's available balance. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRelease}>Confirm Release</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" disabled={actionLoading} className="gap-1 border-destructive/30 text-destructive hover:bg-destructive/10">
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Recovery Request?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The held balance will remain on hold for {employeeName}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleReject}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Confirm Rejection
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

          {requestStatus !== "pending" && recoveryRequest.admin_notes && (
            <div className="rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
              <span className="font-medium">Admin Notes:</span> {recoveryRequest.admin_notes}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-2">
        {loadingMessages ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-3/4" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation with {employeeName}.
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                currentUserId={profile?.id || ""}
                onEdit={editMessage}
                onDelete={deleteMessage}
                onReaction={toggleReaction}
                onReply={() => {}}
                senderDisplayName={msg.sender_id === profile?.id ? "Customer Service" : employeeName}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="flex items-center gap-2 border-t px-4 py-3">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend} disabled={!newMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AdminRecoveryChat;
