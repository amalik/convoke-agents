const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const { refreshInstallation } = require('../../scripts/update/lib/refresh-installation');
const { PACKAGE_ROOT, createValidInstallation, silenceConsole, restoreConsole } = require('../helpers');

// Minimal pm.md with menu structure for menu patch tests
const MINIMAL_PM_MD = `<agent>
<menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="DA or fuzzy match on exit">[DA] Dismiss Agent</item>
</menu>
</agent>`;

// pm.md without </menu> but with <item> tags (fallback anchor test)
const PM_MD_NO_CLOSE_MENU = `<agent>
<menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="DA or fuzzy match on exit">[DA] Dismiss Agent</item>
`;

// pm.md with no menu structure at all
const PM_MD_NO_MENU = `<agent>
<persona>
    <role>Product Manager</role>
</persona>
</agent>`;

/**
 * Set up a valid installation with BMM pm.md for Enhance testing.
 * Returns tmpDir path.
 */
async function setupEnhanceTestDir() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-enh-inst-'));
  await createValidInstallation(tmpDir);

  // Create BMM pm.md (the Enhance menu patch target)
  const pmDir = path.join(tmpDir, '_bmad/bmm/agents');
  await fs.ensureDir(pmDir);
  await fs.writeFile(path.join(pmDir, 'pm.md'), MINIMAL_PM_MD, 'utf8');

  return tmpDir;
}

// === Enhance directory copy ===

describe('refreshInstallation — Enhance directory copy', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await setupEnhanceTestDir();
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('copies _enhance/ directory to target project', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const enhanceDir = path.join(tmpDir, '_bmad/bme/_enhance');
    assert.ok(fs.existsSync(enhanceDir), '_enhance/ should exist in target');
    assert.ok(fs.existsSync(path.join(enhanceDir, 'config.yaml')), 'config.yaml should exist');
    assert.ok(fs.existsSync(path.join(enhanceDir, 'workflows/initiatives-backlog/workflow.md')), 'workflow.md should exist');
    assert.ok(fs.existsSync(path.join(enhanceDir, 'workflows/initiatives-backlog/templates/rice-scoring-guide.md')), 'rice-scoring-guide.md should exist');
    assert.ok(fs.existsSync(path.join(enhanceDir, 'workflows/initiatives-backlog/templates/backlog-format-spec.md')), 'backlog-format-spec.md should exist');
  });

  it('skips copy in dev environment (source === destination)', async () => {
    // Run against the package root itself (dev environment)
    const changes = await refreshInstallation(PACKAGE_ROOT, { backupGuides: false, verbose: false });
    assert.ok(changes.some(c => c.includes('Skipped Enhance copy (dev environment')));
  });

  it('reports Enhance copy in changes array', async () => {
    const changes = await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    assert.ok(changes.some(c => c.includes('Refreshed Enhance module')));
  });
});

// === Enhance menu patch ===

