# BaseArtifact Integration Contract Specification

**Version:** 2.0.0
**Status:** Design Phase
**Date:** 2026-02-04
**Owner:** Convoke Core Team

---

## Executive Summary

The **BaseArtifact Contract** is the foundational integration layer enabling 4 independent frameworks (BMAD Method, Quint, DesignOS, AgentOS) to share traceability, versioning, and metadata while maintaining complete module autonomy.

**Key Principles:**
- **Minimal Shared Surface** - Only essential fields in base contract
- **Namespace Isolation** - Each module owns its data namespace
- **Backward Compatibility** - Semantic versioning with 6-month grace periods
- **Three-State Lifecycle** - Domain-Native (80%) → Cross-Domain (15%) → Multi-Domain Hub (5%)

---

## 1. Core Contract Schema

### 1.1 Minimal Shared Fields

Every artifact MUST include these fields in YAML frontmatter:

```yaml
---
# ============================================================
# BASE ARTIFACT CONTRACT v2.0.0
# Required fields for all Convoke artifacts
# ============================================================

# Identity
id: string                           # Unique identifier (UUID v4 or semantic ID)
type: string                         # Artifact type (see Type Registry)
contract_version: "2.0.0"            # BaseArtifact contract version

# Timestamps
created_date: ISO8601                # Creation timestamp
updated_date: ISO8601                # Last modification timestamp

# Traceability
traces:
  parent?: string                    # Parent artifact ID (single)
  children?: string[]                # Child artifact IDs (array)
  related?: string[]                 # Related artifact IDs (array)
  validates?: string[]               # Artifacts this validates (tests, gates)
  validated_by?: string[]            # Artifacts that validate this

# Module Metadata
metadata:
  module: "bmad" | "quint" | "designos" | "agentos"
  module_version: string             # Module version (e.g., "6.0.0", "1.5.0")
  schema_version: string             # Module-specific artifact schema version
  created_by?: string                # Agent/persona that created artifact
  tags?: string[]                    # Searchable tags

# ============================================================
# MODULE-SPECIFIC DATA (namespace isolation)
# ============================================================

bmm_data?: object                    # BMAD Method data
quint_data?: object                  # Quint FPF data
designos_data?: object               # DesignOS data
agentos_data?: object                # AgentOS data

---
```

### 1.2 Field Specifications

#### `id` (required)
- **Type:** String
- **Format:** UUID v4 OR semantic identifier
- **Examples:**
  - UUID: `"550e8400-e29b-41d4-a716-446655440000"`
  - Semantic: `"bmad-story-checkout-optimization-001"`
- **Uniqueness:** MUST be globally unique across all artifacts
- **Immutability:** MUST NOT change after creation

#### `type` (required)
- **Type:** String
- **Format:** Registered artifact type from Type Registry (see Section 2)
- **Examples:** `"bmad:story"`, `"quint:hypothesis"`, `"designos:design-spec"`
- **Validation:** MUST exist in Type Registry

#### `contract_version` (required)
- **Type:** String
- **Format:** Semantic version (MAJOR.MINOR.PATCH)
- **Current:** `"2.0.0"`
- **Compatibility:** See Section 4 for version compatibility rules

#### `created_date` / `updated_date` (required)
- **Type:** ISO 8601 timestamp with timezone
- **Format:** `YYYY-MM-DDTHH:mm:ss.sssZ`
- **Example:** `"2026-02-04T14:32:15.234Z"`
- **Behavior:** `updated_date` MUST be ≥ `created_date`

#### `traces` (optional object)
- **Type:** Object with optional arrays
- **Fields:**
  - `parent`: Single artifact ID that spawned this artifact
  - `children`: Array of artifact IDs spawned from this artifact
  - `related`: Array of artifact IDs with semantic relationship
  - `validates`: Array of artifact IDs this artifact validates (for tests, gates)
  - `validated_by`: Array of artifact IDs that validate this artifact

**Traceability Rules:**
```yaml
# Rule 1: Bidirectional consistency
# If A.traces.parent = B, then B.traces.children MUST include A

# Rule 2: Validation symmetry
# If Test.traces.validates = [Story], then Story.traces.validated_by MUST include Test

# Rule 3: Circular reference prevention
# Artifact MUST NOT appear in its own parent chain
```

