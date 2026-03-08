

## Plan: Coin-to-Rupee Conversion Rate with Admin Edit

### What changes

1. **Database** — Add an `app_settings` row with key `coin_conversion_rate` and value `100` (meaning 100 coins = ₹1). No schema change needed — just insert data.

2. **GetCoins page** — Fetch the `coin_conversion_rate` from `app_settings` and display a prominent conversion info card showing "100 Coins = ₹1" (dynamic based on the setting). Also show the rupee equivalent next to the user's coin balance.

3. **AdminSettings page** — Add a "Coin Settings" section with an input field for the conversion rate (coins per ₹1), with a Save button following the existing pattern.

### Technical details

- **Data insert**: `INSERT INTO app_settings (key, value) VALUES ('coin_conversion_rate', '100') ON CONFLICT (key) DO NOTHING;`
- **GetCoins**: Use `useEffect` to fetch `coin_conversion_rate` from `app_settings`. Display a conversion card: `{rate} Coins = ₹1`.
- **AdminSettings**: Add state `coinRate`, load it alongside other settings, save with upsert to `app_settings` where `key = 'coin_conversion_rate'`. Follows existing save pattern with toast feedback.

