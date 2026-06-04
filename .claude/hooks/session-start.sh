#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web (remote) sessions; locally developers
# manage their own dependencies.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install Node dependencies so tests, linting, and builds work out of the box.
# `npm install` (over `npm ci`) lets the cached container layer be reused on
# subsequent sessions and is idempotent.
npm install