#### `metadata` (required object)
- **Type:** Object
- **Required Fields:**
  - `module`: Owning module identifier
  - `module_version`: Version of owning module
  - `schema_version`: Version of module-specific schema
- **Optional Fields:**
  - `created_by`: Agent/persona that created artifact
  - `tags`: Searchable taxonomy tags

#### Module-Specific Namespaces (optional objects)
- **`bmm_data`**: BMAD Method-specific fields
- **`quint_data`**: Quint FPF-specific fields
- **`designos_data`**: DesignOS-specific fields
- **`agentos_data`**: AgentOS-specific fields

**Namespace Isolation Rules:**
- Modules MUST NOT read/write other modules' namespaces
- Modules MAY provide read-only accessor methods for cross-module queries
- Conflicts between namespace fields are impossible by design

---

## 2. Artifact Type Registry

### 2.1 Type Naming Convention

```
{module-prefix}:{artifact-category}[:{artifact-subtype}]
```

**Examples:**
- `bmad:story` (BMAD user story)
- `quint:hypothesis:l2` (Quint L2 hypothesis)
- `designos:design-spec` (DesignOS design specification)
- `agentos:quality-gate` (AgentOS quality gate decision)

### 2.2 Registered Types

| Type | Module | Description | Schema Version |
|------|--------|-------------|----------------|
| **BMAD Method Types** |
| `bmad:story` | bmad | User story | 6.0.0 |
| `bmad:epic` | bmad | Epic (story collection) | 6.0.0 |
| `bmad:architecture` | bmad | Architecture decision | 6.0.0 |
| `bmad:prd` | bmad | Product requirements | 6.0.0 |
| `bmad:product-brief` | bmad | Product brief | 6.0.0 |
| `bmad:ux-design` | bmad | UX design document | 6.0.0 |
| `bmad:test-suite` | bmad | Test suite | 6.0.0 |
| **Quint FPF Types** |
| `quint:hypothesis:l0` | quint | L0 conjecture | 1.0.0 |
| `quint:hypothesis:l1` | quint | L1 logically sound | 1.0.0 |
| `quint:hypothesis:l2` | quint | L2 empirically validated | 1.0.0 |
| `quint:drr` | quint | Design Rationale Record | 1.0.0 |
| `quint:evidence` | quint | Evidence artifact | 1.0.0 |
| **DesignOS Types** |
| `designos:design-spec` | designos | Design specification | 1.5.0 |
| `designos:ddr` | designos | Design Decision Record | 1.5.0 |
| `designos:design-token-set` | designos | Design token collection | 1.5.0 |
| `designos:figma-component` | designos | Figma component reference | 1.5.0 |
| **AgentOS Types** |
| `agentos:quality-gate` | agentos | Quality gate decision | 2.1.0 |
| `agentos:standard` | agentos | Standard definition | 2.1.0 |
| `agentos:orchestration-pattern` | agentos | Orchestration pattern | 2.1.0 |

### 2.3 Type Registration Process

**To register a new artifact type:**

1. Submit type definition to Type Registry
2. Include: type name, module, description, schema version, sample artifact
3. Validate no conflicts with existing types
4. Update registry CSV: `_bmad/_config/artifact-type-registry.csv`

---

## 3. Module-Specific Schemas

### 3.1 BMAD Method Namespace (`bmm_data`)

```yaml
bmm_data:
  # Story/Epic Fields
  priority?: "high" | "medium" | "low"
  story_points?: number
  status?: "pending" | "in_progress" | "completed" | "blocked"
  sprint?: string

  # Architecture Fields
  adr_number?: string                # ADR-001, ADR-002, etc.
  decision_status?: "proposed" | "accepted" | "deprecated" | "superseded"

  # Test Fields
  test_framework?: "playwright" | "cypress" | "jest" | "pytest"
  test_type?: "unit" | "integration" | "e2e" | "api"
  pass_rate?: number
```

### 3.2 Quint FPF Namespace (`quint_data`)

```yaml
quint_data:
  # Hypothesis Fields
  layer: "L0" | "L1" | "L2" | "invalid"
  cached_r_score?: number            # Effective reliability score (0-100)
  decay_computed_at?: ISO8601

  # Evidence Fields
  evidence_scores?: number[]         # Individual evidence scores
  congruence_levels?: ("CL1" | "CL2" | "CL3")[]
  valid_until?: ISO8601              # Evidence expiry date

  # DRR Fields
  decision_context?: string
  alternatives_considered?: string[]
  rationale?: string
```

