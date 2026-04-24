'use strict';

const path = require('path');
const fs = require('fs');
const assert = require('node:assert/strict');

const { AGENTS, WORKFLOWS } = require('../../scripts/update/lib/agent-registry');

const PACKAGE_ROOT = path.join(__dirname, '..', '..');
const VORTEX_DIR = path.join(PACKAGE_ROOT, '_bmad', 'bme', '_vortex');
const AGENTS_DIR = path.join(VORTEX_DIR, 'agents');
const WORKFLOWS_DIR = path.join(VORTEX_DIR, 'workflows');
const STEP_PATTERN = /^step-\d{2}(-[^.]+)?\.md$/;

// ─── Agent Discovery ────────────────────────────────────────────

/**
 * Discover all registered agents with resolved filesystem paths.
 * Derives everything from agent-registry.js — zero hardcoded values.
 *
 * @returns {Array<object>} Enriched agent objects with:
 *   - All original registry fields (id, name, icon, title, stream, persona)
 *   - agentFilePath: absolute path to agent definition .md file
 *   - workflowNames: array of workflow name strings for this agent
 *   - workflowDirs: array of absolute paths to workflow directories
 */
function discoverAgents() {
  return AGENTS.map(agent => {
    const agentWorkflows = WORKFLOWS.filter(w => w.agent === agent.id);
    const workflowNames = agentWorkflows.map(w => w.name);
    const workflowDirs = workflowNames.map(name =>
      path.join(WORKFLOWS_DIR, name)
    );

    return {
      ...agent,
      // Story v63-3-1: Vortex migrated to skill-dir layout (<id>/SKILL.md).
      agentFilePath: path.join(AGENTS_DIR, agent.id, 'SKILL.md'),
      workflowNames,
      workflowDirs,
    };
  });
}

// ─── Agent Definition Parsing ───────────────────────────────────

/**
 * Load and parse an agent definition file.
 * Extracts YAML frontmatter and XML activation block.
 *
 * @param {string} agentId - Agent ID (e.g., 'contextualization-expert')
 * @returns {object} Parsed agent definition:
 *   - frontmatter: { name, description }
 *   - agentAttrs: { id, name, title, icon } from <agent> tag
 *   - persona: { role, identity, communication_style, principles }
 *   - menuItems: array of { cmd } objects
 *   - activationSteps: array of step numbers found
 *   - hasErrorHandling: boolean (step 2 contains error handling)
 */
function loadAgentDefinition(agentId) {
  // Story v63-3-1: Vortex migrated to skill-dir layout (<id>/SKILL.md).
  const filePath = path.join(AGENTS_DIR, agentId, 'SKILL.md');
  const content = fs.readFileSync(filePath, 'utf8');

  // Parse YAML frontmatter (between --- markers)
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = {};
  if (frontmatterMatch) {
    const fmLines = frontmatterMatch[1].split('\n');
    for (const line of fmLines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        const val = line.slice(colonIdx + 1).trim().replace(/^"|"$/g, '');
        frontmatter[key] = val;
      }
    }
  }

  // Extract <agent ...> attributes
  const agentTagMatch = content.match(/<agent\s+([^>]+)>/);
  const agentAttrs = {};
  if (agentTagMatch) {
    const attrStr = agentTagMatch[1];
    const attrRegex = /(\w+)="([^"]*)"/g;
    let m;
    while ((m = attrRegex.exec(attrStr)) !== null) {
      agentAttrs[m[1]] = m[2];
    }
  }

  // Extract persona fields
  const persona = {};
  const personaFields = ['role', 'identity', 'communication_style', 'principles'];
  for (const field of personaFields) {
    const fieldRegex = new RegExp(`<${field}>([\\s\\S]*?)</${field}>`);
    const match = content.match(fieldRegex);
    if (match) {
      persona[field] = match[1].trim();
    }
  }

  // Extract menu items with cmd attributes
  const menuItems = [];
  const menuItemRegex = /<item\s+cmd="([^"]+)"[^>]*>/g;
  let menuMatch;
  while ((menuMatch = menuItemRegex.exec(content)) !== null) {
    menuItems.push({ cmd: menuMatch[1] });
  }

  // Extract activation step numbers
  const activationSteps = [];
  const stepRegex = /<step\s+n="([^"]+)">/g;
  let stepMatch;
  while ((stepMatch = stepRegex.exec(content)) !== null) {
    activationSteps.push(stepMatch[1]);
  }

  // Check for error handling in step 2 (CONFIG_NOT_FOUND, CONFIG_MISSING_FIELDS)
  const step2Match = content.match(/<step n="2">([\s\S]*?)(?:<step n="3">|<\/activation>)/);
  const hasErrorHandling = step2Match
    ? step2Match[1].includes('Configuration Error') || step2Match[1].includes('STOP')
    : false;

  return {
    frontmatter,
    agentAttrs,
    persona,
    menuItems,
    activationSteps,
    hasErrorHandling,
  };
}

// ─── Validation Functions ───────────────────────────────────────

/**
 * Validate an agent's activation structure against registry data.
 *
 * @param {object} agent - Registry agent object (from AGENTS)
 * @param {object} agentDef - Parsed agent definition (from loadAgentDefinition)
 * @returns {Array<object>} Array of validation issues: { field, expected, actual, severity }
 */
