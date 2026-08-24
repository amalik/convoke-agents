'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { FIXTURE_ROOT, REPO_ROOT } = require('./portability-fixture');
const { removeTempDirSync } = require('../helpers');


// Story sp-4-1: Seed Catalog Repository
//
// Runs the seed script once in beforeAll and validates the staging directory
// across all 4 tests. Shared tmpdir cleaned up in afterAll.

// Backlog I123: was the LIVE repo. Now a committed fixture (test-fixture-isolation).
const projectRoot = FIXTURE_ROOT;
const CLI_PATH = path.join(REPO_ROOT, 'scripts', 'portability', 'seed-catalog-repo.js');

let tmpDir, cliResult, skillDirs;

before(() => {
  tmpDir = path.join(os.tmpdir(), `sp-4-1-${crypto.randomUUID()}`);
  cliResult = spawnSync('node', [CLI_PATH, '--output', tmpDir], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: process.env,
    timeout: 60000,
  });
  if (fs.existsSync(tmpDir)) {
    skillDirs = fs.readdirSync(tmpDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
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

describe('Seed Catalog Repository (sp-4-1)', () => {
  it('Test 1: seed script generates correct directory count and root README', () => {
    assert.equal(cliResult.status, 0);
    // Derive expected count from manifest instead of hardcoding
    const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
    const { readManifest } = require('../../scripts/portability/manifest-csv');
    const { header, rows } = readManifest(manifestPath);
    const ni = header.indexOf('name');
    const intentIdx = header.indexOf('intent');
    const expectedCount = [...new Set(rows.filter((r) => r[intentIdx] !== 'meta-platform').map((r) => r[ni]))].length;
    assert.equal(skillDirs.length, expectedCount);
    assert.equal(fs.existsSync(path.join(tmpDir, 'README.md')), true);
  });

  it('Test 2: every skill directory has both README.md and instructions.md', () => {
    // Guard: if the seed script failed and self-cleaned, skillDirs is empty — fail loudly
    assert.ok(skillDirs.length > 0);
    const missing = [];
    for (const dir of skillDirs) {
      const instrPath = path.join(tmpDir, dir, 'instructions.md');
      const readmePath = path.join(tmpDir, dir, 'README.md');
      if (!fs.existsSync(instrPath) || fs.readFileSync(instrPath, 'utf8').length === 0) {
        missing.push(`${dir}/instructions.md`);
      }
      if (!fs.existsSync(readmePath) || fs.readFileSync(readmePath, 'utf8').length === 0) {
        missing.push(`${dir}/README.md`);
      }
    }
    if (missing.length > 0) {
      console.error('Missing or empty files:', missing);
    }
    assert.deepEqual(missing, []);
  });

  it('Test 3: zero BMAD internals across entire staging tree', () => {
    assert.ok(skillDirs.length > 0);
    const INTERNALS = ['_bmad/', 'bmad-init', '.claude/hooks', '{project-root}'];
    const violations = [];

    function walkMdFiles(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkMdFiles(full);
        } else if (entry.name.endsWith('.md')) {
          const content = fs.readFileSync(full, 'utf8');
          const rel = path.relative(tmpDir, full);
          for (const internal of INTERNALS) {
            if (content.includes(internal)) {
              violations.push(`${rel}: contains "${internal}"`);
            }
          }
        }
      }
    }

    walkMdFiles(tmpDir);
    if (violations.length > 0) {
      console.error('BMAD internals found:', violations);
    }
    assert.deepEqual(violations, []);
  });

  it('Test 4: LICENSE and CONTRIBUTING.md present and valid', () => {
    const licensePath = path.join(tmpDir, 'LICENSE');
    assert.equal(fs.existsSync(licensePath), true);
    assert.ok(fs.readFileSync(licensePath, 'utf8').includes('MIT'));

    const contribPath = path.join(tmpDir, 'CONTRIBUTING.md');
    assert.equal(fs.existsSync(contribPath), true);
    assert.ok(fs.readFileSync(contribPath, 'utf8').includes('auto-generated'));
  });
});
