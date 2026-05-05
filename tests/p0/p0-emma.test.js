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
  extractExecPaths,
  resolveExecPath,
  countRules,
  hasConfigErrorHandling,
  fileMentions,
} = require('./helpers');
const {
  AGENTS,
  WORKFLOWS,
  AGENT_IDS,
  AGENT_FILES,
  WAVE3_WORKFLOW_NAMES,
} = require('../../scripts/update/lib/agent-registry');

const EMMA_ID = 'contextualization-expert';
const EMMA_WORKFLOW_NAMES = ['lean-persona', 'product-vision', 'contextualize-scope'];
const STEP_PATTERN = /^step-\d{2}(-[^.]+)?\.md$/;

// ─── P0 Emma: Activation Sequence (FR7) ────────────────────────

describe('P0 Emma: Activation Sequence', () => {
  let def;
  let rawContent;

  before(() => {
    def = loadAgentDefinition(EMMA_ID);
    // Story v63-3-1: Vortex migrated to skill-dir layout (<id>/SKILL.md).
    rawContent = fs.readFileSync(path.join(AGENTS_DIR, EMMA_ID, 'SKILL.md'), 'utf8');
  });

  it('agent file mentions self-description keyword "Product Context Architect"', () => {
    assert.ok(
      fileMentions(rawContent, 'Product Context Architect'),
      `Emma (${EMMA_ID}): ${def.format} agent file should contain "Product Context Architect" somewhere in its self-description`
    );
  });

  it('agent file references the Contextualize stream', () => {
    assert.ok(
      fileMentions(rawContent, 'Contextualize'),
      `Emma (${EMMA_ID}): ${def.format} agent file should reference "Contextualize" stream`
    );
  });

  it('agent file contains characteristic communication phrase', () => {
    const hasPhrase = fileMentions(rawContent, 'Before we build') || fileMentions(rawContent, 'What problem');
    assert.ok(
      hasPhrase,
      `Emma (${EMMA_ID}): ${def.format} agent file should contain "Before we build" or "What problem"`
    );
  });

  it('has exactly 8 menu items with expected cmd triggers', () => {
    assert.equal(
      def.menuItems.length,
      8,
      `Emma (${EMMA_ID}): expected 8 menu items, got ${def.menuItems.length}`
    );
    const expectedTriggers = ['MH', 'CH', 'LP', 'PV', 'CS', 'VL', 'PM', 'DA'];
    for (const trigger of expectedTriggers) {
      const found = def.menuItems.some(item => item.cmd.startsWith(trigger));
      assert.ok(
        found,
        `Emma (${EMMA_ID}): missing menu item with cmd starting with "${trigger}"`
      );
    }
  });

  it('capability-prompt files referenced from menu surface exist on disk', () => {
    const execPaths = extractExecPaths(rawContent, def.format);
    assert.ok(
      execPaths.length >= 4,
      `Emma (${EMMA_ID}): ${def.format} agent file expected at least 4 exec/capability paths, found ${execPaths.length}`
    );
    const agentDir = path.join(AGENTS_DIR, EMMA_ID);
    for (const execPath of execPaths) {
      const resolved = resolveExecPath(execPath, agentDir, PACKAGE_ROOT);
      assert.ok(
        fs.existsSync(resolved),
        `Emma (${EMMA_ID}): exec path not found on disk: ${resolved} (from "${execPath}")`
      );
    }
  });

  it('activation has config-error handling on step 2 (or v6.3 step-1 bmad-init delegation)', () => {
    assert.ok(
      hasConfigErrorHandling(def, rawContent),
      `Emma (${EMMA_ID}): ${def.format} agent file should have config-error handling — v5: <step n="2"> with "config.yaml" + "Configuration Error"; v6.3: step 1 with "**Load config via bmad-init"`
    );
  });

  it('principles/rules section has at least 5 entries', () => {
    const ruleCount = countRules(def, rawContent);
    assert.ok(
      ruleCount >= 5,
      `Emma (${EMMA_ID}): ${def.format} agent file expected at least 5 ${def.format === 'v5' ? '<r> rules' : '## Principles bullets'}, found ${ruleCount}`
    );
  });
});

// ─── P0 Emma: Workflow Execution Output (FR8) ──────────────────

