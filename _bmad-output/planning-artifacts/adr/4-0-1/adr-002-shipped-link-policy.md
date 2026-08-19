---
initiative: convoke
artifact_type: adr
qualifier: 4-0-1-shipped-link-policy
created: '2026-08-19'
status: proposed
schema_version: 1
related_initiative: 4.0.1 (distribution integrity)
related_decision: 'Epic convoke-epic-4-0-1-distribution-integrity.md — ADR-2; gates Story 2.3, and FR12 is not wired into CI until this is ruled'
related_findings: 'CR-README-D03, CR-README-D04, CR-README-D05; backlog I157'
---

# ADR-002: The shipped-link policy, and where the Operator Covenant lives

**Status:** **Proposed** (2026-08-19) — awaiting operator decision
**Initiative:** Convoke 4.0.1 — distribution integrity
**Gates:** Story 2.3. FR12's checker is built in Story 2.2 but not wired into CI until this is ruled.

## Context

The epic's premise is that nothing binds what is in the repository to what an operator receives.
FR12 builds the check. This ADR decides what the check should *enforce* — because a detector with
no paired decision gets allowlisted the first time it goes red under release pressure, which is how
the `pathContains` filter and the badges gate were each lost.

**The problem is four times larger than the drafting assumed.** A mechanical resolution of every
relative link in every shipped `.md` against the packed tarball:

```
CHANGELOG.md                                     3 broken
  _bmad-output/planning-artifacts/adr/v63/adr-001-retire-m9-pf1-gate.md
  docs/BMAD-METHOD-COMPATIBILITY.md
  docs/migration/3.x-to-4.0.md

_bmad/bme/README.md                              4 broken
  _bmad-output/planning-artifacts/convoke-covenant-operator.md
  _bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md
  _bmad/bme/config.yaml
  project-context.md

scripts/migration/format-conversion/README.md    8 broken
scripts/migration/format-conversion/fixup-checklist.md   5 broken
  (i97 ADRs ×4, the personality-preservation rubric, the v63 arch doc,
   project-context.md, tests/…/fixtures, .claude/skills/bmad-init/SKILL.md,
   a spike note in implementation-artifacts)

TOTAL: 20 broken relative links across 4 files
```

Earlier drafting cited eleven, from memory. The enumeration found twenty. `mechanical-research-enumeration` earned its keep again.

**Two facts reframe the decision.**

**1. Thirteen of the twenty are in documentation for tooling that has no reason to ship.**
`scripts/migration/format-conversion/` is the one-off i97 format-conversion tooling — two harnesses,
a fixtures directory, and two markdown files. **No `bin` entry references it**; the fourteen declared
bins are all elsewhere. It reaches the tarball only because `files[]` carries `scripts/` wholesale.
Its docs legitimately cite ADRs, rubrics and test fixtures, because they were written for someone
reading the repository — which is the only place they make sense.

**2. The shipped surface is partly accidental.** `_bmad/bme/README.md` is in the tarball;
`_bmad/bme/config.yaml`, its sibling, is not — and the README links to it. Neither is named in
`files[]`, whose `_bmad/bme/*` entries are the module directories. One arrives by an npm inclusion
rule, the other does not. Whatever the mechanism, the asymmetry was not chosen.

**3. The obvious fix has two standing objections against it.** Rewriting links as absolute GitHub
URLs is already logged as harmful twice: **CR-README-D05** — absolute URLs hardcode `blob/main`, so a
README published with 4.0.0 resolves against whatever `main` says months later, and the
`bmad-enhanced` → `convoke-agents` rename proves the path is not stable. **CR-README-D04** —
`scripts/docs-audit.js`'s `checkBrokenLinks` skips `^https?://` entirely, so absolute URLs leave CI
validation altogether. Converting a broken relative link into an unvalidated absolute one trades a
detectable fault for an undetectable one.

## Options

**(a) Ship every target.** Add `docs/`, `_bmad-output/planning-artifacts/` and `project-context.md`
to `files[]`. Resolves all 20. Ships planning artifacts, ADRs and internal governance to every user.

**(b) Rewrite as absolute GitHub URLs.** Resolves all 20 for a networked reader. Runs into
CR-README-D04 and CR-README-D05.

**(c) Drop the links.** Resolves all 20. Removes required reading from the people required to read it.

**(d) Shrink the shipped surface, then decide the remainder.** Exclude what has no reason to ship;
rule on what is left, class by class.

## Recommendation — (d), resolved in three classes

**Class 1 — internal tooling docs: stop shipping them. 13 of 20.**
Exclude `scripts/migration/format-conversion/` from `files[]`. No bin references it; its harnesses
and fixtures are repository-facing by construction, and its documentation correctly points at
repository-only artifacts. The links are not broken — the *package boundary* is drawn in the wrong
place. This shrinks the tarball and removes the largest block of findings without editing a single
link.

