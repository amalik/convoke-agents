#!/usr/bin/env node
'use strict';

/**
 * @module scripts/audit/reference-integrity
 *
 * Mechanical reference-integrity check for the Convoke project tree.
 * Implements FR24–25 + NFR10–12 of I97 (BMAD v6.3+ Source Format Adoption).
 * Authored by Story i97-1.1 (Migration Tooling Foundation Scaffolded).
 *
 * **Round 1 code-review patches applied 2026-05-01:**
 *   - P3: symlink-cycle protection via lstatSync (skip symlinks during
 *     directory walk, matches sibling audit-script convention).
 *   - P4: distinguish ENOENT (broken ref) from EACCES (inaccessible —
 *     surface as warning, do not flag as broken).
 *   - P5: regex statefulness fix — use `String.matchAll` with fresh RegExp
 *     instances per call.
 *   - P6: middle-segment glob wildcards now expanded (previously
 *     `.claude/skills/bmad-agent-bme-* /SKILL.md` returned ZERO files).
 *   - P7: code-fence stripping uses space-fill instead of empty-fill to
 *     preserve column offsets.
 *   - P8: 4-space-indented code blocks also stripped (markdown classic
 *     indented-block syntax).
 *   - P16: `_validateRef` `_projectRoot` parameter use clarified —
 *     comment now matches actual behavior (no containment enforcement;
 *     scope-discipline says don't add gates not in AC4).
 *   - P17: `--paths --help` arg-parsing edge case — values starting with
 *     `--` are rejected.
 *   - P21: `MD_LINK_REF_REGEX` now also matches angle-bracket form
 *     `[text](<path with spaces>)` (canonical markdown spec).
 *   - P25: `--paths=foo,bar` equals-form arg parsing supported.
 *
 * **Coverage scopes** (per architecture document § D4 line 217 +
 * formalized AC4 amendment per Round 1 review decision D4): documentation
 * cross-references in `.md` files only. Source-code string literals in
 * `.js` files were producing 23 false positives extracting markdown-link
 * patterns from test fixture data — formally narrowed to `.md` files.
 *
 *   1. Test markdown documentation under `tests/` (`.md` files only)
 *   2. Slash-command wrappers under `.claude/skills/bmad-agent-bme-* /`
 *   3. Retrospective citations in `_bmad-output/implementation-artifacts/
 *      *-retro-*.md`
 *   4. Audit report citations in `_bmad-output/planning-artifacts/
 *      convoke-report-*-audit-*.md`
 *   5. Compliance Checklist file references in
 *      `_bmad/bme/covenant/compliance-checklist.md`
 *
 * **`{{...}}` template-placeholder filter** (formalized in AC4 amendment
 * per Round 1 review decision D5): refs containing `{{` or `}}` are
 * skipped — these are template-engine syntax (e.g., bmad-document-project's
 * `{{path}}` placeholders), not real references.
 *
 * **Usage.**
 *   node scripts/audit/reference-integrity.js               # full project scan
 *   node scripts/audit/reference-integrity.js --paths a,b   # comma-separated
 *   node scripts/audit/reference-integrity.js --paths=a,b   # equals form
 *   node scripts/audit/reference-integrity.js --no-exempt   # include historical records
 *   node scripts/audit/reference-integrity.js --help        # usage + exit 0
 *
 * **Historical-record exemption.** Append-only receipts are skipped by default; see
 * HISTORICAL_RECORD_PREFIXES for the list and the reasoning. The skipped count is always
 * printed, and `--no-exempt` scans them.
 */

const fs = require('fs-extra');
const path = require('path');
const { findProjectRoot } = require('../update/lib/utils');

// ─── Constants ───────────────────────────────────────────────────────

