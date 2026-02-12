import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye } from "lucide-react";

type Profile = {
  id: string;
  full_name: string[];
  user_code: string[];
  email: string;
  user_type: string;
  approval_status: string;
  mobile_number: string | null;
  whatsapp_number: string | null;
  created_at: string;
};

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "view" | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, user_code, email, user_type, approval_status, mobile_number, whatsapp_number, created_at")
      .order("created_at", { ascending: false });
    setProfiles((data as Profile[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleAction = async () => {
    if (!selectedUser || !actionType || actionType === "view") return;
    setProcessing(true);
    const status = actionType === "approve" ? "approved" : "rejected";
    const { error } = await supabase
      .from("profiles")
      .update({
        approval_status: status as any,
        approval_notes: notes || null,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", selectedUser.id);

    if (error) {
      toast.error("Failed to update user status");
    } else {
      toast.success(`User ${status} successfully`);
      fetchProfiles();
    }
    setProcessing(false);
    setSelectedUser(null);
    setActionType(null);
    setNotes("");
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-warning/15 text-warning border-warning/30",
      approved: "bg-accent/15 text-accent border-accent/30",
      rejected: "bg-destructive/15 text-destructive border-destructive/30",
    };
    return (
      <Badge variant="outline" className={map[status] || ""}>
        {status}
      </Badge>
    );
  };

  const filterByStatus = (status: string | null) =>
    status ? profiles.filter((p) => p.approval_status === status) : profiles;

  const UserTable = ({ users }: { users: Profile[] }) => (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name?.[0] || "—"}</TableCell>
                <TableCell className="font-mono text-xs">{u.user_code?.[0] || "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {u.user_type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-sm">{u.email}</TableCell>
                <TableCell>{statusBadge(u.approval_status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => { setSelectedUser(u); setActionType("view"); }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {u.approval_status === "pending" && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-accent hover:text-accent"
                          onClick={() => { setSelectedUser(u); setActionType("approve"); }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setSelectedUser(u); setActionType("reject"); }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">User Management</h2>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({filterByStatus("pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <UserTable users={filterByStatus("pending")} />
        </TabsContent>
        <TabsContent value="approved">
          <UserTable users={filterByStatus("approved")} />
        </TabsContent>
        <TabsContent value="rejected">
          <UserTable users={filterByStatus("rejected")} />
        </TabsContent>
        <TabsContent value="all">
          <UserTable users={filterByStatus(null)} />
        </TabsContent>
      </Tabs>

      {/* View / Approve / Reject Dialog */}
      <Dialog
        open={!!selectedUser && !!actionType}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null);
            setActionType(null);
            setNotes("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "view"
                ? "User Details"
                : actionType === "approve"
                ? "Approve User"
                : "Reject User"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name?.[0]} • {selectedUser?.user_code?.[0]}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedUser.user_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mobile</p>
                  <p className="font-medium">{selectedUser.mobile_number || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">WhatsApp</p>
                  <p className="font-medium">{selectedUser.whatsapp_number || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {statusBadge(selectedUser.approval_status)}
                </div>
                <div>
                  <p className="text-muted-foreground">Registered</p>
                  <p className="font-medium">
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {actionType !== "view" && (
                <div>
                  <p className="mb-1 text-muted-foreground">Notes (optional)</p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this decision..."
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {actionType === "view" ? (
              <Button variant="outline" onClick={() => { setSelectedUser(null); setActionType(null); }}>
                Close
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setSelectedUser(null); setActionType(null); setNotes(""); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAction}
                  disabled={processing}
                  variant={actionType === "approve" ? "default" : "destructive"}
                >
                  {processing ? "Processing..." : actionType === "approve" ? "Approve" : "Reject"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
