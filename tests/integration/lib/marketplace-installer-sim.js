#!/usr/bin/env node
'use strict';

/**
 * @module tests/integration/lib/marketplace-installer-sim
 *
 * Convoke-side simulator of BMAD's marketplace install END STATE for the
 * dual-distribution parity test (Story v63-3-4 / FR22).
 *
 * Replicates what BMAD's installer would produce for a Convoke marketplace
 * install — NOT the full installer choreography. Models only the file-
 * materialization step that affects user experience: SKILL.md content
 * landing in IDE-target dirs.
 *
 * Why simulator over real PluginResolver: BMAD does not ship a local CLI for
 * community-module install (Story v63-3-3 DEF-SPIKE 4). Convoke replicates
 * BMAD's documented contract via direct source-read at @HEAD 2026-04-25
 * (see Story v63-3-4 Decision 2 v2).
 *
 * **PARITY_EXCLUSIONS = BMAD filter ∪ {/node_modules/} defensive extension.**
 * BMAD's actual filter at `tools/installer/ide/_config-driven.js:171-178`
 * (verified @HEAD 2026-04-25) covers `.DS_Store`/`Thumbs.db`/`desktop.ini`
 * basenames + dot-prefix-except-`.gitkeep` + `~`/`.swp`/`.swo`/`.bak` suffixes.
 * Convoke adds `/node_modules/` as a defensive path-relative exclusion (per
 * R1-H1: when Convoke is npm-installed under `node_modules/convoke-agents`,
 * the absolute source path includes `/node_modules/` and would otherwise
 * filter out every file). The path-relative scoping ensures the exclusion
 * only fires when `node_modules/` appears INSIDE a skill dir — not when the
 * sourceRepo itself happens to live under `node_modules/`.
 *
 * Verified against `bmad-code-org/BMAD-METHOD@HEAD` 2026-04-25:
 *   - tools/installer/modules/plugin-resolver.js (Strategy 5 fallback for Convoke)
 *   - tools/installer/core/installer.js (line 91: _cleanupSkillDirs removes _bmad/<id>/)
 *   - tools/installer/core/manifest-generator.js (line 143: canonicalId = path.basename(skillDir))
 *   - tools/installer/ide/_config-driven.js (line 171-178: filter list mirrored above)
 */

const fs = require('fs-extra');
const path = require('path');

const PARITY_EXCLUSIONS = Object.freeze({
  basenames: new Set(['.ds_store', 'thumbs.db', 'desktop.ini']),
  exceptionBasenames: new Set(['.gitkeep']),
  suffixes: ['.bak', '~', '.swp', '.swo'],
  pathContains: ['/node_modules/']
});

const PARITY_HINTS = Object.freeze({
  'source-missing': "marketplace.json declares a path that doesn't exist in source repo — check Story 3.1's marketplace.json or skill-dir migration.",
  'npm-missing': "refreshInstallation didn't materialize SKILL.md — check AGENT_IDS registry coverage.",
  'marketplace-sim-missing': "marketplace simulator failed to copy SKILL.md — check simulator + filter list.",
  'byte-diff': "SKILL.md content differs from source — one path is mutating the file post-copy."
});

/**
 * Format a hint with concrete context. Substitutes the {id} token if present.
 * @param {string} key - PARITY_HINTS key
 * @param {string} id - canonicalId or skillRel for context
 * @returns {string}
 */
function formatHint(key, id) {
  const tmpl = PARITY_HINTS[key] || '';
  return id ? `${tmpl} (${id})` : tmpl;
}

/**
 * Derive canonicalId from a marketplace.json skills[] entry.
 * Mirrors BMAD's manifest-generator.js:143 rule (canonicalId = dirName).
 * @param {string} skillRel - e.g., "./_bmad/bme/_vortex/agents/contextualization-expert"
 * @returns {string} e.g., "contextualization-expert"
 */
