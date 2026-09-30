'use strict';

/**
 * The Team Factory does not ship, and no code depends on its registry roster.
 *
 * WHY THIS EXISTS (story `tfu-1-1`). Operator ruling 2026-09-16: the Team Factory is internal
 * scaffolding, not a user-facing capability. It stays tracked in git — `agent-surface-parity` exits 2 on
 * a removed agent and carries no waiver — so every path to it still RESOLVES in a clone. That is the
 * whole difficulty: nothing about a developer's checkout can tell you the module stopped shipping.
 *
 * This file replaces `tests/unit/team-factory-wiring.test.js`, which asserted the opposite
 * (`EXTRA_BME_AGENTS.length >= 1`, and a `team-factory` entry inside it). The guard is inverted rather
 * than deleted, because "the roster is gone" is exactly as worth pinning as "the roster is wired" was.
 *
 * WHAT THIS TEST CANNOT DETECT. It reads `package.json` and the source tree, not a tarball. A `files[]`
 * entry is a declaration; only `scripts/audit/try-fresh-install.sh` packs and installs a real package,
 * and it is the gate that would catch a genuine packaging regression. It also cannot tell you that an
 * already-installed project stopped carrying the module — that is the orphan problem, filed as `T222`
 * and deliberately out of this story's scope.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SYMBOLS = ['EXTRA_BME_AGENTS', 'EXTRA_BME_AGENT_IDS'];

/** Every `.js` file under a directory, excluding dependency trees. */
function jsFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'coverage') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) jsFiles(full, acc);
    else if (entry.name.endsWith('.js')) acc.push(full);
  }
  return acc;
}

test('package.json files[] does not carry the Team Factory', () => {
  const { files } = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
  const offenders = files.filter((f) => f.includes('_team-factory'));
  assert.deepStrictEqual(offenders, [], `files[] still declares: ${offenders.join(', ')}`);
});

test('the agent registry exports no EXTRA_BME roster', () => {
  const registry = require(path.join(REPO_ROOT, 'scripts', 'update', 'lib', 'agent-registry.js'));
  for (const symbol of SYMBOLS) {
    assert.ok(!(symbol in registry), `${symbol} is still exported from agent-registry.js`);
  }
});

test('no production code references the EXTRA_BME roster', () => {
  // `scripts/` AND `index.js` — the latter is production and in `files[]`, and an earlier version of this
  // sweep missed it (consumer audit, 2026-09-30). Tests may legitimately name the symbol — this very file does — and a historical
  // comment is not a dependency. Offenders are LISTED, not counted: a bare count says something broke
  // without saying what, which is the failure `verification-must-be-falsifiable` is about.
  const offenders = [];
  const production = [...jsFiles(path.join(REPO_ROOT, 'scripts')), path.join(REPO_ROOT, 'index.js')];
  for (const file of production) {
    for (const [i, line] of fs.readFileSync(file, 'utf8').split('\n').entries()) {
      if (!SYMBOLS.some((s) => line.includes(s))) continue;
      // A comment recording why the roster was removed is the intended end state, not a leak.
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue;
      offenders.push(`${path.relative(REPO_ROOT, file)}:${i + 1}`);
    }
  }
  assert.deepStrictEqual(offenders, [], `production code still references the roster:\n  ${offenders.join('\n  ')}`);
});

test('the skill manifest no longer advertises the Team Factory agent', () => {
  const csv = fs.readFileSync(path.join(REPO_ROOT, '_bmad', '_config', 'skill-manifest.csv'), 'utf8');
  const rows = csv.split('\n').filter((l) => l.includes('team-factory'));
  assert.deepStrictEqual(rows, [], `skill-manifest.csv still carries ${rows.length} team-factory row(s)`);
});
