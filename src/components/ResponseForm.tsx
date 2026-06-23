import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { applyClipboardAnswers, serializeAnswersToTsv } from "../lib/answerClipboard";
import type { AnswersMap, PollConfig } from "../lib/schema";
import ScheduleGrid from "./ScheduleGrid";

export type ResponseFormValues = {
  name: string;
  comment: string;
  answers: AnswersMap;
};

type ResponseFormProps = {
  config: PollConfig;
  initialValues?: ResponseFormValues;
  submitLabel: string;
  idPrefix: string;
  disabled?: boolean;
  busy?: boolean;
  onSubmit: (values: ResponseFormValues) => Promise<void>;
};

const EMPTY_VALUES: ResponseFormValues = {
  name: "",
  comment: "",
  answers: {}
};

function pasteErrorMessage(error: unknown): string {
  if (!window.isSecureContext) {
    return "HTTPSで開くとペーストできます";
  }

  if (!navigator.clipboard?.readText) {
    return "このブラウザではペーストできません";
  }

  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "ブラウザでペーストを許可してください";
  }

  return "ペーストできませんでした";
}

export default function ResponseForm({
  config,
  initialValues = EMPTY_VALUES,
  submitLabel,
  idPrefix,
  disabled = false,
  busy = false,
  onSubmit
}: ResponseFormProps) {
  const [name, setName] = useState(initialValues.name);
  const [comment, setComment] = useState(initialValues.comment);
  const [answers, setAnswers] = useState<AnswersMap>(initialValues.answers);
  const [clipboardMessage, setClipboardMessage] = useState("");
  const clipboardTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setName(initialValues.name);
    setComment(initialValues.comment);
    setAnswers(initialValues.answers);
  }, [initialValues]);

  useEffect(() => {
    return () => {
      if (clipboardTimerRef.current !== null) {
        window.clearTimeout(clipboardTimerRef.current);
      }
    };
  }, []);

  const showClipboardMessage = (message: string) => {
    setClipboardMessage(message);
    if (clipboardTimerRef.current !== null) {
      window.clearTimeout(clipboardTimerRef.current);
    }
    clipboardTimerRef.current = window.setTimeout(() => {
      setClipboardMessage("");
      clipboardTimerRef.current = null;
    }, 1200);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(serializeAnswersToTsv(config, answers));
      showClipboardMessage("コピーしました");
    } catch {
      showClipboardMessage("コピーできませんでした");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const result = applyClipboardAnswers(config, answers, text);
      if (!result.ok) {
        showClipboardMessage(result.error);
        return;
      }

      setAnswers(result.value.answers);
      showClipboardMessage("ペーストしました");
    } catch (caught) {
      showClipboardMessage(pasteErrorMessage(caught));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit({ name, comment, answers });
  };

  return (
    <>
      <form className="form-stack" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor={`${idPrefix}-name`}>名前</label>
          <input
            id={`${idPrefix}-name`}
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            maxLength={50}
            required
            disabled={disabled || busy}
          />
        </div>

        <div className="form-row">
          <label htmlFor={`${idPrefix}-comment`}>コメント</label>
          <textarea
            id={`${idPrefix}-comment`}
            value={comment}
            onChange={(event) => setComment(event.currentTarget.value)}
            maxLength={500}
            rows={3}
            disabled={disabled || busy}
          />
        </div>

        <div className="schedule-tools">
          <div className="actions schedule-tool-actions" role="group" aria-label="予定入力のコピーとペースト">
            <button
              className="button button-secondary"
              type="button"
              onClick={handleCopy}
              disabled={disabled || busy}
            >
              コピー
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={handlePaste}
              disabled={disabled || busy}
            >
              ペースト
            </button>
          </div>
        </div>

        <ScheduleGrid
          config={config}
          answers={answers}
          onChange={setAnswers}
          disabled={disabled || busy}
          idPrefix={`${idPrefix}-slot`}
        />

        <div className="actions">
          <button className="button button-primary" type="submit" disabled={disabled || busy}>
            {busy ? "送信中" : submitLabel}
          </button>
        </div>
      </form>
      {clipboardMessage &&
        createPortal(
          <div className="schedule-tool-toast" role="status">
            {clipboardMessage}
          </div>,
          document.body
        )}
    </>
  );
}