### 3.3 DesignOS Namespace (`designos_data`)

```yaml
designos_data:
  # Design Spec Fields
  figma_link?: string
  design_system?: string
  components_used?: string[]

  # Design Decision Record Fields
  decision_category?: "layout" | "color" | "typography" | "interaction" | "structure"
  design_rationale?: string
  accessibility_notes?: string

  # Design Token Fields
  token_category?: "color" | "spacing" | "typography" | "shadow" | "border"
  token_value?: string
  export_formats?: ("css" | "json" | "tailwind" | "storybook")[]
```

### 3.4 AgentOS Namespace (`agentos_data`)

```yaml
agentos_data:
  # Quality Gate Fields
  gate_decision: "PASS" | "CONCERNS" | "FAIL" | "WAIVED"
  gate_type?: "story-ready" | "code-review" | "test-validation" | "deployment"
  concerns?: string[]
  waiver_reason?: string

  # Priority Management
  priority?: number                  # 1-10 scale (vs BMAD's high/medium/low)

  # Orchestration Pattern Fields
  pattern_name?: string
  sequence?: string[]                # Agent execution order
  parallel_steps?: string[][]        # Parallel agent groups
```

---

## 4. Version Compatibility Rules

### 4.1 Semantic Versioning

BaseArtifact contract follows **Semantic Versioning 2.0.0**:

- **MAJOR** (X.0.0): Breaking changes requiring migration
- **MINOR** (0.X.0): Backward-compatible feature additions
- **PATCH** (0.0.X): Backward-compatible bug fixes

### 4.2 Compatibility Matrix

| Reader Version | Artifact v2.0.0 | Artifact v2.1.0 | Artifact v3.0.0 |
|----------------|-----------------|-----------------|-----------------|
| **v2.0.x**     | ✅ Full         | ✅ Compatible   | ❌ Incompatible |
| **v2.1.x**     | ✅ Full         | ✅ Full         | ❌ Incompatible |
| **v3.0.x**     | ⚠️ Adapter      | ⚠️ Adapter      | ✅ Full         |

**Compatibility Rules:**
- Same MAJOR version: MUST be fully compatible
- Higher MINOR version: Reader ignores unknown fields
- Different MAJOR version: Requires adapter pattern

### 4.3 Upgrade Grace Period

**Policy:** 6-month grace period for MAJOR version upgrades

**Example Timeline:**
```
2026-02-04: BaseArtifact v3.0.0 released
2026-02-04 to 2026-08-04: Grace period (both v2.x and v3.x valid)
2026-08-04: v2.x artifacts deprecated (still readable via adapter)
2027-02-04: v2.x support removed (12 months total)
```

### 4.4 Migration Strategy

**When MAJOR version changes:**

1. **Dual-Version Support Period**
   - Modules MUST support reading both old and new versions
   - New artifacts created in new version only

2. **Automated Migration Tool**
   - Provide `bmad migrate-artifacts --from 2.0.0 --to 3.0.0`
   - Dry-run mode with impact report
   - Batch migration with rollback capability

3. **Deprecation Warnings**
   - Log warnings when reading old-version artifacts
   - Include migration instructions in warning

---

## 5. Traceability Implementation

### 5.1 Trace Index Generation

**File:** `.bmad/trace-index.json`

**Structure:**
```json
{
  "version": "2.0.0",
  "generated_at": "2026-02-04T14:32:15.234Z",
  "total_artifacts": 1247,
  "artifacts": {
    "bmad-story-checkout-001": {
      "type": "bmad:story",
      "file": "_bmad-output/stories/checkout-optimization.md",
      "traces": {
        "parent": "quint-hypothesis-l2-checkout-abandonment",
        "children": ["bmad-test-checkout-steps"],
        "related": ["designos-design-spec-checkout-wireframe"],
        "validated_by": ["agentos-quality-gate-story-ready-001"]
      }
    },
    "quint-hypothesis-l2-checkout-abandonment": {
      "type": "quint:hypothesis:l2",
      "file": "_quint/drrs/checkout-abandonment.md",
      "traces": {
        "children": [
          "bmad-story-checkout-001",
          "designos-design-spec-checkout-wireframe"
        ],
        "validated_by": ["bmad-test-checkout-steps"]
      }
    }
  }
}
```

