#!/usr/bin/env bash
# Point git at the tracked hooks in .githooks.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
git config core.hooksPath .githooks
echo "Hooks installed (core.hooksPath=.githooks)."
