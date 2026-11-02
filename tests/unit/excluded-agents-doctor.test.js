'use strict';

/**
 * T249 — `convoke-doctor` must REPORT an `excluded_agents` value that will not do what the operator
 * wrote it to do.
 *
 * Doctor already parsed the field through the authority and threw the verdict away. Measured on a
 * tarball install before this change: a bare scalar, a list holding a number, and a mistyped id
 * each produced ZERO lines mentioning the field, with exit 0. The install path warns, but install
 * output scrolls past; doctor is where an operator looks when an agent they opted out is still
 * there.
 *
 * The anti-drift property is asserted here too: the finding's text must BE the authority's message,
 * not a paraphrase of it. Two sentences about one defect is how a fix and the report of it diverge.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { checkExcludedAgents } = require('../../scripts/convoke-doctor');
const {
  malformedExclusionMessage,
  unknownExclusionMessage,
  parseExcludedAgents,
  MODULE_PROFILES,
} = require('../../scripts/update/lib/config-merger');
const { GYRE_AGENT_IDS } = require('../../scripts/update/lib/agent-registry');

/** A discovered-module shape, as `discoverModules` produces it. */
function mod(name, excluded, agents) {
  const config = { submodule_name: name, module: 'bme' };
  if (excluded !== undefined) config.excluded_agents = excluded;
  // `agents` is third and optional because almost every case here is about `excluded_agents`
  // alone — but review found that NO fixture anywhere set it, so doctor's `mod.config.agents`
  // argument was inert and deleting it survived the whole suite.
  if (agents !== undefined) config.agents = agents;
  // A root that cannot exist: since T266 the check looks for installed skill wrappers under it.
  return { name, dir: path.join('/nonexistent-convoke-t266/proj/_bmad/bme', name), config };
}

