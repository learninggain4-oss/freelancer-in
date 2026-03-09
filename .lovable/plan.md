

# Face Verification for Attendance (Employee & Client)

## Current State
- `EmployeeAttendance.tsx` handles check-in/out directly without photo capture
- `FaceVerificationDialog.tsx` already exists with camera, liveness prompts, face detection, and confirmation flow
- Client attendance route (`/client/attendance`) reuses `EmployeeAttendance` component
- `attendance` table has `check_in_photo_path` and `check_out_photo_path` columns
- `attendance-photos` storage bucket exists (private)

## Plan

### 1. Update `src/pages/employee/EmployeeAttendance.tsx`
- Import `FaceVerificationDialog`
- Add state for `faceDialogOpen` and `faceAction` ("check-in" | "check-out")
- On Check In/Check Out button click, open the dialog instead of directly inserting
- On photo captured (`onCaptured` callback):
  - Upload blob to `attendance-photos` bucket at `{profile.id}/{date}-{action}.jpg`
  - For check-in: insert attendance record with `check_in_photo_path`
  - For check-out: update attendance record with `check_out_photo_path`
- Show captured photo thumbnails in the today card when photos exist (signed URLs)

### 2. No new files or DB changes needed
- The dialog, table columns, and storage bucket all exist already

