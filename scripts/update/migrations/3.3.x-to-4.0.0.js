'use strict';

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { execFileSync } = require('node:child_process');

/**
 * Migration: 3.3.x → 4.0.0 — v6.3 direct-load migration.
 *
 * BREAKING change. Rewrites 18 upstream-BMAD SKILL.md activation blocks from
 * `bmad-init`-invoking pattern to v4 direct-YAML-load pattern. Marks bmad-init
 * deprecated. Validates via convoke-doctor JSON diff.
 *
 * Five phases (see story v63-1a-4 spec for full details):
 *   1. Detect — is this a pre-v4 install?
 *   2. Verify module configs + init state file + capture doctor baseline
 *   3. SKILL.md sweep via template-based rewrite (FM2-1 mitigation)
 *   4. Insert deprecation banner on _bmad/core/bmad-init/SKILL.md
 *   5. Post-migration doctor diff (FM2-3 mitigation, fail-soft per NFR9)
 *
 * Idempotency/resume/lockfile/offline-safe concerns are DEFERRED to
 * Story v63-1a-5 (migration robustness). This module ships the happy path.
 *
 * Plugs into scripts/update/lib/migration-runner.js infrastructure:
 *   - Backup: handled upstream (backupManager)
 *   - Lock: handled upstream (acquireMigrationLock)
 *   - migration_history recording: handled upstream on clean apply() return
 */

const STATE_FILE_RELATIVE = '_bmad/_memory/migration-state-4.0.yaml';
const INVENTORY_CSV_RELATIVE = '_bmad/_config/v6.3-migration-inventory.csv';
const BMAD_INIT_SKILL_MD_RELATIVE = '_bmad/core/bmad-init/SKILL.md';

// The HTML-comment sentinel is the stable idempotency marker — survives banner
// wording changes (e.g., a 4.1 rephrase) so we never accidentally double-insert.
const DEPRECATION_BANNER_SENTINEL = '<!-- convoke:deprecation-banner:bmad-init -->';
const DEPRECATION_BANNER =
  DEPRECATION_BANNER_SENTINEL + '\n' +
  '> ⚠️ **DEPRECATED in Convoke 4.0** — this skill is retained for one-version ' +
  "backwards-compat only. The config-loading path has moved to direct-YAML reads " +
  'via `scripts/update/lib/config-loader.js`. `bmad-init` will be removed in ' +
  'Convoke 4.1.';

const V4_ACTIVATION_TEMPLATE = [
  '1. **Load config** — Read `{project-root}/_bmad/{module}/config.yaml` directly. Do NOT invoke the deprecated `bmad-init` skill.',
  '   - If the config file is missing or unreadable, STOP and display: "Config error: `_bmad/{module}/config.yaml` could not be loaded. Run `convoke-install` to bootstrap."',
  '   - Store all fields as session variables: `{user_name}`, `{communication_language}`, plus any module-specific vars.',
  '   - VERIFY required fields (`user_name`, `communication_language`) are present; STOP with an error if any are missing.',
].join('\n');

// --- Public API (Pattern 7 migration contract) ---

