#!/usr/bin/env node
/**
 * classify-skills.js — Story sp-1-2
 *
 * Reads `_bmad/_config/skill-manifest.csv`, classifies each skill with tier,
 * intent, and exporter-essential dependencies, and writes the manifest back.
 *
 * Usage:
 *   node scripts/portability/classify-skills.js              # write
 *   node scripts/portability/classify-skills.js --dry-run    # preview only
 *   node scripts/portability/classify-skills.js --force      # override conflicts
 *
 * Idempotent: re-running with no source changes produces zero diff.
 * Non-destructive: preserves manual classification overrides unless --force.
 *
 * See _bmad-output/implementation-artifacts/sp-1-2-classify-all-skills.md
 * for the full classification policy and heuristics.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { findProjectRoot } = require('../update/lib/utils');
const { readManifest, writeManifest } = require('./manifest-csv');

// =============================================================================
// CONSTANTS — locked classification rules from sp-1-2 spec (AC #7, Task 3)
// =============================================================================

const VALID_TIERS = ['standalone', 'light-deps', 'pipeline'];
const VALID_INTENTS = [
  'think-through-problem',
  'define-what-to-build',
  'review-something',
  'write-documentation',
  'plan-your-work',
  'test-your-code',
  'discover-product-fit',
  'assess-readiness',
  'meta-platform',
];

// Canonical meta-platform skills (AC #7) — framework-internal, NOT portable.
//
// Note: AC #7 originally listed `bmad-agent-bme-team-factory` (Loom Master) as
// the 6th meta-platform skill, but that name lives in the AGENT manifest, not
// the skill manifest. There is no team-factory entry in skill-manifest.csv to
// classify, so the meta-platform set has 5 skills, not 6. Loom Master is
// invoked via party-mode and the team-factory agent file directly.
const META_PLATFORM_SKILLS = new Set([
  'bmad-init',
  'bmad-help',
  'bmad-party-mode',
  'bmad-builder-setup',
  'bmad-agent-builder',
]);

// Standalone utilities explicitly carved out from meta-platform (AC #7).
const STANDALONE_UTILITY_INTENTS = {
  'bmad-distillator': 'write-documentation',
  'bmad-advanced-elicitation': 'think-through-problem',
  'bmad-shard-doc': 'write-documentation',
  'bmad-index-docs': 'write-documentation',
  // bmad-generate-project-context handled separately — Tier 2, write-documentation
};

// Pipeline skills by name (Task 2 priority 1).
const PIPELINE_BY_NAME = new Set([
  'bmad-dev-story',
  'bmad-sprint-planning',
  'bmad-sprint-status',
  'bmad-create-story',
  'bmad-correct-course',
  'bmad-retrospective',
  'bmad-code-review',
  'bmad-check-implementation-readiness',
  'bmad-validate-prd',
  'bmad-edit-prd',
]);

// Persona-only bmad-agent-* skills, enumerated (Task 3, no judgment calls).
const PERSONA_AGENT_INTENTS = {
  'bmad-agent-analyst': 'define-what-to-build',
  'bmad-agent-pm': 'define-what-to-build',
  'bmad-agent-architect': 'define-what-to-build',
  'bmad-agent-ux-designer': 'define-what-to-build',
  'bmad-agent-tech-writer': 'write-documentation',
  'bmad-agent-sm': 'plan-your-work',
  'bmad-agent-dev': 'plan-your-work',
  'bmad-agent-quick-flow-solo-dev': 'plan-your-work',
  'bmad-agent-qa': 'test-your-code',
  // bmad-agent-builder and bmad-agent-bme-team-factory are in META_PLATFORM_SKILLS above.
};

// Vortex 7 stream agents (discover-product-fit).
const VORTEX_AGENTS = new Set([
  'bmad-agent-bme-contextualization-expert',
  'bmad-agent-bme-discovery-empathy-expert',
  'bmad-agent-bme-research-convergence-specialist',
  'bmad-agent-bme-hypothesis-engineer',
  'bmad-agent-bme-lean-experiments-specialist',
  'bmad-agent-bme-production-intelligence-specialist',
  'bmad-agent-bme-learning-decision-expert',
]);

// Gyre 4 readiness agents (assess-readiness).
const GYRE_AGENTS = new Set([
  'bmad-agent-bme-stack-detective',
  'bmad-agent-bme-model-curator',
  'bmad-agent-bme-readiness-analyst',
  'bmad-agent-bme-review-coach',
]);

// Note: universal config vars (user_name, output_folder, etc.) are stripped
// implicitly by extractDependencies — we only emit deps for templates,
// sidecars, and chained skills. Config vars are never extracted.

// =============================================================================
// CLASSIFICATION HEURISTICS
// =============================================================================

/**
 * Determine intent from skill name + path. Returns null if no match.
 *
 * Order matters — more specific matches first.
 */
