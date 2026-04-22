'use strict';

/**
 * Migration: 3.1.x → 4.0.0 — parallel entry for 3.1.x users.
 * See 3.0.x-to-4.0.0.js for rationale.
 */

const base = require('./3.3.x-to-4.0.0');

module.exports = {
  ...base,
  name: '3.1.x-to-4.0.0',
  fromVersion: '3.1.x',
};