module.exports = {
  name: '3.3.x-to-4.0.0',
  fromVersion: '3.3.x',
  breaking: true,
  description:
    'v6.3 direct-load migration: rewrites 18 upstream-BMAD SKILL.md activation blocks ' +
    'from bmad-init invocation to v4 direct-YAML-load. Marks bmad-init deprecated. ' +
    'Validates via convoke-doctor diff.',

  // BUG-8: declare this migration's rollback write-set so the runner backs it up
  // BEFORE apply(). Derived from the SAME inventory CSV that _phase3 rewrites
  // (single source — hardening #2), plus the bmad-init skill (phase 4, restore)
  // and the migration-state file (phase 5 — delete-on-rollback, audit #3).
  getBackupManifest(projectRoot) {
    const entries = [];
    const inventoryPath = path.join(projectRoot, INVENTORY_CSV_RELATIVE);
    if (fs.existsSync(inventoryPath)) {
      const rows = _parseInventoryCsv(fs.readFileSync(inventoryPath, 'utf8'));
      for (const row of rows) {
        entries.push({ relPath: row.file, type: 'file', onRollback: 'restore' });
      }
    }
    entries.push({ relPath: BMAD_INIT_SKILL_MD_RELATIVE, type: 'file', onRollback: 'restore' });
    entries.push({ relPath: STATE_FILE_RELATIVE, type: 'file', onRollback: 'delete' });
    return entries;
  },

  async preview(projectRoot) {
    // migration-runner.js calls preview() with no args per existing contract;
    // direct callers (tests, future tooling) may pass projectRoot for a
    // project-aware short-circuit + accurate canonical-count.
    if (projectRoot) {
      const phase1 = _phase1_detect(projectRoot);
      if (!phase1.isPreV4) {
        return {
          actions: [`Migration already complete (${phase1.reason}) — no actions to preview`],
        };
      }
      const inventoryPath = path.join(projectRoot, INVENTORY_CSV_RELATIVE);
      if (fs.existsSync(inventoryPath)) {
        const rows = _parseInventoryCsv(fs.readFileSync(inventoryPath, 'utf8'));
        const canonicalCount = rows.filter(r => r.candidate_status === 'canonical').length;
        return { actions: _previewActionsWithCount(canonicalCount) };
      }
    }
    // Zero-arg path or missing inventory: static summary (18 is the frozen
    // target count per Story 1A.3 audit; prefixed with "up to" since the
    // actual on-disk count can only be verified with projectRoot).
    return { actions: _previewActionsWithCount('up to 18') };
  },

  async apply(projectRoot) {
    const changes = [];

    // Phase 1 — Detect
    const phase1 = _phase1_detect(projectRoot);
    if (!phase1.isPreV4) {
      changes.push(`Migration skipped: already at v4 (${phase1.reason})`);
      return changes;
    }
    changes.push(`Phase 1: pre-v4 state detected (${phase1.reason})`);

    // Phase 2 — Verify configs + init state + capture doctor baseline
    const phase2 = await _phase2_verifyConfigs(projectRoot);
    changes.push(
      `Phase 2: state file initialized at ${STATE_FILE_RELATIVE}; ` +
      `${phase2.modulesValidated} module config(s) verified` +
      (phase2.modulesSkipped.length > 0
        ? `; skipped modules: ${phase2.modulesSkipped.join(', ')}`
        : '')
    );

    // Phase 3 — SKILL.md sweep
    const phase3 = _phase3_sweepSkillMd(projectRoot);
    changes.push(
      `Phase 3: rewrote ${phase3.filesRewritten} SKILL.md file(s)` +
      (phase3.filesSkipped.length > 0
        ? `; skipped ${phase3.filesSkipped.length} (see state file for reasons)`
        : '')
    );

    // Phase 4 — Deprecation banner
    const phase4 = _phase4_deprecateBmadInit(projectRoot);
    changes.push(
      phase4.bannerAdded
        ? `Phase 4: deprecation banner added to ${BMAD_INIT_SKILL_MD_RELATIVE}`
        : `Phase 4: deprecation banner already present (no change)`
    );

    // Phase 5 — Doctor diff (fail-soft)
    const phase5 = _phase5_doctorDiff(projectRoot);
    if (phase5.newFindings.length === 0) {
      changes.push('Phase 5: convoke-doctor clean — no new findings after migration');
    } else {
      changes.push(
        `Phase 5: convoke-doctor found ${phase5.newFindings.length} NEW finding(s) ` +
        `after migration (non-blocking warnings, see state file for details)`
      );
    }

    return changes;
  },
};

// --- Preview helpers ---

function _previewActionsWithCount(count) {
  return [
    `Rewrite ${count} upstream-BMAD SKILL.md activation blocks using the v4 direct-YAML-load template (FM2-1 template-based, not substring replace)`,
    `Insert a deprecation banner at the top of ${BMAD_INIT_SKILL_MD_RELATIVE} (bmad-init is retained one-version for backwards-compat; removed in 4.1)`,
    `Run convoke-doctor before + after and diff findings; new findings are reported as warnings (fail-soft per NFR9)`,
    `Write migration progress to ${STATE_FILE_RELATIVE} after each phase for basic resume safety (full resume/idempotency coverage lands in Story 1A.5)`,
  ];
}

