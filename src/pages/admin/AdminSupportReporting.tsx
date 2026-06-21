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
import { useAdminTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

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
  const { theme, themeKey } = useAdminTheme();
  const T = TH[themeKey];
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
      <div className="relative overflow-hidden rounded-3xl bg-indigo-600 p-8 text-white shadow-2xl shadow-indigo-500/20">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-100 mb-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Support Analytics</span>
            </div>
            <h1 className="text-3xl font-bold">Support Reporting</h1>
            <p className="text-indigo-100/80 text-sm mt-1">
              Chat volume, response times &amp; performance monitoring
            </p>
          </div>
          <Button 
            onClick={exportCSV} 
            className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-md rounded-xl"
            variant="outline"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
      </div>

      {/* Date range filter */}
      <div 
        className="flex flex-wrap items-center gap-4 p-4 rounded-2xl border backdrop-blur-xl"
        style={{ background: T.card, borderColor: T.border }}
      >
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4" style={{ color: T.sub }} />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40 border-none h-10 rounded-xl"
            style={{ background: T.input, color: T.text }}
          />
          <span style={{ color: T.sub }}>to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40 border-none h-10 rounded-xl"
            style={{ background: T.input, color: T.text }}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Conversations", value: summary.totalConversations, icon: Users, color: "#6366f1" },
          { label: "Total Messages", value: summary.totalMessages, icon: MessageSquare, color: "#8b5cf6" },
          { label: "Avg Response Time", value: formatResponseTime(summary.avgResponseTime), icon: Clock, color: "#ec4899" },
          { label: "Active (24h)", value: summary.activeToday, icon: TrendingUp, color: "#22c55e" },
        ].map((stat, i) => (
          <div 
            key={i}
            className="group relative overflow-hidden rounded-2xl border p-6 transition-all hover:scale-[1.02]"
            style={{ background: T.card, borderColor: T.border }}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg" style={{ background: `${stat.color}15`, color: stat.color }}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm font-medium" style={{ color: T.sub }}>{stat.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: T.text }}>{stat.value}</p>
            </div>
            <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full blur-2xl transition-opacity group-hover:opacity-100" style={{ background: `${stat.color}10`, opacity: 0.5 }}></div>
          </div>
        ))}
      </div>

      {/* Detail table */}
      <div 
        className="rounded-2xl border overflow-hidden"
        style={{ background: T.card, borderColor: T.border }}
      >
        <div className="p-6 border-b" style={{ borderColor: T.border }}>
          <h3 className="font-semibold flex items-center gap-2" style={{ color: T.text }}>
            <BarChart3 className="h-4 w-4" />
            Per-Conversation Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow style={{ background: T.nav, borderColor: T.border }}>
                <TableHead style={{ color: T.sub }}>User</TableHead>
                <TableHead style={{ color: T.sub }}>Type</TableHead>
                <TableHead className="text-right" style={{ color: T.sub }}>Messages</TableHead>
                <TableHead className="text-right" style={{ color: T.sub }}>Admin</TableHead>
                <TableHead className="text-right" style={{ color: T.sub }}>User</TableHead>
                <TableHead className="text-right" style={{ color: T.sub }}>Avg Response</TableHead>
                <TableHead style={{ color: T.sub }}>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20" style={{ color: T.sub }}>
                    No conversations in this date range
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => (
                  <TableRow key={m.conversationId} style={{ borderColor: T.border }} className="hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="font-semibold" style={{ color: T.text }}>{m.userName}</div>
                      <div className="text-xs" style={{ color: T.sub }}>{m.userCode}</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className="capitalize border-none"
                        style={{ background: T.badge, color: T.badgeFg }}
                      >
                        {m.userType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium" style={{ color: T.text }}>{m.totalMessages}</TableCell>
                    <TableCell className="text-right" style={{ color: T.sub }}>{m.adminMessages}</TableCell>
                    <TableCell className="text-right" style={{ color: T.sub }}>{m.userMessages}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium" style={{ color: (m.avgResponseTimeMin || 0) > 30 ? "#f87171" : T.text }}>
                        {formatResponseTime(m.avgResponseTimeMin)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs" style={{ color: T.sub }}>
                      {format(parseISO(m.lastMessageAt), "MMM d, HH:mm")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminSupportReporting;
