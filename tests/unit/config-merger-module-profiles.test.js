'use strict';

/**
 * fic-1-1 / BUG-22 — `mergeConfig` is module-aware, and `writeConfig` never overwrites a file it
 * cannot parse.
 *
 * Before this story `mergeConfig` had one Vortex-shaped notion of defaults and of canonical
 * agents/workflows, and `refresh-installation.js` called it for Gyre too. A fresh 4.0.2 install
 * therefore wrote configs with no `user_name`/`communication_language` (7 of 11 agents stop on
 * first start), seeded Gyre with Vortex's identity, and doubled Gyre's lists on its first update.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const yaml = require('js-yaml');

const configMerger = require('../../scripts/update/lib/config-merger');
const {
  AGENT_IDS,
  WORKFLOW_NAMES,
  GYRE_AGENT_IDS,
  GYRE_WORKFLOW_NAMES,
} = require('../../scripts/update/lib/agent-registry');
const { silenceConsole, restoreConsole } = require('../helpers');

const PACKAGE_ROOT = path.join(__dirname, '..', '..');
const VERSION = '9.9.9';
const VORTEX = configMerger.MODULE_PROFILES._vortex.defaults;
const GYRE = configMerger.MODULE_PROFILES._gyre.defaults;
const GYRE_TEMPLATE = yaml.load(fs.readFileSync(path.join(PACKAGE_ROOT, '_bmad/bme/_gyre/config.yaml'), 'utf8'));
const UPDATES = {
  _vortex: { agents: AGENT_IDS, workflows: WORKFLOW_NAMES },
  _gyre: { agents: GYRE_AGENT_IDS, workflows: GYRE_WORKFLOW_NAMES },
};
const CANONICAL = {
  _vortex: { agents: AGENT_IDS, workflows: WORKFLOW_NAMES },
  _gyre: { agents: GYRE_AGENT_IDS, workflows: GYRE_WORKFLOW_NAMES },
};

describe('mergeConfig — module profiles (fic-1-1)', () => {
  let tmpDir;
  let configPath;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-fic-1-1-'));
    configPath = path.join(tmpDir, 'config.yaml');
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  const merge = (submodule, opts) =>
    configMerger.mergeConfig(configPath, VERSION, UPDATES[submodule], opts === undefined ? { submodule } : opts);

  it('seeds a fresh Vortex config with every field its agents need (AC1)', async () => {
    const merged = await merge('_vortex');
    assert.equal(merged.submodule_name, '_vortex');
    assert.equal(merged.module, 'bme');
    assert.equal(merged.description, VORTEX.description);
    assert.equal(merged.output_folder, '{project-root}/_bmad-output/vortex-artifacts');
    assert.equal(merged.user_name, '{user}');
    assert.equal(merged.communication_language, 'en');
  });

  it('seeds a fresh Gyre config with Gyre identity, not Vortex (AC1)', async () => {
    const merged = await merge('_gyre');
    assert.equal(merged.submodule_name, '_gyre');
    assert.equal(merged.module, 'bme');
    assert.equal(merged.description, GYRE_TEMPLATE.description);
    assert.equal(merged.output_folder, '{project-root}/_bmad-output/gyre-artifacts');
    assert.equal(merged.user_name, '{user}');
    assert.equal(merged.communication_language, 'en');
    assert.deepEqual(merged.agents, GYRE_AGENT_IDS);
    assert.deepEqual(merged.workflows, GYRE_WORKFLOW_NAMES);
  });

  for (const submodule of ['_vortex', '_gyre']) {
    it(`${submodule}: canonical lists plus each user entry exactly once, byte-stable across merges (AC2)`, async () => {
      const { agents, workflows } = CANONICAL[submodule];
      fs.writeFileSync(configPath, yaml.dump({
        submodule_name: submodule, module: 'bme', version: '4.0.2',
        agents: [...agents, ...agents, 'my-agent', 'my-agent'],
        workflows: [...workflows, 'my-workflow', ...workflows, 'my-workflow'],
      }));

      const snapshots = [];
      for (let i = 0; i < 3; i++) {
        await configMerger.writeConfig(configPath, await merge(submodule));
        snapshots.push(fs.readFileSync(configPath, 'utf8'));
      }

      const onDisk = yaml.load(snapshots[2]);
      assert.deepEqual(onDisk.agents, [...agents, 'my-agent']);
      assert.deepEqual(onDisk.workflows, [...workflows, 'my-workflow']);
      assert.equal(snapshots[1], snapshots[2], 'a second merge changes nothing');
    });
  }

  it('repairs a Gyre config in the shape a 4.0.2 install left it, keeping operator keys (AC3)', async () => {
    fs.writeFileSync(configPath, yaml.dump({
      submodule_name: '_vortex',
      description: VORTEX.description,
      module: 'bmx',
      output_folder: VORTEX.output_folder,
      agents: [...GYRE_AGENT_IDS, ...GYRE_AGENT_IDS],
      excluded_agents: [],
      workflows: [...GYRE_WORKFLOW_NAMES, ...GYRE_WORKFLOW_NAMES],
      version: '4.0.2',
      migration_history: [],
      acme_client: 'Globex',
    }));

    const merged = await merge('_gyre');

    assert.equal(merged.submodule_name, '_gyre');
    assert.equal(merged.module, 'bme');
    assert.equal(merged.description, GYRE_TEMPLATE.description);
    assert.equal(merged.output_folder, GYRE.output_folder);
    assert.deepEqual(merged.agents, GYRE_AGENT_IDS);
    assert.deepEqual(merged.workflows, GYRE_WORKFLOW_NAMES);
    assert.equal(merged.user_name, '{user}');
    assert.equal(merged.communication_language, 'en');
    assert.equal(merged.acme_client, 'Globex');
  });

  it('repairs Vortex-default values even when submodule_name was already fixed by hand (AC3)', async () => {
    fs.writeFileSync(configPath, yaml.dump({
      submodule_name: '_gyre', module: 'bme', description: VORTEX.description, output_folder: VORTEX.output_folder,
      agents: GYRE_AGENT_IDS, workflows: GYRE_WORKFLOW_NAMES, version: '4.0.2',
    }));

    const merged = await merge('_gyre');

    assert.equal(merged.description, GYRE.description);
    assert.equal(merged.output_folder, GYRE.output_folder);
  });

  it('repairs a Vortex config holding Gyre defaults, the other direction (AC3)', async () => {
    silenceConsole();
    fs.writeFileSync(configPath, yaml.dump({
      submodule_name: '_gyre', module: 'bme', description: GYRE.description, output_folder: GYRE.output_folder,
      agents: AGENT_IDS, workflows: WORKFLOW_NAMES, version: '4.0.2',
    }));

    const merged = await merge('_vortex');

    assert.equal(merged.submodule_name, '_vortex');
    assert.equal(merged.description, VORTEX.description);
    assert.equal(merged.output_folder, VORTEX.output_folder);
  });

  it("repairs only an exact copy of the other module's default", async () => {
    fs.writeFileSync(configPath, yaml.dump({
      submodule_name: '_gyre', module: 'bme',
      description: 'Our readiness team, run alongside the Vortex streams',
      output_folder: '_bmad-output/vortex-artifacts',
      agents: GYRE_AGENT_IDS, workflows: GYRE_WORKFLOW_NAMES, version: '4.0.2',
    }));

    const merged = await merge('_gyre');

    assert.equal(merged.description, 'Our readiness team, run alongside the Vortex streams');
    assert.equal(merged.output_folder, '_bmad-output/vortex-artifacts');
  });

  it('keeps an operator output_folder in a damaged config (AC3/AC4)', async () => {
    fs.writeFileSync(configPath, yaml.dump({
      submodule_name: '_vortex', module: 'bme', output_folder: '_bmad-output/readiness',
      agents: GYRE_AGENT_IDS, workflows: GYRE_WORKFLOW_NAMES, version: '4.0.2',
    }));

    const merged = await merge('_gyre');

    assert.equal(merged.submodule_name, '_gyre');
    assert.equal(merged.output_folder, '_bmad-output/readiness');
  });

  for (const submodule of ['_vortex', '_gyre']) {
    it(`${submodule}: preserves every operator value, comments included (AC4)`, async () => {
      const { agents, workflows } = CANONICAL[submodule];
      const excluded = agents[agents.length - 1];
      fs.writeFileSync(configPath, [
        `submodule_name: ${submodule}`,
        'description: Our own team',
        'module: bme',
        "output_folder: '_bmad-output/ours'",
        'agents:',
        ...agents.filter(a => a !== excluded).map(a => `  - ${a}`),
        '  - acme-agent',
        '# Acme opted out of this one',
        'excluded_agents:',
        `  - ${excluded}`,
        'workflows:',
        ...workflows.map(w => `  - ${w}`),
        '  - acme-workflow',
        'version: 4.0.2',
        'user_name: Pat',
        'communication_language: French',
        'party_mode_enabled: false',
        'acme_client: Globex',
        '',
      ].join('\n'));

      await configMerger.writeConfig(configPath, await merge(submodule));
      const text = fs.readFileSync(configPath, 'utf8');
      const onDisk = yaml.load(text);

      assert.equal(onDisk.description, 'Our own team');
      assert.equal(onDisk.output_folder, '_bmad-output/ours');
      assert.equal(onDisk.user_name, 'Pat');
      assert.equal(onDisk.communication_language, 'French');
      assert.equal(onDisk.party_mode_enabled, false);
      assert.equal(onDisk.acme_client, 'Globex');
      assert.deepEqual(onDisk.excluded_agents, [excluded]);
      assert.ok(!onDisk.agents.includes(excluded), 'excluded agent stays out');
      assert.ok(onDisk.agents.includes('acme-agent'), 'user-added agent kept');
      assert.ok(onDisk.workflows.includes('acme-workflow'), 'user-added workflow kept');
      assert.ok(text.includes('# Acme opted out of this one'), 'comment survives the round-trip');
    });
  }

  it('gives a present-but-empty agent field its default', async () => {
    fs.writeFileSync(configPath, [
      'submodule_name: _gyre', "user_name: ''", 'communication_language:', 'output_folder:', 'description:', 'version: 4.0.2', '',
    ].join('\n'));

    const merged = await merge('_gyre');

    assert.equal(merged.user_name, '{user}');
    assert.equal(merged.communication_language, 'en');
    assert.equal(merged.output_folder, GYRE.output_folder);
    assert.equal(merged.description, GYRE.description);
    assert.deepEqual(configMerger.validateConfig(merged).errors, []);
  });

  it('throws on an unknown submodule, including prototype names and non-strings (AC7)', async () => {
    for (const submodule of ['_nope', 'constructor', 'toString', '__proto__', 42, Symbol('x')]) {
      await assert.rejects(
        configMerger.mergeConfig(configPath, VERSION, {}, { submodule }),
        /unknown submodule/i,
        String(submodule)
      );
    }
  });

  it('refuses to guess: omitting submodule on a config that names another module throws (AC7)', async () => {
    fs.writeFileSync(configPath, yaml.dump({ ...GYRE, agents: GYRE_AGENT_IDS, workflows: GYRE_WORKFLOW_NAMES, version: '4.0.2' }));
    await assert.rejects(
      configMerger.mergeConfig(configPath, VERSION, UPDATES._gyre),
      /is a _gyre config; pass \{ submodule: '_gyre' \}/
    );
    await assert.rejects(
      configMerger.mergeConfig(configPath, VERSION, UPDATES._gyre, null),
      /is a _gyre config/
    );
  });

  it('still defaults to Vortex for a Vortex, legacy or non-profile config, and normalises its identity (AC5)', async () => {
    for (const submoduleName of ['_vortex', 'vortex', 'constructor', 'toString']) {
      fs.writeFileSync(configPath, yaml.dump({ submodule_name: submoduleName, module: 'bme', version: '1.4.1', agents: [], workflows: [] }));
      const merged = await configMerger.mergeConfig(configPath, VERSION, UPDATES._vortex, null);
      assert.equal(merged.submodule_name, '_vortex', submoduleName);
    }
  });

  it('forces identity over any non-profile submodule_name without crashing', async () => {
    for (const submoduleName of ['constructor', 'toString', '__proto__', 42, null]) {
      fs.writeFileSync(configPath, yaml.dump({
        submodule_name: submoduleName, module: 'bme', description: 'Kept as written',
        output_folder: '_bmad-output/x', agents: GYRE_AGENT_IDS, workflows: GYRE_WORKFLOW_NAMES, version: '4.0.2',
      }));
      const merged = await merge('_gyre');
      assert.equal(merged.submodule_name, '_gyre', String(submoduleName));
      assert.equal(merged.description, 'Kept as written', String(submoduleName));
    }
  });
});

describe('writeConfig — never overwrites a file it cannot parse (fic-1-1)', () => {
  let tmpDir;
  let configPath;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'convoke-fic-1-1-write-'));
    configPath = path.join(tmpDir, 'config.yaml');
    silenceConsole();
  });

  afterEach(async () => {
    restoreConsole();
    await fs.remove(tmpDir);
  });

  const aliases = ['anchor: &t x', ...Array.from({ length: 101 }, (_, i) => `k${i}: *t`), 'user_name: Pat', ''].join('\n');
  const cases = [
    ['a duplicate key (an operator added user_name instead of replacing it)', "submodule_name: _gyre\nuser_name: '{user}'\nacme_client: Globex\nuser_name: Pat\n", /not valid YAML/],
    ['invalid YAML', '{{{ not: valid: yaml [[[', /not valid YAML/],
    ['keys only js-yaml calls duplicates (1 and "1")', "1: a\n'1': b\nuser_name: Pat\n", /not valid YAML/],
    ['a document yaml cannot convert (over 100 aliases)', aliases, /cannot be read/],
    ['a list', '- a\n- b\n', /not a YAML mapping/],
    ['a bare string', 'hello\n', /not a YAML mapping/],
    ['a document of just false', 'false\n', /not a YAML mapping/],
    ['a document of just 0', '0\n', /not a YAML mapping/],
    ['a document of just an empty string', "''\n", /not a YAML mapping/],
  ];

  for (const [label, content, message] of cases) {
    it(`refuses ${label} and leaves the file byte-identical`, async () => {
      fs.writeFileSync(configPath, content);
      const merged = await configMerger.mergeConfig(configPath, VERSION, UPDATES._gyre, { submodule: '_gyre' });
      assert.ok(!Object.prototype.hasOwnProperty.call(merged, '0'), 'a list is not spread into the merged config');
      await assert.rejects(configMerger.writeConfig(configPath, merged), message);
      await assert.rejects(configMerger.writeConfig(configPath, { version: VERSION }), message, 'bare-object caller too');
      assert.throws(() => configMerger.assertConfigReadable(configPath), message, 'preflight agrees');
      assert.equal(fs.readFileSync(configPath, 'utf8'), content);
    });
  }

  it('puts the fix instruction on the first line of the refusal', async () => {
    fs.writeFileSync(configPath, "user_name: a\nuser_name: b\n");
    assert.throws(
      () => configMerger.assertConfigReadable(configPath),
      (err) => err.message.split('\n').length === 1 && err.message.endsWith('Fix or remove the file, then re-run.')
    );
  });

  it('preflight passes an absent, empty or null document through unchanged', () => {
    assert.equal(configMerger.assertConfigReadable(configPath), configPath);
    for (const content of ['', '# only a comment\n', '---\nnull\n']) {
      fs.writeFileSync(configPath, content);
      assert.equal(configMerger.assertConfigReadable(configPath), configPath, JSON.stringify(content));
    }
  });

  it('writes over a document that is just null', async () => {
    fs.writeFileSync(configPath, '---\nnull\n');
    await configMerger.writeConfig(configPath, await configMerger.mergeConfig(configPath, VERSION, UPDATES._gyre, { submodule: '_gyre' }));
    assert.equal(yaml.load(fs.readFileSync(configPath, 'utf8')).submodule_name, '_gyre');
  });
});

describe('extractUserPreferences — module defaults (fic-1-1)', () => {
  it("treats a value as a preference relative to the module's own default", () => {
    assert.equal(configMerger.extractUserPreferences({ output_folder: GYRE.output_folder }, GYRE).output_folder, undefined);
    assert.equal(configMerger.extractUserPreferences({ output_folder: VORTEX.output_folder }, GYRE).output_folder, VORTEX.output_folder);
  });

  it('defaults to the Vortex profile when defaults are omitted or null', () => {
    for (const defaults of [undefined, null]) {
      assert.equal(configMerger.extractUserPreferences({ output_folder: VORTEX.output_folder }, defaults).output_folder, undefined);
      assert.equal(configMerger.extractUserPreferences({ output_folder: GYRE.output_folder }, defaults).output_folder, GYRE.output_folder);
    }
  });
});

describe('MODULE_PROFILES (fic-1-1 AC6)', () => {
  const FIELDS = ['submodule_name', 'module', 'output_folder', 'user_name', 'communication_language'];

  for (const submodule of ['_vortex', '_gyre']) {
    it(`${submodule} defaults agree with _bmad/bme/${submodule}/config.yaml`, () => {
      const template = yaml.load(
        fs.readFileSync(path.join(PACKAGE_ROOT, '_bmad', 'bme', submodule, 'config.yaml'), 'utf8')
      );
      const profile = configMerger.MODULE_PROFILES[submodule];
      assert.ok(profile, `no profile for ${submodule}`);
      for (const field of FIELDS) {
        assert.equal(profile.defaults[field], template[field], `${submodule}.${field}`);
      }
    });
  }

  it('exports frozen copies, so the registry cannot be mutated through it', () => {
    const before = [...GYRE_AGENT_IDS];
    assert.throws(() => configMerger.MODULE_PROFILES._gyre.agentIds.push('injected'), TypeError);
    assert.deepEqual(GYRE_AGENT_IDS, before);
  });
});
