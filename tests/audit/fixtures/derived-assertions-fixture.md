# Fixture — derived assertions, one known instance of each kind

This file exists so `scripts/audit/derived-assertions.js --self-check` can prove each pattern
fires. A kind that matches nothing here is a broken pattern, not a count of zero.

It also carries the NEGATIVE cases from AC1's "does not count" column, so the unit tests can prove
each exclusion rejects rather than merely assuming it does.

## Commands — should count

Run `npm test` before pushing.

Install with `npx convoke-install-vortex`, then run `convoke-doctor` to verify.

Invoke `/bmad-code-review` when the change reaches a landing point.

```bash
node scripts/audit/derived-assertions.js --self-check
git rev-parse HEAD
```

## Commands — should NOT count

The npm registry is where this package lives. (Bare tool name, no subcommand — prose.)

We use git for version control. (Same: a tool named, not an invocation.)

## Paths — should count

Read `scripts/update/lib/agent-registry.js` before editing the roster.

The manifest is at `_bmad/_config/skill-manifest.csv`.

See [the contributing guide](CONTRIBUTING.md) for the workflow.

`README.md` is the entry point. (A root-level file with no directory prefix.)

Check `.gitignore` before committing. (A root dotfile — no extension to match on.)

Open `agent-registry.js` to see the roster. (A filename with no directory prefix — the case an
11-entry allowlist used to miss.)

## Paths — should NOT count

Visit `https://example.com/docs/guide` for the upstream copy. (A URL, not a repository path.)

Choose the agent and/or the workflow. (A slash in prose is not a path.)

## Counts — should count

The framework ships seven Vortex agents.

There are 4 Gyre agents in the readiness team.

Twelve workflows are registered for the build team.

## Counts — should NOT count

Upgrading to 4.0.2 agents-per-team was never a thing. (The digits belong to a version.)

## Version claims — should count

The current release is 4.0.2.

Migrating from 1.7.x requires a clean install. The 1.4.x line is unaffected. (Two `N.N.x` ranges —
this pattern was once deletable with the whole suite green, because the self-check tested KINDS and a
sibling pattern kept `version` alive.)

Pin `convoke-agents@3.3.0` if you need the previous behaviour.

## Version claims — should NOT count

Nothing here: a semver inside an illustrative snippet the reader is not asked to believe is
excluded by the reviewer, not by a pattern, and that limitation is recorded in the story rather
than pretended away.