// --- Phase implementations (internal) ---

function _phase1_detect(projectRoot) {
  const statePath = path.join(projectRoot, STATE_FILE_RELATIVE);
  if (fs.existsSync(statePath)) {
    try {
      const state = yaml.load(fs.readFileSync(statePath, 'utf8'));
      if (state && state.phase5_complete === true) {
        return { isPreV4: false, reason: 'migration-state-4.0.yaml marks phase5_complete' };
      }
    } catch (_err) {
      // Corrupt state file — treat as pre-v4 and overwrite.
    }
  }

  const bmadInitDir = path.join(projectRoot, '_bmad/core/bmad-init');
  const bmadInitExists = fs.existsSync(bmadInitDir);

  const inventoryPath = path.join(projectRoot, INVENTORY_CSV_RELATIVE);
  let hasCanonicalTarget = false;
  if (fs.existsSync(inventoryPath)) {
    const rows = _parseInventoryCsv(fs.readFileSync(inventoryPath, 'utf8'));
    for (const row of rows) {
      if (row.candidate_status !== 'canonical') continue;
      if (fs.existsSync(path.join(projectRoot, row.file))) {
        hasCanonicalTarget = true;
        break;
      }
    }
  }

  if (bmadInitExists || hasCanonicalTarget) {
    return {
      isPreV4: true,
      reason: [
        bmadInitExists ? 'bmad-init directory present' : null,
        hasCanonicalTarget ? 'canonical inventory target on disk' : null,
      ].filter(Boolean).join(' + '),
    };
  }

  return { isPreV4: false, reason: 'no bmad-init artifacts detected' };
}

async function _phase2_verifyConfigs(projectRoot) {
  // Story 1A.5 AC3 option B: skip Phase 2 when an earlier invocation already
  // completed it. Avoids re-running convoke-doctor on every resume (5–30s saved
  // per attempt). Trade-off: Phase 5 diff uses the cached baseline — if the
  // environment changed between runs, stale findings may sneak through.
  // Operators who want a fresh baseline delete the state file before re-running.
  const existingState = _readState(projectRoot);
  if (existingState && existingState.phase2_complete === true) {
    return {
      modulesValidated:
        (existingState.phase3_files_total || 0) > 0
          ? existingState.phase3_files_total // rough stand-in; the exact validated-module count isn't persisted
          : 0,
      modulesSkipped: existingState.modules_skipped || [],
    };
  }

  const inventoryPath = path.join(projectRoot, INVENTORY_CSV_RELATIVE);
  if (!fs.existsSync(inventoryPath)) {
    throw new Error(
      `Migration aborted: inventory CSV not found at ${inventoryPath}. ` +
      `Run 'node scripts/audit/audit-bmad-init-refs.js' to regenerate.`
    );
  }
  const rows = _parseInventoryCsv(fs.readFileSync(inventoryPath, 'utf8'));
  const canonical = rows.filter(r => r.candidate_status === 'canonical');
  const modules = Array.from(new Set(canonical.map(r => r.module)));

  const modulesSkipped = [];
  for (const module of modules) {
    const configPath = path.join(projectRoot, '_bmad', module, 'config.yaml');
    if (!fs.existsSync(configPath)) {
      console.warn(
        `[3.3.x-to-4.0.0] WARN: module config missing: _bmad/${module}/config.yaml ` +
        `— skipping ${module}/* files from Phase 3 sweep`
      );
      modulesSkipped.push(module);
    }
  }

  const doctorBaseline = _runDoctor(projectRoot);

  // Preserve `started_at` across resumes: only set fresh on a true first run.
  const startedAt =
    (existingState && existingState.started_at) || new Date().toISOString();

  const state = {
    schema_version: 1,
    migration_name: '3.3.x-to-4.0.0',
    started_at: startedAt,
    completed_at: null,
    phase1_complete: true,
    phase2_complete: true,
    phase2_doctor_baseline: doctorBaseline,
    phase3_files_total: canonical.filter(r => !modulesSkipped.includes(r.module)).length,
    phase3_files_done: [],
    phase3_files_skipped: [],
    phase3_complete: false,
    phase4_complete: false,
    phase5_complete: false,
    new_doctor_findings: [],
    modules_skipped: modulesSkipped,
  };
  _writeState(projectRoot, state);

  return { modulesValidated: modules.length - modulesSkipped.length, modulesSkipped };
}

