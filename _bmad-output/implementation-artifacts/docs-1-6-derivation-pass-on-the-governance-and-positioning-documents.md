---
baseline_commit: 9e986db842b3b99b36e9a1000b27d8a0de419e41
---

# Story 1.6: Derivation pass on the governance and positioning documents

Status: review

## Story

As a reader arriving through the project's front matter,
I want its contact routes, attributions and positioning claims to be current,
so that a security report reaches someone and a credit names the right person.

## Acceptance Criteria

> ### Start here
>
> **Two sections carry everything you cannot derive yourself. Read them first:**
> **AC4** — four operator rulings already made (the CoC contact in particular **cannot** be derived from
> this repository; do not invent one). **AC4a** — the canonical defect → task map; if any other section
> disagrees with it, AC4a wins.
>
> Everything else is measurement you can re-run.

> ## Read this before AC1 — four things make this story unlike 1.5
>
> **1. Reconnaissance already found ~20 confirmed defects.** They are listed in AC5 with the command
> that proves each. Your job is to **verify and fix**, not to rediscover. Any of them may have moved
> since 2026-09-13 — re-run the command before editing.
>
> **2. The worst file is the one the gate already watches.** `docs/testing.md` IS in `USER_FACING_DOCS`,
> and `npm run docs:audit` exits **0** on it while its headline test count is off by **2,933**, its
> coverage figure by 5 points, and its entire "Known Coverage Gaps" table is obsolete. *A green gate
> bounds only what it inspects.* The gate's checks cover exactly the classes in that file that HOLD.
>
> **3. Admitting files to `USER_FACING_DOCS` is NOT the remedy here — this REVERSES 1.5's instinct.**
> Story 1.5 admitted a file to that array and it was right. Here it is wrong, and that was measured:
> all six per-file checks return **empty** on `SECURITY.md`, `CREDITS.md` and `CODE_OF_CONDUCT.md`, so
> admitting them catches **none** of this story's defects — while falsifying the "17 user-facing files"
> claim that 1.5 pinned with a test. AC6 rules on this.
>
> **4. Four rulings are already made.** They are in AC4. Do not re-litigate them, and do not guess where
> they apply — particularly the enforcement contact, which **cannot be derived from the repository**.

**AC1 — re-derive, and treat two `0`s as the trap they are.**

**Given** the epic records this story's load as **28** (FR6), an input taken before the pinned script existed
**When** the counts are re-derived with
`node scripts/audit/derived-assertions.js docs/testing.md SECURITY.md CREDITS.md CODE_OF_CONDUCT.md docs/what-convoke-brings-to-bmad-method.md README.md docs/references.md`
**Then** the output is recorded with its command, and the divergence from the epic's input is reported **as a finding about the input**, both sides visible
**And** the counts are recorded as **FLOORS** — the script says so and reports a non-zero residual (`T160`)
**And** ⚠ **`CREDITS.md` and `CODE_OF_CONDUCT.md` are recorded as `0` in the findings note's density table and are NOT zero any more** — each now floors at `1`. The epic's own AC says "a zero-assertion file is recorded as `0` with the script output as its evidence", which an implementer reading the stale table will apply to two files that no longer qualify. **Derive; do not read the table.**
**And** **`README.md` carries the LARGEST load in this story — 45, above `docs/testing.md`'s 38.** Its `Assertions` cell reads `—` (not blank; `—` also appears for two files that ARE examined), and `Examined:` is `no`: Story 1.1 *edited* README without ever deriving it. Weight effort by the re-derived floors, not by which file has the most known defects — `README` has 45 assertions and only 2 named defects, so it is the largest *unexamined* surface here
**And** the expected total is **112**, which is exactly what Story 1.4 projected for this story (findings note: *"remaining load, Story 1.6 | 112 (includes `README.md`)"*). **The divergence to report is against the epic's stale `28`, not against 1.4 — and on today's evidence no scope call is owed.** If a future re-derivation does invalidate 1.4's projection, that is raised to the operator, never absorbed silently.

**AC2 — the counter is a sizing instrument, not a worklist.**

**Given** that most of `docs/testing.md`'s defects fall outside the counter entirely — count the AC5 rows whose evidence command is not `derived-assertions.js`, rather than taking a figure here
**When** the worklist is built
**Then** the script's output is a floor, and **each missing class is swept by its own enumerating command**, reported per class with **`0` written as `0`**:

| Missing class | Where it bites in this story |
|---|---|
| **Statistics and percentages** | test totals, coverage figures, c8 thresholds — **6 of 6 are wrong in `testing.md`** |
| **Word-form counts** | `Six jobs` — correcting the numeral without the sentence leaves it false |
| **Table-internal arithmetic** | `testing.md`'s integration table sums to **53** under a headline of **54**. No source-derivation pass finds this; only reading the table's own arithmetic does |
| **Partial-truth sentences** | *"`convoke-doctor` checks Gyre agents, workflows, config, and contracts"* — three nouns true, one false |
| **Behavioural prose** | "runs on every push and pull request", "travels cleanly", "installs both" |
| **Unbackticked prose paths** | `0` in `testing.md` — verified, every path token is backticked or a link target |
| **Requirement identifiers** | `0` in `testing.md` |
| **Dates** | `0` in `testing.md`; `references.md:6` carries one and it HOLDS |
| **Agent and team names** | rosters against `scripts/update/lib/agent-registry.js` — all 7 in `testing.md` HOLD |
| **CI job names** | 6 named and all exist, but **5 jobs are omitted** and one named job runs on neither trigger |

**And** every link and anchor is resolved by command, and each is checked for whether the target **says what the citing sentence claims** — three of this story's defects (`D46`, `D47`, `D53`) resolve perfectly and say something else
**And** the same claim is searched for in the sibling files before a finding is written — `D44` is a two-file contradiction and fixing the wrong side is the trap.

**AC2a — EVERY assertion is dispositioned. This is the story's real size, and it is 112, not 19.**

