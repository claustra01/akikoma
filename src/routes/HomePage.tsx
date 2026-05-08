import { useEffect, useState } from "react";
import { readRecentPolls, removeRecentPoll, type RecentPoll } from "../lib/recentPolls";

function formatAccessedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default function HomePage() {
  const [recentPolls, setRecentPolls] = useState<RecentPoll[]>([]);

  useEffect(() => {
    setRecentPolls(readRecentPolls());
  }, []);

  const handleRemoveRecent = (slug: string) => {
    setRecentPolls(removeRecentPoll(slug));
  };

  return (
    <section className="page-section home-page">
      <div className="home-dashboard">
        <section className="home-create-panel">
          <h1>みんなの空きコマ</h1>
          <p>みんなの空きコマを自動で集計！</p>
          <div className="actions home-actions">
            <a className="button button-primary" href="/new">
              新規作成
            </a>
          </div>
        </section>

        <section className="recent-section">
          <div className="section-heading recent-heading">
            <h2>最近のアクセス</h2>
          </div>
          {recentPolls.length === 0 ? (
            <p className="recent-empty muted">最近開いた予定はありません。</p>
          ) : (
            <div className="recent-list">
              {recentPolls.map((poll) => (
                <RecentPollItem poll={poll} key={poll.slug} onRemove={handleRemoveRecent} />
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function RecentPollItem({ poll, onRemove }: { poll: RecentPoll; onRemove: (slug: string) => void }) {
  const accessedAt = formatAccessedAt(poll.lastAccessedAt);

  return (
    <article className="recent-item">
      <a className="recent-item-main" href={`/p/${poll.slug}`}>
        <span className="recent-title">{poll.title}</span>
        {poll.description && <p className="recent-description">{poll.description}</p>}
        {accessedAt && <span className="recent-meta">最終アクセス {accessedAt}</span>}
      </a>
      <button
        className="recent-remove-button"
        type="button"
        onClick={() => onRemove(poll.slug)}
        aria-label={`${poll.title} を最近のアクセスから削除`}
        title="履歴削除"
      >
        ×
      </button>
    </article>
  );
}