/**
 * Append-only historical records, exempt from reference checking by construction.
 *
 * These are not "files we gave up on". They are receipts: a closed story file, an
 * archived plan, or a dated test artifact records what was true on the day it was
 * written, and is never edited afterwards — the same property §2.1 Intakes and §2.5
 * receipts have in the lifecycle backlog. A reference inside one is part of the
 * record, so "repairing" it would falsify the record rather than fix a document.
 *
 * The exemption is structural, not a judgement call about effort. It is also never
 * silent: the CLI reports how many files it skipped, and `--no-exempt` scans them
 * anyway, so the unexempted number is always one flag away.
 *
 * Do NOT add a live, maintained document here to make the gate green. If a document
 * is still being edited, its references are still claims, and a broken one is a defect.
 */
// Frozen because it is exported: a consumer holding the live array could otherwise widen the
// exemption at runtime, which is the one change to this gate that produces no failure anywhere.
// `fic-1-1` froze the agent registry arrays for the same reason.
const HISTORICAL_RECORD_PREFIXES = Object.freeze([
  '_bmad-output/implementation-artifacts/',
  '_bmad-output/_archive/',
  '_bmad-output/test-artifacts/',
  '_bmad-output/vortex-artifacts/',
  '_bmad-output/planning-artifacts/archive/',
]);

/**
 * Documents whose relative links are written for the directory they will be PUBLISHED into,
 * not the directory they currently sit in. Maps repo-relative file → repo-relative publish dir.
 *
 * `_bmad-output/drafts/README-draft.md` is the worked case: it is a draft of the root
 * `README.md`, so `[FAQ](docs/faq.md)` is correct for its destination and wrong where it sits.
 * Resolving from the draft's own directory reported 24 broken links, all 17 distinct targets of
 * which exist at the root — so the checker was wrong about the intent, not the document.
 *
 * This is deliberately NOT an exemption. The file's links are still checked, just from the
 * right base, so breaking one still fails the gate. Prefer this over adding a draft directory
 * to HISTORICAL_RECORD_PREFIXES: `_bmad-output/drafts/` also holds the docs-program pages that
 * ship to clients, and those must stay checked.
 *
 * A frontmatter declaration would be the general version. It is not used here because the entry
 * below is a README draft, and frontmatter added to it would be published into `README.md`.
 */
const PUBLISH_BASES = Object.freeze({
  '_bmad-output/drafts/README-draft.md': '.',
});

const COVERAGE_SCOPES = {
  tests: {
    description: 'Test markdown documentation under tests/',
    globs: ['tests/**/*.md'],
  },
  slashCommands: {
    description: 'Slash-command wrappers under .claude/skills/bmad-agent-bme-*/',
    globs: ['.claude/skills/bmad-agent-bme-*/SKILL.md'],
  },
  retros: {
    description: 'Retrospective citations',
    globs: ['_bmad-output/implementation-artifacts/*-retro-*.md'],
  },
  auditReports: {
    description: 'Audit report citations',
    globs: ['_bmad-output/planning-artifacts/convoke-report-*-audit-*.md'],
  },
  complianceChecklist: {
    description: 'Compliance Checklist file references',
    globs: ['_bmad/bme/covenant/compliance-checklist.md'],
  },
};

