

## Plan: Add Attendance Feature for Employees and Clients

### What it does
A new "Attendance" section accessible from the bottom tab bar (replacing or adding alongside existing tabs). Users can check in and check out daily, and view a calendar showing their attendance history with color-coded statuses.

### Changes

**1. Database — `attendance` table**
Create a new table to store daily attendance records:
- `id` (uuid, PK)
- `profile_id` (uuid, references profiles)
- `date` (date, the attendance day)
- `check_in_at` (timestamptz, when user checked in)
- `check_out_at` (timestamptz, nullable, when user checked out)
- `status` (text: 'present', 'half_day')
- `created_at` (timestamptz)
- Unique constraint on `(profile_id, date)` to prevent duplicate entries per day
- RLS: users see/insert/update own records; admins see all

**2. New page — `src/pages/employee/EmployeeAttendance.tsx`** (shared by both user types)
- **Check-in/Check-out card** at the top: Shows a "Check In" button if not checked in today, or a "Check Out" button if already checked in but not checked out. Displays today's check-in/out times.
- **Calendar view** below: Uses the existing `Calendar` component (react-day-picker) to show the current month. Days are color-coded: green = present (checked in + out), yellow = half-day (checked in only), no color = absent. Tapping a day shows a small detail.
- **Stats summary**: Total present days, current streak count for the month.

**3. Bottom tab bar update — `BottomTabBar.tsx`**
Add an "Attendance" tab (ClipboardCheck icon) between Dashboard and Jobs in the tab array. This applies to both employee and client navigation.

**4. Routes — `App.tsx`**
Add `<Route path="attendance" element={<EmployeeAttendance />} />` under both employee and client route groups.

### Technical details
- Check-in inserts a row with `check_in_at = now()` and `status = 'present'`.
- Check-out updates `check_out_at = now()` on today's row.
- Calendar fetches all attendance rows for the displayed month using a date range query.
- The page component is shared; it uses `profile.id` from AuthContext so it works for both user types.
- No edge function needed — direct Supabase client queries with RLS.