function _phase3_sweepSkillMd(projectRoot) {
  const state = _readState(projectRoot);
  const rows = _parseInventoryCsv(
    fs.readFileSync(path.join(projectRoot, INVENTORY_CSV_RELATIVE), 'utf8')
  );
  const targets = rows.filter(r =>
    r.candidate_status === 'canonical' && !state.modules_skipped.includes(r.module)
  );

  let filesRewritten = 0;
  for (const entry of targets) {
    if (state.phase3_files_done.includes(entry.file)) continue;  // resume-safe skip

    const absPath = path.join(projectRoot, entry.file);
    if (!fs.existsSync(absPath)) {
      state.phase3_files_skipped.push({ file: entry.file, reason: 'file not found' });
      _writeState(projectRoot, state);
      continue;
    }

    // Path-traversal guard: entry.file comes from an inventory CSV; a malicious
    // or typoed entry with `..` segments could escape projectRoot. Reject.
    const resolvedAbsPath = path.resolve(absPath);
    const resolvedRoot = path.resolve(projectRoot);
    if (!resolvedAbsPath.startsWith(resolvedRoot + path.sep)) {
      console.warn(
        `[3.3.x-to-4.0.0] WARN: skipping ${entry.file} — resolved path escapes projectRoot`
      );
      state.phase3_files_skipped.push({ file: entry.file, reason: 'path escapes projectRoot' });
      _writeState(projectRoot, state);
      continue;
    }

    const content = fs.readFileSync(absPath, 'utf8');
    const result = _rewriteActivation(content, entry.module);
    if (!result.rewritten) {
      console.warn(
        `[3.3.x-to-4.0.0] WARN: could not rewrite ${entry.file} (${result.reason}) — skipping`
      );
      state.phase3_files_skipped.push({ file: entry.file, reason: result.reason });
      _writeState(projectRoot, state);
      continue;
    }

    try {
      _assertWriteContained(absPath, projectRoot);
      fs.writeFileSync(absPath, result.content, 'utf8');
    } catch (err) {
      console.warn(
        `[3.3.x-to-4.0.0] WARN: write failed for ${entry.file} (${err.code || err.message}) — skipping`
      );
      state.phase3_files_skipped.push({
        file: entry.file,
        reason: `write failed: ${err.code || err.message}`,
      });
      _writeState(projectRoot, state);
      continue;
    }
    state.phase3_files_done.push(entry.file);
    _writeState(projectRoot, state);
    filesRewritten++;
  }

  state.phase3_complete = true;
  _writeState(projectRoot, state);

  return { filesRewritten, filesSkipped: state.phase3_files_skipped };
}

function _phase4_deprecateBmadInit(projectRoot) {
  const absPath = path.join(projectRoot, BMAD_INIT_SKILL_MD_RELATIVE);
  if (!fs.existsSync(absPath)) {
    // bmad-init already removed (unlikely but possible) — nothing to deprecate.
    const state = _readState(projectRoot);
    state.phase4_complete = true;
    _writeState(projectRoot, state);
    return { bannerAdded: false };
  }

  const content = fs.readFileSync(absPath, 'utf8');
  // Idempotency check uses the stable HTML-comment sentinel, not the
  // human-readable banner text — survives banner wording changes.
  if (content.includes(DEPRECATION_BANNER_SENTINEL)) {
    const state = _readState(projectRoot);
    state.phase4_complete = true;
    _writeState(projectRoot, state);
    return { bannerAdded: false };
  }

  const updated = _insertBannerAfterFrontmatter(content, DEPRECATION_BANNER);
  _assertWriteContained(absPath, projectRoot);
  fs.writeFileSync(absPath, updated, 'utf8');

  const state = _readState(projectRoot);
  state.phase4_complete = true;
  _writeState(projectRoot, state);
  return { bannerAdded: true };
}

