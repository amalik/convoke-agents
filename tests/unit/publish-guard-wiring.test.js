'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Guards the seam the dist-1b-1 extraction created.
//
// The FR5 downgrade comparison used to live inline in the publish job; it now lives in
// scripts/ci/downgrade-guard.sh and is called from two places. The `downgrade-guard-dry`
// CI job exercises the SCRIPT, not the CALLER — so if a future edit deletes, comments out,
// or `|| true`s the call in `publish`, the dry job stays green forever while the only
// protection on the `latest` dist-tag is silently gone.
//
// These tests assert the caller, which nothing else does.

const CI = fs.readFileSync(
  path.join(__dirname, '..', '..', '.github', 'workflows', 'ci.yml'), 'utf8');

// The publish job mentions `downgrade-guard.sh` in several COMMENTS as well as in the one
// executable call. Every assertion below must anchor on the executable line; matching any
// mention has silently broken this file's checks three times.
function guardCallLine(block) {
  const lines = block.split('\n').filter((l) => l.includes('downgrade-guard.sh') && !/^\s*#/.test(l));
  assert.equal(lines.length, 1,
    `expected exactly one executable reference to downgrade-guard.sh, found ${lines.length}`);
  return lines[0];
}

// A job runs from `  <name>:` to the next top-level (2-space) job key. Generalised from
// `publishJobBlock` when T206 needed the same slice of `agent-surface-parity`; the publish
// wrapper below is kept so the existing tests read unchanged.
function jobBlock(name) {
  const start = CI.indexOf(`\n  ${name}:\n`);
  assert.ok(start !== -1, `${name} job not found in ci.yml`);
  const rest = CI.slice(start + 1);
  // `[\w-]` not `[a-z0-9-]`: job ids may carry `_` and uppercase, and a terminator that cannot
  // stop on one lets the block over-run into the next job, attributing its settings to this one.
  const next = rest.search(/\n {2}[\w-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
}

function publishJobBlock() {
  return jobBlock('publish');
}

test('publish job invokes the shared downgrade guard', () => {
  const block = publishJobBlock();
  assert.match(block, /scripts\/ci\/downgrade-guard\.sh/,
    'publish job no longer calls scripts/ci/downgrade-guard.sh — the latest dist-tag is unguarded');
});

test('publish job binds the guard operands by NAME, in the right direction', () => {
  const block = publishJobBlock();
  assert.match(block, /GUARD_CAND="\$CAND"/,
    'GUARD_CAND must be bound to $CAND — a transposed binding inverts every verdict');
  assert.match(block, /GUARD_CURRENT="\$CURRENT"/,
    'GUARD_CURRENT must be bound to $CURRENT — a transposed binding inverts every verdict');
});

test('the guard call is not neutralised', () => {
  const block = publishJobBlock();
  const call = guardCallLine(block);
  assert.ok(!/\|\|\s*true/.test(call), 'guard call must not be suffixed with || true');
  assert.ok(!/^\s*[#]/.test(call), 'guard call must not be commented out');
});

test('the CAND shape check stays in the workflow, ahead of the registry read', () => {
  const block = publishJobBlock();
  const shape = block.indexOf('is not a plain X.Y.Z release; refusing');
  const read = block.indexOf('npm view "$PKG" dist-tags.latest');
  assert.ok(shape !== -1, 'CAND shape check missing from the publish job');
  assert.ok(read !== -1, 'registry read missing from the publish job');
  assert.ok(shape < read,
    'CAND must be validated before the registry read — on the E404 skip path the script is never called');
});

test('the dry job cannot publish', () => {
  const start = CI.indexOf('\n  downgrade-guard-dry:\n');
  assert.ok(start !== -1, 'downgrade-guard-dry job not found');
  const rest = CI.slice(start + 1);
  // `[\w-]` not `[a-z0-9-]`: job ids may carry `_` and uppercase, and a terminator that cannot
  // stop on one lets the block over-run into the next job, attributing its settings to this one.
  const next = rest.search(/\n {2}[\w-]+:\n/);
  const block = next === -1 ? rest : rest.slice(0, next);
  assert.ok(!/id-token/.test(block), 'dry job must not request id-token');
  assert.ok(!/npm publish/.test(block), 'dry job must not invoke npm publish');
  const publishBlock = publishJobBlock();
  const needs = publishBlock.match(/needs:\s*\[([^\]]*)\]/);
  assert.ok(needs, 'publish job needs: not found');
  assert.ok(!needs[1].includes('downgrade-guard-dry'),
    'dry job must not gate publish — it is a signal, not a release gate');
});

test('the guard block runs BEFORE npm publish', () => {
  const block = publishJobBlock();
  const guard = block.indexOf(guardCallLine(block));      // the CALL, not a comment about it
  const publishLine = block
    .split('\n')
    .find((l) => l.includes('npm publish --provenance') && !/^\s*#/.test(l));
  assert.ok(publishLine, 'executable npm publish line not found');
  const publish = block.indexOf(publishLine);
  assert.ok(guard < publish,
    'npm publish must come AFTER the downgrade guard — a guard that runs later guards nothing');
});

test('the guard block is reachable: it is gated on DIST_TAG = latest', () => {
  const block = publishJobBlock();
  assert.match(block, /if \[ "\$DIST_TAG" = "latest" \]; then/,
    'the FR5 block must be gated on DIST_TAG = "latest" — any other literal makes it dead code');
});

test('DIST_TAG derivation still sends releases to latest and prereleases to rc', () => {
  const block = publishJobBlock();
  // case "${VERSION%%+*}" in *-*) DIST_TAG=rc ;; *) DIST_TAG=latest ;; esac
  const m = block.match(/case "\$\{VERSION%%\+\*\}" in([\s\S]{0,200}?)esac/);
  assert.ok(m, 'DIST_TAG derivation not found');
  const body = m[1];
  const rcIdx = body.indexOf('DIST_TAG=rc');
  const latestIdx = body.indexOf('DIST_TAG=latest');
  assert.ok(rcIdx !== -1 && latestIdx !== -1, 'both DIST_TAG arms must exist');
  assert.ok(rcIdx < latestIdx,
    'the *-* (prerelease) arm must set rc and come first — inverted, a prerelease would move latest');
});

// --- T44: the refusal messages are the deliverable ---------------------------
//
// The guard has no override by design, so its FATAL text IS the escape hatch:
// it is the only thing standing between an operator and rediscovering the repair
// under pressure. That makes the citation deletable-without-notice in exactly the
// way a comment is, which is why it is asserted rather than trusted.
//
// These run the SCRIPT (no network, no credentials — that is what the dist-1b-1
// extraction bought) across every refusal mode, and check two things per mode:
// it exits non-zero, and it names the procedure.

const { execFileSync } = require('node:child_process');
const PLAYBOOK_DOC = 'docs/npm-publishing-access-playbook.md';
// The SECTION NUMBER is load-bearing and must be asserted with the path, not apart
// from it. Asserting the bare path leaves the guard free to cite any section: this
// very change renumbered `## 5. Related` to `## 6. Related`, so the next insert
// renumbers §5 too, and a guard still saying "§5" would point operators at whatever
// then occupies the slot. Measured: citing `§9` passed all 15 tests before this.
const PLAYBOOK_CITE = `${PLAYBOOK_DOC} \u00a75`;
const GUARD_SH = path.join(__dirname, '..', '..', 'scripts', 'ci', 'downgrade-guard.sh');

function runGuard(cand, current) {
  try {
    const stdout = execFileSync('bash', [GUARD_SH], {
      env: { ...process.env, GUARD_CAND: cand, GUARD_CURRENT: current, GUARD_PKG: 'convoke-agents' },
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, stderr: '', stdout };
  } catch (err) {
    return { code: err.status, stderr: err.stderr || '', stdout: err.stdout || '' };
  }
}

// `cites` is false only for the malformed-CAND path: that one is a repository bug
// (a bad package.json version), not an operator situation, and the playbook's own
// table says there is nothing to repair on npm. Keeping it uncited preserves the
// meaning of the citation everywhere else — "there is a procedure for this".
const REFUSALS = [
  { name: 'accidental or deliberate downgrade', cand: '4.0.0', current: '999.0.0', cites: true },
  { name: 'empty latest', cand: '4.0.2', current: '', cites: true },
  { name: 'prerelease parked on latest', cand: '4.0.2', current: '4.1.0-rc.1', cites: true },
  { name: 'multi-line latest', cand: '4.0.2', current: '4.0.0\n4.0.1', cites: true },
  { name: 'malformed candidate', cand: '4.0.1-rc.0', current: '4.0.0', cites: false },
];

for (const r of REFUSALS) {
  test(`downgrade guard refuses and explains: ${r.name}`, () => {
    const { code, stderr } = runGuard(r.cand, r.current);
    assert.equal(code, 1, `expected refusal, got exit ${code}`);
    assert.match(stderr, /^FATAL:/m, 'a refusal must announce itself as FATAL');
    if (r.cites) {
      assert.ok(stderr.includes(PLAYBOOK_CITE),
        `refusal "${r.name}" no longer cites ${PLAYBOOK_CITE} — the documented repair is unreachable from the failure`);
    }
  });
}

test('the guard still passes when the candidate is not a downgrade', () => {
  // Anchors the suite above. NOT against deleting the comparison — measured, that
  // already fails the downgrade refusal test on its own. This catches the mutant the
  // five refusal tests structurally cannot see: a comparison forced always-true, where
  // every refusal still refuses and only a legitimate release proves the guard wrong.
  const { code, stdout } = runGuard('4.0.2', '4.0.1');
  assert.equal(code, 0, 'a legitimate release must not be refused');
  assert.match(stdout, /OK/);
});

test('the cited playbook section exists', () => {
  // The citation is worthless if it points at a heading that has been renamed.
  const doc = fs.readFileSync(path.join(__dirname, '..', '..', PLAYBOOK_DOC), 'utf8');
  assert.match(doc, /^## 5\. The downgrade guard refused the publish$/m,
    'the guard cites §5 by number and title; the playbook no longer has that heading');
  for (const mode of ['EMPTY', 'multi-line', 'lower than current latest']) {
    assert.ok(doc.includes(mode), `playbook §5 no longer documents the "${mode}" refusal mode`);
  }
});

// ─── T206: the marketplace validator's wiring (2026-09-21) ────────────────────
//
// PARSED, NOT REGEXED — and that is the whole lesson of this block. The first version matched
// `ci.yml` as text: it sliced jobs on indentation, found `needs:` with an unanchored regex over a
// block that is mostly comments, anchored key detection on bare identifiers at fixed columns, and
// checked `publish.if` against a two-entry blacklist. An adversarial pass got a drifted manifest
// published NINE ways with all twenty tests green — a quoted `"if": false` key, a job re-indented
// by two spaces, a `needs` entry renamed to a superstring of the old one, a decoy `needs:` in a
// comment, `success() || failure()` instead of `always()`, and a second `npm publish` job.
//
// Eight of the nine were the same defect. YAML has a parser, this repository already depends on
// one, and `scripts/audit/validate-marketplace.js` already documents this exact idiom. Text
// matching cannot bound a structured document or an expression language; do not reintroduce it
// here.
//
// The tests above this line stay text-based on purpose: they assert SHELL inside a `run:` block,
// which a parser hands back as an opaque string anyway.
const yaml = require('js-yaml');

const WORKFLOW = yaml.load(CI);
const MARKETPLACE_STEP = 'Marketplace metadata integrity';
/**
 * Does this `shell:` value run the body with errexit in force?
 *
 * R2 used `/bash\s+-[a-z]*e/`, which is wrong in both directions (R3):
 *   - It ACCEPTED `bash -eo pipefail +e {0}`, matching on `-eo` and never reading the later `+e`, which
 *     turns errexit back off. Verified in bash: `bash -eo pipefail +e -c 'false; echo X; exit 0'` prints X.
 *   - It REJECTED every correct spelling that is not literally `bash -e…`: the Actions keyword `bash`
 *     (which expands to `bash --noprofile --norc -eo pipefail {0}`), that literal expansion, `bash -x -e
 *     {0}`, and `sh -e {0}`. Writing the workflow default as the string GitHub itself documents failed
 *     the test, which is a false accusation on correct wiring.
 *
 * @param {string} shell
 * @returns {boolean}
 */
function shellEnablesErrexit(shell) {
  const v = String(shell || '').trim();
  if (!v) return false;
  // Actions keywords. `bash` expands to `bash --noprofile --norc -eo pipefail {0}`; `sh` to `sh -e {0}`.
  if (v === 'bash' || v === 'sh') return true;
  // Any other value is a literal command line. It must be a POSIX shell, must enable errexit, and must
  // not disable it again afterwards.
  if (!/(^|\/)(ba)?sh(\s|$)/.test(v)) return false;
  const enable = v.search(/\s-[a-z]*e/);
  if (enable < 0) return false;
  const disable = v.search(/\s\+([a-z]*e[a-z]*|o\s+errexit)\b/);
  return disable < 0 || disable < enable;
}

const AUDIT_JOB = 'agent-surface-parity';

function auditJob() {
  const job = WORKFLOW.jobs[AUDIT_JOB];
  assert.ok(job, `${AUDIT_JOB} job not found in ci.yml`);
  return job;
}

function marketplaceStep(jobName = AUDIT_JOB) {
  const job = WORKFLOW.jobs[jobName];
  assert.ok(job, `${jobName} job not found in ci.yml`);
  const matches = (job.steps || []).filter((s) => s.name === MARKETPLACE_STEP);
  assert.equal(matches.length, 1,
    `expected exactly one "${MARKETPLACE_STEP}" step in ${jobName}, found ${matches.length}`);
  return matches[0];
}

test('the marketplace validator is actually invoked in agent-surface-parity', () => {
  assert.equal((marketplaceStep().run || '').trim(), 'node scripts/audit/validate-marketplace.js',
    'the step must invoke the validator bare — no || true, no --dry-run, no redirection');
});

// `if:` and `continue-on-error:` are read off the PARSED node, so a quoted key, an odd indent and
// a false-valued expression are all the same thing to this assertion. Any `if:` is refused rather
// than only falsy ones: a conditional release gate is a decision that should break this test.
test('the marketplace step and its job are unconditional and cannot fail softly', () => {
  const step = marketplaceStep();
  const job = auditJob();
  for (const [label, node] of [['step', step], ['job', job]]) {
    assert.ok(!('if' in node),
      `the marketplace ${label} must not be conditional — a skipped check is a green tick over nothing; got if: ${JSON.stringify(node.if)}`);
    assert.ok(!('continue-on-error' in node),
      `the marketplace ${label} must not set continue-on-error — it would report the finding and pass anyway`);
  }
});

// SET MEMBERSHIP, not substring. `needs: [… agent-surface-parity-lite …]` satisfied the old
// `includes()` check while the real job gated nothing.
test('publish needs agent-surface-parity, by exact entry', () => {
  const needs = WORKFLOW.jobs.publish.needs;
  assert.ok(Array.isArray(needs), `publish.needs must be a list; got ${typeof needs}`);
  assert.ok(needs.includes(AUDIT_JOB),
    `publish.needs must contain the exact entry "${AUDIT_JOB}" or the marketplace check cannot block a release; got: ${needs.join(', ')}`);
});

// A WHITELIST of the WHOLE list, because pinning one entry pinned one entry: 7 of the 8 gates could be
// deleted with the entire suite green, `test` among them — the job that runs this very file, so one
// deleted word made every assertion here invisible to a release while the `test` job went red beside it
// and `publish` no longer waited. A literal list, not one derived from the workflow: a fixture built from
// the thing under test cannot see it shrink. Adding a gate is also a red, deliberately — a new gate that
// must block a release should be named here on purpose (R2).
const REQUIRED_NEEDS = [
  'agent-surface-parity',
  'coverage',
  'fresh-install',
  'lint',
  'package-check',
  'python-test',
  'security',
  'test',
];

test('publish waits on every gate, by whole-list equality', () => {
  const needs = WORKFLOW.jobs.publish.needs;
  assert.ok(Array.isArray(needs), `publish.needs must be a list; got ${typeof needs}`);
  assert.deepEqual([...needs].sort(), [...REQUIRED_NEEDS].sort(),
    'publish.needs must match the gate list exactly. Removing one lets a red gate ship; adding one '
    + 'silently is a gate nobody reviewed. Got: ' + needs.join(', '));
});

// MEMBERSHIP IS NOT BLOCKING. R2 closed DELETION from `publish.needs` and left SOFTENING wide open:
// `continue-on-error: true` on a gate job makes it report success while its checks fail, and `publish`
// then runs. R3 neutralised 7 of the 8 gates one line at a time with the suite green — `test` among them,
// the job that runs this very file — and did the same at step level inside `lint`. Only
// `agent-surface-parity` was protected, and only because T206 happened to protect it.
test('every gate publish waits on can actually fail', () => {
  const soft = [];
  for (const name of REQUIRED_NEEDS) {
    const job = WORKFLOW.jobs[name];
    assert.ok(job, `publish.needs names "${name}" but no such job exists`);
    if ('continue-on-error' in job) soft.push(`${name} (job)`);
    if ('if' in job) soft.push(`${name} (job if:)`);
    for (const [i, step] of (job.steps || []).entries()) {
      if ('continue-on-error' in step) soft.push(`${name} step ${i} (${step.name || step.uses || 'run'})`);
    }
  }
  assert.deepEqual(soft, [],
    'a gate that cannot fail is not a gate: continue-on-error makes the job report success while its '
    + `checks fail, and a job-level if: can skip it entirely, which satisfies needs. Found: ${soft.join(', ')}`);
});

test('publish is not itself allowed to fail', () => {
  // The step-level check at the T45 block reads the step; the JOB node was never checked, although the
  // sibling marketplace assertion checks both. Not a credential bypass while the scan and `npm publish`
  // share one step — it becomes one the moment that step is split, which is the obvious next refactor (R2).
  assert.ok(!('continue-on-error' in WORKFLOW.jobs.publish),
    'the publish job must not set continue-on-error — a refused release would report green');
});

// A WHITELIST, because a blacklist cannot bound an expression language: `!cancelled()` is
// `success() || failure()` spelled differently, and `!failure()` lets publish run over a skipped
// need. Any status function in publish's `if:` means it no longer defers to `needs`.
test('publish does not run regardless of its needs', () => {
  const cond = WORKFLOW.jobs.publish.if;
  assert.ok(typeof cond === 'string' && cond.length, 'publish must keep a job-level if:');
  const statusFn = cond.match(/\b(always|success|failure|cancelled)\s*\(/);
  assert.equal(statusFn, null,
    `publish.if must contain no status function — any of them overrides the needs gate; got: ${cond}`);
});

// Nothing forbade a SECOND publishing job. npm's trusted publisher is bound to the workflow
// FILENAME, not the job, so an "emergency lane" inside ci.yml is registry-permitted and bypasses
// both this gate and the FR5 downgrade guard. The sibling assertion for `downgrade-guard-dry`
// already existed; this generalises it.
// `npm publish` was the only command constrained, spelled with ONE literal space. A second publishing
// job survived as `npm  publish` (two spaces) or `$NPMBIN publish`; and nothing constrained the other
// commands that mutate the registry — a job running `npm dist-tag add convoke-agents@1.0.0 latest` moved
// `latest` backwards past both this gate and the FR5 downgrade guard, with the suite green (R2).
// WRITE subcommands only, and read off parsed `run:` bodies rather than raw file text (R3). The R2 form
// flagged read-only calls — a `npm publish --dry-run` rehearsal step went red — and, applied to whole
// file text, flagged a second workflow whose only mention was a PROSE COMMENT. Both are false accusations
// on correct configuration, which is how an assertion gets relaxed.
const REGISTRY_WRITE = /(^|[\s;&|(])npm\s+(\S+\s+)*?(publish|dist-tag|deprecate|unpublish)(\s|$)/;
const REGISTRY_WRITE_SUB = /(^|[\s;&|(])npm\s+(\S+\s+)*?(access\s+(set|grant|revoke)|owner\s+(add|rm)|token\s+(create|revoke))(\s|$)/;

/** Executable lines of a `run:` body that write to the registry. `--dry-run` writes nothing. */
function registryWrites(run) {
  return String(run || '').split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .filter((l) => !l.includes('--dry-run'))
    .filter((l) => REGISTRY_WRITE.test(l) || REGISTRY_WRITE_SUB.test(l));
}

test('publish is the only job in ci.yml that mutates the registry', () => {
  const publishers = Object.entries(WORKFLOW.jobs)
    .filter(([, job]) => (job.steps || []).some((s) => registryWrites(s.run).length > 0))
    .map(([name]) => name);
  assert.deepEqual(publishers, ['publish'],
    `exactly one job may run npm publish/dist-tag/deprecate/unpublish/access/owner/token; found: ${publishers.join(', ') || 'none'}`);
});

// `ci.yml` is the only workflow that may publish. npm's trusted publisher is bound to the
// workflow FILENAME (`docs/npm-publishing-access-playbook.md` §1), so a second file publishing is
// refused registry-side — but that is an external control the playbook itself records as having
// no read-back. Asserting it here turns an invisible dependency into a visible local one.
// A TEXT scan cannot see an indirect spelling: `NPMBIN=npm; $NPMBIN publish` carries no literal `npm
// publish` and no pattern over the workflow source will find it. So this asserts the CAPABILITY instead,
// which is what a second publishing job would actually need — `id-token: write` is how a job gets an OIDC
// identity to publish with. The text scan above bounds direct invocations; this bounds the permission.
// Neither catches an indirect spelling in a job with no token, which also cannot authenticate. The
// residual — an indirect spelling in a job that carries a token by some other route — is filed, not
// claimed closed (R2).
test('only the publish job may mint an OIDC identity', () => {
  // Two blind spots R3 walked through, each 88/0 green:
  //   - WORKFLOW-level `permissions:` applies to every job ("applies to all jobs in the workflow"), so
  //     declaring id-token there hands an OIDC identity to all of them while `publish` still declares its
  //     own and this list still reads `['publish']`.
  //   - `permissions: write-all` is a documented STRING shorthand setting every scope to write, id-token
  //     included; `job.permissions['id-token']` on a string is `undefined`.
  // Composed with a flag-prefixed `npm --loglevel=silly publish`, those made a complete second publishing
  // lane that passed every assertion — each half caught alone, neither caught together.
  const grantsIdToken = (perms) => perms === 'write-all' || (perms && perms['id-token'] === 'write');
  assert.ok(!grantsIdToken(WORKFLOW.permissions),
    'the workflow must not grant id-token at the top level — that gives every job an OIDC identity; '
    + 'declare it on the publish job only');
  const holders = Object.entries(WORKFLOW.jobs)
    .filter(([, job]) => grantsIdToken(job.permissions))
    .map(([name]) => name)
    .sort();
  assert.deepEqual(holders, ['publish'],
    `only publish may hold id-token: write, by any spelling including write-all — that permission is how a job authenticates to the registry; found: ${holders.join(', ') || 'none'}`);
});

test('ci.yml is the only workflow file that mutates the registry', () => {
  const dir = path.join(__dirname, '..', '..', '.github', 'workflows');
  const offenders = fs.readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f))
    .filter((f) => {
      const doc = yaml.load(fs.readFileSync(path.join(dir, f), 'utf8'));
      return Object.values((doc && doc.jobs) || {})
        .some((job) => (job.steps || []).some((st) => registryWrites(st.run).length > 0));
    })
    .sort();
  assert.deepEqual(offenders, ['ci.yml'],
    `only ci.yml may contain npm publish — the registry's trusted publisher is bound to that filename; found: ${offenders.join(', ') || 'none'}`);
});

// The placement that closes the last bypass. `agent-surface-parity` validates a checkout of its
// own; a step earlier in that job which writes the manifest, or a `ref:` on its checkout, leaves
// it green on a file the release never ships — and no assertion about `run:`, `if:` or `needs`
// can see that. This step validates the tree `npm publish` actually packs, so the whole class is
// unreachable rather than enumerated.
test('publish validates the manifest in the tree it is about to pack', () => {
  const step = marketplaceStep('publish');
  assert.equal((step.run || '').trim(), 'node scripts/audit/validate-marketplace.js',
    'the publish-side check must invoke the validator bare');
  assert.ok(!('if' in step) && !('continue-on-error' in step),
    'the publish-side check must be unconditional and hard-failing');

  // Order is the whole point: after `npm ci` so its dependencies resolve, before the publish so a
  // drifted manifest stops the release instead of shipping inside the tarball.
  const names = WORKFLOW.jobs.publish.steps.map((x) => x.name || x.uses);
  const check = names.indexOf(MARKETPLACE_STEP);
  assert.ok(check > names.indexOf('Install dependencies'),
    'the check must run after npm ci or the validator cannot load js-yaml');
  assert.ok(check < names.indexOf('Publish to npm'),
    'the check must run before npm publish or it validates a tarball already gone');
});

// ─── T45: the npm credential scan ───────────────────────────────────────────
// The scan used to be inline bash that inspected ZERO files in the steady state. It is now a script
// with its own tests (`tests/unit/npm-credential-scan.test.js`), which moves the fragile part to the
// WIRING — the same failure class this file was created for.
const CRED_SCRIPT = 'scripts/audit/npm-credential-scan.js';

function publishJobT45() {
  const job = WORKFLOW.jobs.publish;
  assert.ok(job, 'publish job not found in ci.yml');
  return job;
}

test('T45: exactly one publish step invokes the credential scan', () => {
  const invoking = (publishJobT45().steps || [])
    .filter((step) => typeof step.run === 'string' && step.run.includes(CRED_SCRIPT));
  assert.strictEqual(invoking.length, 1,
    `expected exactly one publish step invoking ${CRED_SCRIPT}, found ${invoking.length}`);
});

test('T45: the scan is on an executable line, not only in a comment', () => {
  const step = (publishJobT45().steps || [])
    .find((s) => typeof s.run === 'string' && s.run.includes(CRED_SCRIPT));
  assert.ok(step, `no publish step references ${CRED_SCRIPT}`);
  const executable = step.run.split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .some((line) => line.includes(`node ${CRED_SCRIPT}`));
  assert.ok(executable,
    `${CRED_SCRIPT} appears in the step but never on an executable line — a commented-out guard is documentation`);
});

test('T45: the wired script exists and can actually fail', () => {
  // A wiring assertion that never runs the thing is how the marketplace check stayed dead for months.
  const abs = path.join(__dirname, '..', '..', CRED_SCRIPT);
  assert.ok(fs.existsSync(abs), `${CRED_SCRIPT} is wired into ci.yml but does not exist`);
  const { check } = require(abs);
  const { fatal } = check({ env: { NODE_AUTH_TOKEN: 'x' }, home: '/none', cwd: '/none', fromNpm: [] });
  assert.ok(fatal.length > 0, 'the script must be able to fail, or wiring it asserts nothing');
});

test('T45: the scan runs BEFORE npm publish', () => {
  // Both siblings in this file pin ordering; the T45 block skipped the idiom. A guard that runs after
  // the credential it guards has been used is decoration.
  // ONE code path, over the job's executable lines end to end. The two-branch version had a branch that
  // could never run — the scan and `npm publish` share a step, so the cross-step fallback inside a release
  // guard was never executed — and its `publishAt` scanned whole step bodies INCLUDING comments, so a
  // harmless earlier step mentioning `npm publish` in a comment turned this RED on correct wiring. A false
  // positive is how an assertion gets loosened under time pressure (R2).
  const steps = publishJobT45().steps || [];
  const exec = [];
  for (const step of steps) {
    if (typeof step.run !== 'string') continue;
    for (const line of step.run.split('\n')) {
      const t = line.trim();
      if (t && !t.startsWith('#')) exec.push(t);
    }
  }
  const scanLine = exec.findIndex((line) => line.includes(CRED_SCRIPT));
  const publishLine = exec.findIndex((line) => /(^|[|&;(]\s*)npm\s+publish/.test(line));
  assert.ok(scanLine >= 0, `${CRED_SCRIPT} is not on an executable line in the publish job`);
  assert.ok(publishLine >= 0, '`npm publish` is not on an executable line in the publish job');
  assert.ok(scanLine < publishLine,
    `the credential scan must precede \`npm publish\` (scan at executable line ${scanLine}, publish at ${publishLine})`);
});

test('T45: the step relies on errexit, so errexit must be in force', () => {
  // Every other assertion in the step ends in an explicit `exit 1`; the scan fails ONLY because the
  // default shell is `bash -e…`. Dropping `-e` disarms this guard and leaves the others working (R1).
  //
  // PRECEDENCE, in the order Actions applies it: step `shell:` > job `defaults.run.shell` > workflow
  // `defaults.run.shell`. R1 walked the `||` chain in the OPPOSITE order and never read the step at all,
  // so the truthy workflow-level value satisfied the assertion while the step ran under a shell with no
  // `-e`: `shell: bash {0}` on the step, or job defaults without `-e`, left the whole suite green and the
  // scan's `exit 1` ignored — and disarmed the FR5 downgrade guard in the same two lines (R2).
  const job = WORKFLOW.jobs.publish;
  const step = (publishJobT45().steps || [])
    .find((x) => typeof x.run === 'string' && x.run.includes(CRED_SCRIPT));
  assert.ok(step, `no publish step references ${CRED_SCRIPT}`);
  const shell = step.shell
    || (job.defaults && job.defaults.run && job.defaults.run.shell)
    || (WORKFLOW.defaults && WORKFLOW.defaults.run && WORKFLOW.defaults.run.shell)
    || '';
  assert.ok(shellEnablesErrexit(shell),
    `the publish step's shell must carry errexit for a bare script call to fail the job; got ${JSON.stringify(shell)}`);
  // BOTH spellings of the same instruction. `set +o errexit` is `set +e`, and pinning one spelling let
  // one inserted line walk past this with 55/55 green (R2).
  // EXECUTABLE LINES ONLY. Both of these read prose before R3, so documenting the prohibition in the
  // step's own comment tripped the assertion that enforces it, and a `# set +e` note went red.
  // Also matched `set -e +e` and `eval "set +e"`, which the single `set\s+\+` shape missed (R3).
  const execAll = step.run.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).join('\n');
  assert.ok(!/(^|[\s;&|("'`])set\s+[-+a-z]*\s*(\+[a-z]*e[a-z]*|\+o\s+errexit)\b/m.test(execAll),
    'the step must not disable errexit, in any spelling — `set +e`, `set +ex`, `set -e +e`, '
    + '`eval "set +e"` and `set +o errexit` are the same instruction');
  // `PWD` is an ordinary assignable variable, so the `--cwd "$PWD"` this step passes can be pointed at an
  // empty directory while the call stays byte-identical and every other assertion here passes (R2).
  assert.ok(!/(^|[\s;&|(])(export\s+|declare\s+-\S+\s+)?PWD=/m.test(execAll),
    'the step must not assign PWD — the scan is told which project npmrc to read through "$PWD"');
  // `cd` before the call repoints `$PWD` without assigning it, and R3 proved end to end that
  // `cd /tmp` hides a live repo-root token. Unreachable now that the call is the first executable
  // line, and asserted anyway so moving the call back cannot quietly reopen it.
  const beforeCall = execAll.split('\n').slice(0, execAll.split('\n').findIndex((l) => l.includes(CRED_SCRIPT)));
  assert.deepEqual(beforeCall, [],
    `nothing may run before the credential scan; found: ${JSON.stringify(beforeCall)}`);
});

test('T45: the scan call is not neutered', () => {
  // `|| true` on the call passed every other assertion here. T206 pinned nine neutering paths for the
  // marketplace check for exactly this reason: a wired guard that cannot fail is documentation.
  const step = (publishJobT45().steps || [])
    .find((x) => typeof x.run === 'string' && x.run.includes(CRED_SCRIPT));
  assert.ok(step, `no publish step references ${CRED_SCRIPT}`);
  // THE CALL IS THE FIRST EXECUTABLE LINE OF THE STEP. That is the whole guard, and it needs no bash
  // parser.
  //
  // R2 tried to prove the call was not nested by counting `if|while|until|for|case` openers against
  // `fi|done|esac` closers. A hand-rolled bash parser fails in both directions, and R3 demonstrated both:
  //   - It knew 5 of bash's 8 grouping constructs. `{ … } || true`, `( … ) || true`, and a never-invoked
  //     `scan_credentials() { … }` wrapper all left the suite green with the scan NEVER RUNNING. A heredoc
  //     body line beginning `fi` cancelled a real `if`, restoring the very `SKIP_CRED_SCAN` bypass the
  //     assertion was written to close.
  //   - It was already WRONG about this file. `ci.yml` contains a one-line `case … esac`, whose closer the
  //     line-anchored regex never sees, so the step's running depth ends at 1. The call passed only
  //     because it sat before that line; any one-liner added above it falsely accused correct wiring of
  //     nesting — which is how an assertion gets deleted under release pressure.
  //
  // Position is checkable without interpreting anything. Nothing can enclose the first executable line,
  // nothing can `set +e` before it, nothing can `cd` before it, and it cannot be ordered after
  // `npm publish`. The scan was moved to the top of the step for this (R3).
  const exec = step.run.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  assert.ok(exec.length > 0, 'the publish step has no executable lines');
  assert.match(exec[0], new RegExp(`^node ${CRED_SCRIPT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} --cwd "\\$PWD"$`),
    'the credential scan must be the FIRST executable line of the publish step, called bare and passing '
    + `--cwd "$PWD". Anything above it can wrap, skip or relocate it. Got: ${JSON.stringify(exec[0])}`);
  // Read off the PARSED node, so a quoted key or odd indentation cannot hide it.
  assert.ok(!('continue-on-error' in step),
    'the step must not set continue-on-error — it would report the finding and publish anyway');
  assert.ok(!('if' in step),
    'the step must not be conditional — an `if:` that evaluates false skips the only credential guard');
});

test('T45: no inline npmrc loop remains beside the script', () => {
  // By CLASS, not by variable name: the previous assertion pinned `NPMRC_CHECKED`, so a reintroduced
  // loop with any other counter passed (R1).
  assert.ok(!CI.includes('NPMRC_CHECKED'),
    'the inline bash loop is back alongside the script — two implementations, one of them untested');
  const inlineScan = /for\s+\w*npmrc\w*|grep[^\n]*_authToken|\.npmrc"?\s*\|\|/i;
  assert.ok(!inlineScan.test(CI),
    'ci.yml appears to scan npmrc files inline again — the script is the one implementation to keep honest');
});