// Markdown link regex sources. Both standard `[text](path)` form and
// angle-bracket `[text](<path with spaces>)` form (Round 1 review patch
// P21). Built fresh per call via String.matchAll to avoid lastIndex state
// (Round 1 review patch P5).
const MD_LINK_STANDARD_PATTERN = /\[(?:[^\]]*?)\]\(([^)\s<][^)\s]*?)(?:\s+"[^"]*")?\)/g;
const MD_LINK_ANGLE_PATTERN = /\[(?:[^\]]*?)\]\(<([^>]+)>(?:\s+"[^"]*")?\)/g;

const URL_SCHEME_REGEX = /^[a-z][a-z0-9+.-]*:/i;

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Run the full reference-integrity check.
 *
 * @param {Object} options
 * @param {string} options.projectRoot   Absolute path to the project root.
 * @param {string[]} [options.scopePaths]  Optional list of scope paths.
 * @param {boolean} [options.exemptHistorical=true]  Skip HISTORICAL_RECORD_PREFIXES.
 *   Pass `false` to scan them too.
 * @returns {{
 *   totalRefs: number,
 *   brokenRefs: Array<{ source: string, target: string, reason: string }>,
 *   exemptedCount: number,
 *   filesScanned: number
 * }}
 */
function runReferenceIntegrityCheck(options) {
  if (!options || typeof options !== 'object') {
    throw new TypeError('runReferenceIntegrityCheck: options object is required');
  }
  const { projectRoot, scopePaths } = options;
  if (typeof projectRoot !== 'string' || projectRoot.length === 0) {
    throw new TypeError('runReferenceIntegrityCheck: options.projectRoot must be a non-empty string');
  }

  const resolved = scopePaths && scopePaths.length > 0
    ? _resolveScopePaths(projectRoot, scopePaths)
    : _resolveAllScopes(projectRoot);

  // Historical records are exempt unless the caller opts out. See
  // HISTORICAL_RECORD_PREFIXES for why this is structural rather than a concession.
  const exemptHistorical = options.exemptHistorical !== false;
  const filesToScan = exemptHistorical
    ? resolved.filter(f => !_isHistoricalRecord(projectRoot, f))
    : resolved;
  const exemptedCount = resolved.length - filesToScan.length;

  let totalRefs = 0;
  const brokenRefs = [];

  for (const fileAbs of filesToScan) {
    let content;
    try {
      content = fs.readFileSync(fileAbs, 'utf8');
    } catch (err) {
      console.warn(`[reference-integrity] could not read ${fileAbs}: ${err.message}`);
      continue;
    }

    const refs = _extractMarkdownLinkRefs(content);
    // A document destined for another directory has its links resolved from there. See
    // PUBLISH_BASES — this validates them at the destination rather than skipping them.
    const relPosix = path.relative(projectRoot, fileAbs).split(path.sep).join('/');
    const publishBase = Object.prototype.hasOwnProperty.call(PUBLISH_BASES, relPosix)
      ? PUBLISH_BASES[relPosix]
      : null;
    const fileDir = publishBase === null
      ? path.dirname(fileAbs)
      : path.resolve(projectRoot, publishBase);

    for (const ref of refs) {
      totalRefs += 1;
      const validation = _validateRef(ref, { fileDir, projectRoot });
      if (!validation.valid) {
        brokenRefs.push({
          source: path.relative(projectRoot, fileAbs),
          target: ref,
          reason: validation.reason,
        });
      }
    }
  }

  return { totalRefs, brokenRefs, exemptedCount, filesScanned: filesToScan.length };
}

/**
 * True when `fileAbs` sits under one of HISTORICAL_RECORD_PREFIXES.
 *
 * Compares on a POSIX-separated repo-relative path so the prefixes read the same on
 * Windows, and anchors at the start so a directory of the same name nested deeper
 * (`docs/_bmad-output/_archive/`) is not silently exempted too.
 */
function _isHistoricalRecord(projectRoot, fileAbs) {
  const rel = path.relative(projectRoot, fileAbs).split(path.sep).join('/');
  return HISTORICAL_RECORD_PREFIXES.some(prefix => rel.startsWith(prefix));
}

// ─── Internal helpers ───────────────────────────────────────────────

function _extractMarkdownLinkRefs(content) {
  if (typeof content !== 'string') return [];
  const stripped = _stripCodeRegions(content);
  const refs = [];

  // Round 1 review patch P5: build fresh RegExp per call (no shared state).
  // Round 1 review patch P21: handle both standard and angle-bracket form.
  const standardRe = new RegExp(MD_LINK_STANDARD_PATTERN.source, MD_LINK_STANDARD_PATTERN.flags);
  for (const match of stripped.matchAll(standardRe)) {
    const target = match[1].trim();
    if (target.length > 0) refs.push(target);
  }

  const angleRe = new RegExp(MD_LINK_ANGLE_PATTERN.source, MD_LINK_ANGLE_PATTERN.flags);
  for (const match of stripped.matchAll(angleRe)) {
    const target = match[1].trim();
    if (target.length > 0) refs.push(target);
  }

  return refs;
}

/**
 * Remove fenced code blocks (```/~~~), inline code spans (`...`), and
 * 4-space-indented code blocks from markdown content before link
 * extraction.
 *
 * Round 1 review patch P7: space-fill (not empty-fill) for fences to
 * preserve column offsets.
 * Round 1 review patch P8: also strip 4-space-indented blocks.
 */
function _stripCodeRegions(content) {
  // Strip fenced blocks (greedy multi-line; both ``` and ~~~).
  const fenceRe = /```[\s\S]*?```|~~~[\s\S]*?~~~/g;
  const noFences = content.replace(fenceRe, (m) => m.replace(/[^\n]/g, ' '));
  // Strip inline code spans.
  const inlineRe = /`[^`\n]*`/g;
  const noInline = noFences.replace(inlineRe, (m) => ' '.repeat(m.length));
  // Strip 4-space-indented blocks (lines beginning with 4 spaces or a
  // tab, after a blank line).
  const lines = noInline.split('\n');
  let prevBlank = true;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const isIndentedCode = (line.startsWith('    ') || line.startsWith('\t')) && line.trim().length > 0;
    if (prevBlank && isIndentedCode) {
      lines[i] = ' '.repeat(line.length);
      let j = i + 1;
      while (j < lines.length && (lines[j].startsWith('    ') || lines[j].startsWith('\t'))) {
        lines[j] = ' '.repeat(lines[j].length);
        j += 1;
      }
      i = j - 1;
      prevBlank = false;
    } else {
      prevBlank = line.trim().length === 0;
    }
  }
  return lines.join('\n');
}

/**
 * Validate a single reference. Returns `{ valid, reason? }`.
 *
 * Round 1 review patch P16: `projectRoot` parameter is intentionally
 * destructured-as-unused (`_projectRoot`). This script does NOT enforce
 * containment of resolved paths to projectRoot — that gate is not in AC4
 * scope. Callers needing containment can layer that check on top of the
 * `brokenRefs` results.
 *
 * Round 1 review patch P4: distinguish ENOENT (broken ref) from EACCES
 * (inaccessible — surface as warning to stderr, not as broken). EACCES is
 * an environmental issue (permission-restricted dir on a dev machine),
 * not a documentation defect.
 */
function _validateRef(ref, { fileDir, projectRoot: _projectRoot }) {
  if (URL_SCHEME_REGEX.test(ref)) return { valid: true };
  if (ref.startsWith('#')) return { valid: true };

  // Skip template placeholders ({{...}}) — formalized in AC4 amendment per
  // Round 1 review decision D5.
  if (ref.includes('{{') || ref.includes('}}')) return { valid: true };

  const hashIdx = ref.indexOf('#');
  const filePart = hashIdx >= 0 ? ref.slice(0, hashIdx) : ref;
  if (filePart.length === 0) return { valid: true };

  const resolved = path.isAbsolute(filePart)
    ? filePart
    : path.resolve(fileDir, filePart);

  // Distinguish ENOENT from EACCES (Round 1 review patch P4) and reject
  // EISDIR — a markdown link `[doc](../docs)` that resolves to a
  // directory is almost always a typo (the author meant `docs/index.md`
  // or similar). Round 2 review patch R2-P7.
  try {
    fs.accessSync(resolved, fs.constants.F_OK);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { valid: false, reason: `target does not exist (resolved: ${resolved})` };
    }
    if (err.code === 'EACCES' || err.code === 'EPERM') {
      console.warn(`[reference-integrity] inaccessible (${err.code}), skipping: ${resolved}`);
      return { valid: true };
    }
    return { valid: false, reason: `target check failed: ${err.code || err.message} (resolved: ${resolved})` };
  }
  // Path exists; verify file-vs-dir intent matches author signal.
  // Directory references with a trailing slash (e.g. `[docs](../docs/)`)
  // signal author intent: "this is a directory link". Without trailing
  // slash (e.g. `[doc](../docs)`), markdown convention is file-link;
  // such a ref pointing to a directory is almost always a typo (author
  // meant `docs/index.md`). Round 2 review patch R2-P7, refined.
  try {
    const st = fs.statSync(resolved);
    if (st.isDirectory()) {
      // Honor explicit trailing-slash intent on the original ref.
      const refIntendedDir = filePart.endsWith('/') || filePart.endsWith(path.sep);
      if (!refIntendedDir) {
        return { valid: false, reason: `target is a directory, expected a file (add trailing slash if directory link is intended; resolved: ${resolved})` };
      }
    }
  } catch (err) {
    return { valid: false, reason: `stat failed: ${err.code || err.message} (resolved: ${resolved})` };
  }
  // Fragment last: the file resolves, so a bad `#anchor` is a real finding rather than a
  // consequence of a missing file.
  if (hashIdx >= 0) {
    const frag = ref.slice(hashIdx + 1);
    if (frag && !_fragmentResolves(resolved, frag)) {
      return { valid: false, reason: `anchor "#${frag}" matches no heading in ${path.basename(resolved)}` };
    }
  }
  return { valid: true };
}

