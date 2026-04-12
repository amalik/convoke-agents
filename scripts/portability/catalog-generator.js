#!/usr/bin/env node
/**
 * catalog-generator.js — Story sp-3-1
 *
 * Generates a decision-tree catalog README from skill-manifest.csv and
 * agent-manifest.csv. The catalog is organized by user intent ("I need to...")
 * so consultants new to agentic tools can find the right skill quickly.
 *
 * Usage:
 *   node scripts/portability/catalog-generator.js              # stdout
 *   node scripts/portability/catalog-generator.js --output <path>
 *   node scripts/portability/catalog-generator.js --help
 *
 * Read-only on the source tree — reads two CSV manifests, writes one file
 * (or stdout).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { findProjectRoot } = require('../update/lib/utils');
const { readManifest } = require('./manifest-csv');
const { resolvePersonaSummary, loadAgentManifest } = require('./export-engine');

// =============================================================================
// CONSTANTS
// =============================================================================

const INTENT_TO_HEADING = {
  'think-through-problem': 'I need to think through a problem',
  'define-what-to-build': 'I need to define what to build',
  'review-something': 'I need to review something',
  'write-documentation': 'I need to write documentation',
  'plan-your-work': 'I need to plan my work',
  'test-your-code': 'I need to test my code',
  'discover-product-fit': 'I need to run continuous product discovery',
  'assess-readiness': 'I need to assess production readiness',
  'meta-platform': null, // excluded from catalog
};

const TIER_BADGES = {
  standalone: '**✅ Ready to use**',
  'light-deps': '**📦 Needs setup**',
  pipeline: '**🔒 Framework only** (Requires full Convoke installation)',
};

// Intent display order: standalone-heavy intents first, pipeline-only last
const INTENT_ORDER = [
  'think-through-problem',
  'define-what-to-build',
  'review-something',
  'write-documentation',
  'plan-your-work',
  'test-your-code',
  'discover-product-fit',
  'assess-readiness',
];

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Truncate description to first sentence (period + space) or 120 chars.
 */
function truncateDescription(desc) {
  if (!desc) return '';
  const periodIdx = desc.indexOf('. ');
  if (periodIdx > 0 && periodIdx < 120) {
    return desc.slice(0, periodIdx + 1);
  }
  if (desc.length <= 120) return desc;
  return desc.slice(0, 120) + '...';
}

/**
 * Render a single skill entry line.
 */
function renderSkillEntry(skill) {
  const icon = skill.icon || '🔧';
  const badge = TIER_BADGES[skill.tier] || skill.tier;
  const desc = truncateDescription(skill.description);
  const link = `[→ instructions](./${skill.name}/)`;
  return `- ${icon} **${skill.personaName}** — ${desc} ${badge} ${link}`;
}

// =============================================================================
// CATALOG GENERATION
// =============================================================================

