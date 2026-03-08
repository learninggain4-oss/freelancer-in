import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare } from "lucide-react";

interface ReviewsListProps {
  profileId: string;
}

const ReviewsList = ({ profileId }: ReviewsListProps) => {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["user-reviews", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews" as any)
        .select("*, reviewer:reviewer_id(full_name), project:project_id(name)")
        .eq("reviewee_id", profileId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!profileId,
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (isLoading) return null;
  if (reviews.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Reviews ({reviews.length})
          </span>
          {avgRating && (
            <span className="flex items-center gap-1 text-sm font-semibold">
              <Star className="h-4 w-4 fill-warning text-warning" />
              {avgRating}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviews.map((review: any) => (
          <div key={review.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {review.reviewer?.full_name?.[0] ?? "User"}
              </p>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= review.rating
                        ? "fill-warning text-warning"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {review.project?.name} • {new Date(review.created_at).toLocaleDateString()}
            </p>
            {review.comment && (
              <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ReviewsList;
