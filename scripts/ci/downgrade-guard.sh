#!/usr/bin/env bash
#
# The single copy of the FR5 downgrade comparison.
#
# Called by TWO callers in .github/workflows/ci.yml:
#   1. the `publish` job  — GUARD_CURRENT comes from a live registry read
#   2. the `downgrade-guard-dry` job — GUARD_CURRENT comes from a fixture matrix
#
# CONTRACT: inputs arrive as NAMED environment variables, never positionally.
# A transposed positional pair would invert every verdict silently (LOWEST=CAND
# becomes true exactly when CAND is HIGHER) and the dry matrix would stay green.
# A transposed *named* binding is visible in review. Do not "simplify" this to $1/$2.
#
# This script performs NO network access. That is what makes it testable, and the
# `downgrade-guard-dry` job depends on it: the job carries no credentials and needs
# no registry.
#
set -eo pipefail

: "${GUARD_CAND:?GUARD_CAND is required (the version about to be published)}"
: "${GUARD_CURRENT?GUARD_CURRENT is required -- the registry current latest; may be empty}"
PKG="${GUARD_PKG:-the package}"

# Every FATAL path below cites this. T44: the guard has no override by design, so the
# sanctioned repair for each refusal mode has to be written down somewhere findable.
PLAYBOOK="docs/npm-publishing-access-playbook.md §5"

# --- contract re-assertion on our own input -------------------------------
# The WORKFLOW validates CAND before the registry read and must keep doing so:
# on the E404 skip path this script is never called, so a check that lived only
# here would leave CAND unvalidated on exactly the path the guard lets through.
# This is defence in depth on the script's contract, not the primary gate.
# NOTE the regex: it rejects LEADING ZEROS, matching gate 4's SEMVER_RE. An earlier version
# used ^[0-9]+\.[0-9]+\.[0-9]+$, which accepts 4.01.0 / 04.0.0 / 4.1.00 -- and the sort
# justification below depends on those being excluded. See the comment at the comparison.
if ! [[ "$GUARD_CAND" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
  echo "FATAL: GUARD_CAND '$GUARD_CAND' is not a plain X.Y.Z release (no leading zeros)." >&2
  exit 1
fi

# --- empty reply: its own branch, BEFORE the line count -------------------
# `npm view <pkg> <field>` exits 0 with empty stdout AND empty stderr when the
# package exists but the field does not (observed, npm 11.11.0). That reaches the
# success path with CURRENT="". Left to the line-count check below it is reported
# as "multi-line", because printf '%s' "" | grep -c '' yields 0, not 1.
if [ -z "$GUARD_CURRENT" ]; then
  echo "FATAL: registry returned an EMPTY 'latest' for $PKG." >&2
  echo "       The package exists but has no 'latest' dist-tag (npm dist-tag rm, or mid-replication)." >&2
  echo "       Repair: npm dist-tag add $PKG@<good-version> latest  (operator, interactive, needs 2FA)." >&2
  echo "       Full procedure: ${PLAYBOOK}." >&2
  exit 1
fi

if [ "$(printf '%s' "$GUARD_CURRENT" | grep -c '')" -ne 1 ]; then
  echo "FATAL: registry returned a multi-line 'latest' for $PKG; refusing to guess." >&2
  printf '%s\n' "$GUARD_CURRENT" | head -5 >&2
  echo "       Often transient -- re-run first. If it repeats, see ${PLAYBOOK}." >&2
  exit 1
fi

CURRENT="${GUARD_CURRENT#"${GUARD_CURRENT%%[![:space:]]*}"}"
CURRENT="${CURRENT%"${CURRENT##*[![:space:]]}"}"
CURRENT="${CURRENT%%+*}"

# CURRENT comes from the REGISTRY and meets no other validation anywhere -- gate 4's SEMVER_RE
# constrains TAG/VERSION only. So this is the sole place a zero-padded or otherwise non-canonical
# `latest` can be excluded, and the sort justification below relies on it doing so.
if ! [[ "$CURRENT" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
  echo "FATAL: current 'latest' for $PKG is not a plain X.Y.Z release (got '$CURRENT')." >&2
  echo "       Repair: npm dist-tag add $PKG@<good-version> latest  (operator, interactive, needs 2FA)." >&2
  echo "       Full procedure: ${PLAYBOOK}." >&2
  exit 1
fi

# --- the comparison -------------------------------------------------------
# Both operands are forced through ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ above --
# canonical X.Y.Z with NO leading zeros. On that input space BSD and GNU version-sort agree by
# construction: they differ only on numeric TIES such as zero-padded components (4.01.0 vs 4.1.0),
# and both are now excluded HERE, by these checks, in this file.
#
# That matters because an earlier version of this comment credited gate 4's SEMVER_RE. SEMVER_RE
# constrains TAG/VERSION only -- it never sees CURRENT, which arrives from the registry, and the
# downgrade-guard-dry caller has no SEMVER_RE upstream at all. The argument was therefore true of
# the publish path's CAND and false of everything else. Tightening the two regexes above is what
# makes it true as stated. Relaxing either re-opens the BSD-vs-GNU question.
LOWEST=$(printf '%s\n%s\n' "$CURRENT" "$GUARD_CAND" | sort -V | head -1)
if [ "$GUARD_CAND" != "$CURRENT" ] && [ "$LOWEST" = "$GUARD_CAND" ]; then
  echo "FATAL: refusing to publish $GUARD_CAND to 'latest' -- lower than current latest $CURRENT." >&2
  echo "       The guard cannot tell an accidental downgrade from a deliberate repair of a" >&2
  echo "       corrupted 'latest', which is why it stops here. Decide which value is wrong:" >&2
  echo "       if $CURRENT is legitimate, fix the version being released; if $CURRENT is wrong," >&2
  echo "       repair 'latest' first, then re-run. There is no override -- see ${PLAYBOOK}." >&2
  exit 1
fi

echo "Downgrade guard: $GUARD_CAND >= current latest $CURRENT -- OK"
