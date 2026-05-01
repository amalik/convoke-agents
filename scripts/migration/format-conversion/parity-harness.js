'use strict';

/**
 * @module scripts/migration/format-conversion/parity-harness
 *
 * Parity test runner for I97 per-agent conversions. Asserts behavioral
 * equivalence between v5 (XML-in-markdown) and v6.3+ (outcome-based
 * markdown) SKILL.md by comparing:
 *   - menu codes (FR13)
 *   - workflow paths invoked (FR14)
 *   - output filenames produced (FR15)
 *
 * Authored by: Story i97-1.1 (Migration Tooling Foundation Scaffolded).
 * Round 1 code-review patches applied 2026-05-01: agentRoleName path-
 * traversal validation; non-stateful regex (matchAll); ## Capabilities
 * scope-anchored extraction; <menu> scope-anchored extraction; sort-
 * mutation fix (clone before sort); format-detection code-fence stripping.
 *
 * Derives from: ADR-003 (verification harness architecture).
 * Consumers:
 *   - tests/integration/vortex-parity.test.js (authored at Story 3.2)
 *   - Stories 2.1–2.7 per-agent test invocations
 *
 * Stub-but-functional contract per Story i97-1.1 AC3 + AC5:
 *   - `runParityCheck` returns the documented shape; never throws (unless
 *     structurally invalid input — see explicit checks below, authorized
 *     under AC7's broadened structural-input fail-fast pattern per Round 1
 *     review decision D2).
 *   - When the post-migration SKILL.md doesn't exist yet (Stories 2.1–2.7
 *     in-flight), returns `{ menuCodesEqual: null, postMigrationFile:
 *     'not-yet-converted', ... }` so downstream tests don't crash.
 *   - `extractV5MenuCodes` and `extractV63MenuCodes` are exposed for
 *     testability.
 *
 * Reusable for I98 (Gyre) and I99 (Team Factory) per NFR18.
 */

const fs = require('fs-extra');
const path = require('path');

const VORTEX_AGENTS_REL = '_bmad/bme/_vortex/agents';
const SKILL_MD = 'SKILL.md';

// Whitelist regex for agentRoleName — prevents path traversal via `..`,
// path separators, and other shell-shaped values. Lowercase + digits +
// hyphens, must start with alnum.
const AGENT_ROLE_NAME_RE = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*$/;

// Regex sources are NOT stored as module-level `/g` instances (would be
// stateful via `lastIndex`). Each extractor builds its own RegExp via
// String.matchAll for concurrency safety (Round 1 review patch P5 + P3 +
// P5 cross-finding).

// V5 menu items: `<item ... >[XX] ...` where XX is 2-3 uppercase letters.
const V5_MENU_ITEM_PATTERN = /<item\b[^>]*>\s*\[([A-Z]{2,3})\]/g;

