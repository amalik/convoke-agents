/**
 * Shared JSDoc type definitions for the Artifact Governance & Portfolio system.
 * Used by: artifact-utils.js, migrate-artifacts.js, portfolio-engine.js, archive.js
 *
 * @module types
 */

/**
 * Inference signal with value, source, and confidence level.
 * @typedef {Object} InferenceSignal
 * @property {string} value - The inferred value
 * @property {string} source - Where the inference came from (e.g., 'frontmatter', 'artifact-chain', 'git-recency')
 * @property {'explicit'|'inferred'} confidence - Whether this is from explicit data or heuristic inference
 */

/**
 * State of an initiative as derived by the portfolio inference rule chain.
 * This is the core data structure that flows through the rule chain and into formatters.
 * @typedef {Object} InitiativeState
 * @property {string} initiative - Initiative ID from taxonomy (e.g., 'helm', 'gyre')
 * @property {InferenceSignal} phase - Current phase: discovery, planning, build, blocked, complete, unknown
 * @property {InferenceSignal} status - Current status: ongoing, blocked, paused, complete, stale, unknown
 * @property {{file: string, date: string}} lastArtifact - Most recently modified artifact for this initiative
 * @property {{value: string, source: string}} nextAction - Suggested next action based on chain gap analysis
 */

/**
 * @deprecated Use ManifestEntry instead. Planning placeholder with incomplete fields.
 * @typedef {Object} RenameManifestEntry
 * @property {string} oldPath - Current file path (relative to project root)
 * @property {string} newPath - Proposed new file path
 * @property {string} initiative - Inferred initiative ID
 * @property {string} artifactType - Inferred artifact type
 * @property {'high'|'low'} confidence - Inference confidence level
 * @property {'fully-governed'|'half-governed'|'ungoverned'|'invalid-governed'} governanceState - Current governance state
 */

/**
 * Manifest entry for dry-run display. Replaces RenameManifestEntry.
 * @typedef {Object} ManifestEntry
 * @property {string} oldPath - Current relative path (e.g., 'planning-artifacts/prd-gyre.md')
 * @property {string|null} newPath - Proposed new path (null for SKIP/CONFLICT/AMBIGUOUS)
 * @property {string|null} initiative - Resolved initiative ID (null if ambiguous)
 * @property {string|null} artifactType - Resolved artifact type (null if ungoverned)
 * @property {'high'|'low'} confidence - Initiative inference confidence
 * @property {string} source - Inference source (exact/alias/empty/unresolved)
 * @property {'RENAME'|'SKIP'|'INJECT_ONLY'|'CONFLICT'|'AMBIGUOUS'} action
 * @property {string} dir - Directory name (e.g., 'planning-artifacts')
 * @property {{firstLines: string[], gitAuthor: string|null, gitDate: string|null}|null} contextClues
 * @property {string[]|null} crossReferences - Files referencing this one (verbose only)
 * @property {string[]} candidates - Possible initiative matches (ambiguous only)
 * @property {string[]|null} collisionWith - Other files colliding on same newPath
 * @property {string|null} frontmatterInitiative - Initiative from frontmatter (for CONFLICT display)
 * @property {string|null} fileInitiative - Initiative from filename (for CONFLICT display)
 */

/**
 * Result of generateManifest() containing all entries, collisions, and summary.
 * @typedef {Object} ManifestResult
 * @property {ManifestEntry[]} entries - All manifest entries
 * @property {Map<string, string[]>} collisions - Colliding newPath -> list of oldPaths
 * @property {{total: number, skip: number, rename: number, inject: number, conflict: number, ambiguous: number}} summary
 */

/**
 * A markdown link that needs updating after file renames.
 * @typedef {Object} LinkUpdate
 * @property {string} filePath - Path of the file containing the link
 * @property {string} oldLink - Original link target
 * @property {string} newLink - Updated link target
 * @property {'bracket-link'|'relative-link'|'parent-link'|'frontmatter-array'} pattern - Which link pattern matched
 */

/**
 * Parsed taxonomy configuration from _bmad/_config/taxonomy.yaml.
 * @typedef {Object} TaxonomyConfig
 * @property {{platform: string[], user: string[]}} initiatives - Initiative IDs split by ownership
 * @property {string[]} artifact_types - Valid artifact type identifiers
 * @property {Object<string, string>} aliases - Historical name → canonical initiative ID mapping (migration-only)
 */

/**
 * Frontmatter metadata fields for governed artifacts.
 * @typedef {Object} FrontmatterSchema
 * @property {string} initiative - Initiative ID from taxonomy
 * @property {string} artifact_type - Artifact type from taxonomy
 * @property {'draft'|'validated'|'superseded'|'active'} [status] - Optional artifact-level status
 * @property {string} created - ISO 8601 date string (YYYY-MM-DD)
 * @property {number} schema_version - Schema version integer (currently 1)
 */

/**
 * Result of parsing a filename against naming conventions.
 * @typedef {Object} ParsedFilename
 * @property {string} filename - Original filename
 * @property {boolean} isDated - Whether the file has a date suffix
 * @property {string|null} date - Extracted date (YYYY-MM-DD) or null
 * @property {string} baseName - Filename without date and extension
 * @property {string|null} category - Extracted category prefix or null
 * @property {boolean} hasValidCategory - Whether category is in the valid list
 * @property {boolean} isUppercase - Whether filename contains uppercase characters
 * @property {boolean} matchesConvention - Whether filename fully matches naming convention
 */

/**
 * Result of a frontmatter conflict check.
 * @typedef {Object} FrontmatterConflict
 * @property {string} field - The conflicting field name
 * @property {*} existingValue - Current value in frontmatter
 * @property {*} newValue - Proposed new value
 */

/**
 * Result of injectFrontmatter() including conflict detection.
 * @typedef {Object} InjectResult
 * @property {string} content - The modified file content with injected frontmatter
 * @property {FrontmatterConflict[]} conflicts - Any field conflicts detected (empty if none)
 */

module.exports = {};