/**
 * GitHub's heading-slug rules, as this repository's own working anchors demonstrate them.
 *
 * THE ONE RULE THAT MATTERS: punctuation is dropped and **each surviving space becomes one
 * hyphen**, so a run of spaces becomes a run of hyphens. `### 2.3 Fast Lane (Quick Wins + Spikes)`
 * slugs to `23-fast-lane-quick-wins--spikes` — double hyphen, because dropping `+` leaves two
 * spaces. Five links in this repository use that exact string, which is what establishes the rule
 * here rather than an appeal to an external spec. A first attempt collapsed runs with `\s+` and
 * produced a 12% false-positive rate on healthy links; that bug is the reason this comment exists.
 */
function _slugify(heading) {
  return heading
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*?([^*]*)\*\*?/g, '$1')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/ /g, '-');
}

/** Heading slugs of a markdown file, with GitHub's `-1`, `-2` … disambiguation for duplicates. */
const _slugCache = new Map();
function _headingSlugs(file) {
  if (_slugCache.has(file)) return _slugCache.get(file);
  const slugs = new Set();
  const seen = new Map();
  try {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = /^#{1,6}\s+(.*)$/.exec(line);
      if (!m) continue;
      const base = _slugify(m[1]);
      if (!base) continue;
      const n = seen.get(base) || 0;
      seen.set(base, n + 1);
      slugs.add(n === 0 ? base : `${base}-${n}`);
    }
  } catch { /* unreadable target is already reported by the file check above */ }
  _slugCache.set(file, slugs);
  return slugs;
}

