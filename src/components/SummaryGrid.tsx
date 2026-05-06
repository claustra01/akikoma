import { UNANSWERED_LABEL, type PollConfig } from "../lib/schema";
import type { Summary } from "../lib/summary";

type SummaryGridProps = {
  config: PollConfig;
  summary: Summary;
};

export default function SummaryGrid({ config, summary }: SummaryGridProps) {
  const slotByPosition = new Map(config.grid.slots.map((slot) => [`${slot.dayId}:${slot.periodId}`, slot]));

  return (
    <div className="grid-scroll" role="region" aria-label="集計表" tabIndex={0}>
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

                const cell = summary[slot.id] ?? {
                  yes: 0,
                  maybe: 0,
                  no: 0,
                  unanswered: 0
                };

                return (
                  <td key={day.id}>
                    <div className="summary-cell" aria-label={`${day.label} ${period.label} の集計`}>
                      <span>{config.statusLabels.yes} {cell.yes}</span>
                      <span>{config.statusLabels.maybe} {cell.maybe}</span>
                      <span>{config.statusLabels.no} {cell.no}</span>
                      <span>{UNANSWERED_LABEL} {cell.unanswered}</span>
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
