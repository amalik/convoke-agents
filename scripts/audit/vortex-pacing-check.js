#!/usr/bin/env node
/**
 * vortex-pacing-check.js — make the OC-R7 pacing footers falsifiable.
 *
 * WHY THIS EXISTS
 * ---------------
 * Story oc-2-1 split every Vortex `step-01-*.md` into paced operator-input rounds, each closed by
 * a `Concept count: N/3` footer. The count is a human judgement under a rubric with inheritance,
 * so nothing could check it — and it was wrong twice in a row. Round 1 recounted every footer and
 * Round 2 still found inherited concepts being paid for, counts disagreeing with their own named
 * lists, and a fallback sentence stranded behind its boundary. `code-review-convergence` calls two
 * failed attempts at the same fix a restructure signal; this is the restructure.
 *
 * It does NOT try to compute the concept count — that is semantic and a script cannot do it. It
 * asserts the properties that ARE mechanical, each of which was a real defect in this story:
 *
 *   1. rounds == footers == halt markers          (drifted when lean-persona was added)
 *   2. footer N == number of concepts it names     (a count nobody could tie to a list)
 *   3. N <= 3                                      (the budget itself)
 *   4. ADVISORY ONLY — a named concept that looks inherited from workflow.md.
 *   5. no contract-schema enumeration of >= 4 rows (the construct that fired T1 in the first place)
 *   6. the fallback sentence precedes the first halt (it is useless behind the boundary)
 *   7. `## Next Step` resolves to a file that exists
 *
 * A footer that names its concepts is worth more than one that states a bare number, because only
 * the named form can be checked at all. That is the point of the restructure.
 *
 * WHY CHECK 4 IS A WARNING AND NOT A FAILURE. Inheritance is semantic. The first cut of this file
 * made it a hard failure using "every meaningful token of the concept appears in workflow.md". It
 * produced 13 findings, most of them false ("HC4 schema validation" matches because `HC4`, `schema`
 * and `validation` each appear somewhere), and it MISSED the one defect it was written for —
 * hypothesis-engineering pays for `falsifiability` while its workflow.md says `falsifiable`, a
 * different token. A gate that fires on the healthy cases and stays silent on the sick one gets
 * ignored or, worse, obeyed. The repo has been here before: `project-context.md` records the inline
 * backlog check that reported 51 violations against a correctly-sorted backlog and had to be
 * deleted. So this stays a stderr WARNING with exit 0 contribution, per the `preflight-soft-warn`
 * convention — a prompt to check by hand, never an assertion.
 *
 * NOT WIRED INTO CI — DELIBERATELY. It was, for one commit. Round 3 then proved it reports PASS
 * on all three regressions it exists to catch, because it lets files self-nominate into its scope:
 * delete a file's footers and it silently drops out of the checked set; collapse a file from two
 * rounds to one by removing halt, footer and marker together and the three counts fall together
 * and still agree; rewrite the denominator to `5/5` and the budget check stops matching. All three
 * observed at exit 0. A gate in `publish.needs` that certifies seven properties it does not enforce
 * is worse than no gate, so it was unwired rather than left to mislead. **T121** carries the
 * rebuild: files must not self-nominate (in scope if a file carries ANY of halt/marker/footer),
 * in-scope files need >= 2 rounds, and an explicit expected set so a dropped file is a visible
 * diff. Until then this is a local convenience — `npm run audit:pacing` — and nothing more.
 *
 * Exit 0 = clean, 1 = findings. Run: node scripts/audit/vortex-pacing-check.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const WF_DIR = path.join(ROOT, '_bmad/bme/_vortex/workflows');

const FOOTER = /^Concept count: (\d+)\/3 \(([^)]*)\)/gm;
const HALT = /^\*\*Your turn — I'll wait here\.\*\*/gm;
const MARKER = /^Wait for user input\.$/gm;
const FALLBACK = /^\*\*If (?:your input is|artifacts are|any input is|your artifacts are) [^*]*:\*\*/m;
// a contract-schema enumeration: a bolded HCn check followed by >= 4 bullet lines
const ENUM = /^\*\*HC\d [^*]*:\*\*\n(?:- .*\n){4,}/m;

// Words that carry no domain meaning on their own — matching them against workflow.md would
// produce noise, not inheritance findings.
const STOP = new Set(['as','and','the','a','an','of','for','to','or','input','sources','source',
  'accepted','its','their','not','no','one','per','with','is','are','it','that','this','from']);

function namedConcepts(list) {
  // split on commas that are not inside a parenthetical aside; drop trailing em-dash asides
  return list.split(/,(?![^(]*\))/)
    .map(s => s.replace(/—.*$/, '').trim())
    .filter(Boolean);
}

