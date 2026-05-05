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
  extractExecPaths,
  resolveExecPath,
  countRules,
  hasConfigErrorHandling,
  fileMentions,
} = require('./helpers');

const MILA_ID = 'research-convergence-specialist';
const MILA_WORKFLOW_NAMES = ['research-convergence', 'pivot-resynthesis', 'pattern-mapping'];

// ─── P0 Mila: Activation Sequence (FR7) ────────────────────────

describe('P0 Mila: Activation Sequence', () => {
  let def;
  let rawContent;

  before(() => {
    def = loadAgentDefinition(MILA_ID);
    rawContent = fs.readFileSync(path.join(AGENTS_DIR, MILA_ID, 'SKILL.md'), 'utf8');
  });

  it('agent file mentions self-description keyword "Research Convergence"', () => {
    assert.ok(
      fileMentions(rawContent, 'Research Convergence'),
      `Mila (${MILA_ID}): ${def.format} agent file should contain "Research Convergence" somewhere in its self-description`
    );
  });

  it('agent file references the Synthesize stream', () => {
    assert.ok(
      fileMentions(rawContent, 'Synthesize'),
      `Mila (${MILA_ID}): ${def.format} agent file should reference "Synthesize" stream`
    );
  });

  it('agent file contains characteristic communication phrase', () => {
    assert.ok(
      fileMentions(rawContent, 'what the research is telling us') ||
        fileMentions(rawContent, 'three sources') ||
        fileMentions(rawContent, 'one data point is an anecdote'),
      `Mila (${MILA_ID}): ${def.format} agent file should contain a characteristic Mila phrase ("what the research is telling us", "three sources", or "one data point is an anecdote")`
    );
  });

  it('has exactly 7 menu items with expected cmd triggers', () => {
    assert.equal(
      def.menuItems.length,
      7,
      `Mila (${MILA_ID}): expected 7 menu items, got ${def.menuItems.length}`
    );
    const expectedTriggers = ['MH', 'CH', 'RC', 'PR', 'PA', 'PM', 'DA'];
    for (const trigger of expectedTriggers) {
      const found = def.menuItems.some(item => item.cmd.startsWith(trigger));
      assert.ok(
        found,
        `Mila (${MILA_ID}): missing menu item with cmd starting with "${trigger}"`
      );
    }
  });

  it('capability-prompt files referenced from menu surface exist on disk', () => {
    const execPaths = extractExecPaths(rawContent, def.format);
    assert.ok(
      execPaths.length >= 3,
      `Mila (${MILA_ID}): ${def.format} agent file expected at least 3 exec/capability paths, found ${execPaths.length}`
    );
    const agentDir = path.join(AGENTS_DIR, MILA_ID);
    for (const execPath of execPaths) {
      const resolved = resolveExecPath(execPath, agentDir, PACKAGE_ROOT);
      assert.ok(
        fs.existsSync(resolved),
        `Mila (${MILA_ID}): exec path not found on disk: ${resolved} (from "${execPath}")`
      );
    }
  });

  it('activation has config-error handling on step 2 (or v6.3 step-1 bmad-init delegation)', () => {
    assert.ok(
      hasConfigErrorHandling(def, rawContent),
      `Mila (${MILA_ID}): ${def.format} agent file should have config-error handling — v5: <step n="2"> with "config.yaml" + "Configuration Error"; v6.3: step 1 with "**Load config via bmad-init"`
    );
  });

  it('principles/rules section has at least 5 entries', () => {
    const ruleCount = countRules(def, rawContent);
    assert.ok(
      ruleCount >= 5,
      `Mila (${MILA_ID}): ${def.format} agent file expected at least 5 ${def.format === 'v5' ? '<r> rules' : '## Principles bullets'}, found ${ruleCount}`
    );
  });
});

// ─── P0 Mila: Workflow Execution Output (FR8) ──────────────────

describe('P0 Mila: Workflow Execution Output', () => {
  for (const wfName of MILA_WORKFLOW_NAMES) {
    describe(`${wfName}`, () => {
      const wfDir = path.join(WORKFLOWS_DIR, wfName);
      const stepsDir = path.join(wfDir, 'steps');
      let stepFiles;

      before(() => {
        assert.ok(
          fs.existsSync(stepsDir) && fs.statSync(stepsDir).isDirectory(),
          `Mila (${MILA_ID}): ${wfName}/steps/ directory not found at ${stepsDir}`
        );
        stepFiles = fs.readdirSync(stepsDir)
          .filter(f => STEP_PATTERN.test(f))
          .sort();
      });

      it('workflow.md contains type, description, and author fields', () => {
        const wfContent = fs.readFileSync(path.join(wfDir, 'workflow.md'), 'utf8');
        assert.ok(
          wfContent.includes('type:'),
          `Mila (${MILA_ID}): ${wfName}/workflow.md missing "type:" field`
        );
        assert.ok(
          wfContent.includes('description:'),
          `Mila (${MILA_ID}): ${wfName}/workflow.md missing "description:" field`
        );
        assert.ok(
          wfContent.includes('author:'),
          `Mila (${MILA_ID}): ${wfName}/workflow.md missing "author:" field`
        );
      });

      // Mila's workflows have NO template files — skip template tests

      it('steps reference the next step in sequence', () => {
        assert.ok(
          stepFiles.length >= 2,
          `Mila (${MILA_ID}): ${wfName} needs at least 2 steps for cross-reference check, found ${stepFiles.length}`
        );
        for (let i = 0; i < stepFiles.length - 1; i++) {
          const stepContent = fs.readFileSync(path.join(stepsDir, stepFiles[i]), 'utf8');
          const nextNum = String(i + 2).padStart(2, '0');
          assert.ok(
            stepContent.includes(`step-${nextNum}`),
            `Mila (${MILA_ID}): ${wfName}/${stepFiles[i]} should reference step-${nextNum}`
          );
        }
      });

      it('final step contains synthesize/artifact content', () => {
        const lastFile = stepFiles[stepFiles.length - 1];
        assert.ok(
          lastFile,
          `Mila (${MILA_ID}): ${wfName} has no step files to check for synthesize content`
        );
        const content = fs.readFileSync(path.join(stepsDir, lastFile), 'utf8').toLowerCase();
        const hasSynthesize = content.includes('synthesize') ||
                              content.includes('artifact') ||
                              content.includes('final');
        assert.ok(
          hasSynthesize,
          `Mila (${MILA_ID}): ${wfName}/${lastFile} should contain synthesize/artifact/final content`
        );
      });

      it('final step suggests next workflows', () => {
        const lastFile = stepFiles[stepFiles.length - 1];
        assert.ok(
          lastFile,
          `Mila (${MILA_ID}): ${wfName} has no step files to check for next workflow suggestions`
        );
        const content = fs.readFileSync(path.join(stepsDir, lastFile), 'utf8');
        const hasHandoff = content.includes('next') || content.includes('Next') ||
                           content.includes('Suggest') || content.includes('suggest');
        assert.ok(
          hasHandoff,
          `Mila (${MILA_ID}): ${wfName}/${lastFile} should suggest next workflows`
        );
      });

      it('has exactly 5 step files', () => {
        assert.equal(
          stepFiles.length,
          5,
          `Mila (${MILA_ID}): ${wfName} expected 5 steps, got ${stepFiles.length}`
        );
      });
    });
  }
});
