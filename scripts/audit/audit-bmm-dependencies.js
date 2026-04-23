#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const matter = require('gray-matter');

const { findProjectRoot } = require('../update/lib/utils');
const {
  parseCsvRow,
  formatCsvRow,
} = require('../../_bmad/bme/_team-factory/lib/utils/csv-utils');

/**
 * Audit tool: inventory custom skills under `.claude/skills/` that depend on
 * BMM agents, generating `_bmad/_config/bmm-dependencies.csv` as the canonical
 * source of truth (FR12, FR13). Scans authoritatively via SKILL.md frontmatter
 * `dependencies:` arrays and supplementarily via step-file code grep for
 * `bmad-agent-*` invocation patterns (FM3-1: doc body is excluded).
 *
 * Output conforms to Decision 3 CSV schema:
 * `skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date`
 *
 * Pattern 1 module structure. CLI exposes `--dry-run` and `--verify-only`
 * modes; default mode writes to disk atomically (tmpfile + rename).
 *
 * @module scripts/audit/audit-bmm-dependencies
 */

// --- Constants ---

const CLAUDE_SKILLS_REL = '.claude/skills';
const OUTPUT_CSV_REL = '_bmad/_config/bmm-dependencies.csv';
const CSV_HEADER_FIELDS = [
  'skill_name',
  'bmm_agent',
  'dependency_type',
  'source_module',
  'registered_by',
  'registered_date',
];
const CSV_HEADER = CSV_HEADER_FIELDS.join(',');

const FR18_FIRST_SKILL = 'bmad-enhance-initiatives-backlog';

// Extension allowlist for step-file code grep (AC3 / Task 2.5). Binary / non-text
// formats are never opened. SKILL.md is handled separately via frontmatter parse
// and is explicitly excluded from this grep phase. `.yaml` added per Round 1 H3
// — skill manifests (e.g. `bmad-skill-manifest.yaml`) encode cross-skill edges.
const STEP_FILE_EXTENSIONS = new Set(['.md', '.js', '.cjs', '.mjs', '.yaml', '.yml']);

// Directories never descended into during step-file grep (perf + safety).
// `references/` added per Round 1 H3 — that subtree holds doc-body examples
// (e.g. `bmad-agent-builder/references/standard-fields.md` mentions
// `bmad-agent-tech-writer` as an illustrative example, not a functional
// dependency), which matches AC3's spirit of excluding doc-body false positives.
const GREP_EXCLUDE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'references',
]);

// Agent invocation pattern for step-file grep (global / stateful).
// `[a-z0-9-]+` is greedy with no right anchor: a token like
// `bmad-agent-pm-extension` emits the full literal as a distinct "agent".
// This is intentional — real BMM agents are hyphen-rich (e.g. `bmad-agent-ux-designer`,
// `bmad-agent-quick-flow-solo-dev`), so right-anchoring at the first hyphen
// would under-detect. Matches are string-level, NOT validated against an
// agent registry. Downstream consumers (convoke-doctor in Story 2.2) cross-
// check each `bmm_agent` value against the real agent manifest and surface
// any unknown name as a drift warning.
const AGENT_INVOCATION_RE = /\bbmad-agent-[a-z0-9-]+/g;

// Non-global variant for single-string validation (stateless `test()`).
// Used by _parseFrontmatterDependencies to validate agent-name entries.
const AGENT_NAME_EXACT_RE = /^bmad-agent-[a-z0-9-]+$/;

const AUTO_SCAN_MARKER = 'auto-scan';

// --- Public API ---

/**
 * Scan `.claude/skills/` under `projectRoot` for BMM dependencies.
 *
 * Returns a sorted array of dependency rows. `bmad-enhance-initiatives-backlog`
 * rows (if any) are pinned to the top per FR18; remaining rows are stable-sorted
 * alphabetically by `(skill_name, bmm_agent)`.
 *
 * @param {string} projectRoot - Absolute path to project root.
 * @returns {Array<{skill_name: string, bmm_agent: string, dependency_type: 'frontmatter'|'code-reference', source_module: string, registered_by: string, registered_date: string}>}
 */