describe('P0 Emma: Workflow Execution Output', () => {
  for (const wfName of EMMA_WORKFLOW_NAMES) {
    describe(`${wfName}`, () => {
      const wfDir = path.join(WORKFLOWS_DIR, wfName);
      const stepsDir = path.join(wfDir, 'steps');

      it('workflow.md contains type, description, and author fields', () => {
        const wfContent = fs.readFileSync(path.join(wfDir, 'workflow.md'), 'utf8');
        assert.ok(
          wfContent.includes('type:'),
          `Emma (${EMMA_ID}): ${wfName}/workflow.md missing "type:" field`
        );
        assert.ok(
          wfContent.includes('description:'),
          `Emma (${EMMA_ID}): ${wfName}/workflow.md missing "description:" field`
        );
        assert.ok(
          wfContent.includes('author:'),
          `Emma (${EMMA_ID}): ${wfName}/workflow.md missing "author:" field`
        );
      });

      it('template file exists', () => {
        const templatePath = path.join(wfDir, `${wfName}.template.md`);
        assert.ok(
          fs.existsSync(templatePath),
          `Emma (${EMMA_ID}): ${wfName} template not found at ${templatePath}`
        );
      });

      it('template file contains placeholder variables', () => {
        const templatePath = path.join(wfDir, `${wfName}.template.md`);
        const content = fs.readFileSync(templatePath, 'utf8');
        const placeholderPattern = /\{[a-z][-a-z]*\}/;
        assert.ok(
          placeholderPattern.test(content),
          `Emma (${EMMA_ID}): ${wfName} template should contain {variable-name} placeholders`
        );
      });

      it('steps 01-05 reference the next step in sequence', () => {
        const stepFiles = fs.readdirSync(stepsDir)
          .filter(f => STEP_PATTERN.test(f))
          .sort();
        assert.ok(
          stepFiles.length >= 2,
          `Emma (${EMMA_ID}): ${wfName} needs at least 2 steps for cross-reference check, found ${stepFiles.length}`
        );
        for (let i = 0; i < stepFiles.length - 1; i++) {
          const stepContent = fs.readFileSync(path.join(stepsDir, stepFiles[i]), 'utf8');
          const nextNum = String(i + 2).padStart(2, '0');
          assert.ok(
            stepContent.includes(`step-${nextNum}`),
            `Emma (${EMMA_ID}): ${wfName}/${stepFiles[i]} should reference step-${nextNum}`
          );
        }
      });

      it('final step contains synthesize/artifact content', () => {
        const stepFiles = fs.readdirSync(stepsDir)
          .filter(f => STEP_PATTERN.test(f))
          .sort();
        const lastFile = stepFiles[stepFiles.length - 1];
        assert.ok(
          lastFile,
          `Emma (${EMMA_ID}): ${wfName} has no step files to check for synthesize content`
        );
        const content = fs.readFileSync(path.join(stepsDir, lastFile), 'utf8').toLowerCase();
        const hasSynthesize = content.includes('synthesize') ||
                              content.includes('artifact') ||
                              content.includes('final');
        assert.ok(
          hasSynthesize,
          `Emma (${EMMA_ID}): ${wfName}/${lastFile} should contain synthesize/artifact/final content`
        );
      });

      it('final step suggests next workflows', () => {
        const stepFiles = fs.readdirSync(stepsDir)
          .filter(f => STEP_PATTERN.test(f))
          .sort();
        const lastFile = stepFiles[stepFiles.length - 1];
        assert.ok(
          lastFile,
          `Emma (${EMMA_ID}): ${wfName} has no step files to check for next workflow suggestions`
        );
        const content = fs.readFileSync(path.join(stepsDir, lastFile), 'utf8');
        const hasHandoff = content.includes('next') || content.includes('Next') ||
                           content.includes('Suggest') || content.includes('suggest');
        assert.ok(
          hasHandoff,
          `Emma (${EMMA_ID}): ${wfName}/${lastFile} should suggest next workflows`
        );
      });

      it('has exactly 6 step files', () => {
        const stepFiles = fs.readdirSync(stepsDir)
          .filter(f => STEP_PATTERN.test(f));
        assert.equal(
          stepFiles.length,
          6,
          `Emma (${EMMA_ID}): ${wfName} expected 6 steps, got ${stepFiles.length}`
        );
      });
    });
  }
});

