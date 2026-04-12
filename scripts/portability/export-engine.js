/**
 * export-engine.js — Story sp-2-2
 *
 * Pure-transform export engine for converting Tier 1 BMAD skills into the
 * canonical LLM-agnostic format defined in
 * scripts/portability/templates/canonical-format.md.
 *
 * The engine is read-only: it reads source files, returns transformed
 * strings, and never writes anything. The CLI (sp-2-3) handles file output.
 *
 * Usage:
 *   const { exportSkill } = require('./scripts/portability/export-engine');
 *   const result = exportSkill('bmad-brainstorming', findProjectRoot());
 *   // result = { instructions, persona, sections, warnings }
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { readManifest } = require('./manifest-csv');

// =============================================================================
// CONSTANTS
// =============================================================================

const META_SECTIONS_TO_STRIP = [
  'MANDATORY EXECUTION RULES',
  'EXECUTION PROTOCOLS',
  'CONTEXT BOUNDARIES',
  'SUCCESS METRICS',
  'FAILURE MODES',
  'SYSTEM SUCCESS/FAILURE METRICS',
  'ROLE REINFORCEMENT',
  'STEP-SPECIFIC RULES',
  'NEXT STEPS',
  'NEXT STEP',
];

const ALLOWED_WARNING_TYPES = new Set([
  'hook-script-stripped',
  'unresolved-template-path',
  'deep-conditional-skipped',
  'unstripped-xml-tag',
  'step-file-not-found',
]);

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Recursively search a directory tree for a file by basename.
 * Returns the first match found, or null.
 */
function findFileByName(dir, basename) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findFileByName(full, basename);
        if (found) return found;
      } else if (entry.name === basename) {
        return full;
      }
    }
  } catch (_) {
    // Permission error, symlink loop, etc. — skip silently
  }
  return null;
}

// =============================================================================
// SOURCE LOADERS
// =============================================================================

/**
 * Read the skill manifest row for a given skill name.
 * Throws if the skill is not in the manifest.
 */
function loadSkillRow(skillName, projectRoot) {
  const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
  const { header, rows } = readManifest(manifestPath);
  const nameIdx = header.indexOf('name');
  const row = rows.find((r) => r[nameIdx] === skillName);
  if (!row) {
    throw new Error(
      `Skill "${skillName}" is not in the manifest at ${path.relative(projectRoot, manifestPath)}.`
    );
  }
  // Return as a structured object
  const result = {};
  for (let i = 0; i < header.length; i++) {
    result[header[i]] = row[i];
  }
  return result;
}

/**
 * Load a skill's source files: SKILL.md + workflow.md + step files.
 * Returns { skillContent, workflowContent, stepContents }
 * where stepContents is { 'step-01-foo': '...', 'step-02a-bar': '...' }
 */
function loadSkillSource(skillRow, projectRoot, warnings) {
  const skillPath = path.join(projectRoot, skillRow.path);
  const skillContent = fs.existsSync(skillPath) ? fs.readFileSync(skillPath, 'utf8') : '';

  if (!skillContent) {
    throw new Error(`SKILL.md not found at ${path.relative(projectRoot, skillPath)}`);
  }

  // Try to find workflow.md as a sibling of SKILL.md
  const skillDir = path.dirname(skillPath);
  const workflowPath = path.join(skillDir, 'workflow.md');
  const workflowContent = fs.existsSync(workflowPath) ? fs.readFileSync(workflowPath, 'utf8') : '';

  // Find step files: scan steps/ subdirectory if it exists
  const stepContents = {};
  const stepsDir = path.join(skillDir, 'steps');
  if (fs.existsSync(stepsDir) && fs.statSync(stepsDir).isDirectory()) {
    const stepFiles = fs.readdirSync(stepsDir).filter((f) => f.endsWith('.md'));
    for (const stepFile of stepFiles) {
      const stepName = stepFile.replace(/\.md$/, '');
      stepContents[stepName] = fs.readFileSync(path.join(stepsDir, stepFile), 'utf8');
    }
  }

  // Also scan for step subdirectories with patterns like steps-c, steps-t, etc.
  const skillDirEntries = fs.readdirSync(skillDir, { withFileTypes: true });
  for (const entry of skillDirEntries) {
    if (entry.isDirectory() && entry.name.startsWith('steps-')) {
      const subStepsDir = path.join(skillDir, entry.name);
      const subStepFiles = fs.readdirSync(subStepsDir).filter((f) => f.endsWith('.md'));
      for (const stepFile of subStepFiles) {
        const stepName = stepFile.replace(/\.md$/, '');
        stepContents[stepName] = fs.readFileSync(path.join(subStepsDir, stepFile), 'utf8');
      }
    }
  }

  return { skillContent, workflowContent, stepContents, skillDir };
}

// =============================================================================
// PERSONA RESOLUTION
// =============================================================================

/**
 * Read the agent manifest and return all rows as objects.
 */
function loadAgentManifest(projectRoot) {
  const manifestPath = path.join(projectRoot, '_bmad', '_config', 'agent-manifest.csv');
  const { header, rows } = readManifest(manifestPath);
  return rows.map((row) => {
    const obj = {};
    for (let i = 0; i < header.length; i++) {
      obj[header[i]] = row[i];
    }
    return obj;
  });
}

