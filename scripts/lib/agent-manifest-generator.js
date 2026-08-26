/**
 * Agent manifest generation for Convoke.
 *
 * Regenerates the `bme` rows of `_bmad/_config/agent-manifest.csv` from the agent
 * registry while preserving every row belonging to another module. Extracted from
 * `refresh-installation.js` (story gen-1.1) so that generation has ONE deliberate
 * caller — `scripts/generate-manifest.js` — instead of firing as a side effect of
 * every `refreshInstallation()` call, including the ones the test suite makes.
 *
 * Consumed by: scripts/generate-manifest.js, scripts/update/lib/refresh-installation.js
 *
 * Generation is a function of the TARGET TREE's state, not of the registry alone.
 * Four target-tree dependencies must survive any future refactor of this file
 * (story gen-1.1 AC3):
 *   1. schema detection from the existing header (`isV610`)
 *   2. non-bme row preservation (`preservedRows`)
 *   3. Vortex `excluded_agents`
 *   4. Gyre `excluded_agents`
 * (3) and (4) are invisible to a byte-identity check run in this repo, because both
 * repo configs are `excluded_agents: []`. They are covered by the non-empty fixtures
 * in tests/unit/refresh-installation-exclusions.test.js.
 *
 * @module agent-manifest-generator
 */

const fs = require('fs-extra');
const path = require('path');
const configMerger = require('../update/lib/config-merger');
const {
  AGENTS,
  GYRE_AGENTS,
  EXTRA_BME_AGENTS,
} = require('../update/lib/agent-registry');

/** v6.1.0 manifest header: 12 columns, module at index 9. */
const V610_HEADER =
  'name,displayName,title,icon,capabilities,role,identity,communicationStyle,principles,module,path,canonicalId';

/**
 * Is this header the v6.1.0 schema (12 columns, module at index 9)?
 *
 * **Deliberately a two-state question, after a three-state version was reviewed and
 * rejected.** Round 3 (2026-08-26) found that classifying an unrecognised header as
 * `unusable` and regenerating from scratch DELETED every upstream row: measured, a
 * manifest whose header line had been dropped went from 53 rows (18 bmm, 12 cis, 4
 * wds, 3 bmb, 2 tea, 2 core, 12 bme) to 12, while the function still returned
 * "other modules preserved" and `validateManifest` still reported pass. That is
 * strictly worse than the duplication it was fixing — degraded data became deleted
 * data — so the classifier is reverted rather than patched a fourth time.
 *
 * It also found that the `legacy` limb was invented: it was derived from this file's
 * own `buildAgentRowLegacy` field list, and matches NONE of the three headers that
 * have ever existed in this repository's history (62 manifest blobs across 21
 * commits). The real legacy header would have been salvaged away — a working file
 * renamed out from under the user.
 *
 * The correct fix is to classify by PARSE and required-column presence, the way
 * `refresh-installation.js:518-522` does for skill-manifest.csv, and to carry
 * preserved rows through the recovery path. That is a design change, not a predicate
 * tweak, and it is filed as **T75** rather than attempted here — `code-review-convergence`
 * caps at three rounds and forbids a fourth.
 *
 * @param {string} header
 * @returns {boolean}
 */
function isV610Header(header) {
  return header.startsWith('name,') || header.includes('canonicalId');
}

/** The string `refreshInstallation` pushes onto its `changes` array, returned so the
 *  caller can keep reporting the same message it always did. */
const CHANGE_MESSAGE =
  'Regenerated agent-manifest.csv (bme rows updated, other modules preserved)';

/** Pushed instead of CHANGE_MESSAGE when `refreshInstallation` is refreshing the
 *  package into itself. Names the replacement path so a dev tree is never left
 *  wondering why the manifest did not move. */
const SKIP_MESSAGE =
  'Skipped agent-manifest.csv regeneration (dev environment — run `npm run generate:manifest`)';

/**
 * Quote a value for the manifest, collapsing any embedded newline to a space.
 *
 * The newline collapse is not cosmetic. Every reader of this file — including this
 * module's own preservation filter — is line-oriented: it splits on `\n` and decides
 * per line whether the row is `bme`. A registry persona field containing a newline
 * would write one record across two physical lines, neither of which parses as `bme`,
 * so BOTH halves would be preserved as foreign rows on the next run AND a fresh copy
 * appended — one extra duplicate per invocation, without bound. Since
 * `npm run generate:manifest` is documented as the thing you re-run after editing the
 * registry, that loop is the normal workflow, not an edge case.
 *
 * Stripping rather than throwing: this also runs during a consumer's install, where a
 * hard failure would block an update over data the consumer cannot edit.
 *
 * No current registry entry contains a newline (all 12 checked, 2026-08-26); this is a
 * guard against the next one. Found by Round 1's edge-case layer.
 */
