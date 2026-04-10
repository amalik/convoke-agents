const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { findProjectRoot } = require('../../scripts/update/lib/utils');
const { readManifest } = require('../../scripts/portability/manifest-csv');

// Story sp-3-1: Decision-Tree Catalog Generator
//
// Tests the catalog generator by running it as a subprocess and validating
// the output structure, intent headings, tier badges, and content invariants.

const projectRoot = findProjectRoot();
const CLI_PATH = path.join(projectRoot, 'scripts', 'portability', 'catalog-generator.js');

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

  test('Test 1: stdout mode produces valid markdown with title and Carson', () => {
    const result = runCatalog();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('# Convoke Skills Catalog');
    expect(result.stdout).toContain('Carson');

    // At least 4 intent section headings
    let headingCount = 0;
    for (const heading of STANDALONE_INTENT_HEADINGS) {
      if (result.stdout.includes(`## ${heading}`)) headingCount++;
    }
    expect(headingCount).toBeGreaterThanOrEqual(4);
  });

  test('Test 2: --output mode writes file with title heading', () => {
    tmpFile = path.join(os.tmpdir(), `sp-3-1-${crypto.randomUUID()}.md`);
    const result = runCatalog(['--output', tmpFile]);
    expect(result.status).toBe(0);
    expect(fs.existsSync(tmpFile)).toBe(true);

    const content = fs.readFileSync(tmpFile, 'utf8');
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('# Convoke Skills Catalog');
  });

  test('Test 3: all 6 standalone intent categories present', () => {
    const result = runCatalog();
    expect(result.status).toBe(0);

    for (const heading of STANDALONE_INTENT_HEADINGS) {
      expect(result.stdout).toContain(`## ${heading}`);
    }
  });

  test('Test 4: tier badges present — Ready to use and Framework only', () => {
    const result = runCatalog();
    expect(result.status).toBe(0);

    expect(result.stdout).toContain('Ready to use');
    expect(result.stdout).toContain('Framework only');

    // Needs setup only if light-deps skills exist
    if (lightDepsCount > 0) {
      expect(result.stdout).toContain('Needs setup');
    }
  });

  test('Test 5: skill count line matches manifest', () => {
    const result = runCatalog();
    expect(result.status).toBe(0);

    // Parse "**M skills in this catalog**"
    const countMatch = result.stdout.match(/\*\*(\d+) skills in this catalog\*\*/);
    expect(countMatch).not.toBeNull();
    const m = parseInt(countMatch[1], 10);
    expect(m).toBe(mainBodyCount);

    // Parse "| P framework-only skills listed below"
    const pipelineMatch = result.stdout.match(/(\d+) framework-only skills listed below/);
    expect(pipelineMatch).not.toBeNull();
    const p = parseInt(pipelineMatch[1], 10);
    expect(p).toBe(pipelineCount);
  });

  test('Test 6: no BMAD internals leak into catalog', () => {
    const result = runCatalog();
    expect(result.status).toBe(0);

    const violations = [];
    for (const forbidden of FORBIDDEN_STRINGS) {
      if (result.stdout.includes(forbidden)) {
        violations.push(forbidden);
      }
    }
    if (violations.length > 0) {
      console.error('BMAD internals found in catalog:', violations);
    }
    expect(violations).toEqual([]);
  });
});
