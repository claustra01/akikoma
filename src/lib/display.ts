// Pure display helpers shared by UI components.

const SQLITE_UTC_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?Z?$/;

/**
 * Parses a D1/SQLite `CURRENT_TIMESTAMP` value ("YYYY-MM-DD HH:MM:SS", always UTC).
 * Returns null when the value is not in that shape.
 */
export function parseUtcTimestamp(value: string): Date | null {
  const match = SQLITE_UTC_TIMESTAMP.exec(value.trim());
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a UTC timestamp from the API in the poll timezone, e.g. "2026/11/15 17:49".
 * Falls back to the raw value when it cannot be parsed or the timezone is unknown.
 */
export function formatTimestamp(value: string, timeZone: string): string {
  const date = parseUtcTimestamp(value);
  if (!date) {
    return value;
  }

  try {
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).format(date);
  } catch {
    // Unknown timezone: keep the original UTC text rather than showing a wrong local time.
    return value;
  }
}