**Generation:**
```bash
# Manual generation
bmad generate-trace-index

# Automatic generation (git hook)
.git/hooks/post-commit → bmad generate-trace-index --incremental
```

### 5.2 Bidirectional Traceability Queries

**Query Interface:**

```bash
# Find all children of an artifact
bmad trace --id quint-hypothesis-l2-checkout-abandonment --direction children

# Find parent chain (to root)
bmad trace --id bmad-story-checkout-001 --direction parent --recursive

# Find full dependency graph
bmad trace --id bmad-story-checkout-001 --graph

# Validate trace integrity
bmad trace --validate
```

**Example Output:**
```
📊 Trace Graph for: bmad-story-checkout-001

quint:hypothesis:l2 (quint-hypothesis-l2-checkout-abandonment)
  ├─→ designos:design-spec (designos-design-spec-checkout-wireframe)
  └─→ bmad:story (bmad-story-checkout-001) ← YOU ARE HERE
       ├─→ bmad:test-suite (bmad-test-checkout-steps)
       └─→ agentos:quality-gate (agentos-quality-gate-story-ready-001)

Validation Status: ✅ All traces bidirectional
Depth: 3 levels
Total Artifacts: 5
```

### 5.3 Trace Integrity Validation

**Validation Rules:**

1. **Bidirectional Consistency**
   ```
   IF A.traces.parent = B
   THEN B.traces.children MUST include A
   ```

2. **Validation Symmetry**
   ```
   IF Test.traces.validates = [Story]
   THEN Story.traces.validated_by MUST include Test
   ```

3. **Circular Reference Prevention**
   ```
   IF A.traces.parent = B AND B.traces.parent = C
   THEN C.traces.parent MUST NOT = A
   ```

4. **Orphan Detection**
   ```
   IF A.traces.parent = B AND B does not exist
   THEN flag A as orphaned
   ```

**Validation Command:**
```bash
bmad trace --validate --fix
```

**Example Report:**
```
🔍 Trace Validation Report

✅ Bidirectional Consistency: 1243/1247 artifacts (99.7%)
❌ Orphaned Artifacts: 4 found
  - bmad-story-old-feature-001 (parent: deleted-hypothesis-123)
  - bmad-test-legacy-001 (parent: missing-story-456)

⚠️ Validation Asymmetry: 2 found
  - bmad-test-checkout-steps validates bmad-story-checkout-001
    BUT bmad-story-checkout-001.traces.validated_by is missing

Suggested Fixes:
  1. Remove orphaned artifacts OR update parent references
  2. Auto-fix validation asymmetry (safe)

Run: bmad trace --validate --fix --auto
```

---

## 6. Content Alignment Validation

### 6.1 `/align` Command

**Purpose:** Validate that artifact content semantically matches its traced parent/children.

**Syntax:**
```bash
bmad align [artifact-id] [--target parent|children|all] [--threshold 0.8]
```

**Default Behavior:** Check adjacent pairs (parent ↔ this ↔ children)

**Example:**
```bash
bmad align bmad-story-checkout-001
```

**Output:**
```
🔗 Content Alignment Report: bmad-story-checkout-001

Parent Alignment:
  quint-hypothesis-l2-checkout-abandonment → bmad-story-checkout-001
  Score: 0.92 (✅ ALIGNED)

  Key Concepts Match:
    ✅ "checkout abandonment" → "checkout optimization"
    ✅ "5-step process" → "reduce steps from 5 to 2"
    ✅ "user frustration" → "improve user experience"

Children Alignment:
  bmad-story-checkout-001 → bmad-test-checkout-steps
  Score: 0.88 (✅ ALIGNED)

  Key Concepts Match:
    ✅ "reduce steps to 2" → "assert steps.length === 2"
    ✅ "checkout flow" → "checkout-flow.spec.ts"

Overall Status: ✅ ALIGNED (threshold: 0.8)
```

### 6.2 Alignment Algorithm

**Semantic Similarity Calculation:**

