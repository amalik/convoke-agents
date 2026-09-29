---
baseline_commit: 66a34b73d9bc6ac7cb3430986ad80e1f3a5cfaa8
---

# Story tfu-1.1: Stop shipping the Team Factory

Status: ready-for-dev

**Epic:** [tfu-epic-1 — Team Factory Unship](../planning-artifacts/convoke-epic-team-factory-unship.md)
**Origin:** Fast Lane rows `T179` (2.0, `loom`) and `T150` (5.7, `convoke`), bundled `21ed0512`.
**Namespace decision:** Convoke-owned throughout — `_bmad/bme/_team-factory/` stops being packaged,
`_bmad/bme/covenant/` gets new worked examples, and the rest is `scripts/`, `tests/`, `package.json`,
`.github/`, Convoke's own docs, and two files under `_bmad/_config/` (`agent-manifest.csv`,
`skill-manifest.csv`). `_bmad/_config/` is Convoke-owned shared config, not an upstream namespace; no
`_bmad/{core,bmm,bmb,cis,tea,bma,gds,wds}/` path is touched. No skill, agent or workflow is **added**.
**Covenant:** no `_bmad/bme/` skill or workflow is authored, so `covenant-compliance-for-convoke-skills`
applies as a no-regression check only — **except** for AC#7, which replaces two `**Good example.**` cells
in a shipped normative file. That is OC-R3 work (the Right to rationale), not tidying.
**Safety analysis (`path-safety-for-destructive-ops`):** **not in scope.** No path this story touches
reaches a removal target and nothing it changes accepts a user-supplied path. *(It was in scope while
AC#8 lived here; AC#8 is now `T222` — see the struck AC below. Do not re-add a destructive operation to
this story without restoring a real safety analysis.)*

## Story

As **the operator of a Convoke install**,
I want **the Team Factory to stop arriving in my project**,
so that **what Convoke ships is what Convoke supports, and a module ruled internal scaffolding stops
presenting itself as a capability I can use**.

## Context

The ruling is 2026-09-16. The module still ships. `docs/development.md:77-83` simultaneously
recommends it (`### Team Factory (Recommended)`) and records that it is being withdrawn, citing `T179`.

**Unship is not delete.** `scripts/audit/agent-surface-parity.js` exits 2 on a removed agent, and the
grep in AC#1 shows that file carries no waiver. The tree stays tracked in git; it stops being packaged.
That also keeps the consumers of `_team-factory/lib/` working — **four** of them, derived, not counted
by eye:

```bash
grep -rn "utils/csv-utils'" --include='*.js' . | grep -v node_modules
```

## Acceptance Criteria

**AC#0 — RULED.** `EXTRA_BME_AGENTS` retires by **option (c): delete the export *and* every consumer
that would otherwise be vacuous.** Operator ruling **2026-09-28**, after Round 1.

Recorded so the alternatives are not silently re-litigated. Option (a) (empty the array) was rejected
because 12 production sites go quiet, including `scripts/update/lib/validator.js:359-365`
(`Standalone bme agent files missing` becomes unconditionally satisfied) together with its own fixture
at `tests/unit/validator.test.js:227` — both halves of one contract, nothing red. Option (b) (delete the
export, leave consumers) was rejected because it is silently coerced at
`scripts/lib/agent-manifest-generator.js:299`/`:304` (`|| []`) and `scripts/audit/lib/installed-tree.js:291`
(returns `[]` for `undefined` **before** the `malformed.push` on the next line), and at
`scripts/update/lib/validator.js:326` it is caught and mistranslated into a check failure that
`scripts/update/lib/migration-runner.js:163-164` escalates into an **update rollback** for the operator.

**Consequence of (c) that (a) would not have had:** the skills-generation loop is deleted, which changes
the wrapper baseline. See AC#14.

**AC#1 — the premise is re-derived before anything is edited.** Re-run these before editing. Each states
what must be true, so "disagrees" has a referent.

