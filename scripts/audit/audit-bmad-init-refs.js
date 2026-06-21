#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const path = require('path');
const frontmatter = require('../lib/frontmatter');

const { findProjectRoot } = require('../update/lib/utils');

/**
 * Audit tool: inventory SKILL.md files invoking bmad-init at activation.
 *
 * Scans `_bmad/**\/SKILL.md` for the canonical v6.3 sweep pattern
 * `1. **Load config via bmad-init skill**` (canonical) and any other
 * `bmad-init` / `bmad_init` mentions (candidates). Writes a frozen
 * CSV inventory at `_bmad/_config/v6.3-migration-inventory.csv` for
 * Story 1A.4's migration script Phase 3 consumption.
 *
 * Pattern 1 module structure. Reused by `--verify-only` drift-detection
 * in CI. Self-references under `_bmad/core/bmad-init/**` are filtered
 * out of both canonical and candidate sets.
 *
 * @module scripts/audit/audit-bmad-init-refs
 */

// --- Constants ---

const CANONICAL_PATTERN_RE = /^1\. \*\*Load config via bmad-init skill\*\*/m;
const BMAD_INIT_MENTION_RE = /bmad-init|bmad_init/;
// Trailing slash is load-bearing: ensures segment-aware matching so a future
// _bmad/core/bmad-init-v2/ (or similar sibling) is NOT incorrectly filtered
// as a self-reference via substring prefix.
const SELF_REF_PREFIX = '_bmad/core/bmad-init/';
const INVENTORY_CSV_PATH = '_bmad/_config/v6.3-migration-inventory.csv';
const CSV_HEADER = 'file,module_config_path,module,agent_name,pattern_matched,candidate_status';

// --- Public API ---

/**
 * Scan the `_bmad/` tree for SKILL.md files invoking bmad-init at activation.
 *
 * @param {string} projectRoot - Absolute path to project root.
 * @returns {Array<{file: string, moduleConfigPath: string, module: string, agentName: string, patternMatched: string, candidateStatus: 'canonical'|'candidate'}>}
 *   Sorted alphabetically by `file` for deterministic output.
 */
function scanBmadInitRefs(projectRoot) {
  if (typeof projectRoot !== 'string' || !projectRoot) {
    throw new TypeError('scanBmadInitRefs: projectRoot must be a non-empty string');
  }
  const bmadRoot = path.join(projectRoot, '_bmad');
  if (!fs.existsSync(bmadRoot)) {
    throw new Error(`scanBmadInitRefs: _bmad/ not found under ${projectRoot}`);
  }

  const skillFiles = _findSkillMdFiles(bmadRoot);
  const entries = [];

  for (const absPath of skillFiles) {
    const relPath = path.relative(projectRoot, absPath).split(path.sep).join('/');

    // Filter self-references: _bmad/core/bmad-init/** files mention bmad-init
    // heavily but ARE the thing being deprecated, not sweep targets.
    if (relPath.startsWith(SELF_REF_PREFIX)) continue;

    const raw = fs.readFileSync(absPath, 'utf8');
    const canonical = CANONICAL_PATTERN_RE.exec(raw);
    const mentioned = BMAD_INIT_MENTION_RE.test(raw);

    if (!canonical && !mentioned) continue;

    const parsed = _tryParseFrontmatter(raw);
    const moduleSegment = _firstSegmentUnderBmad(relPath);
    const agentName = (parsed && parsed.data && parsed.data.name) || _inferAgentNameFromPath(relPath);

    entries.push({
      file: relPath,
      moduleConfigPath: moduleSegment,
      module: moduleSegment,
      agentName,
      patternMatched: canonical ? canonical[0] : '(candidate — non-canonical mention)',
      candidateStatus: canonical ? 'canonical' : 'candidate',
    });
  }

  entries.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));

  // Per-entry verification (AC6): warn on anomalies, don't remove entries.
  for (const entry of entries) {
    const absPath = path.join(projectRoot, entry.file);
    if (!fs.existsSync(absPath)) {
      console.warn(`[audit-bmad-init-refs] WARN: file disappeared during scan: ${entry.file}`);
      continue;
    }
    const configYaml = path.join(projectRoot, '_bmad', entry.moduleConfigPath, 'config.yaml');
    if (!fs.existsSync(configYaml)) {
      console.warn(
        `[audit-bmad-init-refs] WARN: module config missing for ${entry.file} ` +
        `(expected ${configYaml})`
      );
    }
  }

  return entries;
}

/**
 * Serialize entries to CSV with RFC 4180 quoting.
 *
 * @param {Array} entries - Output of scanBmadInitRefs.
 * @param {string} outputPath - Absolute path to write the CSV.
 */
