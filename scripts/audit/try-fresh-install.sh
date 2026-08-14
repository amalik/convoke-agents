#!/usr/bin/env bash
#
# try-fresh-install.sh — experience Convoke exactly as a new user does.
#
# Packs the CURRENT working tree, installs that tarball into a throwaway project, runs the
# installer and the health check, and prints what a new user would see.
#
# WHY THIS EXISTS (backlog T25)
# -----------------------------
# `npm test` passing tells you the code works in THIS repo. It does not tell you the published
# package works anywhere else — and three times in one week it didn't:
#
#   I135  `convoke-export` looked for a packaged template inside the USER's project, so it
#         failed in every project except this one.
#   I137  a clean install immediately failed its own `convoke-doctor` check with 3 errors, one
#         of which told the user to run a command that does not exist for them.
#   I139  `convoke-export` exited 4 on every fresh install — the manifest it reads never shipped.
#
# All three were invisible to the test suite and all three were found by doing exactly what this
# script does. Run it before any release. It also runs in CI as the `fresh-install` job.
#
# Safe: everything happens in a temp directory, which is removed on exit. Your repo is only read
# (`npm pack`), never modified.
#
# Usage:  bash scripts/audit/try-fresh-install.sh
#         KEEP=1 bash scripts/audit/try-fresh-install.sh    # keep the temp project to poke at
#
# CODE REVIEW 2026-08-14 — what was wrong with the first version, so it is not reintroduced:
#   * The bin loop could not fail for a MISSING bin. Its guard was `[ $STATUS -gt 1 ]`, but a bin
#     absent from the tarball makes `npx` exit 1 — so the exact defect class this script exists to
#     catch passed as "all bins launch". Worse, it probed with `--help`, which three install
#     scripts do not implement, so it EXECUTED the installers with output discarded.
#   * `convoke-install-vortex` failing printed a message but did not affect the verdict.
#   * `npm install` was silenced entirely, so a registry blip was indistinguishable from a code
#     defect — on a job that gates `publish`.

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP="$(mktemp -d)"

# Preserve diagnostics before the temp tree is destroyed.
#
# The trap deletes $TMP on exit, and $TMP is a random mktemp path — so a CI artifact step
# pointing at it would upload nothing, and `KEEP=1` is advice a maintainer cannot act on in CI.
# On a NON-ZERO exit, copy the logs somewhere stable and predictable first. This job fails on
# defects that by construction do not reproduce inside the repo, so the log is the whole story.
LOG_DIR="${FRESH_INSTALL_LOG_DIR:-$REPO/.fresh-install-logs}"
cleanup() {
  local rc=$?
  if [ "$rc" -ne 0 ]; then
    mkdir -p "$LOG_DIR"
    # Copy whatever exists. `install.log` alone is NOT enough: on every exit-1 path the run got
    # that far BECAUSE npm install succeeded, so install.log is the log of a successful install
    # and says nothing about the defect. `run.log` is the actual transcript. (R2 review 2026-08-14.)
    local copied=0
    for f in run.log install.log; do
      if [ -f "$TMP/$f" ]; then cp "$TMP/$f" "$LOG_DIR/$f" 2>/dev/null && copied=1; fi
    done
    if [ "$copied" -eq 1 ]; then
      echo "    diagnostics copied to $LOG_DIR"
    else
      # Do not claim to have copied something when nothing existed — an early exit-2 reaches the
      # trap before any log is written, and the old unconditional message was simply false.
      echo "    (no diagnostics to copy — failed before any log was written)"
    fi
  fi
  if [ "${KEEP:-0}" = "1" ]; then echo "kept: $TMP"; else rm -rf "$TMP"; fi
}
trap cleanup EXIT

# Exit codes are distinguished so CI (and a human) can tell "the package is broken" from
# "the environment failed us". 2 = harness/environment problem, 1 = a real product defect.
ENV_FAIL=2

# Tee the whole transcript so the CI artifact carries the actual failure, not just install.log.
# Stale logs from a previous local run are cleared first, so a preserved log is never mistaken
# for this run's (R2 review 2026-08-14).
rm -rf "$LOG_DIR"
exec > >(tee "$TMP/run.log") 2>&1

