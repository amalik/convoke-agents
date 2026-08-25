## What this changes

<!-- One or two sentences. What is different after this merges, from a user's point of view? -->

## Why

<!-- The problem, the issue number, or the backlog ID. If it fixes an issue, write "Fixes #NNN". -->

---

## Before review

- [ ] `npm run lint` — exits 0 with **zero warnings** (`lint-passes-before-review`)
- [ ] `npm run test:all` — unit, integration and P0 pass locally
- [ ] `npm run docs:audit` — if this touches documentation
- [ ] New tests use isolated fixtures with `{ cwd: tmpDir }` (`test-fixture-isolation`)
- [ ] No assertion depends on a clock, a delay, ambient env, or live repo state (`fixture-determinism`)
- [ ] No hardcoded version strings or magic counts (`no-hardcoded-versions`, `derive-counts-from-source`)
- [ ] Anything under `_bmad/bme/` self-checked against the Operator Covenant checklist
- [ ] New skill or workflow? The namespace decision and its reasoning are stated below

## Which `project-context.md` rules does this touch?

<!-- Name them. "None" is a valid answer, but check the file before writing it —
     several rules are enforced by reviewers with "block and cite this rule". -->

## Anything a reviewer should look at hardest?

<!-- The part you are least sure about. Naming it makes the review faster and is not held against you. -->

---

<sub>Ten CI jobs run on this pull request, including a five-iteration burn-in that does not run on direct pushes. Details: [CONTRIBUTING.md](../CONTRIBUTING.md#the-bar). Do not add a `CHANGELOG.md` entry — those are written at release time.</sub>
