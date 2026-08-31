---
initiative: convoke
artifact_type: adr
qualifier: 4-0-1-shipped-link-policy
created: '2026-08-19'
status: accepted
schema_version: 1
related_initiative: 4.0.1 (distribution integrity)
related_decision: 'Epic convoke-epic-4-0-1-distribution-integrity.md — ADR-2; gates Story 2.3, and FR12 is not wired into CI until this is ruled'
related_findings: 'CR-README-D03, CR-README-D04, CR-README-D05; backlog I157'
---

# ADR-002: The shipped-link policy, and where the Operator Covenant lives

**Status:** **Accepted** (2026-08-20, Amalik) — option (d), resolved in three classes; the Covenant moves to source-owned space
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

**Accepted 2026-08-20 (Amalik): option (d), in three classes. The Operator Covenant moves out of
`_bmad-output/planning-artifacts/` into source-owned space.**

Destination confirmed:

```
_bmad/bme/covenant/covenant-operator.md
_bmad/bme/covenant/compliance-checklist.md
```

`_bmad/bme/` is Convoke's owned namespace, the Covenant governs `_bmad/bme/` skills specifically,
and `files[]` already carries `_bmad/bme/*` module directories — so shipping it is one new allowlist
entry consistent with what is already there.

### The move is larger than a rename — enumerated, not estimated

`grep -rl` for `convoke-covenant-operator|convoke-spec-covenant-compliance-checklist` returns
**47 files**. Four are code or configuration rather than prose, and each fails differently if missed:

| File | Why it matters |
|---|---|
| `_bmad/_config/taxonomy.yaml:56` | Names the Covenant *by filename* in the `covenant` artifact-type definition. Governance config, not documentation. |
| `scripts/audit/reference-integrity.js` | The I97 FR24–25 mechanical reference-integrity check — the very tool that would report the move's own breakage. |
| `scripts/migration/format-conversion/covenant-survival-harness.js` | Inside the tree Class 1 stops shipping; update or let it go with the exclusion, but decide rather than drift. |
| `tests/lib/artifact-utils.test.js` | A test asserting against the current path. |

### BUG-13 sits directly on this operation

`updateLinks` (`scripts/lib/artifact-utils.js:1497`, called at `:1635`) is the governed-rename path
and applies every map entry sequentially over the same buffer. Verified by execution: the chain
`{a→b, b→c}` on `[A](a.md) and [B](b.md)` yields `[A](c.md) and [B](c.md)` — one link silently
destroyed. This move is a **two-entry rename map across 47 files**.

The specific corruption requires entry 1's *new* name to collide with entry 2's *old* name, which
`covenant-operator.md` and `compliance-checklist.md` do not. **That is a reason to assert it, not to
assume it.** BUG-13 is Open at 5.7 and outside 4.0.1's scope; the story carries the assertion
instead.

---

## Amendments

### Amendment 1 — the absolute-URL ruling (2026-08-31, Amalik)

**Answers this ADR's own open question**, left at *Consequences if accepted*: *"Either FR12's
checker validates absolute URLs too, or the policy forbids them in shipped docs."* Both halves of
that dichotomy were attempted on 2026-08-30 and backed out in `075651e5`. **Neither is the ruling.**

> **RULING.** FR12's checker validates **self-referential** absolute URLs — those matching
> `https://github.com/amalik/convoke-agents/blob/main/<path>` — by resolving `<path>` against the
> repository and failing when it does not exist. **External absolute URLs are permitted and are
> not validated.** Converting a broken relative link into a self-referential absolute URL is
> therefore no longer a way to hide it.

**Why the two backed-out rulings failed, and this one does not.** Measured across the **336 `.md`
files that ship** under `files[]`, which carry **45 absolute markdown links**:

| Ruling | Verdict against the tree |
|---|---|
| Forbid absolute URLs in shipped docs | **False.** `CREDITS.md` attribution and `SECURITY.md`'s advisory URL are both legitimate and neither can be made relative. |
| Forbid repository-only citations | **Self-defeating.** `README.md` alone ships 12 `blob/main` citations. |
| **Validate the self-referential subset** | **True and enforceable.** No network, deterministic, and green today. |

**Prefix distribution, enumerated rather than assumed:**

```
28  https://github.com/amalik/convoke-agents      <- self-referential; matches package.json
 6  https://github.com/bmad-code-org/BMAD-METHOD  <- external
 1  https://github.com/mozilla/diversity          <- external (CoC)
 1  https://github.com/bmadhub/bmad               <- external; see note below
 1  https://github.com/<you>/convoke-agents.git   <- documentation placeholder, not a link
```

