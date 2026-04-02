'use strict';

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

/** @typedef {import('./types/factory-types').TeamSpec} TeamSpec */

const SCHEMAS_DIR = path.join(__dirname, '..', 'schemas');

/**
 * Load and validate a team spec YAML file.
 * Selects schema by composition_pattern, validates required fields and naming.
 *
 * @param {string} specPath - Absolute path to team spec YAML file
 * @returns {Promise<{ valid: boolean, spec: TeamSpec|null, errors: string[] }>}
 */
async function parseSpec(specPath) {
  let raw;
  try {
    raw = await fs.readFile(specPath, 'utf8');
  } catch (err) {
    return { valid: false, spec: null, errors: [`Cannot read spec file: ${err.message}`] };
  }

  let doc;
  try {
    doc = yaml.load(raw);
  } catch (err) {
    return { valid: false, spec: null, errors: [`Invalid YAML: ${err.message}`] };
  }

  if (!doc || typeof doc !== 'object') {
    return { valid: false, spec: null, errors: ['Spec file is empty or not an object'] };
  }

  // Determine pattern and load schema
  const pattern = doc.composition_pattern;
  if (!pattern) {
    return { valid: false, spec: null, errors: ['Missing required field: composition_pattern'] };
  }

  const schemaFile = pattern === 'Sequential'
    ? 'schema-sequential.json'
    : pattern === 'Independent'
      ? 'schema-independent.json'
      : null;

  if (!schemaFile) {
    return { valid: false, spec: null, errors: [`Unknown composition_pattern: "${pattern}". Expected "Independent" or "Sequential"`] };
  }

  // Load schema for reference (structural validation below)
  const schemaPath = path.join(SCHEMAS_DIR, schemaFile);
  let schema;
  try {
    schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'));
  } catch (err) {
    return { valid: false, spec: null, errors: [`Cannot load schema ${schemaFile}: ${err.message}`] };
  }

  // Validate against schema required fields and patterns
  const errors = validateAgainstSchema(doc, schema, pattern);

  if (errors.length > 0) {
    return { valid: false, spec: null, errors };
  }

  return { valid: true, spec: doc, errors: [] };
}

/**
 * Validate a parsed document against schema required fields, types, and patterns.
 * Lightweight validation without ajv — checks required fields, naming patterns, and structural rules.
 *
 * @param {Object} doc - Parsed YAML document
 * @param {Object} schema - JSON Schema object
 * @param {string} pattern - "Independent" or "Sequential"
 * @returns {string[]} errors
 */
function validateAgainstSchema(doc, schema, pattern) {
  const errors = [];

  // Check required root fields
  const required = schema.required || [];
  for (const field of required) {
    if (doc[field] === undefined || doc[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Type checks on key fields
  if (doc.schema_version !== undefined && typeof doc.schema_version !== 'string') {
    errors.push(`schema_version must be a string, got ${typeof doc.schema_version}`);
  } else if (doc.schema_version && !/^\d+\.\d+$/.test(doc.schema_version)) {
    errors.push(`schema_version "${doc.schema_version}" does not match pattern "N.N" (e.g., "1.0")`);
  }

  if (doc.composition_pattern !== undefined && doc.composition_pattern !== pattern) {
    errors.push(`composition_pattern "${doc.composition_pattern}" does not match expected "${pattern}"`);
  }

  if (doc.team_name !== undefined && (typeof doc.team_name !== 'string' || doc.team_name.length === 0)) {
    errors.push('team_name must be a non-empty string');
  }

  // Validate naming patterns
  const KEBAB_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
  const AGENT_ID_RE = /^[a-z]+(-[a-z]+)*$/;

  if (doc.team_name_kebab && !KEBAB_RE.test(doc.team_name_kebab)) {
    errors.push(`team_name_kebab "${doc.team_name_kebab}" does not match kebab-case pattern: ${KEBAB_RE}`);
  }

  // Validate agents array
  if (Array.isArray(doc.agents)) {
    if (doc.agents.length === 0) {
      errors.push('agents array must contain at least one agent');
    }
    for (let i = 0; i < doc.agents.length; i++) {
      const agent = doc.agents[i];
      if (!agent.id) {
        errors.push(`agents[${i}]: missing required field "id"`);
      } else if (!AGENT_ID_RE.test(agent.id)) {
        errors.push(`agents[${i}].id "${agent.id}" does not match agent ID pattern: ${AGENT_ID_RE}`);
      }
      if (!agent.role) {
        errors.push(`agents[${i}]: missing required field "role"`);
      }

      // Sequential-specific: pipeline_position required
      if (pattern === 'Sequential' && agent.pipeline_position === undefined) {
        errors.push(`agents[${i}]: Sequential pattern requires pipeline_position`);
      }
    }

    // Check for duplicate agent IDs
    const ids = doc.agents.map(a => a.id).filter(Boolean);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length > 0) {
      errors.push(`Duplicate agent IDs: ${[...new Set(dupes)].join(', ')}`);
    }
  } else if (required.includes('agents')) {
    errors.push('agents must be an array');
  }

  // Sequential-specific validations
  if (pattern === 'Sequential') {
    if (!Array.isArray(doc.contracts) || doc.contracts.length === 0) {
      errors.push('Sequential pattern requires at least one contract');
    } else {
      for (let i = 0; i < doc.contracts.length; i++) {
        const c = doc.contracts[i];
        if (!c.id) errors.push(`contracts[${i}]: missing required field "id"`);
        if (!c.source_agent) errors.push(`contracts[${i}]: missing required field "source_agent"`);
        if (!Array.isArray(c.target_agents) || c.target_agents.length === 0) {
          errors.push(`contracts[${i}]: target_agents must be a non-empty array`);
        }
      }
    }

    if (!doc.integration?.contract_prefix) {
      errors.push('Sequential pattern requires integration.contract_prefix');
    }
  }

  // Validate integration block
  if (doc.integration) {
    if (typeof doc.integration !== 'object' || Array.isArray(doc.integration)) {
      errors.push('integration must be an object');
    } else if (!doc.integration.output_directory) {
      errors.push('integration.output_directory is required');
    }
  }

  return errors;
}

/**
 * Parse a spec from a YAML string (for testing or in-memory use).
 * Pattern is determined from the document's composition_pattern field.
 *
 * @param {string} yamlString - Raw YAML content
 * @returns {Promise<{ valid: boolean, spec: TeamSpec|null, errors: string[] }>}
 */
async function parseSpecFromString(yamlString) {
  const tmpDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'bmad-tf-parse-'));
  const tmpFile = path.join(tmpDir, 'spec.yaml');
  try {
    await fs.writeFile(tmpFile, yamlString, 'utf8');
    return await parseSpec(tmpFile);
  } finally {
    await fs.remove(tmpDir);
  }
}

module.exports = {
  parseSpec,
  parseSpecFromString,
  validateAgainstSchema,
};
