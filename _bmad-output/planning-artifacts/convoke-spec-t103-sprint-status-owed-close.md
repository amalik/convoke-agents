# T103 — Extend the owed-close scan to `sprint-status.yaml`

**Lane:** Fast (score 3.6 as filed — see *Effort correction* below)
**Extends:** T79 (`checkOwedCloses` in `scripts/audit/backlog-integrity.js`)
**Vehicle:** direct Fast Lane ship — `feat(T103): …` then `docs(backlog): close T103`. No story file; that is the convention every prior T-item followed (`feat(T79)`, `feat(T58)`).
**Preflight:** GREEN, run 2026-08-30. Age arm exempt (qualified same day); anchors #3/#4 verified against source — findings below.

---

## 1. The defect

T79 gave the project an owed-close scan over **lane rows**. Story status lives in
`_bmad-output/implementation-artifacts/sprint-status.yaml` and is scanned by nothing, so a story
whose work ships stays `backlog` with no gate watching.

Measured 2026-08-30 by the `dist-epic-2` readiness assessment: `dist-2-1` and `dist-2-5` both read
`backlog` while their work had landed. Both were found by a human pass (`a1211f2d`), not a gate.

**One is still live.** `dist-2-1` was reconciled to `done`; `dist-2-5` was not:

- `sprint-status.yaml:924` → `dist-2-5-close-bug-19-…: backlog`
- `21ae3105` (2026-08-28) → `fix(dist-2-5): make the registry label agree with its own finding`

The commit subject names the story under a work verb. The scan would catch this today if it read
the file.

---

## 2. Two corrections to T103 as filed

**(a) The I133 parse hazard does not apply.** T103 prices effort on surviving
`sprint-status.yaml`'s 101,804-character single-line scalar. Verified: that line is **line 44, a
comment** (`# 2026-05-25 (ci-hygiene-1-1 R1 complete…`), sitting in the header *above*
`development_status:` (line 147). A line-scoped key match skips it twice over — once because the
scan is bounded to the `development_status` block, once because `#` is not a key.

**Do not add a YAML parser.** `backlog-integrity.js` today requires only `fs`, `path` and
`child_process` — zero third-party deps in a CI-blocking audit script. Adding `js-yaml` would walk
straight into the resolution problem `8c5de2f8` just fixed for `dist-2-4`. Read the keys with a
line regex.

**(b) Effort should come down.** E was priced at 1.5 largely on that hazard. With the parser gone
the work is a second source feeding an existing scanner. Recommend **E 1.5 → 1.0** (rescore before
pickup; per `backlog-write-discipline` the row must be re-placed in the same edit).

---

## 3. Design

Feed `checkOwedCloses` a second population of live IDs. The git read, the verb filter and the
scope-token match all already exist — this is a second source, not a second scanner.

**Read.** Bound to the `development_status:` block (line 147 to the next 0-indent key,
`action_items:`). Match `^  ([a-z0-9-]+): *([a-z-]+)$`. Two-space indent is the story level.

**Live set.** Everything except `done`. Current tally: `backlog` 97, `done` 319, `in-progress` 5,
`optional` 23, `ready-for-dev` 6.
**`optional` counts as live** — operator decision, Amalik, 2026-08-30. An optional story whose work
shipped misleads exactly as much as a backlog one. So the live set is `backlog` + `in-progress` +
`optional` + `ready-for-dev` = **131 stories**; only `done` is excluded.

**ID derivation.** The yaml key is a full slug; the commit scope is its prefix
(`dist-2-5-close-bug-19-…` → `fix(dist-2-5)`). Derive the ID as the leading
`<name>-<n>-<n>` / `<name>-epic-<n>` segment and match scope tokens **exactly**, as pass 1 already
does for lane rows.

**Pass 1 only — never pass 2.** Pass 2's bare whole-word match is confined to pre-convention
subjects for a measured precision reason. Stories postdate the convention entirely, so pass 2 buys
nothing and risks plenty: the slug `dist-2-5-close-bug-19-…` literally contains `bug-19`, and a
loose tokenizer would cross-contaminate the story with the `BUG-19` lane row.

**Guard `ID_SHAPE`.** The existing `/^[A-Za-z]+-?\d+$/` rejects `dist-2-5`. Add a story shape
alongside it — do not widen the lane shape, which is load-bearing against blank-cell rows building
`new RegExp('\\b\\b')`.

**Stay WARN.** Same reasoning as T79: a fix legitimately precedes its status flip inside a session,
and this runs in the CI that gates that very commit.

---

## 4. The honest limit — state it in the output

The scan detects **divergence**, not completion. `dist-2-5` deliberately merged FR17 and FR18 so one
story would close BUG-19; only FR17 shipped. The correct response there was *re-scope*, not *close*.

So the warning must not say "close is owed". It should say the status and the commit disagree, and
leave the resolution — close, re-scope, or split — to the reader. Mirror T79's existing footer,
which already declines to assert that a fix closes a row.

---

## 5. Acceptance criteria

Every AC must be shown **red before green** per `verification-must-be-falsifiable` — a new gate is
not shippable until it has failed once on purpose.

1. **True positive.** On this tree the scan reports `dist-2-5`, naming `21ae3105`. *Falsify:* flip
   `sprint-status.yaml:924` to `done`; the warning disappears and returns when reverted.
2. **No false positives.** The other 130 live stories produce zero hits. Any hit beyond `dist-2-5`
   is triaged and either fixed or documented with its count, per the `docs(...)`-exclusion
   precedent T79 set.
3. **Lane scan unchanged.** Lane-row output is byte-identical to today's — 4 warnings
   (`I113`, `I134`, `T103`, `T99`), all governance/filing false positives. *Falsify:* a test pins
   the lane count so a regression here is caught, not eyeballed.
4. **Parse robustness.** The 101,804-char comment at line 44 is not read as a key. *Falsify:* a
   fixture carrying an over-long comment line inside the block still parses.
5. **`action_items:` is out of scope.** Keys under the sibling top-level block at line 936 are not
   scanned. This is a **structural** guard, not a live catch — measured 2026-08-30, that block holds
   zero `key: status` lines, so the bound is protecting against future growth. *Falsify:* add a
   fixture key there and confirm it is ignored.
6. **Still exits 0.** Divergence is WARN. *Falsify:* the true positive above is present in output
   while `echo $?` is `0` — read the script's own exit, not a pipeline's, per
   `verification-pipefail`.
7. **Not inert.** A shallow clone or missing file reports *why* it could not scan, rather than a
   silent clean bill of health. *Falsify:* point it at a missing `sprint-status.yaml` and confirm
   it says so.
8. **Test isolation.** All tests run against a fixture dir, never `PACKAGE_ROOT`, per
   `test-fixture-isolation` — non-negotiable, since AC1's expected output changes the day
   `dist-2-5` is reconciled.

---

## 6. Out of scope

Reconciling `dist-2-5` itself. That is a scope decision about a half-shipped merged story, and it
belongs to `dist-epic-2`, not to the gate. Ship the gate; let it report the row.