/**
 * Shared agent-manifest matching logic (Strategies 1 + 2 + 2b).
 * No file I/O — operates purely on the passed-in agents array.
 * Returns the matched agent row object, or null if no match.
 */
const CIS_SKILL_TO_AGENT = {
  'bmad-cis-storytelling': 'bmad-cis-agent-storyteller',
  'bmad-cis-innovation-strategy': 'bmad-cis-agent-innovation-strategist',
  'bmad-cis-problem-solving': 'bmad-cis-agent-creative-problem-solver',
};

// BME agent short-name mapping (agent-manifest uses short names like "Emma")
const BME_SKILL_TO_AGENT = {
  'bmad-agent-bme-contextualization-expert': 'Emma',
  'bmad-agent-bme-discovery-empathy-expert': 'Isla',
  'bmad-agent-bme-research-convergence-specialist': 'Mila',
  'bmad-agent-bme-hypothesis-engineer': 'Liam',
  'bmad-agent-bme-lean-experiments-specialist': 'Wade',
  'bmad-agent-bme-production-intelligence-specialist': 'Noah',
  'bmad-agent-bme-learning-decision-expert': 'Max',
  'bmad-agent-bme-stack-detective': 'Scout',
  'bmad-agent-bme-model-curator': 'Atlas',
  'bmad-agent-bme-readiness-analyst': 'Lens',
  'bmad-agent-bme-review-coach': 'Coach',
  'bmad-agent-bme-team-factory': 'Loom Master',
};

function findAgentMatch(skillName, agents) {
  // Strategy 1: exact name match
  let agent = agents.find((a) => a.name === skillName);
  if (agent) return agent;

  // Strategy 2: bmad-cis-agent-* pattern transformation
  const base = skillName.startsWith('bmad-cis-')
    ? skillName.replace(/^bmad-cis-/, 'bmad-cis-agent-')
    : skillName.replace(/^bmad-/, 'bmad-cis-agent-');
  const candidates = [base, base + '-coach', base + '-specialist', base + '-expert'];
  for (const candidate of candidates) {
    agent = agents.find((a) => a.name === candidate);
    if (agent) return agent;
  }

  // Strategy 2b: alias map for CIS stem mismatches
  const aliasName = CIS_SKILL_TO_AGENT[skillName];
  if (aliasName) {
    agent = agents.find((a) => a.name === aliasName);
    if (agent) return agent;
  }

  // Strategy 2c: BME agent short-name mapping (Emma, Isla, Scout, etc.)
  const bmeShortName = BME_SKILL_TO_AGENT[skillName];
  if (bmeShortName) {
    agent = agents.find((a) => a.name === bmeShortName);
    if (agent) return agent;
  }

  return null;
}

/**
 * Lightweight persona summary for catalog generation.
 * Uses Strategies 1+2+2b only (no file reads). Falls back to humanized name + 🔧.
 * @param {string} skillName
 * @param {object[]} agents - array of agent-manifest row objects
 * @returns {{ name: string, icon: string }}
 */
function resolvePersonaSummary(skillName, agents) {
  const agent = findAgentMatch(skillName, agents);
  if (agent) {
    return { name: agent.displayName || agent.name, icon: agent.icon || '' };
  }
  return { name: humanizeSkillName(skillName), icon: '🔧' };
}

/**
 * Resolve a persona for the given skill via the 5-strategy fallback chain.
 * Strategies 1-4 use agent-manifest or inline extraction. Strategy 5
 * synthesizes a minimal persona from workflow content (never throws).
 */
function loadPersona(skillName, skillContent, workflowContent, projectRoot) {
  const agents = loadAgentManifest(projectRoot);

  // Strategies 1 + 2 + 2b: manifest-based matching (shared with resolvePersonaSummary)
  let agent = findAgentMatch(skillName, agents);

  // Strategy 3: description fuzzy match (look for "talk to <Name>")
  if (!agent) {
    const allContent = skillContent + '\n' + workflowContent;
    const nameMatch = allContent.match(/\b(?:talk to|requests? the|asks? to talk to|asks? for)\s+([A-Z][a-z]+)/);
    if (nameMatch) {
      const candidateName = nameMatch[1];
      agent = agents.find((a) => a.displayName === candidateName);
    }
  }

  // Strategy 4: inline extraction from skill content
  if (!agent) {
    const inline = extractInlinePersona(skillContent + '\n' + workflowContent);
    if (inline) return inline;
  }

  // Strategy 5: synthesize minimal persona from workflow/skill content (sp-2-4)
  if (!agent) {
    return synthesizePersonaFromWorkflow(skillName, skillContent, workflowContent, projectRoot);
  }

  // Convert agent row to persona object
  return {
    name: agent.displayName,
    icon: agent.icon || '',
    title: agent.title || '',
    role: agent.role || '',
    identity: agent.identity || '',
    communicationStyle: agent.communicationStyle || '',
    principles: agent.principles || '',
    source: 'agent-manifest',
  };
}