describe('refreshInstallation — Enhance menu patch', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await setupEnhanceTestDir();
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('adds <item> tag before </menu> in pm.md', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const pmContent = fs.readFileSync(path.join(tmpDir, '_bmad/bmm/agents/pm.md'), 'utf8');
    assert.ok(pmContent.includes('initiatives-backlog'), 'pm.md should contain initiatives-backlog');
    assert.ok(pmContent.includes('📦 Initiatives Backlog (Convoke Enhance)'), 'pm.md should contain the label');

    // Tag should appear before </menu>
    const tagIdx = pmContent.indexOf('initiatives-backlog');
    const closeMenuIdx = pmContent.indexOf('</menu>');
    assert.ok(tagIdx < closeMenuIdx, '<item> tag should be before </menu>');
  });

  it('does not duplicate tag on second run (idempotency)', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    const pmAfterFirst = fs.readFileSync(path.join(tmpDir, '_bmad/bmm/agents/pm.md'), 'utf8');

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    const pmAfterSecond = fs.readFileSync(path.join(tmpDir, '_bmad/bmm/agents/pm.md'), 'utf8');

    assert.equal(pmAfterFirst, pmAfterSecond, 'pm.md should be identical after two runs');
    // The tag contains initiatives-backlog in both cmd and exec attrs — count the <item> tags instead
    const itemMatches = pmAfterSecond.match(/Convoke Enhance/g);
    assert.equal(itemMatches.length, 1, 'Should have exactly one Enhance menu item');
  });

  it('uses fallback anchor (after last <item>) when no </menu>', async () => {
    // Replace pm.md with version missing </menu>
    await fs.writeFile(path.join(tmpDir, '_bmad/bmm/agents/pm.md'), PM_MD_NO_CLOSE_MENU, 'utf8');

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const pmContent = fs.readFileSync(path.join(tmpDir, '_bmad/bmm/agents/pm.md'), 'utf8');
    assert.ok(pmContent.includes('initiatives-backlog'), 'Should have inserted via fallback anchor');
  });

  it('logs warning when pm.md not found', async () => {
    // Remove pm.md
    await fs.remove(path.join(tmpDir, '_bmad/bmm/agents/pm.md'));

    const changes = await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    assert.ok(changes.some(c => c.includes('not found') && c.includes('Skipping Enhance menu patch')));
  });

  it('logs warning when pm.md has no menu structure', async () => {
    await fs.writeFile(path.join(tmpDir, '_bmad/bmm/agents/pm.md'), PM_MD_NO_MENU, 'utf8');

    const changes = await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    assert.ok(changes.some(c => c.includes('menu structure not recognized')));
  });

  it('tag uses correct indentation (4 spaces)', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const pmContent = fs.readFileSync(path.join(tmpDir, '_bmad/bmm/agents/pm.md'), 'utf8');
    const lines = pmContent.split('\n');
    const enhanceLine = lines.find(l => l.includes('initiatives-backlog'));
    assert.ok(enhanceLine, 'Should find the enhance line');
    assert.ok(enhanceLine.startsWith('    <item'), `Line should start with 4-space indent, got: "${enhanceLine.substring(0, 10)}"`);
  });
});

// === Enhance config handling ===

describe('refreshInstallation — Enhance config edge cases', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await setupEnhanceTestDir();
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('reports idempotent result when run twice', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    const pmAfterFirst = fs.readFileSync(path.join(tmpDir, '_bmad/bmm/agents/pm.md'), 'utf8');

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    const pmAfterSecond = fs.readFileSync(path.join(tmpDir, '_bmad/bmm/agents/pm.md'), 'utf8');

    assert.equal(pmAfterFirst, pmAfterSecond, 'pm.md should be identical after two runs');
  });
});

// === Enhance skill wrapper generation ===

describe('refreshInstallation — Enhance skill wrapper', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await setupEnhanceTestDir();
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('creates SKILL.md with correct content for each workflow', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const skillPath = path.join(tmpDir, '.claude/skills/bmad-enhance-initiatives-backlog/SKILL.md');
    assert.ok(fs.existsSync(skillPath), 'SKILL.md should exist');

    const content = fs.readFileSync(skillPath, 'utf8');
    assert.ok(content.includes('name: bmad-enhance-initiatives-backlog'), 'should have correct name');
    assert.ok(content.includes('description:'), 'should have description');
    assert.ok(content.includes('IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND'), 'should use critical command pattern');
    assert.ok(content.includes('_bmad/bme/_enhance/'), 'should reference workflow entry point');
  });

  it('is idempotent (identical content after two runs)', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    const contentFirst = fs.readFileSync(
      path.join(tmpDir, '.claude/skills/bmad-enhance-initiatives-backlog/SKILL.md'), 'utf8'
    );

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    const contentSecond = fs.readFileSync(
      path.join(tmpDir, '.claude/skills/bmad-enhance-initiatives-backlog/SKILL.md'), 'utf8'
    );

    assert.equal(contentFirst, contentSecond, 'SKILL.md should be identical after two runs');
  });

  it('skips skill wrapper in dev environment (isSameRoot)', async () => {
    const changes = await refreshInstallation(PACKAGE_ROOT, { backupGuides: false, verbose: false });
    assert.ok(
      changes.some(c => c.includes('Skipped Enhance skill registration (dev environment')),
      'should report skipped skill registration in dev environment'
    );
  });

  it('reports skill generation in changes array', async () => {
    const changes = await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    assert.ok(
      changes.some(c => c.includes('Refreshed Enhance skill: bmad-enhance-initiatives-backlog')),
      'should report skill wrapper generation'
    );
  });
});

