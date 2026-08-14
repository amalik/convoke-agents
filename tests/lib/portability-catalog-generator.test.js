'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { FIXTURE_ROOT, REPO_ROOT } = require('./portability-fixture');
const { readManifest } = require('../../scripts/portability/manifest-csv');

// Story sp-3-1: Decision-Tree Catalog Generator
//
// Tests the catalog generator by running it as a subprocess and validating
// the output structure, intent headings, tier badges, and content invariants.

// Backlog I123: was the LIVE repo. Now a committed fixture (test-fixture-isolation).
const projectRoot = FIXTURE_ROOT;
const CLI_PATH = path.join(REPO_ROOT, 'scripts', 'portability', 'catalog-generator.js');

function runCatalog(args = [], options = {}) {
  return spawnSync('node', [CLI_PATH, ...args], {
    cwd: options.cwd || projectRoot,
    encoding: 'utf8',
    env: process.env,
    timeout: 10000,
  });
}

// Load manifest data for assertions
const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
const { header, rows } = readManifest(manifestPath);
const nameIdx = header.indexOf('name');
const tierIdx = header.indexOf('tier');
const intentIdx = header.indexOf('intent');

// Dedupe + exclude meta-platform
const seen = new Set();
const uniqueSkills = [];
for (const row of rows) {
  const name = row[nameIdx];
  if (seen.has(name)) continue;
  seen.add(name);
  if (row[intentIdx] === 'meta-platform') continue;
  uniqueSkills.push({ name, tier: row[tierIdx], intent: row[intentIdx] });
}

const standaloneCount = uniqueSkills.filter((s) => s.tier === 'standalone').length;
const lightDepsCount = uniqueSkills.filter((s) => s.tier === 'light-deps').length;
const pipelineCount = uniqueSkills.filter((s) => s.tier === 'pipeline').length;
const mainBodyCount = standaloneCount + lightDepsCount;

const STANDALONE_INTENT_HEADINGS = [
  'I need to think through a problem',
  'I need to define what to build',
  'I need to review something',
  'I need to write documentation',
  'I need to plan my work',
  'I need to test my code',
];

const { FORBIDDEN_STRINGS } = require('../../scripts/portability/test-constants');


describe('Catalog Generator (sp-3-1)', () => {
  let tmpFile;

  afterEach(() => {
    if (tmpFile && fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
    tmpFile = null;
  });

  it('Test 1: stdout mode produces valid markdown with title and Carson', () => {
    const result = runCatalog();
    assert.equal(result.status, 0);
    assert.ok(result.stdout.includes('# Convoke Skills Catalog'));
    assert.ok(result.stdout.includes('Carson'));

    // At least 4 intent section headings
    let headingCount = 0;
    for (const heading of STANDALONE_INTENT_HEADINGS) {
      if (result.stdout.includes(`## ${heading}`)) headingCount++;
    }
    assert.ok(headingCount >= 4);
  });

  it('Test 2: --output mode writes file with title heading', () => {
    tmpFile = path.join(os.tmpdir(), `sp-3-1-${crypto.randomUUID()}.md`);
    const result = runCatalog(['--output', tmpFile]);
    assert.equal(result.status, 0);
    assert.equal(fs.existsSync(tmpFile), true);

    const content = fs.readFileSync(tmpFile, 'utf8');
    assert.ok(content.length > 0);
    assert.ok(content.includes('# Convoke Skills Catalog'));
  });

  it('Test 3: all 6 standalone intent categories present', () => {
    const result = runCatalog();
    assert.equal(result.status, 0);

    for (const heading of STANDALONE_INTENT_HEADINGS) {
      assert.ok(result.stdout.includes(`## ${heading}`));
    }
  });

  it('Test 4: tier badges present — Ready to use and Framework only', () => {
    const result = runCatalog();
    assert.equal(result.status, 0);

    assert.ok(result.stdout.includes('Ready to use'));
    assert.ok(result.stdout.includes('Framework only'));

    // Needs setup only if light-deps skills exist
    if (lightDepsCount > 0) {
      assert.ok(result.stdout.includes('Needs setup'));
    }
  });

  it('Test 5: skill count line matches manifest', () => {
    const result = runCatalog();
    assert.equal(result.status, 0);

    // Parse "**M skills in this catalog**"
    const countMatch = result.stdout.match(/\*\*(\d+) skills in this catalog\*\*/);
    assert.notStrictEqual(countMatch, null);
    const m = parseInt(countMatch[1], 10);
    assert.equal(m, mainBodyCount);

    // Parse "| P framework-only skills listed below"
    const pipelineMatch = result.stdout.match(/(\d+) framework-only skills listed below/);
    assert.notStrictEqual(pipelineMatch, null);
    const p = parseInt(pipelineMatch[1], 10);
    assert.equal(p, pipelineCount);
  });

  it('Test 6: no BMAD internals leak into catalog', () => {
    const result = runCatalog();
    assert.equal(result.status, 0);

    const violations = [];
    for (const forbidden of FORBIDDEN_STRINGS) {
      if (result.stdout.includes(forbidden)) {
        violations.push(forbidden);
      }
    }
    if (violations.length > 0) {
      console.error('BMAD internals found in catalog:', violations);
    }
    assert.deepEqual(violations, []);
  });
});
