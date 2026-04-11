---
initiative: convoke
artifact_type: note
qualifier: migration-guide-3.x-to-4.0-draft
created: '2026-04-11'
schema_version: 1
source: >-
  Extracted from convoke-prd-bmad-v6.3-adoption.md frontmatter
  (visionDraft.plainLanguage.whatExistingUsersGet — Feynman-translated
  plain language for user-facing docs).
status: draft
constraints: >-
  This guide MUST be ≤1 page and MUST introduce zero new concepts the user
  has to learn (per PRD NFR17 and Success Criteria User Success bullets).
---

# Convoke 4.0 Migration Guide — 3.x → 4.0 (Draft)

**Status:** Draft. This guide will be linked from the `convoke-update` terminal output and from the CHANGELOG entry.

---

## What to do

Run `convoke-update`. That's it.

## What happens

`convoke-update` runs the auto-migration and completes in under 60 seconds. Your agents, skills, workflows, and existing config all continue to work. You don't need to re-read any documentation. You don't need to learn any new agent names or config keys. You don't need to re-run installers.

## What changed (under the hood)

**In 3.x:** Convoke loaded its configuration through a skill called `bmad-init`, which agents invoked at activation time.

**In 4.0:** Convoke loads configuration directly from `_bmad/{module}/config.yaml` at activation. The `bmad-init` skill has been removed because it's no longer needed. Your existing config files are automatically migrated to the new loading pattern.

This is a maintenance change that keeps Convoke in sync with BMAD v6.3.0 upstream. Nothing about your day-to-day use of Convoke changes.

## What if something goes wrong

If `convoke-update` fails for any reason, re-run it. The script is idempotent — safe to run twice, three times, or however many times you need. It will resume from where it stopped.

If your agents start behaving differently after the upgrade (producing noticeably different outputs on the same inputs), that's a bug, not expected behavior. Convoke 4.0 validates behavioral equivalence before release, but we can't test every possible input. Report behavioral surprises to the maintainer.

## What if you have a custom skill that extends a BMM agent

If you wrote your own skill that adds capabilities to John, Mary, Winston, or any other BMM agent, run `convoke-doctor` after upgrading. If it surfaces a warning about an unregistered custom skill, register it by adding a row to `_bmad/_config/bmm-dependencies.csv`:

```
skill_name,bmm_agent,owner,registered_date
your-custom-skill-name,bmad-agent-pm,your-email@example.com,2026-04-11
```

This tells Convoke's compatibility registry that your skill exists and should be validated on future upgrades. Without this registration, future upgrades might silently break your custom skill.

## What's new (that you might notice)

- **Convoke is now installable through the BMAD community marketplace.** If you have colleagues who use BMAD but haven't tried Convoke, they can now install it through the normal BMAD plugin system.
- **Your CHANGELOG is honest.** Convoke 4.0 tests whether your agents produce equivalent outputs before the release ships. You can trust that "it works" is an empirically-validated claim, not a hope.

That's it. Everything else is internal maintenance.

---

## Traceability

- Source PRD: [`convoke-prd-bmad-v6.3-adoption.md`](convoke-prd-bmad-v6.3-adoption.md)
- Validation report: [`convoke-report-prd-validation-bmad-v6.3-adoption.md`](convoke-report-prd-validation-bmad-v6.3-adoption.md)
- PRD frontmatter source: `visionDraft.plainLanguage.whatExistingUsersGet`
- Related FRs: FR5 (single-command upgrade), FR7 (idempotent), FR10 (≤1 page), FR11 (zero new concepts), FR16 (custom skill registration)
- Related NFRs: NFR6 (idempotency), NFR17 (single-page constraint)

## Publication checklist

- [ ] Confirm total length is ≤1 page when rendered (per FR10, NFR17)
- [ ] Confirm zero new concepts introduced (per FR11 — check against BMM/Convoke glossary)
- [ ] Link from `convoke-update` terminal output
- [ ] Link from CHANGELOG 4.0 entry
- [ ] Save as `docs/migration/3.x-to-4.0.md` at release ship time (remove `-draft` qualifier)
