import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Search, Users, CheckCircle, Clock, UserCheck, Timer, Camera, Download, Eye, Calendar } from "lucide-react";
import { formatDuration } from "@/utils/attendance-helpers";
import { toast } from "sonner";
import { useAdminTheme } from "@/hooks/use-dashboard-theme";
import { safeFmt, safeDist } from "@/lib/admin-date";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const AdminAttendance = () => {
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [photoDialog, setPhotoDialog] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: "",
    title: "",
  });

  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ["admin-attendance", dateFilter],
    queryFn: async () => {
      let query = supabase
        .from("attendance")
        .select(`
          *,
          profile:profiles!attendance_profile_id_fkey (
            id,
            full_name,
            user_code,
            email,
            user_type
          )
        `)
        .order("check_in_at", { ascending: false });

      if (dateFilter) {
        query = query.eq("date", dateFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const getSignedUrl = async (path: string): Promise<string | null> => {
    if (!path) return null;
    const { data, error } = await supabase.storage
      .from("attendance-photos")
      .createSignedUrl(path, 3600); // 1 hour expiry
    if (error) {
      console.error("Error getting signed URL:", error);
      return null;
    }
    return data.signedUrl;
  };

  const handleViewPhoto = async (path: string | null, title: string) => {
    if (!path) {
      toast.error("No photo available");
      return;
    }
    const url = await getSignedUrl(path);
    if (url) {
      setPhotoDialog({ open: true, url, title });
    } else {
      toast.error("Failed to load photo");
    }
  };

  const handleDownloadPhoto = async (path: string | null, fileName: string) => {
    if (!path) {
      toast.error("No photo available");
      return;
    }
    const url = await getSignedUrl(path);
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    } else {
      toast.error("Failed to download photo");
    }
  };

  const filteredRecords = attendanceRecords.filter((record) => {
    const profile = record.profile;
    if (!profile) return false;

    const searchLower = search.toLowerCase();
    const nameMatch = profile.full_name?.some((n: string) =>
      n.toLowerCase().includes(searchLower)
    );
    const codeMatch = profile.user_code?.some((c: string) =>
      c.toLowerCase().includes(searchLower)
    );
    const emailMatch = profile.email?.toLowerCase().includes(searchLower);

    const matchesSearch = !search || nameMatch || codeMatch || emailMatch;
    const matchesUserType =
      userTypeFilter === "all" || profile.user_type === userTypeFilter;

    return matchesSearch && matchesUserType;
  });

  const stats = {
    total: filteredRecords.length,
    completed: filteredRecords.filter((r) => r.check_out_at).length,
    inProgress: filteredRecords.filter((r) => !r.check_out_at).length,
    uniqueUsers: new Set(filteredRecords.map((r) => r.profile_id)).size,
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8 border"
        style={{ 
          background: theme === 'black' 
            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
            : 'linear-gradient(135deg, #6366f1 0%, #a5b4fc 100%)',
          borderColor: T.border 
        }}
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5 blur-xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl">
            <Calendar className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Attendance Checker</h1>
            <p className="text-white/80 font-medium">Monitor attendance records for freelancers and employers</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Records", value: stats.total, icon: Users, color: "text-blue-400" },
          { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-emerald-400" },
          { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-amber-400" },
          { label: "Unique Users", value: stats.uniqueUsers, icon: UserCheck, color: "text-violet-400" },
        ].map((s, idx) => (
          <Card key={idx} style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium" style={{ color: T.sub }}>{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold" style={{ color: T.text }}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Table */}
      <Card style={{ background: T.card, borderColor: T.border, backdropFilter: "blur(12px)" }} className="border shadow-none overflow-hidden">
        <CardHeader>
          <CardTitle style={{ color: T.text }}>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                style={{ background: T.input, borderColor: T.border, color: T.text }}
              />
            </div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-40"
              style={{ background: T.input, borderColor: T.border, color: T.text }}
            />
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-full sm:w-36" style={{ background: T.input, borderColor: T.border, color: T.text }}>
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent style={{ background: theme === 'black' ? '#1a1a2e' : '#fff', borderColor: T.border }}>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="freelancer">Freelancers</SelectItem>
                <SelectItem value="employer">Employers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="py-12 text-center" style={{ color: T.sub }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              Loading records...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-12 text-center" style={{ color: T.sub }}>
              No attendance records found
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: T.border }}>
              <Table>
                <TableHeader style={{ background: T.nav }}>
                  <TableRow style={{ borderColor: T.border }} className="hover:bg-transparent">
                    <TableHead style={{ color: T.sub }}>User</TableHead>
                    <TableHead style={{ color: T.sub }}>Type</TableHead>
                    <TableHead style={{ color: T.sub }}>Date</TableHead>
                    <TableHead style={{ color: T.sub }}>Check In</TableHead>
                    <TableHead style={{ color: T.sub }}>Photos</TableHead>
                    <TableHead style={{ color: T.sub }}>Check Out</TableHead>
                    <TableHead style={{ color: T.sub }}>Duration</TableHead>
                    <TableHead style={{ color: T.sub }}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const duration = formatDuration(record.check_in_at, record.check_out_at);
                    return (
                      <TableRow key={record.id} style={{ borderColor: T.border }} className="hover:bg-white/5 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-semibold" style={{ color: T.text }}>
                              {record.profile?.full_name?.join(" ") || "Unknown"}
                            </p>
                            <p className="text-xs font-mono" style={{ color: T.sub }}>
                              {record.profile?.user_code?.[0] || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            style={{ 
                              background: record.profile?.user_type === "employee" ? "rgba(99,102,241,0.15)" : "rgba(168,85,247,0.15)",
                              color: record.profile?.user_type === "employee" ? "#818cf8" : "#c084fc",
                              borderColor: "transparent"
                            }}
                          >
                            {record.profile?.user_type || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell style={{ color: T.text }}>
                          {safeFmt(record.date, "MMM d, yyyy")}
                        </TableCell>
                        <TableCell style={{ color: T.text }}>
                          <div className="flex flex-col">
                            <span className="font-medium">{safeFmt(record.check_in_at, "h:mm a")}</span>
                            <span className="text-[10px]" style={{ color: T.sub }}>Checked In</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {record.check_in_photo_path ? (
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg border-white/10 bg-white/5 hover:bg-white/10"
                                onClick={() =>
                                  handleViewPhoto(
                                    record.check_in_photo_path,
                                    `Check-in Photo - ${record.profile?.full_name?.join(" ")}`
                                  )
                                }
                              >
                                <Camera className="h-4 w-4" style={{ color: T.sub }} />
                              </Button>
                            ) : null}
                            {record.check_out_photo_path ? (
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg border-white/10 bg-white/5 hover:bg-white/10"
                                onClick={() =>
                                  handleViewPhoto(
                                    record.check_out_photo_path,
                                    `Check-out Photo - ${record.profile?.full_name?.join(" ")}`
                                  )
                                }
                              >
                                <Camera className="h-4 w-4 text-accent" />
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell style={{ color: T.text }}>
                          {record.check_out_at ? (
                            <div className="flex flex-col">
                              <span className="font-medium">{safeFmt(record.check_out_at, "h:mm a")}</span>
                              <span className="text-[10px]" style={{ color: T.sub }}>Checked Out</span>
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {duration ? (
                            <span className="flex items-center gap-1.5 font-medium text-accent">
                              <Timer className="h-3.5 w-3.5" />
                              {duration}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {record.check_out_at ? (
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400">
                              In Progress
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Preview Dialog */}
      <Dialog open={photoDialog.open} onOpenChange={(open) => setPhotoDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl border-white/10 bg-[#0a0a1a]/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-white">{photoDialog.title}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4">
            <img
              src={photoDialog.url}
              alt={photoDialog.title}
              className="max-h-[60vh] rounded-2xl object-contain shadow-2xl border border-white/10"
            />
          </div>
          <div className="flex justify-end p-4">
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                const link = document.createElement("a");
                link.href = photoDialog.url;
                link.download = "attendance-photo.jpg";
                link.target = "_blank";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAttendance;
