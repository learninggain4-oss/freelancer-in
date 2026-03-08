import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface ReviewDialogProps {
  projectId: string;
  projectName: string;
  revieweeId: string;
  revieweeName: string;
  trigger?: React.ReactNode;
}

const ReviewDialog = ({ projectId, projectName, revieweeId, revieweeName, trigger }: ReviewDialogProps) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!profile?.id || rating === 0) throw new Error("Please select a rating");
      const { error } = await supabase.from("reviews" as any).insert({
        project_id: projectId,
        reviewer_id: profile.id,
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review submitted!");
      setOpen(false);
      setRating(0);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["user-reviews"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-1">
            <Star className="h-3 w-3" /> Review
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Rate {revieweeName}</DialogTitle>
          <p className="text-xs text-muted-foreground">For project: {projectName}</p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 transition-transform hover:scale-110"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? "fill-warning text-warning"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {rating === 0 ? "Select a rating" : `${rating} star${rating > 1 ? "s" : ""}`}
          </p>
          <Textarea
            placeholder="Write a review (optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <Button
            className="w-full"
            onClick={() => submitReview.mutate()}
            disabled={rating === 0 || submitReview.isPending}
          >
            {submitReview.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
