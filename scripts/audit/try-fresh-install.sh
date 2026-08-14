#!/usr/bin/env bash
#
# try-fresh-install.sh — experience Convoke exactly as a new user does.
#
# Packs the CURRENT working tree, installs that tarball into a throwaway project, runs the
# installer and the health check, and prints what a new user would see.
#
# WHY THIS EXISTS (backlog I137/T25)
# ----------------------------------
# `npm test` passing tells you the code works in THIS repo. It does not tell you the published
# package works anywhere else — and twice in one week it didn't:
#
#   I135  `convoke-export` looked for a packaged template inside the USER's project, so it
#         failed in every project except this one.
#   I137  a clean install immediately failed its own `convoke-doctor` check with 3 errors, one
#         of which told the user to run a command that does not exist for them.
#
# Both were invisible to the test suite and both were found by doing exactly what this script
# does. Run it before any release.
#
# Safe: everything happens in a temp directory, which is removed on exit. Your repo is only read
# (`npm pack`), never modified.
#
# Usage:  bash scripts/audit/try-fresh-install.sh
#         KEEP=1 bash scripts/audit/try-fresh-install.sh    # keep the temp project to poke at

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP="$(mktemp -d)"
cleanup() { if [ "${KEEP:-0}" = "1" ]; then echo "kept: $TMP"; else rm -rf "$TMP"; fi; }
trap cleanup EXIT

echo "==> Packing the current working tree"
( cd "$REPO" && npm pack --pack-destination "$TMP" >/dev/null )
TARBALL="$(ls "$TMP"/convoke-agents-*.tgz)"
echo "    $(basename "$TARBALL")  ($(du -h "$TARBALL" | cut -f1))"

echo "==> Creating a throwaway project and installing the tarball"
mkdir -p "$TMP/proj"
cd "$TMP/proj"
npm init -y >/dev/null 2>&1
npm install "$TARBALL" >/dev/null 2>&1
echo "    installed into $TMP/proj"

echo
echo "==> convoke-install-vortex   (what a new user runs first)"
if npx --no-install convoke-install-vortex; then
  echo "    [install exit 0]"
else
  echo "    [install FAILED — exit $?]"
fi

echo
echo "==> convoke-doctor   (does the product think it is healthy?)"
set +e
npx --no-install convoke-doctor
DOCTOR=$?
set -e
echo "    [doctor exit $DOCTOR]"

echo
echo "==> convoke-export   (a shipped bin doing real work, not just --help)"
set +e
npx --no-install convoke-export bmad-brainstorming --output "$TMP/proj/exported" 2>&1 | tail -2
EXPORT=${PIPESTATUS[0]}
set -e
echo "    [export exit $EXPORT]"

echo
echo "==> Every declared bin launches"
FAILED=0
for BIN in $(node -e "console.log(Object.keys(require('$TMP/proj/node_modules/convoke-agents/package.json').bin).join(' '))"); do
  npx --no-install "$BIN" --help >/dev/null 2>&1
  # 0 = printed help, 1 = usage error; anything higher means it crashed on startup
  if [ $? -gt 1 ]; then echo "    FAILED: $BIN"; FAILED=1; fi
done
[ "$FAILED" = "0" ] && echo "    all bins launch"

echo
echo "========================================"
if [ "$DOCTOR" -eq 0 ] && [ "$EXPORT" -eq 0 ] && [ "$FAILED" -eq 0 ]; then
  echo "PASS — a new user gets a working, self-consistent install."
  echo
  echo "Note: convoke-doctor may still print ⚠ warnings (currently 2 — backlog I139)."
  echo "Warnings are fine; hard failures are not. Exit 0 is the bar."
  exit 0
fi
echo "FAIL — a new user would hit this. doctor=$DOCTOR export=$EXPORT bins_failed=$FAILED"
echo "Re-run with KEEP=1 to inspect the project."
exit 1
