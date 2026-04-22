'use strict';

/**
 * Migration: 3.0.x → 4.0.0 — parallel entry for 3.0.x users.
 *
 * Identical delta logic to 3.3.x-to-4.0.0 (rewrites 18 upstream-BMAD SKILL.md
 * activation blocks + deprecates bmad-init + doctor diff). registry.js's
 * matchesVersionRange requires `{major}.{minor}.x` form, so each prior 3.x
 * minor line needs its own entry to reach 4.0 via the chain walker.
 */

const base = require('./3.3.x-to-4.0.0');

module.exports = {
  ...base,
  name: '3.0.x-to-4.0.0',
  fromVersion: '3.0.x',
};
