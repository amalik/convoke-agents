#!/usr/bin/env node
/**
 * seed-catalog-repo.js — Story sp-4-1
 *
 * Generates the complete convoke-skills-catalog repo content into a staging
 * directory. Orchestrates the export engine, catalog generator, and README
 * builder into a single pipeline with built-in self-verification.
 *
 * Usage:
 *   node scripts/portability/seed-catalog-repo.js --output <path>
 *   node scripts/portability/seed-catalog-repo.js --help
 *
 * The script does NOT create a git repo or interact with GitHub.
 * It only produces a directory tree. The user handles git init + push.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { findProjectRoot } = require('../update/lib/utils');
const { readManifest } = require('./manifest-csv');
const { exportSkill, loadSkillRow } = require('./export-engine');
const { generateCatalog } = require('./catalog-generator');
const { buildReadme } = require('./convoke-export');
const { generateAdapters } = require('./generate-adapters');

// =============================================================================
// CONSTANTS
// =============================================================================

const { FORBIDDEN_STRINGS } = require('./test-constants');

const MIT_LICENSE = `MIT License

Copyright (c) 2026 Convoke Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

const CONTRIBUTING_MD = `# Contributing

The skills in this repository are **auto-generated** from the main [Convoke Agents](https://github.com/amalik/convoke-agents) repository. They are regenerated on each release.

## Important

- **Do not edit skill files directly.** Your changes will be overwritten on the next regeneration.
- To improve a skill's content, contribute to the source skill in the main Convoke repo.
- To request a new skill or report an issue, [open an issue](https://github.com/amalik/convoke-agents/issues) on the main repo.

## How skills are generated

Each skill is exported from the Convoke framework using the \`convoke-export\` tool, which:

1. Reads the skill's source files (agent definition, workflow, step files)
2. Transforms them into an LLM-agnostic \`instructions.md\` format
3. Generates a per-skill \`README.md\` with install instructions for Claude Code, GitHub Copilot, and Cursor
4. Produces this catalog \`README.md\` organized by user intent

## License

This repository is licensed under the MIT License. See [LICENSE](LICENSE) for details.
`;

// =============================================================================
// GENERATION PIPELINE
// =============================================================================

function generate(outputDir, projectRoot) {
  const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
  const { header, rows } = readManifest(manifestPath);
  const nameIdx = header.indexOf('name');
  const tierIdx = header.indexOf('tier');

  // Get unique exportable skill names (standalone + light-deps)
  const seen = new Set();
  const exportableNames = [];
  for (const row of rows) {
    const name = row[nameIdx];
    if (seen.has(name)) continue;
    seen.add(name);
    if (row[tierIdx] === 'standalone' || row[tierIdx] === 'light-deps') {
      exportableNames.push(name);
    }
  }
  exportableNames.sort();

  console.log(`Exporting ${exportableNames.length} skills (standalone + light-deps)...`);

  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });

  // Export each skill
  let exportedCount = 0;
  const failures = [];
  for (const skillName of exportableNames) {
    try {
      const result = exportSkill(skillName, projectRoot);
      const skillRow = loadSkillRow(skillName, projectRoot);
      const readme = buildReadme(skillRow, result, projectRoot);

      const skillDir = path.join(outputDir, skillName);
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'instructions.md'), result.instructions);
      fs.writeFileSync(path.join(skillDir, 'README.md'), readme);
      generateAdapters(skillName, skillRow, result.instructions, skillDir);
      exportedCount++;
    } catch (err) {
      failures.push({ skill: skillName, error: err.message.split('\n')[0] });
    }
  }

  if (failures.length > 0) {
    console.error(`${failures.length} skill(s) failed to export:`);
    for (const f of failures) {
      console.error(`  ${f.skill}: ${f.error}`);
    }
    throw new Error(`${failures.length} skill export(s) failed`);
  }

  console.log(`Exported ${exportedCount} skills successfully.`);

  // Generate catalog README
  console.log('Generating catalog README...');
  const catalogReadme = generateCatalog(projectRoot);
  fs.writeFileSync(path.join(outputDir, 'README.md'), catalogReadme);

  // Write LICENSE
  fs.writeFileSync(path.join(outputDir, 'LICENSE'), MIT_LICENSE);

  // Write CONTRIBUTING.md
  fs.writeFileSync(path.join(outputDir, 'CONTRIBUTING.md'), CONTRIBUTING_MD);

  console.log('Generation complete.');
  return { skillCount: exportedCount, expectedCount: exportableNames.length };
}

// =============================================================================
// SELF-VERIFICATION
// =============================================================================

function verify(outputDir, expectedSkillCount) {
  const failures = [];

  // 1. Directory count
  const entries = fs.readdirSync(outputDir, { withFileTypes: true });
  const skillDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  if (skillDirs.length !== expectedSkillCount) {
    failures.push(`Directory count: expected ${expectedSkillCount}, got ${skillDirs.length}`);
  }

  // 2. Every skill dir has both files
  for (const dir of skillDirs) {
    const instrPath = path.join(outputDir, dir, 'instructions.md');
    const readmePath = path.join(outputDir, dir, 'README.md');
    if (!fs.existsSync(instrPath)) {
      failures.push(`${dir}: missing instructions.md`);
    }
    if (!fs.existsSync(readmePath)) {
      failures.push(`${dir}: missing README.md`);
    }
  }

  // 3. Zero forbidden strings in all instructions.md
  for (const dir of skillDirs) {
    const instrPath = path.join(outputDir, dir, 'instructions.md');
    if (!fs.existsSync(instrPath)) continue;
    const content = fs.readFileSync(instrPath, 'utf8');
    for (const forbidden of FORBIDDEN_STRINGS) {
      if (content.includes(forbidden)) {
        failures.push(`${dir}/instructions.md: contains "${forbidden}"`);
      }
    }
  }

  // 4. README validity (How to use, 3 platforms, under 80 lines)
  for (const dir of skillDirs) {
    const readmePath = path.join(outputDir, dir, 'README.md');
    if (!fs.existsSync(readmePath)) continue;
    const content = fs.readFileSync(readmePath, 'utf8');
    if (!content.includes('How to use')) {
      failures.push(`${dir}/README.md: missing "How to use"`);
    }
    if (!content.includes('Claude Code')) {
      failures.push(`${dir}/README.md: missing Claude Code section`);
    }
    if (!content.includes('Copilot')) {
      failures.push(`${dir}/README.md: missing Copilot section`);
    }
    if (!content.includes('Cursor')) {
      failures.push(`${dir}/README.md: missing Cursor section`);
    }
    const lineCount = content.split('\n').length;
    if (lineCount > 80) {
      failures.push(`${dir}/README.md: ${lineCount} lines (exceeds 80)`);
    }
  }

  // 4b. Adapters exist for each skill
  for (const dir of skillDirs) {
    const adaptersBase = path.join(outputDir, dir, 'adapters');
    if (!fs.existsSync(path.join(adaptersBase, 'claude-code', 'SKILL.md'))) {
      failures.push(`${dir}: missing adapters/claude-code/SKILL.md`);
    }
    if (!fs.existsSync(path.join(adaptersBase, 'copilot', 'copilot-instructions.md'))) {
      failures.push(`${dir}: missing adapters/copilot/copilot-instructions.md`);
    }
    if (!fs.existsSync(path.join(adaptersBase, 'cursor', `${dir}.md`))) {
      failures.push(`${dir}: missing adapters/cursor/${dir}.md`);
    }
  }

  // 5. Zero _bmad/ or .claude/hooks in ANY file
  const allFiles = [];
  function collectMdFiles(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectMdFiles(full);
      } else if (entry.name.endsWith('.md')) {
        allFiles.push(full);
      }
    }
  }
  collectMdFiles(outputDir);
  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const rel = path.relative(outputDir, filePath);
    if (content.includes('_bmad/')) {
      failures.push(`${rel}: contains "_bmad/"`);
    }
    if (content.includes('.claude/hooks')) {
      failures.push(`${rel}: contains ".claude/hooks"`);
    }
  }

  // 6. Root README
  const rootReadme = path.join(outputDir, 'README.md');
  if (!fs.existsSync(rootReadme)) {
    failures.push('Root README.md missing');
  } else {
    const content = fs.readFileSync(rootReadme, 'utf8');
    if (!content.includes('# Convoke Skills Catalog')) {
      failures.push('Root README.md: missing "# Convoke Skills Catalog" heading');
    }
  }

  // 7. LICENSE
  const licensePath = path.join(outputDir, 'LICENSE');
  if (!fs.existsSync(licensePath)) {
    failures.push('LICENSE missing');
  } else {
    const content = fs.readFileSync(licensePath, 'utf8');
    if (!content.includes('MIT')) {
      failures.push('LICENSE: does not contain "MIT"');
    }
  }

  // 8. CONTRIBUTING.md
  const contribPath = path.join(outputDir, 'CONTRIBUTING.md');
  if (!fs.existsSync(contribPath)) {
    failures.push('CONTRIBUTING.md missing');
  } else {
    const content = fs.readFileSync(contribPath, 'utf8');
    if (!content.includes('auto-generated')) {
      failures.push('CONTRIBUTING.md: does not contain "auto-generated"');
    }
  }

  return failures;
}

// =============================================================================
// CLI
// =============================================================================

function printHelp() {
  process.stdout.write(
    [
      'Usage: seed-catalog-repo --output <path>',
      '',
      'Generate the complete convoke-skills-catalog repo content into a staging directory.',
      'Does NOT create a git repo or interact with GitHub.',
      '',
      'Options:',
      '  --output <path>   Staging directory path (required)',
      '  --help, -h        Show this help message',
      '',
      'Exit codes:',
      '  0  Success (all skills exported, verification passed)',
      '  1  Usage error',
      '  2  Generation failure',
      '  3  Verification failure',
      '',
      'After the staging directory is generated, you can create the repo manually:',
      '',
      '  cd <staging-dir>',
      '  git init',
      '  git add -A',
      '  git commit -m "Initial catalog seed"',
      '  gh repo create convoke-skills-catalog --public --source=. --push',
      '',
    ].join('\n')
  );
}

function main() {
  const argv = process.argv.slice(2);

  if (argv.includes('--help') || argv.includes('-h') || argv.length === 0) {
    printHelp();
    return argv.length === 0 ? 1 : 0;
  }

  let outputDir = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--output') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        process.stderr.write('Error: --output requires a path argument\n');
        return 1;
      }
      outputDir = argv[++i];
    } else if (argv[i].startsWith('--')) {
      process.stderr.write(`Unknown flag: ${argv[i]}. Run --help for usage.\n`);
      return 1;
    }
  }

  if (!outputDir) {
    process.stderr.write('Error: --output <path> is required. Run --help for usage.\n');
    return 1;
  }

  // Resolve output path
  outputDir = path.isAbsolute(outputDir) ? outputDir : path.resolve(process.cwd(), outputDir);

  let projectRoot;
  try {
    projectRoot = findProjectRoot();
  } catch (e) {
    process.stderr.write(`Error: could not find project root — ${e.message}\n`);
    return 2;
  }

  // Safety: refuse to write into a non-empty pre-existing directory.
  // Prevents destructive cleanup from deleting user content on failure.
  if (fs.existsSync(outputDir)) {
    const existing = fs.readdirSync(outputDir);
    if (existing.length > 0) {
      process.stderr.write(`Error: output directory "${outputDir}" already exists and is non-empty.\nUse an empty or non-existent path.\n`);
      return 1;
    }
  }
  const dirCreatedByUs = !fs.existsSync(outputDir);

  // Generate
  let genResult;
  try {
    genResult = generate(outputDir, projectRoot);
  } catch (e) {
    process.stderr.write(`Generation failed: ${e.message}\n`);
    // Only clean up if WE created the directory
    if (dirCreatedByUs && fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
    return 2;
  }

  // Verify
  let failures;
  try {
    console.log('Running verification...');
    failures = verify(outputDir, genResult.expectedCount);
  } catch (e) {
    process.stderr.write(`Verification crashed: ${e.message}\n`);
    if (dirCreatedByUs && fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
    return 3;
  }

  if (failures.length > 0) {
    process.stderr.write(`Verification failed with ${failures.length} issue(s):\n`);
    for (const f of failures) {
      process.stderr.write(`  - ${f}\n`);
    }
    if (dirCreatedByUs) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
    return 3;
  }

  console.log(`\nCatalog staging complete!`);
  console.log(`  Skills: ${genResult.skillCount}`);
  console.log(`  Directory: ${outputDir}`);
  console.log(`  Files: ${genResult.skillCount * 2 + 3} (${genResult.skillCount} x instructions.md + README.md + catalog + LICENSE + CONTRIBUTING.md)`);
  console.log(`  Verification: PASSED (zero violations)`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${outputDir}`);
  console.log(`  git init && git add -A && git commit -m "Initial catalog seed"`);
  console.log(`  gh repo create convoke-skills-catalog --public --source=. --push`);

  return 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { generate, verify, main };
