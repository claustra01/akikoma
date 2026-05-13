import { UNANSWERED_LABEL, type PollConfig } from "../lib/schema";
import { getAvailabilityHighlight, getRankedScores, type Summary } from "../lib/summary";

type SummaryGridProps = {
  config: PollConfig;
  summary: Summary;
};

export default function SummaryGrid({ config, summary }: SummaryGridProps) {
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
                    <div className="summary-cell" aria-label={`${day.label} ${period.label} の集計`}>
                      {renderCounts(slot.id)}
                    </div>
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
