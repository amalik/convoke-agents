# Testing

Overview of the Convoke automated test suite, CI pipeline, and agent testing.

---

## Automated Test Suite

Zero-dependency test runner using `node:test`.

**No totals are stated here.** They change on almost every commit and nothing in the repository pins them, so a number written here is wrong within days. Derive them: `npm run test:all` runs every suite, and `npm run test:coverage` reports coverage against the thresholds in `.c8rc.json`.

### Unit Tests

*A selection, not a census — `tests/unit/` holds far more files than the rows below. Per-suite counts
are not listed: they rot on every commit and nothing pins them. For a count, run the file.*

| Suite | Coverage Area |
|-------|---------------|
| utils | `compareVersions`, `getPackageVersion`, `findProjectRoot` |
| registry | `getMigrationsFor`, `getBreakingChanges`, `hasMigrationBeenApplied` |
| version-detector | `getCurrentVersion`, `detectInstallationScenario` |
| config-merger | `mergeConfig`, `validateConfig`, `addMigrationHistory` |
| backup-manager | `createBackup`, `restoreBackup`, `cleanupOldBackups` |
| migration-runner | `executeMigration`, `previewMigrations`, `MigrationError` |
| migration-runner-orchestration | `runMigrations` full cycle, dry-run, skip, lock conflict, error handling |
| validator | `validateInstallation`, config, agents, workflows, manifest, user data |
| migrations-to-1.5.0 | 1.3.x and 1.4.x migration metadata, preview, apply |

### Integration Tests

*Also a selection. Enumerate the suites with `ls tests/integration/*.test.js`.*

| Suite | Coverage Area |
|-------|---------------|
| fresh-install | `refreshInstallation` end-to-end (all 7 agents) |
| upgrade | Simulated upgrades from v1.0.x, v1.3.x, v1.4.x and v1.7.x. The migration chain's terminal entries target 4.0.0; `scripts/update/migrations/registry.js` is append-only and resolves the destination to the running package version, so it records no later target |
| cli-entry-points | `index.js`, `convoke-version`, `convoke-update`, `convoke-doctor` |
| installer-e2e | `install-vortex-agents` CLI end-to-end, idempotency |
| convoke-doctor | Negative paths: no project, missing config, invalid YAML, missing agents, stale lock, version mismatch |

### Running Tests

```bash
npm test                 # tests/unit, tests/team-factory, tests/lib, tests/audit
npm run test:integration # tests/integration
npm run test:p0          # tests/p0 — agent activation and content correctness
npm run test:all         # the three above, in sequence
npm run test:coverage    # c8, enforcing the thresholds in .c8rc.json
npm run lint             # ESLint
npm run docs:audit       # documentation staleness and link checks
npm run refs:audit       # cross-artifact reference integrity
```

`docs:audit` gates CI and exits 0 on a clean tree. **`refs:audit` does not, and is not a gate** — it
exits non-zero on a clean checkout today. Most of what it reports is relative-path resolution against
the referring file's own directory — a note inside a subdirectory that cites a repo-root-relative script
path is resolved relative to that subdirectory, and reported broken — and most of the volume comes from
`_bmad-output/`, not from the shipped docs. Run
it, diff its output against a clean baseline, and judge your own additions — do not read a non-zero exit
as a regression you caused. Derive the current split with:

```bash
npm run refs:audit 2>&1 | grep -oE '^  [^ ]+ →' | sed -E 's#^ +([^/]+/[^/]+|[^/]+)/.*#\1#' | sort | uniq -c | sort -rn
```

---

## CI Pipeline

The workflow defines more jobs than are listed below, and not all of them run on every event. Enumerate
them and their conditions rather than trusting this table to be complete — the command prints both:

```bash
node -e "const y=require('js-yaml'),w=y.load(require('fs').readFileSync('.github/workflows/ci.yml','utf8'));
for (const [n,j] of Object.entries(w.jobs)) console.log(n, j.if ? '(conditional: '+j.if+')' : '')"
```

CI runs on pushes to `main`, on pull requests targeting `main`, and on `v*` tags — not on every push to
every branch. The jobs most people care about:

| Job | What it does |
|-----|-------------|
| `lint` | ESLint with architecture rules (e.g., no `process.cwd()`) |
| `test` | Node 18/20/22 matrix, unit + integration |
| `coverage` | c8 enforcing the thresholds in `.c8rc.json`; also the only job that runs `tests/p0` |
| `security` | `npm audit --omit=dev` |
| `package-check` | `npm pack --dry-run` + `node index.js` |
| `fresh-install` | packs a tarball and installs it into a throwaway project |
| `agent-surface-parity` | the repo's audit job — agent-surface parity across two refs (skipped with a warning when no `v*` tag exists) plus every other audit gate. Enumerate its steps rather than trusting this cell: `node -e "const y=require('js-yaml'),w=y.load(require('fs').readFileSync('.github/workflows/ci.yml','utf8'));console.log(w.jobs['agent-surface-parity'].steps.filter(s=>s.run).map(s=>s.name).join('\n'))"` |
| `publish` | npm publish, gated on `refs/tags/v*` — so a tag push, never a branch push or a pull request |

---

## Agent Testing

Agent behaviour is covered by the automated P0 suite — activation, voice consistency, handoff contracts,
Compass routing and workflow structure, with a dedicated file per Vortex agent:

```bash
npm run test:p0                              # the whole suite
node --test tests/p0/p0-emma.test.js         # one agent
ls tests/p0/                                 # what exists
```

Historical manual test records live in `_bmad-output/_archive/`. They are a record of what was run in
early 2026, not a statement about the suite today, and at least one of them reports zero executed tests
in its own header — read them as history, not as results.

---

## Gyre Test Coverage

Gyre agents are markdown-only (no JS code beyond installation scripts). Test coverage focuses on:

- **Installation validation** — `convoke-install-gyre` creates correct directory structure, all 4 agents and 7 workflows present
- **Doctor validation** — `convoke-doctor` checks Gyre agents, workflows and config. It does **not** check handoff contracts; no contracts check exists (`grep -niE 'contracts|GC[0-9]' scripts/convoke-doctor.js scripts/update/lib/validator.js` returns nothing)
- **Refresh validation** — `refreshInstallation` handles Gyre module alongside Vortex
- **Agent activation** — ⚠ **not covered.** `tests/p0/` is Vortex-only by construction (`grep -n AGENTS_DIR tests/p0/helpers.js`), so no Gyre agent has a P0 content test. Gyre's coverage is the installation and refresh paths above, not agent behaviour

Infrastructure tests (registry, config-merger, validator) cover Gyre through the same shared update pipeline as Vortex.

---

## Coverage

**No per-module figures are restated here** — a coverage percentage rots on almost every commit and
nothing pins it. Run `npm run test:coverage` and read the per-file table it prints; `.c8rc.json` holds
the thresholds that actually gate CI, and the run fails if the project totals fall below them.

The three modules this section once named as gaps — `convoke-update.js`, `convoke-version.js` and the
`1.0.x-to-1.3.0` migration — now sit well above those thresholds. **Others do not, and no module is
named here** — which one is weakest changes, and a name written into this file would be wrong within
weeks. **Project-level thresholds can pass while individual modules are bare**, including at 0% function
coverage, so read the per-file table rather than the summary line. Sort it:

```bash
npm run test:coverage 2>&1 | awk -F'|' '$2+0>0 {gsub(/ /,"",$1); gsub(/ /,"",$2); print $2, $1}' | sort -n | head
```

---

[Back to README](../README.md) | [Agents](agents.md) | [Development](development.md) | [FAQ](faq.md)