```python
def calculate_alignment(artifact_a, artifact_b):
    """
    Calculate semantic alignment between two artifacts.

    Returns: float (0.0 to 1.0)
    """
    # Extract text content from both artifacts
    content_a = extract_content(artifact_a)
    content_b = extract_content(artifact_b)

    # Generate embeddings (using Claude or similar)
    embedding_a = generate_embedding(content_a)
    embedding_b = generate_embedding(content_b)

    # Calculate cosine similarity
    similarity = cosine_similarity(embedding_a, embedding_b)

    # Boost score if key terms match
    key_terms_a = extract_key_terms(content_a)
    key_terms_b = extract_key_terms(content_b)
    term_overlap = len(key_terms_a & key_terms_b) / len(key_terms_a | key_terms_b)

    # Weighted average
    final_score = (0.7 * similarity) + (0.3 * term_overlap)

    return final_score
```

**Thresholds:**
- **≥ 0.8**: ALIGNED (green ✅)
- **0.6 - 0.79**: WEAK ALIGNMENT (yellow ⚠️)
- **< 0.6**: MISALIGNED (red ❌)

### 6.3 Automated Alignment Checks

**Git Hook Integration:**

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Get modified artifact files
MODIFIED=$(git diff --cached --name-only | grep -E '\.md$')

for file in $MODIFIED; do
  # Extract artifact ID from file
  ARTIFACT_ID=$(grep -m1 '^id:' "$file" | awk '{print $2}')

  # Run alignment check
  bmad align "$ARTIFACT_ID" --threshold 0.7 --quiet

  if [ $? -ne 0 ]; then
    echo "❌ Alignment check failed for $ARTIFACT_ID"
    echo "Run: bmad align $ARTIFACT_ID --fix"
    exit 1
  fi
done

exit 0
```

---

## 7. Three-State Artifact Lifecycle

### 7.1 State Definitions

**State 1: Domain-Native (80% of artifacts)**
- Artifact exists in single module namespace
- No cross-module traces
- Example: BMAD story with no Quint hypothesis

```yaml
---
id: "bmad-story-simple-001"
type: "bmad:story"
contract_version: "2.0.0"
metadata:
  module: "bmad"
traces: {}  # No cross-module traces
bmm_data:
  priority: "medium"
  story_points: 5
---
```

**State 2: Cross-Domain (15% of artifacts)**
- Artifact traces to 1-2 other modules
- Light integration (parent/child only)
- Example: BMAD story tracing to Quint hypothesis

```yaml
---
id: "bmad-story-traced-001"
type: "bmad:story"
contract_version: "2.0.0"
metadata:
  module: "bmad"
traces:
  parent: "quint-hypothesis-l2-checkout-abandonment"  # Quint trace
bmm_data:
  priority: "high"
  story_points: 8
quint_data:
  layer: "L2"  # Inherited from parent
---
```

**State 3: Multi-Domain Hub (5% of artifacts)**
- Artifact traces to 3+ modules
- Central coordination point
- Example: AgentOS quality gate validating BMAD story, Quint hypothesis, DesignOS design

```yaml
---
id: "agentos-gate-multi-001"
type: "agentos:quality-gate"
contract_version: "2.0.0"
metadata:
  module: "agentos"
traces:
  validates:
    - "quint-hypothesis-l2-checkout-abandonment"  # Quint
    - "designos-design-spec-checkout-wireframe"   # DesignOS
    - "bmad-story-checkout-001"                   # BMAD
    - "bmad-test-checkout-steps"                  # BMAD TEA
agentos_data:
  gate_decision: "PASS"
  gate_type: "deployment"
quint_data:
  layer: "L2"
  cached_r_score: 94
