import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle, XCircle, Loader2, IndianRupee, Pencil, Lock, MessageCircle, Eye } from "lucide-react";
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
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const AdminRecoveryChat = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { theme } = useDashboardTheme();
  const T = TH[theme];
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-operations`,
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

      toast.success(`₹${json.released_amount?.toLocaleString("en-IN") || ""} released to employee's available balance.`);
      queryClient.invalidateQueries({ queryKey: ["recovery-request-detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin-recovery-requests"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleHold = async () => {
    if (!recoveryRequest) return;
    const holdAmt = parseFloat(editAmount || String(heldAmount));
    if (isNaN(holdAmt) || holdAmt <= 0) {
      toast.error("Please enter a valid amount to hold");
      return;
    }
    setActionLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-operations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "admin_hold_balance",
            amount: holdAmt,
            admin_notes: adminNotes || "",
            recovery_request_id: recoveryRequest.id,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Operation failed");

      toast.success(`₹${json.held_amount?.toLocaleString("en-IN") || ""} moved to employee's hold balance.`);
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
    <div className="flex flex-col h-[calc(100vh-8rem)] -mt-2">
      {/* Header */}
      <div 
        className="flex items-center gap-3 p-4 border-b transition-all"
        style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)", borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}
      >
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/recovery-requests")} style={{ color: T.text }}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-sm font-semibold" style={{ color: T.text }}>
            Help - Amount Recovery
          </h2>
          <p className="text-xs" style={{ color: T.sub }}>
            {employeeName} ({employeeCode})
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-none"
          style={{ 
            background: requestStatus === "pending" ? "rgba(245, 158, 11, 0.1)" : requestStatus === "resolved" ? "rgba(34, 197, 94, 0.1)" : "rgba(248, 113, 113, 0.1)",
            color: requestStatus === "pending" ? "#fbbf24" : requestStatus === "resolved" ? "#22c55e" : "#f87171"
          }}
        >
          {requestStatus}
        </Badge>
      </div>

      {/* Recovery Details & Controls */}
      {recoveryRequest && (
        <div className="space-y-4 p-4 border-b transition-all" style={{ background: T.card, borderColor: T.border }}>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg" style={{ background: "rgba(248, 113, 113, 0.1)", color: "#f87171" }}>
                <IndianRupee className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.sub }}>Held Amount</p>
                {editingAmount ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="h-7 w-24 text-xs border-none"
                      style={{ background: T.input, color: T.text }}
                    />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleEditAmount} disabled={actionLoading}>
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingAmount(false)}>
                      <XCircle className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold" style={{ color: T.text }}>₹{heldAmount.toLocaleString("en-IN")}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 rounded-full"
                      style={{ background: T.input }}
                      onClick={() => { setEditAmount(String(heldAmount)); setEditingAmount(true); }}
                    >
                      <Pencil className="h-3 w-3" style={{ color: T.sub }} />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.sub }}>Project</p>
              <p className="text-sm font-semibold" style={{ color: T.text }}>{recoveryRequest.project?.name || "Unknown"}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.sub }}>Hold Balance</p>
              <p className="text-sm font-semibold" style={{ color: T.text }}>₹{Number(recoveryRequest.employee?.hold_balance || 0).toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.sub }}>Decision Notes</Label>
              <Textarea
                placeholder="Admin notes for the employee..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="text-sm rounded-2xl border-none min-h-[80px]"
                style={{ background: T.input, color: T.text }}
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" disabled={actionLoading} className="rounded-xl px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
                    {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Release Balance
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent style={{ background: T.card, borderColor: T.border, color: T.text }}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Release ₹{heldAmount.toLocaleString("en-IN")} to {employeeName}?</AlertDialogTitle>
                    <AlertDialogDescription style={{ color: T.sub }}>
                      This will transfer the held amount to the employee's available balance.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl" style={{ background: T.input, borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRelease} className="rounded-xl bg-emerald-600 text-white">Confirm Release</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" disabled={actionLoading} className="rounded-xl px-4 border" style={{ borderColor: "rgba(245, 158, 11, 0.3)", color: "#fbbf24", background: "rgba(245, 158, 11, 0.05)" }}>
                    <Lock className="mr-2 h-4 w-4" />
                    Hold Balance
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent style={{ background: T.card, borderColor: T.border, color: T.text }}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hold balance for {employeeName}?</AlertDialogTitle>
                    <AlertDialogDescription style={{ color: T.sub }}>
                      This will move ₹{heldAmount.toLocaleString("en-IN")} from the employee's available balance back to hold.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl" style={{ background: T.input, borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleHold} className="rounded-xl bg-amber-600 text-white">Confirm Hold</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" disabled={actionLoading} className="rounded-xl px-4 border" style={{ borderColor: "rgba(248, 113, 113, 0.3)", color: "#f87171", background: "rgba(248, 113, 113, 0.05)" }}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Close Request
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent style={{ background: T.card, borderColor: T.border, color: T.text }}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Close Recovery Request?</AlertDialogTitle>
                    <AlertDialogDescription style={{ color: T.sub }}>
                      This will close the request and the chat. The current balances will remain unchanged.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl" style={{ background: T.input, borderColor: T.border, color: T.text }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReject} className="rounded-xl bg-destructive text-white">Confirm Close</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {recoveryRequest.admin_notes && (
            <div className="rounded-2xl p-3 text-xs italic" style={{ background: T.input, color: T.sub }}>
              <span className="font-bold uppercase tracking-widest text-[10px] block mb-1">Previous Notes:</span>
              {recoveryRequest.admin_notes}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" style={{ background: theme === "black" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)" }}>
        {loadingMessages ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-3/4 rounded-2xl" style={{ background: T.border }} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <MessageCircle className="h-12 w-12 mb-4 opacity-20" style={{ color: T.text }} />
            <p className="text-sm" style={{ color: T.sub }}>
              No messages yet. Start the conversation with {employeeName}.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
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

      {/* Input area */}
      <div 
        className="p-4 border-t transition-all" 
        style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}
      >
        <div className="flex items-center gap-3">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 h-11 px-4 rounded-xl border-none"
            style={{ background: T.input, color: T.text }}
          />
          <Button 
            size="icon" 
            className="h-11 w-11 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
            onClick={handleSend} 
            disabled={!newMessage.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminRecoveryChat;
