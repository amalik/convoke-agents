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

function publishJobBlock() {
  // The publish job runs from `  publish:` to the next top-level (2-space) job key.
  const start = CI.indexOf('\n  publish:\n');
  assert.ok(start !== -1, 'publish job not found in ci.yml');
  const rest = CI.slice(start + 1);
  const next = rest.search(/\n {2}[a-z0-9-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
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
  const next = rest.search(/\n {2}[a-z0-9-]+:\n/);
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
