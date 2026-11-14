/** Escapes PostgreSQL LIKE/ILIKE wildcards (`\`, `%`, `_`) in user search terms. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}
