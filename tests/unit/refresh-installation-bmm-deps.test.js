const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const { refreshInstallation, seedBmmDependencies } = require('../../scripts/update/lib/refresh-installation');
const { createValidInstallation, silenceConsole, restoreConsole } = require('../helpers');

// dist-2-5 / BUG-19 — the governance registry must ARRIVE in the user's project.
//
// `convoke-doctor` reads `path.join(projectRoot, '_bmad/_config/bmm-dependencies.csv')`
// (convoke-doctor.js:797). Nothing put it there, so every npm-installed operator saw
// `⚠ BMM dependencies: registry missing` on an otherwise healthy install.
//
// THE REGISTRY IS SEEDED EMPTY, AND BOTH REJECTED ALTERNATIVES ARE GUARDED BELOW.
//
// (a) Copying the package's registry — the story's original prescription — replaces
//     `registry missing` with `[stale:skill-gone] bmad-register-skill`, because that
//     row's skill directory ships to no project. Guarded by 'writes no rows at all'.
//
// (b) Seeding `scanBmmDependencies` output — which looks right, since it is what the
//     doctor's `fix:` line tells the OPERATOR to run — stamps the operator's own custom
//     skills `registered_by: auto-scan`, a reserved marker. That breaks
//     `convoke-register-skill` (exit 1, "Duplicate triple ... registered by auto-scan")
//     and permanently suppresses the doctor's `unregistered-custom-skill` detection, so
//     the doctor reports consistency over a tree nobody governed. Found in Round 1 and
//     guarded by 'never auto-registers a custom skill', which is the regression test
//     that matters most in this file.

const DEPS_REL = path.join('_bmad', '_config', 'bmm-dependencies.csv');
const HEADER = 'skill_name,bmm_agent,dependency_type,source_module,registered_by,registered_date';

async function setupDepsTestDir() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-bmmdeps-'));
  await createValidInstallation(tmpDir);
  return tmpDir;
}

