'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

const path = require('path');
const { execFileSync } = require('child_process');
const { findProjectRoot } = require('../../scripts/update/lib/utils');
const { readManifest } = require('../../scripts/portability/manifest-csv');

// Story sp-1-2: Classify All Skills
//
// Validates that every skill in skill-manifest.csv has been classified with
// non-empty tier and intent values, and that spot-check classifications match
// the locked policy from sp-1-2's Dev Notes.

const VALID_TIERS = ['standalone', 'light-deps', 'pipeline'];
const VALID_INTENTS = [
  'think-through-problem',
  'define-what-to-build',
  'review-something',
  'write-documentation',
  'plan-your-work',
  'test-your-code',
  'discover-product-fit',
  'assess-readiness',
  'meta-platform',
];

// Canonical meta-platform skills (AC #7, adjusted during sp-1-2 implementation).
//
// AC #7 originally listed 6 skills including `bmad-agent-bme-team-factory`,
// but that name lives in the AGENT manifest, not the skill manifest.
//
// This roster is a set of CANDIDATES, not an assertion that all of them exist —
// see `presentIn()` below. Upstream churns this set: v6.3 retired `bmad-init`,
// v6.10 renamed `bmad-builder-setup` -> `bmad-bmb-setup`. Both names are kept
// here so the test keeps covering whichever the installed tree actually has.
const META_PLATFORM_SKILLS = [
  'bmad-init', // retired upstream in v6.3 — kept for older trees
  'bmad-help',
  'bmad-party-mode',
  'bmad-builder-setup', // renamed upstream in v6.10 ->
  'bmad-bmb-setup', //     ... this
  'bmad-agent-builder',
];