function canonicalIdForSkillRel(skillRel) {
  return path.basename(skillRel.replace(/^\.\//, ''));
}

function isExcluded(filePath, sourceDir) {
  const base = path.basename(filePath).toLowerCase();
  if (!base) return false;
  if (PARITY_EXCLUSIONS.exceptionBasenames.has(base)) return false;
  if (PARITY_EXCLUSIONS.basenames.has(base)) return true;
  if (PARITY_EXCLUSIONS.suffixes.some(s => base.endsWith(s))) return true;
  if (base.startsWith('.')) return true;
  // R1-H1: scope pathContains to source-relative path so the exclusion
  // doesn't fire when sourceRepo itself lives under /node_modules/.
  // When sourceDir is provided, compute relative path; otherwise check
  // the absolute path (legacy behavior; tests pass sourceDir).
  const probe = sourceDir ? path.relative(sourceDir, filePath) : filePath;
  if (PARITY_EXCLUSIONS.pathContains.some(p => probe.includes(p))) return true;
  return false;
}

/**
 * Simulate BMAD's marketplace install END STATE into destRoot.
 *
 * Reads <sourceRepo>/.claude-plugin/marketplace.json, then for each path in
 * plugins[*].skills[]:
 *   - Resolve to absolute source dir + verify existence (R1-M4).
 *   - canonicalId = path.basename(skillRel) (matches BMAD's manifest-generator
 *     rule that the skill-dir name becomes the destination dir name).
 *   - Reset destDir before copy (R1-M10 — mirrors BMAD's _cleanupSkillDirs
 *     END STATE; without this, pre-existing orphans survive).
 *   - Copy sourceDir → <destRoot>/.claude/skills/<canonicalId>/ with the
 *     PARITY_EXCLUSIONS filter (mirrors BMAD's installVerbatimSkills filter,
 *     applied to source-relative paths per R1-H1).
 *
 * Validates every plugin's skills array (not just plugins[0]) per R1-M12.
 *
 * Does NOT model the synthesized module-help.csv, the npm install on the
 * cloned repo, or BMAD's manifest-generator intermediate sidecars — those
 * are implementation details that don't affect SKILL.md content (the only
 * thing in scope per Decision 1 v2).
 *
 * @param {string} destRoot - Destination tmpdir
 * @param {object} opts - { sourceRepo: string }
 * @throws {Error} on malformed marketplace.json (missing/empty plugins[0].skills,
 *   non-array skills field on any plugin), or missing source skill dir.
 */
async function marketplaceInstall(destRoot, { sourceRepo }) {
  const manifestPath = path.join(sourceRepo, '.claude-plugin/marketplace.json');
  const raw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);

  if (!manifest.plugins?.[0]?.skills?.length) {
    throw new Error('marketplace.json regression: plugins[0].skills missing or empty');
  }

  // R1-M12: validate every plugin's skills array, not just plugins[0]
  for (let i = 0; i < manifest.plugins.length; i++) {
    const p = manifest.plugins[i];
    if (p.skills !== undefined && !Array.isArray(p.skills)) {
      throw new Error(`marketplace.json regression: plugins[${i}].skills is not an array`);
    }
  }

  const ideSkillsDir = path.join(destRoot, '.claude/skills');

  for (const plugin of manifest.plugins) {
    if (!plugin.skills) continue;
    for (const skillRel of plugin.skills) {
      const cleanRel = skillRel.replace(/^\.\//, '');
      const sourceDir = path.join(sourceRepo, cleanRel);
      const canonicalId = path.basename(cleanRel);
      const destDir = path.join(ideSkillsDir, canonicalId);

      // R1-M4: verify sourceDir exists; surface a useful error not opaque ENOENT
      if (!(await fs.pathExists(sourceDir))) {
        throw new Error(formatHint('source-missing', `skillRel: ${cleanRel}`));
      }

      // R1-M10: mirror BMAD's _cleanupSkillDirs END STATE — reset before copy
      await fs.remove(destDir);

      await fs.copy(sourceDir, destDir, {
        overwrite: true,
        filter: (src) => src === sourceDir || !isExcluded(src, sourceDir)
      });
    }
  }
}

module.exports = Object.freeze({
  marketplaceInstall,
  PARITY_EXCLUSIONS,
  PARITY_HINTS,
  formatHint,
  canonicalIdForSkillRel,
  isExcluded
});