function scanBmmDependencies(projectRoot) {
  if (typeof projectRoot !== 'string' || !projectRoot) {
    throw new TypeError('scanBmmDependencies: projectRoot must be a non-empty string');
  }
  const claudeSkillsRoot = path.join(projectRoot, CLAUDE_SKILLS_REL);
  if (!fs.existsSync(claudeSkillsRoot)) {
    throw new Error(`scanBmmDependencies: ${CLAUDE_SKILLS_REL} not found under ${projectRoot}`);
  }

  // FR18: inspect `bmad-enhance-initiatives-backlog` first. If absent or with
  // zero dependencies, log and continue — the ordering is load-bearing, not
  // the presence of dependencies.
  const fr18SkillDir = path.join(claudeSkillsRoot, FR18_FIRST_SKILL);
  if (fs.existsSync(fr18SkillDir)) {
    const fr18Rows = _scanOneSkill(FR18_FIRST_SKILL, fr18SkillDir);
    if (fr18Rows.length === 0) {
      console.error(`[FR18] ${FR18_FIRST_SKILL} scanned first — 0 dependencies`);
    } else {
      console.error(`[FR18] ${FR18_FIRST_SKILL} scanned first — ${fr18Rows.length} dependencies`);
    }
  } else {
    console.error(`[FR18] ${FR18_FIRST_SKILL} NOT present under .claude/skills/ — FR18 subject missing`);
  }

  const skillDirs = _findSkillDirectories(claudeSkillsRoot);
  const today = _todayIso();
  const rows = [];

  for (const skillName of skillDirs) {
    const skillDir = path.join(claudeSkillsRoot, skillName);
    const skillRows = _scanOneSkill(skillName, skillDir);
    for (const r of skillRows) {
      rows.push({
        skill_name: r.skill_name,
        bmm_agent: r.bmm_agent,
        dependency_type: r.dependency_type,
        source_module: _inferSourceModule(r.skill_name),
        registered_by: AUTO_SCAN_MARKER,
        registered_date: today,
      });
    }
  }

  return _sortWithFr18Pin(rows);
}

/**
 * Render a set of rows to CSV text (header + rows + trailing LF).
 *
 * @param {Array} rows - Rows to serialize (shape: see scanBmmDependencies).
 * @returns {string}
 */
function renderCsv(rows) {
  if (!Array.isArray(rows)) {
    throw new TypeError('renderCsv: rows must be an array');
  }
  const lines = [CSV_HEADER];
  for (const r of rows) {
    lines.push(formatCsvRow([
      _sanitizeFormula(r.skill_name),
      _sanitizeFormula(r.bmm_agent),
      _sanitizeFormula(r.dependency_type),
      _sanitizeFormula(r.source_module),
      _sanitizeFormula(r.registered_by),
      _sanitizeFormula(r.registered_date),
    ]));
  }
  return lines.join('\n') + '\n';
}

/**
 * OWASP CSV-injection mitigation: prepend a single quote to any value
 * beginning with a spreadsheet-formula sentinel (`=`, `+`, `-`, `@`, tab, CR).
 * The leading `'` is a well-known escape that Excel / LibreOffice / Sheets
 * strip on display but preserve in-file, so the CSV remains parseable while
 * refusing to execute as a formula.
 *
 * @param {string|null|undefined} value
 * @returns {string}
 */
function _sanitizeFormula(value) {
  if (value == null) return '';
  const s = String(value);
  if (s.length === 0) return s;
  const first = s.charAt(0);
  if (first === '=' || first === '+' || first === '-' || first === '@' || first === '\t' || first === '\r') {
    return `'${s}`;
  }
  return s;
}

