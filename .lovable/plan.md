

## Plan: Add Coin Conversion Button + Admin-Editable Minimum Threshold

### Changes

1. **GetCoins page** — Add a "Convert to Wallet" button below the coin balance cards. The button shows the minimum required coins (default 250) and is disabled when the user's balance is below the threshold. Both `coin_conversion_rate` and `min_coin_conversion` are fetched from `app_settings`. Since the coin system is placeholder (balance is 0), the button will be present but disabled with a clear message like "Minimum 250 Coins Required".

2. **AdminSettings page** — Add a "Minimum Coins for Conversion" input field alongside the existing "Coins per ₹1" field in the Coin Conversion Rate card. Uses the same `handleSaveSetting` pattern.

3. **Database** — The `min_coin_conversion` row (value `250`) was already inserted in the previous migration. No new migration needed.

### Technical details

- **GetCoins.tsx**: Fetch both settings in the existing `useEffect`. Add state `minCoins` (default 250). Add a conversion card with a `Button` that shows "Convert to Wallet" when eligible or "Minimum {minCoins} Coins Required" when not. Since user coins are currently 0 (placeholder), the button will be disabled.
- **AdminSettings.tsx**: Add `minCoinConversion` state, load it from `app_settings` alongside `coin_conversion_rate`, and add a second input+save row in the Coin card for `min_coin_conversion`.

