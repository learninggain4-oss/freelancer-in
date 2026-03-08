import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

const AdminReviews = () => {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews", search],
    queryFn: async () => {
      let query = supabase
        .from("reviews" as any)
        .select("*, reviewer:reviewer_id(full_name, user_code, user_type), reviewee:reviewee_id(full_name, user_code, user_type), project:project_id(name, order_id)")
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      if (search) {
        const s = search.toLowerCase();
        return (data as any[]).filter((r: any) =>
          r.reviewer?.full_name?.[0]?.toLowerCase().includes(s) ||
          r.reviewee?.full_name?.[0]?.toLowerCase().includes(s) ||
          r.project?.name?.toLowerCase().includes(s) ||
          r.comment?.toLowerCase().includes(s)
        );
      }
      return data as any[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Star className="h-3 w-3 fill-warning text-warning" />
            Avg: {avgRating}
          </Badge>
          <Badge variant="secondary">{reviews.length} total</Badge>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by reviewer, reviewee, project or comment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
      ) : reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review: any) => (
            <Card key={review.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {review.reviewer?.full_name?.[0] ?? "Unknown"}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {review.reviewer?.user_type ?? "user"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-sm font-semibold text-foreground">
                        {review.reviewee?.full_name?.[0] ?? "Unknown"}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {review.reviewee?.user_type ?? "user"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {review.project?.order_id ?? ""} • {review.project?.name ?? "Project"} • {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= review.rating
                              ? "fill-warning text-warning"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently remove this review.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(review.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2">{review.comment}</p>
                )}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Reviewer: {review.reviewer?.user_code?.[0] ?? "—"}</span>
                  <span>Reviewee: {review.reviewee?.user_code?.[0] ?? "—"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">No reviews found</p>
      )}
    </div>
  );
};

export default AdminReviews;
