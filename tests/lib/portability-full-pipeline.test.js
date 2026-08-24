'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { FIXTURE_ROOT, REPO_ROOT } = require('./portability-fixture');
const { readManifest } = require('../../scripts/portability/manifest-csv');
const { removeTempDirSync } = require('../helpers');


// Story sp-5-3: Full Pipeline — Export Tier 2 + Adapters + Catalog
//
// Runs the seed script once and validates the complete staging directory
// including Tier 2 skills, adapters, and catalog.

// Backlog I123: was the LIVE repo. Now a committed fixture (test-fixture-isolation).
const projectRoot = FIXTURE_ROOT;
const SEED_PATH = path.join(REPO_ROOT, 'scripts', 'portability', 'seed-catalog-repo.js');
const VALIDATOR_PATH = path.join(REPO_ROOT, 'scripts', 'portability', 'validate-exports.js');

// Derive expected count from manifest
const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
const { header, rows } = readManifest(manifestPath);
const nameIdx = header.indexOf('name');
const intentIdx = header.indexOf('intent');
const expectedCount = [
  ...new Set(
    rows
      .filter((r) => r[intentIdx] !== 'meta-platform')
      .map((r) => r[nameIdx])
  ),
].length;

let tmpDir, seedResult, skillDirs;

before(() => {
  tmpDir = path.join(os.tmpdir(), `sp-5-3-${crypto.randomUUID()}`);
  seedResult = spawnSync('node', [SEED_PATH, '--output', tmpDir], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: process.env,
    timeout: 60000,
  });
  if (fs.existsSync(tmpDir)) {
    skillDirs = fs.readdirSync(tmpDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name);
  } else {
    skillDirs = [];
  }
}, 60000);

after(() => {
  if (tmpDir && fs.existsSync(tmpDir)) {
    removeTempDirSync(tmpDir);
  }
});

describe('Full Pipeline (sp-5-3)', () => {
  it('Test 1: seed produces correct skill dir count with adapters', () => {
    assert.equal(seedResult.status, 0);
    assert.equal(skillDirs.length, expectedCount);

    // Every skill dir has adapters
    const missing = [];
    for (const dir of skillDirs) {
      const base = path.join(tmpDir, dir, 'adapters');
      if (!fs.existsSync(path.join(base, 'claude-code', 'SKILL.md'))) {
        missing.push(`${dir}: claude-code/SKILL.md`);
      }
      if (!fs.existsSync(path.join(base, 'copilot', 'copilot-instructions.md'))) {
        missing.push(`${dir}: copilot/copilot-instructions.md`);
      }
      if (!fs.existsSync(path.join(base, 'cursor', `${dir}.md`))) {
        missing.push(`${dir}: cursor/${dir}.md`);
      }
    }
    if (missing.length > 0) console.error('Missing adapters:', missing);
    assert.deepEqual(missing, []);
  });

  it('Test 2: validator passes on seed output', () => {
    const valResult = spawnSync('node', [VALIDATOR_PATH, '--input', tmpDir], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: process.env,
      timeout: 30000,
    });
    assert.equal(valResult.status, 0);
  });

  it('Test 3: Tier 2 skills have template sections', () => {
    const prdPath = path.join(tmpDir, 'bmad-create-prd', 'instructions.md');
    assert.equal(fs.existsSync(prdPath), true);
    const content = fs.readFileSync(prdPath, 'utf8');
    assert.ok(content.includes('## Template:'));
  });

  it('Test 4: catalog includes both tier badges', () => {
    const catalogPath = path.join(tmpDir, 'README.md');
    assert.equal(fs.existsSync(catalogPath), true);
    const content = fs.readFileSync(catalogPath, 'utf8');
    assert.ok(content.includes('Ready to use'));
    assert.ok(content.includes('Needs setup'));
  });
});
