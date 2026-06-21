import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Star, Upload, X, Loader2, MessageSquare, Sparkles, Send } from "lucide-react";
import { format } from "date-fns";

const UserReview = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const basePath = pathname.startsWith("/freelancer") ? "/freelancer" : pathname.startsWith("/employer") ? "/employer" : "/employee";

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
        const { error: uploadError } = await supabase.storage.from("review-photos").upload(filePath, photoFile);
        if (uploadError) throw uploadError;
        photo_path = filePath;
        photo_name = photoFile.name;
      }

      const { error } = await supabase.from("user_reviews").insert({
        profile_id: profile.id, rating, comment: comment.trim(), photo_path, photo_name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review submitted!");
      setRating(0); setComment(""); setPhotoFile(null); setPhotoPreview(null);
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Photo must be under 5MB"); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-5 p-4 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-warning/90 via-warning/70 to-amber-500/60 p-5 text-white">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5 blur-xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Write a Review</h1>
            <p className="text-xs opacity-80">Share your experience with us</p>
          </div>
        </div>
      </div>

      {/* Submit Review Form */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-warning via-amber-400 to-warning" />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-warning" />
            Share Your Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Star Rating */}
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Rating</label>
            <div className="mt-2 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star className={`h-8 w-8 transition-colors ${
                    star <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                  }`} />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Comment</label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell us about your experience..." className="mt-1.5 min-h-[100px] rounded-xl" rows={4} />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Photo (optional)</label>
            {photoPreview ? (
              <div className="relative mt-1.5 inline-block">
                <img src={photoPreview} alt="Preview" className="h-24 w-24 rounded-xl object-cover shadow-sm" />
                <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:bg-muted/50 hover:border-primary/30 transition-all">
                <Upload className="h-5 w-5 text-primary" />
                Upload a screenshot
                <Input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            )}
          </div>

          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || rating === 0 || !comment.trim()}
            className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-warning to-amber-500 hover:from-warning/90 hover:to-amber-500/90 shadow-sm"
          >
            {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit Review
          </Button>
        </CardContent>
      </Card>

      {/* My Reviews */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : myReviews.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> My Reviews
          </h2>
          {myReviews.map((review: any) => (
            <Card key={review.id} className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-4 w-4 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{format(new Date(review.created_at), "dd MMM yyyy")}</span>
                </div>
                <p className="text-sm text-foreground">{review.comment}</p>
                {review.admin_response && (
                  <div className="rounded-xl bg-primary/5 p-3 border border-primary/10">
                    <div className="flex items-center gap-1 text-xs font-semibold text-primary mb-1">
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