```bash
# 1. MUST print `has 1: true` then `has 1: false`. AC#10 depends on exactly this.
node -e "const r=require('./scripts/update/lib/agent-registry.js');
const {validCountsFor}=require('./scripts/docs-audit.js');
const a={...r}; delete a.EXTRA_BME_AGENTS;
console.log('has 1:',validCountsFor(r,'AGENTS').has(1));
console.log('has 1:',validCountsFor(a,'AGENTS').has(1))"

# 2. MUST return nothing — the parity gate carries no in-file waiver.
grep -n 'waiver\|allowlist\|EXEMPT' scripts/audit/agent-surface-parity.js

# 3. MUST return exactly the four csv-utils consumers named in AC#3.
#    NOT scoped to scripts/ and tests/, and NOT filtered — the earlier form of this
#    command excluded tests/team-factory/ and never searched _bmad/, so it could not
#    see two of the four. Round 1, Blind Hunter + Acceptance Auditor.
grep -rn "utils/csv-utils'" --include='*.js' . | grep -v node_modules

# 4. MUST print 3 and true. If it prints anything else the baseline is already stale
#    and AC#14's arithmetic does not hold.
node -e "const {wrapperTemplates}=require('./scripts/audit/agent-surface-parity.js');
const fs=require('fs'); const t=wrapperTemplates(process.cwd(),'HEAD');
console.log(t.length, t.join('\n~~~\n').trimEnd()===fs.readFileSync('.github/expected-wrapper-template.txt','utf8').trimEnd())"
```

If any disagrees, stop and re-scope.

**AC#2 — the package stops carrying it.** `_bmad/bme/_team-factory/` is absent from `package.json`
`files[]`, and the packed tarball contains no file under that path:

```bash
npm pack --dry-run --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
const f=JSON.parse(s)[0].files.filter(x=>x.path.includes('_team-factory'));
console.log(f.length===0?'PASS: 0 packed':'FAIL: '+f.length+' still packed');
process.exit(f.length===0?0:1)})"
```

*(The exit code is wired deliberately — the earlier form printed `FAIL` and exited 0, so it could not
gate anything. Round 1, Blind Hunter L19.)*

**AC#3 — the cross-module dependency is broken, and all four consumers are repointed.** Relocate
`csv-utils` to `scripts/lib/csv-utils.js` and repoint **every** consumer in the same commit:

| Consumer | Note |
|---|---|
| `scripts/audit/audit-bmm-dependencies.js:13` | top-level, unguarded; target of the shipped `convoke-audit-bmm-deps` bin |
| `scripts/convoke-doctor.js:337` | lazy + try/catch; **delete the degradation branch** at `:339-340` or the wrapper check goes permanently dark with a yellow warning |
| `_bmad/bme/_team-factory/lib/validators/end-to-end-validator.js:7` | intra-module, relative specifier — the tree stays in git, so this must keep resolving |
| `tests/team-factory/csv-utils.test.js:4` | `package.json:51` runs `tests/team-factory` in `npm test` |

Copying rather than moving is **not** acceptable: two divergent copies would leave the only tested one
inside the module that stopped shipping. Proven by `scripts/audit/try-fresh-install.sh`, whose
`:303-308` documents this exact trap and whose `:327` and `:341-343` enforce it.

**AC#4 — every derived artifact moves with the registry.** `_bmad/_config/agent-manifest.csv` is
**regenerated** (`npm run generate:manifest`), never hand-edited — it does not ship and is not a source.
`_bmad/_config/skill-manifest.csv` row 106 is deleted by hand. `_bmad/bme/_config/name-registry.csv:27`
(the `agent,Loom Master` row) is retired or moved out of `['shipped','in-dev']`, and the now-dead
carve-out at `scripts/audit/name-registry-integrity.js:270` goes with it. `_bmad/bme/README.md:15`'s
table row and its live `./_team-factory/` link are removed. State no row counts; derive them.

> ⚠ **`name-registry.csv:8` is NOT in scope and must not be retired.** It is the `team,loom,…` row.
> The A4 check filters `norm(r[idx.kind]) === 'agent'` (`name-registry-integrity.js:460-462`), so a
> `kind: team` row can never produce a drift finding — there is nothing to fix. Retiring it would
> delete a live taxonomy name: `loom` is a declared platform initiative
> (`_bmad/_config/taxonomy.yaml:19`), is `T179`'s own portfolio, and is this epic's portfolio.
> Round 1, Blind Hunter H1.