function classifyIntent(name, _modulePath) {
  // 1. Meta-platform (locked set)
  if (META_PLATFORM_SKILLS.has(name)) return 'meta-platform';

  // 2. Standalone utilities carved out from meta-platform
  if (name in STANDALONE_UTILITY_INTENTS) return STANDALONE_UTILITY_INTENTS[name];
  if (name === 'bmad-generate-project-context') return 'write-documentation';

  // 3. Persona-only agent skills (enumerated)
  if (name in PERSONA_AGENT_INTENTS) return PERSONA_AGENT_INTENTS[name];

  // 4. Vortex / Gyre agent skills
  if (VORTEX_AGENTS.has(name)) return 'discover-product-fit';
  if (GYRE_AGENTS.has(name)) return 'assess-readiness';

  // 5. Pattern-matched intent groups
  if (
    name.startsWith('bmad-cis-agent-') ||
    name === 'bmad-brainstorming' ||
    name === 'bmad-cis-problem-solving' ||
    name === 'bmad-cis-design-thinking' ||
    name === 'bmad-cis-storytelling' ||
    name === 'bmad-cis-innovation-strategy'
  ) {
    return 'think-through-problem';
  }

  if (
    [
      'bmad-create-prd',
      'bmad-edit-prd',
      'bmad-validate-prd',
      'bmad-product-brief',
      'bmad-create-ux-design',
      'bmad-create-architecture',
      'bmad-create-epics-and-stories',
      'bmad-domain-research',
      'bmad-market-research',
      'bmad-technical-research',
    ].includes(name)
  ) {
    return 'define-what-to-build';
  }

  if (
    name === 'bmad-code-review' ||
    name.startsWith('bmad-review-') ||
    name.startsWith('bmad-editorial-review-')
  ) {
    return 'review-something';
  }

  if (
    [
      'bmad-document-project',
      'bmad-generate-project-context',
      'bmad-index-docs',
    ].includes(name) ||
    name.startsWith('bmad-tech-writer')
  ) {
    return 'write-documentation';
  }

  if (
    name === 'bmad-create-story' ||
    name === 'bmad-correct-course' ||
    name === 'bmad-retrospective' ||
    name === 'bmad-dev-story' ||
    name === 'bmad-quick-dev' ||
    name.startsWith('bmad-sprint-')
  ) {
    return 'plan-your-work';
  }

  if (
    name.startsWith('bmad-testarch-') ||
    name === 'bmad-qa-generate-e2e-tests' ||
    name === 'bmad-teach-me-testing'
  ) {
    return 'test-your-code';
  }

  if (name === 'bmad-check-implementation-readiness') return 'assess-readiness';

  // 6. WDS skills — all phases produce specs/scenarios → define-what-to-build
  if (name.startsWith('wds-')) return 'define-what-to-build';

  // 7. tea / workflow-builder edge cases
  if (name === 'bmad-tea') return 'test-your-code';
  if (name === 'bmad-workflow-builder') return 'meta-platform';

  // 8. AG Epic 6 governance skills — framework-internal artifact governance tooling
  if (name === 'bmad-migrate-artifacts' || name === 'bmad-portfolio-status') {
    return 'meta-platform';
  }

  // 9. Enhance module skills — initiatives-backlog manages a planning artifact
  if (name === 'bmad-enhance-initiatives-backlog') return 'plan-your-work';

  return null;
}

