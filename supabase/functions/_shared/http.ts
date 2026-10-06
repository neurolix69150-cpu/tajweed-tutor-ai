import { corsHeaders } from "./cors.ts";

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

export function errorResponse(req: Request, err: unknown): Response {
  if (err instanceof HttpError) {
    return json(req, { error: err.message, code: err.code }, err.status);
  }
  console.error("[unhandled]", err);
  return json(req, { error: "Internal server error" }, 500);
}
