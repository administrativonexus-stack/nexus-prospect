/**
 * Normalizes a Brazilian phone number to E.164-style digits (no +).
 *
 * Examples:
 *   "+55 (11) 98765-4321" → "5511987654321"
 *   "(11) 98765-4321"     → "5511987654321"
 *   "11987654321"         → "5511987654321"
 *   "987654321"           → "987654321" (ambiguous — returned unchanged)
 */
export function normalizePhone(raw: string | null): string | null {
  if (!raw) return null

  const digits = raw.replace(/\D/g, "")
  let normalized: string

  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    normalized = digits
  } else if (digits.length === 10 || digits.length === 11) {
    normalized = "55" + digits
  } else {
    // Cannot determine country code or DDD safely — keep raw
    return raw.trim() || null
  }

  // Final sanity: 55 + 2-digit DDD + 8-digit landline (12) or 9-digit mobile (13)
  if (normalized.length !== 12 && normalized.length !== 13) return raw.trim() || null
  return normalized
}

/**
 * Normalizes a URL to a consistent https:// form without trailing slash.
 * Returns the raw string unchanged if it cannot be parsed as a URL.
 */
export function normalizeUrl(raw: string | null): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`)
    return url.href.replace(/\/$/, "")
  } catch {
    return raw
  }
}