// === Enhance manifest entries ===

describe('refreshInstallation — Enhance manifest entries', () => {
  let tmpDir;

  const WF_MANIFEST_HEADER = 'name,description,module,path,canonicalId\n';
  const SK_MANIFEST_HEADER = 'canonicalId,name,description,module,path,install_to_bmad,tier,intent,dependencies\n';

  beforeEach(async () => {
    tmpDir = await setupEnhanceTestDir();
    // Create manifest CSV files with headers only
    const configDir = path.join(tmpDir, '_bmad/_config');
    await fs.ensureDir(configDir);
    await fs.writeFile(path.join(configDir, 'workflow-manifest.csv'), WF_MANIFEST_HEADER, 'utf8');
    await fs.writeFile(path.join(configDir, 'skill-manifest.csv'), SK_MANIFEST_HEADER, 'utf8');
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('appends entry to workflow-manifest.csv', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const csv = fs.readFileSync(path.join(tmpDir, '_bmad/_config/workflow-manifest.csv'), 'utf8');
    assert.ok(csv.includes('"bmad-enhance-initiatives-backlog"'), 'should contain canonicalId');
    assert.ok(csv.includes('"bme"'), 'should contain module bme');
  });

  it('appends entry to skill-manifest.csv', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const csv = fs.readFileSync(path.join(tmpDir, '_bmad/_config/skill-manifest.csv'), 'utf8');
    assert.ok(csv.includes('"bmad-enhance-initiatives-backlog"'), 'should contain canonicalId');
    assert.ok(csv.includes('"true"'), 'should contain install_to_bmad=true');
  });

  it('does not duplicate manifest entries on second run (idempotency)', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const wfCsv = fs.readFileSync(path.join(tmpDir, '_bmad/_config/workflow-manifest.csv'), 'utf8');
    const wfMatches = wfCsv.match(/"bmad-enhance-initiatives-backlog"/g);
    assert.equal(wfMatches.length, 1, 'workflow-manifest should have exactly one entry');

    const skCsv = fs.readFileSync(path.join(tmpDir, '_bmad/_config/skill-manifest.csv'), 'utf8');
    // canonicalId appears in both canonicalId and name columns, so expect 2 occurrences per row
    const skMatches = skCsv.match(/"bmad-enhance-initiatives-backlog"/g);
    assert.equal(skMatches.length, 2, 'skill-manifest should have exactly one row (canonicalId appears twice per row)');
  });

  it('skips manifest entries in dev environment', async () => {
    const changes = await refreshInstallation(PACKAGE_ROOT, { backupGuides: false, verbose: false });
    assert.ok(
      changes.some(c => c.includes('Skipped Enhance skill registration (dev environment')),
      'should skip manifest entries in dev environment'
    );
  });

  it('logs warning and continues when manifest CSVs are missing', async () => {
    // Remove the manifest files
    await fs.remove(path.join(tmpDir, '_bmad/_config/workflow-manifest.csv'));
    await fs.remove(path.join(tmpDir, '_bmad/_config/skill-manifest.csv'));

    // Should not throw — fail-soft behavior
    const changes = await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });
    // Skill wrapper should still be generated
    assert.ok(
      changes.some(c => c.includes('Refreshed Enhance skill: bmad-enhance-initiatives-backlog')),
      'should still generate skill wrapper when manifests are missing'
    );
  });
});

// === package.json files array ===

describe('package.json files array', () => {
  it('includes _bmad/bme/_enhance/ for npm publishing', async () => {
    const pkgPath = path.join(PACKAGE_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.ok(
      pkg.files.some(f => f.includes('_enhance')),
      `package.json files array should include _enhance/, got: ${pkg.files.join(', ')}`
    );
  });
});
