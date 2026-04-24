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
} = require('./helpers');
const {
  AGENTS,
  WORKFLOWS,
  AGENT_IDS,
  AGENT_FILES,
  WAVE3_WORKFLOW_NAMES,
} = require('../../scripts/update/lib/agent-registry');

const WADE_ID = 'lean-experiments-specialist';
const WADE_WORKFLOW_NAMES = ['mvp', 'lean-experiment', 'proof-of-concept', 'proof-of-value'];
const MVP_WORKFLOW = 'mvp';
const STEP_PATTERN = /^step-\d{2}(-[^.]+)?\.md$/;

// ─── P0 Wade: Activation Sequence (FR7) ────────────────────────

describe('P0 Wade: Activation Sequence', () => {
  let def;
  let rawContent;

  before(() => {
    def = loadAgentDefinition(WADE_ID);
    rawContent = fs.readFileSync(path.join(AGENTS_DIR, WADE_ID, 'SKILL.md'), 'utf8');
  });

  it('persona role contains "Validated Learning Expert"', () => {
    assert.ok(
      def.persona.role.includes('Validated Learning Expert'),
      `Wade (${WADE_ID}): persona role should contain "Validated Learning Expert", got "${def.persona.role}"`
    );
  });

  it('persona identity references the Externalize stream', () => {
    assert.ok(
      def.persona.identity.includes('Externalize'),
      `Wade (${WADE_ID}): persona identity should reference "Externalize" stream`
    );
  });

  it('persona communication_style contains characteristic phrase', () => {
    const style = def.persona.communication_style;
    const hasPhrase = style.includes('riskiest assumption') || style.includes('smallest experiment');
    assert.ok(
      hasPhrase,
      `Wade (${WADE_ID}): communication_style should contain "riskiest assumption" or "smallest experiment"`
    );
  });

  it('has exactly 9 menu items with expected cmd triggers', () => {
    assert.equal(
      def.menuItems.length,
      9,
      `Wade (${WADE_ID}): expected 9 menu items, got ${def.menuItems.length}`
    );
    const expectedTriggers = ['MH', 'CH', 'ME', 'LE', 'PC', 'PV', 'VE', 'PM', 'DA'];
    for (const trigger of expectedTriggers) {
      const found = def.menuItems.some(item => item.cmd.startsWith(trigger));
      assert.ok(
        found,
        `Wade (${WADE_ID}): missing menu item with cmd starting with "${trigger}"`
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
      execPaths.length >= 6,
      `Wade (${WADE_ID}): expected at least 6 exec paths, found ${execPaths.length}`
    );
    for (const execPath of execPaths) {
      const resolved = execPath.replace(/\{project-root\}/g, PACKAGE_ROOT);
      assert.ok(
        fs.existsSync(resolved),
        `Wade (${WADE_ID}): exec path not found on disk: ${resolved}`
      );
    }
  });

  it('activation step 2 references config.yaml loading with error handling', () => {
    const step2Match = rawContent.match(/<step n="2">([\s\S]*?)<step n="3">/);
    assert.ok(
      step2Match,
      `Wade (${WADE_ID}): could not extract activation step 2 content`
    );
    assert.ok(
      step2Match[1].includes('config.yaml'),
      `Wade (${WADE_ID}): step 2 should reference "config.yaml" loading`
    );
    assert.ok(
      step2Match[1].includes('Configuration Error'),
      `Wade (${WADE_ID}): step 2 should contain "Configuration Error" handling`
    );
  });

  it('rules section has at least 5 rules', () => {
    const ruleMatches = rawContent.match(/<r>/g);
    const ruleCount = ruleMatches ? ruleMatches.length : 0;
    assert.ok(
      ruleCount >= 5,
      `Wade (${WADE_ID}): expected at least 5 rules, found ${ruleCount}`
    );
  });
});

// ─── P0 Wade: Workflow Execution Output (FR8) ──────────────────

describe('P0 Wade: Workflow Execution Output', () => {
  for (const wfName of WADE_WORKFLOW_NAMES) {
    describe(`${wfName}`, () => {
      const wfDir = path.join(WORKFLOWS_DIR, wfName);
      const stepsDir = path.join(wfDir, 'steps');
      let stepFiles;

      before(() => {
        assert.ok(
          fs.existsSync(stepsDir) && fs.statSync(stepsDir).isDirectory(),
          `Wade (${WADE_ID}): ${wfName}/steps/ directory not found at ${stepsDir}`
        );
        stepFiles = fs.readdirSync(stepsDir)
          .filter(f => STEP_PATTERN.test(f))
          .sort();
      });

      it('workflow.md contains type, description, and author fields', () => {
        const wfContent = fs.readFileSync(path.join(wfDir, 'workflow.md'), 'utf8');
        assert.ok(
          wfContent.includes('type:'),
          `Wade (${WADE_ID}): ${wfName}/workflow.md missing "type:" field`
        );
        assert.ok(
          wfContent.includes('description:'),
          `Wade (${WADE_ID}): ${wfName}/workflow.md missing "description:" field`
        );
        assert.ok(
          wfContent.includes('author:'),
          `Wade (${WADE_ID}): ${wfName}/workflow.md missing "author:" field`
        );
      });

      it('template file exists', () => {
        const templatePath = path.join(wfDir, `${wfName}.template.md`);
        assert.ok(
          fs.existsSync(templatePath),
          `Wade (${WADE_ID}): ${wfName} template not found at ${templatePath}`
        );
      });

      it('template file contains placeholder variables', () => {
        const templatePath = path.join(wfDir, `${wfName}.template.md`);
        const content = fs.readFileSync(templatePath, 'utf8');
        const placeholderPattern = /\{[a-z][-a-z]*\}/;
        assert.ok(
          placeholderPattern.test(content),
          `Wade (${WADE_ID}): ${wfName} template should contain {variable-name} placeholders`
        );
      });

      // Cross-reference and synthesize tests run ONLY for MVP.
      // Wade's other 3 workflows (lean-experiment, proof-of-concept, proof-of-value)
      // have placeholder stub steps that lack cross-references and synthesize content.
      if (wfName === MVP_WORKFLOW) {
        it('steps 01-05 reference the next step in sequence', () => {
          assert.ok(
            stepFiles.length >= 2,
            `Wade (${WADE_ID}): ${wfName} needs at least 2 steps for cross-reference check, found ${stepFiles.length}`
          );
          for (let i = 0; i < stepFiles.length - 1; i++) {
            const stepContent = fs.readFileSync(path.join(stepsDir, stepFiles[i]), 'utf8');
            const nextNum = String(i + 2).padStart(2, '0');
            assert.ok(
              stepContent.includes(`step-${nextNum}`),
              `Wade (${WADE_ID}): ${wfName}/${stepFiles[i]} should reference step-${nextNum}`
            );
          }
        });

        it('final step contains synthesize/artifact content', () => {
          const lastFile = stepFiles[stepFiles.length - 1];
          assert.ok(
            lastFile,
            `Wade (${WADE_ID}): ${wfName} has no step files to check for synthesize content`
          );
          const content = fs.readFileSync(path.join(stepsDir, lastFile), 'utf8').toLowerCase();
          const hasSynthesize = content.includes('synthesize') ||
                                content.includes('artifact') ||
                                content.includes('final');
          assert.ok(
            hasSynthesize,
            `Wade (${WADE_ID}): ${wfName}/${lastFile} should contain synthesize/artifact/final content`
          );
        });
      }

      it('final step suggests next workflows', () => {
        const lastFile = stepFiles[stepFiles.length - 1];
        assert.ok(
          lastFile,
          `Wade (${WADE_ID}): ${wfName} has no step files to check for next workflow suggestions`
        );
        const content = fs.readFileSync(path.join(stepsDir, lastFile), 'utf8');
        const hasHandoff = content.includes('next') || content.includes('Next') ||
                           content.includes('Suggest') || content.includes('suggest');
        assert.ok(
          hasHandoff,
          `Wade (${WADE_ID}): ${wfName}/${lastFile} should suggest next workflows`
        );
      });

      it('has exactly 6 step files', () => {
        assert.equal(
          stepFiles.length,
          6,
          `Wade (${WADE_ID}): ${wfName} expected 6 steps, got ${stepFiles.length}`
        );
      });
    });
  }
});

// ─── P0 Wade: Infrastructure Integration (FR10) ────────────────

describe('P0 Wade: Infrastructure Integration', () => {
  let wadeRegistry;
  let def;

  before(() => {
    wadeRegistry = AGENTS.find(a => a.id === WADE_ID);
    def = loadAgentDefinition(WADE_ID);
  });

  it('registry entry exists for Wade', () => {
    assert.ok(
      wadeRegistry,
      `Wade (${WADE_ID}): registry entry not found in AGENTS array`
    );
  });

  it('registry persona has all 4 fields as non-empty strings', () => {
    const fields = ['role', 'identity', 'communication_style', 'expertise'];
    for (const field of fields) {
      assert.ok(
        typeof wadeRegistry.persona[field] === 'string' && wadeRegistry.persona[field].length > 0,
        `Wade (${WADE_ID}): registry persona.${field} should be a non-empty string`
      );
    }
  });

  it('registry stream is "Externalize"', () => {
    assert.equal(
      wadeRegistry.stream,
      'Externalize',
      `Wade (${WADE_ID}): registry stream should be "Externalize", got "${wadeRegistry.stream}"`
    );
  });

  it('WORKFLOWS contains exactly 4 entries for Wade with correct names', () => {
    const wadeWorkflows = WORKFLOWS.filter(w => w.agent === WADE_ID);
    assert.equal(
      wadeWorkflows.length,
      4,
      `Wade (${WADE_ID}): expected 4 workflows, got ${wadeWorkflows.length}`
    );
    const names = wadeWorkflows.map(w => w.name);
    assert.deepStrictEqual(
      names,
      WADE_WORKFLOW_NAMES,
      `Wade (${WADE_ID}): workflow names mismatch`
    );
  });

  it('Wade ID appears in derived AGENT_IDS', () => {
    assert.ok(
      AGENT_IDS.includes(WADE_ID),
      `Wade (${WADE_ID}): ID not found in AGENT_IDS`
    );
  });

  it('Wade file appears in derived AGENT_FILES', () => {
    assert.ok(
      AGENT_FILES.includes(`${WADE_ID}.md`),
      `Wade (${WADE_ID}): file not found in AGENT_FILES`
    );
  });

  it('Wade workflows are NOT in WAVE3_WORKFLOW_NAMES', () => {
    const registryNames = WORKFLOWS.filter(w => w.agent === WADE_ID).map(w => w.name);
    for (const wfName of registryNames) {
      assert.ok(
        !WAVE3_WORKFLOW_NAMES.has(wfName),
        `Wade (${WADE_ID}): workflow "${wfName}" should NOT be in WAVE3_WORKFLOW_NAMES (Wave 1 agent)`
      );
    }
  });

  it('persona cross-validation: registry and agent file roles share "Validated Learning" keyword', () => {
    assert.ok(
      wadeRegistry.persona.role.includes('Validated Learning'),
      `Wade (${WADE_ID}): registry persona.role should contain "Validated Learning"`
    );
    assert.ok(
      def.persona.role.includes('Validated Learning'),
      `Wade (${WADE_ID}): agent file <role> should contain "Validated Learning"`
    );
  });

  it('persona cross-validation: communication styles share "validated learning" pattern', () => {
    assert.ok(
      wadeRegistry.persona.communication_style.includes('validated learning'),
      `Wade (${WADE_ID}): registry communication_style should contain "validated learning"`
    );
    assert.ok(
      def.persona.communication_style.includes('validated learning'),
      `Wade (${WADE_ID}): agent file <communication_style> should contain "validated learning"`
    );
  });

  it('agent tag name matches registry name exactly', () => {
    assert.equal(
      def.agentAttrs.name,
      wadeRegistry.name,
      `Wade (${WADE_ID}): agent tag name "${def.agentAttrs.name}" should match registry name "${wadeRegistry.name}"`
    );
  });

  it('agent tag icon matches registry icon', () => {
    assert.equal(
      def.agentAttrs.icon,
      wadeRegistry.icon,
      `Wade (${WADE_ID}): agent tag icon should match registry icon`
    );
  });
});
