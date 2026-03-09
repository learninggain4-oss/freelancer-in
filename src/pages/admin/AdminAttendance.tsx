import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { format } from "date-fns";
import { Search, Users, CheckCircle, Clock, UserCheck, Timer } from "lucide-react";
import { formatDuration } from "@/utils/attendance-helpers";

const AdminAttendance = () => {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");

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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance Checker</h1>
        <p className="text-muted-foreground">
          Monitor attendance records for employees and clients
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.uniqueUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-40"
            />
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="employee">Employees</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No attendance records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const duration = formatDuration(record.check_in_at, record.check_out_at);
                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {record.profile?.full_name?.join(" ") || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {record.profile?.user_code?.[0] || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.profile?.user_type === "employee"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {record.profile?.user_type || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(record.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(record.check_in_at), "h:mm a")}
                        </TableCell>
                        <TableCell>
                          {record.check_out_at
                            ? format(new Date(record.check_out_at), "h:mm a")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {duration ? (
                            <span className="flex items-center gap-1 text-accent">
                              <Timer className="h-3 w-3" />
                              {duration}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {record.check_out_at ? (
                            <Badge variant="outline" className="border-accent text-accent">
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-warning text-warning">
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
    </div>
  );
};

export default AdminAttendance;