/**
 * Parse an existing CSV into rows, skipping the header. Returns an empty array
 * if the file is missing or empty.
 *
 * @param {string} csvPath - Absolute path to CSV file.
 * @returns {Array<object>}
 */
function readExistingCsv(csvPath) {
  if (!fs.existsSync(csvPath)) return [];
  let raw = fs.readFileSync(csvPath, 'utf8');
  // M7: strip UTF-8 BOM if present (some editors add it). CRLF handling is
  // deferred to `_splitCsvLines` so that `\r\n` inside a quoted field (valid
  // per RFC 4180) is preserved byte-identical — the R2-P1 fix moves CRLF
  // normalization inside the tokenizer where quote state is known.
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  // H2: quote-aware line splitter — a CSV "line" may span multiple physical
  // lines if a field value contains an embedded newline inside quotes.
  const lines = _splitCsvLines(raw).filter(l => l.length > 0);
  if (lines.length === 0) return [];
  // M7: tolerate trailing whitespace or invisible characters on the header
  // line by parsing it via parseCsvRow and field-comparing to CSV_HEADER_FIELDS.
  const headerFields = parseCsvRow(lines[0]);
  const headerMatches = headerFields.length === CSV_HEADER_FIELDS.length
    && headerFields.every((f, i) => f.trim() === CSV_HEADER_FIELDS[i]);
  const dataLines = headerMatches ? lines.slice(1) : lines;
  return dataLines.map(line => {
    const fields = parseCsvRow(line);
    return {
      skill_name: fields[0] || '',
      bmm_agent: fields[1] || '',
      dependency_type: fields[2] || '',
      source_module: fields[3] || '',
      registered_by: fields[4] || '',
      registered_date: fields[5] || '',
    };
  });
}

/**
 * Split CSV text into rows, respecting quoted fields that may contain
 * embedded newlines. RFC 4180-aware. Returns an array of row strings
 * (no trailing newline on each).
 *
 * @param {string} raw - CSV file contents.
 * @returns {string[]}
 */
function _splitCsvLines(raw) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') {
      // Escaped double-quote inside a quoted field → consume both chars.
      if (inQuotes && i + 1 < raw.length && raw[i + 1] === '"') {
        current += '""';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      current += ch;
      continue;
    }
    // R2-P1: only collapse CRLF → LF at record boundaries (outside quotes).
    // A `\r\n` inside a quoted field is part of the field value and must
    // survive byte-identical per AC8.
    if (ch === '\r' && !inQuotes && raw[i + 1] === '\n') {
      lines.push(current);
      current = '';
      i++; // skip the following \n
      continue;
    }
    if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

/**
 * Merge scan-generated rows with any manually-registered rows from an existing
 * CSV. Manual rows (`registered_by !== 'auto-scan'`) are preserved byte-identical
 * relative to their original values. Stale auto-scan rows are dropped:
 *   - Case A (skill-gone): the skill directory no longer exists on disk.
 *   - Case B (dep-removed): skill still exists but current scan doesn't emit
 *     this `(skill_name, bmm_agent)` pair.
 *
 * @param {Array} scanRows - Rows freshly produced by scanBmmDependencies().
 * @param {Array} existingRows - Rows parsed from the committed CSV (may be []).
 * @param {string} claudeSkillsRoot - Absolute path to `.claude/skills/`.
 * @returns {Array} Merged rows (manual preserved + scanRows, sorted).
 */
