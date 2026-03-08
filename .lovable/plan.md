

# Increase Employee Profile Photo Size

## Change

In `src/components/profile/ProfilePhotoUpload.tsx`, increase the avatar from `h-20 w-20` (80px) to `h-28 w-28` (112px), and proportionally increase the camera button from `h-7 w-7` to `h-8 w-8`. The fallback text size will increase from `text-lg` to `text-2xl`.

This affects both employee and client profiles since they share the same component.

## File to edit

**`src/components/profile/ProfilePhotoUpload.tsx`** — Update avatar className from `h-20 w-20` to `h-28 w-28`, fallback from `text-lg` to `text-2xl`, and camera button from `h-7 w-7` to `h-8 w-8`.

