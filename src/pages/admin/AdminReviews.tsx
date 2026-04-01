import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Star, Loader2, Trash2, MessageSquare, Search, Eye, EyeOff, Send, X, Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";

const TH = {
  black: { bg:"#070714", card:"rgba(255,255,255,.05)", border:"rgba(255,255,255,.08)", text:"#e2e8f0", sub:"#94a3b8", input:"rgba(255,255,255,.07)", nav:"rgba(255,255,255,.04)", badge:"rgba(99,102,241,.2)", badgeFg:"#a5b4fc" },
  white: { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
  wb:    { bg:"#f0f4ff", card:"#ffffff", border:"rgba(0,0,0,.08)", text:"#1e293b", sub:"#64748b", input:"#f8fafc", nav:"#f1f5f9", badge:"rgba(99,102,241,.1)", badgeFg:"#4f46e5" },
};

const AdminReviews = () => {
  const queryClient = useQueryClient();
  const { theme } = useDashboardTheme();
  const T = TH[theme];
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
    <div className="space-y-6 pb-20">
      {/* Premium Hero Section */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8 mb-8"
        style={{ 
          background: theme === "black" 
            ? "linear-gradient(135deg, #1e1b4b 0%, #070714 100%)" 
            : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          border: `1px solid ${T.border}`
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white/10 p-3 backdrop-blur-md">
              <Star className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">User Reviews</h1>
              <p className="text-white/70">Moderate and respond to user feedback and ratings</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <Input
                placeholder="Search reviews..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:ring-white/20"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCleared(!showCleared)}
              className="h-10 border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              {showCleared ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showCleared ? "Hide Cleared" : "Show Cleared"}
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" />
        </div>
      ) : filtered.length === 0 ? (
        <Card style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <CardContent className="py-16 text-center" style={{ color: T.sub }}>
            No reviews found matching your criteria.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((review: any) => {
            const userName = Array.isArray(review.profiles?.full_name)
              ? review.profiles.full_name.join(" ")
              : review.profiles?.full_name || "Unknown User";
            const userType = review.profiles?.user_type || "user";
            
            return (
              <Card 
                key={review.id} 
                style={{ background: T.card, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}
                className="overflow-hidden transition-all hover:border-[#6366f1]/30"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: theme === "black" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.05)", color: "#a5b4fc" }}>
                        {userName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-lg" style={{ color: T.text }}>{userName}</span>
                          <Badge 
                            variant="outline" 
                            className="text-[10px] uppercase tracking-wider h-5"
                            style={{ 
                              borderColor: userType === "client" ? "rgba(167, 139, 250, 0.3)" : "rgba(96, 165, 250, 0.3)",
                              background: userType === "client" ? "rgba(167, 139, 250, 0.1)" : "rgba(96, 165, 250, 0.1)",
                              color: userType === "client" ? "#a78bfa" : "#60a5fa"
                            }}
                          >
                            {userType}
                          </Badge>
                          <span className="text-xs font-mono" style={{ color: T.sub }}>
                            {Array.isArray(review.profiles?.user_code)
                              ? review.profiles.user_code.join("")
                              : review.profiles?.user_code}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={cn("h-4 w-4", s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-medium" style={{ color: T.sub }}>
                            {format(new Date(review.created_at), "dd MMM yyyy, hh:mm a")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {review.photo_path && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => viewPhoto(review.photo_path)}
                          className="h-9 w-9 hover:bg-white/5"
                          style={{ color: T.sub }}
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => clearMutation.mutate({ id: review.id, cleared: !review.is_cleared })}
                        className="h-9 w-9 hover:bg-white/5"
                        style={{ color: review.is_cleared ? "#4ade80" : T.sub }}
                      >
                        {review.is_cleared ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm("Delete this review permanently?"))
                            deleteMutation.mutate(review.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl p-4 leading-relaxed" style={{ background: T.input, color: T.text, border: `1px solid ${T.border}` }}>
                    {review.comment}
                  </div>

                  {/* Admin Response */}
                  {review.admin_response && respondingId !== review.id && (
                    <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(99, 102, 241, 0.05)", border: "1px dashed rgba(99, 102, 241, 0.2)" }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#a5b4fc" }}>
                          <MessageSquare className="h-3.5 w-3.5" /> Admin Response
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs font-bold uppercase tracking-wider hover:bg-white/5"
                          style={{ color: T.sub }}
                          onClick={() => {
                            setRespondingId(review.id);
                            setResponseText(review.admin_response || "");
                          }}
                        >
                          Edit Response
                        </Button>
                      </div>
                      <p className="text-sm" style={{ color: T.text }}>{review.admin_response}</p>
                    </div>
                  )}

                  {respondingId === review.id ? (
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Write a professional response to the user..."
                        rows={3}
                        className="flex-1 resize-none"
                        style={{ background: T.input, border: `1px solid #6366f1`, color: T.text }}
                      />
                      <div className="flex sm:flex-col gap-2">
                        <Button
                          className="flex-1 bg-[#6366f1] hover:bg-[#6366f1]/90"
                          onClick={() => respondMutation.mutate({ id: review.id, response: responseText.trim() })}
                          disabled={respondMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-2" /> Send
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1" 
                          style={{ borderColor: T.border, color: T.text }}
                          onClick={() => setRespondingId(null)}
                        >
                          <X className="h-4 w-4 mr-2" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : !review.admin_response ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-4 font-bold uppercase tracking-wider transition-all border-[#6366f1]/30 hover:border-[#6366f1] hover:bg-[#6366f1]/10"
                      style={{ color: "#a5b4fc" }}
                      onClick={() => {
                        setRespondingId(review.id);
                        setResponseText("");
                      }}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" /> Respond to review
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
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-transparent shadow-none">
          {photoUrl && (
            <div className="relative group">
              <img src={photoUrl} alt="Review attachment" className="w-full h-auto rounded-2xl shadow-2xl" />
              <Button size="icon" variant="ghost" className="absolute top-4 right-4 h-10 w-10 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60" onClick={() => setPhotoUrl(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviews;
