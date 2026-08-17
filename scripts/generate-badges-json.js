#!/usr/bin/env node
/**
 * Regenerates docs/badges.json from config.yaml files + skill-manifest.csv.
 * Aggregate counts for the README header shields (teams / agents / workflows / skills).
 *
 * Run manually: npm run badges
 * Also runs from `prepublishOnly` via `badges:check` (package.json), which gates `npm publish`.
 *
 * Source of truth:
 * - teams: hardcoded set of domain multi-agent modules (Vortex, Gyre).
 * - agents/workflows: sum across bme submodule config.yaml files (each has agents: + workflows: lists).
 * - skills: line count of _bmad/_config/skill-manifest.csv minus the header.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const repoRoot = path.resolve(__dirname, '..');

// Domain multi-agent teams. Update here if Forge / Helm / BMM / etc. ship as full teams.
const DOMAIN_TEAMS = ['_vortex', '_gyre'];

// Submodules whose config.yaml contributes to the aggregate agent/workflow counts.
const AGGREGATE_MODULES = ['_vortex', '_gyre', '_team-factory', '_artifacts', '_enhance'];

function readYaml(relPath) {
  const abs = path.join(repoRoot, relPath);
  if (!fs.existsSync(abs)) return null;
  return yaml.parse(fs.readFileSync(abs, 'utf8'));
}

// Absence is an error, not a zero. Previously a missing config was skipped and a missing
// key counted as 0, so deleting `_vortex/config.yaml` produced `agents: 5` and exited 0 —
// and `.github/workflows/badges.yml` then auto-committed that collapse to main with the
// job green. Since the `generated` date was removed this file only moves on a count change,
// so a silent collapse is now the ONLY thing that moves it. Fail loudly instead.
// (Same class the python-test job already guards against with a discovery floor.)
function countList(obj, key, moduleName) {
  const v = obj && obj[key];
  // An ABSENT key is legitimate — `_artifacts` and `_enhance` are workflow-only modules and
  // carry no `agents:`. A key that exists but is not a list is schema drift, and silently
  // counting it as 0 is how a shape change becomes a wrong number nobody notices.
  if (v === undefined) return 0;
  if (!Array.isArray(v)) {
    throw new Error(`_bmad/bme/${moduleName}/config.yaml: \`${key}\` is ${typeof v}, expected a list`);
  }
  return v.length;
}

let agents = 0;
let workflows = 0;
for (const m of AGGREGATE_MODULES) {
  const cfg = readYaml(`_bmad/bme/${m}/config.yaml`);
  if (!cfg) throw new Error(`missing required config: _bmad/bme/${m}/config.yaml`);
  agents += countList(cfg, 'agents', m);
  workflows += countList(cfg, 'workflows', m);
}

const manifestPath = path.join(repoRoot, '_bmad/_config/skill-manifest.csv');
const manifestLines = fs
  .readFileSync(manifestPath, 'utf8')
  .split('\n')
  .filter((l) => l.trim().length > 0);
if (manifestLines.length < 2) {
  throw new Error(`_bmad/_config/skill-manifest.csv has no rows (header only or empty) — refusing to write a negative skill count`);
}
const skills = manifestLines.length - 1; // minus header row

// No `generated` timestamp. The file is compared with `git diff --exit-code` by both
// `badges:check` (which gates `npm publish` via prepublishOnly) and `.github/workflows/badges.yml`.
// A date field makes those comparisons fire on a calendar roll rather than on a real change: it
// aborted the 4.0.0 release publish a day after the badges were last committed, and forced a
// no-op commit before every prior release candidate. Counts are the payload; nothing reads the
// date. Backlog T39.
const out = {
  teams: DOMAIN_TEAMS.length,
  agents,
  workflows,
  skills,
};

const outDir = path.join(repoRoot, 'docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'badges.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');

console.log(`Wrote ${path.relative(repoRoot, outPath)}`);
console.log(JSON.stringify(out, null, 2));