function conceptIsInherited(concept, workflowMd) {
  // A concept counts as inherited only if a distinctive multi-word or domain token from it
  // already appears in workflow.md. Single stop-words never qualify.
  const tokens = concept.toLowerCase().match(/[a-z][a-z-]{3,}/g) || [];
  const meaningful = tokens.filter(t => !STOP.has(t));
  if (!meaningful.length) return false;
  const hay = workflowMd.toLowerCase();
  // require EVERY meaningful token to be present, so "Wade's experimentation workflows as
  // sources" is only inherited if workflow.md really discusses experimentation workflows.
  return meaningful.every(t => hay.includes(t));
}

function main() {
  if (!fs.existsSync(WF_DIR)) {
    console.error(`vortex-pacing-check: ${WF_DIR} not found`);
    process.exit(2);
  }

  const findings = [];
  const warnings = [];
  let checked = 0;

  for (const wf of fs.readdirSync(WF_DIR).sort()) {
    const stepsDir = path.join(WF_DIR, wf, 'steps');
    if (!fs.existsSync(stepsDir)) continue;
    const step01 = fs.readdirSync(stepsDir).find(f => /^step-01-.*\.md$/.test(f));
    if (!step01) continue;

    const file = path.join(stepsDir, step01);
    const rel = path.relative(ROOT, file);
    const text = fs.readFileSync(file, 'utf8');

    const footers = [...text.matchAll(FOOTER)];
    if (!footers.length) continue;           // not a retrofitted file — nothing to assert
    checked++;

    const wfMdPath = path.join(WF_DIR, wf, 'workflow.md');
    const wfMd = fs.existsSync(wfMdPath) ? fs.readFileSync(wfMdPath, 'utf8') : '';

    // 1. rounds == footers == markers
    const halts = (text.match(HALT) || []).length;
    const markers = (text.match(MARKER) || []).length;
    const rounds = halts + 1;
    if (footers.length !== rounds) {
      findings.push(`${rel}: ${rounds} round(s) but ${footers.length} footer(s) — every round states its count`);
    }
    if (markers !== rounds) {
      findings.push(`${rel}: ${rounds} round(s) but ${markers} literal 'Wait for user input.' marker(s) — OC-R5 fails a cell on ANY unmarked boundary`);
    }

    for (const m of footers) {
      const stated = Number(m[1]);
      const named = namedConcepts(m[2]);
      const line = text.slice(0, m.index).split('\n').length;

      // 3. budget
      if (stated > 3) {
        findings.push(`${rel}:${line}: footer states ${stated}/3 — over the OC-R7 budget`);
      }
      // 2. count agrees with its own list
      if (stated !== named.length) {
        findings.push(`${rel}:${line}: footer states ${stated} but names ${named.length} concept(s) (${named.join(' | ')})`);
      }
      // 4. ADVISORY — possible inheritance. Heuristic; never a failure. See header.
      for (const c of named) {
        if (conceptIsInherited(c, wfMd)) {
          warnings.push(`${rel}:${line}: counts "${c}" — ${wf}/workflow.md may already introduce it. Heuristic, often wrong; verify by hand.`);
        }
      }
    }

    // 5. the enumeration that fired T1 must not come back
    if (ENUM.test(text)) {
      findings.push(`${rel}: a contract-schema enumeration of 4+ fields is present — reference the contract instead (§A41-2 counts visible sub-fields)`);
    }

    // 6. fallback must precede the first boundary
    const fb = text.match(FALLBACK);
    const firstHalt = text.search(HALT);
    if (fb && firstHalt !== -1 && text.indexOf(fb[0]) > firstHalt) {
      findings.push(`${rel}: the non-conforming fallback sits AFTER the first halt — the operator cannot see it while deciding what to hand over`);
    }

    // 7. the forward pointer still resolves
    const next = text.match(/\{project-root\}\/(_bmad\/[^\s`]+step-02[^\s`]*\.md)/);
    if (next && !fs.existsSync(path.join(ROOT, next[1]))) {
      findings.push(`${rel}: '## Next Step' points at ${next[1]}, which does not exist`);
    }
  }

  console.log('\nVortex Pacing Check\n');
  if (warnings.length) {
    console.error(`  WARN — ${warnings.length} possible inherited concept(s). Advisory only, exit code unaffected:\n`);
    for (const w of warnings) console.error(`    ${w}`);
    console.error('');
  }
  if (!findings.length) {
    console.log(`  PASS — ${checked} retrofitted step-01 file(s); rounds, markers and footers agree, every footer's number matches the concepts it names, none over budget, no schema enumeration reintroduced, every fallback ahead of its boundary, every step-02 pointer resolves.\n`);
    process.exit(0);
  }
  console.log(`  FAIL — ${findings.length} finding(s) across ${checked} retrofitted file(s):\n`);
  for (const f of findings) console.log(`    ${f}`);
  console.log('');
  process.exit(1);
}

main();
