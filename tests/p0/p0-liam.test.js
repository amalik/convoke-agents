'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const {
  loadAgentDefinition,
  PACKAGE_ROOT,
  AGENTS_DIR,
  WORKFLOWS_DIR,
  STEP_PATTERN,
} = require('./helpers');

const LIAM_ID = 'hypothesis-engineer';
const LIAM_WORKFLOW_NAMES = ['hypothesis-engineering', 'assumption-mapping', 'experiment-design'];

// Expected step counts per workflow (verified against filesystem)
const LIAM_STEP_COUNTS = {
  'hypothesis-engineering': 5,
  'assumption-mapping': 4,
  'experiment-design': 4,
};

// ─── P0 Liam: Activation Sequence (FR7) ────────────────────────

describe('P0 Liam: Activation Sequence', () => {
  let def;
  let rawContent;

  before(() => {
    def = loadAgentDefinition(LIAM_ID);
    rawContent = fs.readFileSync(path.join(AGENTS_DIR, LIAM_ID, 'SKILL.md'), 'utf8');
  });

  it('persona role contains "Hypothesis Engineering"', () => {
    assert.ok(
      def.persona.role.includes('Hypothesis Engineering'),
      `Liam (${LIAM_ID}): persona role should contain "Hypothesis Engineering", got "${def.persona.role}"`
    );
  });

  it('persona identity references the Hypothesize stream', () => {
    assert.ok(
      def.persona.identity.includes('Hypothesize'),
      `Liam (${LIAM_ID}): persona identity should reference "Hypothesize" stream`
    );
  });

  it('persona communication_style contains characteristic phrase', () => {
    const style = def.persona.communication_style;
    assert.ok(
      style.includes('What if?'),
      `Liam (${LIAM_ID}): communication_style should contain "What if?"`
    );
  });

  it('has exactly 7 menu items with expected cmd triggers', () => {
    assert.equal(
      def.menuItems.length,
      7,
      `Liam (${LIAM_ID}): expected 7 menu items, got ${def.menuItems.length}`
    );
    const expectedTriggers = ['MH', 'CH', 'HE', 'AM', 'ED', 'PM', 'DA'];
    for (const trigger of expectedTriggers) {
      const found = def.menuItems.some(item => item.cmd.startsWith(trigger));
      assert.ok(
        found,
        `Liam (${LIAM_ID}): missing menu item with cmd starting with "${trigger}"`
      );
    }
  });

  it('exec-path menu items reference existing files on disk', () => {
    const execRegex = /<item\s[^>]*exec="([^"]+)"[^>]*>/g;
    const execPaths = [];
    let m;
    while ((m = execRegex.exec(rawContent)) !== null) {
      execPaths.push(m[1]);
    }
    assert.ok(
      execPaths.length >= 4,
      `Liam (${LIAM_ID}): expected at least 4 exec paths, found ${execPaths.length}`
    );
    for (const execPath of execPaths) {
      const resolved = execPath.replace(/\{project-root\}/g, PACKAGE_ROOT);
      assert.ok(
        fs.existsSync(resolved),
        `Liam (${LIAM_ID}): exec path not found on disk: ${resolved}`
      );
    }
  });

  it('activation step 2 references config.yaml loading with error handling', () => {
    const step2Match = rawContent.match(/<step n="2">([\s\S]*?)<step n="3">/);
    assert.ok(
      step2Match,
      `Liam (${LIAM_ID}): could not extract activation step 2 content`
    );
    assert.ok(
      step2Match[1].includes('config.yaml'),
      `Liam (${LIAM_ID}): step 2 should reference "config.yaml" loading`
    );
    assert.ok(
      step2Match[1].includes('Configuration Error'),
      `Liam (${LIAM_ID}): step 2 should contain "Configuration Error" handling`
    );
  });

  it('rules section has at least 5 rules', () => {
    const ruleMatches = rawContent.match(/<r>/g);
    const ruleCount = ruleMatches ? ruleMatches.length : 0;
    assert.ok(
      ruleCount >= 5,
      `Liam (${LIAM_ID}): expected at least 5 rules, found ${ruleCount}`
    );
  });
});

