const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { findProjectRoot } = require('../../scripts/update/lib/utils');

// Story sp-4-1: Seed Catalog Repository
//
// Runs the seed script once in beforeAll and validates the staging directory
// across all 4 tests. Shared tmpdir cleaned up in afterAll.

const projectRoot = findProjectRoot();
const CLI_PATH = path.join(projectRoot, 'scripts', 'portability', 'seed-catalog-repo.js');

let tmpDir, cliResult, skillDirs;

beforeAll(() => {
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

afterAll(() => {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('Seed Catalog Repository (sp-4-1)', () => {
  test('Test 1: seed script generates correct directory count and root README', () => {
    expect(cliResult.status).toBe(0);
    // Derive expected count from manifest instead of hardcoding
    const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
    const { readManifest } = require('../../scripts/portability/manifest-csv');
    const { header, rows } = readManifest(manifestPath);
    const ni = header.indexOf('name');
    const ti = header.indexOf('tier');
    const expectedCount = [...new Set(rows.filter((r) => r[ti] === 'standalone' || r[ti] === 'light-deps').map((r) => r[ni]))].length;
    expect(skillDirs.length).toBe(expectedCount);
    expect(fs.existsSync(path.join(tmpDir, 'README.md'))).toBe(true);
  });

  test('Test 2: every skill directory has both README.md and instructions.md', () => {
    // Guard: if the seed script failed and self-cleaned, skillDirs is empty — fail loudly
    expect(skillDirs.length).toBeGreaterThan(0);
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
    expect(missing).toEqual([]);
  });

  test('Test 3: zero BMAD internals across entire staging tree', () => {
    expect(skillDirs.length).toBeGreaterThan(0);
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
    expect(violations).toEqual([]);
  });

  test('Test 4: LICENSE and CONTRIBUTING.md present and valid', () => {
    const licensePath = path.join(tmpDir, 'LICENSE');
    expect(fs.existsSync(licensePath)).toBe(true);
    expect(fs.readFileSync(licensePath, 'utf8')).toContain('MIT');

    const contribPath = path.join(tmpDir, 'CONTRIBUTING.md');
    expect(fs.existsSync(contribPath)).toBe(true);
    expect(fs.readFileSync(contribPath, 'utf8')).toContain('auto-generated');
  });
});
