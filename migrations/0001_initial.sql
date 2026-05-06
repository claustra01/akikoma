PRAGMA foreign_keys = ON;

CREATE TABLE polls (
  slug TEXT PRIMARY KEY,

  title TEXT NOT NULL,
  description TEXT,

  config_json TEXT NOT NULL CHECK (json_valid(config_json)),

  admin_token_hash TEXT NOT NULL,

  is_closed INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE responses (
  id TEXT PRIMARY KEY,

  poll_slug TEXT NOT NULL,

  name TEXT NOT NULL,
  comment TEXT,

  answers_json TEXT NOT NULL CHECK (json_valid(answers_json)),

  edit_token_hash TEXT NOT NULL,

  version INTEGER NOT NULL DEFAULT 1,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (poll_slug) REFERENCES polls(slug) ON DELETE CASCADE
);

CREATE INDEX idx_responses_poll_slug
ON responses(poll_slug);

CREATE INDEX idx_responses_poll_updated
ON responses(poll_slug, updated_at);

CREATE UNIQUE INDEX idx_responses_edit_token_hash
ON responses(edit_token_hash);
