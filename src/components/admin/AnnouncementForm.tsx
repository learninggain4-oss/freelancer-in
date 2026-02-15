import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Megaphone, Loader2, Clock, CalendarClock, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AnnouncementFormProps {
  editingAnnouncement?: any;
  onClose: () => void;
}

const AnnouncementForm = ({ editingAnnouncement, onClose }: AnnouncementFormProps) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("everyone");
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const [userSearch, setUserSearch] = useState("");

  const isEditing = !!editingAnnouncement;

  // Pre-fill form when editing
  useEffect(() => {
    if (editingAnnouncement) {
      setTitle(editingAnnouncement.title ?? "");
      setMessage(editingAnnouncement.message ?? "");
      setTarget(editingAnnouncement.target_audience ?? "everyone");
      setScheduledAt(editingAnnouncement.scheduled_at ? new Date(editingAnnouncement.scheduled_at) : undefined);
      setExpiresAt(editingAnnouncement.expires_at ? new Date(editingAnnouncement.expires_at) : undefined);
      if (editingAnnouncement.target_user_ids && editingAnnouncement.target_user_ids.length > 0) {
        setSelectedUserIds(editingAnnouncement.target_user_ids);
        setSelectAll(false);
      } else {
        setSelectedUserIds([]);
        setSelectAll(true);
      }
    }
  }, [editingAnnouncement]);

  const userType = target === "employees" ? "employee" : target === "clients" ? "client" : null;

  const { data: users = [] } = useQuery({
    queryKey: ["announcement-users", userType],
    queryFn: async () => {
      if (!userType) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, user_code, user_id")
        .eq("user_type", userType)
        .eq("approval_status", "approved")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userType,
  });

  const filteredUsers = users.filter((u: any) => {
    if (!userSearch) return true;
    const search = userSearch.toLowerCase();
    const name = (u.full_name as string[])?.join(" ")?.toLowerCase() ?? "";
    const code = (u.user_code as string[])?.join("")?.toLowerCase() ?? "";
    return name.includes(search) || code.includes(search);
  });

  const handleTargetChange = (val: string) => {
    setTarget(val);
    setSelectedUserIds([]);
    setSelectAll(true);
    setUserSearch("");
  };

  const toggleUser = (userId: string) => {
    setSelectAll(false);
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) setSelectedUserIds([]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const targetIds = !selectAll && selectedUserIds.length > 0 ? selectedUserIds : null;
      const payload = {
        title: title.trim(),
        message: message.trim(),
        target_audience: target,
        scheduled_at: scheduledAt ? scheduledAt.toISOString() : null,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        target_user_ids: targetIds,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("announcements")
          .update(payload as any)
          .eq("id", editingAnnouncement.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("announcements")
          .insert({ ...payload, created_by: profile?.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Announcement updated" : "Announcement created",
        description: isEditing
          ? "Changes have been saved successfully."
          : "Users will see this popup on their next visit.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      onClose();
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEditing ? "Edit Announcement" : "Create Announcement"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            placeholder="Announcement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            placeholder="Write your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label>Target Audience</Label>
          <Select value={target} onValueChange={handleTargetChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">Everyone</SelectItem>
              <SelectItem value="employees">Employees Only</SelectItem>
              <SelectItem value="clients">Clients Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {userType && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Select {target === "employees" ? "Employees" : "Clients"}
            </Label>
            <div className="flex items-center gap-2 pb-1">
              <Checkbox
                id="select-all-users-form"
                checked={selectAll}
                onCheckedChange={(checked) => handleSelectAll(checked === true)}
              />
              <label htmlFor="select-all-users-form" className="text-sm font-medium cursor-pointer">
                All {target === "employees" ? "Employees" : "Clients"}
              </label>
            </div>
            {!selectAll && (
              <>
                <Input
                  placeholder={`Search ${target === "employees" ? "employees" : "clients"}...`}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="mb-2"
                />
                <ScrollArea className="h-48 rounded-md border p-2">
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                  ) : (
                    <div className="space-y-1">
                      {filteredUsers.map((u: any) => (
                        <div key={u.id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50">
                          <Checkbox
                            id={`user-form-${u.id}`}
                            checked={selectedUserIds.includes(u.user_id)}
                            onCheckedChange={() => toggleUser(u.user_id)}
                          />
                          <label htmlFor={`user-form-${u.id}`} className="flex-1 text-sm cursor-pointer">
                            <span className="font-medium">{(u.full_name as string[])?.join(" ")}</span>
                            <span className="ml-2 text-muted-foreground">{(u.user_code as string[])?.[0]}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {selectedUserIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">{selectedUserIds.length} user(s) selected</p>
                )}
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Schedule For (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarClock className="mr-2 h-4 w-4" />
                  {scheduledAt ? format(scheduledAt, "PPP p") : "Immediately"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={scheduledAt} onSelect={(day) => {
                  if (!day) { setScheduledAt(undefined); return; }
                  const prev = scheduledAt;
                  if (prev) { day.setHours(prev.getHours(), prev.getMinutes()); }
                  setScheduledAt(day);
                }} disabled={(date) => date < new Date(new Date().toDateString())} className="p-3 pointer-events-auto" />
                {scheduledAt && (
                  <div className="flex items-center gap-2 px-3 pb-3">
                    <Input type="time" className="flex-1" value={format(scheduledAt, "HH:mm")} onChange={(e) => {
                      const [h, m] = e.target.value.split(":").map(Number);
                      const d = new Date(scheduledAt);
                      d.setHours(h, m);
                      setScheduledAt(d);
                    }} />
                    <Button variant="ghost" size="sm" onClick={() => setScheduledAt(undefined)}>Clear</Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Expires On (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Clock className="mr-2 h-4 w-4" />
                  {expiresAt ? format(expiresAt, "PPP p") : "Never"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={expiresAt} onSelect={(day) => {
                  if (!day) { setExpiresAt(undefined); return; }
                  const prev = expiresAt;
                  if (prev) { day.setHours(prev.getHours(), prev.getMinutes()); }
                  else { day.setHours(23, 59); }
                  setExpiresAt(day);
                }} disabled={(date) => date < new Date(new Date().toDateString())} className="p-3 pointer-events-auto" />
                {expiresAt && (
                  <div className="flex items-center gap-2 px-3 pb-3">
                    <Input type="time" className="flex-1" value={format(expiresAt, "HH:mm")} onChange={(e) => {
                      const [h, m] = e.target.value.split(":").map(Number);
                      const d = new Date(expiresAt);
                      d.setHours(h, m);
                      setExpiresAt(d);
                    }} />
                    <Button variant="ghost" size="sm" onClick={() => setExpiresAt(undefined)}>Clear</Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!title.trim() || !message.trim() || saveMutation.isPending || (!selectAll && selectedUserIds.length === 0 && userType !== null)}
            className="gap-2"
          >
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Megaphone className="h-4 w-4" />
            {isEditing
              ? "Save Changes"
              : scheduledAt
                ? "Schedule Announcement"
                : "Publish Announcement"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnouncementForm;