/**
 * Strategy 4: extract persona from inline markers in skill source.
 * Looks for `# <Name>`, `## Identity`, `## Communication Style`, `## Principles` headings.
 */
function extractInlinePersona(content) {
  // Try to find a top-level `# Name` heading near the start
  const lines = content.split('\n');
  let name = null;
  for (let i = 0; i < Math.min(50, lines.length); i++) {
    const m = lines[i].match(/^#\s+([A-Z][a-zA-Z]+)\s*$/);
    if (m) {
      name = m[1];
      break;
    }
  }

  if (!name) return null;

  // Extract sections by heading
  const identity = extractSectionByHeading(content, 'Identity');
  const commStyle = extractSectionByHeading(content, 'Communication Style');
  const principles = extractSectionByHeading(content, 'Principles');
  const overview = extractSectionByHeading(content, 'Overview');

  if (!identity && !commStyle && !principles) return null;

  // Try to find an icon emoji near the name
  const iconMatch = content.match(new RegExp(`#\\s+${name}\\s*([\\p{Emoji}])`, 'u'));
  const icon = iconMatch ? iconMatch[1] : '';

  return {
    name,
    icon,
    title: overview ? overview.split('\n')[0].slice(0, 80) : '',
    role: '',
    identity: identity || overview || '',
    communicationStyle: commStyle || '',
    principles: principles || '',
    source: 'inline',
  };
}

/**
 * Strategy 5: synthesize a minimal persona from workflow/skill content.
 * Used for tool-like and wrapper skills that have no agent-manifest row
 * and no inline persona block. Always returns a valid persona — never throws.
 */
function synthesizePersonaFromWorkflow(skillName, skillContent, workflowContent, projectRoot) {
  const allContent = skillContent + '\n' + workflowContent;

  // Name: humanized skill name (e.g., bmad-distillator → Distillator)
  const name = humanizeSkillName(skillName);

  // Role: extract from **Goal:** line, or Your Role: line, or fall back to skill name
  let role = '';
  const goalMatch = allContent.match(/\*\*Goal:\*\*\s*(.+?)(?:\n|$)/);
  if (goalMatch) {
    role = goalMatch[1].trim();
  } else {
    const roleMatch = allContent.match(/(?:\*\*)?Your Role:?\*?\*?\s*(.+?)(?:\n|$)/i);
    if (roleMatch) role = roleMatch[1].trim();
  }

  // Identity: ## Overview first paragraph, or manifest description
  let identity = '';
  const overview = extractSectionByHeading(allContent, 'Overview');
  if (overview) {
    // First non-empty paragraph
    const para = overview.split(/\n\n/)[0];
    identity = para ? para.trim().slice(0, 200) : '';
  }
  if (!identity) {
    // Fall back to manifest description. Wrapped in try/catch to preserve the
    // "never throws" contract — manifest was already read earlier in the pipeline
    // but we re-read here for the description column.
    try {
      const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
      const { header, rows } = readManifest(manifestPath);
      const nameIdx = header.indexOf('name');
      const descIdx = header.indexOf('description');
      const row = rows.find((r) => r[nameIdx] === skillName);
      if (row && descIdx >= 0) {
        identity = (row[descIdx] || '').slice(0, 200);
      }
    } catch (_) {
      // Manifest read failed — identity stays empty, which is acceptable
    }
  }

  return {
    name,
    icon: '🔧',
    title: role || name,
    role: role || '',
    identity: identity || role || '',
    communicationStyle: '',
    principles: '',
    source: 'workflow-derived',
  };
}

/**
 * Extract a markdown section by heading name (case-insensitive).
 * Returns the content between `## <heading>` and the next `## ` heading.
 */
function extractSectionByHeading(content, headingName) {
  const re = new RegExp(`^##\\s+${headingName}\\s*$([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, 'mi');
  const m = content.match(re);
  if (!m) return null;
  return m[1].trim();
}

// =============================================================================
// TRANSFORMATION RULES (Phases 1-7)
// =============================================================================

/**
 * Apply all transformation rules in order. Pure functional, no side effects
 * except optional warning emission.
 */
function applyTransformations(text, warnings, options = {}) {
  let result = text;

  // Phase 1: Strip frontmatter blocks at the start of any block
  result = result.replace(/^---\n[\s\S]*?\n---\n/gm, '');

  // Phase 2: Strip XML/MDX tags (keep content)
  result = result.replace(/<\/?(workflow|step|action|check|critical|output|ask)(\s[^>]*)?>/g, '');

  // Phase 3: Strip framework calls (line-by-line)
  const frameworkPatterns = [
    /bmad-init/i,
    /bmad-help/i,
    /Skill:\s*bmad-/i,
    /\{project-root\}/,
    /\.claude\/hooks/,
    /bmad-speak/,
  ];
  result = result
    .split('\n')
    .filter((line) => {
      for (const pattern of frameworkPatterns) {
        if (pattern.test(line)) {
          // Track hook-script removals as warnings
          if (warnings && /\.claude\/hooks|bmad-speak/.test(line)) {
            warnings.push({
              type: 'hook-script-stripped',
              message: `stripped line: ${line.trim().slice(0, 100)}`,
            });
          }
          return false;
        }
      }
      return true;
    })
    .join('\n');

  // Phase 3b: Strip _bmad/ paths (after framework calls — those references are already gone)
  // Only strip lines whose primary content is a _bmad/ path (e.g., "Read _bmad/foo/bar.md").
  // Avoid stripping the line if _bmad/ appears only as a parenthetical or backtick reference.
  result = result
    .split('\n')
    .filter((line) => {
      // Strip lines that are predominantly a _bmad/ path
      if (/^\s*[`*-]?\s*_bmad\//.test(line)) return false;
      // Strip lines like "Load `{project-root}/_bmad/..." which the framework filter already caught
      return true;
    })
    .join('\n');

  // Phase 4: Strip micro-file directives
  const microFileDirectives = [
    /Load step:/i,
    /read fully and follow/i,
    /Read fully and execute:/i,
    /Load fully and follow:/i,
  ];
  result = result
    .split('\n')
    .filter((line) => !microFileDirectives.some((p) => p.test(line)))
    .join('\n');

  // Phase 5: Replace tool names
  // Order matters — longer/more specific patterns first
  result = result
    .replace(/(?:the\s+)?Read tool/g, 'read the file at')
    .replace(/(?:the\s+)?Edit tool/g, 'edit the file at')
    .replace(/(?:the\s+)?Write tool/g, 'create a file at')
    .replace(/(?:the\s+)?Bash tool/g, 'run the shell command')
    .replace(/(?:the\s+)?Glob tool/g, 'find files matching')
    .replace(/(?:the\s+)?Grep tool/g, 'search file contents for');

  // Skill tool: strip the entire line (Option A from Dev Notes)
  result = result
    .split('\n')
    .filter((line) => !/Skill tool/.test(line))
    .join('\n');

  // Phase 6: Substitute config vars (skipped when processing template content — preserves {{var}} placeholders)
  if (options.skipPhase6) {
    // Phase 7: Collapse whitespace (still applies even when Phase 6 is skipped)
    result = result.replace(/\n{3,}/g, '\n\n').trim();
    return result;
  }
  const configVarMap = {
    user_name: '[your name]',
    communication_language: '[your preferred language]',
    document_output_language: '[your document language]',
    output_folder: '[your output folder]',
    planning_artifacts: '[your planning artifacts directory]',
    implementation_artifacts: '[your implementation artifacts directory]',
  };
  for (const [varName, replacement] of Object.entries(configVarMap)) {
    const re = new RegExp(`\\{${varName}\\}`, 'g');
    result = result.replace(re, replacement);
  }
  // Also handle {{var}} double-brace forms
  for (const [varName, replacement] of Object.entries(configVarMap)) {
    const re = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
    result = result.replace(re, replacement);
  }

  // Strip any remaining {var} placeholders that weren't in the config map (avoid leakage).
  // Emit a warning per unique unmapped var so typos in configVarMap don't go silent.
  const unmappedSeen = new Set();
  result = result.replace(/\{\{?([\w_-]+)\}?\}/g, (_match, varName) => {
    if (warnings && !unmappedSeen.has(varName)) {
      unmappedSeen.add(varName);
      warnings.push({
        type: 'unresolved-template-path',
        message: `unmapped config var stripped via catch-all: {${varName}}`,
      });
    }
    return '[your context]';
  });

  // Phase 7: Collapse whitespace
  result = result.replace(/\n{3,}/g, '\n\n').trim();

  return result;
}

