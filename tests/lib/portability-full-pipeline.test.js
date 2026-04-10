const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { findProjectRoot } = require('../../scripts/update/lib/utils');
const { readManifest } = require('../../scripts/portability/manifest-csv');

// Story sp-5-3: Full Pipeline — Export Tier 2 + Adapters + Catalog
//
// Runs the seed script once and validates the complete staging directory
// including Tier 2 skills, adapters, and catalog.

const projectRoot = findProjectRoot();
const SEED_PATH = path.join(projectRoot, 'scripts', 'portability', 'seed-catalog-repo.js');
const VALIDATOR_PATH = path.join(projectRoot, 'scripts', 'portability', 'validate-exports.js');

// Derive expected count from manifest
const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
const { header, rows } = readManifest(manifestPath);
const nameIdx = header.indexOf('name');
const tierIdx = header.indexOf('tier');
const expectedCount = [
  ...new Set(
    rows
      .filter((r) => r[tierIdx] === 'standalone' || r[tierIdx] === 'light-deps')
      .map((r) => r[nameIdx])
  ),
].length;

let tmpDir, seedResult, skillDirs;

beforeAll(() => {
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

afterAll(() => {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('Full Pipeline (sp-5-3)', () => {
  test('Test 1: seed produces correct skill dir count with adapters', () => {
    expect(seedResult.status).toBe(0);
    expect(skillDirs.length).toBe(expectedCount);

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
    expect(missing).toEqual([]);
  });

  test('Test 2: validator passes on seed output', () => {
    const valResult = spawnSync('node', [VALIDATOR_PATH, '--input', tmpDir], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: process.env,
      timeout: 30000,
    });
    expect(valResult.status).toBe(0);
  });

  test('Test 3: Tier 2 skills have template sections', () => {
    const prdPath = path.join(tmpDir, 'bmad-create-prd', 'instructions.md');
    expect(fs.existsSync(prdPath)).toBe(true);
    const content = fs.readFileSync(prdPath, 'utf8');
    expect(content).toContain('## Template:');
  });

  test('Test 4: catalog includes both tier badges', () => {
    const catalogPath = path.join(tmpDir, 'README.md');
    expect(fs.existsSync(catalogPath)).toBe(true);
    const content = fs.readFileSync(catalogPath, 'utf8');
    expect(content).toContain('Ready to use');
    expect(content).toContain('Needs setup');
  });
});
