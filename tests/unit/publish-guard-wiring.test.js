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
test('publish is the only job in ci.yml that runs npm publish', () => {
  const publishers = Object.entries(WORKFLOW.jobs)
    .filter(([, job]) => (job.steps || []).some((s) => /(^|\s)npm publish(\s|$)/.test(s.run || '')))
    .map(([name]) => name);
  assert.deepEqual(publishers, ['publish'],
    `exactly one job may run npm publish; found: ${publishers.join(', ') || 'none'}`);
});

// `ci.yml` is the only workflow that may publish. npm's trusted publisher is bound to the
// workflow FILENAME (`docs/npm-publishing-access-playbook.md` §1), so a second file publishing is
// refused registry-side — but that is an external control the playbook itself records as having
// no read-back. Asserting it here turns an invisible dependency into a visible local one.
test('ci.yml is the only workflow file that runs npm publish', () => {
  const dir = path.join(__dirname, '..', '..', '.github', 'workflows');
  const offenders = fs.readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f))
    .filter((f) => /(^|\s)npm publish(\s|$)/m.test(fs.readFileSync(path.join(dir, f), 'utf8')))
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
