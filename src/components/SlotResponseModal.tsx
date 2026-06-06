import { useEffect, useMemo, useRef } from "react";
import { UNANSWERED_LABEL, type StatusLabels } from "../lib/schema";
import type { SlotResponseDetail, SlotResponseStatus } from "../lib/summary";

type SlotResponseModalProps = {
  isOpen: boolean;
  dayLabel: string;
  periodLabel: string;
  details: SlotResponseDetail[];
  statusLabels: StatusLabels;
  onClose: () => void;
};

const STATUS_GROUPS: readonly SlotResponseStatus[] = ["yes", "maybe", "no", "unanswered"];

function getStatusLabel(status: SlotResponseStatus, statusLabels: StatusLabels): string {
  if (status === "unanswered") {
    return UNANSWERED_LABEL;
  }
  return statusLabels[status];
}

export default function SlotResponseModal({
  isOpen,
  dayLabel,
  periodLabel,
  details,
  statusLabels,
  onClose
}: SlotResponseModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const groupedDetails = useMemo(() => {
    const groups: Record<SlotResponseStatus, SlotResponseDetail[]> = {
      yes: [],
      maybe: [],
      no: [],
      unanswered: []
    };

    for (const detail of details) {
      groups[detail.status].push(detail);
    }

    return groups;
  }, [details]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="slot-response-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-response-modal-title"
      >
        <header className="slot-response-modal-head">
          <div className="slot-response-modal-title">
            <p className="eyebrow">DETAIL</p>
            <h2 id="slot-response-modal-title">{dayLabel} {periodLabel}</h2>
            <p>参加者別回答</p>
          </div>
          <button ref={closeButtonRef} className="modal-close-button" type="button" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </header>

        <div className="slot-response-modal-body">
          {details.length === 0 ? (
            <p className="muted">まだ回答はありません。</p>
          ) : (
            <div className="slot-response-groups">
              {STATUS_GROUPS.map((status) => {
                const group = groupedDetails[status];
                return (
                  <section className={`slot-response-group slot-response-group-${status}`} key={status}>
                    <div className="slot-response-group-head">
                      <span className="slot-response-status">
                        <span>{getStatusLabel(status, statusLabels)}</span>
                      </span>
                      <span className="slot-response-count">{group.length}人</span>
                    </div>

                    {group.length > 0 ? (
                      <ul className="slot-response-list">
                        {group.map((detail) => (
                          <li key={detail.responseId}>
                            <span className="slot-response-name">{detail.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="slot-response-empty">該当なし</p>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
