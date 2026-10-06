import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { HttpError } from "./http.ts";

export async function consumeCredits(
  admin: SupabaseClient,
  userId: string,
  cost = 1,
): Promise<number> {
  const { data, error } = await admin.rpc("consume_credits", {
    p_user_id: userId,
    p_cost: cost,
  });
  if (error) {
    console.error("[credits] consume", error);
    throw new HttpError(500, "Credit system error", "CREDIT_ERROR");
  }
  if (data === null || data === undefined) {
    throw new HttpError(402, "Insufficient credits", "INSUFFICIENT_CREDITS");
  }
  return data as number;
}

export async function refundCredits(
  admin: SupabaseClient,
  userId: string,
  cost = 1,
): Promise<void> {
  const { error } = await admin.rpc("refund_credits", {
    p_user_id: userId,
    p_cost: cost,
  });
  if (error) console.error("[credits] refund FAILED for", userId, error);
}