/**
 * Read a skill's source files (SKILL.md + referenced workflow + step files)
 * up to a recursion depth limit. Returns concatenated text content.
 */
function readSkillContent(projectRoot, relativePath, maxDepth = 3) {
  const visited = new Set();
  const chunks = [];
  // Project root must end with separator so the prefix check is unambiguous
  const rootWithSep = projectRoot.endsWith(path.sep)
    ? projectRoot
    : projectRoot + path.sep;

  /**
   * Containment guard: only follow refs that resolve inside projectRoot.
   * Defends against malicious/buggy markdown refs with `../../../etc/passwd`.
   */
  function isInsideProjectRoot(absPath) {
    return absPath === projectRoot || absPath.startsWith(rootWithSep);
  }

  function readOne(absPath, depth) {
    if (depth > maxDepth) return;
    if (!isInsideProjectRoot(absPath)) return; // P1: containment guard
    if (visited.has(absPath)) return;
    visited.add(absPath);
    if (!fs.existsSync(absPath)) return;
    let content;
    try {
      content = fs.readFileSync(absPath, 'utf8');
    } catch (e) {
      return;
    }
    chunks.push(content);

    // Find referenced files: workflow.md, steps/*.md, ./templates/*.md, etc.
    const dir = path.dirname(absPath);
    const refs = [];
    // Relative refs (./...md or ../...md or steps/...md)
    const relRegex = /(?:\.\/|\.\.\/|steps\/)[\w./-]+\.md/g;
    let m;
    while ((m = relRegex.exec(content)) !== null) {
      refs.push(path.resolve(dir, m[0]));
    }
    // Project-root refs (support both {project-root} and {project_root})
    const projRegex = /\{project[-_]root\}\/([\w./-]+\.md)/g;
    while ((m = projRegex.exec(content)) !== null) {
      refs.push(path.join(projectRoot, m[1]));
    }
    // Bare _bmad/ refs in load directives
    const bmadRegex = /(?:Load[^:]*:|read fully and follow:?)[^\n]*?(_bmad\/[\w./-]+\.md)/gi;
    while ((m = bmadRegex.exec(content)) !== null) {
      refs.push(path.join(projectRoot, m[1]));
    }

    for (const ref of refs) {
      // Each readOne call re-checks containment; this loop just enqueues.
      readOne(ref, depth + 1);
    }
  }

  readOne(path.join(projectRoot, relativePath), 0);
  return chunks.join('\n');
}

/**
 * Determine tier from skill name + workflow content.
 */