function csvEscape(value) {
  return `"${String(value).replace(/\r?\n/g, ' ').replace(/"/g, '""')}"`;
}

function parseCSVRow(row) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (inQuotes) {
      if (ch === '"' && row[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// Story v63-3-1: path shape depends on submodule. Vortex migrated to the skill-dir
// convention (`<id>/SKILL.md`); Gyre and EXTRA_BME stay flat (`<id>.md`) per
// Decision 2. Single helper to avoid drift.
function agentManifestPath(submodule, agentId) {
  const leaf = submodule === '_vortex' ? `${agentId}/SKILL.md` : `${agentId}.md`;
  return `_bmad/bme/${submodule}/agents/${leaf}`;
}

function buildAgentRow610(a, submodule) {
  const p = a.persona;
  return [
    csvEscape(a.name), // name
    csvEscape(''), // displayName
    csvEscape(a.title), // title
    csvEscape(a.icon), // icon
    csvEscape(''), // capabilities
    csvEscape(p.role), // role
    csvEscape(p.identity), // identity
    csvEscape(p.communication_style), // communicationStyle
    csvEscape(p.expertise), // principles
    csvEscape('bme'), // module
    csvEscape(agentManifestPath(submodule, a.id)), // path
    csvEscape(`bmad-agent-bme-${a.id}`), // canonicalId
  ].join(',');
}

function buildAgentRowLegacy(a, submodule) {
  const p = a.persona;
  return [
    a.id, a.name, a.title, a.icon,
    p.role, p.identity, p.communication_style, p.expertise,
    'bme', agentManifestPath(submodule, a.id),
  ].map(csvEscape).join(',');
}

// Row builders for standalone bme agents (e.g. team-factory) — the submodule path
// differs from the team agents', so the `submodule` comes off the agent itself.
function buildExtraBmeAgentRow610(a) {
  const p = a.persona;
  return [
    csvEscape(a.name),
    csvEscape(''),
    csvEscape(a.title),
    csvEscape(a.icon),
    csvEscape(''),
    csvEscape(p.role),
    csvEscape(p.identity),
    csvEscape(p.communication_style),
    csvEscape(p.expertise),
    csvEscape('bme'),
    csvEscape(agentManifestPath(a.submodule, a.id)),
    csvEscape(`bmad-agent-bme-${a.id}`),
  ].join(',');
}

function buildExtraBmeAgentRowLegacy(a) {
  const p = a.persona;
  return [
    a.id, a.name, a.title, a.icon,
    p.role, p.identity, p.communication_style, p.expertise,
    'bme', agentManifestPath(a.submodule, a.id),
  ].map(csvEscape).join(',');
}

/**
 * Read the per-module `excluded_agents` opt-out lists from the TARGET tree.
 *
 * @param {string} projectRoot - Absolute path to the target project root
 * @returns {{vortex: string[], gyre: string[]}}
 */
function readExclusions(projectRoot) {
  return {
    vortex: configMerger.readExcludedAgents(
      path.join(projectRoot, '_bmad', 'bme', '_vortex', 'config.yaml')
    ),
    gyre: configMerger.readExcludedAgents(
      path.join(projectRoot, '_bmad', 'bme', '_gyre', 'config.yaml')
    ),
  };
}

/**
 * Regenerate `<projectRoot>/_bmad/_config/agent-manifest.csv`.
 *
 * Replaces only the rows whose module/submodule column is `bme`; every other row in
 * the existing file is preserved verbatim, and the existing header is kept so the
 * file's schema never changes underneath a consumer.
 *
 * @param {string} projectRoot - Absolute path to the target project root
 * @param {object} [options]
 * @param {{AGENTS: object[], GYRE_AGENTS: object[], EXTRA_BME_AGENTS: object[]}} [options.registry]
 *        Injectable registry. Defaults to the real one. Injecting is how a test proves
 *        a registry change propagates without mutating the shared module.
 * @param {{vortex: string[], gyre: string[]}} [options.excluded]
 *        Pre-read exclusion lists. Read from the target tree when omitted — callers
 *        that already read them (refreshInstallation) pass theirs to avoid a re-read.
 * @returns {Promise<string>} The change message, for the caller's `changes` array.
 */
async function generateAgentManifest(projectRoot, options = {}) {
  const {
    registry = { AGENTS, GYRE_AGENTS, EXTRA_BME_AGENTS },
    excluded,
  } = options;

  const exclusions = excluded || readExclusions(projectRoot);

  const manifestPath = path.join(projectRoot, '_bmad', '_config', 'agent-manifest.csv');
  await fs.ensureDir(path.dirname(manifestPath));

  // AC3(1) + AC3(2): detect the schema from the existing manifest and preserve
  // every row that is not ours. A tree with no manifest yet defaults to v6.1.0.
  let header;
  let isV610 = true;
  let preservedRows = [];

  // The Round 1 fix, kept: `fs.existsSync` is true for a 0-byte file and a
  // whitespace-only manifest trims to one empty line, so the naive read yields
  // `header = ''`, which fails the v6.1.0 test and silently selects the LEGACY
  // branch — writing a blank header above 10-column rows, after which `readManifest`
  // promotes the first agent row to be the header and an agent disappears.
  //
  // Treating an EMPTY file as absent is safe by construction: there is no data to
  // lose. Extending the same treatment to a non-empty corrupt file is NOT safe, and
  // doing so was Round 3's HIGH — see `isV610Header` and T75.
  const existingRaw = fs.existsSync(manifestPath)
    ? (await fs.readFile(manifestPath, 'utf8')).trim()
    : '';

  if (existingRaw !== '') {
    const existing = existingRaw.split('\n');
    header = existing[0];
    isV610 = isV610Header(header);

    preservedRows = existing.slice(1).filter(row => {
      if (!row.trim()) return false;
      if (isV610) {
        // v6.1.0: module is column 10 (index 9) — handle quoted CSV fields
        const parsed = parseCSVRow(row);
        if (!parsed || parsed.length < 10) return true;
        return parsed[9] !== 'bme';
      } else {
        // Legacy: submodule is column 9 (index 8) — quoted CSV
        const fields = row.match(/"([^"]*(?:""[^"]*)*)"/g);
        if (!fields || fields.length < 9) return true;
        const submodule = fields[8].replace(/^"|"$/g, '');
        return submodule !== 'bme';
      }
    });
  } else {
    header = V610_HEADER;
    isV610 = true;
  }

  // AC3(3) + AC3(4) — U8: filter out excluded agents so manifest rows don't point at
  // wrappers the stale-cleanup loop just removed. Left in, rows become dangling
  // pointers.
  // Defensive per-key defaults. `configMerger.readExcludedAgents` is written never to
  // throw so a bad config cannot break the install flow; folding two independent
  // locals into one options object must not undo that discipline one level up.
  const vortexExcluded = exclusions.vortex || [];
  const gyreExcluded = exclusions.gyre || [];
  const activeVortexAgents = (registry.AGENTS || []).filter(a => !vortexExcluded.includes(a.id));
  const activeGyreAgents = (registry.GYRE_AGENTS || []).filter(a => !gyreExcluded.includes(a.id));

  const bmeRows = isV610
    ? [
        ...activeVortexAgents.map(a => buildAgentRow610(a, '_vortex')),
        ...activeGyreAgents.map(a => buildAgentRow610(a, '_gyre')),
        ...(registry.EXTRA_BME_AGENTS || []).map(buildExtraBmeAgentRow610),
      ]
    : [
        ...activeVortexAgents.map(a => buildAgentRowLegacy(a, '_vortex')),
        ...activeGyreAgents.map(a => buildAgentRowLegacy(a, '_gyre')),
        ...(registry.EXTRA_BME_AGENTS || []).map(buildExtraBmeAgentRowLegacy),
      ];

  const allRows = [...preservedRows, ...bmeRows].join('\n') + '\n';
  await fs.writeFile(manifestPath, header + '\n' + allRows, 'utf8');

  return CHANGE_MESSAGE;
}

module.exports = {
  generateAgentManifest,
  isV610Header,
  parseCSVRow,
  readExclusions,
  CHANGE_MESSAGE,
  SKIP_MESSAGE,
  V610_HEADER,
};
