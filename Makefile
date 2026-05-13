PORT ?= 8788
HOST ?= 127.0.0.1
PERSIST_DIR ?= .wrangler/state
PID_FILE ?= .wrangler/pages-dev.pid
WRANGLER_HOME ?= .wrangler-home
TOKEN_PEPPER ?= local-dev-token-pepper
DEV_RUNNER ?= scripts/pages-dev.sh

.PHONY: dev stop _dev_start

dev:
	@mkdir -p .wrangler "$(WRANGLER_HOME)"
	@if [ -f "$(PID_FILE)" ] && kill -0 "$$(cat "$(PID_FILE)")" 2>/dev/null; then \
		echo "Already running: http://$(HOST):$(PORT)"; \
		echo "PID: $$(cat "$(PID_FILE)")"; \
	else \
		$(MAKE) --no-print-directory _dev_start; \
	fi

_dev_start:
	pnpm run build
	CI=1 WRANGLER_HOME="$(WRANGLER_HOME)" pnpm exec wrangler d1 migrations apply akikoma --local --persist-to "$(PERSIST_DIR)"
	@echo "Starting Cloudflare Pages dev: http://$(HOST):$(PORT)"
	@rm -f "$(PID_FILE)"
	@env HOST="$(HOST)" PORT="$(PORT)" PERSIST_DIR="$(PERSIST_DIR)" PID_FILE="$(PID_FILE)" WRANGLER_HOME="$(WRANGLER_HOME)" TOKEN_PEPPER="$(TOKEN_PEPPER)" sh "$(DEV_RUNNER)"

stop:
	@if [ ! -f "$(PID_FILE)" ]; then \
		echo "Not running."; \
	else \
		PID="$$(cat "$(PID_FILE)")"; \
		if kill -0 "$$PID" 2>/dev/null; then \
			kill "$$PID"; \
			echo "Stopped PID $$PID."; \
		else \
			echo "No running process for PID $$PID."; \
		fi; \
		rm -f "$(PID_FILE)"; \
	fi