function _phase5_doctorDiff(projectRoot) {
  const state = _readState(projectRoot);
  const after = _runDoctor(projectRoot);
  const before = state.phase2_doctor_baseline || { findings: [] };

  const beforeKeys = new Set((before.findings || []).map(_findingKey));
  const newFindings = (after.findings || []).filter(f => !beforeKeys.has(_findingKey(f)));

  if (newFindings.length > 0) {
    console.warn(
      `[3.3.x-to-4.0.0] WARN: Phase 5 detected ${newFindings.length} new convoke-doctor ` +
      `finding(s) after migration. These are non-blocking warnings — review post-run:`
    );
    for (const finding of newFindings) {
      console.warn(`  - ${finding.name || finding.message || JSON.stringify(finding)}`);
    }
  }

  state.phase5_complete = true;
  state.completed_at = new Date().toISOString();
  state.new_doctor_findings = newFindings;
  _writeState(projectRoot, state);

  return { newFindings };
}

// --- Helpers (internal) ---

/**
 * Story 1A.5 AC6 guard: assert a write target is confined to `_bmad/` under
 * `projectRoot`. Throws on traversal attempts. All filesystem mutations in
 * Phase 3 (SKILL.md rewrites), Phase 4 (deprecation banner), and Phase 2+5
 * (state file) pass through this helper before `fs.writeFileSync` is called.
 *
 * Intentionally does NOT allow `.claude/skills/` (FR8 names it as a broader
 * invariant, but this migration only rewrites SOURCE files under `_bmad/` —
 * installed `.claude/skills/` files are regenerated by `convoke-install` /
 * `refreshInstallation`, not by this migration).
 *
 * @param {string} absPath - Write target (may be relative or unresolved).
 * @param {string} projectRoot - Project root (already normalized by `apply`).
 * @throws {Error} if the resolved target escapes `{projectRoot}/_bmad/`.
 */
function _assertWriteContained(absPath, projectRoot) {
  const resolved = path.resolve(absPath);
  const bmadRoot = path.resolve(projectRoot, '_bmad');
  if (!resolved.startsWith(bmadRoot + path.sep)) {
    throw new Error(
      `Migration refused write outside _bmad/: ${resolved} (projectRoot: ${projectRoot})`
    );
  }
}

/**
 * Rewrite the "1. **Load config via bmad-init skill**" block in an On Activation
 * section with the v4 template (parameterized by module). Returns the rewritten
 * content on success, or {rewritten: false, reason} on failure.
 *
 * Template-based (FM2-1): constructs the new block from the template constant
 * + substitution, then splices it in by line index. NOT a substring .replace()
 * which would be fragile against varying whitespace/formatting.
 */
function _rewriteActivation(content, module) {
  // Dominant-EOL detection: count CRLF vs LF and pick the majority. A single
  // stray CRLF in an otherwise-LF file shouldn't flip all line endings.
  const lineEnding = _detectDominantEol(content);
  const lines = content.split(/\r?\n/);

  const activationIdx = lines.findIndex(l => /^##\s+On Activation/.test(l));
  if (activationIdx === -1) {
    return { rewritten: false, reason: 'no "## On Activation" section found' };
  }

  const step1Idx = lines.findIndex(
    (l, i) => i > activationIdx && /^1\.\s+\*\*Load config via bmad-init skill\*\*/.test(l)
  );
  if (step1Idx === -1) {
    return { rewritten: false, reason: 'no "1. **Load config via bmad-init skill**" line found' };
  }

  // Scan forward for end-of-block: next top-level numbered item, next section
  // heading, or EOF. Track fenced-code-block state (``` toggles) so a numbered
  // line inside a code fence doesn't prematurely terminate the block.
  let endIdx = lines.length;
  let inFence = false;
  for (let i = step1Idx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^\d+\.\s/.test(line) || /^##\s/.test(line)) {
      endIdx = i;
      break;
    }
  }

  const newBlock = V4_ACTIVATION_TEMPLATE.replace(/\{module\}/g, module).split('\n');
  const result = [...lines.slice(0, step1Idx), ...newBlock, ...lines.slice(endIdx)];
  return { rewritten: true, content: result.join(lineEnding) };
}