---
```

### 7.2 State Transition Rules

**Domain-Native → Cross-Domain:**
- Trigger: First cross-module trace added
- Action: Add minimal module namespace fields
- Example: BMAD story gets `traces.parent: quint-hypothesis-id`

**Cross-Domain → Multi-Domain Hub:**
- Trigger: Third cross-module trace added
- Action: Consider promoting to hub artifact
- Review: Is this artifact a natural coordination point?

**Anti-Pattern:** Forcing Multi-Domain Hub state prematurely
- Don't add traces just to "complete the graph"
- Only create traces that serve semantic purpose

---

## 8. 2-Level Test Pyramid

### 8.1 Level 1: Schema Compliance Tests

**Purpose:** Validate BaseArtifact contract adherence

**Tests:**
```typescript
describe('BaseArtifact Schema Compliance', () => {
  test('required fields present', () => {
    expect(artifact).toHaveProperty('id');
    expect(artifact).toHaveProperty('type');
    expect(artifact).toHaveProperty('contract_version');
    expect(artifact).toHaveProperty('created_date');
    expect(artifact).toHaveProperty('updated_date');
    expect(artifact).toHaveProperty('metadata');
  });

  test('timestamps valid', () => {
    expect(isISO8601(artifact.created_date)).toBe(true);
    expect(isISO8601(artifact.updated_date)).toBe(true);
    expect(artifact.updated_date >= artifact.created_date).toBe(true);
  });

  test('type registered', () => {
    const typeRegistry = loadTypeRegistry();
    expect(typeRegistry).toContain(artifact.type);
  });

  test('namespace isolation', () => {
    const moduleNamespaces = ['bmm_data', 'quint_data', 'designos_data', 'agentos_data'];
    const usedNamespaces = moduleNamespaces.filter(ns => artifact[ns]);
    expect(usedNamespaces.length).toBeGreaterThanOrEqual(1);
  });
});
```

**Run Command:**
```bash
bmad test --level schema --coverage
```

### 8.2 Level 2: Reference & Lifecycle Tests

**Purpose:** Validate trace integrity and state transitions

**Tests:**
```typescript
describe('Trace Integrity', () => {
  test('bidirectional consistency', () => {
    if (artifact.traces.parent) {
      const parent = loadArtifact(artifact.traces.parent);
      expect(parent.traces.children).toContain(artifact.id);
    }
  });

  test('validation symmetry', () => {
    if (artifact.traces.validates) {
      artifact.traces.validates.forEach(targetId => {
        const target = loadArtifact(targetId);
        expect(target.traces.validated_by).toContain(artifact.id);
      });
    }
  });

  test('no circular references', () => {
    const visited = new Set();
    let current = artifact;

    while (current.traces.parent) {
      if (visited.has(current.id)) {
        throw new Error('Circular reference detected');
      }
      visited.add(current.id);
      current = loadArtifact(current.traces.parent);
    }
  });
});

describe('Lifecycle State Transitions', () => {
  test('cross-domain state has minimal namespace', () => {
    const traceCount = countCrossModuleTraces(artifact);
    if (traceCount >= 1 && traceCount <= 2) {
      // Should have exactly 2 namespace objects (own + parent's)
      const namespaces = ['bmm_data', 'quint_data', 'designos_data', 'agentos_data']
        .filter(ns => artifact[ns]);
      expect(namespaces.length).toBeLessThanOrEqual(2);
    }
  });
});
```

**Run Command:**
```bash
bmad test --level reference --coverage
bmad test --all  # Run both levels
```

---

## 9. Implementation Checklist

### Phase 1: Contract Finalization (Week 1-2)
- [ ] Review and approve BaseArtifact v2.0.0 schema
- [ ] Create artifact type registry CSV
- [ ] Document namespace isolation rules
- [ ] Define version compatibility matrix
- [ ] Write migration guide for v1.x → v2.0.0

### Phase 2: Tooling (Week 3-4)
- [ ] Implement `bmad generate-trace-index`
- [ ] Implement `bmad trace` query commands
- [ ] Implement `bmad align` content validation
- [ ] Implement `bmad migrate-artifacts`
- [ ] Create git hooks for automated validation

### Phase 3: Testing (Week 5-6)
- [ ] Write Level 1 schema compliance tests
- [ ] Write Level 2 reference integrity tests
- [ ] Achieve 100% test coverage on base contract
- [ ] Create test fixtures for all artifact types
- [ ] Document testing strategy

### Phase 4: Module Integration (Week 7-10)
- [ ] Integrate BMAD Method (already using frontmatter, migrate to v2.0.0)
- [ ] Integrate Quint FPF (add `quint_data` namespace)
- [ ] Plan DesignOS integration (when implemented)
- [ ] Plan AgentOS integration (when implemented)

### Phase 5: Documentation & Rollout (Week 11-12)
- [ ] Write developer guide for creating artifacts
- [ ] Write module developer guide for namespace usage
- [ ] Create video walkthrough of traceability features
- [ ] Announce v2.0.0 release with migration timeline
- [ ] Monitor adoption and provide support

---

## 10. FAQ

### Q1: Can artifacts have multiple parents?
**A:** No. The `traces.parent` field is singular to maintain clear lineage. Use `traces.related` for sibling relationships.

### Q2: What happens if a parent artifact is deleted?
**A:** The child becomes orphaned. Run `bmad trace --validate` to detect orphans, then either:
- Delete the orphan
- Update `traces.parent` to a new parent
- Remove the parent reference (making it domain-native)

### Q3: Can I add custom fields to the base contract?
**A:** No. Custom fields go in module namespaces (`bmm_data`, `quint_data`, etc.). This prevents namespace pollution.

### Q4: How do I version my module-specific schema?
**A:** Use `metadata.schema_version` to track module schema versions independently from `contract_version`.

### Q5: What if two modules need to share data?
**A:** They don't. Modules query each other's artifacts via the trace index, but don't write to each other's namespaces.

### Q6: How does alignment validation work for newly created artifacts?
**A:** New artifacts have no parent, so alignment checks are skipped until a trace is added.

### Q7: Can I have traces between artifacts in the same module?
**A:** Yes! Traces work within modules too (e.g., Epic → Story in BMAD).

### Q8: What's the performance impact of trace indexing?
**A:** Incremental indexing (git hook) is <100ms for typical commits. Full re-index of 10K artifacts takes ~5 seconds.

---

## 11. Examples

### Example 1: Complete BMAD Story with Quint Hypothesis Trace

**File:** `_bmad-output/stories/checkout-optimization.md`

```yaml
---
# ============================================================
# BASE ARTIFACT CONTRACT v2.0.0
# ============================================================

