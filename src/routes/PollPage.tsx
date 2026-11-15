import { useCallback, useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import ParticipantFilter from "../components/ParticipantFilter";
import ResponseList from "../components/ResponseList";
import SlotResponseModal from "../components/SlotResponseModal";
import SummaryGrid from "../components/SummaryGrid";
import type { SummarySlotSelection } from "../components/SummaryGrid";
import { ApiClientError, getPoll, type PollReadPayload } from "../lib/api";
import { saveRecentPoll } from "../lib/recentPolls";
import { getEnabledSlotIds } from "../lib/schema";
import { computeSummary, getSlotResponseDetails } from "../lib/summary";

type PollPageProps = {
  slug: string;
};

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return "通信に失敗しました";
}

export default function PollPage({ slug }: PollPageProps) {
  const [payload, setPayload] = useState<PollReadPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<SummarySlotSelection | null>(null);
  const [selectedResponseIds, setSelectedResponseIds] = useState<Set<string> | null>(null);

  const loadPoll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await getPoll(slug);
      setPayload(next);
      saveRecentPoll(next.poll);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadPoll();
  }, [loadPoll]);

  useEffect(() => {
    setSelectedSlot(null);
    setSelectedResponseIds(null);
  }, [slug]);

  const closeSlotModal = useCallback(() => {
    setSelectedSlot(null);
  }, []);

  const selectedResponses = useMemo(() => {
    if (!payload) {
      return [];
    }
    return payload.responses.filter((response) => selectedResponseIds === null || selectedResponseIds.has(response.id));
  }, [payload, selectedResponseIds]);

  const filteredSummary = useMemo(() => {
    if (!payload) {
      return null;
    }
    return selectedResponseIds === null
      ? payload.summary
      : computeSummary(getEnabledSlotIds(payload.config), selectedResponses);
  }, [payload, selectedResponseIds, selectedResponses]);

  const toggleResponse = (id: string) => {
    setSelectedResponseIds((current) => {
      const next = new Set(current ?? payload?.responses.map((response) => response.id) ?? []);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedSlotDetails = useMemo(() => {
    if (!payload || !selectedSlot) {
      return [];
    }

    return getSlotResponseDetails(selectedSlot.slot.id, selectedResponses);
  }, [payload, selectedSlot, selectedResponses]);

  if (loading && payload === null) {
    return <LoadingSpinner />;
  }

  if (error && payload === null) {
    return (
      <section className="page-section">
        <p className="message message-error">{error}</p>
      </section>
    );
  }

  if (payload === null) {
    return null;
  }

  return (
    <section className="page-section">
      <div className="section-heading split-heading">
        <div>
          <h1>{payload.poll.title}</h1>
          {payload.poll.description && <p>{payload.poll.description}</p>}
        </div>
        <span className={`state-badge ${payload.poll.isClosed ? "state-closed" : "state-open"}`}>
          {payload.poll.isClosed ? "締切済み" : "受付中"}
        </span>
      </div>

      {error && <p className="message message-error">{error}</p>}

      <section className="surface">
        <section className="stack" aria-labelledby="summary-title">
          <div className="section-heading">
            <h2 id="summary-title">集計結果</h2>
          </div>
          {payload.responses.length > 0 && (
            <ParticipantFilter
              responses={payload.responses}
              selectedIds={selectedResponseIds}
              selectedCount={selectedResponses.length}
              onToggle={toggleResponse}
              onSelectAll={() => setSelectedResponseIds(null)}
              onClear={() => setSelectedResponseIds(new Set())}
            />
          )}
          <SummaryGrid
            config={payload.config}
            summary={filteredSummary ?? payload.summary}
            selectedSlotId={selectedSlot?.slot.id ?? null}
            onSlotSelect={setSelectedSlot}
          />
          {!payload.poll.isClosed && (
            <div className="actions">
              <a className="button button-primary" href={`/p/${slug}/poll`}>
                回答する
              </a>
            </div>
          )}
        </section>

        <section className="stack" aria-labelledby="responses-title">
          <div className="section-heading">
            <h2 id="responses-title">回答一覧</h2>
          </div>
          <ResponseList slug={slug} config={payload.config} responses={payload.responses} />
        </section>
      </section>

      <SlotResponseModal
        isOpen={selectedSlot !== null}
        dayLabel={selectedSlot?.dayLabel ?? ""}
        periodLabel={selectedSlot?.periodLabel ?? ""}
        details={selectedSlotDetails}
        emptyMessage={payload.responses.length > 0 ? "表示する参加者が選択されていません。" : undefined}
        statusLabels={payload.config.statusLabels}
        onClose={closeSlotModal}
      />
    </section>
  );
}
