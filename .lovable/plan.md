

## Plan: Show UPI Payment Apps & Bank Details in Withdrawal Form

### What Changes
Replace the static "Saved UPI Details" / "Saved Bank Details" sections in the withdrawal form with dynamic data from the employee's saved payment apps and bank profile.

### UPI Tab Changes
- Fetch employee's saved UPI payment apps from `employee_payment_apps` joined with `payment_methods` (for logo/name)
- Display each saved app as a selectable card with logo, app name, and phone number
- Employee picks which UPI app to use for the withdrawal
- If no apps saved, show a prompt to go to Profile > UPI Payment Apps
- Selected app's phone number is sent with the withdrawal request

### Bank Transfer Tab Changes
- Fetch employee's bank name from the `banks` table (to get the logo if available)
- Display bank details as a styled card with the bank logo, holder name, account number, and IFSC
- If no bank details saved, show prompt to update in Profile

### File: `src/pages/employee/EmployeeWallet.tsx`
1. Add a query for `employee_payment_apps` joined with `payment_methods` to get app name, logo, phone number
2. Add a query for `banks` to match `profile.bank_name` and get the logo
3. Add state `selectedUpiAppId` for UPI app selection
4. **UPI section**: Render selectable app cards with logos; highlight selected one
5. **Bank section**: Show bank logo + details in a styled card
6. Update `withdrawMutation` to include selected UPI app's phone number and method name

### No database or migration changes needed — all data already exists.

