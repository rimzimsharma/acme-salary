type Param = string | number | null | undefined;

/** Builds "?a=1&b=2", dropping blank values so the API only receives real filters. */
export function buildQuery(params: Record<string, Param>): string {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(([k, v]) => [k, String(v)]);
  const query = new URLSearchParams(entries).toString();
  return query ? `?${query}` : "";
}
