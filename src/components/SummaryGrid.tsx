import { UNANSWERED_LABEL, type PollConfig, type SlotDefinition } from "../lib/schema";
import { getAvailabilityHighlight, getRankedScores, type Summary } from "../lib/summary";

export type SummarySlotSelection = {
  slot: SlotDefinition;
  dayLabel: string;
  periodLabel: string;
};

type SummaryGridProps = {
  config: PollConfig;
  summary: Summary;
  selectedSlotId?: string | null;
  onSlotSelect?: (selection: SummarySlotSelection) => void;
};

export default function SummaryGrid({ config, summary, selectedSlotId, onSlotSelect }: SummaryGridProps) {
  const slotByPosition = new Map(config.grid.slots.map((slot) => [`${slot.dayId}:${slot.periodId}`, slot]));
  const rankedScores = getRankedScores(summary);
  const getCell = (slotId: string) =>
    summary[slotId] ?? {
      yes: 0,
      maybe: 0,
      no: 0,
      unanswered: 0
    };

  const getHighlightClassName = (slotId: string) => {
    const cell = getCell(slotId);
    const highlight = getAvailabilityHighlight(cell, rankedScores);
    return highlight !== "none" ? `summary-highlight summary-highlight-${highlight}` : "";
  };

  const renderCounts = (slotId: string) => {
    const cell = getCell(slotId);
    return (
      <>
        <span className="summary-count">{config.statusLabels.yes} {cell.yes}</span>
        <span className="summary-count">{config.statusLabels.maybe} {cell.maybe}</span>
        <span className="summary-count">{config.statusLabels.no} {cell.no}</span>
        <span className="summary-count">
          <span className="summary-label-full">{UNANSWERED_LABEL}</span>
          <span className="summary-label-short">未</span> {cell.unanswered}
        </span>
      </>
    );
  };

  return (
    <div className="grid-scroll summary-grid" role="region" aria-label="集計表" tabIndex={0}>
      <table className="summary-table">
        <thead>
          <tr>
            <th scope="col">時限</th>
            {config.grid.days.map((day) => (
              <th scope="col" key={day.id}>
                {day.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {config.grid.periods.map((period) => (
            <tr key={period.id}>
              <th scope="row">{period.label}</th>
              {config.grid.days.map((day) => {
                const slot = slotByPosition.get(`${day.id}:${period.id}`);
                if (!slot || !slot.enabled) {
                  return (
                    <td key={day.id} className="disabled-cell">
                      対象外
                    </td>
                  );
                }

                return (
                  <td key={day.id} className={getHighlightClassName(slot.id) || undefined}>
                    <button
                      className={`summary-cell summary-slot-button${selectedSlotId === slot.id ? " is-selected" : ""}`}
                      type="button"
                      onClick={() => onSlotSelect?.({ slot, dayLabel: day.label, periodLabel: period.label })}
                      aria-label={`${day.label} ${period.label} の参加者別回答を表示`}
                    >
                      {renderCounts(slot.id)}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