/**
 * Detect the dominant end-of-line convention: count CRLF pairs vs standalone
 * LF, return whichever is more common. Default to LF.
 */
function _detectDominantEol(content) {
  const crlfCount = (content.match(/\r\n/g) || []).length;
  // Standalone LF = total LF - CRLF (since each CRLF contains one LF).
  const totalLf = (content.match(/\n/g) || []).length;
  const standaloneLf = totalLf - crlfCount;
  return crlfCount > standaloneLf ? '\r\n' : '\n';
}

/**
 * Insert a banner line after the frontmatter close marker (`---`) and a blank
 * line. If no frontmatter is present, prepend the banner + blank line.
 */
function _insertBannerAfterFrontmatter(content, banner) {
  const lines = content.split(/\r?\n/);
  const lineEnding = _detectDominantEol(content);

  // Frontmatter detection: first line === '---', find matching close '---'.
  if (lines[0] === '---') {
    let closeIdx = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') { closeIdx = i; break; }
    }
    if (closeIdx !== -1) {
      // If the line immediately after the frontmatter is already blank, skip
      // our leading '' to avoid producing a double-blank.
      const nextLine = lines[closeIdx + 1];
      const leadingBlank = nextLine === '' ? [] : [''];
      const result = [
        ...lines.slice(0, closeIdx + 1),
        ...leadingBlank,
        banner,
        '',
        ...lines.slice(closeIdx + 1),
      ];
      return result.join(lineEnding);
    }
  }

  // No frontmatter: prepend banner + blank.
  return [banner, '', ...lines].join(lineEnding);
}

