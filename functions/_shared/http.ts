import type { ErrorCode } from "../../src/lib/api";
import type { Env, RequestContext } from "./types";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;

  constructor(status: number, code: ErrorCode, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function jsonResponse<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS
  });
}

export function emptyResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export function errorResponse(status: number, code: ErrorCode, message: string): Response {
  return jsonResponse(
    {
      error: {
        code,
        message
      }
    },
    status
  );
}

export function assertApi(condition: unknown, status: number, code: ErrorCode, message: string): asserts condition {
  if (!condition) {
    throw new ApiError(status, code, message);
  }
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && Number(contentLength) > maxBytes) {
    throw new ApiError(413, "PAYLOAD_TOO_LARGE", "リクエスト本文が大きすぎます");
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new ApiError(413, "PAYLOAD_TOO_LARGE", "リクエスト本文が大きすぎます");
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(400, "INVALID_JSON", "JSON の形式が正しくありません");
  }
}

export async function handleApi(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.status, error.code, error.message);
    }

    console.error(error instanceof Error ? error.message : "Unknown API error");
    return errorResponse(500, "INTERNAL_ERROR", "サーバーエラーが発生しました");
  }
}

export function getParam(context: RequestContext, key: string): string {
  const value = context.params[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export function getTokenFromQuery(request: Request): string {
  return new URL(request.url).searchParams.get("token") ?? "";
}

export function requireTokenPepper(env: Env): string {
  assertApi(env.TOKEN_PEPPER && env.TOKEN_PEPPER.length > 0, 500, "INTERNAL_ERROR", "TOKEN_PEPPER が未設定です");
  return env.TOKEN_PEPPER;
}

export function assertValidation<T>(result: { ok: true; value: T } | { ok: false; message: string }): T {
  if (!result.ok) {
    throw new ApiError(400, "INVALID_INPUT", result.message);
  }
  return result.value;
}