function mergePreservingManual(scanRows, existingRows, claudeSkillsRoot) {
  if (!Array.isArray(scanRows)) {
    throw new TypeError('mergePreservingManual: scanRows must be an array');
  }
  if (!Array.isArray(existingRows)) {
    throw new TypeError('mergePreservingManual: existingRows must be an array');
  }
  if (typeof claudeSkillsRoot !== 'string' || !claudeSkillsRoot) {
    throw new TypeError('mergePreservingManual: claudeSkillsRoot must be a non-empty string');
  }

  const scanKeys = new Set(scanRows.map(_tripleKey));

  // Build a lookup from triple key → existing auto-scan row's registered_date.
  // This lets us preserve dates for unchanged (skill, agent, dependency_type)
  // triples, so `--verify-only` doesn't fail every day at 00:00 UTC (H1).
  const existingAutoScanDates = new Map();
  // R2-D3: triple-key dedup — manual row wins ONLY when dependency_type also
  // matches. This lets scan SUPPLEMENT a manual registration (an operator
  // registering one type doesn't suppress detection of another type) while
  // preserving manual overrides that align.
  const manualTripleKeys = new Set();
  const preservedManual = [];
  for (const row of existingRows) {
    const rb = String(row.registered_by || '').toLowerCase().trim();
    if (rb === AUTO_SCAN_MARKER) {
      existingAutoScanDates.set(_tripleKey(row), row.registered_date);
      const key = _tripleKey(row);
      if (!scanKeys.has(key)) {
        const skillDirExists = fs.existsSync(path.join(claudeSkillsRoot, row.skill_name));
        const label = skillDirExists ? '[stale:dep-removed]' : '[stale:skill-gone]';
        console.error(`${label} ${row.skill_name} → ${row.bmm_agent}`);
      }
      continue;
    }
    // Non-auto-scan (manual) row: preserve byte-identical, record triple key
    // so scan can't re-emit the same (skill, agent, type) triple but CAN emit
    // other-type rows for the same (skill, agent) pair.
    manualTripleKeys.add(_tripleKey(row));
    preservedManual.push(row);
  }

  // Preserve registered_date on scan rows whose triple already exists in the
  // previous auto-scan set. Newly-introduced triples keep today's date.
  const datePreservedScanRows = scanRows.map(r => {
    const prior = existingAutoScanDates.get(_tripleKey(r));
    if (prior && /^\d{4}-\d{2}-\d{2}$/.test(prior)) {
      return { ...r, registered_date: prior };
    }
    return r;
  });

  // M4 + R2-D3: dedup manual vs auto by (skill, agent, type) triple. Manual
  // wins same-type; other-type scan rows remain so scan supplements rather
  // than replaces a manual registration.
  const dedupedScanRows = datePreservedScanRows.filter(r => !manualTripleKeys.has(_tripleKey(r)));

  return _sortWithFr18Pin([...preservedManual, ...dedupedScanRows]);
}

// --- Internal helpers (exported under `_internal` for testability) ---

/**
 * Scan a single skill directory for BMM agent dependencies.
 * Returns partial rows missing `source_module`/`registered_by`/`registered_date`
 * — the caller fills those in.
 *
 * @param {string} skillName - Directory name under `.claude/skills/`.
 * @param {string} skillDir - Absolute path to the skill directory.
 * @returns {Array<{skill_name: string, bmm_agent: string, dependency_type: 'frontmatter'|'code-reference'}>}
 */
