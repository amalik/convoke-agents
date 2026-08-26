# Contributing to Convoke

Convoke is a set of agent teams that extends [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD), covering the product lifecycle either side of the build. Contributions are welcome.

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). To report a security vulnerability, do **not** open an issue — see [SECURITY.md](SECURITY.md).

---

## What to contribute

- **Agents and workflows** — new domain specialists, workflow and template improvements
- **Teams** — new team modules, built with the Team Factory (`/bmad-agent-bme-team-factory`)
- **Testing** — edge cases, coverage for known gaps, performance
- **Documentation** — tutorials, walkthroughs, translations

Not sure where a change belongs? Open an issue first and ask. A five-minute conversation beats a rejected branch.

---

## How changes land

Changes from outside the maintainer land on `main` through a pull request, with CI green. The maintainer commits to `main` directly.

That asymmetry is deliberate and it is the current state, not an aspiration: this repository has one maintainer and requiring a pull request for every typo would not survive a week. It is not permanent.

> **Revisit condition:** when a second regular committer joins, this policy changes and the administrator bypass on `main` comes off.

One practical consequence worth knowing: the `burn-in` job runs on pull requests only. A change that arrives by PR is tested *more* thoroughly than one pushed directly.

---

## The bar

**This section is normative.** It applies to every change, from every contributor, human or agent. The two on-ramps below are navigation into it — if either of them appears to disagree with this section, this section wins.

### 1. The CI gates

Ten jobs run on a pull request. All of them must be green.

| Job | What it runs |
|---|---|
| `lint` | `npm run lint` — ESLint at `--max-warnings 0`. Zero warnings, not zero errors. |
| `test` | `npm test` and `npm run test:integration`, on Node 18, 20 and 22 |
| `burn-in` | The same two suites, five times in a row. Pull requests only. Catches flakes. |
| `coverage` | `npm run test:coverage` — c8, against the thresholds in `.c8rc.json` (lines 83, branches 80) |
| `agent-surface-parity` | Agent surface vs. the last `v*` tag, plus install-scope containment, backlog referential integrity, and `npm run docs:audit` |
| `security` | `npm audit --omit=dev` |
| `package-check` | `npm pack --dry-run` and `node index.js` |
| `fresh-install` | `scripts/audit/try-fresh-install.sh` — pack, install, doctor, export |
| `python-test` | `ruff check _bmad/ --config ruff.toml` and the BMB/core pytest suite |
| `downgrade-guard-dry` | Version-comparison case matrix |

Run the fast majority locally before you push:

```bash
npm ci
npm run lint
npm run test:all      # unit + integration + P0
```

A red gate is a gate doing its job. If one fails for a reason you believe is unrelated to your change, say so in the pull request rather than re-running until it passes — that pattern is how this project acquired most of its flake debt.

### 2. Project rules that block a review

[`project-context.md`](project-context.md) holds this repository's binding engineering rules. They are not style preferences: several of them say, in as many words, *"reviewing a PR: if a diff does X, block and cite this rule."* Read it before your first change. The ones that most often catch newcomers:

| Rule | In one line |
|---|---|
| `test-fixture-isolation` | Every `runScript(...)` passes `{ cwd: tmpDir }`. Never test against the live repo tree. |
| `fixture-determinism` | Never assert on a value you do not control — clocks, unawaited children, fixed delays, ambient env. |
| `no-hardcoded-versions` | Read the version from `package.json` via `getPackageVersion()`. |
| `no-process-cwd-in-libs` | Use `findProjectRoot()` or accept a `projectRoot` parameter. |
| `derive-counts-from-source` | Compute counts from the source data. A magic number for something that can grow will rot silently. |
| `lint-passes-before-review` | `npm run lint` exits 0 with zero warnings before a change is offered for review. |
| `documentation-claims-must-be-derived` | Documenting how something works? Read the file that determines it. Do not write a policy that does not exist. |

The full set — including the rules governing commits, reviews, and backlog writes — is in that file.

**Adding or removing an agent?** `scripts/update/lib/agent-registry.js` is the single source of truth,
but `_bmad/_config/agent-manifest.csv` is a tracked file generated from it, and generating it is a
step you run on purpose:

```bash
npm run generate:manifest
```

Nothing else *regenerates it from the registry* in a checkout. The manifest write used to fire as a
side effect of every installation refresh — including the ones the test suite performs, so `npm test`
quietly rewrote a tracked file. That write is now guarded, which means a registry change you forget to
regenerate gets **committed** as a manifest that no longer matches the registry. It is not published:
`_bmad/_config/agent-manifest.csv` is absent from the npm tarball, and a consumer's copy is generated
at install time. What goes stale is this repository's own tracked copy, and the in-repo readers of it.
The command is the whole fix; run it in the same commit as the registry edit.

