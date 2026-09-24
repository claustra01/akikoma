import type { ResponseDto } from "../lib/schema";

type ParticipantFilterProps = {
  responses: ResponseDto[];
  selectedIds: ReadonlySet<string> | null;
  selectedCount: number;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
};

export default function ParticipantFilter({
  responses,
  selectedIds,
  selectedCount,
  onToggle,
  onSelectAll,
  onClear
}: ParticipantFilterProps) {
  if (responses.length === 0) {
    return null;
  }

  return (
    <section className="participant-filter" aria-labelledby="participant-filter-title">
      <div className="participant-filter-heading">
        <h2 id="participant-filter-title">集計する参加者</h2>
        <span className="participant-filter-count" aria-live="polite">
          {selectedCount} / {responses.length}人を表示
        </span>
      </div>

      <div className="participant-filter-actions actions">
        <button className="button button-secondary" type="button" onClick={onSelectAll} disabled={selectedCount === responses.length}>
          全員を選択
        </button>
        <button className="button button-secondary" type="button" onClick={onClear} disabled={selectedCount === 0}>
          選択を解除
        </button>
      </div>

      <div className="participant-filter-list" role="group" aria-label="集計する参加者を選択" tabIndex={0}>
        {responses.map((response) => (
          <label className="participant-filter-option" key={response.id}>
            <input
              type="checkbox"
              checked={selectedIds === null || selectedIds.has(response.id)}
              onChange={() => onToggle(response.id)}
            />
            <span>{response.name}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
