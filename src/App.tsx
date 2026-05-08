import { useEffect, useMemo, useState } from "react";
import AdminPage from "./routes/AdminPage";
import EditResponsePage from "./routes/EditResponsePage";
import HomePage from "./routes/HomePage";
import NewPollPage from "./routes/NewPollPage";
import PollPage from "./routes/PollPage";

type Route =
  | { name: "home" }
  | { name: "new" }
  | { name: "poll"; slug: string }
  | { name: "admin"; slug: string; token: string }
  | { name: "edit"; slug: string; responseId: string }
  | { name: "notFound" };

function parseRoute(location: Location): Route {
  const segments = location.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const token = new URLSearchParams(location.search).get("token") ?? "";

  if (segments.length === 0) {
    return { name: "home" };
  }

  if (segments.length === 1 && segments[0] === "new") {
    return { name: "new" };
  }

  if (segments[0] === "p" && segments.length === 2) {
    return { name: "poll", slug: segments[1] };
  }

  if (segments[0] === "p" && segments.length === 3 && segments[2] === "admin") {
    return { name: "admin", slug: segments[1], token };
  }

  if (segments[0] === "p" && segments.length === 4 && segments[2] === "edit") {
    return { name: "edit", slug: segments[1], responseId: segments[3] };
  }

  return { name: "notFound" };
}

export function navigate(path: string): void {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function App() {
  const [locationKey, setLocationKey] = useState(() => window.location.pathname + window.location.search);

  useEffect(() => {
    const handlePopState = () => setLocationKey(window.location.pathname + window.location.search);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const route = useMemo(() => parseRoute(window.location), [locationKey]);

  return (
    <div className="app-shell">
      <svg
        className="shape-layer"
        viewBox="0 0 1200 900"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path className="shape-squiggle shape-a" d="M64 134 C116 90 168 178 220 134 S324 90 376 134" />
        <path className="shape-squiggle shape-b" d="M830 128 C882 84 934 172 986 128 S1090 84 1142 128" />
        <path className="shape-squiggle shape-c" d="M778 742 C832 698 886 786 940 742 S1048 698 1102 742" />
        <rect className="shape-tile shape-d" x="82" y="626" width="68" height="68" rx="14" transform="rotate(-12 116 660)" />
        <rect className="shape-tile shape-e" x="1010" y="318" width="78" height="78" rx="16" transform="rotate(14 1049 357)" />
        <polygon className="shape-triangle shape-f" points="226,780 294,848 182,862" />
        <polygon className="shape-triangle shape-g" points="1016,28 1088,92 984,122" />
        <g className="shape-plus shape-h">
          <path d="M514 86 h42 v42 h42 v42 h-42 v42 h-42 v-42 h-42 v-42 h42z" />
        </g>
        <g className="shape-plus shape-i">
          <path d="M98 350 h28 v28 h28 v28 h-28 v28 h-28 v-28 h-28 v-28 h28z" />
        </g>
      </svg>
      <header className="topbar">
        <a className="brand" href="/">
          みんなの空きコマ
        </a>
        <nav className="topnav" aria-label="主要ナビゲーション">
          <a href="/">ホーム</a>
          <a href="/new">新規作成</a>
        </nav>
      </header>

      <main>
        {route.name === "home" && <HomePage />}
        {route.name === "new" && <NewPollPage />}
        {route.name === "poll" && <PollPage slug={route.slug} />}
        {route.name === "admin" && <AdminPage slug={route.slug} token={route.token} />}
        {route.name === "edit" && <EditResponsePage slug={route.slug} responseId={route.responseId} />}
        {route.name === "notFound" && (
          <section className="page-section">
            <h1>ページが見つかりません</h1>
            <p>URL を確認してください。</p>
            <a className="button button-primary" href="/">
              ホームへ
            </a>
          </section>
        )}
      </main>
    </div>
  );
}
