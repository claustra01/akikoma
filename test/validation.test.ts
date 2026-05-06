import { describe, expect, it } from "vitest";
import { isValidSlotId, isValidStatus } from "../src/lib/schema";
import { validateAnswersInput, validateResponseCreateInput } from "../src/lib/validation";

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
