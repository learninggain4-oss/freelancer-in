import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Users, IndianRupee, Gift, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 15;

const AdminReferrals = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["admin-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select(`
          id,
          created_at,
          signup_bonus_paid,
          job_bonus_paid,
          referrer:referrer_id(id, full_name, user_code, user_type),
          referred:referred_id(id, full_name, user_code, user_type, approval_status)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const filtered = referrals.filter((r: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const referrerName = (r.referrer?.full_name || []).join(" ").toLowerCase();
    const referredName = (r.referred?.full_name || []).join(" ").toLowerCase();
    const referrerCode = (r.referrer?.user_code || []).join("").toLowerCase();
    const referredCode = (r.referred?.user_code || []).join("").toLowerCase();
    return referrerName.includes(q) || referredName.includes(q) || referrerCode.includes(q) || referredCode.includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalReferrals = referrals.length;
  const signupBonusesPaid = referrals.filter((r: any) => r.signup_bonus_paid).length;
  const jobBonusesPaid = referrals.filter((r: any) => r.job_bonus_paid).length;

  const getName = (profile: any) => (profile?.full_name || []).join(" ") || "—";
  const getCode = (profile: any) => (profile?.user_code || []).join("") || "—";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Referrals</h2>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{totalReferrals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Signup Bonuses Paid</CardTitle>
            <Gift className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{signupBonusesPaid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Job Bonuses Paid</CardTitle>
            <IndianRupee className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{jobBonusesPaid}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Referred User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signup Bonus</TableHead>
                  <TableHead>Job Bonus</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No referrals found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{getName(r.referrer)}</p>
                          <p className="text-xs text-muted-foreground">{getCode(r.referrer)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{getName(r.referred)}</p>
                          <p className="text-xs text-muted-foreground">{getCode(r.referred)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {r.referred?.user_type || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={r.referred?.approval_status === "approved" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {r.referred?.approval_status || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.signup_bonus_paid ? "default" : "outline"}>
                          {r.signup_bonus_paid ? "Paid" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.job_bonus_paid ? "default" : "outline"}>
                          {r.job_bonus_paid ? "Paid" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(r.created_at), "dd MMM yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReferrals;