**Given** the epic's clause, verbatim: *"every file — including one scoring zero — has each of its counted
assertions individually marked checked or reported as a finding. A file may be **quick**; it may not be
**skipped**"*
**When** the pass runs
**Then** each of the **112** counted assertions is marked **checked** or **reported as a finding** — the
~19 defects in AC5 are the *known* subset, not the worklist
**And** the assertions that HOLD are recorded as holding, following Story 1.4's precedent verbatim:
*"a silent assertion is indistinguishable from an unexamined one"*
**And** ⚠ **do not enumerate 112 holding assertions one by one in prose.** Story 1.4's review killed that
twice — a transcribed per-kind tally goes stale the moment the instrument changes. Record them **grouped
by file and class, with the command that regenerates them**, plus the disposition count per file
**And** a file scoring `1` (`CREDITS.md`, `CODE_OF_CONDUCT.md`) still owes its one disposition.

**AC3 — external identifiers: executed, because the tooling is already to hand.**

**Given** every contact route, handle, account identifier or external URL in these files
**When** it is verified
**Then** it is **executed** — `gh auth status` shows an authenticated account and the network is available, so GitHub handles, repo URLs, reporting routes and npm facts are **executable, not hedgeable**
**And** ⚠ **the account handle is `amalik`, NOT `amalikamriou`.** The git display name is *Amalik Amriou* and the working directory is `/Users/amalikamriou/`, both of which invite the wrong value. `SECURITY.md:20` currently uses `amalik` and is **correct** — a validator proposing `amalikamriou` is the exact failure `feedback_verify_external_identifiers` records, and applying it would break the project's only reporting route
**And** ⚠ **GitHub's community-health API is a DISALLOWED evidence source for `D43`.** `gh api repos/amalik/convoke-agents/community/profile` reports `health_percentage: 100` **with the blank contact in place** — it matches the file by shape and never reads the reporting line
**And** a claim that genuinely cannot be executed names the command that would settle it and why it could not be run.

**AC4 — four rulings, already made. Apply them; do not re-open them.**

| # | Ruling | Apply as |
|---|---|---|
| **R1** | **The CoC enforcement contact is the GitHub private-reporting route**, not an email. Use `https://github.com/amalik/convoke-agents/security/advisories/new` — verified live (`gh api repos/amalik/convoke-agents/private-vulnerability-reporting` → `{"enabled":true}`), and already the route `SECURITY.md:20` uses. **Do NOT invent an address from git authorship.** | fixes `D43` |
| **R2** | **`docs/testing.md` lines 63-119 ("Agent Test Results") are DELETED**, replaced by a pointer to the live suite (`node scripts/test-runner.js tests/p0`). The section transcribes manual runs from 2026-02-14 against retired agent identities ("Emma (empathy-mapper)", "Wade (wireframe-designer)"). ⚠ **Delete 63-119, not 64-118** — 63 and 119 are blank and 120 is `---`; the narrower range leaves two blank lines before a stray separator, and `npm run lint` is ESLint (JS only) and will not catch it. | closes **`D57` and `D58` only** — see the disposition table below |
| **R3** | **The 7 unfalsifiable positioning claims in `what-convoke-brings-to-bmad-method.md` are OUT OF SCOPE.** FR3a governs count, version and inventory claims; marketing voice is a separate editorial decision and not release-gate work. Fix only the falsifiable defects there (`D44`, `D45`). File the positioning prose as a backlog row. | bounds the file |
| **R4** | **`SECURITY.md`'s SLA and crediting commitments are KEPT.** FR3a targets unfalsifiable claims about the **present**; an SLA is a promise about future conduct, which is what makes a policy a policy. Record the exemption so a mechanical FR3a pass does not gut the section. | protects `SECURITY.md:29` |

**AC4a — the canonical disposition map. If any other section disagrees with this table, THIS TABLE WINS.**

*Every defect, where it lives, and what closes it. An earlier draft had `R2` and Task 5 disagreeing about
which IDs the deletion closes; this table exists so that cannot recur.*

| File | IDs | Closed by |
|---|---|---|
| `CODE_OF_CONDUCT.md` | `D43` | Task 3, per **R1** |
| `CREDITS.md` | `D44` | Task 3 |
| `SECURITY.md` | `D45` | Task 3 |
| `docs/what-convoke-brings-to-bmad-method.md` | `D46`, `D47` | Task 4 |
| `README.md` | `D48`, `D49` | Task 4 |
| `docs/testing.md` — **inside** lines 63-119 | `D57`, `D58` | **R2's deletion**, Task 5 |
| `docs/testing.md` — **outside** that range | `D50`, `D51`, `D52` (`:11`), `D53` (`:51`), `D54` (`:57`), `D55` (`:139-141`), `D56` (`:40`), `D59` (`:129`), `D60` (`:127`), `D61` (`:32`) | Task 5, individually |
| `docs/references.md` | none expected | Task 6 (verify only) |

⚠ **`D50`, `D52` and `D53` are NOT closed by R2's deletion.** `:11` and `:51` sit outside lines 63-119.
Ticking them off with the deletion leaves a live 53-vs-54 contradiction and a false CI sentence.

**AC5 — the confirmed defects. Verify each by its command, then fix.**

*Reconnaissance proved every row on 2026-09-13. Treat them as claims to verify, not findings to copy.*

**`CODE_OF_CONDUCT.md`**

| ID | Claim | Reality | Reproduce |
|----|-------|---------|-----------|
| **D43** | *"reported to the community leaders responsible for enforcement at ."* | **No contact at all.** Line 63 is two bytes — `.` and a newline. The Contributor Covenant placeholder `[INSERT CONTACT METHOD]` was deleted in the file's only commit and never filled. `CONTRIBUTING.md:5` points contributors here. Fix per **R1** | `sed -n '63p' CODE_OF_CONDUCT.md \| od -c` · `git log --oneline -- CODE_OF_CONDUCT.md` |