describe('T249 — doctor reports a wrong excluded_agents value', () => {
  it('fixture: the ids below really are and are not Gyre agents', () => {
    // Derived, so the cases cannot silently stop testing what they claim.
    assert.ok(GYRE_AGENT_IDS.includes('review-coach'));
    assert.ok(!GYRE_AGENT_IDS.includes('reviewcoach'));
    assert.ok(MODULE_PROFILES._vortex.agentIds.includes('contextualization-expert'));
    assert.ok(!GYRE_AGENT_IDS.includes('contextualization-expert'));
  });

  it('says nothing when the field is absent', () => {
    assert.deepEqual(checkExcludedAgents(mod('_gyre', undefined)), []);
  });

  it('says nothing when the field is a valid, resolving list', () => {
    assert.deepEqual(checkExcludedAgents(mod('_gyre', ['review-coach'])), []);
    assert.deepEqual(checkExcludedAgents(mod('_gyre', [])), []);
  });

  for (const [label, value] of [
    ['a bare scalar', 'review-coach'],
    ['a mapping', { 'review-coach': true }],
    ['a list holding a number', ['review-coach', 42]],
  ]) {
    it(`reports a MALFORMED value: ${label}`, () => {
      const [finding, ...extra] = checkExcludedAgents(mod('_gyre', value));
      assert.ok(finding, `${label} must produce a finding`);
      assert.deepEqual(extra, [], 'exactly one finding per module — two rows about one field is noise');
      assert.equal(finding.name, '_gyre excluded_agents');
      assert.equal(finding.passed, false);
      assert.equal(finding.softWarning, true, 'a wrong opt-out does not make the install broken');
      assert.match(finding.fix, /must be a YAML list of agent ids/, 'the required shape has to be named');
      assert.match(finding.fix, /_gyre\/config\.yaml/, 'and the file');
      // The one-liner the operator reads FIRST was asserted by nothing, so swapping the two
      // sentences — telling someone with a bare scalar that they named a missing agent — survived
      // the whole suite. It is the line `printResults` shows under the finding's name.
      assert.match(finding.warning, /not a list of agent ids/,
        'the summary line must describe the MALFORMED class, not the unknown-id one');
    });
  }

  it('reports an UNKNOWN but conforming id, naming it and the valid ids', () => {
    const [finding, ...extra] = checkExcludedAgents(mod('_gyre', ['reviewcoach']));
    assert.ok(finding);
    assert.deepEqual(extra, []);
    assert.equal(finding.softWarning, true);
    assert.match(finding.warning, /does not know about/,
      'and the unknown-id class must get ITS summary line, not the malformed one');
    // The headline must not re-assert what the body stopped asserting. Review found the `fix` body
    // softened while this line still read "does not have ... so that entry did nothing", printed
    // directly above it — and the assertion added in the same commit was pinning that in place.
    assert.doesNotMatch(finding.warning, /did nothing|does not have/,
      'the headline must not re-assert the claims the ruling retracted');
    assert.match(finding.fix, /"reviewcoach"/);
    for (const id of GYRE_AGENT_IDS) {
      assert.ok(finding.fix.includes(id), `the valid id ${id} must be offered`);
    }
  });

  it('names the owning module for a cross-module id', () => {
    const [finding] = checkExcludedAgents(mod('_gyre', ['contextualization-expert']));
    assert.ok(finding);
    assert.match(finding.fix, /_vortex/, 'the likeliest cause is a copied config, so say whose agent it is');
  });

  it('reports the MALFORMED class only, when a value is both malformed and holds an unknown id', () => {
    // `['reviewcoach', 42]` is both. The shape is the prior defect — fixing it is what lets the
    // operator see the second one — so exactly one finding is emitted, about the shape.
    const found = checkExcludedAgents(mod('_gyre', ['reviewcoach', 42]));
    assert.equal(found.length, 1);
    assert.match(found[0].fix, /must be a YAML list of agent ids/);
    // A `doesNotMatch` on a phrase that no longer exists passes for free. This one tracks the
    // CURRENT unknown-id wording deliberately — when that wording changes, this must change
    // with it or it stops discriminating the two classes at all.
    assert.doesNotMatch(found[0].fix, /no agent this module knows about/,
      'not both descriptions of one field');
  });

  it('reports a module with no roster as NOT READ, and still reports a malformed one first', () => {
    // T266, operator ruling 2026-11-01: the install never reads `excluded_agents` for a module
    // without a profile, so its list has no effect whatever it holds — that is what is reported,
    // rather than calling any id unknown.
    const [notRead] = checkExcludedAgents(mod('_enhance', ['anything-at-all']));
    assert.ok(notRead, 'an opt-out the install never reads must be reported');
    assert.match(notRead.fix, /is not read for _enhance/);
    assert.doesNotMatch(notRead.fix, /no agent this module knows about/, 'not the unknown-id class');
    assert.deepEqual(checkExcludedAgents(mod('_enhance', [])), [], 'an empty list says nothing');
    // T266 R1: the shape is moot in a module that is never read, so NOT READ is reported first.
    const [shape] = checkExcludedAgents(mod('_enhance', 'a-bare-scalar'));
    assert.match(shape.fix, /is not read for _enhance/);
  });

  it('still reports the MALFORMED class first in a module that is read', () => {
    const [finding] = checkExcludedAgents(mod('_gyre', 'a-bare-scalar'));
    assert.ok(finding, 'the malformed class is roster-free and must still fire');
    assert.match(finding.fix, /must be a YAML list of agent ids/);
  });

  it('carries the AUTHORITY\'s text, not a paraphrase of it', () => {
    // The anti-drift property. If doctor ever composes its own wording, these diverge silently and
    // the operator gets two different descriptions of one defect from two tools.
    const configPath = path.join('/nonexistent-convoke-t266/proj/_bmad/bme/_gyre', 'config.yaml');

    const malformedValue = ['review-coach', 42];
    const mParsed = parseExcludedAgents(malformedValue);
    assert.equal(
      checkExcludedAgents(mod('_gyre', malformedValue))[0].fix,
      malformedExclusionMessage(malformedValue, mParsed.ids, configPath),
      'the malformed finding must be the authority\'s own sentence'
    );

    const unknownValue = ['reviewcoach'];
    const uParsed = parseExcludedAgents(unknownValue);
    assert.equal(
      checkExcludedAgents(mod('_gyre', unknownValue))[0].fix,
      unknownExclusionMessage(uParsed.ids, uParsed.conforming, MODULE_PROFILES._gyre, configPath),
      'and the unknown-id finding likewise'
    );
  });

  it('passes the module\'s own agents list, so a user-added agent is not reported unknown', () => {
    // The third call site of the widening, and the one with no coverage at all: dropping
    // `mod.config.agents` from doctor's call survived every test in this file.
    // T266 ruling D2 (2026-11-02): an operator's own agent has no wrapper, so it is neither pending
    // nor applied — nothing is reported for it while it is in `agents:`.
    const USER_ADDED = 'my-custom-agent';
    assert.deepEqual(
      checkExcludedAgents(mod('_gyre', [USER_ADDED], ['review-coach', USER_ADDED])), [],
      'excluding an agent the operator added works, so doctor must not report it'
    );
    // ...and the discriminating half: absent from the list, it is reported again.
    const [finding] = checkExcludedAgents(mod('_gyre', [USER_ADDED], ['review-coach']));
    assert.ok(finding, 'an id in neither the profile nor the config must still be reported');
    assert.match(finding.fix, new RegExp(`"${USER_ADDED}"`));
  });
});
