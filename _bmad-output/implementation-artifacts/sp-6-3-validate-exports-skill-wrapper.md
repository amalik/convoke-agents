# Story SP-6.3: Validate Exports Skill Wrapper

Status: done

## Story

As a user,
I want to type `/bmad-validate-exports` to validate an exported staging directory,
so that I can check export quality through the chatbox.

## Acceptance Criteria

1. Skill exists at `.claude/skills/bmad-validate-exports/` with `SKILL.md` + `workflow.md`. Trigger phrases: "validate exports", "check exports", "verify exports".
2. Workflow prompts for staging directory path (required). Runs `validate-exports.js --input <path>`. Presents pass/fail summary conversationally. Optionally generates VALIDATION-REPORT.md.
3. Module-side copy at `_bmad/bme/_portability/skills/bmad-validate-exports/`.
4. Registered in `skill-manifest.csv` with tier=`pipeline`, intent=`meta-platform`.
5. No automated tests — manual validation only.

## Dev Agent Record

### Completion Notes List

### File List