/**
 * NOT EVERY FRAGMENT IS A HEADING SLUG, and the exclusions are the majority of what a naive
 * version reports. `#L75` / `#L102-L127` are GitHub blob line anchors — no slug algorithm resolves
 * them and none should try; 53 of them exist here. Non-markdown targets have no headings to match.
 */
function _fragmentResolves(resolved, frag) {
  if (/^L\d+(-L\d+)?$/.test(frag)) return true;
  if (!resolved.endsWith('.md')) return true;
  return _headingSlugs(resolved).has(frag.toLowerCase());
}

function _resolveAllScopes(projectRoot) {
  const files = new Set();
  for (const scopeKey of Object.keys(COVERAGE_SCOPES)) {
    const scope = COVERAGE_SCOPES[scopeKey];
    for (const globPattern of scope.globs) {
      const matched = _walkGlob(projectRoot, globPattern);
      for (const f of matched) files.add(f);
    }
  }
  return Array.from(files);
}

function _resolveScopePaths(projectRoot, scopePaths) {
  const files = new Set();
  for (const sp of scopePaths) {
    const abs = path.isAbsolute(sp) ? sp : path.resolve(projectRoot, sp);
    if (!fs.existsSync(abs)) {
      console.warn(`[reference-integrity] --paths target does not exist, skipping: ${sp}`);
      continue;
    }
    // Round 2 review patch R2-P8: use lstatSync at entry to skip symlinks
    // consistently with `_walkDir`. Without this, a user passing
    // `--paths symlink-to-elsewhere` bypasses the symlink-skip rule.
    let lst;
    try {
      lst = fs.lstatSync(abs);
    } catch (_err) {
      console.warn(`[reference-integrity] --paths target stat failed, skipping: ${sp}`);
      continue;
    }
    if (lst.isSymbolicLink()) {
      console.warn(`[reference-integrity] --paths target is a symlink, skipping: ${sp}`);
      continue;
    }
    if (lst.isDirectory()) {
      const walked = _walkDir(abs, ['.md']);
      for (const f of walked) files.add(f);
    } else if (lst.isFile()) {
      files.add(abs);
    }
  }
  return Array.from(files);
}