### 3. The Operator Covenant

Anything you author under `_bmad/bme/` must honour [The Convoke Operator Covenant](_bmad-output/planning-artifacts/convoke-covenant-operator.md) — one axiom and seven Operator Rights — and self-check against the [Covenant Compliance Checklist](_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md).

This is an architectural requirement, not a styling one. Operator-facing behaviour is what makes a `_bmad/bme/` skill a *Convoke* skill rather than a generic one, and a violation erodes trust across the ecosystem rather than just its own surface.

New skill or workflow? Your change must also state a **namespace decision** — Convoke `_bmad/bme/` or upstream BMAD — with the reasoning. See `namespace-decision-for-new-skills`.

### 4. Commits and the changelog

Commit messages use `<type>(<scope>): <intent>`:

```
fix(BUG-12): use the shared escapeRegExp for the version pattern
docs(backlog): run the P1+P2 staleness audit — 3 hits in 59 rows
```

Types in use, in order of how often they appear in the history: `docs`, `fix`, `chore`, `governance`, `feat`, `ci`, `release`. The scope is a module, a subsystem, or a backlog ID.

[`CHANGELOG.md`](CHANGELOG.md) follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). **Do not add or edit `CHANGELOG.md` entries in a pull request.** The changelog is written at release time as a single narrative, so that one release reads as one story rather than as a pile of merges. Describe the user-visible effect of your change in the pull request description; the maintainer writes the entry at release.

---

## If you're a human

```bash
# 1. Fork on GitHub, then:
git clone https://github.com/<you>/convoke-agents.git
cd convoke-agents
npm ci

# 2. Branch
git checkout -b fix/short-description

# 3. Work, then check yourself against the bar
npm run lint
npm run test:all

# 4. Push and open a pull request against `main`
```

Requirements: **Node.js 18 or later** (`engines: >=18.0.0`). CI tests 18, 20 and 22 — if your change is version-sensitive, say which you developed against.

**What review looks like.** Round 1 fires automatically when your change reaches a landing point; you do not need to request it. Round 2 happens only if Round 1 finds something HIGH-severity, Round 3 only if Round 2 restructured code, and there is no Round 4 — leftover findings go to the backlog rather than into another pass. The full rule is `code-review-convergence` in `project-context.md`. Expect the findings to be specific and unsentimental; that is the house style, not a verdict on your work.

## If you're an agent

You are a first-class contributor here — most of this codebase was written by agents, and they are named in [CREDITS.md](CREDITS.md). Your on-ramp is different from a human's because your failure modes are.

**Read before writing:** [`project-context.md`](project-context.md) in full. Not the summary — the rules carry their scar stories, and the scar story is what tells you which edge the rule is guarding.

**Before offering a change for review:**

```bash
npm run lint          # zero warnings — rule: lint-passes-before-review
npm run test:all
npm run docs:audit    # if you touched any documentation
```

**Definition of Done:** `.claude/skills/bmad-dev-story/checklist.md`. Lint reports are a *required* input, not an optional one.

**Rules you will be blocked on, by name:** `test-fixture-isolation`, `fixture-determinism`, `derive-counts-from-source`, `no-hardcoded-versions`, `no-process-cwd-in-libs`, `shared-test-constants`, `verification-must-be-falsifiable`, `external-claims-must-be-executed-or-hedged`, `documentation-claims-must-be-derived`.

**Review protocol:** `code-review-convergence`. Round 1 is mandatory and fires without being asked. Two clauses are worth internalising because both were written after they were violated: *the reviewed set must equal the committed set* — derive the diff from `git diff HEAD --name-only`, never from what you remember touching — and *applying a finding is not a reviewed change*, so new code or new tests written in response to a review are unreviewed by default.

**Commits:** `commit-preparation`. Hand the maintainer a prepared commit plan — files, `<type>(<scope>): <intent>`, and a description. Do not commit on his behalf unless asked.

**A verification that cannot fail is worse than none.** When a check is the evidence for a claim, prove it can go red before you cite it.

---

## Reporting issues

| You have | Use |
|---|---|
| A bug — a crash, a wrong result, a broken command | **Bug report** |
| A missing capability or an idea | **Feature request** |
| Feedback on a specific agent or workflow | **Agent/Workflow Feedback** |
| A security vulnerability | **Not an issue** — see [SECURITY.md](SECURITY.md) |

---

## License

Contributions are licensed under the [MIT License](LICENSE), the same terms as the project.