function validateActivation(agent, agentDef) {
  const issues = [];

  // Check persona fields present in definition (first 3 fields).
  // Presence-only check: registry stores single-line escaped strings while
  // agent definitions use multi-line XML content, so exact value comparison
  // would always fail due to format differences.
  const registryPersonaFields = ['role', 'identity', 'communication_style'];
  for (const field of registryPersonaFields) {
    if (!agentDef.persona[field]) {
      issues.push({
        field: `persona.${field}`,
        expected: 'present',
        actual: 'missing',
        severity: 'high',
      });
    }
  }

  // Check principles field exists (named differently from registry's expertise)
  if (!agentDef.persona.principles) {
    issues.push({
      field: 'persona.principles',
      expected: 'present (maps to registry expertise)',
      actual: 'missing',
      severity: 'medium',
    });
  }

  // Check menu items (at least 5)
  if (agentDef.menuItems.length < 5) {
    issues.push({
      field: 'menu items',
      expected: 'at least 5',
      actual: String(agentDef.menuItems.length),
      severity: 'high',
    });
  }

  // Check activation steps (should have 7: "1" through "7", plus possibly "{HELP_STEP}")
  const numericSteps = agentDef.activationSteps.filter(s => /^\d+$/.test(s));
  if (numericSteps.length < 7) {
    issues.push({
      field: 'activation steps',
      expected: 'at least 7 numeric steps',
      actual: `${numericSteps.length} numeric steps found`,
      severity: 'high',
    });
  }

  // Check error handling in step 2
  if (!agentDef.hasErrorHandling) {
    issues.push({
      field: 'error handling (step 2)',
      expected: 'Configuration Error handling present',
      actual: 'not found',
      severity: 'medium',
    });
  }

  // Check agent attributes match registry
  if (agentDef.agentAttrs.name && agentDef.agentAttrs.name !== agent.name) {
    issues.push({
      field: 'agent name attribute',
      expected: agent.name,
      actual: agentDef.agentAttrs.name,
      severity: 'high',
    });
  }

  return issues;
}

/**
 * Validate a workflow's directory structure.
 *
 * @param {string} workflowName - Workflow name (e.g., 'lean-persona')
 * @param {string} [workflowsDir] - Optional override for workflows directory
 * @returns {object} Validation result:
 *   - valid: boolean
 *   - issues: Array<{ field, expected, actual }>
 *   - stepCount: number
 *   - stepFiles: string[]
 */
function validateWorkflowStructure(workflowName, workflowsDir) {
  const baseDir = workflowsDir || WORKFLOWS_DIR;
  const wfDir = path.join(baseDir, workflowName);
  const issues = [];
  let stepCount = 0;
  let stepFiles = [];

  // Check workflow directory exists
  if (!fs.existsSync(wfDir)) {
    issues.push({
      field: 'workflow directory',
      expected: `directory at ${wfDir}`,
      actual: 'not found',
    });
    return { valid: false, issues, stepCount, stepFiles };
  }

  // Check workflow.md exists
  const workflowMd = path.join(wfDir, 'workflow.md');
  if (!fs.existsSync(workflowMd)) {
    issues.push({
      field: 'workflow.md',
      expected: 'file exists',
      actual: 'not found',
    });
  }

  // Check steps/ subdirectory exists
  const stepsDir = path.join(wfDir, 'steps');
  if (!fs.existsSync(stepsDir)) {
    issues.push({
      field: 'steps/ directory',
      expected: 'directory exists',
      actual: 'not found',
    });
    return { valid: false, issues, stepCount, stepFiles };
  }

  // Read step files — accepts both step-NN-name.md and step-NN.md patterns
  const allFiles = fs.readdirSync(stepsDir);
  stepFiles = allFiles.filter(f => STEP_PATTERN.test(f)).sort();
  stepCount = stepFiles.length;

  // Check step count (4-6 inclusive)
  if (stepCount < 4 || stepCount > 6) {
    issues.push({
      field: 'step count',
      expected: '4-6 steps',
      actual: `${stepCount} steps`,
    });
  }

  // Check all step files match naming pattern
  for (const file of allFiles) {
    if (file.endsWith('.md') && !STEP_PATTERN.test(file)) {
      issues.push({
        field: 'step file naming',
        expected: 'step-NN-*.md or step-NN.md pattern',
        actual: file,
      });
    }
  }

  return { valid: issues.length === 0, issues, stepCount, stepFiles };
}

// ─── Assertion Helpers ──────────────────────────────────────────

/**
 * Assert an agent field matches expected value with diagnostic message.
 * Format: "{agent.name} ({agent.id}): {field} — expected '{expected}', got '{actual}'"
 */
function assertAgentField(agent, field, expected, actual) {
  assert.strictEqual(
    actual,
    expected,
    `${agent.name} (${agent.id}): ${field} — expected '${expected}', got '${actual}'`
  );
}

/**
 * Assert a file exists with diagnostic context message.
 * Format: "{context}: file not found at {filePath}"
 */
function assertFileExists(filePath, context) {
  assert.ok(
    fs.existsSync(filePath),
    `${context}: file not found at ${filePath}`
  );
}

/**
 * Assert a directory exists with diagnostic context message.
 */
function assertDirExists(dirPath, context) {
  assert.ok(
    fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory(),
    `${context}: directory not found at ${dirPath}`
  );
}

// ─── Exports ─────────────────────────────────────────────────────

module.exports = {
  PACKAGE_ROOT,
  VORTEX_DIR,
  AGENTS_DIR,
  WORKFLOWS_DIR,
  STEP_PATTERN,
  discoverAgents,
  loadAgentDefinition,
  validateActivation,
  validateWorkflowStructure,
  assertAgentField,
  assertFileExists,
  assertDirExists,
};