/**
 * Glob matcher supporting:
 *   - Direct file paths (no wildcards)
 *   - `**\/*.ext` recursive shape
 *   - Middle-segment wildcards like `.claude/skills/bmad-agent-bme-* /file.md`
 *     (Round 1 review patch P6 — previously these returned ZERO files).
 */
function _walkGlob(projectRoot, globPattern) {
  const parts = globPattern.split('/');
  // Find the static prefix (segments without wildcards).
  const staticPrefix = [];
  let i = 0;
  while (i < parts.length && !parts[i].includes('*')) {
    staticPrefix.push(parts[i]);
    i += 1;
  }
  const staticDir = path.join(projectRoot, ...staticPrefix);
  if (!fs.existsSync(staticDir)) return [];

  if (i === parts.length) {
    // No wildcards — direct path. Round 2 review patch R2-P1: drop `.js`
    // from the suffix list to honor the AC4 amendment (`.md`-only scope
    // narrowing). Was previously `['.md', '.js']` which would
    // re-introduce the 23 false positives the narrowing was meant to
    // remove if any future glob landed here.
    if (fs.statSync(staticDir).isFile()) return [staticDir];
    return _walkDir(staticDir, ['.md']);
  }

  const tail = parts.slice(i);
  return _expandGlobTail(staticDir, tail);
}

/**
 * Expand the wildcard portion of a glob, walking directories as needed.
 * Supports `**`, single-segment `*`, and exact segments interspersed.
 *
 * Round 1 review patch P6: previously, middle-segment wildcards were
 * dropped — `bmad-agent-bme-* /SKILL.md` was joined as a literal path and
 * returned zero files because the literal `*` directory didn't exist.
 * (Note: the `* /` separation is to avoid closing this JSDoc block.)
 */