// =============================================================================
// SECTION EXTRACTORS
// =============================================================================

/**
 * Strip leading bmad- prefixes and convert kebab-case to title case.
 */
function humanizeSkillName(skillName) {
  return skillName
    .replace(/^bmad-cis-agent-/, '')
    .replace(/^bmad-agent-/, '')
    .replace(/^bmad-cis-/, '')
    .replace(/^bmad-/, '')
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function extractTitle(skillName, persona) {
  const display = humanizeSkillName(skillName);
  if (persona && persona.name) {
    return `# ${display} with ${persona.name}`;
  }
  return `# ${display}`;
}

function extractPersona(persona) {
  const lines = [];
  const nameWithIcon = persona.icon ? `${persona.name} ${persona.icon}` : persona.name;
  lines.push(`## You are ${nameWithIcon}`);
  lines.push('');
  if (persona.role || persona.title) {
    lines.push(`**Role:** ${persona.role || persona.title}`);
    lines.push('');
  }
  if (persona.identity) {
    lines.push(`**Identity:** ${persona.identity}`);
    lines.push('');
  }
  if (persona.communicationStyle) {
    lines.push(`**Communication style:** ${persona.communicationStyle}`);
    lines.push('');
  }
  if (persona.principles) {
    lines.push(`**Principles:**`);
    lines.push('');
    // Principles may be a single string with bullets, or just prose
    const principlesText = persona.principles;
    if (principlesText.includes('- ')) {
      // Already has bullets — keep as-is, just normalize
      const bulletLines = principlesText
        .split(/\n+/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((l) => (l.startsWith('-') ? l : `- ${l}`));
      lines.push(...bulletLines);
    } else {
      // Split on sentences (approximate)
      const sentences = principlesText.split(/(?<=\.)\s+/).filter((s) => s.trim().length > 0);
      for (const s of sentences) {
        lines.push(`- ${s.trim()}`);
      }
    }
  }
  return lines.join('\n');
}

function extractWhenToUse(skillRow, workflowContent) {
  const lines = [];
  lines.push('## When to use this skill');
  lines.push('');
  // Description from skill manifest
  const description = skillRow.description || '';
  // Strip the "Use when..." trailing clause if present, since we'll generate our own
  const cleanDesc = description.replace(/\s*Use when[^.]*\.?\s*$/i, '').trim();
  lines.push(cleanDesc);
  lines.push('');
  lines.push('**Use when:**');
  lines.push('');

  // Try to extract trigger conditions from the description's "Use when..." clause
  const useWhenMatch = description.match(/Use when[^.]*\./i);
  if (useWhenMatch) {
    // Parse simple "X or Y" patterns
    const trigger = useWhenMatch[0].replace(/^Use when\s+/i, '').replace(/\.$/, '');
    const parts = trigger.split(/\s+or\s+/i);
    for (const part of parts) {
      lines.push(`- ${part.trim()}`);
    }
  } else {
    // Generate one fallback bullet
    const humanName = humanizeSkillName(skillRow.name).toLowerCase();
    lines.push(`- The user explicitly requests ${humanName}`);
  }

  return lines.join('\n');
}

function extractInputs(workflowContent, stepContents) {
  const lines = [];
  lines.push('## Inputs you may need');
  lines.push('');

  const inputs = [];

  // Look for `### Configuration Loading` block in workflow
  const configBlock = workflowContent.match(/### Configuration Loading\s*([\s\S]*?)(?=^###|(?![\s\S]))/m);
  if (configBlock) {
    // Extract config var names mentioned
    const varNames = [...configBlock[1].matchAll(/`?\{([\w_-]+)\}`?/g)].map((m) => m[1]);
    const seen = new Set();
    for (const v of varNames) {
      if (seen.has(v)) continue;
      seen.add(v);
      // Skip the universal config vars — they're substituted, not exposed as inputs
      if (
        ['user_name', 'communication_language', 'document_output_language', 'output_folder',
         'planning_artifacts', 'implementation_artifacts', 'project_name', 'project_knowledge',
         'user_skill_level', 'date'].includes(v)
      ) {
        continue;
      }
      inputs.push(`- **${v.replace(/_/g, ' ')}.** Replace any placeholder for this with your project's actual value.`);
    }
  }

  // Look for context_file references
  if (/context_file/.test(workflowContent)) {
    inputs.push('- **Optional context file.** A markdown file with project-specific guidance to inform the session.');
  }

  if (inputs.length === 0) {
    lines.push('(none required)');
  } else {
    lines.push(...inputs);
  }

  return lines.join('\n');
}

function extractHowToProceed(workflowContent, stepContents, skillContent) {
  const lines = [];
  lines.push('## How to proceed');
  lines.push('');

  // Group step files by base step number to collapse branches
  const stepNames = Object.keys(stepContents).sort();
  const groups = {};
  for (const stepName of stepNames) {
    // Match patterns like "step-01-foo", "step-02a-bar", "step-t-01-baz"
    const m = stepName.match(/step-(?:[a-z]-)?(\d+)/);
    const num = m ? parseInt(m[1], 10) : 0;
    if (!groups[num]) groups[num] = [];
    groups[num].push(stepName);
  }

  const sortedNums = Object.keys(groups).map(Number).sort((a, b) => a - b);

  if (sortedNums.length === 0) {
    // No step files — derive from workflow content directly, then SKILL.md
    // Search both workflow and skill content for procedural blocks
    const sources = [workflowContent, skillContent || ''];
    let extracted = null;
    for (const source of sources) {
      // Try several heading variants
      const taskBlock = source.match(/##\s+(?:Your Task|Instructions|Workflow|Execution|How to proceed|On Activation)\s*([\s\S]*?)(?=^##\s|(?![\s\S]))/im);
      if (taskBlock) {
        extracted = taskBlock[1].trim();
        break;
      }
    }
    if (extracted) {
      lines.push(extracted);
    } else {
      lines.push('Follow the persona\'s established workflow as described in the persona section above. The user will guide the conversation.');
    }
    return lines.join('\n');
  }

  // Inline each step group as a numbered list item
  let outputNum = 1;
  for (const num of sortedNums) {
    const groupSteps = groups[num];
    if (groupSteps.length === 1) {
      // Single step — inline directly
      const content = extractStepInstructionalContent(stepContents[groupSteps[0]]);
      const title = extractStepTitle(stepContents[groupSteps[0]]) || `Step ${outputNum}`;
      lines.push(`${outputNum}. **${title}**`);
      lines.push('');
      const indented = content.split('\n').map((l) => l ? `   ${l}` : '').join('\n');
      lines.push(indented);
      lines.push('');
      outputNum++;
    } else {
      // Branching — present as nested options
      // Use the first step's title as the umbrella title
      const umbrellaTitle = `Step ${outputNum} (multiple paths)`;
      lines.push(`${outputNum}. **${umbrellaTitle}** — choose one of the following:`);
      lines.push('');
      for (const stepName of groupSteps) {
        const content = extractStepInstructionalContent(stepContents[stepName]);
        const title = extractStepTitle(stepContents[stepName]) || stepName;
        lines.push(`   - **${title}**`);
        const indented = content.split('\n').map((l) => l ? `     ${l}` : '').join('\n');
        lines.push(indented);
        lines.push('');
      }
      outputNum++;
    }
  }

  return lines.join('\n');
}

function extractStepTitle(stepContent) {
  // Look for the first `# Step X: Title` or `## Step X: Title` heading
  const m = stepContent.match(/^#+\s+(?:Step\s+\d+[a-z]?:\s+)?(.+?)$/m);
  if (m) return m[1].trim();
  return null;
}

function extractStepInstructionalContent(stepContent) {
  // Strip meta sections by walking the content and skipping headings in the meta list
  const lines = stepContent.split('\n');
  const result = [];
  let skipping = false;
  let inFirstHeading = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for heading
    const headingMatch = line.match(/^##\s+(.+?)\s*:?$/);
    if (headingMatch) {
      const headingText = headingMatch[1].toUpperCase().replace(/[^A-Z\s/]/g, '').trim();
      // Check if this matches a meta section
      const isMeta = META_SECTIONS_TO_STRIP.some((meta) => headingText.includes(meta));
      if (isMeta) {
        skipping = true;
        continue;
      } else {
        skipping = false;
        // Skip the very first heading (it's the step title, already captured separately)
        if (inFirstHeading) {
          inFirstHeading = false;
          continue;
        }
      }
    }
    // Skip H1 step titles too
    if (/^#\s+Step\s+\d/i.test(line)) {
      inFirstHeading = false;
      continue;
    }
    if (!skipping) {
      result.push(line);
    }
  }

  // Collapse and trim
  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function extractWhatYouProduce(workflowContent, stepContents, skillRow) {
  const lines = [];
  lines.push('## What you produce');
  lines.push('');

  // Try several patterns
  // 1. ## Output heading
  const outputBlock = workflowContent.match(/^##\s+Output\s*([\s\S]*?)(?=^##\s|(?![\s\S]))/m);
  if (outputBlock) {
    lines.push(outputBlock[1].trim());
    return lines.join('\n');
  }

  // 2. *_output_file or *_artifact path variable in ### Paths
  const pathsBlock = workflowContent.match(/###\s+Paths\s*([\s\S]*?)(?=^###|^##|(?![\s\S]))/m);
  if (pathsBlock) {
    const outputFile = pathsBlock[1].match(/[`*]?(\w*_output_file|\w*_artifact)[`*]?\s*=\s*[`]?([^`\n]+)[`]?/);
    if (outputFile) {
      const humanName = humanizeSkillName(skillRow.name).toLowerCase();
      lines.push(`A markdown ${humanName} document at \`${outputFile[2].replace(/\{[\w_-]+\}/g, '[your output folder]')}\`. The document captures the session output and is intentionally raw — value comes from quantity and diversity, not pre-curation.`);
      return lines.join('\n');
    }
  }

  // 3. **Goal:** line — extract the deliverable noun
  const goalMatch = workflowContent.match(/\*\*Goal:\*\*\s+(.+?)(?:\n|$)/);
  if (goalMatch) {
    const humanName = humanizeSkillName(skillRow.name).toLowerCase();
    lines.push(`A markdown document capturing ${goalMatch[1].toLowerCase().replace(/^[a-z]/, (c) => c)}. Lives at \`[your output folder]/${humanName.replace(/\s+/g, '-')}/[date].md\`.`);
    return lines.join('\n');
  }

  // Fallback
  const humanName = humanizeSkillName(skillRow.name).toLowerCase();
  lines.push(`A markdown document at \`[your output folder]/${humanName.replace(/\s+/g, '-')}/[date].md\`.`);
  return lines.join('\n');
}

function extractQualityChecks(workflowContent, stepContents) {
  // Look for `## SUCCESS METRICS` blocks across step files
  const checks = [];
  for (const stepName of Object.keys(stepContents)) {
    const content = stepContents[stepName];
    const successBlock = content.match(/##\s+(?:SUCCESS METRICS|SUCCESS CRITERIA|QUALITY CHECKS|CRITICAL RULES)\s*([\s\S]*?)(?=^##\s|(?![\s\S]))/mi);
    if (successBlock) {
      // Extract bullet items, only those that look like complete sentences (no truncation artifacts)
      const bullets = successBlock[1]
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => /^[-*✅]/.test(l))
        .map((l) => l.replace(/^[-*✅]\s*/, '').replace(/^✅\s*/, '').trim())
        // Filter out truncated entries (no trailing punctuation, ends mid-word)
        .filter((l) => l.length > 10 && !l.endsWith(' ') && /[.a-zA-Z0-9]$/.test(l));
      checks.push(...bullets);
    }
  }

  if (checks.length === 0) return null; // omit section entirely

  // Dedupe (case-insensitive, normalize whitespace)
  const seen = new Set();
  const unique = [];
  for (const check of checks) {
    const normalized = check.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(check);
  }

  // Cap at 10 to keep the section digestible
  const capped = unique.slice(0, 10);

  const lines = [];
  lines.push('## Quality checks');
  lines.push('');
  lines.push('Before declaring the session complete, verify:');
  lines.push('');
  for (const check of capped) {
    lines.push(`- [ ] ${check}`);
  }
  return lines.join('\n');
}

// =============================================================================
// TIER 2: DEPENDENCY HANDLING (sp-5-1)
// =============================================================================

/**
 * Categorize a skill's dependencies into templates, skill-refs, and sidecars.
 * @param {string} depsString - semicolon-separated deps from manifest
 * @param {string} projectRoot
 * @param {Set<string>} manifestSkillNames - all skill names in manifest
 * @param {string} skillDir - the skill's source directory (for relative path resolution)
 * @returns {{ templates: Array, skillRefs: Array, sidecars: Array }}
 */
function categorizeDependencies(depsString, projectRoot, manifestSkillNames, skillDir) {
  const templates = [];
  const skillRefs = [];
  const sidecars = [];

  if (!depsString || !depsString.trim()) return { templates, skillRefs, sidecars };

  const deps = depsString.split(';').map((d) => d.trim()).filter(Boolean);

  for (const dep of deps) {
    // 1. Skill reference (matches a manifest name)
    if (manifestSkillNames.has(dep)) {
      skillRefs.push({ name: dep });
      continue;
    }

    // 2. Sidecar (path contains _memory or sidecar)
    if (dep.includes('_memory') || dep.includes('sidecar')) {
      sidecars.push({ name: path.basename(dep), path: dep });
      continue;
    }

    // 3. Template (path under templates/ directory, exists on disk)
    // Try to resolve: direct resolution, project-root-relative, then subtree search by basename
    let resolvedPath = null;
    const candidates = [
      path.resolve(skillDir, dep),
      path.join(projectRoot, dep),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        resolvedPath = candidate;
        break;
      }
    }
    // Subtree search fallback: look for the basename under the skill dir tree
    if (!resolvedPath && dep.endsWith('.md')) {
      const basename = path.basename(dep);
      const searchDirs = [skillDir, path.join(projectRoot, '_bmad')];
      for (const searchDir of searchDirs) {
        if (!fs.existsSync(searchDir)) continue;
        const found = findFileByName(searchDir, basename);
        if (found) { resolvedPath = found; break; }
      }
    }

    if (resolvedPath && dep.includes('templates/')) {
      const content = fs.readFileSync(resolvedPath, 'utf8');
      const displayName = path.basename(dep, '.md')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      templates.push({ name: displayName, path: resolvedPath, content });
      continue;
    }

    // 4. Exists on disk but not under templates/ → sidecar (conservative)
    if (resolvedPath) {
      sidecars.push({ name: path.basename(dep), path: dep });
      continue;
    }

    // 5. Unknown → sidecar
    sidecars.push({ name: path.basename(dep), path: dep });
  }

  return { templates, skillRefs, sidecars };
}

/**
 * Build inlined template sections for Tier 2 skills.
 * Each template gets its own ## heading with the content below.
 * Applies transformations with skipPhase6 to preserve {{var}} placeholders.
 */
function buildTemplateSections(templates, warnings) {
  const sections = [];
  for (const tpl of templates) {
    let content = tpl.content;
    // Strip YAML frontmatter from template
    content = content.replace(/^---\n[\s\S]*?\n---\n/, '');
    // Apply transformations Phases 1-5 + 7 only (skip Phase 6 to preserve {{var}})
    content = applyTransformations(content, warnings, { skipPhase6: true });

    sections.push(`## Template: ${tpl.name}`);
    sections.push('');
    sections.push('> Replace template placeholders ({{...}}) with your project\'s actual values.');
    sections.push('');
    sections.push('Use this template as the starting structure for your output document.');
    sections.push('');
    sections.push(content);
  }
  return sections.join('\n');
}

/**
 * Build companion-skill and sidecar notes for the Inputs section.
 */
function buildDependencyNotes(skillRefs, sidecars, manifestSkillNames) {
  const lines = [];
  for (const ref of skillRefs) {
    const qualifier = manifestSkillNames.has(ref.name) ? ' Available in the skills catalog.' : '';
    const displayName = humanizeSkillName(ref.name);
    lines.push(`- **Companion skill: ${displayName}.** This skill works best when used together with the ${displayName} skill.${qualifier}`);
  }
  for (const sc of sidecars) {
    lines.push(`- **Persistent data: ${sc.name}.** This skill maintains a data file for session history. Create an empty file at this path if starting fresh.`);
  }
  return lines.join('\n');
}

// =============================================================================
// MAIN: exportSkill
// =============================================================================

/**
 * Export a Tier 1 standalone skill into canonical instructions.md format.
 *
 * @param {string} skillName - The skill's canonical name (e.g., 'bmad-brainstorming')
 * @param {string} projectRoot - Absolute path to the project root
 * @param {object} [options] - Reserved for future use
 * @returns {{ instructions: string, persona: object, sections: object, warnings: object[] }}
 *
 * Throws:
 * - if the skill is not in the manifest
 * - if the skill's tier is 'pipeline' (only standalone + light-deps are exportable)
 * - if persona resolution fails (all 5 strategies)
 */
function exportSkill(skillName, projectRoot, options = {}) {
  const warnings = [];

  // 1. Load skill row + tier check (standalone + light-deps allowed; pipeline rejected)
  const skillRow = loadSkillRow(skillName, projectRoot);
  if (skillRow.tier === 'pipeline') {
    throw new Error(
      `${skillName} is tier "pipeline" — pipeline skills are not exported per the portability schema.`
    );
  }

  // 2. Load source files
  const { skillContent, workflowContent, stepContents, skillDir } = loadSkillSource(skillRow, projectRoot, warnings);

  // 3. Resolve persona (throws if all 5 strategies fail)
  const persona = loadPersona(skillName, skillContent, workflowContent, projectRoot);

  // 4. Categorize dependencies for Tier 2 (no-op for standalone — empty deps)
  const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
  const { header: mHeader, rows: mRows } = readManifest(manifestPath);
  const mNameIdx = mHeader.indexOf('name');
  const manifestSkillNames = new Set(mRows.map((r) => r[mNameIdx]));
  const deps = categorizeDependencies(
    skillRow.dependencies || '', projectRoot, manifestSkillNames, skillDir || path.dirname(path.join(projectRoot, skillRow.path))
  );

  // 5. Run all section extractors
  const sections = {
    title: extractTitle(skillName, persona),
    persona: extractPersona(persona),
    whenToUse: extractWhenToUse(skillRow, workflowContent),
    inputs: extractInputs(workflowContent, stepContents),
    howToProceed: extractHowToProceed(workflowContent, stepContents, skillContent),
    whatYouProduce: extractWhatYouProduce(workflowContent, stepContents, skillRow),
    qualityChecks: extractQualityChecks(workflowContent, stepContents),
  };

  // 5. Apply transformations to each section (post-extraction cleanup)
  const transformedSections = {};
  for (const [key, value] of Object.entries(sections)) {
    if (value === null) {
      transformedSections[key] = null;
    } else {
      transformedSections[key] = applyTransformations(value, warnings);
    }
  }

  // 5b. Replace template-path references in workflow text with "see Template section below"
  if (deps.templates.length > 0 && transformedSections.howToProceed) {
    for (const tpl of deps.templates) {
      const basename = path.basename(tpl.path);
      // Replace lines referencing the template file (load, read, use the template, etc.)
      transformedSections.howToProceed = transformedSections.howToProceed
        .split('\n')
        .map((line) => {
          if (line.includes(basename) || (line.includes('template') && line.includes('load'))) {
            // Only replace if the line looks like a template-loading directive
            if (/(?:load|read|use|initialize from|open)\b/i.test(line) && line.includes(basename)) {
              return line.replace(
                new RegExp(`[^\`]*${basename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\`]*`, 'i'),
                `see the "Template: ${tpl.name}" section below`
              );
            }
          }
          return line;
        })
        .join('\n');
    }
  }

  // 6. Assemble the final instructions.md
  const parts = [
    transformedSections.title,
    '',
    transformedSections.persona,
    '',
    transformedSections.whenToUse,
    '',
    transformedSections.inputs,
    '',
    transformedSections.howToProceed,
    '',
    transformedSections.whatYouProduce,
  ];
  if (transformedSections.qualityChecks) {
    parts.push('');
    parts.push(transformedSections.qualityChecks);
  }

  // 6b. Append dependency notes to inputs section (Tier 2 — no-op for standalone)
  const depNotes = buildDependencyNotes(deps.skillRefs, deps.sidecars, manifestSkillNames);
  if (depNotes) {
    // Find the inputs part and append notes
    const inputsIdx = parts.indexOf(transformedSections.inputs);
    if (inputsIdx >= 0) {
      parts[inputsIdx] = parts[inputsIdx] + '\n' + depNotes;
    }
  }

  // 6c. Append inlined template sections (Tier 2 — no-op for standalone)
  const templateContent = buildTemplateSections(deps.templates, warnings);
  if (templateContent) {
    parts.push('');
    parts.push(templateContent);
  }

  const instructions = parts.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';

  // 7. Final pass: catch any remaining unstripped XML tags as warnings
  const remainingTags = instructions.match(/<\/?(workflow|step|action|check|critical|output|ask)\b/g);
  if (remainingTags) {
    warnings.push({
      type: 'unstripped-xml-tag',
      message: `${remainingTags.length} unstripped XML tag(s) remain after pass: ${remainingTags.slice(0, 3).join(', ')}`,
    });
  }

  return {
    instructions,
    persona,
    sections: transformedSections,
    warnings,
  };
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

module.exports = {
  exportSkill,
  // Internal helpers exported for testing
  loadSkillRow,
  loadSkillSource,
  loadPersona,
  applyTransformations,
  humanizeSkillName,
  extractTitle,
  extractPersona,
  extractWhenToUse,
  extractInputs,
  extractHowToProceed,
  extractWhatYouProduce,
  extractQualityChecks,
  ALLOWED_WARNING_TYPES,
  // Catalog support (sp-3-1)
  resolvePersonaSummary,
  loadAgentManifest,
};
