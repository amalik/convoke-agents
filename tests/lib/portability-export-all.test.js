const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { findProjectRoot } = require('../../scripts/update/lib/utils');
const { readManifest } = require('../../scripts/portability/manifest-csv');

// Story sp-2-4: Export All Tier 1 Skills
//
// Runs the full `--tier 1` batch once in beforeAll, then validates the
// output across all 5 tests. Uses a shared tmpdir cleaned up in afterAll.

const projectRoot = findProjectRoot();
const CLI_PATH = path.join(projectRoot, 'scripts', 'portability', 'convoke-export.js');

const { FORBIDDEN_STRINGS } = require('../../scripts/portability/test-constants');

let tmpDir, cliResult, skillDirs;

// Load manifest data once
const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
const { header: skillHeader, rows: skillRows } = readManifest(manifestPath);
const nameIdx = skillHeader.indexOf('name');
const tierIdx = skillHeader.indexOf('tier');
const descIdx = skillHeader.indexOf('description');
const uniqueStandalone = [
  ...new Set(skillRows.filter((r) => r[tierIdx] === 'standalone').map((r) => r[nameIdx])),
].sort();

// Load agent manifest for Test 5
const agentManifestPath = path.join(projectRoot, '_bmad', '_config', 'agent-manifest.csv');
const { header: agentHeader, rows: agentRows } = readManifest(agentManifestPath);
const displayNameIdx = agentHeader.indexOf('displayName');
const namedPersonas = new Set(agentRows.map((r) => r[displayNameIdx]).filter(Boolean));

beforeAll(() => {
  tmpDir = path.join(os.tmpdir(), `sp-2-4-${crypto.randomUUID()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  cliResult = spawnSync('node', [CLI_PATH, '--tier', '1', '--output', tmpDir], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: process.env,
    timeout: 30000,
  });
  skillDirs = fs.existsSync(tmpDir)
    ? fs.readdirSync(tmpDir).filter((d) => fs.statSync(path.join(tmpDir, d)).isDirectory())
    : [];
}, 30000);

afterAll(() => {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('Export All Tier 1 Skills (sp-2-4)', () => {
  test('Test 1: full batch exits 0, directory count equals unique standalone count', () => {
    expect(cliResult.status).toBe(0);
    expect(skillDirs.length).toBe(uniqueStandalone.length);
  });

  test('Test 2: zero forbidden strings across all exported instructions.md', () => {
    const violations = [];
    for (const dir of skillDirs) {
      const instrPath = path.join(tmpDir, dir, 'instructions.md');
      if (!fs.existsSync(instrPath)) {
        violations.push({ skill: dir, issue: 'instructions.md missing' });
        continue;
      }
      const content = fs.readFileSync(instrPath, 'utf8');
      for (const forbidden of FORBIDDEN_STRINGS) {
        if (content.includes(forbidden)) {
          violations.push({ skill: dir, issue: `contains "${forbidden}"` });
        }
      }
    }
    if (violations.length > 0) {
      console.error('Forbidden string violations:', violations);
    }
    expect(violations).toEqual([]);
  });

  test('Test 3: persona section "## You are" present in all exports', () => {
    const missing = [];
    for (const dir of skillDirs) {
      const instrPath = path.join(tmpDir, dir, 'instructions.md');
      if (!fs.existsSync(instrPath)) continue;
      const content = fs.readFileSync(instrPath, 'utf8');
      if (!content.includes('## You are')) {
        missing.push(dir);
      }
    }
    if (missing.length > 0) {
      console.error('Missing "## You are" heading:', missing);
    }
    expect(missing).toEqual([]);
  });

  test('Test 4: README stub validity — persona name, description, "How to use", no leftover placeholders', () => {
    // Build a skill-name → description map for the description check
    const descMap = {};
    for (const row of skillRows) {
      descMap[row[nameIdx]] = (row[descIdx] || '').slice(0, 40);
    }

    const issues = [];
    for (const dir of skillDirs) {
      const readmePath = path.join(tmpDir, dir, 'README.md');
      if (!fs.existsSync(readmePath)) {
        issues.push({ skill: dir, issue: 'README.md missing' });
        continue;
      }
      const content = fs.readFileSync(readmePath, 'utf8');
      if (!content.includes('How to use')) {
        issues.push({ skill: dir, issue: 'missing "How to use"' });
      }
      // Check persona name: the README must contain the persona line from the template
      // (either a named persona or a workflow-derived name)
      if (!content.includes('Persona:')) {
        issues.push({ skill: dir, issue: 'missing persona reference' });
      }
      // Check manifest description (first 40 chars)
      const descSnippet = descMap[dir];
      if (descSnippet && descSnippet.length > 10 && !content.includes(descSnippet)) {
        issues.push({ skill: dir, issue: `missing description snippet: "${descSnippet}..."` });
      }
      // Check for leftover multi-word placeholders (strip HTML comments first)
      const stripped = content.replace(/<!--[\s\S]*?-->/g, '');
      const leftover = stripped.match(/<[a-z][a-z\s-]{2,}[a-z]>/gi);
      if (leftover) {
        issues.push({ skill: dir, issue: `leftover placeholders: ${leftover.join(', ')}` });
      }
    }
    if (issues.length > 0) {
      console.error('README issues:', issues);
    }
    expect(issues).toEqual([]);
  });

  test('Test 5: at least 12 named-persona skills exported', () => {
    let namedCount = 0;
    for (const dir of skillDirs) {
      const instrPath = path.join(tmpDir, dir, 'instructions.md');
      if (!fs.existsSync(instrPath)) continue;
      const content = fs.readFileSync(instrPath, 'utf8');
      const youAreMatch = content.match(/^## You are (.+)$/m);
      if (!youAreMatch) continue;
      const personaLine = youAreMatch[1];
      // Check if any known agent displayName appears in the persona line
      for (const displayName of namedPersonas) {
        if (personaLine.includes(displayName)) {
          namedCount++;
          break;
        }
      }
    }
    expect(namedCount).toBeGreaterThanOrEqual(12);
  });
});