id: "bmad-story-checkout-optimization-001"
type: "bmad:story"
contract_version: "2.0.0"

created_date: "2026-02-04T10:15:30.000Z"
updated_date: "2026-02-04T14:32:15.234Z"

traces:
  parent: "quint-hypothesis-l2-checkout-abandonment"
  children:
    - "bmad-test-checkout-steps"
  related:
    - "designos-design-spec-checkout-wireframe"
  validated_by:
    - "agentos-quality-gate-story-ready-001"

metadata:
  module: "bmad"
  module_version: "6.0.0"
  schema_version: "1.0.0"
  created_by: "Bob (SM)"
  tags: ["checkout", "ux-improvement", "sprint-12"]

# ============================================================
# MODULE-SPECIFIC DATA
# ============================================================

bmm_data:
  priority: "high"
  story_points: 8
  status: "completed"
  sprint: "Sprint 12"

quint_data:
  layer: "L2"
  cached_r_score: 92

---

# User Story: Optimize Checkout Flow

**As a** customer
**I want** a streamlined checkout process
**So that** I can complete purchases quickly without frustration

## Acceptance Criteria

- [ ] Reduce checkout steps from 5 to 2
- [ ] Maintain all required payment/shipping information
- [ ] Improve checkout completion rate by 20%

## Technical Notes

Traces to Quint hypothesis: [quint-hypothesis-l2-checkout-abandonment](../_quint/drrs/checkout-abandonment.md)

Related design: [DesignOS Checkout Wireframe](../_designos/designs/checkout-wireframe.md)
```

### Example 2: Quint L2 Hypothesis

**File:** `_quint/drrs/checkout-abandonment.md`

```yaml
---
# ============================================================
# BASE ARTIFACT CONTRACT v2.0.0
# ============================================================

id: "quint-hypothesis-l2-checkout-abandonment"
type: "quint:hypothesis:l2"
contract_version: "2.0.0"

created_date: "2026-01-28T09:00:00.000Z"
updated_date: "2026-02-04T14:32:15.234Z"

traces:
  children:
    - "bmad-story-checkout-optimization-001"
    - "designos-design-spec-checkout-wireframe"
  validated_by:
    - "quint-evidence-analytics-checkout-funnel"
    - "bmad-test-checkout-steps"

metadata:
  module: "quint"
  module_version: "1.0.0"
  schema_version: "1.0.0"
  created_by: "Deductor"
  tags: ["checkout", "user-behavior", "conversion"]

# ============================================================
# MODULE-SPECIFIC DATA
# ============================================================