*Check before excluding:* confirm nothing in `scripts/update/**` or any test resolves into that
directory at runtime, exactly as FR13's harness will assert.

**Class 2 — the Covenant and the module README: ship the normative documents. 3 of 20.**
`convoke-covenant-operator.md` and `convoke-spec-covenant-compliance-checklist.md` are **normative
required reading** for anyone authoring under `_bmad/bme/` — `project-context.md:5` says so — and
they live in `_bmad-output/planning-artifacts/`, i.e. generated-artifact space. That is a **location
bug, not a packaging bug**: a document the product requires you to read is not a build output.

Move both to a source-owned path (e.g. `_bmad/bme/covenant/`), add that path to `files[]`, and
update every reference. `_bmad/bme/README.md`'s link to `project-context.md` becomes an absolute URL
or is dropped — contributor governance is genuinely repository-only, and unlike the Covenant it is
not required reading for a *user*.

*Also in this class:* `_bmad/bme/config.yaml` either ships or the README stops linking it. Declare
the intent either way; do not leave the asymmetry inherited.

**Class 3 — CHANGELOG: ship `docs/migration/`, drop the rest. 3 of 20.**
The migration guide is the single most useful link an upgrading npm reader can follow, and
`docs/migration/3.x-to-4.0.md` is one page. Ship `docs/migration/`. The ADR link and
`docs/BMAD-METHOD-COMPATIBILITY.md` are repository-facing; drop them from the shipped CHANGELOG or
render them as absolute URLs accepting CR-README-D05's instability.

**The resulting policy, which FR12 enforces:**

> Every relative link in a shipped document must resolve inside the package. A document that needs
> to cite repository-only material either does not ship, or cites it by absolute URL with that
> choice recorded. Normative documents — anything `project-context.md` calls required reading —
> ship.

## Consequences if accepted

- Story 2.3 becomes: exclude Class 1, relocate Class 2, ship `docs/migration/`, then wire FR12's
  checker into `try-fresh-install.sh` as blocking, in the same commit that turns it green.
- The Covenant relocation touches every reference to it — `project-context.md`, the compliance
  checklist, `_bmad/bme/README.md`, and any skill that cites it. Enumerate mechanically, not by memory.
- **CR-README-D04 becomes load-bearing.** If any link is rewritten as absolute, `docs-audit.js`
  cannot see it. Either FR12's checker validates absolute URLs too, or the policy forbids them in
  shipped docs. Recommend the former; note it lands in Story 2.1's or 2.2's scope, and that
  `docs:audit` reporting "zero findings" today partly means it is not looking.
- Package shrinks. `agent-surface-parity` and `fresh-install` both assert against the packed tree —
  re-run both after the exclusion.

## Consequences if rejected

- **(a)** ships ADRs, specs and internal governance to every user; `files[]` stops meaning anything.
- **(b)** trades 20 detectable faults for 20 invisible ones until CR-README-D04 is fixed.
- **(c)** removes the Covenant from the population `project-context.md` requires to read it — the
  defect this epic exists to close, restated as policy.

## Evidence appendix

```bash
# Enumerate every broken relative link in the packed tarball
npm pack --dry-run --json | python3 -c "
import json,sys,re,posixpath
shipped={f['path'] for f in json.load(sys.stdin)[0]['files']}
for f in sorted(p for p in shipped if p.endswith('.md')):
    for m in re.findall(r'\]\(([^)]+)\)', open(f, encoding='utf-8').read()):
        t=m.split('#')[0].strip()
        if not t or t.startswith(('http://','https://','mailto:')): continue
        tgt=posixpath.normpath(posixpath.join(posixpath.dirname(f), t))
        if tgt not in shipped and not any(s.startswith(tgt.rstrip('/')+'/') for s in shipped):
            print(f, '->', tgt)"

# No bin references the format-conversion tooling
python3 -c "import json;print(json.load(open('package.json'))['bin'])"
grep -rn "format-conversion" scripts/ package.json | grep -v "^scripts/migration/"

# The inherited asymmetry
npm pack --dry-run --json | python3 -c "
import json,sys;print([p['path'] for p in json.load(sys.stdin)[0]['files'] if p['path'].startswith('_bmad/bme/') and p['path'].count('/')==2])"
```

## Operator decision

**Amalik — accept (d) in three classes, or choose (a), (b) or (c)?**

The sub-decision inside (d) that most deserves your attention: **does the Operator Covenant move out
of `_bmad-output/planning-artifacts/` into source-owned space?** That is a repository-shaped change
with references across the tree, and it is the one this ADR most wants a yes or no on.
