import { describe, expect, it } from "vitest";
import { createDefaultPollConfig, isValidSlotId, isValidStatus } from "../src/lib/schema";
import { validateAnswersInput, validatePollCreateInput, validateResponseCreateInput } from "../src/lib/validation";

const slots = ["d0p0", "d0p1"];

describe("status validation", () => {
  it("accepts allowed statuses", () => {
    expect(isValidStatus("yes")).toBe(true);
    expect(isValidStatus("maybe")).toBe(true);
    expect(isValidStatus("no")).toBe(true);
  });

  it("rejects invalid statuses", () => {
    expect(isValidStatus("unknown")).toBe(false);
    expect(validateAnswersInput({ d0p0: "busy" }, slots).ok).toBe(false);
  });
});

describe("slot validation", () => {
  it("accepts known slot IDs", () => {
    expect(isValidSlotId(slots, "d0p0")).toBe(true);
  });

  it("rejects unknown slot IDs", () => {
    expect(isValidSlotId(slots, "d9p9")).toBe(false);
    expect(validateAnswersInput({ d9p9: "yes" }, slots).ok).toBe(false);
  });
});

describe("response validation", () => {
  it("rejects overlong name", () => {
    const result = validateResponseCreateInput(
      {
        name: "あ".repeat(51),
        comment: "",
        answers: {}
      },
      slots
    );

    expect(result.ok).toBe(false);
  });

  it("rejects malformed answer object", () => {
    expect(validateAnswersInput([], slots).ok).toBe(false);
    expect(validateAnswersInput(null, slots).ok).toBe(false);
  });

  it("accepts partial answers", () => {
    const result = validateResponseCreateInput(
      {
        name: "山田",
        comment: "",
        answers: {
          d0p0: "yes"
        }
      },
      slots
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.answers).toEqual({ d0p0: "yes" });
    }
  });
});

describe("poll creation validation", () => {
  it("accepts a valid date range", () => {
    const result = validatePollCreateInput({
      title: "来週の予定",
      description: "",
      startDate: "2026-05-07",
      endDate: "2026-05-10"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.startDate).toBe("2026-05-07");
      expect(result.value.endDate).toBe("2026-05-10");
    }
  });

  it("rejects an end date before the start date", () => {
    const result = validatePollCreateInput({
      title: "来週の予定",
      startDate: "2026-05-10",
      endDate: "2026-05-07"
    });

    expect(result.ok).toBe(false);
  });

  it("rejects date ranges longer than fourteen days", () => {
    const result = validatePollCreateInput({
      title: "来週の予定",
      startDate: "2026-05-01",
      endDate: "2026-05-15"
    });

    expect(result.ok).toBe(false);
  });
});

describe("poll config generation", () => {
  it("uses selected dates and adds the night period", () => {
    const config = createDefaultPollConfig({
      startDate: "2026-05-07",
      endDate: "2026-05-08"
    });

    expect(config.grid.days).toEqual([
      { id: "d0", label: "5/7(木)", date: "2026-05-07" },
      { id: "d1", label: "5/8(金)", date: "2026-05-08" }
    ]);
    expect(config.grid.periods.at(-1)).toEqual({ id: "p7", label: "夜間" });
    expect(config.grid.slots).toHaveLength(16);
  });
});