echo "==> Packing the current working tree"
( cd "$REPO" && npm pack --pack-destination "$TMP" >/dev/null )
# Count matches rather than assuming exactly one. A package rename (this repo has done one:
# bmad-enhanced -> convoke-agents) makes the glob match zero and `ls` abort under `set -e`
# immediately after a SUCCESSFUL pack, with no explanation.
shopt -s nullglob
TARBALLS=( "$TMP"/*.tgz )
shopt -u nullglob
if [ "${#TARBALLS[@]}" -ne 1 ]; then
  echo "    [harness] expected exactly 1 tarball in $TMP, found ${#TARBALLS[@]}: ${TARBALLS[*]:-none}"
  exit "$ENV_FAIL"
fi
TARBALL="${TARBALLS[0]}"
echo "    $(basename "$TARBALL")  ($(du -h "$TARBALL" | cut -f1))"

echo "==> Creating a throwaway project and installing the tarball"
mkdir -p "$TMP/proj"
cd "$TMP/proj"
npm init -y >/dev/null 2>&1
# Capture rather than discard. Silencing stdout AND stderr meant a registry blip, a rate limit or
# an offline runner produced a bare exit 1 with no diagnosis — on the job that gates `publish`.
# This also surfaces `postinstall` output, which is genuinely the first thing a new user sees.
if ! npm install "$TARBALL" > "$TMP/install.log" 2>&1; then
  # Classify rather than assume. npm treats a non-zero `postinstall` and an unresolvable
  # dependency range as install failures — both are shippable PRODUCT defects (the I137 class),
  # and calling them "the registry" points the maintainer away from the cause. Only fall back to
  # ENV_FAIL when the log actually looks like a network/registry problem. (R2 review 2026-08-14.)
  if grep -qiE 'ENOTFOUND|ETIMEDOUT|ECONNREFUSED|EAI_AGAIN|ERR_SOCKET|network|rate.?limit|E429|registry.*(unreachable|timeout)' "$TMP/install.log"; then
    echo "    [harness] npm install failed and the log looks like a network/registry problem:"
    sed 's/^/      /' "$TMP/install.log" | tail -20
    exit "$ENV_FAIL"
  fi
  echo "    npm install FAILED, and not for an obvious network reason — treating as a real defect"
  echo "    (a bad dependency range or a crashing postinstall both land here):"
  sed 's/^/      /' "$TMP/install.log" | tail -20
  exit 1
fi
echo "    installed into $TMP/proj"
# postinstall cannot fail the install (scripts/postinstall.js swallows its own errors), so an
# error there is invisible unless we look for it.
if grep -qiE '^(npm )?(error|ERR!)|Error:' "$TMP/install.log"; then
  echo "    ⚠ install log contains error text (postinstall?):"
  grep -iE '^(npm )?(error|ERR!)|Error:' "$TMP/install.log" | head -5 | sed 's/^/      /'
fi

echo
echo "==> convoke-install-vortex   (what a new user runs first)"
INSTALL=0
npx --no-install convoke-install-vortex || INSTALL=$?
echo "    [install exit $INSTALL]"

echo
echo "==> convoke-doctor   (does the product think it is healthy?)"
DOCTOR=0
npx --no-install convoke-doctor || DOCTOR=$?
echo "    [doctor exit $DOCTOR]"

echo
echo "==> convoke-export   (a shipped bin doing real work, not just --help)"
# Export the FIRST `MAX_EXPORTS` skills the manifest offers (default 5). The previous version
# exported `rows[0]` only.
#
# BE HONEST ABOUT WHAT THIS COVERS: this is 5 of however many the manifest holds, and it is still
# manifest-ORDER dependent — a reorder changes which 5 are covered. It narrows the hole rather
# than closing it. An earlier draft of this comment claimed it exported "EVERY skill", which was
# wrong and would have stopped a reader from adding real coverage (R2 review 2026-08-14).
# Full-coverage export is deliberately not done here: it is O(minutes) on a job that gates
# `publish`. Tracked in the backlog instead.
MANIFEST="$TMP/proj/_bmad/_config/skill-manifest.csv"
EXPORT=0
if [ ! -f "$MANIFEST" ]; then
  echo "    [no skill-manifest.csv — convoke-export cannot work at all]"
  EXPORT=1
else
  MAX_EXPORTS="${MAX_EXPORTS:-5}"
  # Validate before use. `MAX_EXPORTS=0` or a non-numeric value yields an empty skill list, and
  # the empty-list branch below then reports "skill-manifest.csv has a valid header but zero
  # rows" — blaming the manifest for what is a bad argument. It fails CLOSED (verified: exit 1),
  # so the gate is not silently disabled, but the diagnostic sends the reader to the wrong file.
  # Same class as the bug this script's own history records: blaming convoke-export for the
  # script's bad assumption. Found by self-check during R2, 2026-08-14.
  if ! [ "$MAX_EXPORTS" -ge 1 ] 2>/dev/null; then
    echo "    [harness] MAX_EXPORTS must be an integer >= 1 (got: '$MAX_EXPORTS')"
    exit "$ENV_FAIL"
  fi
  # A renamed/removed `canonicalId` column previously produced `rows[0][-1]` -> undefined ->
  # `process.stdout.write(undefined)` -> a raw TypeError that killed the script before any
  # verdict printed. Fail with a sentence instead.
  SKILLS="$(node -e '
    const { readManifest } = require(process.argv[3]);
    const { header, rows } = readManifest(process.argv[1]);
    const idx = header.indexOf("canonicalId");
    if (idx < 0) { console.error("manifest has no canonicalId column; header: " + header.join(",")); process.exit(3); }
    const ids = rows.map((r) => r[idx]).filter(Boolean);
    process.stdout.write(ids.slice(0, Number(process.argv[2])).join(" "));
  ' "$MANIFEST" "$MAX_EXPORTS" "$TMP/proj/node_modules/convoke-agents/scripts/portability/manifest-csv.js")" || {
    echo "    [harness] could not read the skill manifest (see message above)"
    exit "$ENV_FAIL"
  }
  if [ -z "$SKILLS" ]; then
    # A header-only manifest parses fine but offers nothing. Previously this passed an EMPTY
    # argument to convoke-export and then blamed the exporter for the resulting failure.
    echo "    [skill-manifest.csv has a valid header but zero rows — nothing can be exported]"
    EXPORT=1
  else
    # Guarded like its sibling above. Unguarded, a failure here died at exit 1 ("product defect")
    # with no FAIL line printed at all — the asymmetry R2 review flagged.
    TOTAL="$(node -e '
      const { readManifest } = require(process.argv[2]);
      process.stdout.write(String(readManifest(process.argv[1]).rows.length));
    ' "$MANIFEST" "$TMP/proj/node_modules/convoke-agents/scripts/portability/manifest-csv.js")" || {
      echo "    [harness] could not count manifest rows"
      exit "$ENV_FAIL"
    }
    COUNT="$(echo "$SKILLS" | wc -w | tr -d ' ')"
    echo "    exporting $COUNT of $TOTAL skill(s) (cap MAX_EXPORTS=$MAX_EXPORTS)"
    for SKILL in $SKILLS; do
      STATUS=0
      # Full output on failure — the previous `| tail -2` discarded the reason for a failure that
      # by construction does not reproduce inside the repo.
      OUT="$(npx --no-install convoke-export "$SKILL" --output "$TMP/proj/exported" 2>&1)" || STATUS=$?
      if [ "$STATUS" -ne 0 ]; then
        echo "    FAILED: $SKILL (exit $STATUS)"
        echo "$OUT" | sed 's/^/      /'
        EXPORT=1
      fi
    done
    [ "$EXPORT" -eq 0 ] && echo "    all $COUNT export(s) succeeded"
  fi
fi
echo "    [export status $EXPORT]"

echo
echo "==> Every declared bin is present and loadable"
# REWRITTEN after code review. The old check ran `<bin> --help` and failed only on exit > 1.
# Two defects: (a) a bin missing from the tarball makes npx exit 1, so the packaging regression
# this script exists to catch was invisible; (b) install-vortex-agents, install-gyre-agents,
# install-all-agents and convoke-doctor implement no --help at all, so the "launch check" was
# really running the installers with their output thrown away.
#
# Check what actually matters for a packaged bin instead: the shim exists, its target file
# shipped, and the file parses. No product code is executed.
BIN_JSON="$TMP/proj/node_modules/convoke-agents/package.json"
if [ ! -f "$BIN_JSON" ]; then
  echo "    [harness] installed package.json not found at $BIN_JSON"
  exit "$ENV_FAIL"
fi
# Assign first, then iterate. A failing command substitution inside a `for` list does NOT trip
# `set -e`: the loop simply ran zero times and the check reported "all bins launch".
BINS="$(node -e 'const b=require(process.argv[1]).bin||{};process.stdout.write(Object.keys(b).join(" "))' "$BIN_JSON")"
if [ -z "$BINS" ]; then
  echo "    [harness] installed package declares no bins — enumeration failed or bin{} is empty"
  exit "$ENV_FAIL"
fi
BIN_COUNT="$(echo "$BINS" | wc -w | tr -d ' ')"
FAILED=0
for BIN in $BINS; do
  TARGET="$(node -e 'const b=require(process.argv[1]).bin;process.stdout.write(b[process.argv[2]]||"")' "$BIN_JSON" "$BIN")"
  ABS="$TMP/proj/node_modules/convoke-agents/$TARGET"
  if [ ! -x "$TMP/proj/node_modules/.bin/$BIN" ] && [ ! -e "$TMP/proj/node_modules/.bin/$BIN" ]; then
    echo "    FAILED: $BIN — no shim in node_modules/.bin (npm did not link it)"; FAILED=1; continue
  fi
  if [ ! -f "$ABS" ]; then
    echo "    FAILED: $BIN — target $TARGET did not ship in the tarball"; FAILED=1; continue
  fi
  if ! node --check "$ABS" >/dev/null 2>&1; then
    echo "    FAILED: $BIN — $TARGET does not parse"; FAILED=1; continue
  fi
  # Parsing is not enough. `node --check` never resolves `require()`, so a bin whose dependency
  # was not shipped parses cleanly and then throws MODULE_NOT_FOUND on the user's first run —
  # which is I139's exact class, and reachable: `audit-bmm-dependencies.js` requires
  # `../../_bmad/bme/_team-factory/lib/utils/csv-utils`, and `_bmad/bme/_team-factory/` is a
  # SEPARATE `files:` entry from `scripts/`. Drop that one entry and the old check still said
  # "all 14 bins present, shipped and parseable". Found by R2 review 2026-08-14.
  #
  # Resolve each require specifier instead of executing the file — running these would fire three
  # installers for real, which is the mistake the previous version made.
  UNRESOLVED="$(node -e '
    const fs = require("fs"), path = require("path");
    const file = process.argv[1];
    const src = fs.readFileSync(file, "utf8");
    const specs = new Set();
    // Static literal requires only. A dynamic require (variable specifier) is skipped rather
    // than guessed at — reporting a false missing dependency would be worse than missing one.
    for (const m of src.matchAll(/\brequire\(\s*["\u0027]([^"\u0027]+)["\u0027]\s*\)/g)) specs.add(m[1]);
    const missing = [];
    for (const spec of specs) {
      if (spec.startsWith("node:")) continue;
      try { require.resolve(spec, { paths: [path.dirname(file)] }); }
      catch { missing.push(spec); }
    }
    process.stdout.write(missing.join(" "));
  ' "$ABS" 2>/dev/null)"
  if [ -n "$UNRESOLVED" ]; then
    echo "    FAILED: $BIN — $TARGET requires module(s) that did not ship: $UNRESOLVED"
    FAILED=1; continue
  fi
done
[ "$FAILED" -eq 0 ] && echo "    all $BIN_COUNT bins present, shipped, parseable, and their requires resolve"

echo
echo "========================================"
if [ "$INSTALL" -eq 0 ] && [ "$DOCTOR" -eq 0 ] && [ "$EXPORT" -eq 0 ] && [ "$FAILED" -eq 0 ]; then
  echo "PASS — a new user gets a working, self-consistent install."
  echo
  echo "Note: convoke-doctor may still print ⚠ warnings. Warnings are fine; hard failures are"
  echo "not. Exit 0 is the bar. (The count is deliberately not asserted here — a hardcoded"
  echo "number rots, and a maintainer comparing output to a stale note chases phantoms.)"
  exit 0
fi
echo "FAIL — a new user would hit this."
echo "  install=$INSTALL doctor=$DOCTOR export=$EXPORT bins_failed=$FAILED"
echo "Re-run locally with KEEP=1 to inspect the project. In CI, see the uploaded"
echo "fresh-install-logs artifact."
exit 1
