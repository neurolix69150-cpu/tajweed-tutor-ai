import {
  createClient,
  type SupabaseClient,
  type User,
} from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { HttpError } from "./http.ts";

export function adminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function requireUser(
  req: Request,
  admin: SupabaseClient,
): Promise<User> {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new HttpError(401, "Missing authorization token", "NO_TOKEN");

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    throw new HttpError(401, "Invalid or expired token", "INVALID_TOKEN");
  }
  return data.user;
}