The self-referential prefix is confirmed against `package.json`'s `repository.url`
(`git+https://github.com/amalik/convoke-agents.git`) rather than read off the README —
`verify-external-identifiers` applies: a display name is not an account handle.

**Ten unique self-referential paths ship, and all ten resolve today**, so the checker is wired in
green rather than red:

```
.gyre/findings.yaml                                        docs/agents.md
CONTRIBUTING.md                                            docs/development.md
_bmad-output/journey-examples/busy-parents-7-agent-journey.md   docs/faq.md
_bmad-output/planning-artifacts/convoke-covenant-operator.md    docs/lifecycle-expansion-vision.md
docs/BMAD-METHOD-COMPATIBILITY.md                          docs/testing.md
```

**This check is immediately load-bearing for Story 2.3's own work.** The fourth path above is the
Operator Covenant, which **Class 2 of this ADR moves** to `_bmad/bme/covenant/covenant-operator.md`.
The moment that move lands, that absolute URL is stale — and this checker is what catches it. A
policy that merely *permitted* absolute URLs would have let Story 2.3 break its own most important
link while turning its own gate green.

**What this ruling does NOT do**, stated so no one assumes coverage it lacks:

- It does not validate external URLs. `CR-README-D04`'s gap therefore **narrows rather than
  closes**: `docs-audit.js`'s `checkBrokenLinks` still skips `^https?://` for everything outside
  the self-referential prefix.
- It resolves against the **working tree**, not against what `main` actually serves. A path present
  locally and unpushed passes. `CR-README-D05`'s `blob/main` instability is unaffected.
- It does not validate `#fragment` anchors — the pattern deliberately stops at `#`.

*Unrelated observation, recorded not actioned:* one shipped link cites
`https://github.com/bmadhub/bmad`, which matches neither BMAD Method's actual repository
(`bmad-code-org/BMAD-METHOD`, used six times) nor anything else in the tree. Possibly stale.
**Not in scope for this ADR and not a link-policy question** — file separately if it matters.

### Amendment 2 — the three rulings this ADR left open (2026-08-31, Amalik)

Each was written as an either/or in the Recommendation and inherited verbatim into Story 2.3's
acceptance criteria. All three are now settled, on evidence.

**(1) `_bmad/bme/config.yaml` — DROP THE LINK. Do not ship the file.**
It is a **generated installer artifact carrying user-specific values**:

```yaml
# BME Module Configuration
# Generated by BMAD installer
project_name: BMAD-Enhanced
user_name: Amalik
```

Shipping it would place one operator's name and project into every published package. The
asymmetry this ADR flagged — README in the tarball, linked config not — is resolved by removing
the link, not by curing the asymmetry.

**(2) `CHANGELOG.md` — ship `docs/migration/`; render the other two as absolute URLs.**
Class 3 is unchanged for the migration guide. The remaining two become self-referential absolute
URLs, which **Amendment 1 now validates** — so this no longer trades a detectable fault for an
undetectable one, which was the only reason the option was contested. All three verified to
resolve:

```
docs/migration/3.x-to-4.0.md                                    (ships; Class 3)
docs/BMAD-METHOD-COMPATIBILITY.md                               (absolute; validated)
_bmad-output/planning-artifacts/adr/v63/adr-001-retire-m9-pf1-gate.md   (absolute; validated)
```

**(3) `covenant-survival-harness.js` — UPDATE the citation. Do not let it go.**

*A correction to this ADR's own framing first:* the harness's references at `:42-43` are **comment
citations of the source of truth**, not resolved paths — *"Operator Rights enumerated. Source of
truth: convoke-covenant-operator.md + convoke-spec-covenant-compliance-checklist.md. Frozen so
consumers…"*. Nothing breaks at runtime if they are missed. This ADR's Class 2 table implied a
functional dependency; it is a documentation one.

**The reason to update it anyway is that Class 1's premise is stale.** Class 1 describes
`scripts/migration/format-conversion/` as *"one-off i97 tooling"*, which is true of its purpose and
misleading about its state: **I97 Epic 2 is 2 of 7 done** — `i97-2-3` (Mila) is `in-progress` and
`i97-2-4` through `i97-2-7` are all `ready-for-dev`. Five conversions will still run through this
directory, and the harness is cited by `i97-2-1`'s story file and by the module's own README.

Excluding the directory from `files[]` remains correct — an operator has no use for it. **That an
operator does not need it does not mean a contributor does not.** Update the citation; it is one
string in live tooling.