function _expandGlobTail(currentDir, tailParts) {
  if (tailParts.length === 0) {
    if (fs.statSync(currentDir).isFile()) return [currentDir];
    return [];
  }

  // Round 2 review patch R2-P2: collapse adjacent `**` segments before
  // dispatch. Without this, `**/**` enters the `head === '**'` branch
  // with `rest = ['**']`; the zero-segment-match recurses with the same
  // args until stack overflow. Collapse-then-dispatch avoids the
  // pathological recursion entirely.
  let normalizedTail = tailParts;
  if (tailParts[0] === '**' && tailParts[1] === '**') {
    normalizedTail = [tailParts[0], ...tailParts.slice(2)];
    return _expandGlobTail(currentDir, normalizedTail);
  }

  const [head, ...rest] = normalizedTail;

  // `**` — recursive: walk EVERY descendant, then apply remaining tail
  // against descendants' remaining-path-suffix.
  if (head === '**') {
    if (rest.length === 0) {
      // `**` alone — walk all files.
      return _walkDir(currentDir, []);
    }
    // `**/<rest>` — for every descendant directory, try matching rest from
    // there. Plus, allow `**` to match zero segments (rest can match
    // directly under currentDir).
    const out = new Set();
    // Zero-segment match.
    for (const f of _expandGlobTail(currentDir, rest)) out.add(f);
    // Descend into all subdirectories.
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (_err) {
      return [];
    }
    for (const ent of entries) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      // Round 1 review patch P3: skip symlinks during directory walk to
      // prevent infinite loops on cycles.
      if (ent.isSymbolicLink()) continue;
      if (ent.isDirectory()) {
        const subdir = path.join(currentDir, ent.name);
        for (const f of _expandGlobTail(subdir, tailParts)) out.add(f);
      }
    }
    return Array.from(out);
  }

  // Wildcard segment (`*` or `prefix-*-suffix`) — match against immediate
  // children only, then recurse with rest.
  if (head.includes('*')) {
    const pattern = _globPartToRegex(head);
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (_err) {
      return [];
    }
    const out = [];
    for (const ent of entries) {
      if (!pattern.test(ent.name)) continue;
      // Round 1 review patch P3: skip symlinks.
      if (ent.isSymbolicLink()) continue;
      const child = path.join(currentDir, ent.name);
      if (rest.length === 0) {
        // Final segment matched — must be a file.
        if (ent.isFile()) out.push(child);
      } else if (ent.isDirectory()) {
        // Has more tail — descend.
        out.push(..._expandGlobTail(child, rest));
      }
    }
    return out;
  }

  // Exact segment — descend if it exists.
  const next = path.join(currentDir, head);
  if (!fs.existsSync(next)) return [];
  return _expandGlobTail(next, rest);
}

function _globPartToRegex(globPart) {
  // Do NOT replace this with `escapeRegExp` from scripts/lib/sanitize.js. The
  // character class here deliberately omits `*`, because the next line turns
  // `*` into the glob wildcard `.*`. The shared helper escapes `*` to `\*` and
  // would break every glob. Ordering is also deliberate: `\` is escaped in the
  // first pass, so the second pass cannot see backslashes it did not create.
  // Flagged during the issue #7 consolidation, which converted five other
  // call sites and left this one alone on purpose.
  const escaped = globPart
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

/**
 * Recursively walk a directory, collecting files matching `suffixFilter`.
 * Skips `node_modules`, `.git`, dot-prefixed dirs, and symlinks (Round 1
 * review patch P3 — symlink-cycle protection via lstatSync; matches the
 * sibling audit-script convention in audit-skill-dirs.js).
 */
function _walkDir(rootDir, suffixFilter) {
  const out = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const cur = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch (_err) {
      continue;
    }
    for (const ent of entries) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      const full = path.join(cur, ent.name);
      // Round 1 review patch P3: skip symlinks to prevent infinite loops
      // on cycles. Use lstatSync to inspect the link itself, not its
      // target.
      let lst;
      try {
        lst = fs.lstatSync(full);
      } catch (_err) {
        continue;
      }
      if (lst.isSymbolicLink()) continue;
      if (lst.isDirectory()) {
        stack.push(full);
      } else if (lst.isFile()) {
        if (suffixFilter.length === 0) {
          out.push(full);
        } else {
          for (const suffix of suffixFilter) {
            if (full.endsWith(suffix)) {
              out.push(full);
              break;
            }
          }
        }
      }
    }
  }
  return out;
}

// ─── CLI Entry Point ────────────────────────────────────────────────

