const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { findProjectRoot } = require('../../scripts/update/lib/utils');

// Story sp-5-2: Platform Adapter Generation
//
// Tests that exported skills include per-platform adapter files
// (Claude Code SKILL.md, Copilot copilot-instructions.md, Cursor <name>.md).

const projectRoot = findProjectRoot();
const CLI_PATH = path.join(projectRoot, 'scripts', 'portability', 'convoke-export.js');

function makeTmpDir() {
  const dir = path.join(os.tmpdir(), `sp-5-2-${crypto.randomUUID()}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

describe('Platform Adapter Generation (sp-5-2)', () => {
  // Single-skill tests
  let singleTmpDir;

  afterEach(() => {
    if (singleTmpDir && fs.existsSync(singleTmpDir)) {
      fs.rmSync(singleTmpDir, { recursive: true, force: true });
    }
    singleTmpDir = null;
  });

  function exportCarson() {
    if (!singleTmpDir) singleTmpDir = makeTmpDir();
    const result = spawnSync('node', [CLI_PATH, 'bmad-brainstorming', '--output', singleTmpDir], {
      cwd: projectRoot, encoding: 'utf8', env: process.env,
    });
    expect(result.status).toBe(0);
    return path.join(singleTmpDir, 'bmad-brainstorming');
  }

  test('Test 1: Claude Code adapter has YAML frontmatter', () => {
    const skillDir = exportCarson();
    const adapterPath = path.join(skillDir, 'adapters', 'claude-code', 'SKILL.md');
    expect(fs.existsSync(adapterPath)).toBe(true);
    const content = fs.readFileSync(adapterPath, 'utf8');
    expect(content.startsWith('---\n')).toBe(true);
    expect(content).toContain('name: bmad-brainstorming');
    expect(content).toContain('description:');
  });

  test('Test 2: Copilot adapter has HTML comment header', () => {
    const skillDir = exportCarson();
    const adapterPath = path.join(skillDir, 'adapters', 'copilot', 'copilot-instructions.md');
    expect(fs.existsSync(adapterPath)).toBe(true);
    const content = fs.readFileSync(adapterPath, 'utf8');
    const firstLine = content.split('\n')[0];
    expect(firstLine).toMatch(/^<!--.*Brainstorming.*-->$/);
  });

  test('Test 3: Cursor adapter is plain content matching instructions.md', () => {
    const skillDir = exportCarson();
    const cursorPath = path.join(skillDir, 'adapters', 'cursor', 'bmad-brainstorming.md');
    expect(fs.existsSync(cursorPath)).toBe(true);
    const cursorContent = fs.readFileSync(cursorPath, 'utf8');
    const instructionsContent = fs.readFileSync(path.join(skillDir, 'instructions.md'), 'utf8');
    expect(cursorContent).toBe(instructionsContent);
  });

  test('Test 4: all adapters under 20 lines of wrapper', () => {
    const skillDir = exportCarson();
    const instructionsLines = fs.readFileSync(path.join(skillDir, 'instructions.md'), 'utf8').split('\n').length;

    // Claude Code: frontmatter adds ~5 lines
    const claudeLines = fs.readFileSync(path.join(skillDir, 'adapters', 'claude-code', 'SKILL.md'), 'utf8').split('\n').length;
    expect(claudeLines - instructionsLines).toBeLessThanOrEqual(20);

    // Copilot: header comment adds 1 line
    const copilotLines = fs.readFileSync(path.join(skillDir, 'adapters', 'copilot', 'copilot-instructions.md'), 'utf8').split('\n').length;
    expect(copilotLines - instructionsLines).toBeLessThanOrEqual(20);

    // Cursor: 0 lines of wrapper
    const cursorLines = fs.readFileSync(path.join(skillDir, 'adapters', 'cursor', 'bmad-brainstorming.md'), 'utf8').split('\n').length;
    expect(cursorLines - instructionsLines).toBeLessThanOrEqual(20);
  });

  // Batch test
  describe('Batch adapter validation', () => {
    let batchTmpDir, batchResult;

    beforeAll(() => {
      batchTmpDir = makeTmpDir();
      batchResult = spawnSync('node', [CLI_PATH, '--tier', '1', '--output', batchTmpDir], {
        cwd: projectRoot, encoding: 'utf8', env: process.env, timeout: 30000,
      });
    }, 30000);

    afterAll(() => {
      if (batchTmpDir && fs.existsSync(batchTmpDir)) {
        fs.rmSync(batchTmpDir, { recursive: true, force: true });
      }
    });

    test('Test 5: all exported skills have all 3 adapters', () => {
      expect([0, 4]).toContain(batchResult.status);

      const skillDirs = fs.readdirSync(batchTmpDir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
        .map((e) => e.name);
      expect(skillDirs.length).toBeGreaterThan(0);

      const missing = [];
      for (const dir of skillDirs) {
        const base = path.join(batchTmpDir, dir, 'adapters');
        if (!fs.existsSync(path.join(base, 'claude-code', 'SKILL.md'))) {
          missing.push(`${dir}: missing claude-code/SKILL.md`);
        }
        if (!fs.existsSync(path.join(base, 'copilot', 'copilot-instructions.md'))) {
          missing.push(`${dir}: missing copilot/copilot-instructions.md`);
        }
        if (!fs.existsSync(path.join(base, 'cursor', `${dir}.md`))) {
          missing.push(`${dir}: missing cursor/${dir}.md`);
        }
      }
      if (missing.length > 0) {
        console.error('Missing adapters:', missing);
      }
      expect(missing).toEqual([]);
    });
  });
});
