// Origines de production uniquement. localhost / previews Lovable :
// à ajouter via le secret ALLOWED_ORIGINS (séparées par des virgules).
const DEFAULT_ALLOWED_ORIGINS = [
  "https://tajweedtutorai.com",
  "https://www.tajweedtutorai.com",
];

function allowedOrigins(): string[] {
  const extra = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...extra])];
}

export function isOriginAllowed(req: Request): boolean {
  const origin = req.headers.get("Origin");
  // Pas d'Origin = appel serveur-à-serveur ; l'auth JWT reste obligatoire.
  if (!origin) return true;
  return allowedOrigins().includes(origin);
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = allowedOrigins().includes(origin)
    ? origin
    : DEFAULT_ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function handlePreflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
