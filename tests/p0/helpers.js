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
 * Parse YAML frontmatter (between --- markers). Common to v5 + v6.3.
 */
function parseFrontmatter(content) {
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
  return frontmatter;
}

/**
 * Escape regex meta-characters so a heading string can be safely interpolated
 * into a `RegExp` constructor literal. (i97-bug-1 R1 review fix.)
 */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract the body of a v6.3 markdown section by heading text.
 * Returns content from after `## {heading}` line to the next `## ` heading or EOF.
 * Returns null if the heading isn't found; returns an empty string if the
 * heading is the very last line of the file.
 */
function extractMarkdownSection(content, heading) {
  const headingPattern = new RegExp(`^## ${escapeRegex(heading)}\\s*$`, 'm');
  const start = content.search(headingPattern);
  if (start === -1) return null;
  const newlineIdx = content.indexOf('\n', start);
  if (newlineIdx === -1) return ''; // heading is the literal final line; section body is empty
  const afterHeading = newlineIdx + 1;
  const tail = content.slice(afterHeading);
  const nextHeadingMatch = tail.match(/^## /m);
  const end = nextHeadingMatch ? afterHeading + nextHeadingMatch.index : content.length;
  return content.slice(afterHeading, end).trim();
}

/**
 * Parse a v5 (XML-in-markdown) agent definition.
 * Format markers: `<agent id="..." name="..." title="..." icon="...">` opening tag
 * present in the file body. Persona via `<role>`, `<identity>`,
 * `<communication_style>`, `<principles>` tags. Menu items via `<item cmd="...">`.
 * Activation steps via `<step n="N">`. Error handling in step 2 = substring
 * `Configuration Error` or `STOP` inside `<step n="2">` body.
 */
function parseV5Definition(content) {
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

  // Extract persona fields from XML tags
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

  // Step-2 error handling: substring `Configuration Error` or `STOP`
  const step2Match = content.match(/<step n="2">([\s\S]*?)(?:<step n="3">|<\/activation>)/);
  const hasErrorHandling = step2Match
    ? step2Match[1].includes('Configuration Error') || step2Match[1].includes('STOP')
    : false;

  return { agentAttrs, persona, menuItems, activationSteps, hasErrorHandling };
}

/**
 * Parse a v6.3 (outcome-based markdown, zero XML) agent definition per the
 * I97 conversion convention (verified uniform across Emma, Wade, Mila 2026-05-03).
 *
 * Format conventions:
 * - Frontmatter `name: bmad-bme-agent-{first-name}` (BMB-canonical, NOT registry-name).
 * - Display name = first H1 heading after frontmatter (`# Emma`).
 * - `## Identity`, `## Communication Style`, `## Principles` headings supply persona.
 * - `## Capabilities` markdown table with `| Code | Description | Skill |` header;
 *   non-separator rows are menu items (cmd = first column).
 * - `## On Activation` numbered markdown list; top-level `N.` items are activation steps.
 * - Step-2 error-handling: v6.3 convention delegates config-error semantics to
 *   `bmad-init` (invoked in step 1, satisfies Operator Covenant OC-R3 via interactive
 *   walkthrough). The format-aware test treats step-1 reference to `bmad-init` as
 *   v6.3's canonical satisfaction signal. Explicit `Configuration Error` / `STOP`
 *   substring inside step 2 is also accepted (forward-compatibility).
 *
 * `agentAttrs` for v6.3: file body doesn't carry v5-style `id`/`title`/`icon`
 * literals — those live in the registry by design. We synthesize:
 *   - `id` = `${registryAgent.id}.agent.yaml` (mirrors v5 convention)
 *   - `name` = the H1 display heading (TESTABLE — must match registry name)
 *   - `title` / `icon` = registry values (presence-only assertion in P0)
 */
function parseV63Definition(content, registryAgent) {
  // H1 display name (first `# {Name}` after frontmatter)
  const h1Match = content.match(/^#\s+(.+?)\s*$/m);
  const displayName = h1Match ? h1Match[1].trim() : '';

  const agentAttrs = {
    id: registryAgent ? `${registryAgent.id}.agent.yaml` : '',
    name: displayName,
    title: registryAgent ? registryAgent.title : '',
    icon: registryAgent ? registryAgent.icon : '',
  };

  // Persona from headings
  const persona = {};
  const identitySection = extractMarkdownSection(content, 'Identity');
  if (identitySection) {
    persona.identity = identitySection;
    // v6.3 merges role into identity (no separate ## Role heading); use identity
    // as the role surrogate so the v5-shape `persona.role` presence assertion holds.
    persona.role = identitySection;
  }
  const csSection = extractMarkdownSection(content, 'Communication Style');
  if (csSection) persona.communication_style = csSection;
  const prinSection = extractMarkdownSection(content, 'Principles');
  if (prinSection) persona.principles = prinSection;

  // Menu items from ## Capabilities markdown table (rows excluding separator)
  const menuItems = [];
  const capsSection = extractMarkdownSection(content, 'Capabilities');
  if (capsSection) {
    const tableLines = capsSection.split('\n').filter(l => l.trim().startsWith('|'));
    // tableLines[0] = header (`| Code | Description | Skill |`)
    // tableLines[1] = separator (`|------|...|`)
    // tableLines[2..] = capability rows
    for (let i = 2; i < tableLines.length; i++) {
      const cells = tableLines[i].split('|').map(c => c.trim()).filter(c => c.length > 0);
      if (cells.length >= 1 && cells[0]) {
        menuItems.push({ cmd: cells[0] });
      }
    }
  }

  // Activation steps from ## On Activation numbered list
  const activationSteps = [];
  const activSection = extractMarkdownSection(content, 'On Activation');
  if (activSection) {
    const stepLineRegex = /^(\d+)\.\s/gm;
    let stepM;
    while ((stepM = stepLineRegex.exec(activSection)) !== null) {
      activationSteps.push(stepM[1]);
    }
  }

  // Step-2 error handling per v6.3 convention
  let hasErrorHandling = false;
  if (activSection) {
    // Step 1 body: from "1." line to "2." line (or end of section)
    const step1Match = activSection.match(/^1\.([\s\S]*?)(?=^2\.|$(?![\s\S]))/m);
    // Tighten: require structural marker (bold-prefixed "Load config via bmad-init")
    // rather than bare substring, to avoid false positives on prose mentioning the
    // string. (i97-bug-1 R1 review fix.) Verified canonical across Emma/Wade/Mila.
    if (step1Match && /\*\*[^*]*Load config via `?bmad-init/i.test(step1Match[1])) {
      hasErrorHandling = true;
    }
    // Forward-compatibility: also accept explicit `Configuration Error` / `STOP` in step 2
    if (!hasErrorHandling) {
      const step2Match = activSection.match(/^2\.([\s\S]*?)(?=^3\.|$(?![\s\S]))/m);
      if (step2Match && (step2Match[1].includes('Configuration Error') || step2Match[1].includes('STOP'))) {
        hasErrorHandling = true;
      }
    }
  }

  return { agentAttrs, persona, menuItems, activationSteps, hasErrorHandling };
}

/**
 * Load and parse an agent definition file. Format-aware (i97-bug-1):
 * detects v5 (XML-in-markdown) vs v6.3 (outcome-based markdown) via a
 * mechanical content-based discriminator and dispatches to the matching
 * parser. Returns a uniform shape so `tests/p0/p0-activation.test.js` can
 * stay format-agnostic.
 *
 * Format discriminator: presence of `<agent ` opening tag in the file body.
 * - Match → v5 (e.g., un-converted Vortex agents at I97 Epic 2 ship time).
 * - No match → v6.3 (e.g., Emma, Wade, Mila post-i97-2-1/2-2/SKILL-2-3-migration).
 *
 * @param {string} agentId - Agent ID (e.g., 'contextualization-expert')
 * @returns {object} Parsed agent definition:
 *   - frontmatter: { name, description }
 *   - agentAttrs: { id, name, title, icon }
 *   - persona: { role, identity, communication_style, principles }
 *   - menuItems: array of { cmd } objects
 *   - activationSteps: array of step numbers found
 *   - hasErrorHandling: boolean (step 2 has error-handling; v6.3 = step-1
 *     `bmad-init` reference satisfies; v5 = `Configuration Error`/`STOP` substring)
 */
function loadAgentDefinition(agentId) {
  // Story v63-3-1: Vortex migrated to skill-dir layout (<id>/SKILL.md).
  const filePath = path.join(AGENTS_DIR, agentId, 'SKILL.md');
  const content = fs.readFileSync(filePath, 'utf8');

  const frontmatter = parseFrontmatter(content);

  // Format-aware dispatch (i97-bug-1):
  //
  // The discriminator looks for `<agent\s+` (the v5 tag opener) anywhere in
  // the file. v5 SKILL.md files wrap their agent definition in a ```xml code
  // fence, so the tag appears inside fenced content; v6.3 files have NO XML
  // anywhere (verified across Emma/Wade/Mila 2026-05-03 — `grep -c "<agent " *`
  // returns 0 for v6.3 and 1 for v5).
  //
  // R1 review note (i97-bug-1): an earlier version of this discriminator
  // stripped code fences first to avoid false-positives on v6.3 files that
  // *cite* `<agent ...>` in a documentation example. That regressed because
  // v5 files HAVE their real `<agent>` inside a fence — stripping fences
  // misclassified all v5 agents as v6.3. The hypothetical false-positive
  // (v6.3 file with fenced v5 example) is not present in any current SKILL.md
  // and would be caught downstream by `parseV5Definition` finding no real
  // `<role>`/`<step>` content. Keep the simple heuristic.
  const isV5 = /<agent\s+/.test(content);
  const format = isV5 ? 'v5' : 'v6.3';
  const formatSpecific = isV5
    ? parseV5Definition(content)
    : parseV63Definition(content, AGENTS.find(a => a.id === agentId));

  return { frontmatter, format, ...formatSpecific };
}

// Minimum numeric activation steps per format. v5 wraps each tiny action as its
// own `<step n="N">`; v6.3 consolidates into top-level numbered items with
// sub-bullets, so the absolute count is lower while the activation-flow
// coverage is equivalent. Verified canonical floors 2026-05-03:
//   v5 (Isla, Noah, Max, Liam): 7+ numeric steps via XML
//   v6.3 (Emma, Wade, Mila): exactly 3 top-level numbered items
const MIN_NUMERIC_ACTIVATION_STEPS = Object.freeze({ v5: 7, 'v6.3': 3 });

// ─── Format-Aware Per-Agent Test Helpers (i97-bug-1) ────────────
//
// The per-agent P0 test files (p0-emma.test.js, p0-wade.test.js, p0-mila.test.js)
// were written against the v5 XML-in-markdown contract. The helpers below let
// those tests express the same SEMANTIC contracts in a format-aware way:
//
//   - "agent self-describes with role keyword"  → search agent's full file content
//   - "exec-paths reference existing files"     → v5: <item exec="..."> regex;
//                                                  v6.3: ## Capabilities table
//                                                        Skill column refs
//   - "step 2 has config-error handling"        → v5: <step n="2"> body substring;
//                                                  v6.3: hasErrorHandling field
//                                                        (already format-aware)
//   - "rules section has at least N rules"      → v5: count <r> tags;
//                                                  v6.3: count ## Principles bullets

/**
 * Format-aware extraction of "executable paths" referenced from the agent's
 * Capabilities/menu surface. Used for the "exec-path menu items reference
 * existing files on disk" P0 contract.
 *
 * v5: regex on `<item ... exec="path/...">` attributes.
 * v6.3: parse `## Capabilities` markdown table Skill column for canonical
 *       `Load \`./references/<file>.md\`` references (the v6.3 convention
 *       across Emma/Wade/Mila — verified 2026-05-03).
 */
function extractExecPaths(rawContent, format) {
  const paths = [];
  if (format === 'v5') {
    const execRegex = /<item\s[^>]*exec="([^"]+)"[^>]*>/g;
    let m;
    while ((m = execRegex.exec(rawContent)) !== null) {
      paths.push(m[1]);
    }
    return paths;
  }
  // v6.3
  const capsSection = extractMarkdownSection(rawContent, 'Capabilities');
  if (!capsSection) return paths;
  // Each capability row: `| CODE | description | Load \`./references/<file>.md\` |`
  // (The Skill column may also reference standalone skills like `bmad-party-mode`,
  // which are NOT file-existence-checkable — only `./references/...` are.)
  const refPattern = /Load `(\.\/references\/[^`]+)`/g;
  let m;
  while ((m = refPattern.exec(capsSection)) !== null) {
    paths.push(m[1]);
  }
  return paths;
}

/**
 * Resolve a v6.3 capability-prompt reference (e.g. `./references/lean-persona.md`)
 * to an absolute filesystem path, given the agent's SKILL.md directory.
 *
 * v6.3 capability prompts are agent-relative (`./references/<file>.md` next to
 * the agent's SKILL.md), unlike v5's project-root-relative `{project-root}/...`.
 */
function resolveExecPath(execPath, agentDir, packageRoot) {
  if (execPath.startsWith('./')) {
    return path.resolve(agentDir, execPath);
  }
  return execPath.replace(/\{project-root\}/g, packageRoot);
}

/**
 * Format-aware "rules count" — v5 counts `<r>` tags; v6.3 counts the bullet
 * items in the `## Principles` section.
 */
function countRules(def, rawContent) {
  if (def.format === 'v5') {
    const ruleMatches = rawContent.match(/<r>/g);
    return ruleMatches ? ruleMatches.length : 0;
  }
  // v6.3
  if (!def.persona.principles) return 0;
  return def.persona.principles
    .split('\n')
    .filter(line => /^\s*[-*]\s/.test(line))
    .length;
}

/**
 * Format-aware "step 2 has config-error handling" — v5 inspects `<step n="2">`
 * body; v6.3 uses the already-format-aware `def.hasErrorHandling` (which is
 * true iff step 1 has the canonical `**Load config via bmad-init` marker, OR
 * step 2 has explicit `Configuration Error` / `STOP` substring as fallback).
 */
function hasConfigErrorHandling(def, rawContent) {
  if (def.format === 'v5') {
    const step2Match = rawContent.match(/<step n="2">([\s\S]*?)<step n="3">/);
    if (!step2Match) return false;
    return step2Match[1].includes('config.yaml') && step2Match[1].includes('Configuration Error');
  }
  // v6.3 — use the field set by parseV63Definition
  return def.hasErrorHandling;
}

/**
 * Format-aware content search for an agent self-description keyword (e.g.,
 * "Product Context Architect" for Emma). v5 agents carry these phrases inside
 * a single `<role>` tag; v6.3 distributes the same descriptor across the H1
 * heading, `## Overview`, `## Identity`, frontmatter description, etc. — so
 * a presence-anywhere check on the full file content is the honest semantic
 * test.
 */
function fileMentions(rawContent, keyword) {
  return rawContent.includes(keyword);
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

  // Check activation steps — format-aware floor (i97-bug-1)
  const numericSteps = agentDef.activationSteps.filter(s => /^\d+$/.test(s));
  const minSteps = MIN_NUMERIC_ACTIVATION_STEPS[agentDef.format] ?? 7;
  if (numericSteps.length < minSteps) {
    issues.push({
      field: 'activation steps',
      expected: `at least ${minSteps} numeric steps (${agentDef.format} contract)`,
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
  MIN_NUMERIC_ACTIVATION_STEPS,
  discoverAgents,
  loadAgentDefinition,
  extractMarkdownSection,
  extractExecPaths,
  resolveExecPath,
  countRules,
  hasConfigErrorHandling,
  fileMentions,
  validateActivation,
  validateWorkflowStructure,
  assertAgentField,
  assertFileExists,
  assertDirExists,
};
