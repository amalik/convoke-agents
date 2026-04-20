#!/usr/bin/env node
'use strict';

// Cross-platform replacement for POSIX shell glob expansion in `npm test` scripts.
// For each passed directory, recursively walks and collects `*.test.js` files, then
// invokes `node --test` with the explicit file list. Works identically on cmd.exe,
// PowerShell, bash, and zsh — no shell-glob expansion required, no runtime deps.
//
// Discovery semantics: ANY `*.test.js` file under a passed root (at any depth) is
// executed. `node_modules` and dot-prefixed dirs (.git, .nyc_output, coverage, etc.)
// are skipped. Fixtures and snapshot files that should NOT run must avoid the
// `.test.js` suffix.
//
// Why not `node --test <dir>`? Directory-argument recursion was added in Node 22.6.0;
// Convoke's engines floor is `>=18.0.0`, so dir-args fail on Node 18/20. This helper
// is the Node-version-independent path until/unless the engines floor is bumped.
// See IN-65 in the initiative-lifecycle backlog for the engines-bump follow-up.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function walk(root) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOTDIR') {
      console.error(`expected a directory, got a file: ${root}`);
    } else {
      console.error(`cannot read ${root}: ${err.code || err.message}`);
    }
    process.exit(2);
  }
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    // Skip node_modules and dot-prefixed dirs. Dirent.isDirectory() is false for
    // symlinks, so symlinked subdirs are also skipped — no cycle risk.
    if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
      out.push(...walk(full));
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      out.push(full);
    }
  }
  return out;
}

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error('usage: node scripts/test-runner.js <test-dir>...');
  process.exit(2);
}

const files = roots.flatMap(walk);
if (files.length === 0) {
  console.error(`No *.test.js files found under: ${roots.join(', ')}`);
  process.exit(2);
}

// Use process.execPath (not bare 'node') so the child runs the same binary as the
// parent — avoids PATH-resolution ambiguity under nvm/Volta/Windows node.exe shims.
// NODE_V8_COVERAGE (set by c8 when wrapping this process) propagates via inherited
// env to the child, which is how `npm run test:coverage` captures coverage across
// the two-level spawn chain. Do not pass { env: ... } here without preserving it.
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
if (result.error) {
  console.error(`failed to spawn ${process.execPath}: ${result.error.message}`);
  process.exit(1);
}
if (result.signal) {
  // POSIX convention: killed by signal N → exit 128 + N (SIGTERM=143, SIGKILL=137).
  // Preserves CI debug info vs. collapsing all signals to a bare 128.
  process.exit(128 + (os.constants.signals[result.signal] ?? 0));
}
process.exit(result.status ?? 1);
