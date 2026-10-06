import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { HttpError } from "./http.ts";

// Limite harmonisée pour toutes les fonctions d'analyse
export const ANALYSIS_LIMIT = { limit: 20, windowSeconds: 3600 };

export async function enforceRateLimit(
  admin: SupabaseClient,
  key: string,
  limit = ANALYSIS_LIMIT.limit,
  windowSeconds = ANALYSIS_LIMIT.windowSeconds,
): Promise<void> {
  const { data, error } = await admin.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit]", error);
    throw new HttpError(503, "Rate limiter unavailable", "RATE_LIMIT_ERROR");
  }
  if (data !== true) {
    throw new HttpError(429, "Too many requests, try again later", "RATE_LIMITED");
  }
}