describe('Skill manifest classification (sp-1-2)', () => {
  let header;
  let rows;
  let nameIdx;
  let tierIdx;
  let intentIdx;
  let depsIdx;

  let trackedSkillDirs = [];

  before(() => {
    const projectRoot = findProjectRoot();
    // Directories of every tracked skill, used to distinguish "upstream retired it"
    // from "the manifest row went missing". Round 2.
    trackedSkillDirs = execFileSync('git', ['ls-files'], { cwd: projectRoot, encoding: 'utf8' })
      .split('\n')
      .filter((f) => f.endsWith('/SKILL.md'))
      .map((f) => path.dirname(f));
    const manifestPath = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv');
    const manifest = readManifest(manifestPath);
    header = manifest.header;
    rows = manifest.rows;
    nameIdx = header.indexOf('name');
    tierIdx = header.indexOf('tier');
    intentIdx = header.indexOf('intent');
    depsIdx = header.indexOf('dependencies');
  });

  // Helper: find a row by canonical name
  const findRow = (name) => rows.find((r) => r[nameIdx] === name);

  // Helper: narrow a candidate roster to the skills the manifest actually has.
  //
  // Why this exists (project-context.md `derive-counts-from-source`): the spot-check
  // rosters below name upstream-owned skills, and upstream retires, renames, and
  // relocates them without notice — v6.3 retired `bmad-init`, v6.10 renamed
  // `bmad-builder-setup`, and the BMM agent consolidation retired `bmad-agent-sm`,
  // `bmad-agent-qa`, and `bmad-agent-quick-flow-solo-dev`. Asserting that a hardcoded
  // roster is present makes a legitimate upstream retirement look like a Convoke
  // regression, which is exactly what happened after the 2026-06-27 BMAD update.
  //
  // So: assert the CLASSIFICATION POLICY on the skills that exist, not the existence
  // of a roster we do not own.
  //
  // `expectedAbsent` pins WHICH roster members are allowed to be missing. Without it a
  // `found.length > 0` check degrades an N-of-N assertion to 1-of-N: 8 of 9 persona
  // agents could vanish and the test would still pass on the survivor, silently
  // asserting policy on one row. That makes roster decay undetectable — the very thing
  // this helper's comment argues against. Code review 2026-08-10.
  const presentIn = (names, expectedAbsent = []) => {
    // A name may only be excused if the skill is genuinely GONE — not merely missing
    // from the manifest. Round 2 caught `bmad-distillator` listed as an upstream
    // retirement while 7 of its files were still tracked (including SKILL.md, and the
    // only Python test CI runs). That turned a real manifest gap into a permanent,
    // test-enforced exemption — relocating the decay-blindness rather than removing it.
    const stillOnDisk = expectedAbsent.filter(
      (n) => trackedSkillDirs.some((d) => d.endsWith(`/${n}`))
    );
    assert.deepEqual(
      stillOnDisk,
      [],
      `${stillOnDisk.join(', ')} is listed as retired upstream, but its files are still tracked in git. ` +
        `That is a MANIFEST GAP (skill exists, row missing), not a retirement — add the row to ` +
        `skill-manifest.csv instead of excusing it here.`
    );

    const absent = names.filter((n) => findRow(n) === undefined);
    const unexpected = absent.filter((n) => !expectedAbsent.includes(n));
    assert.deepEqual(
      unexpected,
      [],
      `roster decay: ${unexpected.join(', ')} disappeared from skill-manifest.csv without being declared ` +
        `as a known upstream retirement. Either the row was wrongly deleted, or add it to this test's ` +
        `expectedAbsent list in the same commit that observes the retirement.`
    );
    const reappeared = expectedAbsent.filter((n) => findRow(n) !== undefined);
    assert.deepEqual(
      reappeared,
      [],
      `${reappeared.join(', ')} is listed as retired upstream but is present again — remove it from expectedAbsent.`
    );
    const found = names.filter((n) => findRow(n) !== undefined);
    assert.ok(found.length > 0, `entire roster [${names.join(', ')}] is absent`);
    return found;
  };

  // Known upstream retirements. Each entry is a claim that a specific skill is gone by
  // upstream's choice — not that the roster may shrink arbitrarily.
  const RETIRED = {
    metaPlatform: ['bmad-init', 'bmad-builder-setup'],
    personaAgents: ['bmad-agent-sm', 'bmad-agent-quick-flow-solo-dev', 'bmad-agent-qa'],
  };

  it('Test 1: every data row has non-empty tier and non-empty intent', () => {
    assert.ok(rows.length > 0);
    const unclassified = [];
    for (const row of rows) {
      const name = row[nameIdx];
      const tier = row[tierIdx];
      const intent = row[intentIdx];
      if (!tier || !intent) {
        unclassified.push({ name, tier, intent });
      }
    }
    if (unclassified.length > 0) {
      console.error('Unclassified skills:', unclassified);
    }
    assert.deepEqual(unclassified, []);
  });

  it('Test 1b: every tier value is canonical, every intent value is canonical', () => {
    for (const row of rows) {
      const name = row[nameIdx];
      const tier = row[tierIdx];
      const intent = row[intentIdx];
      assert.ok(VALID_TIERS.includes(tier));
      assert.ok(VALID_INTENTS.includes(intent));
      // Sanity message on failure
      if (!VALID_TIERS.includes(tier)) {
        throw new Error(`${name}: invalid tier "${tier}"`);
      }
      if (!VALID_INTENTS.includes(intent)) {
        throw new Error(`${name}: invalid intent "${intent}"`);
      }
    }
  });

  it('Test 2: CIS agent skills classified as standalone + think-through-problem', () => {
    const cisSamples = [
      'bmad-brainstorming',
      'bmad-cis-agent-storyteller',
      'bmad-cis-agent-creative-problem-solver',
    ];
    for (const name of cisSamples) {
      const row = findRow(name);
      assert.notStrictEqual(row, undefined);
      // Storyteller has a sidecar memory file → light-deps. Others should be standalone.
      // The point of this spot-check is intent, not tier.
      assert.equal(row[intentIdx], 'think-through-problem');
    }
    // Brainstorming and creative-problem-solver are standalone
    assert.equal(findRow('bmad-brainstorming')[tierIdx], 'standalone');
    assert.equal(findRow('bmad-cis-agent-creative-problem-solver')[tierIdx], 'standalone');
  });

  it('Test 3: at least 3 testarch skills classified with intent=test-your-code', () => {
    const testarchRows = rows.filter((r) => r[nameIdx].startsWith('bmad-testarch-'));
    assert.ok(testarchRows.length >= 3);
    for (const row of testarchRows) {
      assert.equal(row[intentIdx], 'test-your-code');
    }
  });

  it('Test 4: every canonical meta-platform skill present is pipeline + meta-platform', () => {
    for (const name of presentIn(META_PLATFORM_SKILLS, RETIRED.metaPlatform)) {
      const row = findRow(name);
      assert.equal(row[tierIdx], 'pipeline', `${name} tier`);
      assert.equal(row[intentIdx], 'meta-platform', `${name} intent`);
    }
  });

  it('Test 5: standalone utilities are NOT classified as meta-platform', () => {
    // Per AC #7, these are explicitly carved out from meta-platform
    const standaloneUtilities = {
      'bmad-distillator': 'write-documentation',
      'bmad-advanced-elicitation': 'think-through-problem',
      'bmad-shard-doc': 'write-documentation',
      'bmad-index-docs': 'write-documentation',
    };
    for (const name of presentIn(Object.keys(standaloneUtilities))) {
      const expectedIntent = standaloneUtilities[name];
      const row = findRow(name);
      assert.equal(row[intentIdx], expectedIntent, `${name} intent`);
      assert.notStrictEqual(row[intentIdx], 'meta-platform');
      assert.equal(row[tierIdx], 'standalone', `${name} tier`);
    }
  });

  it('Test 6: persona-only bmad-agent-* skills are standalone with empty deps', () => {
    // Per sp-1-2 Task 3 enumerated table — these are menu wrappers, not pipelines.
    // Their dependencies column should be empty (menu options are not exporter deps).
    //
    // Candidates, not a required set (see `presentIn`). The BMM agent consolidation
    // retired sm / qa / quick-flow-solo-dev into Amelia (`bmad-agent-dev`); they are
    // kept here so the policy still gets checked on trees that predate that change.
    const personaAgents = [
      'bmad-agent-analyst',
      'bmad-agent-pm',
      'bmad-agent-architect',
      'bmad-agent-ux-designer',
      'bmad-agent-tech-writer',
      'bmad-agent-dev',
      'bmad-agent-sm', // retired upstream — consolidated into Amelia
      'bmad-agent-quick-flow-solo-dev', // retired upstream — consolidated into Amelia
      'bmad-agent-qa', // retired upstream — consolidated into Amelia
    ];
    for (const name of presentIn(personaAgents, RETIRED.personaAgents)) {
      const row = findRow(name);
      assert.equal(row[tierIdx], 'standalone', `${name} tier`);
      assert.equal(row[depsIdx], '', `${name} deps`);
    }
  });
});