describe('refreshInstallation — bmm-dependencies.csv generation (dist-2-5 / BUG-19)', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await setupDepsTestDir();
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  it('generates the registry in the project when it is absent', async () => {
    const abs = path.join(tmpDir, DEPS_REL);
    assert.ok(!fs.existsSync(abs), 'precondition: registry absent before refresh');

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    assert.ok(fs.existsSync(abs), 'registry must arrive in the project — this is BUG-19');
    const csv = fs.readFileSync(abs, 'utf8');
    assert.equal(csv.split('\n')[0].trim(), HEADER, 'must carry the schema the doctor reads');
  });

  it('writes the schema and no rows at all', async () => {
    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const csv = fs.readFileSync(path.join(tmpDir, DEPS_REL), 'utf8');
    assert.equal(csv, `${HEADER}\n`, 'the seed must be exactly the header line');
    // Guards rejected alternative (a): the package registry's own row must never appear.
    assert.ok(!csv.includes('bmad-register-skill'), 'no package row may leak into the project');
  });

  it('never auto-registers a custom skill the operator already has', async () => {
    // Guards rejected alternative (b) — the Round 1 HIGH. A project with a custom skill
    // that references a BMM agent is exactly what `convoke-register-skill` exists for;
    // the installer must not claim it first under the reserved `auto-scan` marker.
    const skillDir = path.join(tmpDir, '.claude', 'skills', 'operator-owned-skill', 'steps');
    await fs.ensureDir(skillDir);
    await fs.writeFile(path.join(skillDir, 's1.md'), 'This step invokes bmad-agent-pm.\n', 'utf8');

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    const csv = fs.readFileSync(path.join(tmpDir, DEPS_REL), 'utf8');
    assert.ok(
      !csv.includes('operator-owned-skill'),
      'the installer must not register the operator\'s own skill — that is convoke-register-skill\'s job',
    );
    assert.ok(!csv.includes('auto-scan'), 'the reserved auto-scan marker must not be written by the installer');
  });

  it('never writes registry content to the published name — only to a temp it then links', () => {
    // THIRD VERSION OF THIS TEST, and the first that can fail for the property it names.
    //
    // v1 asserted "no .tmp- sibling left behind", which a direct write satisfies trivially by
    // creating no temp at all. v2 made the write throw and asserted the target was absent —
    // but a direct write that throws also creates no target, so it too passed against a
    // zero-atomicity implementation. Both were caught by review, not by me; the second time,
    // my mutation run reported "1 fail" and I did not check WHICH test failed. It was the race
    // test below, every time.
    //
    // The property that actually separates the implementations is WHERE the content goes: an
    // atomic publish writes bytes only to a temp name and brings the real name into existence
    // already-complete via `linkSync`. So assert on the write target, which a direct write
    // cannot satisfy however it terminates.
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-bmmdeps-atomic-'));
    try {
      const abs = path.join(projectRoot, DEPS_REL);
      fs.ensureDirSync(path.dirname(abs));

      const realWrite = fs.writeFileSync;
      const contentWrites = [];
      try {
        fs.writeFileSync = (target, ...rest) => {
          if (String(target).includes('bmm-dependencies.csv')) contentWrites.push(String(target));
          return realWrite(target, ...rest);
        };
        seedBmmDependencies(projectRoot, { isSameRoot: false, verbose: false });
      } finally {
        fs.writeFileSync = realWrite;
      }

      assert.equal(contentWrites.length, 1, 'exactly one content write is expected');
      assert.notEqual(contentWrites[0], abs, 'content must NEVER be written to the published name');
      assert.ok(contentWrites[0].startsWith(`${abs}.tmp-`), 'it must go to a sibling temp of the target');
      assert.equal(fs.readFileSync(abs, 'utf8'), `${HEADER}\n`, 'and the published file must be complete');
    } finally {
      fs.removeSync(projectRoot);
    }
  });

  it('reclaims the temp file when the content write fails part-way', () => {
    // A SHORT write — ENOSPC/EDQUOT/EIO create the file, write some bytes, then throw — is the
    // realistic failure, and it is the one that used to strand a stray: the write sat outside
    // the try/finally. The previous version of this assertion stubbed a throw BEFORE any write,
    // so no temp existed and it asserted nothing. Measured by Round 3.
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-bmmdeps-short-'));
    try {
      const abs = path.join(projectRoot, DEPS_REL);
      fs.ensureDirSync(path.dirname(abs));

      const realWrite = fs.writeFileSync;
      let threw = false;
      try {
        fs.writeFileSync = (target, ...rest) => {
          if (String(target).includes('bmm-dependencies.csv')) {
            realWrite(target, 'skill_name,bmm_ag', 'utf8'); // partial — the file now EXISTS
            const err = new Error('ENOSPC: no space left on device, write');
            err.code = 'ENOSPC';
            throw err;
          }
          return realWrite(target, ...rest);
        };
        try {
          seedBmmDependencies(projectRoot, { isSameRoot: false, verbose: false });
        } catch { threw = true; }
      } finally {
        fs.writeFileSync = realWrite;
      }

      assert.ok(threw, 'the failed write must surface to the caller, which warns and continues');
      assert.ok(!fs.existsSync(abs), 'no torn registry may be published — it would be permanent');
      assert.deepEqual(
        fs.readdirSync(path.dirname(abs)), [],
        'the partial temp must be reclaimed; `.gitignore` `*.tmp` does not match this suffix, '
        + 'so a stray would surface in the operator\'s git status',
      );
    } finally {
      fs.removeSync(projectRoot);
    }
  });

  it('does not clobber a registry created while it was writing (atomic create-if-absent)', () => {
    // The check-then-act window `lstat` leaves open was measured at 6-10 ms in Round 2, and a
    // concurrent `convoke-register-skill` commit was demonstrably destroyed by a `renameSync`
    // that overwrites unconditionally. `linkSync` fails EEXIST instead, so the racer's content
    // survives. Simulated by creating the target during the temp-file write.
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-bmmdeps-race-'));
    try {
      const abs = path.join(projectRoot, DEPS_REL);
      fs.ensureDirSync(path.dirname(abs));
      const racerRows = `${HEADER}\nracer-skill,bmad-agent-pm,code-reference,unknown,alice,2026-09-02\n`;

      const realWrite = fs.writeFileSync;
      let res;
      try {
        fs.writeFileSync = (target, ...rest) => {
          const out = realWrite(target, ...rest);
          // The racer commits between our temp write and our publish.
          if (String(target).includes('.tmp-')) realWrite(abs, racerRows, 'utf8');
          return out;
        };
        res = seedBmmDependencies(projectRoot, { isSameRoot: false, verbose: false });
      } finally {
        fs.writeFileSync = realWrite;
      }

      assert.equal(res.seeded, false, 'losing the race must be reported as not-seeded');
      assert.equal(res.reason, 'exists');
      assert.equal(fs.readFileSync(abs, 'utf8'), racerRows, "the racer's registration must survive");
      assert.deepEqual(fs.readdirSync(path.dirname(abs)), ['bmm-dependencies.csv'], 'no temp left behind');
    } finally {
      fs.removeSync(projectRoot);
    }
  });

  it('leaves an existing registry untouched — it is user state', async () => {
    const abs = path.join(tmpDir, DEPS_REL);
    await fs.ensureDir(path.dirname(abs));
    const userRows = `${HEADER}\nmy-skill,bmad-agent-pm,code-reference,unknown,manual,2026-09-01\n`;
    await fs.writeFile(abs, userRows, 'utf8');

    await refreshInstallation(tmpDir, { backupGuides: false, verbose: false });

    assert.equal(fs.readFileSync(abs, 'utf8'), userRows, 'a manually-registered row must survive refresh');
  });

  it('does not write when isSameRoot — the dev-mode guard', () => {
    // Exercised through the exported helper rather than by calling `refreshInstallation`
    // with PACKAGE_ROOT: `test-fixture-isolation` forbids running a CLI/refresh against
    // the live repo, and a full dev-mode refresh here would edit tracked source.
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-bmmdeps-same-'));
    try {
      const res = seedBmmDependencies(projectRoot, { isSameRoot: true, verbose: false });
      assert.equal(res.seeded, false);
      assert.equal(res.reason, 'same-root');
      assert.ok(!fs.existsSync(path.join(projectRoot, DEPS_REL)), 'no registry may be written in dev mode');
    } finally {
      fs.removeSync(projectRoot);
    }
  });

  it('leaves a dangling symlink alone instead of writing through it', () => {
    // `existsSync` FOLLOWS symlinks and reports a dangling one as absent. Round 1 recorded
    // the hazard as "writes outside the project", which was true of the `fs.writeFileSync`
    // implementation of the time; Round 2 measured that it is NOT true of the current one —
    // `linkSync` fails EEXIST on the link itself and never follows it. So the assertion below
    // is about the surviving hazard: an operator who symlinked this path into a dotfiles repo
    // must keep their symlink, rather than have the installer replace it with a plain file.
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-bmmdeps-link-'));
    const outside = path.join(os.tmpdir(), `convoke-outside-${process.pid}.csv`);
    try {
      const abs = path.join(projectRoot, DEPS_REL);
      fs.ensureDirSync(path.dirname(abs));
      fs.symlinkSync(outside, abs);
      assert.ok(!fs.existsSync(outside), 'precondition: symlink target does not exist');

      const res = seedBmmDependencies(projectRoot, { isSameRoot: false, verbose: false });

      assert.equal(res.seeded, false, 'a symlink at the path is user state — leave it');
      assert.equal(res.reason, 'exists');
      assert.ok(fs.lstatSync(abs).isSymbolicLink(), 'the operator\'s symlink must survive intact');
      assert.ok(!fs.existsSync(outside), 'must not create the symlink\'s target');
    } finally {
      fs.removeSync(projectRoot);
      fs.removeSync(outside);
    }
  });

  it('reports why it skipped an existing registry', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'convoke-bmmdeps-exists-'));
    try {
      const abs = path.join(projectRoot, DEPS_REL);
      fs.ensureDirSync(path.dirname(abs));
      fs.writeFileSync(abs, `${HEADER}\n`, 'utf8');
      const res = seedBmmDependencies(projectRoot, { isSameRoot: false, verbose: false });
      assert.equal(res.seeded, false);
      assert.equal(res.reason, 'exists');
    } finally {
      fs.removeSync(projectRoot);
    }
  });
});