function classifyTier(name, modulePath, content, intent) {
  // Persona-only agent skills (bmad-agent-pm, bmad-agent-sm, etc.) are
  // menu wrappers around their persona — they LIST other skills as menu
  // options but don't actively chain them. They are standalone personas.
  // Override applies BEFORE pipeline detection to prevent the menu list
  // from triggering "invokes another skill" pipeline detection.
  if (name in PERSONA_AGENT_INTENTS) {
    return 'standalone';
  }

  // Pipeline indicators (Tier 3) — first match wins.
  if (PIPELINE_BY_NAME.has(name)) return 'pipeline';
  if (intent === 'meta-platform') return 'pipeline';
  if (modulePath.startsWith('_bmad/wds/') || name.startsWith('wds-')) return 'pipeline';
  if (modulePath.includes('_bmad/bme/_vortex/')) return 'pipeline';
  if (modulePath.includes('_bmad/bme/_gyre/')) return 'pipeline';

  if (content) {
    // Consumes prior artifacts
    if (/\{implementation_artifacts\}\/[^}\s]*\.md/.test(content)) return 'pipeline';
    // P4 (sp-1-2 review): tightened "invokes another skill" detection.
    // Old regex matched any prose mentioning "Skill tool" — too broad.
    // New regex requires:
    //   - An XML-style <Skill ...> activation tag, OR
    //   - A YAML/frontmatter `skill:` key with bmad- value, OR
    //   - An explicit `Skill tool` invocation phrase paired with a tool action verb
    //     (use|invoke|call|launch) within the same line
    if (
      /<Skill\b/.test(content) ||
      /^\s*skill:\s*['"]?bmad-/im.test(content) ||
      /(?:use|invoke|call|launch)[^.\n]{0,40}\bSkill tool\b/i.test(content)
    ) {
      return 'pipeline';
    }
  }

  // Light-deps indicators (Tier 2)
  if (content) {
    if (/^templateFile:/m.test(content)) return 'light-deps';
    // Match both absolute (_bmad/foo/templates/) and relative (../templates/, ./templates/) forms
    if (/(?:^|[\s`'"(/])(?:\.{1,2}\/)?[\w/-]*templates\/[\w./-]+\.(?:md|yaml|json)/.test(content)) {
      return 'light-deps';
    }
    if (/_bmad\/_memory\/[\w./-]+/.test(content)) return 'light-deps';
    // Explicit "Load template:" directive
    if (/Load template:/i.test(content)) return 'light-deps';
  }

  // Tier 2 carve-out: bmad-generate-project-context
  if (name === 'bmad-generate-project-context') return 'light-deps';

  // Default: Tier 1
  return 'standalone';
}

/**
 * Extract exporter-essential dependencies from a skill's content.
 * Returns a sorted, deduplicated array of dependency strings.
 *
 * @param {string} name Skill name (excluded from its own deps)
 * @param {string} content Concatenated skill source
 * @param {Set<string>} validSkillNames Whitelist of canonical skill IDs (filters out hook scripts, link text, etc.)
 */
function extractDependencies(name, content, validSkillNames) {
  if (!content) return [];
  const deps = new Set();

  // 1. Templates — match both absolute (_bmad/foo/templates/) and relative (../templates/) forms.
  // We normalize relative paths to absolute repo paths only when we can — for now, just record
  // the matched path as-is and let Story 1.3 validate resolution.
  const absTemplateRegex = /(_bmad\/[^/\s]+\/templates\/[\w./-]+\.(?:md|yaml|json))/g;
  let m;
  while ((m = absTemplateRegex.exec(content)) !== null) {
    deps.add(m[1]);
  }
  // Relative templates — we can't reliably resolve to absolute without knowing the source dir,
  // so we record a relative-template marker. This is intentionally lossy until Story 1.3.
  const relTemplateRegex = /(?:^|[\s`'"(])(\.{1,2}\/[\w/-]*templates\/[\w./-]+\.(?:md|yaml|json))/gm;
  while ((m = relTemplateRegex.exec(content)) !== null) {
    deps.add(m[1]);
  }

  // 2. Sidecars (_bmad/_memory/...)
  const sidecarRegex = /(_bmad\/_memory\/[\w./-]+)/g;
  while ((m = sidecarRegex.exec(content)) !== null) {
    const cleaned = m[1].replace(/[.,;:`'")\]]+$/, '');
    if (cleaned) deps.add(cleaned);
  }

  // 3. Chained skills — match candidate patterns, then filter against the canonical
  // set of valid skill names. This eliminates false positives from hook scripts
  // (`bmad-speak`), markdown link text (`WDS-SPECIFICATION-PATTERN`), and
  // hyphenation false-matches (`bmad-quick-dev-new-preview`).
  //
  // P4 (sp-1-2 review): also strip URL-context matches. The whitelist filter
  // catches unknown names, but a URL like https://github.com/.../bmad-dev-story
  // contains a real skill name. Remove URLs from the search space first.
  const contentNoUrls = content.replace(/https?:\/\/\S+/g, ' ');
  const skillRegex = /\b((?:bmad|wds)-[a-z][a-z0-9-]+)\b/g;
  while ((m = skillRegex.exec(contentNoUrls)) !== null) {
    const skillName = m[1];
    if (skillName === name) continue; // self-reference
    if (skillName === 'bmad-init') continue; // universal — handled centrally
    if (validSkillNames && !validSkillNames.has(skillName)) continue; // not a real skill
    deps.add(skillName);
  }

  return Array.from(deps).sort();
}

/**
 * Classify a single skill row. Returns { tier, intent, dependencies } proposal.
 *
 * @param {string[]} row Row fields
 * @param {string[]} header Column names
 * @param {string} projectRoot Absolute project root
 * @param {Set<string>} validSkillNames Whitelist of canonical skill IDs for dep filtering
 */
function classifyRow(row, header, projectRoot, validSkillNames) {
  const idx = (col) => header.indexOf(col);
  const name = row[idx('name')];
  const modulePath = row[idx('path')];

  const intent = classifyIntent(name, modulePath);
  const content = readSkillContent(projectRoot, modulePath);
  const tier = classifyTier(name, modulePath, content, intent);

  // Persona-only agent skills are menu wrappers — they list other skills as
  // menu options, but those are not exporter dependencies. The exporter only
  // needs the persona file itself. Skip dep extraction for them.
  const dependencies =
    name in PERSONA_AGENT_INTENTS
      ? []
      : extractDependencies(name, content, validSkillNames);

  // P3 (sp-1-2 review): unknown intent must NOT silently default to
  // meta-platform — that would mark new/custom skills as framework-internal
  // without warning. Return null to signal "no proposal" so main() can
  // preserve the existing value (if any) and route the row to BORDERLINE.md
  // as a heuristic miss for human review.
  return {
    tier,
    intent, // null when no heuristic matched — main() handles the miss
    dependencies: dependencies.join(';'),
    intentMatched: intent !== null,
  };
}

// =============================================================================
// BORDERLINE.md GENERATION
// =============================================================================

function renderBorderlineMd(date, conflicts, ambiguous, misses) {
  const lines = [
    '# Portability Classification — Borderline Cases',
    '',
    `Generated by \`scripts/portability/classify-skills.js\` on ${date}.`,
    '',
    '## Manual Override Protected',
    '',
  ];
  if (conflicts.length === 0) {
    lines.push('_None._', '');
  } else {
    lines.push('| Skill | Existing | Proposed | Reason |');
    lines.push('|-------|----------|----------|--------|');
    for (const c of conflicts) {
      const existing = `tier=${c.existing.tier} intent=${c.existing.intent} deps=${c.existing.dependencies || '(empty)'}`;
      const proposed = `tier=${c.proposed.tier} intent=${c.proposed.intent} deps=${c.proposed.dependencies || '(empty)'}`;
      lines.push(`| \`${c.name}\` | ${existing} | ${proposed} | ${c.reason} |`);
    }
    lines.push('');
  }

  lines.push('## Ambiguous (multiple plausible classifications)', '');
  if (ambiguous.length === 0) {
    lines.push('_None._', '');
  } else {
    lines.push('| Skill | Tier | Intent | Reason |');
    lines.push('|-------|------|--------|--------|');
    for (const a of ambiguous) {
      lines.push(`| \`${a.name}\` | ${a.tier} | ${a.intent} | ${a.reason} |`);
    }
    lines.push('');
  }

  lines.push('## Heuristic Misses (no clear match)', '');
  if (misses.length === 0) {
    lines.push('_None._', '');
  } else {
    lines.push('| Skill | Best guess | Confidence | Recommendation |');
    lines.push('|-------|-----------|------------|----------------|');
    for (const ms of misses) {
      lines.push(`| \`${ms.name}\` | tier=${ms.tier} intent=${ms.intent} | low | Manual review needed |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  const projectRoot = findProjectRoot();
  const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
  const borderlinePath = path.join(
    projectRoot,
    '_bmad-output',
    'planning-artifacts',
    'portability-borderline.md'
  );

  console.log(`Reading manifest from ${path.relative(projectRoot, manifestPath)}`);
  const { header, rows } = readManifest(manifestPath);

  // Build the set of canonical skill names for dependency-extraction filtering.
  const nameIdx = header.indexOf('name');
  const validSkillNames = new Set(rows.map((r) => r[nameIdx]));

  const tierIdx = header.indexOf('tier');
  const intentIdx = header.indexOf('intent');
  const depsIdx = header.indexOf('dependencies');

  if (tierIdx < 0 || intentIdx < 0 || depsIdx < 0) {
    console.error(
      'ERROR: skill-manifest.csv is missing tier/intent/dependencies columns. Run sp-1-1 first.'
    );
    process.exit(1);
  }

  const conflicts = [];
  const ambiguous = [];
  const misses = [];
  let writes = 0;
  let skips = 0;

  for (const row of rows) {
    const proposal = classifyRow(row, header, projectRoot, validSkillNames);
    const existing = {
      tier: row[tierIdx] || '',
      intent: row[intentIdx] || '',
      dependencies: row[depsIdx] || '',
    };
    const rowName = row[header.indexOf('name')];

    // P3 (sp-1-2 review): if heuristics couldn't determine intent, route to
    // misses and preserve existing values (do not clobber with `meta-platform`).
    if (!proposal.intentMatched) {
      misses.push({
        name: rowName,
        tier: proposal.tier,
        intent: existing.intent || '(none)',
        dependencies: proposal.dependencies,
      });
      // Skip the write so the row keeps whatever value was there before.
      // If the row was previously unclassified, it stays unclassified —
      // visible in BORDERLINE.md and caught by the test that requires
      // every row to have non-empty tier+intent.
      continue;
    }

    // Conflict detection
    const hasExistingClassification =
      existing.tier !== '' && existing.intent !== '';
    const differs =
      existing.tier !== proposal.tier ||
      existing.intent !== proposal.intent ||
      existing.dependencies !== proposal.dependencies;

    if (hasExistingClassification && differs && !force) {
      // Manual override protected
      conflicts.push({
        name: rowName,
        existing,
        proposed: proposal,
        reason: 'Existing values differ from heuristics',
      });
      skips++;
      continue;
    }

    // Apply
    row[tierIdx] = proposal.tier;
    row[intentIdx] = proposal.intent;
    row[depsIdx] = proposal.dependencies;

    if (differs) writes++;

    if (force && hasExistingClassification && differs) {
      conflicts.push({
        name: rowName,
        existing,
        proposed: proposal,
        reason: 'FORCED — manual override clobbered',
      });
    }
  }

  console.log(`Processed ${rows.length} rows: ${writes} updated, ${skips} preserved (manual overrides)`);

  if (dryRun) {
    console.log('\n--- DRY RUN — preview ---');
    for (const row of rows) {
      const name = row[header.indexOf('name')];
      console.log(
        `  ${name.padEnd(50)} tier=${row[tierIdx].padEnd(11)} intent=${row[intentIdx].padEnd(22)} deps=${row[depsIdx] || '(empty)'}`
      );
    }
    console.log(`\nDry run complete. ${conflicts.length} conflicts, ${misses.length} heuristic misses.`);
    return;
  }

  // Write manifest
  writeManifest(manifestPath, header, rows);
  console.log(`Wrote ${path.relative(projectRoot, manifestPath)}`);

  // Write borderline file
  const today = new Date().toISOString().slice(0, 10);
  const md = renderBorderlineMd(today, conflicts, ambiguous, misses);
  fs.mkdirSync(path.dirname(borderlinePath), { recursive: true });
  fs.writeFileSync(borderlinePath, md, 'utf8');
  console.log(`Wrote ${path.relative(projectRoot, borderlinePath)}`);

  console.log(
    `\nSummary: ${writes} updated, ${skips} preserved, ${conflicts.length} conflicts, ${misses.length} heuristic misses.`
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  classifyIntent,
  classifyTier,
  extractDependencies,
  classifyRow,
  readSkillContent,
  // Constants exported for tests
  META_PLATFORM_SKILLS,
  VALID_TIERS,
  VALID_INTENTS,
};