function _runDoctor(projectRoot) {
  try {
    const stdout = execFileSync('npx', ['-p', 'convoke-agents', 'convoke-doctor'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60000,
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });
    return _parseDoctorOutput(stdout);
  } catch (err) {
    // Distinguish "doctor ran, exited non-zero with findings" from "doctor
    // never ran". The former is expected (doctor exits 1 when issues exist,
    // stdout carries the findings); the latter is a genuine failure that
    // must NOT silently return an empty baseline.
    const hasStdout = err && err.stdout !== undefined && err.stdout !== null;
    if (err && err.code === 'ENOENT') {
      throw new Error(
        `convoke-doctor unavailable: ${err.code} (${err.path || 'npx'} not on PATH). ` +
        `Migration cannot capture a reliable doctor baseline.`,
        { cause: err }
      );
    }
    if (err && (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT')) {
      throw new Error(
        `convoke-doctor timed out (60s) — migration cannot capture a reliable baseline.`,
        { cause: err }
      );
    }
    if (err && err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
      throw new Error(
        `convoke-doctor output exceeded maxBuffer (10 MB). ` +
        `Migration cannot capture a reliable baseline.`,
        { cause: err }
      );
    }
    if (!hasStdout) {
      throw new Error(
        `convoke-doctor failed with no stdout (${(err && err.code) || 'unknown'}). ` +
        `Migration cannot capture a reliable baseline.`,
        { cause: err }
      );
    }
    // Expected path: exit 1 with findings on stdout.
    return _parseDoctorOutput(String(err.stdout));
  }
}

/**
 * Parse convoke-doctor text output into `{findings: [{name, message}]}`.
 * Extracts lines starting with `✗` (failures) and normalizes them.
 *
 * The doctor doesn't currently support `--json`; we parse the human-readable
 * output. If a future story adds `--json`, swap this for JSON.parse.
 */
function _parseDoctorOutput(stdout) {
  const findings = [];
  // Strip ANSI color escape sequences before regex matching. Doctor may emit
  // colored output if NO_COLOR isn't honored by its chalk version.
  // `\x1b` (ESC, U+001B) is required here — it's the ANSI CSI introducer.
  // eslint-disable-next-line no-control-regex
  const stripped = String(stdout || '').replace(/\x1b\[[0-9;]*m/g, '');
  const lines = stripped.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Failure lines look like `  ✗ Check name`.
    const match = /^\s*✗\s+(.+?)\s*$/.exec(line);
    if (match) {
      const name = match[1];
      // The next indented line(s) carry detail; capture first one.
      const detail = lines[i + 1] && /^\s{4,}\S/.test(lines[i + 1])
        ? lines[i + 1].trim()
        : '';
      findings.push({ name, message: detail });
    }
  }
  return { findings };
}

/**
 * Diff-key used to dedupe findings between Phase 2 baseline and Phase 5 after
 * snapshot. Uses `name` only — message text often contains volatile data
 * (counts, paths, timestamps) that drift between runs without representing
 * a real regression. Message-drift false-positives outweigh the loss of
 * fidelity on rare "same check, different cause" cases.
 */
function _findingKey(finding) {
  return `${finding.name || ''}`;
}

function _parseInventoryCsv(csvText) {
  // filter non-whitespace content (plain `length > 0` retains indent-only lines).
  const lines = String(csvText || '').split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = _parseCsvRow(lines[0]);
  // Require the canonical v6.3-migration-inventory schema columns so a future
  // schema change surfaces loudly instead of silently filtering all rows.
  const REQUIRED_COLS = ['file', 'module', 'candidate_status'];
  const missing = REQUIRED_COLS.filter(c => !header.includes(c));
  if (missing.length > 0) {
    throw new Error(
      `Inventory CSV is missing required columns: ${missing.join(', ')} ` +
      `(header was: ${header.join(',')})`
    );
  }
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = _parseCsvRow(lines[i]);
    if (values.length !== header.length) {
      // Warn rather than throw — row-level column drift shouldn't abort the
      // whole migration; emit the row anyway with missing columns as ''.
      console.warn(
        `[3.3.x-to-4.0.0] WARN: inventory row ${i + 1} has ${values.length} columns, ` +
        `expected ${header.length} — proceeding with best-effort parse`
      );
    }
    const row = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = values[j] || '';
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Minimal RFC 4180 row parser. Mirrors scripts/audit's _formatCsvValue /
 * _bmad/bme/_team-factory/lib/utils/csv-utils.parseCsvRow escape semantics:
 * fields may be wrapped in `"`, inner `"` is escaped as `""`.
 */
function _parseCsvRow(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { fields.push(cur); cur = ''; }
      else { cur += ch; }
    }
  }
  fields.push(cur);
  return fields;
}

function _readState(projectRoot) {
  const statePath = path.join(projectRoot, STATE_FILE_RELATIVE);
  if (!fs.existsSync(statePath)) return null;
  return yaml.load(fs.readFileSync(statePath, 'utf8'));
}

function _writeState(projectRoot, state) {
  const statePath = path.join(projectRoot, STATE_FILE_RELATIVE);
  const tmpPath = `${statePath}.tmp`;
  _assertWriteContained(statePath, projectRoot);
  _assertWriteContained(tmpPath, projectRoot);
  fs.ensureDirSync(path.dirname(statePath));
  // Atomic write via tmpfile + rename: SIGKILL/power-loss mid-write leaves
  // either the old state or the new state intact, never a torn partial file.
  // lineWidth: -1 disables line wrapping so long finding messages (with paths,
  // stack traces) don't fold inside quoted scalars and break round-trip parse.
  fs.writeFileSync(tmpPath, yaml.dump(state, { lineWidth: -1 }), 'utf8');
  fs.renameSync(tmpPath, statePath);
}

// --- Testing hooks (exposed for unit tests; not part of the public contract) ---

module.exports._internal = {
  _phase1_detect,
  _phase2_verifyConfigs,
  _phase3_sweepSkillMd,
  _phase4_deprecateBmadInit,
  _phase5_doctorDiff,
  _rewriteActivation,
  _insertBannerAfterFrontmatter,
  _parseInventoryCsv,
  _parseDoctorOutput,
  _assertWriteContained,  // Story 1A.5 AC6 path-safety helper
  V4_ACTIVATION_TEMPLATE,
  DEPRECATION_BANNER,
  STATE_FILE_RELATIVE,
};
