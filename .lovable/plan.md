

## Plan: Employee UPI Payment Apps Page

### What We're Building
A new page at `/employee/profile/upi-apps` where employees can select their preferred UPI payment app (from admin-managed `payment_methods` table) and save their phone number for that app. Admins already manage payment methods via `AdminPaymentMethods`.

### Database Changes
**New table: `employee_payment_apps`** to store employee UPI app selections:
- `id` (uuid, PK)
- `profile_id` (uuid, FK to profiles)
- `payment_method_id` (uuid, FK to payment_methods)
- `phone_number` (text) - the phone number linked to this UPI app
- `is_primary` (boolean, default false)
- `created_at`, `updated_at`
- Unique constraint on `(profile_id, payment_method_id)`
- RLS: users can CRUD own rows, admins can manage all, deny anon

### New Page: `src/pages/profile/ProfileUpiApps.tsx`
- Fetches active payment methods from `payment_methods` table
- Shows employee's saved UPI apps from `employee_payment_apps`
- Each payment method displayed as a card with toggle to enable + phone number input
- Save/edit functionality per app
- Back navigation to profile

### Route & Navigation Updates
1. **`src/App.tsx`**: Add lazy import + route `/employee/profile/upi-apps` and `/client/profile/upi-apps`
2. **`src/pages/employee/EmployeeProfile.tsx`**: Add "UPI Payment Apps" section link after Bank Details, using `CreditCard` icon

### File Changes Summary
| File | Action |
|------|--------|
| Migration SQL | Create `employee_payment_apps` table + RLS |
| `src/pages/profile/ProfileUpiApps.tsx` | New page |
| `src/App.tsx` | Add route |
| `src/pages/employee/EmployeeProfile.tsx` | Add nav link |

