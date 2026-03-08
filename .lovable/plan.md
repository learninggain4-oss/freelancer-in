

# Plan: Add Date-Based User Code Format

## Current State
User codes are generated as `{PREFIX}{PADDED_NUMBER}` (e.g., `EMP00001`). The admin settings UI has fields for Prefix and Digits only.

## Changes

### 1. Admin Settings UI (`src/pages/admin/AdminSettings.tsx`)
Add new configuration options to the User Code Configuration card:
- **Include Year** toggle (e.g., `EMP-2026-00001`)
- **Include Month** toggle (e.g., `EMP-2026-03-00001`)
- **Separator** dropdown (options: none, `-`, `/`, `.`)
- Update the live preview to reflect the selected format
- New app_settings keys: `employee_code_include_year`, `employee_code_include_month`, `client_code_include_year`, `client_code_include_month`, `employee_code_separator`, `client_code_separator`

### 2. Database Function (`generate_user_code`)
Update the `generate_user_code()` trigger function via migration to:
- Read the new settings (`include_year`, `include_month`, `separator`)
- Build code as `{PREFIX}{SEP}{YEAR}{SEP}{MONTH}{SEP}{PADDED_NUMBER}` based on enabled flags
- Sequential numbering resets per year/month if those components are enabled (so numbering restarts each period)

### 3. Migration
- Insert default values for the 6 new `app_settings` keys (all disabled by default, separator = `-`)
- Replace the `generate_user_code` function with the updated version

### Preview Examples
- Year only: `EMP-2026-00001`
- Year + Month: `EMP-2026-03-00001`
- No separator: `EMP202600001`
- No date (current): `EMP00001`

