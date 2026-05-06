import { UNANSWERED_LABEL, type AnswersMap, type PollConfig, type Status } from "../lib/schema";

type ScheduleGridProps = {
  config: PollConfig;
  answers: AnswersMap;
  onChange: (answers: AnswersMap) => void;
  disabled?: boolean;
  idPrefix: string;
};

function statusFromValue(value: string): Status | undefined {
  if (value === "yes" || value === "maybe" || value === "no") {
    return value;
  }
  return undefined;
}

export default function ScheduleGrid({ config, answers, onChange, disabled = false, idPrefix }: ScheduleGridProps) {
  const slotByPosition = new Map(config.grid.slots.map((slot) => [`${slot.dayId}:${slot.periodId}`, slot]));

  const updateAnswer = (slotId: string, value: string) => {
    const next = { ...answers };
    const status = statusFromValue(value);

    if (status === undefined) {
      delete next[slotId];
    } else {
      next[slotId] = status;
    }

    onChange(next);
  };

  return (
    <div className="grid-scroll" role="region" aria-label="予定入力表" tabIndex={0}>
      <table className="schedule-table">
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
                const selectId = `${idPrefix}-${day.id}-${period.id}`;

                if (!slot || !slot.enabled) {
                  return (
                    <td key={day.id} className="disabled-cell">
                      対象外
                    </td>
                  );
                }

                return (
                  <td key={day.id}>
                    <label className="sr-only" htmlFor={selectId}>
                      {day.label} {period.label}
                    </label>
                    <select
                      id={selectId}
                      className="status-select"
                      value={answers[slot.id] ?? ""}
                      onChange={(event) => updateAnswer(slot.id, event.currentTarget.value)}
                      disabled={disabled}
                    >
                      <option value="">{UNANSWERED_LABEL}</option>
                      <option value="yes">{config.statusLabels.yes}</option>
                      <option value="maybe">{config.statusLabels.maybe}</option>
                      <option value="no">{config.statusLabels.no}</option>
                    </select>
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