function _scanOneSkill(skillName, skillDir) {
  const rows = [];
  const seen = new Set();

  // H3: self-reference filter. A skill named `bmad-agent-pm` trivially
  // matches `bmad-agent-pm` inside its own files (e.g. `name: bmad-agent-pm`
  // in SKILL.md frontmatter). Those aren't real dependencies.
  const isSelfReference = (agent) => agent === skillName;

  // Source 1 (authoritative): SKILL.md frontmatter `dependencies:` array.
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  const fmDeps = _parseFrontmatterDependencies(skillMdPath);
  for (const agent of fmDeps) {
    if (isSelfReference(agent)) continue;
    const key = `frontmatter||${agent}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ skill_name: skillName, bmm_agent: agent, dependency_type: 'frontmatter' });
  }

  // Source 2 (supplementary): step-file code grep. SKILL.md is NEVER grepped.
  const codeDeps = _grepStepFilesForAgents(skillDir);
  for (const agent of codeDeps) {
    if (isSelfReference(agent)) continue;
    const key = `code||${agent}`;
    if (seen.has(key)) continue;
    // Don't emit a code-reference row if frontmatter already covered this agent —
    // frontmatter is the authoritative source.
    if (seen.has(`frontmatter||${agent}`)) continue;
    seen.add(key);
    rows.push({ skill_name: skillName, bmm_agent: agent, dependency_type: 'code-reference' });
  }

  return rows;
}

/**
 * Parse SKILL.md frontmatter and return the `dependencies:` array, or [] if
 * absent / malformed. Malformed values (non-array) emit a stderr warning and
 * return [].
 *
 * @param {string} skillMdPath - Absolute path to SKILL.md.
 * @returns {string[]}
 */
function _parseFrontmatterDependencies(skillMdPath) {
  if (!fs.existsSync(skillMdPath)) return [];
  let raw;
  try {
    raw = fs.readFileSync(skillMdPath, 'utf8');
  } catch (err) {
    console.warn(`[audit-bmm-dependencies] WARN: could not read ${skillMdPath}: ${err.message}`);
    return [];
  }
  let parsed;
  try {
    parsed = matter(raw);
  } catch (err) {
    console.warn(`[audit-bmm-dependencies] WARN: frontmatter parse failed for ${skillMdPath}: ${err.message}`);
    return [];
  }
  const deps = parsed && parsed.data ? parsed.data.dependencies : undefined;
  if (deps == null) return [];
  if (!Array.isArray(deps)) {
    console.warn(`[warn] ${skillMdPath}: dependencies must be an array; ignored`);
    return [];
  }
  const validated = [];
  for (const d of deps) {
    if (typeof d !== 'string') continue;
    if (!AGENT_NAME_EXACT_RE.test(d)) {
      console.warn(`[warn] ${skillMdPath}: ignoring invalid dependency entry '${d}' (expected bmad-agent-* name)`);
      continue;
    }
    validated.push(d);
  }
  return validated;
}

/**
 * Walk a skill directory (excluding SKILL.md and known heavy/binary dirs),
 * collecting unique `bmad-agent-*` invocations found in step files.
 *
 * @param {string} skillDir - Absolute path to the skill directory.
 * @returns {string[]} Sorted unique agent names.
 */
function _grepStepFilesForAgents(skillDir) {
  const agents = new Set();
  (function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_err) {
      return;
    }
    for (const ent of entries) {
      if (ent.isDirectory()) {
        if (GREP_EXCLUDE_DIRS.has(ent.name)) continue;
        walk(path.join(dir, ent.name));
        continue;
      }
      if (!ent.isFile()) continue;
      // Never re-open SKILL.md here — frontmatter path owns that.
      if (ent.name === 'SKILL.md' && dir === skillDir) continue;
      const ext = path.extname(ent.name);
      if (!STEP_FILE_EXTENSIONS.has(ext)) continue;
      const full = path.join(dir, ent.name);
      let content;
      try {
        content = fs.readFileSync(full, 'utf8');
      } catch (_err) {
        continue;
      }
      const matches = content.match(AGENT_INVOCATION_RE);
      if (matches) {
        for (const m of matches) agents.add(m);
      }
    }
  })(skillDir);
  return [...agents].sort();
}

/**
 * Enumerate direct child directories of `.claude/skills/`. Non-directories
 * and dotfiles are skipped.
 *
 * @param {string} claudeSkillsRoot - Absolute path to `.claude/skills/`.
 * @returns {string[]} Sorted skill directory names.
 */
function _findSkillDirectories(claudeSkillsRoot) {
  let entries;
  try {
    entries = fs.readdirSync(claudeSkillsRoot, { withFileTypes: true });
  } catch (_err) {
    return [];
  }
  const names = [];
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    if (ent.name.startsWith('.')) continue;
    names.push(ent.name);
  }
  return names.sort();
}

/**
 * Infer source module from skill name by prefix (AC2 rule).
 * Pure string dispatch — no filesystem access. More-specific prefixes are
 * checked before less-specific ones.
 *
 * @param {string} skillName
 * @returns {'bmm'|'bme'|'cis'|'testarch'|'convoke'|'wds'|'fpf'|'unknown'}
 */
function _inferSourceModule(skillName) {
  if (typeof skillName !== 'string' || !skillName) return 'unknown';
  // More-specific bmad sub-module prefixes checked first.
  if (skillName.startsWith('bmad-agent-bme-')) return 'bme';
  if (skillName.startsWith('bmad-cis-')) return 'cis';
  if (skillName.startsWith('bmad-testarch-')) return 'testarch';
  // bmad-* fallback (upstream BMM: agents, workflows, skills like bmad-agent-pm,
  // bmad-create-prd, bmad-dev-story, etc.).
  if (skillName.startsWith('bmad-')) return 'bmm';
  if (skillName.startsWith('convoke-')) return 'convoke';
  if (skillName.startsWith('wds-')) return 'wds';
  // FPF skills: both "q-..." forms (q-query, q-actualize, q-decay, q-status, q-reset)
  // and "qN-..." numbered-phase forms (q0-init, q1-add, q2-verify, ...). Trailing
  // hyphen required so a future unrelated skill like "q2k-legacy" falls through.
  if (/^q\d-/.test(skillName) || skillName.startsWith('q-')) return 'fpf';
  return 'unknown';
}

/**
 * Stable-sort rows alphabetically by (skill_name, bmm_agent), but pin any
 * rows referencing `bmad-enhance-initiatives-backlog` to the top.
 *
 * @param {Array} rows
 * @returns {Array}
 */
function _sortWithFr18Pin(rows) {
  const fr18 = [];
  const rest = [];
  for (const r of rows) {
    if (r.skill_name === FR18_FIRST_SKILL) fr18.push(r);
    else rest.push(r);
  }
  const cmp = (a, b) => {
    if (a.skill_name !== b.skill_name) return a.skill_name < b.skill_name ? -1 : 1;
    if (a.bmm_agent !== b.bmm_agent) return a.bmm_agent < b.bmm_agent ? -1 : 1;
    return 0;
  };
  fr18.sort(cmp);
  rest.sort(cmp);
  return [...fr18, ...rest];
}

/**
 * Stable key for `(skill_name, bmm_agent, dependency_type)` triple used by
 * merge logic to match rows across scan runs for date-preservation (H1).
 */
function _tripleKey(row) {
  return `${row.skill_name}||${row.bmm_agent}||${row.dependency_type}`;
}

/**
 * Return today's date as YYYY-MM-DD (UTC).
 *
 * @returns {string}
 */
function _todayIso() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Minimal line-level diff for `--verify-only` output. Reports lines present
 * in one input but not the other, prefixed with `-` (committed) or `+` (scan).
 * Not an LCS-aware unified diff — intentionally simple (~15 LOC) to avoid
 * adding a new npm dependency.
 *
 * @param {string} committed - Current CSV content on disk.
 * @param {string} scanned - Freshly-generated CSV content.
 * @returns {string} Human-readable diff (may be multi-line).
 */
function _simpleLineDiff(committed, scanned) {
  const oldLines = new Set(committed.split('\n'));
  const newLines = new Set(scanned.split('\n'));
  const removed = [...oldLines].filter(l => !newLines.has(l));
  const added = [...newLines].filter(l => !oldLines.has(l));
  const parts = [];
  for (const l of removed) parts.push(`- ${l}`);
  for (const l of added) parts.push(`+ ${l}`);
  return parts.join('\n');
}

/**
 * Atomic write: tmpfile + rename. Prevents partial-write corruption.
 *
 * @param {string} targetPath - Absolute destination path.
 * @param {string} contents
 */
function _atomicWrite(targetPath, contents) {
  const rand = crypto.randomBytes(4).toString('hex');
  const tmpPath = `${targetPath}.tmp-${process.pid}-${Date.now()}-${rand}`;
  let tmpCreated = false;
  try {
    fs.writeFileSync(tmpPath, contents, 'utf8');
    tmpCreated = true;
    // Best-effort fsync for durability; ignore if unavailable on this platform.
    try {
      const fd = fs.openSync(tmpPath, 'r+');
      try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    } catch (_fsyncErr) { /* fsync is advisory; tolerate failures silently */ }
    fs.renameSync(tmpPath, targetPath);
    tmpCreated = false; // rename consumed the tmp path
  } finally {
    if (tmpCreated && fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (_unlinkErr) { /* ignore */ }
    }
  }
}

// --- CLI entry ---

function _runCli(argv) {
  try {
    const args = argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const verifyOnly = args.includes('--verify-only');

    // Unknown-flag check.
    const knownFlags = new Set(['--dry-run', '--verify-only']);
    for (const a of args) {
      if (a.startsWith('--') && !knownFlags.has(a)) {
        console.error(`[audit-bmm-dependencies] ERROR: unknown flag '${a}'`);
        console.error('Supported flags: --dry-run, --verify-only');
        return 1;
      }
    }

    const projectRoot = findProjectRoot();
    if (!projectRoot) {
      console.error('[audit-bmm-dependencies] ERROR: no _bmad/ directory found from cwd');
      return 1;
    }

    const claudeSkillsRoot = path.join(projectRoot, CLAUDE_SKILLS_REL);
    const outputAbs = path.join(projectRoot, OUTPUT_CSV_REL);

    const scanRows = scanBmmDependencies(projectRoot);
    const existingRows = readExistingCsv(outputAbs);
    const merged = mergePreservingManual(scanRows, existingRows, claudeSkillsRoot);
    const generated = renderCsv(merged);

    const autoCount = merged.filter(r => r.registered_by === AUTO_SCAN_MARKER).length;
    const manualCount = merged.length - autoCount;

    if (dryRun) {
      process.stdout.write(generated);
      console.error(`[audit-bmm-dependencies] dry-run: ${autoCount} auto-scan + ${manualCount} manual rows`);
      return 0;
    }

    if (verifyOnly) {
      const committed = fs.existsSync(outputAbs)
        ? fs.readFileSync(outputAbs, 'utf8')
        : '';
      if (committed === generated) return 0;
      console.error(`[audit-bmm-dependencies] verify-only: DRIFT DETECTED at ${OUTPUT_CSV_REL}`);
      const diff = _simpleLineDiff(committed, generated);
      if (diff) console.error(diff);
      console.error('Re-run without --verify-only to regenerate, then commit the result.');
      return 1;
    }

    _atomicWrite(outputAbs, generated);
    console.log(`[audit-bmm-dependencies] Wrote ${autoCount} auto-scan + ${manualCount} manual rows to ${OUTPUT_CSV_REL}`);
    return 0;
  } catch (err) {
    console.error(`[audit-bmm-dependencies] ERROR: ${(err && err.message) || String(err)}`);
    return 1;
  }
}

// --- Exports ---

module.exports = {
  scanBmmDependencies,
  renderCsv,
  readExistingCsv,
  mergePreservingManual,
  CSV_HEADER,
  CSV_HEADER_FIELDS,
  OUTPUT_CSV_REL,
  FR18_FIRST_SKILL,
  _internal: {
    _scanOneSkill,
    _parseFrontmatterDependencies,
    _grepStepFilesForAgents,
    _findSkillDirectories,
    _inferSourceModule,
    _sortWithFr18Pin,
    _tripleKey,
    _todayIso,
    _simpleLineDiff,
    _atomicWrite,
    _splitCsvLines,
    _runCli,
  },
};

if (require.main === module) {
  process.exit(_runCli(process.argv));
}
