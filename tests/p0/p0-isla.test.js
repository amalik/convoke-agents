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

const ISLA_ID = 'discovery-empathy-expert';
const ISLA_WORKFLOW_NAMES = ['empathy-map', 'user-interview', 'user-discovery'];

// ─── P0 Isla: Activation Sequence (FR7) ────────────────────────

describe('P0 Isla: Activation Sequence', () => {
  let def;
  let rawContent;

  before(() => {
    def = loadAgentDefinition(ISLA_ID);
    rawContent = fs.readFileSync(path.join(AGENTS_DIR, ISLA_ID, 'SKILL.md'), 'utf8');
  });

  it('persona role contains "Qualitative Research Expert"', () => {
    assert.ok(
      def.persona.role.includes('Qualitative Research Expert'),
      `Isla (${ISLA_ID}): persona role should contain "Qualitative Research Expert", got "${def.persona.role}"`
    );
  });

  it('persona identity references the Empathize stream', () => {
    assert.ok(
      def.persona.identity.includes('Empathize'),
      `Isla (${ISLA_ID}): persona identity should reference "Empathize" stream`
    );
  });

  it('persona communication_style contains characteristic phrase', () => {
    const style = def.persona.communication_style;
    assert.ok(
      style.includes('I noticed that'),
      `Isla (${ISLA_ID}): communication_style should contain "I noticed that"`
    );
  });

  it('has exactly 8 menu items with expected cmd triggers', () => {
    assert.equal(
      def.menuItems.length,
      8,
      `Isla (${ISLA_ID}): expected 8 menu items, got ${def.menuItems.length}`
    );
    const expectedTriggers = ['MH', 'CH', 'EM', 'UI', 'UD', 'VE', 'PM', 'DA'];
    for (const trigger of expectedTriggers) {
      const found = def.menuItems.some(item => item.cmd.startsWith(trigger));
      assert.ok(
        found,
        `Isla (${ISLA_ID}): missing menu item with cmd starting with "${trigger}"`
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
      execPaths.length >= 5,
      `Isla (${ISLA_ID}): expected at least 5 exec paths, found ${execPaths.length}`
    );
    for (const execPath of execPaths) {
      const resolved = execPath.replace(/\{project-root\}/g, PACKAGE_ROOT);
      assert.ok(
        fs.existsSync(resolved),
        `Isla (${ISLA_ID}): exec path not found on disk: ${resolved}`
      );
    }
  });

  it('activation step 2 references config.yaml loading with error handling', () => {
    const step2Match = rawContent.match(/<step n="2">([\s\S]*?)<step n="3">/);
    assert.ok(
      step2Match,
      `Isla (${ISLA_ID}): could not extract activation step 2 content`
    );
    assert.ok(
      step2Match[1].includes('config.yaml'),
      `Isla (${ISLA_ID}): step 2 should reference "config.yaml" loading`
    );
    assert.ok(
      step2Match[1].includes('Configuration Error'),
      `Isla (${ISLA_ID}): step 2 should contain "Configuration Error" handling`
    );
  });

  it('rules section has at least 5 rules', () => {
    const ruleMatches = rawContent.match(/<r>/g);
    const ruleCount = ruleMatches ? ruleMatches.length : 0;
    assert.ok(
      ruleCount >= 5,
      `Isla (${ISLA_ID}): expected at least 5 rules, found ${ruleCount}`
    );
  });
});

// ─── P0 Isla: Workflow Execution Output (FR8) ──────────────────

describe('P0 Isla: Workflow Execution Output', () => {
  for (const wfName of ISLA_WORKFLOW_NAMES) {
    describe(`${wfName}`, () => {
      const wfDir = path.join(WORKFLOWS_DIR, wfName);
      const stepsDir = path.join(wfDir, 'steps');
      let stepFiles;

      before(() => {
        assert.ok(
          fs.existsSync(stepsDir) && fs.statSync(stepsDir).isDirectory(),
          `Isla (${ISLA_ID}): ${wfName}/steps/ directory not found at ${stepsDir}`
        );
        stepFiles = fs.readdirSync(stepsDir)
          .filter(f => STEP_PATTERN.test(f))
          .sort();
      });

      it('workflow.md contains type, description, and author fields', () => {
        const wfContent = fs.readFileSync(path.join(wfDir, 'workflow.md'), 'utf8');
        assert.ok(
          wfContent.includes('type:'),
          `Isla (${ISLA_ID}): ${wfName}/workflow.md missing "type:" field`
        );
        assert.ok(
          wfContent.includes('description:'),
          `Isla (${ISLA_ID}): ${wfName}/workflow.md missing "description:" field`
        );
        assert.ok(
          wfContent.includes('author:'),
          `Isla (${ISLA_ID}): ${wfName}/workflow.md missing "author:" field`
        );
      });

      it('template file exists', () => {
        const templatePath = path.join(wfDir, `${wfName}.template.md`);
        assert.ok(
          fs.existsSync(templatePath),
          `Isla (${ISLA_ID}): ${wfName} template not found at ${templatePath}`
        );
      });

      it('template file contains placeholder variables', () => {
        const templatePath = path.join(wfDir, `${wfName}.template.md`);
        const content = fs.readFileSync(templatePath, 'utf8');
        const placeholderPattern = /\{[a-z][-a-z]*\}/;
        assert.ok(
          placeholderPattern.test(content),
          `Isla (${ISLA_ID}): ${wfName} template should contain {variable-name} placeholders`
        );
      });

      it('steps reference the next step in sequence', () => {
        assert.ok(
          stepFiles.length >= 2,
          `Isla (${ISLA_ID}): ${wfName} needs at least 2 steps for cross-reference check, found ${stepFiles.length}`
        );
        for (let i = 0; i < stepFiles.length - 1; i++) {
          const stepContent = fs.readFileSync(path.join(stepsDir, stepFiles[i]), 'utf8');
          const nextNum = String(i + 2).padStart(2, '0');
          assert.ok(
            stepContent.includes(`step-${nextNum}`),
            `Isla (${ISLA_ID}): ${wfName}/${stepFiles[i]} should reference step-${nextNum}`
          );
        }
      });

      it('final step contains synthesize/artifact content', () => {
        const lastFile = stepFiles[stepFiles.length - 1];
        assert.ok(
          lastFile,
          `Isla (${ISLA_ID}): ${wfName} has no step files to check for synthesize content`
        );
        const content = fs.readFileSync(path.join(stepsDir, lastFile), 'utf8').toLowerCase();
        const hasSynthesize = content.includes('synthesize') ||
                              content.includes('artifact') ||
                              content.includes('final');
        assert.ok(
          hasSynthesize,
          `Isla (${ISLA_ID}): ${wfName}/${lastFile} should contain synthesize/artifact/final content`
        );
      });

      it('final step suggests next workflows', () => {
        const lastFile = stepFiles[stepFiles.length - 1];
        assert.ok(
          lastFile,
          `Isla (${ISLA_ID}): ${wfName} has no step files to check for next workflow suggestions`
        );
        const content = fs.readFileSync(path.join(stepsDir, lastFile), 'utf8');
        const hasHandoff = content.includes('next') || content.includes('Next') ||
                           content.includes('Suggest') || content.includes('suggest');
        assert.ok(
          hasHandoff,
          `Isla (${ISLA_ID}): ${wfName}/${lastFile} should suggest next workflows`
        );
      });

      it('has exactly 6 step files', () => {
        assert.equal(
          stepFiles.length,
          6,
          `Isla (${ISLA_ID}): ${wfName} expected 6 steps, got ${stepFiles.length}`
        );
      });
    });
  }
});
