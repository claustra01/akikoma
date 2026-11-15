import { describe, expect, it } from "vitest";
import { formatTimestamp, parseUtcTimestamp } from "../src/lib/display";

describe("parseUtcTimestamp", () => {
  it("treats SQLite CURRENT_TIMESTAMP values as UTC", () => {
    expect(parseUtcTimestamp("2026-11-15 08:49:52")?.toISOString()).toBe("2026-11-15T08:49:52.000Z");
  });

  it("accepts ISO-style values with T and Z", () => {
    expect(parseUtcTimestamp("2026-11-15T08:49:52Z")?.toISOString()).toBe("2026-11-15T08:49:52.000Z");
  });

  it("rejects other shapes", () => {
    expect(parseUtcTimestamp("")).toBeNull();
    expect(parseUtcTimestamp("2026/11/15 08:49")).toBeNull();
    expect(parseUtcTimestamp("not a date")).toBeNull();
  });
});

describe("formatTimestamp", () => {
  it("converts UTC to the poll timezone", () => {
    expect(formatTimestamp("2026-11-15 08:49:52", "Asia/Tokyo")).toBe("2026/11/15 17:49");
  });

  it("rolls over the date when the timezone offset crosses midnight", () => {
    expect(formatTimestamp("2026-11-15 20:30:00", "Asia/Tokyo")).toBe("2026/11/16 05:30");
  });

  it("uses 00 rather than 24 for midnight", () => {
    expect(formatTimestamp("2026-11-15 15:00:00", "Asia/Tokyo")).toBe("2026/11/16 00:00");
  });

  it("falls back to the raw value when it cannot be parsed", () => {
    expect(formatTimestamp("unknown", "Asia/Tokyo")).toBe("unknown");
  });

  it("falls back to the raw value for an unknown timezone", () => {
    expect(formatTimestamp("2026-11-15 08:49:52", "Not/AZone")).toBe("2026-11-15 08:49:52");
  });
});
