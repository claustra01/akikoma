import { describe, expect, it } from "vitest";
import { applyClipboardAnswers, serializeAnswersToTsv } from "../src/lib/answerClipboard";
import { createDefaultPollConfig, type PollConfig } from "../src/lib/schema";

function makeConfig(days = 3, periods = 3): PollConfig {
  const config = createDefaultPollConfig({
    startDate: "2026-06-23",
    endDate: `2026-06-${22 + days}`,
    startPeriod: 1,
    endPeriod: periods
  });

  return config;
}

describe("serializeAnswersToTsv", () => {
  it("exports answers as a spreadsheet-friendly table", () => {
    const config = makeConfig(2, 2);

    expect(serializeAnswersToTsv(config, { d0p1: "yes", d1p1: "maybe", d0p2: "no" })).toBe(
      "時限\t6/23(火)\t6/24(水)\n1限\t○\t△\n2限\t×\t"
    );
  });
});

describe("applyClipboardAnswers", () => {
  it("imports copied TSV back into answers", () => {
    const config = makeConfig(2, 2);
    const text = serializeAnswersToTsv(config, { d0p1: "yes", d1p1: "maybe", d0p2: "no" });
    const result = applyClipboardAnswers(config, {}, text);

    expect(result).toEqual({
      ok: true,
      value: {
        answers: { d0p1: "yes", d1p1: "maybe", d0p2: "no" },
        appliedRows: 2,
        appliedColumns: 2,
        ignoredRows: 0,
        ignoredColumns: 0,
        counts: { yes: 1, maybe: 1, no: 1, unanswered: 1 }
      }
    });
  });

  it("applies smaller pasted data to the top-left and preserves untouched answers", () => {
    const config = makeConfig(3, 3);
    const result = applyClipboardAnswers(config, { d2p3: "yes" }, "○\t△\n×\t");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.answers).toEqual({
        d0p1: "yes",
        d1p1: "maybe",
        d0p2: "no",
        d2p3: "yes"
      });
      expect(result.value.counts).toEqual({ yes: 1, maybe: 1, no: 1, unanswered: 1 });
    }
  });

  it("clears existing answers when blank cells are pasted inside the applied range", () => {
    const config = makeConfig(2, 2);
    const result = applyClipboardAnswers(config, { d0p1: "yes", d1p1: "no" }, "\t△");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.answers).toEqual({ d1p1: "maybe" });
      expect(result.value.counts).toEqual({ yes: 0, maybe: 1, no: 0, unanswered: 1 });
    }
  });

  it("ignores pasted rows and columns that overflow the current grid", () => {
    const config = makeConfig(2, 2);
    const result = applyClipboardAnswers(config, {}, "○\t△\tignored\n×\t\talso ignored\nignored\tignored\tignored");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.answers).toEqual({
        d0p1: "yes",
        d1p1: "maybe",
        d0p2: "no"
      });
      expect(result.value.ignoredRows).toBe(1);
      expect(result.value.ignoredColumns).toBe(1);
    }
  });

  it("ignores disabled target slots without changing existing answers", () => {
    const config = makeConfig(2, 2);
    config.grid.slots = config.grid.slots.map((slot) => (slot.id === "d1p1" ? { ...slot, enabled: false } : slot));
    const result = applyClipboardAnswers(config, { d1p1: "no" }, "○\t△");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.answers).toEqual({
        d0p1: "yes",
        d1p1: "no"
      });
    }
  });

  it("rejects unknown values within the applied range", () => {
    const config = makeConfig(2, 2);
    const result = applyClipboardAnswers(config, {}, "○\t?");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("読み取れません");
    }
  });
});
