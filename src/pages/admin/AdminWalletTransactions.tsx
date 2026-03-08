import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, ChevronLeft, ChevronRight, ArrowLeft, Search } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 15;

const typeBadgeVariant = (type: string) => {
  switch (type) {
    case "credit":
      return "default" as const;
    case "debit":
      return "destructive" as const;
    case "hold":
      return "secondary" as const;
    case "release":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
};

const AdminWalletTransactions = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["admin-wallet-transactions", profile?.id, page, searchQuery, typeFilter],
    queryFn: async () => {
      if (!profile?.id) return { items: [], total: 0 };
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("transactions")
        .select("*", { count: "exact" })
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      if (searchQuery.trim()) {
        query = query.ilike("description", `%${searchQuery.trim()}%`);
      }

      const { data, count, error } = await query.range(from, to);
      if (error) throw error;
      return { items: data || [], total: count || 0 };
    },
    enabled: !!profile?.id,
  });

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalPages = Math.ceil((transactions?.total || 0) / PAGE_SIZE);
  const showFrom = (page - 1) * PAGE_SIZE + 1;
  const showTo = Math.min(page * PAGE_SIZE, transactions?.total || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/wallet")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold text-foreground">Transaction History</h2>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
                <SelectItem value="hold">Hold</SelectItem>
                <SelectItem value="release">Release</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !transactions?.items.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions found.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.items.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "dd MMM yyyy, hh:mm a")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={typeBadgeVariant(tx.type)} className="capitalize">
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm">
                        {tx.description}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{Number(tx.amount).toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Showing {showFrom}–{showTo} of {transactions.total}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWalletTransactions;
