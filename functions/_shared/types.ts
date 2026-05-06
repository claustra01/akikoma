export type D1Result<T = unknown> = {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: {
    changes?: number;
  };
};

export type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(columnName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
};

export type D1Database = {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
};

export type Env = {
  DB: D1Database;
  TOKEN_PEPPER?: string;
};

export type RequestContext = {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
};
