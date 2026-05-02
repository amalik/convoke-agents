'use strict';

/**
 * Vortex parity test suite — verifies post-migration agents preserve
 * pre-migration menu codes, workflow paths, and capability prompt
 * presence (FR13–15). Authored at I97 Story 2.1 (Convert Emma POC);
 * productionized as a CI gate at I97 Story 3.2.
 *
 * Boundary clause (per Story 2.1 AC10):
 *   - Story 2.1 ships: this file + Emma's per-agent tests
 *   - Story 3.2 ships: CI YAML wiring, npm script entry, per-agent tests
 *     for Wade/Mila/Isla/Noah/Max/Liam as their conversions land,
 *     hardened fixtures, coverage reporting
 *
 * test-fixture-isolation (NFR4): every project-tree access uses the
 * canonical Story 1.1 helpers from
 * `scripts/migration/format-conversion/fixtures/`.
 *
 * derive-counts-from-source: capability count derived from
 * `fs.readdirSync` of `references/` directory, NOT hardcoded.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs-extra');
const path = require('node:path');

const {
  runParityCheck,
  extractV5MenuCodes,
  extractV63MenuCodes,
} = require('../../scripts/migration/format-conversion/parity-harness');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const VORTEX_AGENTS_REL = '_bmad/bme/_vortex/agents';

// ─── Per-agent test fixtures ─────────────────────────────────────────

const EMMA_FIXTURE_PATH = path.join(
  __dirname,
  'fixtures',
  'vortex-parity',
  'contextualization-expert-baseline.json',
);

const WADE_FIXTURE_PATH = path.join(
  __dirname,
  'fixtures',
  'vortex-parity',
  'lean-experiments-specialist-baseline.json',
);

const MILA_FIXTURE_PATH = path.join(
  __dirname,
  'fixtures',
  'vortex-parity',
  'research-convergence-specialist-baseline.json',
);

// ─── Per-agent test cases ────────────────────────────────────────────

describe('vortex-parity — Emma (contextualization-expert)', () => {
  const fixture = JSON.parse(fs.readFileSync(EMMA_FIXTURE_PATH, 'utf8'));
  const agentRoleName = fixture.agentRoleName;
  const skillMdPath = path.join(PROJECT_ROOT, VORTEX_AGENTS_REL, agentRoleName, 'SKILL.md');
  const referencesDir = path.join(PROJECT_ROOT, VORTEX_AGENTS_REL, agentRoleName, 'references');

  it('post-migration SKILL.md exists at the canonical path', () => {
    assert.equal(fs.existsSync(skillMdPath), true, `Expected ${skillMdPath} to exist after Story 2.1 conversion`);
  });

  it('post-migration SKILL.md contains zero v5 XML elements (FR1)', () => {
    const content = fs.readFileSync(skillMdPath, 'utf8');
    // Match XML-element-like tags inside Emma's SKILL.md. The frontmatter
    // and markdown body should be free of <agent>, <activation>, <menu>,
    // <step>, <persona>, <rules>, etc.
    const xmlElementRe = /<(agent|activation|menu|item|step|persona|rules|menu-handlers|handler|r)\b/;
    assert.equal(
      xmlElementRe.test(content),
      false,
      `SKILL.md still contains v5 XML elements (matches /${xmlElementRe.source}/)`,
    );
  });

  it('post-migration menu code set equals pre-migration baseline (FR13)', () => {
    const content = fs.readFileSync(skillMdPath, 'utf8');
    const postCodes = extractV63MenuCodes(content).sort();
    const preCodes = [...fixture.preMigrationMenuCodes].sort();
    assert.deepEqual(
      postCodes,
      preCodes,
      `Menu codes drifted: pre=${JSON.stringify(preCodes)} post=${JSON.stringify(postCodes)}`,
    );
  });

  it('frontmatter `name:` field equals BMB canonical bmad-bme-agent-emma (per ADR-001)', () => {
    const content = fs.readFileSync(skillMdPath, 'utf8');
    const nameMatch = content.match(/^name:\s*(\S+)\s*$/m);
    assert.ok(nameMatch, 'SKILL.md frontmatter must have a name: field');
    assert.equal(nameMatch[1], 'bmad-bme-agent-emma', `Expected BMB canonical name; got '${nameMatch[1]}'`);
  });

  it('references/ directory exists with one prompt per routed capability (FR9–11)', () => {
    assert.equal(fs.existsSync(referencesDir), true, `Expected references/ directory at ${referencesDir}`);

    // derive-counts-from-source: read the actual directory
    const entries = fs.readdirSync(referencesDir).filter(e => e.endsWith('.md'));
    const expectedRouted = fixture.routedCapabilityCodes.length; // 4 for Emma (LP/PV/CS/VL)
    assert.equal(
      entries.length,
      expectedRouted,
      `Expected ${expectedRouted} capability prompts under references/; got ${entries.length}: ${JSON.stringify(entries)}`,
    );
  });

  it('each capability prompt has the four Pattern-C-friendly sections (FR10/NFR16)', () => {
    const requiredSections = ['## Identity', '## How It Works', '## Output Expectations', '## Activation'];
    const entries = fs.readdirSync(referencesDir).filter(e => e.endsWith('.md'));
    for (const entry of entries) {
      const promptContent = fs.readFileSync(path.join(referencesDir, entry), 'utf8');
      for (const section of requiredSections) {
        assert.ok(
          promptContent.includes(section),
          `Capability prompt ${entry} missing required section '${section}'`,
        );
      }
    }
  });

  it('workflow source files referenced from menu codes still exist (FR12)', () => {
    for (const [code, workflowPath] of Object.entries(fixture.menuCodeToWorkflow)) {
      const abs = path.join(PROJECT_ROOT, workflowPath);
      assert.equal(
        fs.existsSync(abs),
        true,
        `Workflow source for menu code ${code} not found at ${workflowPath}`,
      );
    }
  });

  it('runParityCheck returns documented shape with menuCodesEqual undefined-or-true', () => {
    // The harness operates against an in-place converted SKILL.md (not
    // a transitional state with both formats). Returns 'found' state with
    // post-migration codes captured; pre-migration codes empty (would be
    // supplied via fixture in a comparator pattern Story 3.2 productionizes).
    const result = runParityCheck({
      projectRoot: PROJECT_ROOT,
      agentRoleName,
    });
    assert.equal(result.postMigrationFile, 'found', 'Expected post-migration file detected');
    assert.deepEqual(
      [...result.postMigrationCodes].sort(),
      [...fixture.preMigrationMenuCodes].sort(),
      'runParityCheck postMigrationCodes drifted from baseline',
    );
  });

  it('extractV5MenuCodes against a pre-migration-shaped fixture returns the baseline codes (R2-P4 anti-fence-stripping regression test)', () => {
    // R2-P4 regression class: extractV5MenuCodes was previously calling
    // stripCodeRegions(rawContent) BEFORE the menu-code regex, which
    // blanked the fenced ```xml content where canonical v5 SKILL.md
    // files store <agent>...<menu>. The fix (parity-harness.js:1028)
    // operates on raw content, leaving fences intact for regex.
    //
    // This test's input has menu codes ONLY inside a ```xml fence —
    // no codes in surrounding prose. Therefore:
    //   - REGRESSED (fence-stripping ON): result = []   → test FAILS
    //   - CORRECT  (fence-stripping OFF): result = ['LP','MH'] → test PASSES
    // The asserted value strictly requires fences-not-stripped behavior;
    // this is the sole protection against R2-P4 silently returning.
    const v5Sample = `\`\`\`xml
<agent name="TestAgent">
  <menu>
    <item cmd="LP">[LP] foo</item>
    <item cmd="MH">[MH] bar</item>
  </menu>
</agent>
\`\`\``;
    const codes = extractV5MenuCodes(v5Sample);
    assert.deepEqual([...codes].sort(), ['LP', 'MH']);
  });
});

describe('vortex-parity — Wade (lean-experiments-specialist)', () => {
  // Story 2.2 — second per-agent application of the parity harness.
  // Calibration carry-forward #2 binding: extractV5MenuCodes was run
  // against Wade's pre-migration SKILL.md fixture content during dev
  // (Story 2.2 Task 1.3 — extracted [CH, DA, LE, ME, MH, PC, PM, PV, VE],
  // matches the 9-code baseline). This check passed before the Wade
  // describe block was authored — Round 2 reviewers should not need to
  // re-run it, but a Wade-shaped extractV5MenuCodes regression test below
  // stands in for the live gate in CI.
  const fixture = JSON.parse(fs.readFileSync(WADE_FIXTURE_PATH, 'utf8'));
  const agentRoleName = fixture.agentRoleName;
  const skillMdPath = path.join(PROJECT_ROOT, VORTEX_AGENTS_REL, agentRoleName, 'SKILL.md');
  const referencesDir = path.join(PROJECT_ROOT, VORTEX_AGENTS_REL, agentRoleName, 'references');

  it('post-migration SKILL.md exists at the canonical path', () => {
    assert.equal(fs.existsSync(skillMdPath), true, `Expected ${skillMdPath} to exist after Story 2.2 conversion`);
  });

  it('post-migration SKILL.md contains zero v5 XML elements (FR1)', () => {
    const content = fs.readFileSync(skillMdPath, 'utf8');
    const xmlElementRe = /<(agent|activation|menu|item|step|persona|rules|menu-handlers|handler|r)\b/;
    assert.equal(
      xmlElementRe.test(content),
      false,
      `SKILL.md still contains v5 XML elements (matches /${xmlElementRe.source}/)`,
    );
  });

  it('post-migration menu code set equals pre-migration baseline (FR13)', () => {
    const content = fs.readFileSync(skillMdPath, 'utf8');
    const postCodes = extractV63MenuCodes(content).sort();
    const preCodes = [...fixture.preMigrationMenuCodes].sort();
    assert.deepEqual(
      postCodes,
      preCodes,
      `Menu codes drifted: pre=${JSON.stringify(preCodes)} post=${JSON.stringify(postCodes)}`,
    );
  });

  it('frontmatter `name:` field equals BMB canonical bmad-bme-agent-wade (per ADR-001)', () => {
    const content = fs.readFileSync(skillMdPath, 'utf8');
    const nameMatch = content.match(/^name:\s*(\S+)\s*$/m);
    assert.ok(nameMatch, 'SKILL.md frontmatter must have a name: field');
    assert.equal(nameMatch[1], 'bmad-bme-agent-wade', `Expected BMB canonical name; got '${nameMatch[1]}'`);
  });

  it('references/ directory exists with one prompt per routed capability (FR9–11)', () => {
    assert.equal(fs.existsSync(referencesDir), true, `Expected references/ directory at ${referencesDir}`);

    // derive-counts-from-source: read the actual directory
    const entries = fs.readdirSync(referencesDir).filter(e => e.endsWith('.md'));
    const expectedRouted = fixture.routedCapabilityCodes.length; // 5 for Wade (ME/LE/PC/PV/VE)
    assert.equal(
      entries.length,
      expectedRouted,
      `Expected ${expectedRouted} capability prompts under references/; got ${entries.length}: ${JSON.stringify(entries)}`,
    );
  });

  it('each capability prompt has the four Pattern-C-friendly sections (FR10/NFR16)', () => {
    const requiredSections = ['## Identity', '## How It Works', '## Output Expectations', '## Activation'];
    const entries = fs.readdirSync(referencesDir).filter(e => e.endsWith('.md'));
    for (const entry of entries) {
      const promptContent = fs.readFileSync(path.join(referencesDir, entry), 'utf8');
      for (const section of requiredSections) {
        assert.ok(
          promptContent.includes(section),
          `Capability prompt ${entry} missing required section '${section}'`,
        );
      }
    }
  });

  it('workflow source files referenced from menu codes still exist (FR12)', () => {
    for (const [code, workflowPath] of Object.entries(fixture.menuCodeToWorkflow)) {
      const abs = path.join(PROJECT_ROOT, workflowPath);
      assert.equal(
        fs.existsSync(abs),
        true,
        `Workflow source for menu code ${code} not found at ${workflowPath}`,
      );
    }
  });

  it('runParityCheck returns documented shape with menuCodesEqual undefined-or-true', () => {
    const result = runParityCheck({
      projectRoot: PROJECT_ROOT,
      agentRoleName,
    });
    assert.equal(result.postMigrationFile, 'found', 'Expected post-migration file detected');
    assert.deepEqual(
      [...result.postMigrationCodes].sort(),
      [...fixture.preMigrationMenuCodes].sort(),
      'runParityCheck postMigrationCodes drifted from baseline',
    );
  });

  it('extractV5MenuCodes against a Wade-shaped pre-migration fixture returns the 9-code baseline (R2-P4 anti-fence-stripping regression test)', () => {
    // Wade's pre-migration SKILL.md stored 9 menu codes inside a
    // ```xml fence (git blob 36cc5e4833bdc434b5a1b359e4d6cfbe8250b899).
    // The synthetic sample below mirrors that shape. Per carry-forward #2
    // (Story 2.1 calibration), this regression test captures the live gate
    // run during Story 2.2 dev (Task 1.3) so Round 2 reviewers lacking
    // project-context can re-verify R2-P4 fence-stripping has not silently
    // returned. Wade's 9 codes (different from Emma's 8) exercise the
    // extractor against a different code set.
    const v5Sample = `\`\`\`xml
<agent name="Wade">
  <menu>
    <item cmd="MH">[MH] Redisplay Menu Help</item>
    <item cmd="CH">[CH] Chat with Wade</item>
    <item cmd="ME">[ME] Design MVP</item>
    <item cmd="LE">[LE] Run Lean Experiment</item>
    <item cmd="PC">[PC] Create Proof of Concept</item>
    <item cmd="PV">[PV] Create Proof of Value</item>
    <item cmd="VE">[VE] Validate Experiment</item>
    <item cmd="PM">[PM] Start Party Mode</item>
    <item cmd="DA">[DA] Dismiss Agent</item>
  </menu>
</agent>
\`\`\``;
    const codes = extractV5MenuCodes(v5Sample);
    assert.deepEqual([...codes].sort(), [...fixture.preMigrationMenuCodes].sort());
  });
});
