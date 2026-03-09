

## Plan: Configurable Coin Rewards System

### Overview
Update the employee "Get Coins" page to show specific coin earning activities with admin-configurable reward amounts. The activities will be:
- Complete Your Profile: +1000 coins (default)
- Complete a Project: +2000 coins (default)
- Daily Attendance Present: +3000 coins (default)
- Receive a 5-Star Review: +3000 coins (default)
- Refer 10 Friends: +10,000 coins (default)

---

### Changes Required

**1. Database: Add App Settings**
Insert new coin reward configuration keys into `app_settings` table with the specified default values.

**2. Update GetCoins Page (`src/pages/GetCoins.tsx`)**
- Fetch coin reward settings from `app_settings`
- Display the 5 activities with their configurable coin amounts
- Update the "How to Earn Coins" section with proper icons and values

**3. Update Admin Settings (`src/pages/admin/AdminSettings.tsx`)**
- Add state variables for the 5 coin reward amounts
- Fetch the reward values on page load
- Add a new "Coin Rewards" card with inputs and save buttons for each reward type:
  - Complete Profile
  - Complete Project
  - Daily Attendance
  - 5-Star Review
  - Refer 10 Friends

---

### Technical Details

**New App Settings Keys:**
| Key | Default Value |
|-----|---------------|
| `coin_reward_complete_profile` | 1000 |
| `coin_reward_complete_project` | 2000 |
| `coin_reward_daily_attendance` | 3000 |
| `coin_reward_5star_review` | 3000 |
| `coin_reward_referral_10` | 10000 |

**Admin UI:** Each reward will have its own input field with a Save button, following the existing pattern in AdminSettings.

