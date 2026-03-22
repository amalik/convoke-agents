#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { findProjectRoot } = require('./update/lib/utils');

// --- Category registry from ADR ---
const VALID_CATEGORIES = [
  'prd', 'epic', 'arch', 'adr', 'brief', 'report', 'spec', 'vision',
  'hc', 'persona', 'experiment', 'learning', 'sprint', 'decision',
  'research'
];

const NAMING_PATTERN = /^[a-z][a-z0-9-]*\.(?:md|yaml)$/;

// Living documents that are exempt from the category prefix requirement
const EXEMPT_FILES = [
  'architecture.md', 'architecture-gyre.md',
  'prd.md', 'initiatives-backlog.md'
];

// Directories to scan for superseded files (relative to _bmad-output/)
const SCAN_DIRS = ['planning-artifacts', 'vortex-artifacts', 'implementation-artifacts'];

// Directories/files to skip when scanning _bmad-output/ root
const SKIP_ROOT = ['.backups', '.logs', '_archive', ...SCAN_DIRS,
  'brainstorming', 'design-artifacts', 'journey-examples',
  'project-documentation', 'test-artifacts'];

function isValidCategory(cat) {
  const base = cat.replace(/\d+$/, '');
  return VALID_CATEGORIES.includes(base) || VALID_CATEGORIES.includes(cat);
}

const DATED_PATTERN = /^(.+)-(\d{4}-\d{2}-\d{2})\.(md|yaml)$/;
const CATEGORIZED_PATTERN = /^([a-z]+\d*)-(.+)\.(md|yaml)$/;

// --- Helpers ---

function parseFilename(filename) {
  const lower = filename.toLowerCase();
  const dated = lower.match(DATED_PATTERN);
  const categorized = lower.match(CATEGORIZED_PATTERN);

  return {
    filename,
    isDated: !!dated,
    date: dated ? dated[2] : null,
    baseName: dated ? dated[1] : lower.replace(/\.(md|yaml)$/, ''),
    category: categorized ? categorized[1] : null,
    hasValidCategory: categorized ? isValidCategory(categorized[1]) : false,
    isUppercase: filename !== lower,
    matchesConvention: NAMING_PATTERN.test(filename) && categorized && isValidCategory(categorized[1])
  };
}

function toLowerKebab(filename) {
  return filename.toLowerCase();
}

function groupByKey(files) {
  const groups = {};
  for (const f of files) {
    if (!f.isDated) continue;
    const key = f.baseName;
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  }
  return groups;
}

function appendToIndex(indexPath, entries) {
  const date = new Date().toISOString().split('T')[0];
  let content = '';

  if (!fs.existsSync(indexPath)) {
    content = '# Archive Index\n\n_Traceability log for archived artifacts. Append-only._\n\n';
  }

  content += `\n## Automated archive — ${date}\n\n`;
  content += '| File | Original Location | Archive Date | Reason |\n';
  content += '|------|-------------------|--------------|--------|\n';

  for (const entry of entries) {
    content += `| ${entry.archivedAs || entry.filename} | ${entry.originalDir}/ | ${date} | ${entry.reason} |\n`;
  }

  fs.appendFileSync(indexPath, content);
}

// --- Main ---

