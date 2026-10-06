import { HttpError } from "./http.ts";

/** Parse la sortie du LLM (response_format json_object) avec repli sécurisé. */
export function parseLlmJson<T = Record<string, unknown>>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1)) as T;
      } catch { /* fallthrough */ }
    }
    console.error("[llm] unparseable output:", raw.slice(0, 500));
    throw new HttpError(502, "Analysis returned an invalid format", "LLM_BAD_JSON");
  }
}