**`CREDITS.md`**

| ID | Claim | Reality | Reproduce |
|----|-------|---------|-----------|
| **D44** | `- Team Factory 🏭 — builds new BMAD-compliant teams` | The agent's registered name is **`Loom Master`** and the string appears nowhere in the file. Every other row is `Name Emoji Title`; this one substitutes the title for the name. ⚠ **Fix the agent name ONLY.** Do NOT rename the section heading to "Loom" — `name-registry.csv` marks that as *"Two live definitions under one name. Unresolved - operator ruling required"* | `grep -o 'name="[^"]*"' _bmad/bme/_team-factory/agents/team-factory.md` · `grep -n -i loom _bmad/bme/_config/name-registry.csv` |

**`SECURITY.md`**

| ID | Claim | Reality | Reproduce |
|----|-------|---------|-----------|
| **D45** | `:5` "Only the latest published release receives security fixes" vs `:9` table row `4.0.x ✅` | **Self-contradiction.** `4.0.0` is published, matches `4.0.x`, is not deprecated, and is not the latest. ⚠ **Do NOT resolve this by writing `4.0.2` into the table** — `package.json` says 4.0.2 but npm `latest` is **4.0.1**; 4.0.2 is documented in `CHANGELOG.md` and unpublished. Asserting it would name a version no user can install. Fix the **prose**, keep `4.0.x` | `npm view convoke-agents dist-tags` · `npm view convoke-agents@4.0.0 deprecated version` |

**`docs/what-convoke-brings-to-bmad-method.md`** — *never gated; two commits, both 2026-04-24, before 4.0 shipped and before the v6.3 conversion. Expect density here.*

| ID | Claim | Reality | Reproduce |
|----|-------|---------|-----------|
| **D46** | `:88` "The npm package `convoke-agents` installs both BMAD Method and Convoke's extensions in a single dependency" | **Ships zero BMAD files.** No BMAD dependency, no fetch. ⚠ **Two-file contradiction** — `README.md:42` says the opposite and is **correct**. Fix this file, not the README | `npm pack --dry-run --json` (no `_bmad/{core,bmm,tea,cis,bmb,wds}` entries) · `node -e "console.log(require('./package.json').dependencies)"` |
| **D47** | `:18` "implementation (Amelia, Quinn, Bob)" | **No BMM implementation agent named Quinn or Bob ships.** The corrected sentence is "implementation (Amelia)" — `grep -ci amelia` → `1` (`bmad-agent-dev` ships). ⚠ **`grep -ci quinn` on the shipped manifest returns `1`, not `0`** — it is CIS's *"talk to **Dr.** Quinn"*, a different agent. The cited command returns `0` **only because of the `Dr.`**; an implementer who widens the grep will retract a true finding. Quinn/Bob survive only in `_bmad/_config/agent-manifest.csv`, which is **not in the tarball** | `grep -oi "talk to [A-Za-z. ]*quinn" _bmad/_config/skill-manifest.csv` → `talk to Dr. Quinn` · `grep -ci bob _bmad/_config/skill-manifest.csv` → `0` |

**`README.md`**

| ID | Claim | Reality | Reproduce |
|----|-------|---------|-----------|
| **D48** | `:96` the exporter "writes adapters into the export target for Claude (`{target}/CLAUDE.md`), Copilot (`{target}/.github/copilot-instructions.md`) and Cursor (`{target}/.cursor/rules/`)" | **All three paths wrong.** It writes an `adapters/` staging tree and the generated README tells the *user* to copy them into place. The Claude adapter is a `SKILL.md`, never a `CLAUDE.md`. This is the Story 1.1 class | `grep -rn "CLAUDE.md" scripts/portability/` → no hits · `grep -n "writeFileSync" scripts/portability/generate-adapters.js` |
| **D49** | `:98` "what travels cleanly today is the upstream BMAD skill set plus that one" | **False on the file's own definition.** Of 87 upstream rows in the shipped manifest, **38 are `pipeline`** — which the same line says is "flagged non-portable". 43 standalone, 6 light-deps | ⚠ **A naive `split(',')` returns ZERO rows** — descriptions contain commas, and the empty result reads as "claim disproven". Use a quote-aware parse: `node -e "const t=require('fs').readFileSync('_bmad/_config/skill-manifest.csv','utf8');const rows=[];let f='',r=[],q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='\"'){if(t[i+1]==='\"'){f+='\"';i++}else q=false}else f+=c}else{if(c==='\"')q=true;else if(c===',')
{r.push(f);f=''}else if(c==='\n'){r.push(f);rows.push(r);r=[];f=''}else if(c!=='\r')f+=c}}const h=rows[0],m=h.indexOf('module'),ti=h.indexOf('tier');const up=rows.slice(1).filter(x=>x[m]&&x[m]!=='bme');const by={};up.forEach(x=>by[x[ti]]=(by[x[ti]]||0)+1);console.log(up.length,JSON.stringify(by))"` → `87 {"standalone":43,"pipeline":38,"light-deps":6}` |

**`docs/testing.md`** — *the file with the most known defects, and the one the gate already watches. Note `README.md` carries more assertions (45 vs 38); this file carries more found defects.*