async function run() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const rename = args.includes('--rename');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log(`
Usage: node scripts/archive.js [options]

Options:
  --apply           Execute changes (default: dry-run)
  --rename          Include naming convention checks and fixes
  --rename --apply  Fix uppercase filenames and archive loose root files
  --help            Show this help

Dry-run by default — shows what would happen without changing anything.
`);
    return;
  }

  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    console.error('Error: Could not find project root (_bmad/ directory not found).');
    process.exit(1);
  }

  const outputDir = path.join(projectRoot, '_bmad-output');
  const archiveDir = path.join(outputDir, '_archive');
  const indexPath = path.join(archiveDir, 'INDEX.md');

  const actions = { archive: [], rename: [], warnings: [] };

  // 1. Scan subdirectories for superseded dated files
  for (const dir of SCAN_DIRS) {
    const fullDir = path.join(outputDir, dir);
    if (!fs.existsSync(fullDir)) continue;

    const files = (await fs.readdir(fullDir))
      .filter(f => !f.startsWith('.'))
      .map(f => ({ ...parseFilename(f), dir }));

    // Find superseded versions
    const groups = groupByKey(files);
    for (const [, group] of Object.entries(groups)) {
      if (group.length <= 1) continue;

      group.sort((a, b) => b.date.localeCompare(a.date));
      const [newest, ...older] = group;

      for (const old of older) {
        actions.archive.push({
          filename: old.filename,
          originalDir: dir,
          from: path.join(fullDir, old.filename),
          to: path.join(archiveDir, 'superseded', old.filename),
          reason: `Superseded by ${newest.filename}`
        });
      }
    }

    // Flag naming convention violations in subdirs
    if (rename) {
      for (const f of files) {
        if (f.matchesConvention) continue;
        if (EXEMPT_FILES.includes(f.filename)) continue;

        const issues = [];
        if (f.isUppercase) {
          issues.push('uppercase in filename');
          const newName = toLowerKebab(f.filename);
          actions.rename.push({
            filename: f.filename,
            newName,
            dir,
            from: path.join(fullDir, f.filename),
            to: path.join(fullDir, newName)
          });
        }
        if (!NAMING_PATTERN.test(f.filename) && !f.isUppercase) {
          issues.push('not lowercase kebab-case');
        }
        if (!f.hasValidCategory) {
          issues.push(`no valid category prefix (has: ${f.category || 'none'})`);
        }

        if (issues.length > 0) {
          actions.warnings.push({
            filename: f.filename,
            dir,
            issues
          });
        }
      }
    }
  }

  // 2. Scan _bmad-output/ root for loose files
  const rootFiles = (await fs.readdir(outputDir))
    .filter(f => {
      if (f.startsWith('.')) return false;
      if (SKIP_ROOT.includes(f)) return false;
      const fullPath = path.join(outputDir, f);
      return fs.statSync(fullPath).isFile();
    });

  if (rootFiles.length > 0) {
    for (const f of rootFiles) {
      const archivedAs = toLowerKebab(f);
      actions.archive.push({
        filename: f,
        archivedAs,
        originalDir: '_bmad-output (root)',
        from: path.join(outputDir, f),
        to: path.join(archiveDir, 'exploratory', archivedAs),
        reason: 'Loose file in _bmad-output root — archived as historical'
      });
    }
  }

  // --- Report ---

  const mode = apply ? 'APPLY' : 'DRY-RUN';
  console.log(`\n=== Convoke Archive (${mode}) ===\n`);

  const totalActions = actions.archive.length + actions.rename.length + actions.warnings.length;
  if (totalActions === 0) {
    console.log('Everything looks clean. No actions needed.');
    return;
  }

  // Loose/superseded files to archive
  if (actions.archive.length > 0) {
    console.log(`📦 Files to archive: ${actions.archive.length}\n`);
    for (const a of actions.archive) {
      const dest = path.relative(outputDir, a.to);
      console.log(`  ${a.originalDir === '_bmad-output (root)' ? '' : a.originalDir + '/'}${a.filename}`);
      console.log(`    → ${dest}`);
      console.log(`    Reason: ${a.reason}\n`);
    }
  }

  // Renames (uppercase → lowercase)
  if (actions.rename.length > 0) {
    console.log(`✏️  Files to rename: ${actions.rename.length}\n`);
    for (const r of actions.rename) {
      console.log(`  ${r.dir}/${r.filename}  →  ${r.newName}`);
    }
    console.log('');
  }

  // Convention warnings (non-actionable — just flagged)
  if (actions.warnings.length > 0) {
    console.log(`⚠️  Naming convention warnings: ${actions.warnings.length}\n`);
    for (const w of actions.warnings) {
      console.log(`  ${w.dir}/${w.filename}`);
      console.log(`    Issues: ${w.issues.join(', ')}`);
    }
    console.log('');
  }

  // Execute if --apply
  if (apply) {
    let executed = 0;

    // Archive moves
    if (actions.archive.length > 0) {
      console.log('Executing archive moves...\n');
      const indexEntries = [];

      for (const a of actions.archive) {
        await fs.ensureDir(path.dirname(a.to));
        await fs.move(a.from, a.to, { overwrite: false });
        indexEntries.push(a);
        executed++;
        console.log(`  ✅ Archived: ${a.filename}${a.archivedAs && a.archivedAs !== a.filename ? ` → ${a.archivedAs}` : ''}`);
      }

      appendToIndex(indexPath, indexEntries);
      console.log(`\n📋 Updated _archive/INDEX.md with ${indexEntries.length} entries.`);
    }

    // Renames
    if (rename && actions.rename.length > 0) {
      console.log('\nExecuting renames...\n');
      for (const r of actions.rename) {
        await fs.move(r.from, r.to, { overwrite: false });
        executed++;
        console.log(`  ✅ Renamed: ${r.filename} → ${r.newName}`);
      }
    }

    console.log(`\nDone. ${executed} actions executed.`);
  }

  // Summary
  console.log('\n--- Summary ---');
  console.log(`  Files to archive: ${actions.archive.length}`);
  if (rename) {
    console.log(`  Files to rename: ${actions.rename.length}`);
    console.log(`  Convention warnings: ${actions.warnings.length}`);
  }
  if (!apply && (actions.archive.length > 0 || actions.rename.length > 0)) {
    console.log('\n  Run with --apply to execute changes.');
  }
  console.log('');
}

run().catch(err => {
  console.error('Archive error:', err.message);
  process.exit(1);
});
