export const STATUSES = ["yes", "maybe", "no"] as const;

export type Status = (typeof STATUSES)[number];

export type StatusLabels = Record<Status, string>;

export type DayDefinition = {
  id: string;
  label: string;
};

export type PeriodDefinition = {
  id: string;
  label: string;
};

export type SlotDefinition = {
  id: string;
  dayId: string;
  periodId: string;
  enabled: boolean;
};

export type PollConfig = {
  schemaVersion: 1;
  timezone: string;
  grid: {
    days: DayDefinition[];
    periods: PeriodDefinition[];
    slots: SlotDefinition[];
  };
  statusLabels: StatusLabels;
};

export type AnswersMap = Partial<Record<string, Status>>;

export type ResponseAnswersJson = {
  schemaVersion: 1;
  answers: AnswersMap;
};

export type PollDto = {
  slug: string;
  title: string;
  description: string | null;
  isClosed: boolean;
  updatedAt?: string;
};

export type ResponseDto = {
  id: string;
  name: string;
  comment: string | null;
  answers: AnswersMap;
  version: number;
  updatedAt?: string;
};

export const DEFAULT_STATUS_LABELS: StatusLabels = {
  yes: "○",
  maybe: "△",
  no: "×"
};

export const UNANSWERED_LABEL = "未回答";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidStatus(value: unknown): value is Status {
  return typeof value === "string" && STATUSES.includes(value as Status);
}

export function createDefaultPollConfig(timezone = "Asia/Tokyo"): PollConfig {
  const days: DayDefinition[] = ["月", "火", "水", "木", "金", "土", "日"].map((label, index) => ({
    id: `d${index}`,
    label
  }));

  const periods: PeriodDefinition[] = Array.from({ length: 7 }, (_, index) => ({
    id: `p${index}`,
    label: `${index + 1}限`
  }));

  const slots: SlotDefinition[] = days.flatMap((day) =>
    periods.map((period) => ({
      id: `${day.id}${period.id}`,
      dayId: day.id,
      periodId: period.id,
      enabled: true
    }))
  );

  return {
    schemaVersion: 1,
    timezone,
    grid: {
      days,
      periods,
      slots
    },
    statusLabels: DEFAULT_STATUS_LABELS
  };
}

export function getEnabledSlots(config: PollConfig): SlotDefinition[] {
  return config.grid.slots.filter((slot) => slot.enabled);
}

export function getEnabledSlotIds(config: PollConfig): string[] {
  return getEnabledSlots(config).map((slot) => slot.id);
}

export function isValidSlotId(slotIds: readonly string[], slotId: string): boolean {
  return slotIds.includes(slotId);
}

export function makeResponseAnswersJson(answers: AnswersMap): ResponseAnswersJson {
  return {
    schemaVersion: 1,
    answers
  };
}
