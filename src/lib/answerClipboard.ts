import {
  UNANSWERED_LABEL,
  type AnswersMap,
  type PollConfig,
  type Status,
  isValidStatus
} from "./schema";
import { createEmptySummaryCell, type SummaryCell } from "./summary";

export type ApplyClipboardAnswersResult =
  | {
      ok: true;
      value: {
        answers: AnswersMap;
        appliedRows: number;
        appliedColumns: number;
        ignoredRows: number;
        ignoredColumns: number;
        counts: SummaryCell;
      };
    }
  | {
      ok: false;
      error: string;
    };

const FALLBACK_STATUS_LABELS: Record<Status, readonly string[]> = {
  yes: ["○", "◯"],
  maybe: ["△"],
  no: ["×", "x", "X"]
};

function cleanTsvCell(value: string): string {
  return value.replace(/[\t\r\n]+/g, " ").trim();
}

function normalizeClipboardText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n+$/g, "");
}

function createSlotByPosition(config: PollConfig) {
  return new Map(config.grid.slots.map((slot) => [`${slot.dayId}:${slot.periodId}`, slot]));
}

function statusToLabel(config: PollConfig, status: Status | undefined): string {
  return status ? config.statusLabels[status] : "";
}

function parseStatusToken(config: PollConfig, rawValue: string): Status | undefined | null {
  const value = rawValue.trim();
  if (value === "" || value === UNANSWERED_LABEL) {
    return undefined;
  }

  for (const status of Object.keys(config.statusLabels) as Status[]) {
    if (value === config.statusLabels[status] || FALLBACK_STATUS_LABELS[status].includes(value)) {
      return status;
    }
  }

  if (isValidStatus(value)) {
    return value;
  }

  return null;
}

function hasHeaderRow(config: PollConfig, rows: string[][]): boolean {
  const firstRow = rows[0] ?? [];
  const firstCell = cleanTsvCell(firstRow[0] ?? "");

  if (firstCell === "時限") {
    return true;
  }

  return config.grid.days.some((day, index) => cleanTsvCell(firstRow[index + 1] ?? "") === day.label);
}

function hasRowLabels(config: PollConfig, rows: string[][]): boolean {
  return config.grid.periods.some((period, index) => cleanTsvCell(rows[index]?.[0] ?? "") === period.label);
}

export function serializeAnswersToTsv(config: PollConfig, answers: AnswersMap): string {
  const slotByPosition = createSlotByPosition(config);
  const rows = [
    ["時限", ...config.grid.days.map((day) => cleanTsvCell(day.label))],
    ...config.grid.periods.map((period) => [
      cleanTsvCell(period.label),
      ...config.grid.days.map((day) => {
        const slot = slotByPosition.get(`${day.id}:${period.id}`);
        if (!slot?.enabled) {
          return "";
        }
        return statusToLabel(config, answers[slot.id]);
      })
    ])
  ];

  return rows.map((row) => row.join("\t")).join("\n");
}

export function applyClipboardAnswers(
  config: PollConfig,
  currentAnswers: AnswersMap,
  text: string
): ApplyClipboardAnswersResult {
  const normalizedText = normalizeClipboardText(text);
  if (normalizedText.trim() === "") {
    return { ok: false, error: "貼り付ける表データが空です。" };
  }

  const rows = normalizedText.split("\n").map((row) => row.split("\t"));
  const headerRow = hasHeaderRow(config, rows);
  const dataRows = headerRow ? rows.slice(1) : rows;
  const rowLabels = hasRowLabels(config, dataRows);
  const columnOffset = rowLabels ? 1 : 0;
  const headerColumnCount = headerRow ? Math.max(0, rows[0].length - columnOffset) : 0;
  const bodyColumnCount = Math.max(0, ...dataRows.map((row) => Math.max(0, row.length - columnOffset)));
  const sourceRows = dataRows.length;
  const sourceColumns = Math.max(headerColumnCount, bodyColumnCount);
  const appliedRows = Math.min(sourceRows, config.grid.periods.length);
  const appliedColumns = Math.min(sourceColumns, config.grid.days.length);

  if (appliedRows <= 0 || appliedColumns <= 0) {
    return { ok: false, error: "反映できる表データがありません。" };
  }

  const nextAnswers: AnswersMap = { ...currentAnswers };
  const counts = createEmptySummaryCell();
  const slotByPosition = createSlotByPosition(config);

  for (let rowIndex = 0; rowIndex < appliedRows; rowIndex += 1) {
    const period = config.grid.periods[rowIndex];
    const row = dataRows[rowIndex] ?? [];

    for (let columnIndex = 0; columnIndex < appliedColumns; columnIndex += 1) {
      const day = config.grid.days[columnIndex];
      const rawValue = row[columnIndex + columnOffset] ?? "";
      const status = parseStatusToken(config, rawValue);

      if (status === null) {
        return {
          ok: false,
          error: `「${rawValue.trim()}」は読み取れません。○ / △ / × / 空欄だけ貼り付けできます。`
        };
      }

      const slot = slotByPosition.get(`${day.id}:${period.id}`);
      if (!slot?.enabled) {
        continue;
      }

      if (status === undefined) {
        delete nextAnswers[slot.id];
        counts.unanswered += 1;
      } else {
        nextAnswers[slot.id] = status;
        counts[status] += 1;
      }
    }
  }

  return {
    ok: true,
    value: {
      answers: nextAnswers,
      appliedRows,
      appliedColumns,
      ignoredRows: Math.max(0, sourceRows - appliedRows),
      ignoredColumns: Math.max(0, sourceColumns - appliedColumns),
      counts
    }
  };
}