> ⚠ **`skill-manifest.csv` is a CANDIDATE list, not an inventory.** Most of its `path` values do not
> resolve in a given install and **that is the design** — read `convoke-note-backlog-completed-archive.md`
> § `## BUG-14` and the seeding predicate in `refresh-installation.js` (the JSDoc headed *"THE SEEDING
> PREDICATE, and the single definition of it"*) before touching this file. The trap has caught four
> attempts and cost one reverted ADR. Delete row 106; change nothing else about the file.

**AC#5 — the install path stops copying it, and the write-op snapshot moves with it.** The
standalone-bme-submodule block at the `// 2b1. Standalone bme submodule trees` block in `refresh-installation.js` (copy, version
assert, `scDoc.set('version')`, write) is removed, and `scripts/audit/install-scope-check.js` is updated
in the same commit with a dated comment in the house style. **Its current tracked value is `expected: 14`
at `:135`** — the `8→9→10→11→10→13` chain in the comments above it is *history*, not the live figure.

**AC#6 — nothing is left asserting nothing, and nothing is left throwing.** Option (c) means every
iterate/spread consumer is removed, not merely allowed to go quiet.

**Enumerate with the bare symbol. Do not pattern-match the usage.** Two attempts at a narrower
enumeration have now failed in opposite directions — a hand list that omitted three sites, then a
usage-shaped regex that missed two *more*, including the one AC#0 itself cites. `EXTRA_BME_AGENTS`
appears with `.filter(` on the **next line** (`validator.js`), and as `REG.EXTRA_BME_AGENTS` in tests;
no clever pattern survives contact with both. So:

```bash
grep -rn 'EXTRA_BME_AGENTS' --include='*.js' scripts/ tests/
```

At `aaa178c3` that returns **76 references across 19 files**. It cannot miss, because it matches the
symbol rather than a guess about how the symbol is used. Classify every hit as one of: **iterate/spread**
(must be removed under option (c)), **destructuring import** (must be removed with its last use),
**export** (goes with the array), or **comment/prose** (rewrite or delete). Record the four counts you
derive; do not carry a total from this file.

Do **not** re-narrow this grep to make the output shorter. That is what failed twice.

> **Correction from Round 1.** An earlier draft claimed
> `tests/unit/refresh-installation-orphan-cleanup.test.js:206-217` would contradict the stale sweep.
> It does not: `cleanupOrphanWorkflowWrappers` skips agent wrappers unconditionally
> (`cleanupOrphanWorkflowWrappers`'s `// Skip agent wrappers` guard), the test builds its own fixture and never reads the registry.
> There is nothing to decide there. Blind Hunter H10.

**AC#7 — the documentation stops advertising it, and the Covenant stops demonstrating with it.**

Audited corpus first (`scripts/docs-audit.js:111-139` is the list; `npm run docs:audit` must exit 0).
Build the site list mechanically rather than from this AC — `mechanical-research-enumeration`:

```bash
# The corpus is an export — read it, never retype it. 8 of its 17 entries carry hits
# at aaa178c3 (38 lines); a hand-typed 7-file list omitted CHANGELOG.md.
node -e "console.log(require('./scripts/docs-audit.js').USER_FACING_DOCS.join('\n'))" \
  | xargs grep -n -e 'Team Factory' -e 'team-factory' -e 'Loom Master'
```

**The Covenant needs three different treatments, not one.** The earlier draft flattened all four sites
into "replacement worked examples", which is untruthful for two of them (Round 1, Acceptance H3 + Blind
Hunter H7):

| Site | What it actually is | Treatment |
|---|---|---|
| `covenant-operator.md:130` | a genuine `**Good example.**` cell (Right to rationale) | **replace** with a Vortex or Gyre example |
| `covenant-operator.md:170` | a genuine `**Good example.**` cell (Right to pacing) | **replace** with a Vortex or Gyre example |
| `covenant-operator.md:208` | *"**One scoped verdict.** Loom's `add-team` passes Right to pacing on the audited step-01…"* — a record of what the 2026-04-25 audit did | **leave as-is.** Rewriting it to name Vortex or Gyre falsifies the audit record. If it needs anything, it needs a dated note that the audited module no longer ships — not a substitution |
| `compliance-checklist.md:467` | the **definition** of structural-anomaly category 5, with `add-team` as its example and **N=1** stated | **leave as-is, and file a separate finding.** No Vortex or Gyre substitute exists; inventing one asserts an anomaly that is not there. Separately, `ls _bmad/bme/_team-factory/workflows/add-team/` shows `workflow.md` **is present**, so the example may already be stale — verify and file, do not fix here |

`CHANGELOG.md` is **exempt** from stale-reference checking (`scripts/docs-audit.js:752`). Add a new
entry; do **not** rewrite `:143` or `:222`. They are historical claims about what a past release did —
true as scoped, and `T152`'s version-scope class, which AC#10 files rather than fixes.

**AC#8 — STRUCK, split out as `T222`.** This AC required a migration that removes
`_bmad/bme/_team-factory/` from an existing project. Round 1 found six defects on it, one of them
dangerous: **migrations receive only `projectRoot` and there is no dev-tree guard** —
`grep -n 'isSameRoot' scripts/update/lib/migration-runner.js scripts/update/convoke-update.js` returns
nothing — so running `convoke-update` inside a Convoke clone would delete the tracked source this epic
exists to preserve. The prescribed remedy was also wrong: `moveToDeprecated` is non-exported
(`1.0.x-to-1.3.0.js` closes `module.exports` at `:59`, declares the helper at `:67`) and its contract is
`(targetDir, workflowName) → targetDir/workflows/_deprecated/<workflow>`, which would leave
`config.yaml` in place and the defect alive.

The row is struck, not deleted, so the reasoning survives. The orphan problem is real and is now `T222`.
**Do not re-add a destructive operation to this story.**

**AC#9 — `T150` is closed by deletion, not by correction.** With no agent-owned workflow left,
`EXTRA_BME_WORKFLOWS` is never added. This answers `T150`'s stated open design question — *"whether
`add-team` belongs in its own roster, an existing one, or outside the count"* — with "outside the
count", on the authority of the **2026-09-28 bundling ruling** recorded in `T150`'s Dependencies cell
(*"do NOT ship the `EXTRA_BME_WORKFLOWS` export standalone"*), not by this story's fiat.

The three `T150` comments in `scripts/docs-audit.js` (`:57-59`, `:192-196`, `:640-643`) and the one in
`tests/unit/docs-audit.test.js:721-722` assert a live undercount and become **false**. Delete the `T150`
clauses.

⚠ **Do not delete the `(from exported rosters)` string at `scripts/docs-audit.js:644`.** Its
justification is a conjunction — `T150` *and* `T156` — and `T156` survives. Remove the `T150` sentence;
the qualifier stays, justified by `T156` alone.

**AC#10 — the `# one agent` false positive is handled.** `docs/testing.md:102` is
`node --test tests/p0/p0-emma.test.js  # one agent`, a true sentence inside a bash fence. It passes today
only because `EXTRA_BME_AGENTS.length === 1` makes `1` a legal agent count (AC#1 cmd 1 proves it). Fix
the **instance** — reword so it carries no bare count. **Do not widen the matcher**: that is `T152`'s
class firing on a *shrinking* roster; file it (AC#12), do not fix it here.

> `docs/testing.md:45` (`npm test # tests/unit, tests/team-factory, …`) is **not** in scope. It
> advertises a test directory, not a capability, and `package.json:51` still runs `tests/team-factory`
> because the tree stays in git. Editing it would make a correct doc wrong. Round 1, Acceptance M1.

**AC#11 — a consumer audit closes the story.** Per `code-review-convergence`, independent of the
implementer, across the **whole repository** — not the diff. Enumerate every changed symbol, context
key, `run:`/CLI contract and documented capability, then `git grep` for each **and for the behaviour
each implements, phrased as a reader would describe it**. Known prose-only sites to confirm are covered:
`.github/ISSUE_TEMPLATE/bug_report.yml:23` · `.gyre/capabilities.yaml:277-282` · `CONTRIBUTING.md:12` ·
`CREDITS.md:32`, `:36` · `docs/what-convoke-brings-to-bmad-method.md:67`, `:97` · `docs/references.md:39`,
`:178`, `:848` · `.github/workflows/ci.yml:125` · `scripts/docs-audit.js:180` ·
`_bmad/_config/taxonomy.yaml:81` · `scripts/update/lib/taxonomy-merger.js:28` ·
`scripts/lib/portfolio/portfolio-engine.js:75` · `scripts/portability/export-engine.js:203`.

**AC#12 — the backlog is closed by the change.** `T179` and `T150` move to §2.5 with closing notes;
lanes stay ordered and `node scripts/audit/backlog-integrity.js` exits 0. File as **new rows**, not as
story work: `T152`'s shrinking-roster class (AC#10), and the `compliance-checklist.md:467` staleness
(AC#7). **`T151` is a backlog action, not an AC** — the epic puts it out of scope, it carries a
2026-09-12 operator ruling, and closing it here would retire that obligation without a new one. Note it
in the closing note; do not gate the story on it.

**AC#13 — the gates that actually run, run.** `npm test` does **not** include `tests/integration`
(`package.json:51`), and CI does (`.github/workflows/ci.yml:68`). Run **both** `npm test` and
`npm run test:integration` locally, or **four** integration assertions go green locally and red in CI:
three `EXTRA_BME_AGENTS` sites (`upgrade-cli-e2e.test.js:115`, `convoke-doctor.test.js:277`, `:338`)
plus AC#15's hardcoded `12` at `fresh-install.test.js:251`, which is also under `tests/integration`.

Mutation evidence per `verification-must-be-falsifiable`: record *(edit to make → test that goes red)*,
never a mutant identifier. Two traps specific to this story:

- **Choose mutants that land on one side.** The installed-tree check compares an expected set derived
  from the registry against what arrived. Mutating the registry moves **both** sides and the gate
  correctly reports clean. Inject where they genuinely disagree: an installer that drops a unit the
  registry still declares.
- **"Derived survives" is false for a removal.** Tests that derive `EXTRA_BME_AGENTS.length` correctly
  per `derive-counts-from-source` break anyway, because the *symbol* disappears. Do not read a red
  derived test as a defect in the test.

**AC#14 — the wrapper baseline is regenerated in the same commit.** *(New at Round 1 — Edge Case Hunter
H1. The epic's claim that C10–C13 are satisfied by not deleting the tree was **false**: this gate fires
from the generator edit alone.)*

`agent-surface-parity.js:134-149` extracts every `const content = \`` literal from the **committed**
generator via `git show <ref>:<generator>`. There are three, and the third sits inside the
`// 6b1.` `for (const agent of EXTRA_BME_AGENTS)` loop that AC#6 deletes. Derive it — do not trust this
sentence, and do not trust a line number for this file (see Traps):

```bash
git show HEAD:scripts/update/lib/refresh-installation.js | grep -c 'const content = `'   # 3
```

The extraction then yields two, the comparison against `.github/expected-wrapper-template.txt` fails,
severity `BROKEN`, exit 2 — and `agent-surface-parity` is in `publish.needs` (`.github/workflows/ci.yml:666`),
so this blocks release, not just a push.

Because the extractor reads a **git ref**, the baseline cannot be regenerated from an uncommitted tree.
Commit the generator change, then regenerate and amend:

```bash
node -e "const {wrapperTemplates}=require('./scripts/audit/agent-surface-parity.js');
require('fs').writeFileSync('.github/expected-wrapper-template.txt',
  wrapperTemplates(process.cwd(),'HEAD').join('\n~~~\n'))"
```

Verified at `66a34b73`: run against the unmodified tree it extracts **3** templates and reproduces the
committed baseline byte-for-byte, so the command is known-good before it is relied on. After the edit it
must extract **2**.

**AC#15 — the three tests that go red are fixed.** *(New at Round 1 — Acceptance H5. Epic constraint C8
named these and no AC disposed of them, so `npm test` would have failed with nothing instructing a fix.)*
`tests/unit/team-factory-wiring.test.js:15-23` (the whole file is obsoleted), `tests/unit/module-skew.test.js:112`,
and `tests/integration/fresh-install.test.js:251` (hardcoded `12`; replace with a derivation, never
another literal — `derive-counts-from-source`).

## Tasks / Subtasks

- [ ] **Task 1 — re-derive the premise (AC#1).** All four commands; stop on any disagreement.
- [ ] **Task 2 — relocate `csv-utils` (AC#3).** Move to `scripts/lib/`; repoint all four consumers;
      delete the doctor's degradation branch. Must precede or accompany Task 3.
- [ ] **Task 3 — unship (AC#2, AC#4, AC#5).** `files[]`; delete the export and its consumers per (c);
      install block; `install-scope-check.js` snapshot + comment; regenerate the agent manifest;
      hand-delete `skill-manifest.csv` row 106; retire `name-registry.csv:27` **only**; the dead
      carve-out; `_bmad/bme/README.md:15`.
- [ ] **Task 4 — dispositions (AC#6).** Derive the 25 sites; give each one.
- [ ] **Task 5 — docs and Covenant (AC#7, AC#9, AC#10).** Three treatments, not one. Delete the `T150`
      clauses, keep `(from exported rosters)`. Reword `docs/testing.md:102`; leave `:45` alone.
- [ ] **Task 6 — tests (AC#15).** Fix the three; derive, never re-literal.
- [ ] **Task 7 — the wrapper baseline (AC#14).** Commit first, regenerate, amend. Confirm the extractor
      reports 2.
- [ ] **Task 8 — gates (AC#13).** `npm run lint` clean on modified files; `npm test` **and**
      `npm run test:integration`; `npm run docs:audit` exit 0; `backlog-integrity`; `install-scope-check`;
      `name-registry-integrity`; `agent-surface-parity`; `scripts/audit/try-fresh-install.sh` — the only
      gate that packs and installs a real tarball, and the one that catches AC#3.
- [ ] **Task 9 — consumer audit and backlog close (AC#11, AC#12).** Independent of the implementer.

## Dev Notes

### Current state of what changes

- **`scripts/update/lib/agent-registry.js`** — `EXTRA_BME_AGENTS` array closes at `:242`;
  `EXTRA_BME_AGENT_IDS` derived at `:244`; both exported at `:290-291`; the disjoint-ID IIFE runs
  `:252-274`.
- **`scripts/update/lib/refresh-installation.js`** — its single `require('./agent-registry')` destructures
  eight named exports and performs **no** dynamic enumeration, so a new export would be inert here.
  `EXTRA_BME_AGENTS` appears on **8 lines: 5 code sites and 3 comments.** Named by anchor, never by
  line, because this file's lines move under concurrent work (see Traps) — the copy loop has been at
  three different lines during this story's authoring alone. The five code sites: the destructuring
  import; the `// 2b1. Standalone bme submodule trees` copy loop; the stale-wrapper sweep's
  `currentSkillDirs` spread; the `// 6b1.` skills loop; and `STAMPABLE_MODULES` — module-level and
  frozen, so a throw there happens at import and takes `scripts/lib/bme-modules.js`'s
  `isManagedByInstaller` with it.

  ⚠ `grep -c` returns **8, not 5** — it counts matching lines, comments included. Separate them, and do
  not use the raw count as the site count:

  ```bash
  grep -n 'EXTRA_BME_AGENTS' scripts/update/lib/refresh-installation.js | grep -v '^\s*[0-9]*: *[*/]'
  ```
  **The `// 6.`-through-`// 6b1.` band is unguarded by `!isSameRoot` as a whole** (the file's markers are `// 6.`, `// 6b.`, `// 6b1.`, `// 6c.`, `// 6d.`, `// 6d-bis.`, `// 6e.` — there is no `// 6a.`) — the `for (const agent of AGENTS)` and `for (const agent of GYRE_AGENTS)` loops are equally unguarded, and the nearest `!isSameRoot` guards sit outside that whole band. *(An earlier
  draft called the standalone loop the exception. It is not. Round 1, Blind Hunter H9.)*
- **`scripts/docs-audit.js`** — `rostersFor` `:48-52` enumerates by suffix over `Object.keys`, so it
  needs no edit when a roster disappears; `validCountsFor` `:98-106` drops zero-length rosters.
- **`_bmad/bme/_team-factory/config.yaml`** — declares `agents: [team-factory]` and
  `workflows: [add-team]`; the `workflows:` value is a bare string, which `installed-tree.js` skips —
  which is why a tree that arrives with an emptied registry declares **zero** invocable units and trips
  ADR-004 C3. Under (c) the tree never arrives, so this does not fire.

### Traps

- **Never `git stash`.** The operator commits from GitHub Desktop mid-session; a stash/pop race stages
  a revert of their work.
- **Never instruct line-level staging on a modified line.** A modified row is `-old` / `+new`; staging
  the `-` side alone deletes it silently. This has destroyed backlog records twice.
- **`npm pack --dry-run` is the only way to know what ships.** `files[]` is a declaration; the tarball
  is the fact.
- **Re-derive; do not trust this file's prose over the tree.** Round 1 found seven of this story's own
  claims wrong — a figure with no derivation, a consumer count short by one, a gate claim about the
  wrong loop, two Covenant sites misdescribed, a test contradiction that did not exist, and a
  `name-registry` row that is invisible to the check cited for it. Every one was written confidently.

### Testing standards

`test-fixture-isolation` — every `runScript` call passes `{ cwd: tmpDir }`. `derive-counts-from-source` —
no literal agent or workflow count enters a new assertion. `verification-pipefail` — any verification
command that pipes sets `set -o pipefail` or reads `${PIPESTATUS[0]}`; the local shell is zsh, where it
is `${pipestatus[1]}`. `lint-passes-before-review` — `npm run lint` unfiltered, zero warnings in files
this story modifies.

### References

- [convoke-epic-team-factory-unship.md](../planning-artifacts/convoke-epic-team-factory-unship.md)
- [convoke-note-initiative-lifecycle-backlog.md](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md) — `T179`, `T150`, `T222`
- [convoke-note-backlog-completed-archive.md](../planning-artifacts/convoke-note-backlog-completed-archive.md) — § `## BUG-14`
- [tfr-2-1-delete-the-regression-check-that-cannot-fail.md](tfr-2-1-delete-the-regression-check-that-cannot-fail.md)
- [project-context.md](../../project-context.md)

## Review Findings — Round 1, 2026-09-28 (three independent layers)

Blind Hunter, Edge Case Hunter and Acceptance Auditor, each run without this session's context against
`21ed0512..66a34b73`. Defect · fix · reproducing command. No tallies, no round narrative.

| Defect | Fix | Re-derive |
|---|---|---|
| Epic claimed C10–C13 are satisfied by not deleting the tree. False — deleting the skills loop breaks the wrapper baseline, and that gate is in `publish.needs` | AC#14 added | `node -e "…wrapperTemplates(process.cwd(),'HEAD').length"` → 3 now, 2 after |
| AC#8's migration had no dev-tree guard; would delete the tracked source in a clone | AC#8 struck → `T222` | `grep -n 'isSameRoot' scripts/update/lib/migration-runner.js scripts/update/convoke-update.js` → nothing |
| AC#8 prescribed `moveToDeprecated`, which is non-exported and archives a *workflow*, leaving `config.yaml` in place | AC#8 struck | `sed -n '55,75p' scripts/update/migrations/1.0.x-to-1.3.0.js` |
| AC#4 ordered retiring `name-registry.csv:8`; the A4 check cannot see `kind: team` rows, and `loom` is a live taxonomy name | scope narrowed to `:27`, with a warning | `sed -n '458,464p' scripts/audit/name-registry-integrity.js` |
| AC#1's re-derivation command was filtered so it could not see two of the four `csv-utils` consumers | command replaced | `grep -rn "utils/csv-utils'" --include='*.js' . \| grep -v node_modules` → 4 |
| Header claimed `path-safety` requirements that AC#8 did not contain | safety analysis now states "not in scope", with the reason | — |
| AC#7 ordered replacing two Covenant sites that are not worked examples | split into three treatments | `sed -n '208p' _bmad/bme/covenant/covenant-operator.md` |
| Epic said "three of T179's four are inaccurate"; one is | epic corrected | `grep -n '^| T179 ' …initiative-lifecycle-backlog.md` |
| Epic C8 named three failing tests; no AC fixed them | AC#15 added | — |
| "twelve sites" appeared twice with no derivation | replaced with a derived 25/13/12/13 and the command | the grep in AC#6 |
| Claimed contradiction at `refresh-installation-orphan-cleanup.test.js:206-217` does not exist | claim retracted in AC#6 | `sed -n '1255,1256p' scripts/update/lib/refresh-installation.js` |
| Dev Notes called the standalone skills loop the only one unguarded by `!isSameRoot`; its siblings are equally unguarded | note corrected | `grep -n 'isSameRoot' scripts/update/lib/refresh-installation.js` |
| `npm test` excludes `tests/integration`; three sites would pass locally and fail in CI | AC#13 requires both | `node -e "console.log(require('./package.json').scripts.test)"` |
| AC#2's derivation printed `FAIL` and exited 0 | exit code wired | run it at HEAD |
| Citation drifts: `docs-audit.js:750`→`:752`, `installed-tree.js:292-296`→`:291`, `migration-runner.js:146`→`:163-164`, `validator.js:359-366`→`:359-365`, `agent-registry.js:228-243`→`:242` | corrected | — |

## Review Findings — Round 2, 2026-09-29 (one scoped layer)

Scoped to the executable logic Round 1's remediation rewrote — not its prose, per the stopping rule.
**Both HIGHs were regressions introduced by Round 1's own corrections**, which is why the instrument was
changed rather than the patch repeated.

| Defect | Instrument change | Re-derive |
|---|---|---|
| AC#6's usage-shaped regex missed 2 sites, including the one AC#0 cites. `EXTRA_BME_AGENTS` appears with `.filter(` on the *next* line, and as `REG.EXTRA_BME_AGENTS`. 25 was a floor presented as a denominator | **stopped pattern-matching usage** — enumerate the bare symbol (76 refs / 19 files) and classify. Two narrow enumerations had already failed in opposite directions | `grep -rn 'EXTRA_BME_AGENTS' --include='*.js' scripts/ tests/` |
| AC#14 and Dev Notes cited `:907`; at HEAD that is the Enhance loop, and the text Round 1 *replaced* (`:879-902`) was correct. The "correction" was derived from another session's uncommitted tree | **no line numbers for this file at all** — anchors only. And the *check* widened: `grep -c 'refresh-installation.js:[0-9]'` returned 0 while bare `` `:907` `` survived | `git show HEAD:scripts/update/lib/refresh-installation.js \| sed -n '907p'` |
| `sed -n '477p'` returned `T178`; `T222`'s own insertion moved `T179` in the same commit that first cited its line | row match, never a line number | `grep -n '^| T179 ' …lifecycle-backlog.md` |
| The `// 6a.` anchor matched nothing — the file has no such marker | markers enumerated inline | `grep -oE '// 6[a-z0-9-]*\.' scripts/update/lib/refresh-installation.js \| sort -u` |
| AC#7's "mechanical" command had a dead `node -e` that discarded its result and could not fail, then hand-typed 7 corpus files | reads `USER_FACING_DOCS` and pipes to `xargs grep`; the hand list had omitted `CHANGELOG.md` | the command in AC#7 → 38 hits / 8 files |
| AC#13 said three integration assertions; four go red | corrected | `node -e "console.log(require('./package.json').scripts.test)"` |

**Found by me during this remediation, not by the layer** — both by running what I had just written:
`grep -c 'EXTRA_BME_AGENTS' <generator>` returns **8, not 5** (it counts comment lines), so a sentence
written to fix a falsifier contained a wrong falsifier; and AC#7's replacement was first written as a
multi-line `node -e` that is the shape `T136` exists about, so it was simplified to a pasteable form.

**Deferred, not fixed:** `T222` sub-claim (g) names `install-all-agents.js` → `refreshInstallation`
directly; the call is one hop further on, in `install-vortex-agents.js`. The conclusion holds. Not
corrected here because the backlog carries another session's uncommitted rows and must not be touched.

**Round 3 is not triggered.** `code-review-convergence` fires Round 3 only on structural change — new
files, renamed functions, altered control flow. This remediation changed three commands, a set of
citations and one count claim. Nothing structural.

**Not accepted:** the Acceptance Auditor read `deferred` as straining its own definition ("complete").
The status is now `ready-for-dev`, so the point is moot rather than resolved.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change |
|------|--------|
| 2026-09-28 | Authored. Status `deferred` pending AC#0. |
| 2026-09-28 | Round 1 (3 independent layers) → 9 HIGH. AC#0 ruled option (c); AC#8 struck to `T222`; AC#14 and AC#15 added; AC#1, AC#3, AC#4, AC#6, AC#7, AC#13 corrected. Status → `ready-for-dev`. |
