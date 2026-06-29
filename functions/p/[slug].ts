import { getParam } from "../_shared/http";
import { findPoll } from "../_shared/store";
import type { RequestContext } from "../_shared/types";

const DEFAULT_TITLE = "みんなの空きコマ";

type EnvWithAssets = RequestContext["env"] & {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
};

export const onRequestGet = async (context: RequestContext): Promise<Response> => {
  const html = await fetchIndexHtml(context);
  const slug = getParam(context, "slug");
  const poll = await findPoll(context.env.DB, slug);

  return new Response(applyTitle(html, poll?.title ?? DEFAULT_TITLE), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
};

async function fetchIndexHtml(context: RequestContext): Promise<string> {
  const assets = (context.env as EnvWithAssets).ASSETS;
  const url = new URL("/", context.request.url);
  const response = await assets.fetch(new Request(url, context.request));
  return response.text();
}

function applyTitle(html: string, title: string): string {
  const safeTitle = escapeHtml(title.trim() || DEFAULT_TITLE);

  if (/<title>.*?<\/title>/is.test(html)) {
    return html.replace(/<title>.*?<\/title>/is, `<title>${safeTitle}</title>`);
  }

  return html.replace(/<\/head>/i, `    <title>${safeTitle}</title>\n  </head>`);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "\"":
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}
