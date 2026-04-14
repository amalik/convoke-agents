#!/usr/bin/env node
/**
 * validate-exports.js — Story sp-4-2
 *
 * Structural validation of a staging directory produced by seed-catalog-repo.js.
 * Checks every exported skill for markdown validity, forbidden strings, persona
 * sections, platform install instructions, and generates a VALIDATION-REPORT.md
 * with automated results + manual test checklists.
 *
 * Usage:
 *   node scripts/portability/validate-exports.js --input <path>
 *   node scripts/portability/validate-exports.js --input <path> --report <path>
 *   node scripts/portability/validate-exports.js --help
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONSTANTS
// =============================================================================

const { FORBIDDEN_STRINGS } = require('./test-constants');

const XML_TAGS = [
  '<workflow>', '</workflow>', '<step ', '</step>', '<action>', '</action>',
  '<check ', '</check>', '<critical>', '</critical>', '<output>', '</output>',
  '<ask>', '</ask>',
];

const MANUAL_SMOKE_SKILLS = [
  { name: 'bmad-brainstorming', persona: 'Carson', role: 'brainstorming facilitator' },
  { name: 'bmad-agent-architect', persona: 'Winston', role: 'system architect' },
  { name: 'bmad-tea', persona: 'Murat', role: 'test architect' },
];

// =============================================================================
// VALIDATION CHECKS
// =============================================================================

function validateInstructions(filePath, skillName) {
  const issues = [];
  if (!fs.existsSync(filePath)) {
    issues.push({ skill: skillName, file: 'instructions.md', issue: 'file missing' });
    return issues;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Starts with # heading
  if (!content.startsWith('# ')) {
    issues.push({ skill: skillName, file: 'instructions.md', issue: 'does not start with # heading' });
  }

  // Persona section
  if (!content.includes('## You are')) {
    issues.push({ skill: skillName, file: 'instructions.md', issue: 'missing ## You are section' });
  }

  // Workflow section
  if (!content.includes('## How to proceed')) {
    issues.push({ skill: skillName, file: 'instructions.md', issue: 'missing ## How to proceed section' });
  }

  // Forbidden strings
  for (const forbidden of FORBIDDEN_STRINGS) {
    if (content.includes(forbidden)) {
      issues.push({ skill: skillName, file: 'instructions.md', issue: `contains forbidden: "${forbidden}"` });
    }
  }

  // XML tags remaining
  for (const tag of XML_TAGS) {
    if (content.includes(tag)) {
      issues.push({ skill: skillName, file: 'instructions.md', issue: `contains XML tag: ${tag}` });
    }
  }

  // Frontmatter blocks
  // Check for YAML frontmatter at the START of the file (no m flag — ^ = string start)
  if (/^---\n[\s\S]*?\n---\n/.test(content)) {
    issues.push({ skill: skillName, file: 'instructions.md', issue: 'contains frontmatter block' });
  }

  // Framework-only (pipeline) skills skip strict structural checks since they
  // intentionally reference framework-internal paths and may have unbalanced
  // fences after transformations strip framework scaffolding
  const isFrameworkOnly = content.includes('⚠️ Framework-only skill.');

  // Balanced code fences (skipped for framework-only)
  if (!isFrameworkOnly) {
    const fenceCount = (content.match(/^```/gm) || []).length;
    if (fenceCount % 2 !== 0) {
      issues.push({ skill: skillName, file: 'instructions.md', issue: `unbalanced code fences (${fenceCount} found)` });
    }
  }

  // Broken markdown links (skipped for framework-only)
  if (!isFrameworkOnly) {
    // Broken markdown links (links to local files that aren't URLs or anchors)
    const localLinks = [...content.matchAll(/\[([^\]]*)\]\((?!https?:\/\/|#|mailto:)([^)]+)\)/g)];
    for (const match of localLinks) {
      const linkTarget = match[2];
      // Skip links containing template placeholders or non-path content
      if (linkTarget.includes('[') || linkTarget.includes('{')) continue;
      if (linkTarget.includes(' ')) continue; // URLs/paths don't have spaces; this is prose like "(none found)"
      const resolved = path.resolve(path.dirname(filePath), linkTarget);
      if (!fs.existsSync(resolved)) {
        issues.push({ skill: skillName, file: 'instructions.md', issue: `broken link: [${match[1]}](${linkTarget})` });
      }
    }
  }


  return issues;
}

function validateReadme(filePath, skillName) {
  const issues = [];
  if (!fs.existsSync(filePath)) {
    issues.push({ skill: skillName, file: 'README.md', issue: 'file missing' });
    return issues;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // 3 platform sections
  if (!content.includes('Claude Code')) {
    issues.push({ skill: skillName, file: 'README.md', issue: 'missing Claude Code section' });
  }
  if (!content.includes('Copilot')) {
    issues.push({ skill: skillName, file: 'README.md', issue: 'missing Copilot section' });
  }
  if (!content.includes('Cursor')) {
    issues.push({ skill: skillName, file: 'README.md', issue: 'missing Cursor section' });
  }

  // Line count
  const lineCount = content.split('\n').length;
  if (lineCount > 80) {
    issues.push({ skill: skillName, file: 'README.md', issue: `${lineCount} lines (exceeds 80)` });
  }

  // No HTML comments in output
  if (content.includes('<!--')) {
    issues.push({ skill: skillName, file: 'README.md', issue: 'contains HTML comments' });
  }

  return issues;
}

function validateStagingDir(inputDir) {
  const allIssues = [];

  // Check root files
  if (!fs.existsSync(path.join(inputDir, 'README.md'))) {
    allIssues.push({ skill: 'ROOT', file: 'README.md', issue: 'missing catalog README' });
  }
  if (!fs.existsSync(path.join(inputDir, 'LICENSE'))) {
    allIssues.push({ skill: 'ROOT', file: 'LICENSE', issue: 'missing' });
  }
  if (!fs.existsSync(path.join(inputDir, 'CONTRIBUTING.md'))) {
    allIssues.push({ skill: 'ROOT', file: 'CONTRIBUTING.md', issue: 'missing' });
  }

  // Validate each skill directory
  const entries = fs.readdirSync(inputDir, { withFileTypes: true });
  const skillDirs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort();

  for (const skillName of skillDirs) {
    const skillDir = path.join(inputDir, skillName);
    allIssues.push(
      ...validateInstructions(path.join(skillDir, 'instructions.md'), skillName),
      ...validateReadme(path.join(skillDir, 'README.md'), skillName)
    );
  }

  return { issues: allIssues, skillCount: skillDirs.length, skillDirs };
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

function generateReport(inputDir, validationResult) {
  const { issues, skillCount, skillDirs } = validationResult;
  const date = new Date().toISOString().slice(0, 10);
  const passCount = skillDirs.filter(
    (d) => !issues.some((i) => i.skill === d)
  ).length;
  const failCount = skillCount - passCount;

  const lines = [];

  lines.push('# Export Validation Report');
  lines.push('');
  lines.push(`**Date:** ${date}`);
  lines.push(`**Skills validated:** ${skillCount}`);
  lines.push(`**Automated checks:** ${issues.length === 0 ? 'ALL PASSED' : `${issues.length} issue(s) found`}`);
  lines.push(`**Pass/Fail:** ${passCount} passed, ${failCount} failed`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Automated results
  lines.push('## Automated Structural Checks');
  lines.push('');
  if (issues.length === 0) {
    lines.push('All checks passed across all exported skills.');
  } else {
    lines.push('| Skill | File | Issue |');
    lines.push('|---|---|---|');
    for (const issue of issues) {
      lines.push(`| ${issue.skill} | ${issue.file} | ${issue.issue} |`);
    }
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Manual Claude Code smoke tests
  lines.push('## Manual Smoke Tests — Claude Code');
  lines.push('');
  lines.push('Copy each skill into a clean project and invoke it. Verify persona behavior.');
  lines.push('');
  for (const skill of MANUAL_SMOKE_SKILLS) {
    lines.push(`### ${skill.persona} (${skill.name})`);
    lines.push('');
    lines.push(`- [ ] [PENDING] Copied \`${skill.name}/instructions.md\` to \`.claude/skills/${skill.name}/SKILL.md\``);
    lines.push(`- [ ] [PENDING] Invoked skill — ${skill.persona} introduces self as ${skill.role}`);
    lines.push(`- [ ] [PENDING] No references to \`_bmad/\`, \`bmad-init\`, or missing files`);
    lines.push(`- [ ] [PENDING] Skill produces usable output`);
    lines.push('');
  }
  lines.push('---');
  lines.push('');

  // Manual Catalog walkthrough
  lines.push('## Manual Catalog Walkthrough');
  lines.push('');
  lines.push('Have a teammate unfamiliar with BMAD read the catalog README.');
  lines.push('');
  lines.push('- [ ] [PENDING] Reader can identify what each intent category means');
  lines.push('- [ ] [PENDING] Reader finds a skill matching "I want to brainstorm" within 60 seconds');
  lines.push('- [ ] [PENDING] Tier badges are clear — "Ready to use" vs "Framework only" understood');
  lines.push('- [ ] [PENDING] "How to use a skill" section gives enough context to install');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`*Generated by validate-exports.js on ${date}.*`);
  lines.push('');

  return lines.join('\n');
}

// =============================================================================
// CLI
// =============================================================================

function printHelp() {
  process.stdout.write(
    [
      'Usage: validate-exports --input <path> [--report <path>]',
      '',
      'Validate a staging directory produced by seed-catalog-repo.js.',
      '',
      'Options:',
      '  --input <path>    Staging directory to validate (required)',
      '  --report <path>   Write VALIDATION-REPORT.md to this path (optional)',
      '  --help, -h        Show this help message',
      '',
      'Exit codes:',
      '  0  All checks passed',
      '  1  Validation failures found',
      '  2  Usage error',
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

  let inputDir = null;
  let reportPath = null;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--input') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        process.stderr.write('Error: --input requires a path argument\n');
        return 2;
      }
      inputDir = argv[++i];
    } else if (argv[i] === '--report') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        process.stderr.write('Error: --report requires a path argument\n');
        return 2;
      }
      reportPath = argv[++i];
    } else if (argv[i].startsWith('--')) {
      process.stderr.write(`Unknown flag: ${argv[i]}. Run --help for usage.\n`);
      return 2;
    }
  }

  if (!inputDir) {
    process.stderr.write('Error: --input <path> is required. Run --help for usage.\n');
    return 2;
  }

  if (!fs.existsSync(inputDir)) {
    process.stderr.write(`Error: input directory "${inputDir}" does not exist\n`);
    return 2;
  }
  if (!fs.statSync(inputDir).isDirectory()) {
    process.stderr.write(`Error: "${inputDir}" is not a directory\n`);
    return 2;
  }

  console.log(`Validating exports in ${inputDir}...`);
  const result = validateStagingDir(inputDir);

  if (result.issues.length === 0) {
    console.log(`All checks passed (${result.skillCount} skills validated)`);
  } else {
    console.log(`${result.issues.length} issue(s) found across ${result.skillCount} skills:`);
    for (const issue of result.issues) {
      console.log(`  ${issue.skill}/${issue.file}: ${issue.issue}`);
    }
  }

  if (reportPath) {
    const report = generateReport(inputDir, result);
    const reportDir = path.dirname(reportPath);
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(reportPath, report);
    console.log(`Validation report written to ${reportPath}`);
  }

  return result.issues.length === 0 ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { validateStagingDir, generateReport, main };
