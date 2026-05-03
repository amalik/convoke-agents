'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

const {
  discoverAgents,
  loadAgentDefinition,
  validateActivation,
  assertFileExists,
  MIN_NUMERIC_ACTIVATION_STEPS,
} = require('./helpers');

// ─── Dynamic Agent Activation Tests ─────────────────────────────
// All agents discovered from registry — zero hardcoded values.

const agents = discoverAgents();

describe('P0 Activation: Agent Definition Files', () => {
  for (const agent of agents) {
    describe(`${agent.name} (${agent.id})`, () => {
      let def;

      before(() => {
        def = loadAgentDefinition(agent.id);
      });

      it('agent definition file exists and loads without errors', () => {
        assertFileExists(agent.agentFilePath, `${agent.name} agent definition`);
        assert.ok(def, `${agent.name}: loadAgentDefinition returned falsy`);
      });

      it('YAML frontmatter has name and description', () => {
        assert.ok(
          def.frontmatter.name,
          `${agent.name} (${agent.id}): frontmatter missing 'name' field`
        );
        assert.ok(
          def.frontmatter.description,
          `${agent.name} (${agent.id}): frontmatter missing 'description' field`
        );
      });

      it('XML activation block has agent tag with id, name, title, icon', () => {
        assert.ok(
          def.agentAttrs.id,
          `${agent.name} (${agent.id}): missing agent id attribute in XML`
        );
        assert.ok(
          def.agentAttrs.name,
          `${agent.name} (${agent.id}): missing agent name attribute in XML`
        );
        assert.ok(
          def.agentAttrs.title,
          `${agent.name} (${agent.id}): missing agent title attribute in XML`
        );
        assert.ok(
          def.agentAttrs.icon,
          `${agent.name} (${agent.id}): missing agent icon attribute in XML`
        );
      });

      it('persona contains role, identity, communication_style', () => {
        assert.ok(
          def.persona.role,
          `${agent.name} (${agent.id}): missing persona.role`
        );
        assert.ok(
          def.persona.identity,
          `${agent.name} (${agent.id}): missing persona.identity`
        );
        assert.ok(
          def.persona.communication_style,
          `${agent.name} (${agent.id}): missing persona.communication_style`
        );
      });

      it('menu has at least 5 items with cmd attributes', () => {
        assert.ok(
          def.menuItems.length >= 5,
          `${agent.name} (${agent.id}): expected at least 5 menu items, got ${def.menuItems.length}`
        );
        for (const item of def.menuItems) {
          assert.ok(
            item.cmd,
            `${agent.name} (${agent.id}): menu item missing cmd attribute`
          );
        }
      });

      it('activation has the format-appropriate floor of numeric steps', () => {
        const numericSteps = def.activationSteps.filter(s => /^\d+$/.test(s));
        const minSteps = MIN_NUMERIC_ACTIVATION_STEPS[def.format] ?? 7;
        assert.ok(
          numericSteps.length >= minSteps,
          `${agent.name} (${agent.id}): expected at least ${minSteps} numeric activation steps for ${def.format} format, got ${numericSteps.length}`
        );
      });

      it('step 2 includes error handling', () => {
        assert.ok(
          def.hasErrorHandling,
          `${agent.name} (${agent.id}): step 2 missing error handling (Configuration Error / STOP)`
        );
      });

      it('agent name in XML matches registry name', () => {
        assert.equal(
          def.agentAttrs.name,
          agent.name,
          `${agent.name} (${agent.id}): XML name '${def.agentAttrs.name}' does not match registry name '${agent.name}'`
        );
      });
    });
  }
});

describe('P0 Activation: Full Validation', () => {
  it('all agents pass validateActivation with zero issues', () => {
    for (const agent of agents) {
      const def = loadAgentDefinition(agent.id);
      const issues = validateActivation(agent, def);
      assert.equal(
        issues.length,
        0,
        `${agent.name} (${agent.id}): ${issues.length} validation issues: ${JSON.stringify(issues)}`
      );
    }
  });
});
