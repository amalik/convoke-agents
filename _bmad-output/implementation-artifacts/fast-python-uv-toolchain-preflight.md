# Fast Story: Python 3.11+ / `uv` toolchain preflight (I131)

**Status:** ready-for-dev · **Lane:** Fast (pending triage RICE) · **Source:** BMAD v6.11.0 impact analysis, 2026-08-11 (Winston) · **Backlog ID:** I132  <!-- renumbered from I131 on 2026-08-14: collided with the PF1-methodology I131, which holds the backlog rows and is cited by ADR-001. This item has no backlog row, so it moved. -->

## Context

Convoke has an **undeclared runtime dependency on Python 3.11+** that nothing checks and nothing documents.

[`_bmad/scripts/resolve_customization.py`](../../_bmad/scripts/resolve_customization.py) performs the three-layer TOML customization merge for skill activation. Its own header is explicit ([:17](../../_bmad/scripts/resolve_customization.py#L17)): *"Either runner needs Python 3.11+ for `tomllib`"*, with a hard error path at [:44-47](../../_bmad/scripts/resolve_customization.py#L44-L47) when the stdlib module is absent. **109 installed skills invoke it at activation.**

Meanwhile [`package.json`](../../package.json#L84-L86) declares only `"node": ">=18.0.0"`. There is no Python declaration in `engines`, no check in [`convoke-doctor.js`](../../scripts/convoke-doctor.js), and no check in [`compat-preflight.js`](../../scripts/update/lib/compat-preflight.js) — which currently probes the BMAD version and nothing else.

**Scope correction worth stating precisely.** Convoke's own 12 `bme` agents (Vortex + Gyre) are **not** currently affected — they still use the legacy XML activation block and never shell out to the resolver. The 109 affected skills are upstream BMAD skills installed alongside Convoke. This is still squarely a Convoke operator-experience problem: Convoke installs *into* a BMAD tree and its operators use both. And it becomes Convoke's own problem directly as **I97 converts `bme` agents to the v6.3 source format** — each converted agent inherits the Python dependency. Emma shipped 2026-05-02; Stories 2.2–2.7 are pending.

**What v6.11.0 changes.** Today a missing/old Python degrades gracefully: the resolver fails, and the agent activation instructions say *"If the script fails, resolve the agent block yourself by reading these three files…"* — the LLM performs the merge instead. Silent, more expensive, and not guaranteed to match the deterministic resolver's merge semantics. Under v6.11, rendered skills move to `uv` and **renderers hard-halt (exit 1) when the toolchain is unavailable.** The failure mode goes from quiet degradation to a stop.

**Why this is the one v6.11 item not to defer.** Under the `preflight-soft-warn` contract Convoke's preflight is stderr WARNING + exit 0 — it is supposed to tell operators what it can detect. Right now it stays silent on a dependency that is already live and about to become fatal. An operator on Python 3.9 gets a **green Convoke install followed by a hard halt from BMAD**, with nothing in Convoke's output connecting the two. That is an OC-R3 (right to rationale) failure as much as a technical gap, and closing it is small.

## Design decisions (pinned)

**D1 — Probe unconditionally; warn only on a real gap.** Do **not** gate the warning on detected BMAD version. Gating is superficially appealing ("only warn on v6.11+") but the module docstring at [`compat-preflight.js`:19-24](../../scripts/update/lib/compat-preflight.js#L19-L24) records that Convoke is a *parallel* extension — `node_modules/bmad-method/` is absent on the canonical dev tree and most CI runners, so BMAD-version detection usually returns "not detected." A version-gated toolchain warning would therefore almost never fire. Probing unconditionally is also *correct*: an operator missing the toolchain has a live problem today (109 skills degrading) and a fatal one on their next BMAD update. Because the check is **silent when the toolchain is healthy**, unconditional probing adds no noise to correct setups.

**D2 — `uv` present is sufficient; only fall through to `python3` when it is absent.** This is not invented policy — it is what upstream states at [`resolve_customization.py`:15-17](../../_bmad/scripts/resolve_customization.py#L15-L17): *"BMad is standardizing on `uv run` (uv provisions a suitable interpreter for you); a plain `python3` on PATH still works during the transition."* Probe order: `uv` → healthy, stop. Else `python3` (then `python` for Windows) and check `>= 3.11`. Else warn.

**D3 — New exported function, not folded into `runCompatPreflight`.** Export `runToolchainPreflight()` alongside the existing function and call it at the same three sites: [`install-vortex-agents.js`:172](../../scripts/install-vortex-agents.js#L172), [`install-gyre-agents.js`:133](../../scripts/install-gyre-agents.js#L133), [`convoke-update.js`:239](../../scripts/update/convoke-update.js#L239). Folding it in would change `runCompatPreflight`'s return shape and break its existing test suite ([`tests/unit/compat-preflight.test.js`](../../tests/unit/compat-preflight.test.js)) for no benefit.

**D4 — Honor `preflight-soft-warn` exactly.** stderr WARNING via `chalk.yellow(...)`, exit 0 pass-through, never `process.exit(non-zero)`, never `throw` to the caller. A missing interpreter must not block an install.

**D5 — Injectable probe.** Shelling out to the real PATH makes tests environment-dependent, which violates `test-fixture-isolation` in spirit. Follow the existing precedent: expose the probe through the frozen `_internal` export ([`compat-preflight.js`:_internal](../../scripts/update/lib/compat-preflight.js)) so tests inject results rather than depending on the runner's toolchain.

**D6 — Reuse the version-parse guard.** Python reports `Python 3.14.3`. Parse to a bare numeric string and apply the same validation the BMAD path already uses ([R1-H5 / R2-M1](../../scripts/update/lib/compat-preflight.js#L108-L118)): strip suffixes, then reject anything not matching `^\d+(\.\d+){0,2}$` before calling `compareVersions`. `compareVersions` uses naive `Number(part)`, and `NaN` comparisons fall through to "equal" — a non-numeric component would silently pass the gate.

**D7 — `REQUIRED_PYTHON_VERSION = '3.11.0'` is not a `no-hardcoded-versions` violation.** That rule governs *Convoke's own* version, which must be read from `package.json` via `getPackageVersion()`. This is an external requirement constant, directly analogous to the existing `REQUIRED_BMAD_VERSION = '6.3.0'` at [:36](../../scripts/update/lib/compat-preflight.js#L36). Stated here so a reviewer does not cite the rule against it.

## Scope

1. **Add `runToolchainPreflight()` to [`compat-preflight.js`](../../scripts/update/lib/compat-preflight.js)** (or a sibling `toolchain-preflight.js` if the dev agent judges the module is getting long — either is acceptable; the export contract matters, the file boundary does not).
   - Probe order per D2. Use `execFileSync` with an explicit timeout and **no shell** — arguments are fixed literals, so there is no interpolation surface; `execFileSync` keeps it that way.
   - Handle `ENOENT` (binary absent), non-zero exit, timeout, and unparseable version output as distinct `reason` strings, mirroring `_readBmadPackageJson`'s `{ found, reason }` shape.
   - Return metadata (`{ runner, version, warning }`) so callers and tests can introspect.
2. **Message content must satisfy OC-R3.** The WARNING states what is missing, what it affects, and what to do — e.g. *"Python 3.11+ or `uv` not detected (…). BMAD skill customization resolves via `_bmad/scripts/resolve_customization.py`, which needs Python 3.11+ for `tomllib`; BMAD v6.11+ halts rendered skills without it. Install `uv` (https://docs.astral.sh/uv/) or upgrade Python; proceeding anyway."* Naming the *consequence*, not just the missing binary, is the point.
3. **Wire the three call sites** per D3.
4. **Declare the dependency in docs.** Add Python 3.11+ / `uv` to the install prerequisites wherever `node >= 18` is currently stated for operators. Do **not** add it to `package.json` `engines` — npm's `engines` covers Node/npm only and would not be enforced.

## Acceptance criteria

1. `uv` present → silent pass, exit 0, no stderr output.
2. `uv` absent + `python3` reporting `>= 3.11` → silent pass, exit 0.
3. `uv` absent + `python3` reporting `< 3.11` → yellow WARNING naming the detected version **and** the consequence (per Scope 2); **exit 0**.
4. `uv` absent + no `python3`/`python` on PATH → yellow WARNING; **exit 0**.
5. Non-numeric version output (e.g. a shim printing `Python 3.11.x`) is rejected by the D6 guard and treated as undetected — it must **not** silently pass as `>= 3.11`.
6. `runToolchainPreflight()` never throws to the caller and never exits non-zero under any probe outcome (rule `preflight-soft-warn`).
7. All three call sites invoke it; a failing probe does not prevent install/update from completing.
8. Tests inject probe results via `_internal` (D5) and run against an isolated fixture dir with `{ cwd: tmpDir }` (rule `test-fixture-isolation`). No assertion depends on the CI runner's actual Python or `uv`.
9. Existing [`tests/unit/compat-preflight.test.js`](../../tests/unit/compat-preflight.test.js) passes unchanged — `runCompatPreflight`'s contract is untouched (D3).
10. `npm test` and `npm run lint` clean for every file this story touches (rule `lint-passes-before-review`).

**Live smoke (required).** Per `preflight-soft-warn`: *"Live smoke against the dev tree MUST emit the WARNING — silent green is a fixture-or-gate bug, not a success signal."* Here the dev tree is **healthy** (Python 3.14.3, `uv` at `/opt/homebrew/bin/uv`), so live smoke correctly produces silence. The equivalent evidence is a PATH-scrubbed run:

```bash
set -o pipefail; env PATH=/usr/bin:/bin node -e "require('./scripts/update/lib/compat-preflight').runToolchainPreflight()" 2>&1 | tail -5; echo "EXIT: $?"
```

Must print the WARNING and `EXIT: 0` (rule `verification-pipefail` — `$?` after a bare pipe captures `tail`'s exit code, not node's).

## Namespace decision

Extends existing Convoke-owned library code under `scripts/update/lib/` plus its three CLI entry points. Creates no skill or workflow, so `covenant-compliance-for-convoke-skills` is **N/A** and no Compliance Checklist run is required. The OC-R3 reasoning in Scope 2 is applied as a *quality standard* for the operator-facing message, not as a Checklist obligation.

`slash-command-ux-for-user-facing-tools` does **not** apply: this is not a new user-facing tool but a pass-through check inside commands operators already run (`convoke-install-vortex`, `convoke-install-gyre`, `convoke-update`). There is no separate invocation for an operator to reach.

## Safety analysis

Rule `path-safety-for-destructive-ops`: **N/A by construction.** Read-only and non-destructive — no writes, no deletes, no user-supplied paths. The one adjacent concern is process execution: mitigated by using `execFileSync` with fixed literal arguments and no shell, so there is no command-interpolation surface, plus an explicit timeout so a hung or malicious binary on PATH cannot stall an install indefinitely.

## Dependency note

- **Independent of the v6.11 absorption-window decision.** Ships regardless of whether v6.11 lands in v4.1 or a new v4.2 lane.
- **Independent of I130** (upstream-name staleness gate). No shared surface; either order works.
- **Related to I97** (agent source-format conversion): each `bme` agent converted to the v6.3 format inherits the Python dependency, which raises this check's value over time. Not blocking in either direction — this story is worth shipping before I97 completes, since the 109 upstream skills are already exposed.
- **Does not change `REQUIRED_BMAD_VERSION`.** The v6.3 product floor is a separate decision belonging to the absorption-window call, deliberately out of scope here.

## Process note for the dev agent

The repo auto-commits each file edit individually to `main` and pushes (`feedback_auto_commit_hook`). Library change, three call-site edits, and tests **will not land as one atomic commit**. Either disable the hook for this story or accept the split — and if accepting, land `compat-preflight.js` before the call sites so no intermediate commit references an export that does not yet exist.
