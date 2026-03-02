import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ProfilePhotoUpload = () => {
  const { profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: photoUrl } = useQuery({
    queryKey: ["profile-photo", (profile as any)?.profile_photo_path],
    enabled: !!(profile as any)?.profile_photo_path,
    queryFn: async () => {
      const path = (profile as any).profile_photo_path;
      const { data } = await supabase.storage
        .from("profile-photos")
        .createSignedUrl(path, 3600);
      return data?.signedUrl ?? null;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!profile) throw new Error("No profile");
      const ext = file.name.split(".").pop();
      const path = `${profile.user_id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_photo_path: path } as any)
        .eq("id", profile.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Profile photo updated!");
      refreshProfile();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be under 2MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    uploadMutation.mutate(file);
  };

  const initials = profile?.full_name
    ? (Array.isArray(profile.full_name) ? profile.full_name[0] : profile.full_name)
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar className="h-20 w-20 border-2 border-border">
          <AvatarImage src={photoUrl ?? undefined} alt="Profile" />
          <AvatarFallback className="text-lg bg-muted text-muted-foreground">{initials}</AvatarFallback>
        </Avatar>
        <Button
          size="icon"
          variant="secondary"
          className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full shadow"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ProfilePhotoUpload;