| ID | Claim | Reality | Reproduce |
|----|-------|---------|-----------|
| **D50** | `:11` "184 tests (130 unit + 54 integration) \| 83.4% line coverage" | **Off by 2,933.** Real: 2351 + 124 + 642 = **3117**; coverage **88.44%**. ⚠ **Per FR3a and R2's logic, DELETE the arithmetic and name the command** (`npm run test:all`) rather than writing 3117 — nothing pins it and it rots on the next commit. "Correct it" is the obvious-and-wrong instruction | `npm test` · `npm run test:integration` · `node scripts/test-runner.js tests/p0` · `npm run test:coverage` |
| **D51** | `:17-25`, `:31-35` per-suite counts | **9 of 14 wrong** (e.g. `validator.test.js` doc 23 / actual 92). ⚠ **5 rows are correct**, so a two-row spot-check declares the table sound. Derive **all 14**, or delete the counts column. The tables also show 9 of 48 unit files and 5 of 12 integration files while reading as a census | `for f in tests/unit/{utils,registry,version-detector,config-merger,backup-manager,migration-runner,migration-runner-orchestration,validator,migrations-to-1.5.0}.test.js tests/integration/{fresh-install,upgrade,cli-entry-points,installer-e2e,convoke-doctor}.test.js; do echo -n "$f "; node --test "$f" 2>/dev/null \| grep '^ℹ tests'; done` — all 14, no placeholder |
| **D52** | `:11` vs `:31-35` | **The integration table sums to 53 under a headline of 54.** Internal arithmetic, invisible to any source-derivation pass | `sed -n '31,35p' docs/testing.md \| awk -F'\|' '{s+=$3} END {print s}'` → `53`, against `:11`'s `54` |
| **D53** | `:51` "Six jobs run on every push and pull request" | **11 jobs exist; 8 run unconditionally.** Five are omitted, and one of the six named (`publish`) runs on neither trigger. ⚠ Two edits on one line — the numeral **and** the sentence | `node -e "const y=require('js-yaml'),w=y.load(require('fs').readFileSync('.github/workflows/ci.yml','utf8'));const j=Object.keys(w.jobs);console.log(j.length, j.filter(n=>w.jobs[n].if).length+' conditional')"` → `11 3 conditional`. ⚠ **Do NOT count with a bare `grep` on indented keys** — it also matches `push:`, `pull_request:` and `run:`, returning 14-17 depending on the anchor. Parse the YAML |
| **D54** | `:57` "c8 with threshold enforcement (60% lines, 50% branches)" | **Actual: lines 83, branches 80, functions 88** — both stated numbers wrong, a third threshold unmentioned. ⚠ Config lives in `.c8rc.json`, **not** `package.json`; grepping `package.json` concludes no thresholds exist | `cat .c8rc.json` |
| **D55** | `:139-141` "Known Coverage Gaps" | **Obsolete, not stale.** `convoke-update.js` **91.91%** (doc 29), `convoke-version.js` **95.52%** (doc 56), `1.0.x-to-1.3.0.js` **100%** (doc 37). ⚠ **Project memory repeated these same wrong figures** — corrected 2026-09-13. **Memory is not a source** | `npm run test:coverage` |
| **D56** | `:40` "`npm test` — Unit tests" | Runs **four** directories, three of which are not `tests/unit`. `test:p0`, `docs:audit`, `check` and `refs:audit` are absent from the block | `node -e "console.log(require('./package.json').scripts.test)"` |
| **D57** | `:88` Wade's Domain 4 "Error Handling" | The cited source says **"Output Quality"**. ⚠ Domains 1-3 match exactly and the counts are right — everything reads "verified" unless you open the target's headings | `grep -n "^## Domain" _bmad-output/_archive/phase-2/wade-p0-test-execution.md` |
| **D58** | `:90` "Live Test Suite: 5/5 PASSED (activation, full workflow, validation, chat, party mode)" | **Only "activation" is real.** The other four name no test. The 5/5 is sourced from a file `testing.md` never cites | `grep -n "^### Test" _bmad-output/_archive/phase-2/wade-live-test-results.md` |
| **D59** | `:129` Gyre "P0 content tests for voice consistency, persona accuracy, workflow activation" | **Zero Gyre coverage.** `tests/p0/` is Vortex-only by construction | `grep -rn -il "gyre\|stack-detective" tests/p0/` → no output · `grep -n AGENTS_DIR tests/p0/helpers.js` |
| **D60** | `:127` "`convoke-doctor` checks Gyre agents, workflows, config, and contracts" | **No contracts check exists.** Partial-truth sentence — the other three nouns are real | `grep -niE "contracts\|HC[0-9]\|GC[0-9]" scripts/convoke-doctor.js scripts/update/lib/validator.js` → no output |
| **D61** | `:32` "v1.0.x, v1.3.x, v1.4.x upgrade paths to v1.5.0" | **`v1.7.x` is tested and unlisted**, and the chains no longer end at 1.5.0 — the registry runs to `3.3.x-to-4.0.0` | `grep -n "^describe(" tests/integration/upgrade.test.js` |

**`docs/references.md`** — **scope is two lines, and "no change" is the expected outcome.**

