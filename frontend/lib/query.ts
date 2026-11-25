export function buildQuery(params: Record<string, string | number>): string {
  const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  return query ? `?${query}` : "";
}