// ─── P0 Liam: Workflow Execution Output (FR8) ──────────────────

describe('P0 Liam: Workflow Execution Output', () => {
  for (const wfName of LIAM_WORKFLOW_NAMES) {
    describe(`${wfName}`, () => {
      const wfDir = path.join(WORKFLOWS_DIR, wfName);
      const stepsDir = path.join(wfDir, 'steps');
      let stepFiles;

      before(() => {
        assert.ok(
          fs.existsSync(stepsDir) && fs.statSync(stepsDir).isDirectory(),
          `Liam (${LIAM_ID}): ${wfName}/steps/ directory not found at ${stepsDir}`
        );
        stepFiles = fs.readdirSync(stepsDir)
          .filter(f => STEP_PATTERN.test(f))
          .sort();
      });

      it('workflow.md contains type, description, and author fields', () => {
        const wfContent = fs.readFileSync(path.join(wfDir, 'workflow.md'), 'utf8');
        assert.ok(
          wfContent.includes('type:'),
          `Liam (${LIAM_ID}): ${wfName}/workflow.md missing "type:" field`
        );
        assert.ok(
          wfContent.includes('description:'),
          `Liam (${LIAM_ID}): ${wfName}/workflow.md missing "description:" field`
        );
        assert.ok(
          wfContent.includes('author:'),
          `Liam (${LIAM_ID}): ${wfName}/workflow.md missing "author:" field`
        );
      });

      // Liam's workflows have NO template files — skip template tests

      it('steps reference the next step in sequence', () => {
        assert.ok(
          stepFiles.length >= 2,
          `Liam (${LIAM_ID}): ${wfName} needs at least 2 steps for cross-reference check, found ${stepFiles.length}`
        );
        for (let i = 0; i < stepFiles.length - 1; i++) {
          const stepContent = fs.readFileSync(path.join(stepsDir, stepFiles[i]), 'utf8');
          const nextNum = String(i + 2).padStart(2, '0');
          assert.ok(
            stepContent.includes(`step-${nextNum}`),
            `Liam (${LIAM_ID}): ${wfName}/${stepFiles[i]} should reference step-${nextNum}`
          );
        }
      });

      it('final step contains synthesize/artifact content', () => {
        const lastFile = stepFiles[stepFiles.length - 1];
        assert.ok(
          lastFile,
          `Liam (${LIAM_ID}): ${wfName} has no step files to check for synthesize content`
        );
        const content = fs.readFileSync(path.join(stepsDir, lastFile), 'utf8').toLowerCase();
        const hasSynthesize = content.includes('synthesize') ||
                              content.includes('artifact') ||
                              content.includes('final');
        assert.ok(
          hasSynthesize,
          `Liam (${LIAM_ID}): ${wfName}/${lastFile} should contain synthesize/artifact/final content`
        );
      });

      it('final step suggests next workflows', () => {
        const lastFile = stepFiles[stepFiles.length - 1];
        assert.ok(
          lastFile,
          `Liam (${LIAM_ID}): ${wfName} has no step files to check for next workflow suggestions`
        );
        const content = fs.readFileSync(path.join(stepsDir, lastFile), 'utf8');
        const hasHandoff = content.includes('next') || content.includes('Next') ||
                           content.includes('Suggest') || content.includes('suggest');
        assert.ok(
          hasHandoff,
          `Liam (${LIAM_ID}): ${wfName}/${lastFile} should suggest next workflows`
        );
      });

      it(`has exactly ${LIAM_STEP_COUNTS[wfName]} step files`, () => {
        assert.equal(
          stepFiles.length,
          LIAM_STEP_COUNTS[wfName],
          `Liam (${LIAM_ID}): ${wfName} expected ${LIAM_STEP_COUNTS[wfName]} steps, got ${stepFiles.length}`
        );
      });
    });
  }
});