**Given** the counter reports **10** assertions for this file and the epic puts only the **repository-facing** ones in scope
**Then** the distinguishing test is **where the source of truth lives**: in scope if it is this repository; out of scope if it is a publisher, author or standards body (`ChatDev 2.0`, `Management 3.0`, `TOGAF 9.2`, *The Four Steps to the Epiphany* — bibliographic metadata a derivation pass must not touch, and **8 of the counter's 10 are exactly that**)
**And** ⚠ **the in-scope set is NOT the counter's output and is NOT two lines.** Enumerate it — do not take a list from here:
`grep -n "Project relevance" docs/references.md` → **21** candidates, which you then filter by the test above.
Known members include `:39` (`Vortex (7 agents)`, `Gyre (4 agents)`), `:153` (`7-stream`), `:99` (`HC1-HC10`, `GC1-GC4`), `:113` and `:287` (Gyre's `Scout → Atlas → Lens → Coach`), `:206`/`:263`/`:330`/`:345` (agent→stream mappings) and `:324` (`.gyre/capabilities.yaml`). **This list is a floor, not a census** — hand-written instance lists have repeatedly come up short in this epic
**And** ⚠ **`:153` and `:324` are invisible to the counter** — `7-stream` is a hyphenated adjective matching no pattern, and `:324`'s referent `.gyre/capabilities.yaml` is **not under `_bmad/`**, so `find _bmad -name capabilities.yaml` returns nothing and reads as a defect. Resolve it at the repo root
**And** every one checked at authoring time **HOLDS**, so the expected diff for this file is **zero lines** — but the coverage row must state the denominator it examined, because Story 1.7's gate consumes that row as full coverage
**And** the 63 external URLs are **out of scope** (FR9 backlog row); ⚠ if anyone hand-rolls an anchor checker, GitHub replaces spaces **individually**, so `\s+` → `-` collapsing produces **19 phantom broken anchors** out of 22.

**AC6 — the audit-scope decision, and it goes the OTHER WAY from 1.5.**

**Given** five of this story's seven files are absent from `USER_FACING_DOCS`
**When** admission is considered
**Then** it is **DECLINED for all five, and the reason is recorded** — this is a ruling, not an omission:

- **It catches nothing.** All six per-file checks return **empty** on `SECURITY.md`, `CREDITS.md` and `CODE_OF_CONDUCT.md`. A blank contact, a missing agent name and a prose/table contradiction are invisible to every check that exists.
- **It costs a live claim.** `docs/BMAD-METHOD-COMPATIBILITY.md` states "across all 17 user-facing files … across 16 of them", pinned by `tests/unit/docs-audit.test.js`. Admitting files falsifies both numbers in the same commit — the `docs-1-5` AC6 hazard.
- **For `references.md` the instrument is wrong**, which the epic already says: admitting an 877-line bibliography puts 63 external URLs and 72 academic titles under `checkStaleReferences` and `checkBrokenLinks`.

**And** if this ruling is ever reversed, the count claim and its test move **in the same commit**
**And** the DoD's `docs:audit` line is annotated for this story: it is **vacuous for five of seven files** and **green-but-blind on `docs/testing.md`**, where it passes over a count wrong by 2,933.

**AC7 — traps recorded, not rediscovered. Each will produce a wrong "fix".**

| Trap | Why it bites |
|---|---|
| **Coach's emoji** | `CREDITS.md` carries `🏋` + VS16 and **agrees with the agent file**; `agent-registry.js` has the bare codepoint. **CREDITS is correct** — never pin `CREDITS === agent-registry.js` byte-for-byte |
| **`.gyre/` in README** | `README:53/78/126` say `.gyre/` and the workflows agree; `_bmad/bme/_gyre/config.yaml` says `gyre-artifacts` and is the **stale object**. "Correcting" README turns three true sentences false |
| **22 vs 23 workflows** | `what-convoke-brings:41` says **"Twenty-two"** and is **correct**. The 23rd directory is `_deprecated`; `name-registry.csv` says 23 and is the outlier |
| **Subject-blind counts (`T154`)** | The gate blesses `1, 4, 7, 11, 12` for agents regardless of subject — **swap Vortex's 7 and Gyre's 4 and it still passes**. Every roster count must be checked against its subject by hand |
| **WDS rows in `skill-manifest.csv`** | 15 rows whose files ship zero times. **This is the design, not rot** (`completed-archive.md:355`). Do not touch that file |
| **AC3's WDS class is an OMISSION, not a conflation** | `what-convoke-brings` never mentions WDS (`grep -in wds` → 0 hits). The epic's "any sentence conflating them is a finding" has no target here. Its actual defect is that §"The BMAD Method Foundation" enumerates 4 of 6 upstream modules while claiming to cover them. **Record this reading, or the pass reports "no conflation found" and stops** |
| **`README` carries no hardcoded version** | The badge renders live. **Do not "add the current version"** — that creates the rot this epic removes |
| **`convoke-install-vortex` ≡ `convoke-install-gyre`** | `README:111` is candid and **correct** — different files, identical installed tree. Leave it |
| **`CODE_OF_CONDUCT.md` does not ship** | `SECURITY.md` and `CREDITS.md` do. `D43` is GitHub-surface-only; `D44`/`D45` are live in the published tarball |
| **The residual is noise in SOME files and a defect-finder in others** | The run reports **110** unclassified candidates. The **6** in the governance files and the **3** in `testing.md` are genuinely artifacts (globs, canonical heading numbers). ⚠ **`README.md`'s 13 are NOT** — three of them are `:96 {target}/CLAUDE.md`, `{target}/.github/copilot-instructions.md`, `{target}/.cursor/rules/`, i.e. `D48`'s three wrong paths, surfaced by the residual and by nothing else. `references.md` contributes 82, unexamined. **Sweep the residual per file; do not dismiss it wholesale** |

**AC8 — no correction introduces a claim nothing can contradict.**

**Given** every edit
**When** the diff is reviewed
**Then** each retained claim names the object that could contradict it; no new count, version marker or inventory is introduced that no object owns; and **no owned claim is deleted while removing unowned ones**
**And** ⚠ **every command written into a document is RUN from the directory its reader will be standing in.** `docs-1-5` shipped `require('convoke-agents/package.json')` into a user-facing doc and it **throws** — a package cannot require itself from its own repo, and the documented install leaves nothing in `node_modules`
**And** deletions use `git log --diff-filter=D -M --follow -- <path>`; **the `-M` is not optional**.

## Tasks / Subtasks

> **Read all seven files end to end before running anything.** AC2 exists because the counter is not the
> worklist, and the fastest way to inherit that mistake is to start from `--json`.

- [x] **Task 1 — Re-derive and report the divergence (AC: 1)**
  - [x] Run the counter over all seven; paste output with its command; compare to the epic's `28`
  - [x] Record as FLOORS. Explicitly note that `CREDITS.md` and `CODE_OF_CONDUCT.md` are **no longer `0`**, and that `README.md`'s cell is blank
- [x] **Task 2 — Sweep the classes the counter misses (AC: 2)**
  - [x] Each class by its own command; `0` written as `0`; include the table-arithmetic and partial-truth checks
- [x] **Task 3 — Governance files (AC: 3, 4, 5)**
  - [x] `D43` per **R1** (GitHub route, never an invented email) · `D44` agent name only, not the section heading · `D45` fix the prose, keep `4.0.x`
  - [x] Re-prove the `amalik` handle before touching any URL
- [x] **Task 4 — Positioning files (AC: 5, 7)**
  - [x] `D46` fix `what-convoke-brings`, **not** the README · `D47` against the shipped manifest · `D48`, `D49`
  - [x] Apply **R3**: leave the 7 positioning claims; file them as a backlog row
  - [x] Record the WDS reading per AC7 rather than reporting "none found"
- [x] **Task 5 — `docs/testing.md` (AC: 5)** — the bulk of the work
  - [x] Apply **R2**: delete lines 64-118, point at the live suite
  - [x] `D50` delete the arithmetic, name the command · `D51` derive all 14 or drop the column · `D52`-`D56`, `D59`-`D61`
- [x] **Task 6 — `docs/references.md` (AC: 5)**
  - [x] Verify lines 39 and 153. Expect **no edit**. Record as examined with `0` findings
- [x] **Task 7 — Audit-scope ruling (AC: 6)**
  - [x] Record the DECLINE for all five with its reason; annotate the DoD's `docs:audit` line
- [x] **Task 8 — Findings note and coverage table (AC: 1, DoD)**
  - [x] All seven rows `Examined: yes` with counts; `0` written as `0`. **Your own rows only** — the freeze banner permits exactly that
- [x] **Task 9 — Verify and hand off**
  - [x] `npm run lint` → 0 · `npm test` → 0 · `node scripts/audit/backlog-integrity.js` → 0 · `npm run docs:audit` → 0 **and annotated per AC6**
  - [x] Capture exit codes **without a pipe** — `${PIPESTATUS[0]}` is bash, this shell is zsh (`verification-pipefail`)
  - [x] **AC8 sweep** — run every command you wrote into a document, from the reader's directory
  - [x] Commit plan with a Round 1 review record; `git diff HEAD --name-only` before staging

## Dev Notes

### What `docs-1-5` learned that this story inherits

- **Independent review beats more rounds.** 1.5's self-review found 2 minor things; three independent
  blind layers found **5 HIGH defects**, three of them *created by the first round's own fixes*. Budget
  for an independent round, not a longer self-review.
- **"Replace a rotting value with the command that derives it" is correct AND dangerous.** It shipped a
  command that throws. **Run every command you write, from the reader's directory.**
- **Do not replace precise owned claims with an imprecise generalisation.** 1.5 deleted three
  registry-owned claims and substituted a sentence that was false in both directions.
- **A derivation pass CHANGES what it measures.** 1.5's load read 82/74 as received and 115/100 at HEAD.
  State the basis or the figure reads false.
- **Proving the OLD checks can fail is not proving the NEW ones can** (NFR5 scope hole).
- **Compare versions as integers.** `parseFloat` sorts `6.10` below `6.3`.

### Why this story's files rot differently

`docs/testing.md` was last touched **2026-03-24**; since then **428** commits landed in `tests/` and **37**
in `.github/workflows/` — basis `git log --oneline $(git log -1 --format=%h -- docs/testing.md)..HEAD -- tests/`.
*(A date-based `git rev-list --count HEAD --since=2026-03-24` returns 430 instead; both are correct for their
command, which is why the command is stated with the number.)* `what-convoke-brings-to-bmad-method.md` has **two** commits, both 2026-04-24 —
before 4.0 shipped, before the v6.3 conversion, before ADR-002/003/004. `README.md` went through
`docs-1-1`'s review and is the cleanest of the three. **Defect density is asymmetric; weight effort accordingly.**

### Files being modified

- `docs/testing.md`, `SECURITY.md`, `CREDITS.md`, `CODE_OF_CONDUCT.md`,
  `docs/what-convoke-brings-to-bmad-method.md`, `README.md` — this story's pass
- `docs/references.md` — verify only; expected diff is **zero lines**
- `_bmad-output/planning-artifacts/convoke-note-docs-accuracy-findings-4-0-2.md` — Task 8, under the freeze banner's carve-out. ⚠ **Write your own coverage rows only.** The *density* table (same file, the `Lines/Commands/Paths/Counts/Versions/Assertions` breakdown) is **frozen and deliberately wrong** — it carries `CREDITS.md = 0`, and the note says in its own D2 section *"do not patch — figures are frozen"*. Do not "fix" it

**`CHANGELOG.md` is NOT in this story.** The epic ruled it 2026-09-12, admitted for never-true claims only,
and the corrections were applied the same day — *"Story 1.6's size is unchanged"*. The epic still carries a
sentence speculating that a pending ruling might add it; that ruling has happened and did not.

**Finding IDs continue from `D61`.** `D62` onward for anything the AC2 sweep or the AC2a disposition pass
turns up — `README.md` carries 45 assertions and only two named defects, so expect new IDs there.

**Do not touch** `scripts/docs-audit.js` — AC6 declines admission, so no code change is in scope. If that
ruling is reversed, `tests/unit/docs-audit.test.js` and the compatibility document's two counts move in
the same commit.

### Testing standards

This story ships no `.js` under the AC6 ruling. If that changes, `lint-passes-before-review` applies and
the change needs a test that fails if the list regresses — `tests/unit/docs-audit.test.js` now pins
`USER_FACING_DOCS.length` against the prose in `BMAD-METHOD-COMPATIBILITY.md`, so **adding an entry turns
that test red until the prose moves**. That coupling is deliberate; do not loosen it.

### References

- [Source: convoke-epic-docs-accuracy-4-0-2.md#Story-1.6] — ACs and DoD
- [Source: convoke-note-docs-accuracy-findings-4-0-2.md] — coverage table, freeze banner, missing-class table
- [Source: backlog `T160`] — the counter's open classes; read before filing a "missing class" finding
- [Source: backlog `T154`] — subject-blind counts; why the gate cannot defend a roster number
- [Source: project-context.md] — `external-claims-must-be-executed-or-hedged`, `verification-pipefail`,
  `documentation-claims-must-be-derived`, `verification-must-be-falsifiable`, `code-review-convergence`,
  `commit-preparation`
- [Source: `feedback_verify_external_identifiers`] — `amalik` vs `amalikamriou`; AC3's governing memo

## Definition of Done

- [x] `npm run docs:audit` exits 0. **Its passing is a non-regression check, not evidence of accuracy** — the
      epic exists because it passes on defective files, **and this story may not cite it as proof any document
      is correct** *(NFR3, verbatim)* — **and annotated per AC6**: vacuous for five of seven files, and
      green-but-blind on `docs/testing.md`.
- [x] Every finding carries a reproducing command (NFR1) from an artifact the operator receives — never
      `.claude/skills/` (NFR8).
- [x] Every external identifier is executed against external truth, not accepted as plausible (AC3).
- [x] Every missing class in AC2's table is swept and reported, `0` written as `0`.
- [x] Every check cited as evidence in the Dev Agent Record names how it was shown able to fail (NFR5).
- [x] Every claim written or kept obeys the source-of-truth rule (FR3a), as bounded by rulings R3 and R4.
- [x] The findings note's coverage table is updated **in the same commit** (FR10), carrying all seven files
      with `Examined: yes` and a findings count. **`0` findings is written as `0`; blank means *not examined***.
- [x] `npm run lint` exits 0 with zero warnings in any file this story modifies.
- [x] `npm test` green.
- [x] Commit plan emitted with a Round 1 review record (NFR4); reviewed file set equals staged file set.

## Dev Agent Record

### Agent Model Used

Claude Opus 5 (1M context) — `claude-opus-5[1m]`

### Debug Log References

Exit codes captured without a pipe (`verification-pipefail`; this shell is zsh):
`npm run lint` → **0** · `npm test` → **0** (2351 tests, 0 fail, 1 skipped) ·
`node scripts/audit/backlog-integrity.js` → **0** · `npm run docs:audit` → **0**.

**`docs:audit` annotated per AC6.** It is **inapplicable** to five of this story's seven files, which
are absent from `USER_FACING_DOCS`, and **green-but-blind** on `docs/testing.md`, where it passed over
all twelve findings. Per NFR3 it is cited as a non-regression check only, never as evidence that any
document is correct.

**NFR5 — how each check was shown able to fail.** Mutated copies **in memory only**; the working tree
was never modified. `checkStaleReferences` on `CREDITS.md` 0→1; `checkBrokenPaths` on `SECURITY.md`
0→1; `checkBrokenLinks` on `CREDITS.md` 0→1. Separately on the edited `docs/testing.md`:
`all 4 agents` → `all 9 agents` takes `checkStaleReferences` 0→1, so the registry guard is live on the
file after editing — the counts the tables kept are still defended.

**Commands extracted from the documents and run verbatim**, not retyped: the CI-enumeration `node -e`
block now in `docs/testing.md`, and the quote-aware manifest parse in
`what-convoke-brings-to-bmad-method.md`. Both produce exactly what the surrounding prose claims.

### Completion Notes List

**AC1 — re-derived; 112, and the two `0`s were the trap the story said they were.**
Floors: `docs/testing.md` 38 · `SECURITY.md` 5 · `CREDITS.md` **1** · `CODE_OF_CONDUCT.md` **1** ·
`what-convoke-brings` 12 · `README.md` 45 · `references.md` 10 = **112**, with 110 unclassified
candidates. The epic's input was **28** — a 4× divergence, reported here as a finding about the input.
`CREDITS.md` and `CODE_OF_CONDUCT.md` are recorded as `0` in the note's frozen density table and are
**not** zero; had I read the table instead of deriving, the epic's "a zero-assertion file is recorded as
`0`" clause would have let me skip both — and each carried a finding. The figures match Story 1.4's
projection of 112 exactly, so **no scope call is owed**.

**AC2 — per-class sweep, `0` written as `0`.** statistics **6** (all six wrong) · dates **2 in scope,
both HOLD** · unbackticked prose paths **0** (six resolve; `Node.js` is a regex false positive) ·
requirement identifiers **0** · agent and team names **0** (all 7 Vortex, all 4 Gyre correct) ·
CI job names **1** · word-form counts **1** · table-internal arithmetic **1** · partial-truth **1**.

**AC2a — every assertion dispositioned, grouped rather than enumerated.** 112 assertions across seven
files: **20 reported as findings** (`D43`-`D62`), the remainder **checked and holding**. Per-file
dispositions equal the floors in the coverage table; regenerate with the AC1 command. Holdings are
recorded by file and class in the findings note rather than line by line, because Story 1.4's review
killed a transcribed per-kind tally twice.

**AC3 — executed, nothing hedged.** `gh auth status` → account **amalik**;
`gh api repos/amalik/convoke-agents --jq .owner.login` → `amalik` (re-proved **before** touching any
URL); `private-vulnerability-reporting` → `{"enabled":true}`; `npm view convoke-agents dist-tags` →
`{ latest: '4.0.1' }`. The community-health API was **not** used as evidence for `D43`, per AC3 — it
reports 100% with the contact blank.

**AC4 — all four rulings applied.** `R1`: the CoC contact is the GitHub route; **no address was
invented**, and none exists in the repository to invent from. `R2`: the Agent Test Results section was
replaced by a pointer to the live suite. `R3`: the seven positioning claims were left untouched; only
falsifiable defects were fixed in that file. `R4`: `SECURITY.md`'s SLA and crediting commitments are
intact.

⚠ **`R3` names the wrong IDs** — it says "fix only the falsifiable defects there (`D44`, `D45`)", but
`D44`/`D45` are `CREDITS.md` and `SECURITY.md`; the defects in `what-convoke-brings` are `D46`/`D47`.
**AC4a is declared canonical and was followed.** This is exactly the drift AC4a was added to absorb, and
it absorbed it. Three Task lines carry the same pre-review wording — Task 5 says "delete lines 64-118"
where `R2` says 63-119, Task 1 says README's cell is "blank" where AC1 says `—`, and Task 6 says "verify
lines 39 and 153" where AC5 says enumerate 21 candidates. AC4a and the ACs were followed in each case.

**AC5 — 20 findings, every one re-verified at HEAD before editing.** `D62` is new (the module
under-enumeration AC7 predicted). `D57` and `D58` were closed by `R2`'s deletion; `D50`, `D52` and
`D53` were **not** — they live at `:11` and `:51`, outside the deleted range, and were fixed
individually, which is the error AC4a exists to prevent.

**AC6 — admission DECLINED for all five, measured not assumed.** All six per-file checks return **0** on
every ungated file, so admission would have caught **none** of the twenty findings while falsifying the
"17 user-facing files" claim Story 1.5 pinned with a test. `scripts/docs-audit.js` was not touched.

**AC7 — every trap held.** `.gyre/` left alone in README (4 occurrences; the stale object is
`_gyre/config.yaml`). "Twenty-two workflows" left alone — correct; `name-registry.csv`'s 23 is the
outlier. Coach's emoji untouched. `skill-manifest.csv` untouched. `README`'s live version badge
untouched. The installer-equivalence sentence left alone. The WDS reading was **recorded as `D62`**
rather than reported as "no conflation found".

**AC8 — and I walked into its named trap, twice.** Writing `D46`'s fix I typed
`require('convoke-agents/package.json')` — *the exact command AC8 warns about, the one `docs-1-5`
shipped that throws*. I ran it, it threw, and it was replaced with commands that execute from a
checkout. Then `D62`'s first command used `cut -d,` on the manifest, which splits inside the quoted
description field and returned noise — the trap `D49`'s own row describes. Replaced with a quote-aware
form and re-extracted from the file to confirm. **Both were caught only because AC8 required running
them; neither would have been caught by review of the prose.** No file was deleted
(`git status --porcelain | grep '^.D'` → empty), so the rename trap does not arise.

**`docs/references.md`: zero edits, which is the correct outcome.** Enumerated 21 `Project relevance`
candidates and filtered by where the source of truth lives. Every repository-facing claim HOLDS —
Vortex 7, Gyre 4, `HC1`-`HC5` as files plus `HC6`-`HC10` in the compass reference, `GC1`-`GC4`,
Scout/Atlas/Lens/Coach, the `7-stream` claim the counter cannot see, and the `.gyre/capabilities.yaml`
reference whose referent is **not** under `_bmad/` (`find _bmad -name capabilities.yaml` → 0, and
reading that as a defect is the trap). Recorded as examined with **0** findings.

### File List

- `CODE_OF_CONDUCT.md` — modified (`D43`)
- `CREDITS.md` — modified (`D44`)
- `SECURITY.md` — modified (`D45`)
- `docs/what-convoke-brings-to-bmad-method.md` — modified (`D46`, `D47`, `D62`)
- `README.md` — modified (`D48`, `D49`)
- `docs/testing.md` — modified (`D50`-`D61`)
- `docs/references.md` — **examined, not modified** (0 findings)
- `_bmad-output/planning-artifacts/convoke-note-docs-accuracy-findings-4-0-2.md` — modified (findings `D43`-`D62`; own coverage rows only)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — modified (status)
- `_bmad-output/implementation-artifacts/docs-1-6-derivation-pass-on-the-governance-and-positioning-documents.md` — modified (this record)

## Change Log

| Date | Change |
|------|--------|
| 2026-09-13 | **Implemented.** 20 findings (`D43`-`D62`) across seven files; **112** assertions dispositioned, matching Story 1.4's projection exactly, against the epic's stale input of 28. `docs/references.md` returned **zero edits** — all 21 `Project relevance` candidates enumerated, every repository-facing claim holds, recorded as examined with `0`. **Audit-scope admission DECLINED for all five ungated files** (the reverse of 1.5, and measured: all six per-file checks return 0 on each, so admission catches none of the 20 findings while falsifying the "17 files" claim 1.5 pinned). Four operator rulings applied; **`R3` names the wrong defect IDs and `AC4a` absorbed it**, which is what AC4a was added for. **AC8's named trap was hit twice and caught only by running the commands**: `require('convoke-agents/package.json')` — the exact command `docs-1-5` shipped that throws — and a `cut -d,` on the manifest that splits inside the quoted description field. Both replaced and re-extracted from the file to confirm. `npm run lint` 0 · `npm test` 0 (2351) · `backlog-integrity` 0 · `npm run docs:audit` 0 (annotated per AC6 — inapplicable to five of seven files, green-but-blind on the sixth). |
| 2026-09-13 | **Story created.** Authored after three parallel read-only reconnaissance passes (governance/contact, positioning, testing/references) which checked ~264 assertions and confirmed **19 defects** with commands. Four findings shaped the ACs rather than the epic's text: (1) **the audit-scope decision REVERSES 1.5's** — admitting these files to `USER_FACING_DOCS` catches *none* of the defects (all six per-file checks return empty) while falsifying the "17 files" claim 1.5 pinned, so AC6 declines with reasons; (2) **`CREDITS.md` and `CODE_OF_CONDUCT.md` are recorded as `0` assertions and are not zero any more**, which turns the epic's "a zero-assertion file is recorded as 0" clause into a trap; (3) **the CoC enforcement contact cannot be derived from the repository at all** — it is the one defect a fixer cannot close alone, so R1 carries the operator's ruling; (4) **`references.md`'s in-scope set is three lines, not the counter's ten, and one of the three is invisible to the counter** — the epic's own lesson in miniature. Four operator rulings (R1-R4) are carried in AC4 so the implementer does not guess. Project memory's "Remaining Test Debt" figures were found stale by 3-6x and corrected the same day — they would have confirmed `D55`'s wrong numbers. |
