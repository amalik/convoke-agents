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
# Absolute, because the trap runs after the script has `cd`-ed into $TMP/proj. A RELATIVE
# FRESH_INSTALL_LOG_DIR was cleared at the invocation cwd but written under $TMP/proj — which
# `rm -rf "$TMP"` then destroyed, while the script printed "diagnostics copied". (Review 2026-08-15.)
LOG_DIR="${FRESH_INSTALL_LOG_DIR:-$REPO/.fresh-install-logs}"
case "$LOG_DIR" in /*) ;; *) LOG_DIR="$PWD/$LOG_DIR" ;; esac

# Completion sentinel. On bash 3.2 (macOS default, and this script is documented as the
# pre-release ritual) a `set -u` abort in a script that installs ANY exit trap exits **0** —
# verified: no trap -> 1, any trap -> 0, even when the trap re-exits with the captured status.
# A gate that reports PASS because it crashed is the worst failure this file can have, and it is
# the fourth variant of the fail-open pattern found here. Guard on reaching the end, not on $?.
COMPLETED=0
cleanup() {
  local rc=$?
  # `set +e` for the whole body: a failing `mkdir` previously aborted the trap before
  # `rm -rf "$TMP"`, leaking a full npm-installed project tree on every run whenever $LOG_DIR was
  # unwritable. The trap must always reach its cleanup. (R3 review 2026-08-14.)
  set +e
  if [ "$rc" -ne 0 ]; then
    local existed=0 copied=0
    for f in run.log install.log; do [ -f "$TMP/$f" ] && existed=1; done
    if [ "$existed" -eq 1 ]; then
      mkdir -p "$LOG_DIR"
      for f in run.log install.log; do
        [ -f "$TMP/$f" ] && cp "$TMP/$f" "$LOG_DIR/$f" && copied=1
      done
    fi
    # Distinguish "there was nothing to copy" from "there was, and copying FAILED". The previous
    # version printed the former in both cases — telling the maintainer the run died before
    # logging when in fact a complete transcript existed and the copy was denied. That is exactly
    # the misdirection this block exists to prevent.
    if [ "$copied" -eq 1 ]; then
      echo "    diagnostics copied to $LOG_DIR"
    elif [ "$existed" -eq 1 ]; then
      echo "    WARNING: logs exist in $TMP but could not be copied to $LOG_DIR (permissions? disk?)"
      [ "${KEEP:-0}" = "1" ] || echo "    re-run with KEEP=1 to stop the temp tree being deleted"
    else
      echo "    (no diagnostics to copy — failed before any log was written)"
    fi
  fi
  if [ "${KEEP:-0}" = "1" ]; then echo "kept: $TMP"; else rm -rf "$TMP"; fi
  # See COMPLETED above: a status of 0 that did not come from reaching the end is a crash.
  if [ "$rc" -eq 0 ] && [ "${COMPLETED:-0}" -ne 1 ]; then
    echo "    ERROR: script aborted before completing — reporting failure rather than a false PASS"
    exit 1
  fi
}
trap cleanup EXIT

# Exit codes are distinguished so CI (and a human) can tell "the package is broken" from
# "the environment failed us". 2 = harness/environment problem, 1 = a real product defect.
ENV_FAIL=2

# Tee the whole transcript so the CI artifact carries the actual failure, not just install.log.
# Stale logs from a previous local run are cleared first, so a preserved log is never mistaken
# for this run's (R2 review 2026-08-14).
# Clear only the two files this script writes. `rm -rf "$LOG_DIR"` destroyed everything in a
# caller-supplied directory — verified by review to wipe unrelated files when
# FRESH_INSTALL_LOG_DIR pointed at a shared artifacts dir. That is a direct violation of the
# repo's own `path-safety-for-destructive-ops` rule: never recursively delete a user-supplied
# path. Clearing them prevents a stale log from a previous run being presented as this run's.
rm -f "$LOG_DIR/run.log" "$LOG_DIR/install.log"
exec > >(tee "$TMP/run.log") 2>&1
# KNOWN LIMITATION (review 2026-08-15): bash does not wait on process-substitution children, so
# in principle the trap can `rm -rf "$TMP"` while tee still holds buffered output, making the
# copy see nothing. Review reproduced this ONLY with an artificial near-instant exit; with
# realistic timing (after npm pack + npm install) the transcript was complete in 40/40 runs.
# Deliberately NOT "fixed": draining tee requires closing stdout and reopening it, and the
# obvious reopen target (/dev/tty) does not exist on a CI runner — breaking all output to close
# a race that does not reproduce is a bad trade. Tracked in the backlog instead.

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
  # Anchored to npm's actual error shape. The previous pattern matched the bare token `network`
  # and `ERR_SOCKET` anywhere in the log, so a postinstall printing "failed to initialise network
  # stack" — or a missing dependency named `@scope/network-utils` — was misfiled as an
  # environment failure. npm's genuine network errors always carry `npm error network` or an
  # `npm error code E<CODE>`. Widened at the same time to cover ENETUNREACH / ECONNRESET / E503 /
  # TLS interception, which the old pattern missed entirely. (R3 review 2026-08-14.)
  if grep -qiE 'npm (error|ERR!) network|npm (error|ERR!) code E(NOTFOUND|TIMEDOUT|CONNREFUSED|CONNRESET|AI_AGAIN|NETUNREACH|5[0-9][0-9]|429)|ERR_SOCKET|socket hang up|UNABLE_TO_VERIFY_LEAF_SIGNATURE' "$TMP/install.log"; then
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
  # `-x` alone. This was `[ ! -x ] && [ ! -e ]`, and since -x implies -e the pair collapses to
  # `[ ! -e ]` — so a shim that EXISTS but is not executable (bad mode in the tarball, a partial
  # npm link) passed silently. That is the precise defect class this line exists to catch. The
  # author verified the old boolean's behaviour and confirmed it "fires only when absent" without
  # asking whether that was the right behaviour. (Review 2026-08-15.)
  if [ ! -x "$TMP/proj/node_modules/.bin/$BIN" ]; then
    if [ -e "$TMP/proj/node_modules/.bin/$BIN" ]; then
      echo "    FAILED: $BIN — shim exists in node_modules/.bin but is not executable"
    else
      echo "    FAILED: $BIN — no shim in node_modules/.bin (npm did not link it)"
    fi
    FAILED=1; continue
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
  # I153, closed by story dist-2.4. This USED to be an inline extractor that read the bin
  # ENTRY FILE, regex-matched its literal `require()` calls, resolved each one — and never
  # opened what it resolved. One hop. Measured: `scripts/install-all-agents.js` (bin
  # `convoke-install`) contains exactly ONE require, so its real surface — fs-extra,
  # refresh-installation, compat-preflight, agent-registry — was entirely unchecked and
  # that bin's gate was vacuous. The I139 canary passed only by coincidence: `csv-utils`
  # happens to be required at a bin entry file as well as one hop down, so an ordinary
  # refactor hoisting that require into a helper would have made the regression
  # undetectable with nothing going red.
  #
  # Now a transitive worklist (scripts/audit/lib/installed-tree.js). Still a regex, still
  # no lexer, and deliberately bounded: only RELATIVE specifiers are followed, so a
  # commented-out require inside a third-party package cannot be reported as missing.
  # Cycles terminate on a realpath-keyed visited set; hitting the file cap exits 2 and
  # lands in the fail-closed branch below rather than reporting a clean walk.
  UNRESOLVED="$(node "$REPO/scripts/audit/assert-installed-tree.js" requires "$ABS" 2>"$TMP/dep-check.err")" || {
    # stderr goes to a FILE, not into $UNRESOLVED. It was `2>&1`, so on the SUCCESS path any
    # chatter Node writes to stderr — an ExperimentalWarning, a DeprecationWarning, anything a
    # future Node or a NODE_OPTIONS setting emits — landed in the variable, and the very next
    # line treats non-empty as "modules did not ship". A green package would fail the publish
    # gate citing a warning as a missing module. (Review 2026-08-15.)
    UNRESOLVED="$(cat "$TMP/dep-check.err" 2>/dev/null)"
    # FAIL CLOSED. This was `2>/dev/null` and an empty result is the PASS value, so any crash in
    # the extractor silently reported "all bins ... requires resolve". That is the THIRD instance
    # of this exact pattern in this file (see the `| tail -2` and `for`-list notes above) — which
    # is why it is called out rather than quietly fixed. R3 review 2026-08-14.
    echo "    FAILED: $BIN — dependency check could not run: $UNRESOLVED"
    FAILED=1; continue
  }
  if [ -n "$UNRESOLVED" ]; then
    echo "    FAILED: $BIN — $TARGET requires module(s) that did not ship: $UNRESOLVED"
    FAILED=1; continue
  fi
done
[ "$FAILED" -eq 0 ] && echo "    all $BIN_COUNT bins present, shipped, parseable, and their requires resolve"

echo
echo "==> Everything shipped arrives in the project, and every declared unit is invocable"
# Story dist-2.4 (FR13). Three failures none of the checks above can see, because every
# one of them stops at `node_modules/convoke-agents/` — which is all `files[]` buys you:
#
#   1. a `_bmad/bme/*` entry in `files[]` never reaches the PROJECT. `_portability` is in
#      `files[]` and no install path copies it; the only generic module loop iterates
#      EXTRA_BME_AGENTS, so a module with no agent entry is never visited.
#   2. a module arrives but its declared units are not invocable. `.claude/skills/`
#      wrappers are GENERATED from declarations, never copied, so "the directory is there"
#      and "the operator can run it" are different assertions — and only the second is what
#      this file's own premise promises. A presence-only check goes green on precisely the
#      defect I141 was filed for. See ADR-004 (bme module contract), accepted question 3.
#   3. a data file the shipped code READS at runtime never reaches the project, because
#      `_bmad/_config/` is copied PER NAMED FILE (refresh-installation.js:551, :585), not
#      as a directory. So a file can be in `files[]`, arrive in node_modules, and still be
#      absent from where the code looks for it.
#
# DELIBERATELY NOT IN THE VERDICT AT THE `if` BELOW. NFR10 requires a gate to be
# DEMONSTRATED failing before it is trusted, and this job gates `publish` on every push and
# every PR — a gate merged red blocks the repository until its fix lands. Story dist-2.6
# adds $TREE to that condition in the same commit that turns it green. A check that prints
# FAILED and exits 0 is uncomfortable on purpose. If you are reading this after 2.6 shipped
# and $TREE still appears nowhere in the verdict, that is the bug.
#
# Run from $REPO, not from the installed copy. `scripts/` ships, so both exist — but an
# auditor loaded out of the tree it is auditing cannot report that tree as broken.
TREE=0
node "$REPO/scripts/audit/assert-installed-tree.js" tree "$TMP/proj" "$TMP/proj/node_modules/convoke-agents" || TREE=$?
# 0 = clean, 1 = findings printed. ANY OTHER CODE means the assertion did not run, and
# that includes codes it never chose: 127 (node absent from PATH), 126 (not executable),
# 128+N (killed by a signal), or a startup abort from NODE_OPTIONS. An earlier version
# tested `-eq 2` only, so those printed `[installed-tree status 127]` with no FAILED lines
# above them and the run walked on to PASS — a check reporting health because it never
# executed, which is the fifth variant of the pattern this file's header documents four of.
# Review 2026-08-30.
#
# NOTE ON AC2. This `exit` IS a failure path, which AC2 words as forbidden, and the AC's own
# verification cannot see it: that grep watches the verdict CONDITION for the four status
# variables and says nothing about an `exit` added above it. (Writing the pattern out here
# in full would itself match it — which is the tidiest available proof that the check tests
# the wrong thing.) Kept deliberately by operator ruling 2026-08-30: a check
# that cannot run must not let the harness report health. It fires only on a broken
# ASSERTION, never on a product defect — the zero-unit branch in assert-installed-tree.js
# distinguishes "modules missing" (exit 1, a real defect) from "modules arrived but nothing
# derived" (exit 2, the derivation broke).
if [ "$TREE" -ne 0 ] && [ "$TREE" -ne 1 ]; then
  echo "    [harness] the installed-tree assertion could not run (exit $TREE — see message above)"
  exit "$ENV_FAIL"
fi
echo "    [installed-tree status $TREE]"

echo
echo "========================================"
# Reaching the verdict means every check ran. See COMPLETED near the top: without this, a status
# of 0 cannot be distinguished from a crash that bash reported as 0. Set BEFORE the verdict, not
# inside the PASS branch, so an explicit exit 1/2 below is still a completed run.
COMPLETED=1
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
