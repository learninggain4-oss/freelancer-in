import { supabase } from "@/integrations/supabase/client";

/**
 * Check if a user is making their first deposit
 * by checking if they have any approved deposits in the past
 */
export async function isFirstTimeDeposit(profileId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("deposit_requests")
      .select("id")
      .eq("profile_id", profileId)
      .eq("status", "approved")
      .limit(1);

    if (error) {
      console.error("Error checking deposit history:", error);
      return false;
    }

    return !data || data.length === 0;
  } catch (e) {
    console.error("Exception in isFirstTimeDeposit:", e);
    return false;
  }
}

/**
 * Get the first-time deposit cashback percentage from app settings
 */
export async function getFirstTimeDepositCashback(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "first_time_deposit_cashback_percentage")
      .single();

    if (error || !data) {
      return 0;
    }

    return Number(data.value) || 0;
  } catch (e) {
    console.error("Exception in getFirstTimeDepositCashback:", e);
    return 0;
  }
}

/**
 * Get action badge percentages (Add, Transfer, Withdraw) from app settings
 */
export async function getActionBadgePercentages(): Promise<{
  addMoneyPercent: number;
  transferPercent: number;
  withdrawPercent: number;
}> {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", [
        "add_money_badge_percent",
        "transfer_badge_percent",
        "withdraw_badge_percent",
      ]);

    if (error) {
      console.error("Error fetching action badge percentages:", error);
      return { addMoneyPercent: 0, transferPercent: 0, withdrawPercent: 0 };
    }

    const result = {
      addMoneyPercent: 0,
      transferPercent: 0,
      withdrawPercent: 0,
    };

    if (data) {
      for (const row of data) {
        if (row.key === "add_money_badge_percent") result.addMoneyPercent = Number(row.value) || 0;
        if (row.key === "transfer_badge_percent") result.transferPercent = Number(row.value) || 0;
        if (row.key === "withdraw_badge_percent") result.withdrawPercent = Number(row.value) || 0;
      }
    }

    return result;
  } catch (e) {
    console.error("Exception in getActionBadgePercentages:", e);
    return { addMoneyPercent: 0, transferPercent: 0, withdrawPercent: 0 };
  }
}
