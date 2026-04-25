'use strict';

/**
 * Migration: 3.2.x → 4.0.0 — parallel entry for 3.2.x users.
 * See 3.3.x-to-4.0.0.js for the base module; this entry exists because
 * matchesVersionRange requires `{major}.{minor}.x` form, so 3.2.x users
 * need their own direct-to-4.0 entry.
 */

const base = require('./3.3.x-to-4.0.0');

module.exports = {
  ...base,
  name: '3.2.x-to-4.0.0',
  fromVersion: '3.2.x',
};
