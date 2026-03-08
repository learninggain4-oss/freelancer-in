import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import WalletCard from "@/components/wallet/WalletCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const PAGE_SIZE = 15;

const typeBadgeVariant = (type: string) => {
  switch (type) {
    case "credit":
      return "default";
    case "debit":
      return "destructive";
    case "hold":
      return "secondary";
    case "release":
      return "outline";
    default:
      return "secondary";
  }
};

const AdminWallet = () => {
  const { profile } = useAuth();
  const [page, setPage] = useState(1);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["admin-wallet-transactions", profile?.id, page],
    queryFn: async () => {
      if (!profile?.id) return { items: [], total: 0 };
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, count, error } = await supabase
        .from("transactions")
        .select("*", { count: "exact" })
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .range(from, to);

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
      <h2 className="text-2xl font-bold text-foreground">My Wallet</h2>

      <div className="max-w-md">
        <WalletCard
          name={profile.full_name?.join(" ") || "Admin"}
          userCode={profile.user_code?.join(", ") || ""}
          walletNumber={profile.wallet_number}
          availableBalance={Number(profile.available_balance) || 0}
          holdBalance={Number(profile.hold_balance) || 0}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !transactions?.items.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions yet.
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
                      <TableCell className="max-w-[200px] truncate text-sm">
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

export default AdminWallet;
