import { type AnswersMap, type Status, isValidStatus } from "./schema";

export type SummaryCell = {
  yes: number;
  maybe: number;
  no: number;
  unanswered: number;
};

export type Summary = Record<string, SummaryCell>;

export type AvailabilityHighlight = "best" | "second" | "none";

export type RankedSummaryScores = {
  best: number;
  second: number;
};

const STATUS_SCORES: Record<Status, number> = {
  yes: 2,
  maybe: 1,
  no: 0
};

export type SummaryResponseInput = {
  answers: Record<string, unknown> | AnswersMap;
};

export function createEmptySummaryCell(): SummaryCell {
  return {
    yes: 0,
    maybe: 0,
    no: 0,
    unanswered: 0
  };
}

export function computeSummary(
  enabledSlotIds: readonly string[],
  responses: readonly SummaryResponseInput[]
): Summary {
  const summary: Summary = {};

  for (const slotId of enabledSlotIds) {
    summary[slotId] = createEmptySummaryCell();
  }

  for (const response of responses) {
    for (const slotId of enabledSlotIds) {
      const status = response.answers[slotId];
      if (isValidStatus(status)) {
        summary[slotId][status] += 1;
      } else {
        summary[slotId].unanswered += 1;
      }
    }
  }

  return summary;
}

export function countAnswers(enabledSlotIds: readonly string[], answers: AnswersMap): SummaryCell {
  const counts = createEmptySummaryCell();

  for (const slotId of enabledSlotIds) {
    const status = answers[slotId] as Status | undefined;
    if (status === undefined) {
      counts.unanswered += 1;
    } else {
      counts[status] += 1;
    }
  }

  return counts;
}

export function getSummaryScore(cell: SummaryCell): number {
  return cell.yes * STATUS_SCORES.yes + cell.maybe * STATUS_SCORES.maybe + cell.no * STATUS_SCORES.no;
}

export function getRankedScores(summary: Summary): RankedSummaryScores {
  const scores = [...new Set(Object.values(summary).map(getSummaryScore).filter((score) => score > 0))].sort(
    (a, b) => b - a
  );

  return {
    best: scores[0] ?? 0,
    second: scores[1] ?? 0
  };
}

export function getAvailabilityHighlight(cell: SummaryCell, rankedScores: RankedSummaryScores): AvailabilityHighlight {
  const score = getSummaryScore(cell);

  if (score <= 0) {
    return "none";
  }

  if (score === rankedScores.best) {
    return "best";
  }

  if (score === rankedScores.second) {
    return "second";
  }

  return "none";
}
