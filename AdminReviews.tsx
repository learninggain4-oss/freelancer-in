import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Star, Loader2, Trash2, MessageSquare, Search, Eye, EyeOff, Send, X, Image as ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const AdminReviews = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCleared, setShowCleared] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews", showCleared],
    queryFn: async () => {
      let q = supabase
        .from("user_reviews")
        .select("*, profiles!inner(full_name, user_code, user_type, email)")
        .eq("is_cleared", showCleared)
        .order("created_at", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const clearMutation = useMutation({
    mutationFn: async ({ id, cleared }: { id: string; cleared: boolean }) => {
      const { error } = await supabase
        .from("user_reviews")
        .update({ is_cleared: cleared, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review updated");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: () => toast.error("Failed to update"),
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      const { error } = await supabase
        .from("user_reviews")
        .update({ admin_response: response || null, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Response saved");
      setRespondingId(null);
      setResponseText("");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: () => toast.error("Failed to save response"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const review = reviews.find((r: any) => r.id === id);
      if (review?.photo_path) {
        await supabase.storage.from("review-photos").remove([review.photo_path]);
      }
      const { error } = await supabase.from("user_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  const viewPhoto = async (path: string) => {
    const { data } = await supabase.storage.from("review-photos").createSignedUrl(path, 300);
    if (data?.signedUrl) setPhotoUrl(data.signedUrl);
  };

  const filtered = reviews.filter((r: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name = Array.isArray(r.profiles?.full_name)
      ? r.profiles.full_name.join(" ")
      : r.profiles?.full_name || "";
    return (
      name.toLowerCase().includes(s) ||
      r.profiles?.email?.toLowerCase().includes(s) ||
      r.comment?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-foreground">User Reviews</h1>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={showCleared ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCleared(!showCleared)}
          >
            {showCleared ? <Eye className="mr-1 h-4 w-4" /> : <EyeOff className="mr-1 h-4 w-4" />}
            {showCleared ? "Cleared" : "Active"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No reviews found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((review: any) => {
            const userName = Array.isArray(review.profiles?.full_name)
              ? review.profiles.full_name.join(" ")
              : review.profiles?.full_name || "Unknown";
            return (
              <Card key={review.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{userName}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {review.profiles?.user_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Array.isArray(review.profiles?.user_code)
                            ? review.profiles.user_code.join("")
                            : review.profiles?.user_code}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${
                                s <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(review.created_at), "dd MMM yyyy, hh:mm a")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {review.photo_path && (
                        <Button size="icon" variant="ghost" onClick={() => viewPhoto(review.photo_path)}>
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => clearMutation.mutate({ id: review.id, cleared: !review.is_cleared })}
                      >
                        {review.is_cleared ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Delete this review permanently?"))
                            deleteMutation.mutate(review.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-foreground">{review.comment}</p>

                  {/* Admin Response */}
                  {review.admin_response && respondingId !== review.id && (
                    <div className="rounded-lg bg-muted p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs font-medium text-primary">
                          <MessageSquare className="h-3 w-3" /> Admin Response
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => {
                            setRespondingId(review.id);
                            setResponseText(review.admin_response || "");
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                      <p className="mt-1 text-sm text-foreground">{review.admin_response}</p>
                    </div>
                  )}

                  {respondingId === review.id ? (
                    <div className="flex gap-2">
                      <Textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Write your response..."
                        rows={2}
                        className="flex-1"
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon"
                          onClick={() => respondMutation.mutate({ id: review.id, response: responseText.trim() })}
                          disabled={respondMutation.isPending}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setRespondingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : !review.admin_response ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRespondingId(review.id);
                        setResponseText("");
                      }}
                    >
                      <MessageSquare className="mr-1 h-3.5 w-3.5" /> Respond
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Photo Dialog */}
      <Dialog open={!!photoUrl} onOpenChange={() => setPhotoUrl(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Photo</DialogTitle>
          </DialogHeader>
          {photoUrl && (
            <img src={photoUrl} alt="Review" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviews;
