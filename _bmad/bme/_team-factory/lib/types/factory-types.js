'use strict';

/**
 * JSDoc type definitions for Team Factory integration wiring modules.
 * Canonical source for all factory shapes — no runtime code.
 */

/**
 * Parsed team spec file shape.
 * @typedef {Object} TeamSpec
 * @property {string} schema_version
 * @property {string} team_name
 * @property {string} team_name_kebab
 * @property {string} [description] - Optional team description for config.yaml
 * @property {string} composition_pattern - "Sequential" or "Independent"
 * @property {string} created - ISO date string
 * @property {string} factory_version
 * @property {AgentSpec[]} agents
 * @property {ContractSpec[]} contracts
 * @property {ContractSpec[]} feedback_contracts
 * @property {IntegrationSpec} integration
 * @property {Object} progress
 */

/**
 * Agent specification from spec file.
 * @typedef {Object} AgentSpec
 * @property {string} id
 * @property {string} role
 * @property {string[]} capabilities
 * @property {number} [pipeline_position] - Sequential only
 * @property {string[]} overlap_acknowledgments
 */

/**
 * Contract specification from spec file.
 * @typedef {Object} ContractSpec
 * @property {string} id
 * @property {string} source_agent
 * @property {string[]} target_agents
 * @property {string} artifact_title
 * @property {string} artifact_description
 * @property {string[]} key_sections
 * @property {string} file_name
 * @property {string[]} input_artifacts
 * @property {boolean} optional
 */

/**
 * Integration decisions from spec file.
 * @typedef {Object} IntegrationSpec
 * @property {string} output_directory
 * @property {string} compass_routing - "optional", "per-agent", "required", or "shared-reference"
 * @property {string} [contract_prefix]
 */

/**
 * Config.yaml data shape (matches Gyre/Vortex schema).
 * @typedef {Object} ConfigData
 * @property {string} submodule_name
 * @property {string} description
 * @property {string} module
 * @property {string} output_folder
 * @property {string[]} agents
 * @property {string[]} workflows
 * @property {string} version
 * @property {string} user_name
 * @property {string} communication_language
 * @property {boolean} party_mode_enabled
 * @property {string} core_module
 */

/**
 * Module-help.csv row shape.
 * @typedef {Object} CsvRow
 * @property {string} module
 * @property {string} phase
 * @property {string} name
 * @property {string} code
 * @property {number} sequence
 * @property {string} workflow_file
 * @property {string} command
 * @property {string} required
 * @property {string} agent
 * @property {string} options
 * @property {string} description
 * @property {string} output_location
 * @property {string} outputs
 */

/**
 * Activation validation result per agent.
 * @typedef {Object} ActivationResult
 * @property {string} agentFile
 * @property {ActivationCheck[]} checks
 * @property {string[]} errors
 */

/**
 * Individual activation check.
 * @typedef {Object} ActivationCheck
 * @property {string} check - Description of what was checked
 * @property {boolean} passed
 * @property {string} [detail] - Additional info if failed
 */

/**
 * Collision detection result.
 * @typedef {Object} Collision
 * @property {string} field - "submodule_name", "agent", or "workflow"
 * @property {string} value - The colliding value
 * @property {string} existingModule - Module that already has this value
 */

/**
 * Creator result shape (shared by config-creator and csv-creator).
 * @typedef {Object} CreatorResult
 * @property {boolean} success
 * @property {string} [filePath]
 * @property {string[]} errors
 * @property {number} [rowCount] - csv-creator only
 * @property {Collision[]} [collisions] - config-creator only
 */

/**
 * Activation validator result shape.
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {ActivationResult[]} results
 */

/**
 * Registry writer result shape (Full Write Safety Protocol).
 * Differs from CreatorResult intentionally — writers return written[]/skipped[] per architecture rule 2.
 * @typedef {Object} RegistryResult
 * @property {boolean} success
 * @property {string[]} written - Const names added to module.exports
 * @property {string[]} skipped - Reasons for skipping (e.g., 'block already exists')
 * @property {string[]} errors
 * @property {boolean} rollbackApplied - True if .bak was restored after verify failure
 * @property {boolean} [dirty] - True if dirty-tree detection found uncommitted changes
 * @property {string} [diff] - Git diff output when dirty
 * @property {{covered: string[], empty: string[], agentFilesIssues: string[], missingAgentFiles: string[]}|null} personaCoverage
 *   - Which declared agents carry persona evidence. `null` on every return except a completed
 *     write (the skip, dirty and failure paths compute none)
 */

/**
 * Agent entry in agent-registry.js.
 * @typedef {Object} RegistryAgentEntry
 * @property {string} id
 * @property {string} name - Display name (first name or derived)
 * @property {string} icon - Unicode emoji character
 * @property {string} title - Role-based title
 * @property {string} stream - Team name kebab
 * @property {RegistryPersona} persona
 */

/**
 * Persona sub-object within a registry agent entry.
 * @typedef {Object} RegistryPersona
 * @property {string} role
 * @property {string} identity
 * @property {string} communication_style
 * @property {string} expertise
 */

/**
 * File manifest entry tracking a created or modified file.
 * @typedef {Object} ManifestEntry
 * @property {string} path - File path (relative to project root)
 * @property {'created' | 'modified'} operation - Whether the file was created or modified
 * @property {string} module - Team name kebab identifying the owning module
 */

/**
 * End-to-end validation result.
 * @typedef {Object} E2EValidationResult
 * @property {boolean} valid - True if all checks passed
 * @property {E2ECheck[]} checks - Individual check results
 * @property {string[]} errors - Human-readable error messages for failed checks
 */

/**
 * Individual end-to-end validation check.
 * Name uses {PROP}-{SEMANTIC-NAME} format per architecture (line 590).
 * @typedef {Object} E2ECheck
 * @property {string} name - Check ID in {PROP}-{SEMANTIC-NAME} format (e.g., CONFIG-EXISTS)
 * @property {string} stepName - Step that produced the check (e.g., 'structural', 'regression', 'wiring')
 * @property {boolean} passed - Whether the check passed
 * @property {string} [expected] - Expected value (included on failure per TF-NFR11)
 * @property {string} [actual] - Actual value found (included on failure per TF-NFR11)
 * @property {string} [detail] - Additional context (e.g., file path)
 */

module.exports = {};
