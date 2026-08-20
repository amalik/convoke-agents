# Review prompt — Blind Hunter (unrun half of Round 1)

Round 1 for `spec-ci-flake-git-fixture-teardown` ran only Edge Case Hunter. Two subagent
attempts at this reviewer failed (API error, then watchdog stall). Run this in a separate
session — ideally a different model — and paste the findings back.

---

Invoke the `bmad-review-adversarial-general` skill on the changes to `tests/helpers.js`,
`tests/lib/migration-execution.test.js` and `tests/unit/helpers.test.js` since commit
`03271c2c80daa0361d73b035f424ae68f0b52b75`.

Reconstruct the diff with:

```
git diff 03271c2c80daa0361d73b035f424ae68f0b52b75 -- tests/
```

**What the change does.** CI run 32115225495 failed `executeInjections > preserves existing
frontmatter fields (NFR20)` in its `afterEach` with
`ENOTEMPTY: directory not empty, rmdir '/tmp/convoke-inject-XXXXXX/.git/objects'`, taking three
jobs red (test 20, test 22, coverage) while the Node 18 leg passed. Cause: `git commit` forks a
detached `git maintenance run --auto --no-quiet --detach` child that outlives the parent
`execFileSync` and keeps writing inside `.git/objects`, while fs-extra 11's `remove()` is
`fs.rm({recursive, force})` with `maxRetries` defaulted to 0. Fix: `initGitFixture` (repo-local
`maintenance.auto=false`) and `removeTempDir`/`removeTempDirSync` (retries; lists surviving
entries on final failure), adopted across five suites.

**Attack these specifically:**

- Does the fix address the reported failure, or only appear to? Note that the race could not be
  reproduced locally in 300 iterations — the causal link between the detached child and the
  `ENOTEMPTY` is inferred from a trace, not demonstrated.
- Do the two rewritten `beforeEach` blocks in `migration-execution.test.js` preserve the exact
  behaviour of what they replaced?
- Can the survivor-listing path throw, mask the original error, hang, or recurse without bound?
- Are the containment guards (`_assertRemovableTempPath`, the `initGitFixture` absolute-path
  check) bypassable, or do they reject legitimate callers?
- Anything the change breaks that its own tests would not catch.

Output a plain list: `file:line`, what is wrong, and a concrete failure scenario
(inputs/state -> wrong outcome). Do not assign severity. Assume it is broken and prove it.
