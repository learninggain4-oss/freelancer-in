

## Plan: Add Order ID to Withdrawals

### What We're Building
Add a unique 7-digit order ID to every withdrawal request, displayed prominently in the withdrawal history with a copy-to-clipboard button. The order ID follows the pattern `WDR-1234567`.

### Database Changes
**Migration on `withdrawals` table:**
- Add `order_number` serial column (auto-incrementing sequence starting at 1000000 for 7 digits)
- Add `order_id` generated column: `'WDR-' || lpad(order_number::text, 7, '0')` (stored, unique)
- Same pattern already used for projects (`ORD-XXXX`)

```sql
CREATE SEQUENCE withdrawals_order_seq START 1000000;
ALTER TABLE withdrawals ADD COLUMN order_number integer NOT NULL DEFAULT nextval('withdrawals_order_seq');
ALTER TABLE withdrawals ADD COLUMN order_id text GENERATED ALWAYS AS ('WDR-' || lpad(order_number::text, 7, '0')) STORED;
CREATE UNIQUE INDEX idx_withdrawals_order_id ON withdrawals(order_id);
```

### UI Changes: `src/pages/wallet/WithdrawalHistory.tsx`
- Add `order_id` and `method` to the select query
- Display order ID prominently at the top of each withdrawal card
- Add a copy button (clipboard icon) next to the order ID
- Show: Order ID (with copy), Amount, Status badge, Payment Method, Date
- Use `navigator.clipboard.writeText()` with a toast confirmation

### File Changes
| File | Action |
|------|--------|
| Migration SQL | Add `order_number`, `order_id` columns + unique index |
| `src/pages/wallet/WithdrawalHistory.tsx` | Show order ID with copy button, improved card layout |

