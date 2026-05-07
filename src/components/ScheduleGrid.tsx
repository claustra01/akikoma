import { type AnswersMap, type PollConfig, type Status } from "../lib/schema";

type ScheduleGridProps = {
  config: PollConfig;
  answers: AnswersMap;
  onChange: (answers: AnswersMap) => void;
  disabled?: boolean;
  idPrefix: string;
};

const STATUS_OPTIONS: Status[] = ["yes", "maybe", "no"];

export default function ScheduleGrid({ config, answers, onChange, disabled = false, idPrefix }: ScheduleGridProps) {
  const slotByPosition = new Map(config.grid.slots.map((slot) => [`${slot.dayId}:${slot.periodId}`, slot]));

  const updateAnswer = (slotId: string, status: Status) => {
    const next = { ...answers };

    if (next[slotId] === status) {
      delete next[slotId];
    } else {
      next[slotId] = status;
    }

    onChange(next);
  };

  const updateDayAnswers = (dayId: string, status: "yes" | "no") => {
    const next = { ...answers };
    for (const slot of config.grid.slots) {
      if (slot.dayId === dayId && slot.enabled) {
        next[slot.id] = status;
      }
    }

    onChange(next);
  };

  const renderDayBulkButtons = (dayLabel: string, dayId: string, view: "desktop" | "mobile") => (
    <div className="bulk-status-buttons" role="group" aria-label={`${dayLabel} 一括入力`}>
      {(["yes", "no"] as const).map((status) => (
        <button
          key={status}
          id={`${idPrefix}-${view}-${dayId}-bulk-${status}`}
          className={`bulk-status-button status-${status}`}
          type="button"
          aria-label={`${dayLabel} を一括で ${config.statusLabels[status]} にする`}
          onClick={() => updateDayAnswers(dayId, status)}
          disabled={disabled}
        >
          All {config.statusLabels[status]}
        </button>
      ))}
    </div>
  );

  const renderStatusButtons = (slotId: string, label: string, view: "desktop" | "mobile") => (
    <div className="status-buttons" role="group" aria-label={label}>
      {STATUS_OPTIONS.map((status) => {
        const selected = answers[slotId] === status;
        return (
          <button
            key={status}
            id={`${idPrefix}-${view}-${slotId}-${status}`}
            className={`status-button status-${status}${selected ? " is-selected" : ""}`}
            type="button"
            aria-pressed={selected}
            aria-label={`${label} ${config.statusLabels[status]}`}
            onClick={() => updateAnswer(slotId, status)}
            disabled={disabled}
          >
            {config.statusLabels[status]}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="grid-scroll input-grid-desktop" role="region" aria-label="予定入力表" tabIndex={0}>
        <table className="schedule-table">
          <thead>
            <tr>
              <th scope="col">時限</th>
              {config.grid.days.map((day) => (
                <th scope="col" key={day.id}>
                  <div className="schedule-day-head">
                    <span>{day.label}</span>
                    {renderDayBulkButtons(day.label, day.id, "desktop")}
                  </div>
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
                    <td key={day.id}>
                      {renderStatusButtons(slot.id, `${day.label} ${period.label}`, "desktop")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="schedule-mobile-list" aria-label="予定入力リスト">
        {config.grid.days.map((day) => (
          <section className="schedule-mobile-day" key={day.id} aria-labelledby={`${idPrefix}-${day.id}-heading`}>
            <div className="schedule-mobile-day-head">
              <h3 id={`${idPrefix}-${day.id}-heading`}>{day.label}</h3>
              {renderDayBulkButtons(day.label, day.id, "mobile")}
            </div>
            <div className="schedule-mobile-slots">
              {config.grid.periods.map((period) => {
                const slot = slotByPosition.get(`${day.id}:${period.id}`);
                if (!slot || !slot.enabled) {
                  return null;
                }

                return (
                  <div className="schedule-mobile-slot" key={period.id}>
                    <div className="schedule-mobile-slot-label">{period.label}</div>
                    {renderStatusButtons(slot.id, `${day.label} ${period.label}`, "mobile")}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
