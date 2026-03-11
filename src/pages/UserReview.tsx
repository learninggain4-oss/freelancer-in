import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Star, ArrowLeft, Upload, X, Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";

const UserReview = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const basePath = profile?.user_type === "client" ? "/client" : "/employee";

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: myReviews = [], isLoading } = useQuery({
    queryKey: ["my-reviews", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("user_reviews")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("is_cleared", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !user?.id) throw new Error("Not authenticated");
      if (rating === 0) throw new Error("Please select a rating");
      if (!comment.trim()) throw new Error("Please write a comment");

      let photo_path: string | null = null;
      let photo_name: string | null = null;

      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("review-photos")
          .upload(filePath, photoFile);
        if (uploadError) throw uploadError;
        photo_path = filePath;
        photo_name = photoFile.name;
      }

      const { error } = await supabase.from("user_reviews").insert({
        profile_id: profile.id,
        rating,
        comment: comment.trim(),
        photo_path,
        photo_name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      setRating(0);
      setComment("");
      setPhotoFile(null);
      setPhotoPreview(null);
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/profile`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Write a Review</h1>
      </div>

      {/* Submit Review Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Share Your Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Star Rating */}
          <div>
            <label className="text-sm font-medium text-foreground">Rating</label>
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5"
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium text-foreground">Comment</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              className="mt-1"
              rows={4}
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="text-sm font-medium text-foreground">Photo (optional)</label>
            {photoPreview ? (
              <div className="relative mt-1 inline-block">
                <img src={photoPreview} alt="Preview" className="h-24 w-24 rounded-lg object-cover" />
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground hover:bg-muted/50">
                <Upload className="h-4 w-4" />
                Upload a screenshot
                <Input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            )}
          </div>

          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || rating === 0 || !comment.trim()}
            className="w-full"
          >
            {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit Review
          </Button>
        </CardContent>
      </Card>

      {/* My Reviews */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : myReviews.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">My Reviews</h2>
          {myReviews.map((review: any) => (
            <Card key={review.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), "dd MMM yyyy")}
                  </span>
                </div>
                <p className="text-sm text-foreground">{review.comment}</p>
                {review.admin_response && (
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-center gap-1 text-xs font-medium text-primary mb-1">
                      <MessageSquare className="h-3 w-3" /> Admin Response
                    </div>
                    <p className="text-sm text-foreground">{review.admin_response}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default UserReview;