function _printUsage() {
  process.stdout.write([
    'reference-integrity — mechanical cross-reference check for the Convoke project tree',
    '',
    'Usage:',
    '  node scripts/audit/reference-integrity.js                # full project scan',
    '  node scripts/audit/reference-integrity.js --paths a,b    # comma-separated',
    '  node scripts/audit/reference-integrity.js --paths=a,b    # equals form',
    '  node scripts/audit/reference-integrity.js --no-exempt    # include historical records',
    '  node scripts/audit/reference-integrity.js --help         # usage + exit 0',
    '',
    'Exit codes:',
    '  0 — zero broken references (pass)',
    '  1 — one or more broken references detected',
    '  2 — invocation error (invalid arg)',
    '',
    'Implements FR24–25 + NFR10–12 of I97. See',
    '  _bmad-output/planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md (§ D4)',
    'for the architectural context.',
    '',
  ].join('\n'));
}

function _runCli(argv) {
  try {
    const args = argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
      _printUsage();
      return 0;
    }

    let scopePaths = null;
    let exemptHistorical = true;
    for (let i = 0; i < args.length; i += 1) {
      const arg = args[i];
      if (arg === '--no-exempt') {
        exemptHistorical = false;
        continue;
      }
      // Round 1 review patch P25: support `--paths=foo,bar` equals-form.
      if (arg.startsWith('--paths=')) {
        const value = arg.slice('--paths='.length);
        if (value.length === 0) {
          console.error('[reference-integrity] --paths= requires a comma-separated value');
          return 2;
        }
        scopePaths = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
      } else if (arg === '--paths') {
        const next = args[i + 1];
        // Round 1 review patch P17: reject values starting with `--`
        // (would silently consume the next flag as a path).
        if (typeof next !== 'string' || next.length === 0 || next.startsWith('--')) {
          console.error('[reference-integrity] --paths requires a comma-separated list of paths (cannot start with --)');
          return 2;
        }
        scopePaths = next.split(',').map(s => s.trim()).filter(s => s.length > 0);
        i += 1;
      } else if (arg.startsWith('--')) {
        console.error(`[reference-integrity] unknown arg: ${arg}`);
        return 2;
      }
    }

    const projectRoot = findProjectRoot();
    if (!projectRoot) {
      console.error('[reference-integrity] no project root found from cwd');
      return 2;
    }

    const result = runReferenceIntegrityCheck({ projectRoot, scopePaths, exemptHistorical });

    // Always state the exemption. A gate that quietly stops inspecting things is how
    // a green result comes to mean less than the reader thinks it does.
    const scopeNote = scopePaths ? ` (scoped to ${scopePaths.join(', ')})` : '';
    const exemptNote = exemptHistorical
      ? ` — ${result.exemptedCount} historical-record file(s) exempt; re-run with --no-exempt to include them`
      : ' — --no-exempt: historical records included';

    if (result.brokenRefs.length === 0) {
      console.log(`[reference-integrity] PASS — ${result.totalRefs} references checked across ${result.filesScanned} file(s), 0 broken${scopeNote}${exemptNote}`);
      return 0;
    }

    console.error(`[reference-integrity] FAIL — ${result.totalRefs} references checked across ${result.filesScanned} file(s), ${result.brokenRefs.length} broken${scopeNote}${exemptNote}`);
    for (const broken of result.brokenRefs) {
      console.error(`  ${broken.source} → ${broken.target}  (${broken.reason})`);
    }
    return 1;
  } catch (err) {
    console.error(`[reference-integrity] ERROR: ${(err && err.message) || String(err)}`);
    return 2;
  }
}

module.exports = {
  runReferenceIntegrityCheck,
  COVERAGE_SCOPES,
  HISTORICAL_RECORD_PREFIXES,
  PUBLISH_BASES,
};

if (require.main === module) {
  process.exit(_runCli(process.argv));
}