function generateCatalog(projectRoot) {
  // Load manifests
  const skillManifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
  const { header, rows } = readManifest(skillManifestPath);
  const agents = loadAgentManifest(projectRoot);

  const nameIdx = header.indexOf('name');
  const tierIdx = header.indexOf('tier');
  const intentIdx = header.indexOf('intent');
  const descIdx = header.indexOf('description');

  // Dedupe by skill name (first row wins)
  const seen = new Set();
  const skills = [];
  for (const row of rows) {
    const name = row[nameIdx];
    if (seen.has(name)) continue;
    seen.add(name);

    const intent = row[intentIdx] || 'unknown';
    const tier = row[tierIdx] || 'unknown';

    // Skip meta-platform
    if (intent === 'meta-platform') continue;

    const persona = resolvePersonaSummary(name, agents);
    skills.push({
      name,
      tier,
      intent,
      description: row[descIdx] || '',
      personaName: persona.name,
      icon: persona.icon,
    });
  }

  // Count by tier
  const standaloneCount = skills.filter((s) => s.tier === 'standalone').length;
  const lightDepsCount = skills.filter((s) => s.tier === 'light-deps').length;
  const pipelineCount = skills.filter((s) => s.tier === 'pipeline').length;
  const mainBodyCount = standaloneCount + lightDepsCount;

  // Group by intent
  const byIntent = {};
  for (const skill of skills) {
    if (!byIntent[skill.intent]) byIntent[skill.intent] = [];
    byIntent[skill.intent].push(skill);
  }
  // Sort skills alphabetically within each intent
  for (const intent of Object.keys(byIntent)) {
    byIntent[intent].sort((a, b) => a.name.localeCompare(b.name));
  }

  // Warn on unknown intents
  for (const intent of Object.keys(byIntent)) {
    if (!(intent in INTENT_TO_HEADING)) {
      process.stderr.write(`Warning: unknown intent "${intent}" — using fallback heading\n`);
    }
  }

  // === Render ===
  const lines = [];

  // Header
  lines.push('# Convoke Skills Catalog');
  lines.push('');
  lines.push('> Find the right AI skill for your task. Browse by what you\'re trying to do.');
  lines.push('');
  lines.push('## How to use a skill');
  lines.push('');
  lines.push('1. Find your intent below — what are you trying to do?');
  lines.push('2. Pick a skill marked **✅ Ready to use**');
  lines.push('3. Copy the skill folder into your project\'s `.claude/skills/` directory');
  lines.push('');
  lines.push('### Tier legend');
  lines.push('');
  lines.push('- **✅ Ready to use** — standalone skill, just copy and go');
  lines.push('- **📦 Needs setup** — includes templates/config that need minor configuration');
  lines.push('- **🔒 Framework only** — requires full Convoke installation');
  lines.push('');
  lines.push(
    `**${mainBodyCount} skills in this catalog** (${standaloneCount} ready to use, ${lightDepsCount} need setup) | ${pipelineCount} framework-only skills listed below`
  );
  lines.push('');
  lines.push('---');
  lines.push('');

  // Main body: Tier 1 + Tier 2 skills grouped by intent
  for (const intent of INTENT_ORDER) {
    const heading = INTENT_TO_HEADING[intent];
    if (!heading) continue; // meta-platform excluded

    const intentSkills = (byIntent[intent] || []).filter(
      (s) => s.tier === 'standalone' || s.tier === 'light-deps'
    );
    if (intentSkills.length === 0) continue;

    lines.push(`## ${heading}`);
    lines.push('');
    for (const skill of intentSkills) {
      lines.push(renderSkillEntry(skill));
    }
    lines.push('');
  }

  // Render any unknown-intent skills with fallback heading (spec AC #2)
  for (const intent of Object.keys(byIntent)) {
    if (intent in INTENT_TO_HEADING) continue; // already rendered above
    const intentSkills = byIntent[intent].filter(
      (s) => s.tier === 'standalone' || s.tier === 'light-deps'
    );
    if (intentSkills.length === 0) continue;
    lines.push(`## I need to: ${intent}`);
    lines.push('');
    for (const skill of intentSkills) {
      lines.push(renderSkillEntry(skill));
    }
    lines.push('');
  }

  // Collapsed section: Tier 3 pipeline skills
  const pipelineSkills = skills.filter((s) => s.tier === 'pipeline');
  if (pipelineSkills.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('<details>');
    lines.push('<summary><strong>Framework-only skills (requires Convoke installation)</strong></summary>');
    lines.push('');

    // Group pipeline skills by intent too
    const pipelineByIntent = {};
    for (const skill of pipelineSkills) {
      if (!pipelineByIntent[skill.intent]) pipelineByIntent[skill.intent] = [];
      pipelineByIntent[skill.intent].push(skill);
    }

    for (const intent of INTENT_ORDER) {
      const heading = INTENT_TO_HEADING[intent];
      if (!heading) continue;
      const intentSkills = pipelineByIntent[intent] || [];
      if (intentSkills.length === 0) continue;

      lines.push(`### ${heading}`);
      lines.push('');
      for (const skill of intentSkills) {
        lines.push(renderSkillEntry(skill));
      }
      lines.push('');
    }

    // Also render unknown-intent pipeline skills
    for (const intent of Object.keys(pipelineByIntent)) {
      if (intent in INTENT_TO_HEADING) continue;
      const unknownSkills = pipelineByIntent[intent] || [];
      if (unknownSkills.length === 0) continue;
      lines.push(`### I need to: ${intent}`);
      lines.push('');
      for (const skill of unknownSkills) {
        lines.push(renderSkillEntry(skill));
      }
      lines.push('');
    }

    lines.push('</details>');
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(`*Generated by \`convoke-export\` — do not edit manually.*`);
  lines.push(`*Generated on ${new Date().toISOString().slice(0, 10)}.*`);
  lines.push('');
  lines.push('For the full Convoke framework, see the [Convoke Agents repository](https://github.com/amalik/convoke-agents).');
  lines.push('');

  return lines.join('\n');
}

// =============================================================================
// CLI
// =============================================================================

function printHelp() {
  process.stdout.write(
    [
      'Usage: catalog-generator [options]',
      '',
      'Generate a decision-tree skill catalog README from manifest data.',
      '',
      'Options:',
      '  --output <path>   Write catalog to file (default: stdout)',
      '  --help, -h        Show this help message',
      '',
      'Exit codes:',
      '  0  Success',
      '  1  Usage error',
      '  2  Manifest read failure',
      '',
    ].join('\n')
  );
}

function main() {
  const argv = process.argv.slice(2);

  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    return 0;
  }

  let outputPath = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--output') {
      outputPath = argv[++i];
      if (!outputPath) {
        process.stderr.write('Error: --output requires a path argument\n');
        return 1;
      }
    } else if (argv[i].startsWith('--')) {
      process.stderr.write(`Unknown flag: ${argv[i]}. Run --help for usage.\n`);
      return 1;
    }
  }

  let projectRoot;
  try {
    projectRoot = findProjectRoot();
  } catch (e) {
    process.stderr.write(`Error: could not find project root — ${e.message}\n`);
    return 2;
  }

  let catalog;
  try {
    catalog = generateCatalog(projectRoot);
  } catch (e) {
    process.stderr.write(`Error generating catalog: ${e.message}\n`);
    return 2;
  }

  if (outputPath) {
    try {
      const dir = path.dirname(outputPath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(outputPath, catalog);
    } catch (e) {
      process.stderr.write(`Error writing catalog: ${e.message}\n`);
      return 2;
    }
  } else {
    process.stdout.write(catalog);
  }

  return 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { generateCatalog, main };