// ─── P0 Emma: Infrastructure Integration (FR10) ────────────────

describe('P0 Emma: Infrastructure Integration', () => {
  let emmaRegistry;
  let def;

  before(() => {
    emmaRegistry = AGENTS.find(a => a.id === EMMA_ID);
    def = loadAgentDefinition(EMMA_ID);
  });

  it('registry entry exists for Emma', () => {
    assert.ok(
      emmaRegistry,
      `Emma (${EMMA_ID}): registry entry not found in AGENTS array`
    );
  });

  it('registry persona has all 4 fields as non-empty strings', () => {
    const fields = ['role', 'identity', 'communication_style', 'expertise'];
    for (const field of fields) {
      assert.ok(
        typeof emmaRegistry.persona[field] === 'string' && emmaRegistry.persona[field].length > 0,
        `Emma (${EMMA_ID}): registry persona.${field} should be a non-empty string`
      );
    }
  });

  it('registry stream is "Contextualize"', () => {
    assert.equal(
      emmaRegistry.stream,
      'Contextualize',
      `Emma (${EMMA_ID}): registry stream should be "Contextualize", got "${emmaRegistry.stream}"`
    );
  });

  it('WORKFLOWS contains exactly 3 entries for Emma with correct names', () => {
    const emmaWorkflows = WORKFLOWS.filter(w => w.agent === EMMA_ID);
    assert.equal(
      emmaWorkflows.length,
      3,
      `Emma (${EMMA_ID}): expected 3 workflows, got ${emmaWorkflows.length}`
    );
    const names = emmaWorkflows.map(w => w.name);
    assert.deepStrictEqual(
      names,
      EMMA_WORKFLOW_NAMES,
      `Emma (${EMMA_ID}): workflow names mismatch`
    );
  });

  it('Emma ID appears in derived AGENT_IDS', () => {
    assert.ok(
      AGENT_IDS.includes(EMMA_ID),
      `Emma (${EMMA_ID}): ID not found in AGENT_IDS`
    );
  });

  it('Emma file appears in derived AGENT_FILES', () => {
    assert.ok(
      AGENT_FILES.includes(`${EMMA_ID}.md`),
      `Emma (${EMMA_ID}): file not found in AGENT_FILES`
    );
  });

  it('Emma workflows are NOT in WAVE3_WORKFLOW_NAMES', () => {
    const registryNames = WORKFLOWS.filter(w => w.agent === EMMA_ID).map(w => w.name);
    for (const wfName of registryNames) {
      assert.ok(
        !WAVE3_WORKFLOW_NAMES.has(wfName),
        `Emma (${EMMA_ID}): workflow "${wfName}" should NOT be in WAVE3_WORKFLOW_NAMES (Wave 1 agent)`
      );
    }
  });

  it('persona cross-validation: registry and agent file roles share "Product" keyword', () => {
    assert.ok(
      emmaRegistry.persona.role.includes('Product'),
      `Emma (${EMMA_ID}): registry persona.role should contain "Product"`
    );
    assert.ok(
      def.persona.role.includes('Product'),
      `Emma (${EMMA_ID}): agent file <role> should contain "Product"`
    );
  });

  it('persona cross-validation: communication styles share "really solving" pattern', () => {
    assert.ok(
      emmaRegistry.persona.communication_style.includes('really solving'),
      `Emma (${EMMA_ID}): registry communication_style should contain "really solving"`
    );
    assert.ok(
      def.persona.communication_style.includes('really solving'),
      `Emma (${EMMA_ID}): agent file <communication_style> should contain "really solving"`
    );
  });

  it('agent tag name matches registry name exactly', () => {
    assert.equal(
      def.agentAttrs.name,
      emmaRegistry.name,
      `Emma (${EMMA_ID}): agent tag name "${def.agentAttrs.name}" should match registry name "${emmaRegistry.name}"`
    );
  });

  it('agent tag icon matches registry icon', () => {
    assert.equal(
      def.agentAttrs.icon,
      emmaRegistry.icon,
      `Emma (${EMMA_ID}): agent tag icon should match registry icon`
    );
  });
});