// V6.3+ Capabilities table rows: `| XX |` where XX is 2-3 uppercase letters.
const V63_CAPABILITY_ROW_PATTERN = /^\|\s*([A-Z]{2,3})\s*\|/gm;

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Compare a v5 agent's pre-migration behavior against its v6.3+
 * post-migration behavior. Returns the comparison result; never throws
 * on a missing post-migration file (that's an expected mid-flight state
 * during Stories 2.1–2.7).
 *
 * Path-safety note (Round 1 review patch P1): `agentRoleName` is validated
 * against AGENT_ROLE_NAME_RE before any path.join — prevents traversal
 * via `..` or path separators. Throws TypeError on invalid input
 * (authorized under AC7's broadened structural-input fail-fast pattern).
 *
 * @param {Object} options
 * @param {string} options.projectRoot     Absolute path to the project root.
 * @param {string} options.agentRoleName   Role-name directory of the agent
 *                                          (e.g. 'contextualization-expert').
 *                                          Must match
 *                                          `/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*$/`.
 * @param {string} [options.tmpDir]        Reserved for fixture-isolated
 *                                          invocations during Story 3.2 CI
 *                                          gate productionization. In the
 *                                          stub, accepted but unused.
 * @returns {{
 *   menuCodesEqual: (boolean|null),
 *   workflowPathsEqual: (boolean|null),
 *   outputFilenamesEqual: (boolean|null),
 *   mismatches: Array<{ kind: string, detail: string }>,
 *   postMigrationFile: ('found'|'not-yet-converted'),
 *   preMigrationCodes: string[],
 *   postMigrationCodes: string[]
 * }}
 */
function runParityCheck(options) {
  if (!options || typeof options !== 'object') {
    throw new TypeError('runParityCheck: options object is required');
  }
  const { projectRoot, agentRoleName } = options;
  if (typeof projectRoot !== 'string' || projectRoot.length === 0) {
    throw new TypeError('runParityCheck: options.projectRoot must be a non-empty string');
  }
  if (typeof agentRoleName !== 'string' || agentRoleName.length === 0) {
    throw new TypeError('runParityCheck: options.agentRoleName must be a non-empty string');
  }
  if (!AGENT_ROLE_NAME_RE.test(agentRoleName)) {
    throw new TypeError(`runParityCheck: options.agentRoleName must match ${AGENT_ROLE_NAME_RE.source} (got '${agentRoleName}')`);
  }

  const skillMdPath = path.join(projectRoot, VORTEX_AGENTS_REL, agentRoleName, SKILL_MD);

  if (!fs.existsSync(skillMdPath)) {
    return {
      menuCodesEqual: null,
      workflowPathsEqual: null,
      outputFilenamesEqual: null,
      mismatches: [{ kind: 'missing-source', detail: `SKILL.md not found at ${skillMdPath}` }],
      postMigrationFile: 'not-yet-converted',
      preMigrationCodes: [],
      postMigrationCodes: [],
    };
  }

  // Strip code fences before format detection (Round 1 review patch P12).
  // Files with v5 examples in fenced code blocks would otherwise mis-detect
  // as v5 format.
  const rawContent = fs.readFileSync(skillMdPath, 'utf8');
  const detectionContent = stripCodeRegions(rawContent);

  const isV5Format = /<agent\b[^>]*>/m.test(detectionContent) && /<menu\b/m.test(detectionContent);
  const isV63Format = /^##\s+Capabilities\s*$/m.test(detectionContent);

  if (isV5Format && !isV63Format) {
    return {
      menuCodesEqual: null,
      workflowPathsEqual: null,
      outputFilenamesEqual: null,
      mismatches: [],
      postMigrationFile: 'not-yet-converted',
      preMigrationCodes: extractV5MenuCodes(rawContent),
      postMigrationCodes: [],
    };
  }
  if (isV63Format && !isV5Format) {
    return {
      menuCodesEqual: null,
      workflowPathsEqual: null,
      outputFilenamesEqual: null,
      mismatches: [],
      postMigrationFile: 'found',
      preMigrationCodes: [],
      postMigrationCodes: extractV63MenuCodes(rawContent),
    };
  }
  if (isV5Format && isV63Format) {
    // Transitional state — both formats in same file (rare; mid-conversion
    // commit). Parse both.
    const preCodes = extractV5MenuCodes(rawContent);
    const postCodes = extractV63MenuCodes(rawContent);
    const equal = arraysEqualUnordered(preCodes, postCodes);
    return {
      menuCodesEqual: equal,
      workflowPathsEqual: null, // Story 3.2 wires up full check
      outputFilenamesEqual: null,
      mismatches: equal
        ? []
        : [{
          kind: 'menu-code-set',
          // Round 1 review patch P11: clone before sort to preserve caller's
          // array order (the JSDoc on extractV5/V63MenuCodes says "Order
          // preserved").
          detail: `pre=[${[...preCodes].sort().join(',')}] post=[${[...postCodes].sort().join(',')}]`,
        }],
      postMigrationFile: 'found',
      preMigrationCodes: preCodes,
      postMigrationCodes: postCodes,
    };
  }

  // Neither format detected.
  return {
    menuCodesEqual: null,
    workflowPathsEqual: null,
    outputFilenamesEqual: null,
    mismatches: [{
      kind: 'unrecognized-format',
      detail: `SKILL.md at ${skillMdPath} matches neither v5 (XML <agent>/<menu>) nor v6.3+ (## Capabilities table)`,
    }],
    postMigrationFile: 'not-yet-converted',
    preMigrationCodes: [],
    postMigrationCodes: [],
  };
}

/**
 * Parse v5 SKILL.md content; return the array of menu codes (the bracketed
 * `[XX]` prefixes inside `<item>` tags within the `<menu>` block). Order
 * preserved.
 *
 * Round 1 review patch P10: scopes the scan to content between `<menu>`
 * and `</menu>` tags before applying the item regex. Prevents
 * false-positive matches on `<item>` tags appearing in `<examples>` or
 * documentary prose elsewhere in the file.
 *
 * Round 1 review patch P5: uses `matchAll` with a fresh RegExp per call;
 * no shared `lastIndex` state between concurrent invocations.
 *
 * @param {string} skillMdContent
 * @returns {string[]}
 */
function extractV5MenuCodes(skillMdContent) {
  if (typeof skillMdContent !== 'string') {
    throw new TypeError('extractV5MenuCodes: skillMdContent must be a string');
  }
  // Story 2.1 Task 1 regression fix: R2-P4 stripped fences before
  // extraction, but v5 SKILL.md format wraps the entire `<agent>`
  // definition inside a ```xml fenced block (the fence IS the canonical
  // structure, not an "example" to skip). Stripping the fence returns
  // empty extraction. Reverted for V5 only — V63 + fingerprint
  // extractors still strip fences (their canonical content is at
  // top-level markdown).
  //
  // Trade-off: a v5 file with TWO `<menu>` blocks (canonical + a
  // documentation example) would extract both. Acceptable: such files
  // don't exist in the Vortex corpus and would be a code smell anyway.
  // If they appear in I98 (Gyre) or I99 (Team Factory), revisit this
  // decision then.
  //
  // Anchor to the menu block: capture content between <menu...> and
  // </menu>. Multi-line via [\s\S]; non-greedy so the first </menu>
  // closes the scope.
  const menuBlockMatch = skillMdContent.match(/<menu\b[^>]*>([\s\S]*?)<\/menu>/);
  if (!menuBlockMatch) return [];
  const menuContent = menuBlockMatch[1];

  const codes = [];
  const pattern = new RegExp(V5_MENU_ITEM_PATTERN.source, V5_MENU_ITEM_PATTERN.flags);
  for (const match of menuContent.matchAll(pattern)) {
    codes.push(match[1]);
  }
  return codes;
}

/**
 * Parse v6.3+ SKILL.md content; return the array of menu codes (the `Code`
 * column values from the `## Capabilities` markdown table). Order preserved.
 *
 * Round 1 review patch P9: scopes the scan to content between the
 * `## Capabilities` heading and the next `## ` heading (or end of file).
 * Prevents matches on uppercase-coded tables elsewhere in the file (e.g.
 * status tables, OK/N/A tables in Dev Notes).
 *
 * Round 1 review patch P5: uses `matchAll` with a fresh RegExp per call;
 * no shared `lastIndex` state.
 *
 * @param {string} skillMdContent
 * @returns {string[]}
 */
function extractV63MenuCodes(skillMdContent) {
  if (typeof skillMdContent !== 'string') {
    throw new TypeError('extractV63MenuCodes: skillMdContent must be a string');
  }
  // Round 2 review patch R2-P4: strip fences before searching for the
  // ## Capabilities heading. Round 1 P9 anchored to the heading but
  // didn't strip fences first.
  const stripped = stripCodeRegions(skillMdContent);

  // Anchor to the ## Capabilities section: find the heading, then slice
  // forward to the next ## heading (or end of file). JS regex doesn't
  // support `\Z` end-of-string, so a two-step approach is used.
  const headingMatch = stripped.match(/^##\s+Capabilities\s*$/m);
  if (!headingMatch) return [];
  const startIdx = headingMatch.index + headingMatch[0].length;
  const remainder = stripped.slice(startIdx);
  const nextHeadingMatch = remainder.match(/^##\s/m);
  const sectionContent = nextHeadingMatch
    ? remainder.slice(0, nextHeadingMatch.index)
    : remainder;

  // Round 2 review patch R2-P3: skip the table header row by anchoring
  // to AFTER the markdown table separator line (line of pipes + dashes
  // like `|------|-------|------|`). Without this, a header like
  // `| ID | Description |` (uppercase 2-3 char first cell) would be
  // emitted as a phantom menu code. The convention `Code | Description |
  // Skill` (mixed-case) happens to not match the regex today, but the
  // robust fix is to start matching after the separator.
  const separatorMatch = sectionContent.match(/^\s*\|[\s|:-]+\|\s*$/m);
  const dataContent = separatorMatch
    ? sectionContent.slice(separatorMatch.index + separatorMatch[0].length)
    : sectionContent;

  const codes = [];
  const pattern = new RegExp(V63_CAPABILITY_ROW_PATTERN.source, V63_CAPABILITY_ROW_PATTERN.flags);
  for (const match of dataContent.matchAll(pattern)) {
    codes.push(match[1]);
  }
  return codes;
}

// ─── Internal helpers ───────────────────────────────────────────────

function arraysEqualUnordered(a, b) {
  if (a.length !== b.length) return false;
  // Round 1 review patch P11: clone before sort so caller's arrays are
  // not mutated.
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  for (let i = 0; i < sortedA.length; i += 1) {
    if (sortedA[i] !== sortedB[i]) return false;
  }
  return true;
}

/**
 * Strip fenced code blocks and inline code spans from markdown content
 * before format detection / extraction. Preserves line + column positions
 * via space-fill (Round 1 review patch P7 — empty-fill would corrupt
 * column offsets, breaking any future error reporting that uses
 * line:column from the stripped buffer).
 *
 * Also strips 4-space-indented code blocks (Round 1 review patch P8 —
 * markdown's classic indented-block syntax was previously unhandled).
 */
function stripCodeRegions(content) {
  // Strip fenced code blocks first (greedy-multi-line, both ``` and ~~~).
  const fenceRe = /```[\s\S]*?```|~~~[\s\S]*?~~~/g;
  const noFences = content.replace(fenceRe, (m) => m.replace(/[^\n]/g, ' '));
  // Strip inline code spans (single backtick, single line). Replace with
  // spaces to preserve column count.
  const inlineRe = /`[^`\n]*`/g;
  const noInline = noFences.replace(inlineRe, (m) => ' '.repeat(m.length));
  // Strip 4-space-indented blocks (lines beginning with 4 spaces or a
  // tab, after a blank line). Implementation: scan lines; if previous
  // line was blank and current line begins with 4-space indent, replace
  // current line content with spaces.
  const lines = noInline.split('\n');
  let prevBlank = true;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const isIndentedCode = (line.startsWith('    ') || line.startsWith('\t')) && line.trim().length > 0;
    if (prevBlank && isIndentedCode) {
      lines[i] = ' '.repeat(line.length);
      // Keep iterating consecutive indented lines as code.
      let j = i + 1;
      while (j < lines.length && (lines[j].startsWith('    ') || lines[j].startsWith('\t'))) {
        lines[j] = ' '.repeat(lines[j].length);
        j += 1;
      }
      i = j - 1; // Skip ahead.
      prevBlank = false;
    } else {
      prevBlank = line.trim().length === 0;
    }
  }
  return lines.join('\n');
}

module.exports = {
  runParityCheck,
  extractV5MenuCodes,
  extractV63MenuCodes,
};
