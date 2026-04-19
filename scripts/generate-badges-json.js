#!/usr/bin/env node
/**
 * Regenerates docs/badges.json from config.yaml files + skill-manifest.csv.
 * Aggregate counts for the README header shields (teams / agents / workflows / skills).
 *
 * Run manually: npm run badges
 * Or before publishing (a future prepublishOnly hook can wire this in).
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

function countList(obj, key) {
  const v = obj && obj[key];
  return Array.isArray(v) ? v.length : 0;
}

let agents = 0;
let workflows = 0;
for (const m of AGGREGATE_MODULES) {
  const cfg = readYaml(`_bmad/bme/${m}/config.yaml`);
  if (!cfg) continue;
  agents += countList(cfg, 'agents');
  workflows += countList(cfg, 'workflows');
}

const manifestPath = path.join(repoRoot, '_bmad/_config/skill-manifest.csv');
const manifestLines = fs
  .readFileSync(manifestPath, 'utf8')
  .split('\n')
  .filter((l) => l.trim().length > 0);
const skills = manifestLines.length - 1; // minus header row

const out = {
  teams: DOMAIN_TEAMS.length,
  agents,
  workflows,
  skills,
  generated: new Date().toISOString().slice(0, 10),
};

const outDir = path.join(repoRoot, 'docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'badges.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');

console.log(`Wrote ${path.relative(repoRoot, outPath)}`);
console.log(JSON.stringify(out, null, 2));