function writeInventoryCsv(entries, outputPath) {
  if (!Array.isArray(entries)) {
    throw new TypeError('writeInventoryCsv: entries must be an array');
  }
  if (typeof outputPath !== 'string' || !outputPath) {
    throw new TypeError('writeInventoryCsv: outputPath must be a non-empty string');
  }
  const lines = [CSV_HEADER];
  for (const e of entries) {
    lines.push([
      _formatCsvValue(e.file),
      _formatCsvValue(e.moduleConfigPath),
      _formatCsvValue(e.module),
      _formatCsvValue(e.agentName),
      _formatCsvValue(e.patternMatched),
      _formatCsvValue(e.candidateStatus),
    ].join(','));
  }
  fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf8');
}

/**
 * Render entries as CSV text (for --dry-run or --verify-only comparison).
 * Mirrors writeInventoryCsv's formatting exactly.
 *
 * @param {Array} entries
 * @returns {string}
 * @throws {TypeError} if entries is not an array (symmetric with writeInventoryCsv)
 */
function renderInventoryCsv(entries) {
  if (!Array.isArray(entries)) {
    throw new TypeError('renderInventoryCsv: entries must be an array');
  }
  const lines = [CSV_HEADER];
  for (const e of entries) {
    lines.push([
      _formatCsvValue(e.file),
      _formatCsvValue(e.moduleConfigPath),
      _formatCsvValue(e.module),
      _formatCsvValue(e.agentName),
      _formatCsvValue(e.patternMatched),
      _formatCsvValue(e.candidateStatus),
    ].join(','));
  }
  return lines.join('\n') + '\n';
}

// --- Internal helpers ---

function _findSkillMdFiles(bmadRoot) {
  const results = [];
  (function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_err) {
      return;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        // Skip known non-skill subtrees for efficiency; still deterministic.
        if (ent.name === 'node_modules' || ent.name === '.git') continue;
        walk(full);
      } else if (ent.isFile() && ent.name === 'SKILL.md') {
        results.push(full);
      }
    }
  })(bmadRoot);
  return results;
}

function _tryParseFrontmatter(raw) {
  try {
    return frontmatter.parse(raw);
  } catch (_err) {
    return null;
  }
}

function _firstSegmentUnderBmad(relPath) {
  // relPath looks like "_bmad/bmm/4-implementation/bmad-agent-dev/SKILL.md"
  // We want the first segment after "_bmad/".
  const parts = relPath.split('/');
  return parts[1] || '';
}

function _inferAgentNameFromPath(relPath) {
  // Fall back to the directory name containing SKILL.md if no frontmatter name.
  const parts = relPath.split('/');
  return parts[parts.length - 2] || '(unknown)';
}

function _formatCsvValue(value) {
  if (value == null) return '';
  const s = String(value);
  // RFC 4180: quote if contains comma, quote, CR, or LF; double-escape inner quotes.
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// --- CLI entry ---

function _runCli(argv) {
  try {
    const args = argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const verifyOnly = args.includes('--verify-only');

    const projectRoot = findProjectRoot();
    if (!projectRoot) {
      console.error('audit-bmad-init-refs: no _bmad/ directory found from cwd');
      return 1;
    }

    const entries = scanBmadInitRefs(projectRoot);
    const generated = renderInventoryCsv(entries);
    const canonicalCount = entries.filter(e => e.candidateStatus === 'canonical').length;
    const candidateCount = entries.filter(e => e.candidateStatus === 'candidate').length;

    if (dryRun) {
      process.stdout.write(generated);
      console.error(`[audit-bmad-init-refs] dry-run: ${canonicalCount} canonical + ${candidateCount} candidate entries`);
      return 0;
    }

    const outputAbs = path.join(projectRoot, INVENTORY_CSV_PATH);

    if (verifyOnly) {
      const committed = fs.existsSync(outputAbs)
        ? fs.readFileSync(outputAbs, 'utf8')
        : '';
      if (committed === generated) {
        console.log(`[audit-bmad-init-refs] verify-only: committed CSV matches generated output (${canonicalCount} canonical + ${candidateCount} candidate)`);
        return 0;
      }
      console.error(`[audit-bmad-init-refs] verify-only: DRIFT DETECTED at ${INVENTORY_CSV_PATH}`);
      console.error('Re-run without --verify-only to regenerate, then commit the result.');
      return 1;
    }

    fs.writeFileSync(outputAbs, generated, 'utf8');
    console.log(`[audit-bmad-init-refs] Wrote ${canonicalCount} canonical + ${candidateCount} candidate entries to ${INVENTORY_CSV_PATH}`);
    return 0;
  } catch (err) {
    // Surface a clean error message instead of a raw stack trace when the
    // scan / write path throws (bad projectRoot, missing _bmad/, IO failure).
    console.error(`[audit-bmad-init-refs] ERROR: ${(err && err.message) || String(err)}`);
    return 1;
  }
}

// --- Exports ---

module.exports = {
  scanBmadInitRefs,
  writeInventoryCsv,
  renderInventoryCsv,
  CSV_HEADER,
};

if (require.main === module) {
  process.exit(_runCli(process.argv));
}
