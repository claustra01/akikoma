import { FormEvent, useState } from "react";
import { ApiClientError, createPoll, type CreatePollPayload } from "../lib/api";

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return "通信に失敗しました";
}

export default function NewPollPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CreatePollPayload | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const created = await createPoll({ title, description });
      setResult(created);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="eyebrow">新規作成</p>
        <h1>予定調整を作成</h1>
      </div>

      <form className="surface form-stack" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="poll-title">タイトル</label>
          <input
            id="poll-title"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            maxLength={100}
            required
            disabled={busy}
          />
        </div>

        <div className="form-row">
          <label htmlFor="poll-description">説明</label>
          <textarea
            id="poll-description"
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            maxLength={1000}
            rows={5}
            disabled={busy}
          />
        </div>

        {error && <p className="message message-error">{error}</p>}

        <div className="actions">
          <button className="button button-primary" type="submit" disabled={busy}>
            {busy ? "作成中..." : "作成する"}
          </button>
        </div>
      </form>

      {result && (
        <section className="surface result-panel" aria-live="polite">
          <h2>作成しました</h2>
          <dl className="link-list">
            <div>
              <dt>公開 URL</dt>
              <dd>
                <a href={result.publicPath}>{result.publicPath}</a>
              </dd>
            </div>
            <div>
              <dt>管理 URL</dt>
              <dd>
                <a href={result.adminPath}>{result.adminPath}</a>
              </dd>
            </div>
          </dl>
        </section>
      )}
    </section>
  );
}
