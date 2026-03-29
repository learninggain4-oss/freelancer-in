import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  BarChart3,
  Clock,
  Download,
  MessageSquare,
  Users,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { format, differenceInMinutes, subDays, isAfter, parseISO } from "date-fns";

interface ConversationMetric {
  conversationId: string;
  userName: string;
  userCode: string;
  userType: string;
  totalMessages: number;
  adminMessages: number;
  userMessages: number;
  firstMessageAt: string;
  lastMessageAt: string;
  avgResponseTimeMin: number | null;
}

const AdminSupportReporting = () => {
  const [dateFrom, setDateFrom] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  // Fetch all conversations with user profiles
  const { data: conversations = [] } = useQuery({
    queryKey: ["support-report-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_conversations")
        .select("id, user_id, created_at, profiles!support_conversations_user_id_fkey(full_name, user_code, user_type)");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all support messages
  const { data: messages = [] } = useQuery({
    queryKey: ["support-report-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("id, conversation_id, sender_id, created_at, is_read, content")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch admin user IDs
  const { data: adminRoles = [] } = useQuery({
    queryKey: ["support-report-admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      if (error) throw error;
      return data || [];
    },
  });

  const adminUserIds = useMemo(
    () => new Set(adminRoles.map((r: any) => r.user_id)),
    [adminRoles]
  );

  // Compute metrics
  const metrics = useMemo<ConversationMetric[]>(() => {
    if (!conversations.length || !messages.length) return [];

    return conversations.map((conv: any) => {
      const convMessages = messages.filter(
        (m: any) => m.conversation_id === conv.id
      );
      const userMsgs = convMessages.filter(
        (m: any) => !adminUserIds.has(m.sender_id)
      );
      const adminMsgs = convMessages.filter((m: any) =>
        adminUserIds.has(m.sender_id)
      );

      // Calculate avg response time: time between user message and next admin reply
      const responseTimes: number[] = [];
      for (let i = 0; i < convMessages.length; i++) {
        const msg = convMessages[i];
        if (!adminUserIds.has(msg.sender_id)) {
          // find next admin reply
          for (let j = i + 1; j < convMessages.length; j++) {
            if (adminUserIds.has(convMessages[j].sender_id)) {
              responseTimes.push(
                differenceInMinutes(
                  parseISO(convMessages[j].created_at),
                  parseISO(msg.created_at)
                )
              );
              break;
            }
          }
        }
      }
      const avgResponse =
        responseTimes.length > 0
          ? Math.round(
              responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            )
          : null;

      const profile = conv.profiles;
      return {
        conversationId: conv.id,
        userName: profile?.full_name?.[0] || "Unknown",
        userCode: profile?.user_code?.[0] || "",
        userType: profile?.user_type || "",
        totalMessages: convMessages.length,
        adminMessages: adminMsgs.length,
        userMessages: userMsgs.length,
        firstMessageAt:
          convMessages[0]?.created_at || conv.created_at,
        lastMessageAt:
          convMessages[convMessages.length - 1]?.created_at || conv.created_at,
        avgResponseTimeMin: avgResponse,
      };
    });
  }, [conversations, messages, adminUserIds]);

  // Filter by date range
  const filtered = useMemo(() => {
    const from = parseISO(dateFrom);
    const to = parseISO(dateTo + "T23:59:59");
    return metrics.filter((m) => {
      const last = parseISO(m.lastMessageAt);
      return isAfter(last, from) && !isAfter(last, to);
    });
  }, [metrics, dateFrom, dateTo]);

  // Summary stats
  const summary = useMemo(() => {
    const totalConversations = filtered.length;
    const totalMessages = filtered.reduce((s, m) => s + m.totalMessages, 0);
    const responseTimes = filtered
      .map((m) => m.avgResponseTimeMin)
      .filter((v): v is number => v !== null);
    const avgResponseTime =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;
    const activeToday = filtered.filter((m) =>
      isAfter(parseISO(m.lastMessageAt), subDays(new Date(), 1))
    ).length;
    return { totalConversations, totalMessages, avgResponseTime, activeToday };
  }, [filtered]);

  // CSV export
  const exportCSV = () => {
    const header = [
      "User Name",
      "User Code",
      "User Type",
      "Total Messages",
      "Admin Messages",
      "User Messages",
      "Avg Response (min)",
      "First Message",
      "Last Message",
    ];
    const rows = filtered.map((m) => [
      m.userName,
      m.userCode,
      m.userType,
      m.totalMessages,
      m.adminMessages,
      m.userMessages,
      m.avgResponseTimeMin ?? "N/A",
      format(parseISO(m.firstMessageAt), "yyyy-MM-dd HH:mm"),
      format(parseISO(m.lastMessageAt), "yyyy-MM-dd HH:mm"),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `support-report-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatResponseTime = (min: number | null) => {
    if (min === null) return "—";
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Reporting</h1>
          <p className="text-sm text-muted-foreground">
            Chat volume, response times &amp; export
          </p>
        </div>
        <Button onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-40"
        />
        <span className="text-muted-foreground">to</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Conversations
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalConversations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Messages
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalMessages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatResponseTime(summary.avgResponseTime)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active (24h)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detail table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Per-Conversation Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Messages</TableHead>
                <TableHead className="text-right">Admin</TableHead>
                <TableHead className="text-right">User</TableHead>
                <TableHead className="text-right">Avg Response</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No conversations in this date range
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((m) => (
                <TableRow key={m.conversationId}>
                  <TableCell>
                    <div className="font-medium">{m.userName}</div>
                    <div className="text-xs text-muted-foreground">{m.userCode}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {m.userType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{m.totalMessages}</TableCell>
                  <TableCell className="text-right">{m.adminMessages}</TableCell>
                  <TableCell className="text-right">{m.userMessages}</TableCell>
                  <TableCell className="text-right">
                    {formatResponseTime(m.avgResponseTimeMin)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(parseISO(m.lastMessageAt), "MMM d, HH:mm")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSupportReporting;