quint_data:
  layer: "L2"
  cached_r_score: 92
  evidence_scores: [95, 88, 93]
  congruence_levels: ["CL3", "CL2", "CL3"]
  valid_until: "2026-08-04T00:00:00.000Z"
  decision_context: "E-commerce checkout optimization"
  rationale: "Analytics show 42% cart abandonment at step 3 of 5"

---

# Hypothesis: Checkout Process Complexity Drives Abandonment

**Layer:** L2 (Empirically Validated)
**Reliability Score:** 92/100

## Hypothesis Statement

Users abandon the checkout process due to excessive steps (5 total), with peak abandonment occurring at step 3 (shipping address entry).

## Evidence

1. **Analytics Data** (Score: 95, CL3)
   - 42% cart abandonment rate
   - 68% of abandonments occur at step 3
   - Average time-to-abandon: 47 seconds

2. **User Research** (Score: 88, CL2)
   - 15 user interviews revealed frustration with form length
   - 80% preferred "guest checkout" over account creation

3. **A/B Test Results** (Score: 93, CL3)
   - Prototype with 2-step checkout: 28% abandonment (33% improvement)
   - Statistical significance: p < 0.01

## Recommended Actions

- Reduce checkout to 2 steps maximum
- Eliminate account creation requirement
- Pre-fill shipping from billing when identical

## Validity Period

Evidence valid until: **2026-08-04** (6 months)
Requires re-validation if checkout flow changes.
```

### Example 3: AgentOS Quality Gate (Multi-Domain Hub)

**File:** `_agentos/quality-gates/story-ready-gate-001.md`

```yaml
---
# ============================================================
# BASE ARTIFACT CONTRACT v2.0.0
# ============================================================

id: "agentos-quality-gate-story-ready-001"
type: "agentos:quality-gate"
contract_version: "2.0.0"

created_date: "2026-02-04T14:30:00.000Z"
updated_date: "2026-02-04T14:32:15.234Z"

traces:
  validates:
    - "quint-hypothesis-l2-checkout-abandonment"
    - "designos-design-spec-checkout-wireframe"
    - "bmad-story-checkout-optimization-001"
  related:
    - "agentos-standard-story-readiness"

metadata:
  module: "agentos"
  module_version: "2.1.0"
  schema_version: "1.0.0"
  created_by: "Quality Gate Orchestrator"
  tags: ["story-ready", "sprint-12", "checkout"]

# ============================================================
# MODULE-SPECIFIC DATA (Multi-Domain Hub)
# ============================================================

agentos_data:
  gate_decision: "PASS"
  gate_type: "story-ready"
  priority: 9
  concerns: []

bmm_data:
  priority: "high"

quint_data:
  layer: "L2"
  cached_r_score: 92

designos_data:
  figma_link: "https://figma.com/file/abc123"

---

# Quality Gate: Story Readiness - Checkout Optimization

**Decision:** ✅ PASS
**Gate Type:** Story Ready for Development

## Validation Checklist

### Quint Hypothesis Validation
- ✅ Hypothesis at L2 (empirically validated)
- ✅ Reliability score: 92/100 (≥80 required)
- ✅ Evidence fresh (valid until 2026-08-04)

### DesignOS Design Validation
- ✅ Design specification complete
- ✅ Figma link accessible and up-to-date
- ✅ Design traces to Quint hypothesis

### BMAD Story Validation
- ✅ Acceptance criteria clear and testable
- ✅ Story points estimated (8 points)
- ✅ Story traces to both hypothesis and design
- ✅ Technical notes reference dependencies

## Alignment Scores

- Hypothesis → Design: 0.94 (excellent alignment)
- Design → Story: 0.88 (good alignment)
- Hypothesis → Story: 0.92 (excellent alignment)

## Gate Decision

**PASS** - All validation criteria met. Story is ready for development.

## Next Steps

1. Assign to developer (Amelia)
2. Create test suite skeleton
3. Begin implementation in Sprint 12
```

---

## 12. Related Documents

- [4-Framework Comparison Matrix](./4-framework-comparison-matrix.md) - Complete framework analysis
- [Product Brief: Convoke](./product-brief-Convoke-2026-02-01.md) - Product vision and ADRs
- [Integration Roadmap](./integration-roadmap.md) - Phased implementation plan (TBD)

---

## 13. Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.0.0 | 2026-02-04 | Initial BaseArtifact contract specification | BMAD Core Team |

---

**END OF SPECIFICATION**
