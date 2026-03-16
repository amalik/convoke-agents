# /// script
# requires-python = ">=3.9"
# ///

#!/usr/bin/env python3
"""
Generate an interactive HTML quality report from scanner temp JSON files.

Reads all *-temp.json and *-prepass.json files from a quality scan output
directory, normalizes findings into a unified data model, and produces a
self-contained HTML report with:
  - Collapsible sections with severity filter badges
  - Per-item copy-prompt buttons
  - Multi-select batch prompt generator
  - Executive summary with severity counts

Usage:
  python3 generate-html-report.py {quality-report-dir} [--open] [--skill-path /path/to/skill]

The --skill-path is embedded in the prompt context so generated prompts
reference the correct location. If omitted, it is read from the first
temp JSON that contains a skill_path field.
"""

from __future__ import annotations

import argparse
import json
import platform
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


# =============================================================================
# Normalization — diverse scanner JSONs → unified item model
# =============================================================================

SEVERITY_RANK = {
    'critical': 0, 'high': 1, 'medium': 2, 'low': 3,
    'high-opportunity': 1, 'medium-opportunity': 2, 'low-opportunity': 3,
    'note': 4, 'strength': 5, 'suggestion': 4, 'info': 5,
}

# Map scanner names to report sections
SCANNER_SECTIONS = {
    'workflow-integrity': 'structural',
    'structure': 'structure-capabilities',
    'prompt-craft': 'prompt-craft',
    'execution-efficiency': 'efficiency',
    'skill-cohesion': 'cohesion',
    'agent-cohesion': 'cohesion',
    'path-standards': 'quality',
    'scripts': 'scripts',
    'script-opportunities': 'script-opportunities',
    'enhancement-opportunities': 'creative',
}

SECTION_LABELS = {
    'structural': 'Structural',
    'structure-capabilities': 'Structure & Capabilities',
    'prompt-craft': 'Prompt Craft',
    'efficiency': 'Efficiency',
    'cohesion': 'Cohesion',
    'quality': 'Path & Script Standards',
    'scripts': 'Scripts',
    'script-opportunities': 'Script Opportunities',
    'creative': 'Creative & Enhancements',
}


def _coalesce(*values) -> str:
    """Return the first truthy string value, or empty string."""
    for v in values:
        if v and isinstance(v, str) and v.strip() and v.strip() not in ('N/A', 'n/a', 'None'):
            return v.strip()
    return ''


def _norm_severity(sev: str) -> str:
    """Normalize severity to lowercase, handle variants."""
    if not sev:
        return 'low'
    s = sev.strip().lower()
    # Map common variants
    return {
        'high-opportunity': 'high-opportunity',
        'medium-opportunity': 'medium-opportunity',
        'low-opportunity': 'low-opportunity',
    }.get(s, s)


def normalize_finding(f: dict, scanner: str, idx: int) -> dict:
    """
    Normalize a single finding/issue dict into the unified item model.

    Handles all known field name variants across scanners:
      Title:  issue | title | description (fallback)
      Desc:   description | rationale | observation | insight | scenario |
              current_behavior | current_pattern | context | nuance
      Action: fix | recommendation | suggestion | suggested_approach |
              efficient_alternative | script_alternative
      File:   file | location | current_location
      Line:   line | lines
      Cat:    category | dimension
      Impact: user_impact | impact | estimated_savings | estimated_token_savings
    """
    sev = _norm_severity(f.get('severity', 'low'))
    section = SCANNER_SECTIONS.get(scanner, 'other')

    # Determine item type from severity
    if sev in ('strength', 'note') or f.get('category') == 'strength':
        item_type = 'strength'
        action_type = 'none'
        selectable = False
    elif sev.endswith('-opportunity'):
        item_type = 'enhancement'
        action_type = 'enhance'
        selectable = True
    elif f.get('category') == 'suggestion' or sev == 'suggestion':
        item_type = 'suggestion'
        action_type = 'refactor'
        selectable = True
    else:
        item_type = 'issue'
        action_type = 'fix'
        selectable = True

    # --- Title: prefer 'title', fall back to old field names ---
    title = _coalesce(
        f.get('title'),
        f.get('issue'),
        _truncate(f.get('scenario', ''), 150),
        _truncate(f.get('current_behavior', ''), 150),
        _truncate(f.get('description', ''), 150),
        f.get('observation', ''),
    )
    if not title:
        title = f.get('id', 'Finding')

    # --- Detail/description: prefer 'detail', fall back to old field names ---
    description = _coalesce(f.get('detail'))
    if not description:
        # Backward compat: coalesce old field names
        desc_candidates = []
        for key in ('description', 'rationale', 'observation', 'insight', 'scenario',
                    'current_behavior', 'current_pattern', 'context', 'nuance',
                    'assessment'):
            v = f.get(key)
            if v and isinstance(v, str) and v.strip() and v != title:
                desc_candidates.append(v.strip())
        description = ' '.join(desc_candidates) if desc_candidates else ''

    # --- Action: prefer 'action', fall back to old field names ---
    action = _coalesce(
        f.get('action'),
        f.get('fix'),
        f.get('recommendation'),
        f.get('suggestion'),
        f.get('suggested_approach'),
        f.get('efficient_alternative'),
        f.get('script_alternative'),
    )

    # --- File reference ---
    file_ref = _coalesce(
        f.get('file'),
        f.get('location'),
        f.get('current_location'),
    )

    # --- Line reference ---
    line = f.get('line')
    if line is None:
        lines_str = f.get('lines')
        if lines_str:
            line = str(lines_str)

    # --- Category ---
    category = _coalesce(
        f.get('category'),
        f.get('dimension'),
    )

    # --- Impact (backward compat only - new schema folds into detail) ---
    impact = _coalesce(
        f.get('user_impact'),
        f.get('impact'),
        f.get('estimated_savings'),
        str(f.get('estimated_token_savings', '')) if f.get('estimated_token_savings') else '',
    )

    # --- Extra fields for specific scanners ---
    extra = {}
    if scanner == 'script-opportunities':
        action_type = 'create-script'
        for k in ('determinism_confidence', 'implementation_complexity',
                   'language', 'could_be_prepass', 'reusable_across_skills'):
            if k in f:
                extra[k] = f[k]

    # Use scanner-provided id if available
    item_id = f.get('id', f'{scanner}-{idx:03d}')

    return {
        'id': item_id,
        'scanner': scanner,
        'section': section,
        'type': item_type,
        'severity': sev,
        'rank': SEVERITY_RANK.get(sev, 3),
        'category': category,
        'file': file_ref,
        'line': line,
        'title': title,
        'description': description,
        'action': action,
        'impact': impact,
        'extra': extra,
        'selectable': selectable,
        'action_type': action_type,
    }


def _truncate(text: str, max_len: int) -> str:
    """Truncate text to max_len, breaking at sentence boundary if possible."""
    if not text:
        return ''
    text = text.strip()
    if len(text) <= max_len:
        return text
    # Try to break at sentence boundary
    for end in ('. ', '.\n', ' — ', '; '):
        pos = text.find(end)
        if 0 < pos < max_len:
            return text[:pos + 1].strip()
    return text[:max_len].strip() + '...'


def normalize_scanner(data: dict) -> tuple[list[dict], dict]:
    """
    Normalize a full scanner JSON into (items, meta).
    Returns list of normalized items + dict of meta/assessment data.
    Handles all known scanner output variants.
    """
    scanner = data.get('scanner', 'unknown')
    items = []
    meta = {}

    # New schema: findings[]. Backward compat: issues[] or findings[]
    findings = data.get('findings') or data.get('issues') or []
    for idx, f in enumerate(findings):
        items.append(normalize_finding(f, scanner, idx))

    # Backward compat: opportunities[] (execution-efficiency had separate array)
    for idx, opp in enumerate(data.get('opportunities', []), start=len(findings)):
        opp_item = normalize_finding(opp, scanner, idx)
        opp_item['type'] = 'enhancement'
        opp_item['action_type'] = 'enhance'
        opp_item['selectable'] = True
        items.append(opp_item)

    # Backward compat: strengths[] (old cohesion scanners — plain strings)
    for idx, s in enumerate(data.get('strengths', [])):
        text = s if isinstance(s, str) else (s.get('title', '') if isinstance(s, dict) else str(s))
        desc = '' if isinstance(s, str) else (s.get('description', s.get('detail', '')) if isinstance(s, dict) else '')
        items.append({
            'id': f'{scanner}-str-{idx:03d}',
            'scanner': scanner,
            'section': SCANNER_SECTIONS.get(scanner, 'cohesion'),
            'type': 'strength',
            'severity': 'strength',
            'rank': 5,
            'category': 'strength',
            'file': '',
            'line': None,
            'title': text,
            'description': desc,
            'action': '',
            'impact': '',
            'extra': {},
            'selectable': False,
            'action_type': 'none',
        })

    # Backward compat: creative_suggestions[] (old cohesion scanners)
    for idx, cs in enumerate(data.get('creative_suggestions', [])):
        if isinstance(cs, str):
            cs_title, cs_desc = cs, ''
        else:
            cs_title = _coalesce(cs.get('title'), cs.get('idea'), '')
            cs_desc = _coalesce(cs.get('description'), cs.get('detail'), cs.get('rationale'), '')
        items.append({
            'id': cs.get('id', f'{scanner}-cs-{idx:03d}') if isinstance(cs, dict) else f'{scanner}-cs-{idx:03d}',
            'scanner': scanner,
            'section': SCANNER_SECTIONS.get(scanner, 'cohesion'),
            'type': 'suggestion',
            'severity': 'suggestion',
            'rank': 4,
            'category': cs.get('type', 'suggestion') if isinstance(cs, dict) else 'suggestion',
            'file': '',
            'line': None,
            'title': cs_title,
            'description': cs_desc,
            'action': cs_title,
            'impact': cs.get('estimated_impact', '') if isinstance(cs, dict) else '',
            'extra': {},
            'selectable': True,
            'action_type': 'refactor',
        })

    # New schema: assessments{} contains all structured analysis
    # Backward compat: also collect from top-level keys
    if 'assessments' in data:
        meta.update(data['assessments'])

    # Backward compat: collect meta from top-level keys
    skip_keys = {'scanner', 'script', 'version', 'skill_path', 'agent_path',
                 'timestamp', 'scan_date', 'status', 'issues', 'findings',
                 'strengths', 'creative_suggestions', 'opportunities', 'assessments'}
    for key, val in data.items():
        if key not in skip_keys and key not in meta:
            meta[key] = val

    return items, meta


def build_journeys(data: dict) -> list[dict]:
    """
    Extract user journey data from enhancement-opportunities scanner.
    Handles two formats:
      - Array of objects: [{archetype, journey_summary, friction_points, bright_spots}]
      - Object keyed by persona: {first_timer: {entry_friction, mid_flow_resilience, exit_satisfaction}}
    """
    journeys_raw = data.get('user_journeys')
    if not journeys_raw:
        return []

    # Format 1: already a list — normalize field names
    if isinstance(journeys_raw, list):
        normalized = []
        for j in journeys_raw:
            if isinstance(j, dict):
                normalized.append({
                    'archetype': j.get('archetype', 'unknown'),
                    'journey_summary': j.get('summary', j.get('journey_summary', '')),
                    'friction_points': j.get('friction_points', []),
                    'bright_spots': j.get('bright_spots', []),
                })
            else:
                normalized.append(j)
        return normalized

    # Format 2: object keyed by persona name
    if isinstance(journeys_raw, dict):
        result = []
        for persona, details in journeys_raw.items():
            if isinstance(details, dict):
                # Convert the dict-based format to the expected format
                journey = {
                    'archetype': persona.replace('_', ' ').title(),
                    'journey_summary': '',
                    'friction_points': [],
                    'bright_spots': [],
                }
                # Map known sub-keys to friction/bright spots
                for key, val in details.items():
                    if isinstance(val, str):
                        # Heuristic: negative-sounding keys → friction, positive → bright
                        if any(neg in key.lower() for neg in ('friction', 'issue', 'problem', 'gap', 'pain')):
                            journey['friction_points'].append(val)
                        elif any(pos in key.lower() for pos in ('bright', 'strength', 'satisfaction', 'delight')):
                            journey['bright_spots'].append(val)
                        else:
                            # Neutral keys — include as summary parts
                            if journey['journey_summary']:
                                journey['journey_summary'] += f' | {key}: {val}'
                            else:
                                journey['journey_summary'] = f'{key}: {val}'
                    elif isinstance(val, list):
                        for item in val:
                            if isinstance(item, str):
                                journey['friction_points'].append(item)
                # Build summary from all fields if not yet set
                if not journey['journey_summary']:
                    parts = []
                    for k, v in details.items():
                        if isinstance(v, str):
                            parts.append(f'**{k.replace("_", " ").title()}:** {v}')
                    journey['journey_summary'] = ' | '.join(parts) if parts else str(details)
                result.append(journey)
            elif isinstance(details, str):
                result.append({
                    'archetype': persona.replace('_', ' ').title(),
                    'journey_summary': details,
                    'friction_points': [],
                    'bright_spots': [],
                })
        return result

    return []


# =============================================================================
# Report Data Assembly
# =============================================================================

def load_report_data(report_dir: Path, skill_path: str | None) -> dict:
    """Load all temp/prepass JSONs and assemble normalized report data."""
    all_items = []
    all_meta = {}
    journeys = []
    detected_skill_path = skill_path

    # Read all JSON files
    json_files = sorted(report_dir.glob('*.json'))
    for jf in json_files:
        try:
            data = json.loads(jf.read_text(encoding='utf-8'))
        except (json.JSONDecodeError, OSError):
            continue

        if not isinstance(data, dict):
            continue

        scanner = data.get('scanner', jf.stem.replace('-temp', '').replace('-prepass', ''))

        # Detect skill path from scanner data
        if not detected_skill_path:
            detected_skill_path = data.get('skill_path') or data.get('agent_path')

        # Only normalize temp files (not prepass)
        if '-temp' in jf.name or jf.name in ('path-standards-temp.json', 'scripts-temp.json'):
            items, meta = normalize_scanner(data)
            all_items.extend(items)
            all_meta[scanner] = meta

            if scanner == 'enhancement-opportunities':
                journeys = build_journeys(data)
        elif '-prepass' in jf.name:
            all_meta[f'prepass-{scanner}'] = data

    # Sort items: severity rank first, then section
    all_items.sort(key=lambda x: (x['rank'], x['section']))

    # Build severity counts
    counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
    for item in all_items:
        if item['type'] == 'issue' and item['severity'] in counts:
            counts[item['severity']] += 1

    enhancement_count = sum(1 for i in all_items if i['type'] == 'enhancement')
    strength_count = sum(1 for i in all_items if i['type'] == 'strength')
    total_issues = sum(counts.values())

    # Quality grade
    if counts['critical'] > 0:
        grade = 'Poor'
    elif counts['high'] > 2:
        grade = 'Fair'
    elif counts['high'] > 0 or counts['medium'] > 5:
        grade = 'Good'
    else:
        grade = 'Excellent'

    # Extract assessments for display
    assessments = {}
    for scanner_key, meta in all_meta.items():
        for akey in ('cohesion_analysis', 'autonomous_assessment', 'skill_understanding',
                      'agent_identity', 'skill_identity', 'prompt_health',
                      'skillmd_assessment', 'top_insights'):
            if akey in meta:
                assessments[akey] = meta[akey]
        if 'summary' in meta:
            s = meta['summary']
            if 'craft_assessment' in s:
                assessments['craft_assessment'] = s['craft_assessment']
            if 'overall_cohesion' in s:
                assessments['overall_cohesion'] = s['overall_cohesion']

    # Skill name from path
    sp = detected_skill_path or str(report_dir)
    skill_name = Path(sp).name

    return {
        'meta': {
            'skill_name': skill_name,
            'skill_path': detected_skill_path or '',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'scanner_count': len([f for f in json_files if '-temp' in f.name]),
            'report_dir': str(report_dir),
        },
        'executive_summary': {
            'total_issues': total_issues,
            'counts': counts,
            'enhancement_count': enhancement_count,
            'strength_count': strength_count,
            'grade': grade,
            'craft_assessment': assessments.get('craft_assessment', ''),
            'overall_cohesion': assessments.get('overall_cohesion', ''),
        },
        'items': all_items,
        'journeys': journeys,
        'assessments': assessments,
        'section_labels': SECTION_LABELS,
    }


# =============================================================================
# HTML Generation
# =============================================================================

HTML_TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Quality Report: SKILL_NAME_PLACEHOLDER</title>
<style>
:root {
  --bg: #0d1117; --surface: #161b22; --surface2: #21262d; --border: #30363d;
  --text: #e6edf3; --text-muted: #8b949e; --text-dim: #6e7681;
  --critical: #f85149; --high: #f0883e; --medium: #d29922; --low: #58a6ff;
  --strength: #3fb950; --suggestion: #a371f7; --info: #8b949e;
  --accent: #58a6ff; --accent-hover: #79c0ff;
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #ffffff; --surface: #f6f8fa; --surface2: #eaeef2; --border: #d0d7de;
    --text: #1f2328; --text-muted: #656d76; --text-dim: #8c959f;
    --critical: #cf222e; --high: #bc4c00; --medium: #9a6700; --low: #0969da;
    --strength: #1a7f37; --suggestion: #8250df; --info: #656d76;
    --accent: #0969da; --accent-hover: #0550ae;
  }
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: var(--font); background: var(--bg); color: var(--text); line-height: 1.5; padding: 2rem; max-width: 960px; margin: 0 auto; padding-bottom: 6rem; }
h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
.subtitle { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem; }
.badge { display: inline-flex; align-items: center; padding: 0.15rem 0.5rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; border: 2px solid transparent; transition: all 0.15s; user-select: none; }
.badge:hover { filter: brightness(1.2); }
.badge.active { border-color: currentColor; }
.badge-critical { background: color-mix(in srgb, var(--critical) 20%, transparent); color: var(--critical); }
.badge-high { background: color-mix(in srgb, var(--high) 20%, transparent); color: var(--high); }
.badge-medium { background: color-mix(in srgb, var(--medium) 20%, transparent); color: var(--medium); }
.badge-low { background: color-mix(in srgb, var(--low) 20%, transparent); color: var(--low); }
.badge-strength { background: color-mix(in srgb, var(--strength) 20%, transparent); color: var(--strength); }
.badge-suggestion, .badge-note { background: color-mix(in srgb, var(--suggestion) 20%, transparent); color: var(--suggestion); }
.badge-high-opportunity { background: color-mix(in srgb, var(--high) 20%, transparent); color: var(--high); }
.badge-medium-opportunity { background: color-mix(in srgb, var(--medium) 20%, transparent); color: var(--medium); }
.badge-low-opportunity { background: color-mix(in srgb, var(--low) 20%, transparent); color: var(--low); }
.badge-info { background: color-mix(in srgb, var(--info) 20%, transparent); color: var(--info); }
.grade { font-size: 2rem; font-weight: 700; }
.grade-Excellent { color: var(--strength); }
.grade-Good { color: var(--low); }
.grade-Fair { color: var(--medium); }
.grade-Poor { color: var(--critical); }
.summary-grid { display: grid; grid-template-columns: auto 1fr; gap: 0.75rem 2rem; margin: 1rem 0; align-items: baseline; }
.summary-grid dt { color: var(--text-muted); font-size: 0.85rem; }
.summary-grid dd { font-size: 0.95rem; }
.filters { display: flex; gap: 0.5rem; flex-wrap: wrap; margin: 1rem 0; }
.section { border: 1px solid var(--border); border-radius: 0.5rem; margin: 0.75rem 0; overflow: hidden; }
.section-header { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: var(--surface); cursor: pointer; user-select: none; }
.section-header:hover { background: var(--surface2); }
.section-header .arrow { font-size: 0.7rem; transition: transform 0.15s; color: var(--text-muted); width: 1rem; }
.section-header.open .arrow { transform: rotate(90deg); }
.section-header .label { font-weight: 600; flex: 1; }
.section-header .count { font-size: 0.8rem; color: var(--text-muted); }
.section-body { display: none; }
.section-body.open { display: block; }
.item { display: flex; gap: 0.75rem; padding: 0.75rem 1rem; border-top: 1px solid var(--border); align-items: flex-start; }
.item:hover { background: var(--surface); }
.item-check { margin-top: 0.2rem; accent-color: var(--accent); flex-shrink: 0; }
.item-body { flex: 1; min-width: 0; }
.item-title { font-weight: 600; font-size: 0.9rem; }
.item-file { font-family: var(--mono); font-size: 0.75rem; color: var(--text-muted); }
.item-desc { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem; }
.item-action { font-size: 0.85rem; margin-top: 0.25rem; }
.item-action strong { color: var(--strength); }
.item-impact { font-size: 0.8rem; color: var(--text-dim); margin-top: 0.2rem; font-style: italic; }
.item-actions { flex-shrink: 0; display: flex; gap: 0.25rem; }
.copy-btn { background: none; border: 1px solid var(--border); border-radius: 0.25rem; padding: 0.2rem 0.4rem; cursor: pointer; color: var(--text-muted); font-size: 0.75rem; transition: all 0.15s; }
.copy-btn:hover { border-color: var(--accent); color: var(--accent); }
.copy-btn.copied { border-color: var(--strength); color: var(--strength); }
.journey { padding: 0.75rem 1rem; border-top: 1px solid var(--border); }
.journey h4 { font-size: 0.9rem; text-transform: capitalize; }
.journey p { font-size: 0.85rem; color: var(--text-muted); margin: 0.25rem 0; }
.journey ul { font-size: 0.85rem; padding-left: 1.25rem; margin: 0.25rem 0; }
.journey .friction { color: var(--high); }
.journey .bright { color: var(--strength); }
.assessment { padding: 0.75rem 1rem; border-top: 1px solid var(--border); }
.assessment table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 0.5rem; }
.assessment th, .assessment td { text-align: left; padding: 0.3rem 0.5rem; border-bottom: 1px solid var(--border); }
.assessment th { color: var(--text-muted); font-weight: 600; }
.sticky-footer { position: fixed; bottom: 0; left: 0; right: 0; background: var(--surface); border-top: 1px solid var(--border); padding: 0.75rem 2rem; display: flex; align-items: center; justify-content: center; gap: 1rem; z-index: 100; transition: transform 0.2s; }
.sticky-footer.hidden { transform: translateY(100%); }
.gen-btn { background: var(--accent); color: #fff; border: none; padding: 0.5rem 1.25rem; border-radius: 0.375rem; cursor: pointer; font-weight: 600; font-size: 0.9rem; }
.gen-btn:hover { background: var(--accent-hover); }
.sel-count { font-size: 0.9rem; color: var(--text-muted); }
.modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200; align-items: center; justify-content: center; }
.modal-overlay.visible { display: flex; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 0.5rem; padding: 1.5rem; width: 90%; max-width: 700px; max-height: 80vh; overflow-y: auto; }
.modal h3 { margin-bottom: 0.75rem; }
.modal pre { background: var(--bg); border: 1px solid var(--border); border-radius: 0.375rem; padding: 1rem; font-family: var(--mono); font-size: 0.8rem; white-space: pre-wrap; word-wrap: break-word; max-height: 50vh; overflow-y: auto; }
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1rem; justify-content: flex-end; }
.modal-actions button { padding: 0.4rem 1rem; border-radius: 0.375rem; cursor: pointer; font-size: 0.85rem; }
.modal-close { background: var(--surface2); border: 1px solid var(--border); color: var(--text); }
.modal-copy { background: var(--accent); border: none; color: #fff; font-weight: 600; }
.empty-msg { color: var(--text-dim); font-size: 0.85rem; padding: 1rem; font-style: italic; }
</style>
</head>
<body>

<h1>Quality Report: <span id="skill-name"></span></h1>
<div class="subtitle" id="subtitle"></div>

<div id="exec-summary"></div>

<div class="filters" id="filters"></div>

<div id="sections"></div>

<div class="sticky-footer hidden" id="footer">
  <span class="sel-count"><span id="sel-count">0</span> selected</span>
  <button class="gen-btn" onclick="showBatchPrompt()">Generate Prompt</button>
</div>

<div class="modal-overlay" id="modal" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <h3 id="modal-title">Generated Prompt</h3>
    <pre id="modal-content"></pre>
    <div class="modal-actions">
      <button class="modal-close" onclick="closeModal()">Close</button>
      <button class="modal-copy" onclick="copyModal()">Copy to Clipboard</button>
    </div>
  </div>
</div>

<script>
const DATA = JSON.parse(document.getElementById('report-data').textContent);
const selected = new Set();

function init() {
  const m = DATA.meta;
  const es = DATA.executive_summary;
  document.getElementById('skill-name').textContent = m.skill_name;
  document.getElementById('subtitle').textContent = `${m.skill_path} \u2022 ${m.timestamp.split('T')[0]} \u2022 ${m.scanner_count} scanners`;

  // Executive summary
  let html = `<div class="grade grade-${es.grade}">${es.grade}</div>`;
  html += `<dl class="summary-grid">`;
  html += `<dt>Issues</dt><dd>${es.total_issues} total \u2014 ${es.counts.critical} critical, ${es.counts.high} high, ${es.counts.medium} medium, ${es.counts.low} low</dd>`;
  if (es.enhancement_count) html += `<dt>Enhancements</dt><dd>${es.enhancement_count} opportunities identified</dd>`;
  if (es.strength_count) html += `<dt>Strengths</dt><dd>${es.strength_count} noted</dd>`;
  if (es.craft_assessment) html += `<dt>Craft</dt><dd>${esc(es.craft_assessment)}</dd>`;
  if (es.overall_cohesion) html += `<dt>Cohesion</dt><dd>${esc(es.overall_cohesion)}</dd>`;
  html += `</dl>`;
  document.getElementById('exec-summary').innerHTML = html;

  // Severity filters
  renderFilters();

  // Sections
  renderSections();
}

// --- Severity filters ---
const activeFilters = new Set(['critical','high','medium','low','high-opportunity','medium-opportunity','low-opportunity','strength','suggestion','note','info']);

function renderFilters() {
  const counts = {};
  DATA.items.forEach(i => { counts[i.severity] = (counts[i.severity]||0) + 1; });
  const order = ['critical','high','medium','low','high-opportunity','medium-opportunity','low-opportunity','strength','suggestion','note'];
  let html = '';
  order.forEach(s => {
    if (!counts[s]) return;
    const active = activeFilters.has(s) ? 'active' : '';
    html += `<span class="badge badge-${s} ${active}" data-sev="${s}" onclick="toggleFilter('${s}')">${s.replace('-',' ')} ${counts[s]}</span>`;
  });
  document.getElementById('filters').innerHTML = html;
}

function toggleFilter(sev) {
  if (activeFilters.has(sev)) activeFilters.delete(sev); else activeFilters.add(sev);
  renderFilters();
  renderSections();
}

// --- Sections ---
function renderSections() {
  const groups = {};
  const sectionOrder = ['structural','structure-capabilities','prompt-craft','cohesion','efficiency','quality','scripts','script-opportunities','creative'];

  DATA.items.forEach(i => {
    if (!activeFilters.has(i.severity)) return;
    const s = i.section;
    if (!groups[s]) groups[s] = [];
    groups[s].push(i);
  });

  // Truly broken (always first, always open)
  const broken = DATA.items.filter(i => i.type === 'issue' && (i.severity === 'critical' || i.severity === 'high'));
  const brokenIds = new Set(broken.map(i => i.id));
  // Strengths
  const strengths = DATA.items.filter(i => i.type === 'strength' && activeFilters.has(i.severity));

  let html = '';

  if (broken.length) {
    html += renderSection('truly-broken', `Truly Broken / Missing (${broken.length})`, broken, true);
  }
  if (strengths.length) {
    html += renderSection('strengths', `Strengths (${strengths.length})`, strengths, false);
  }

  sectionOrder.forEach(sec => {
    // Exclude strengths (shown above) and items already in Truly Broken
    const items = (groups[sec] || []).filter(i => i.type !== 'strength' && !brokenIds.has(i.id));
    if (!items.length) return;
    const label = DATA.section_labels[sec] || sec;
    html += renderSection(sec, `${label} (${items.length})`, items, false);
  });

  // User journeys
  if (DATA.journeys.length) {
    html += renderJourneysSection();
  }

  // Assessments
  if (Object.keys(DATA.assessments).length) {
    html += renderAssessmentsSection();
  }

  document.getElementById('sections').innerHTML = html;
}

function renderSection(id, label, items, startOpen) {
  const openCls = startOpen ? 'open' : '';
  let html = `<div class="section"><div class="section-header ${openCls}" onclick="toggleSection(this)">`;
  html += `<span class="arrow">\u25B6</span><span class="label">${label}</span>`;
  html += `</div><div class="section-body ${openCls}">`;
  items.forEach(i => { html += renderItem(i); });
  html += `</div></div>`;
  return html;
}

function renderItem(item) {
  const isStrength = item.type === 'strength';
  const chk = item.selectable ? `<input type="checkbox" class="item-check" data-id="${item.id}" ${selected.has(item.id)?'checked':''} onchange="toggleSelect('${item.id}', this.checked)">` : '';
  const sev = `<span class="badge badge-${item.severity}">${item.severity.replace('-',' ')}</span>`;
  const file = item.file ? `<span class="item-file">${esc(item.file)}${item.line ? ':'+item.line : ''}</span>` : '';
  const desc = item.description && item.description !== item.title ? `<div class="item-desc">${esc(item.description)}</div>` : '';
  // Suppress action/impact for strengths — "N/A" is noise
  const actionText = item.action && !isStrength && item.action !== 'N/A' ? item.action : '';
  const action = actionText ? `<div class="item-action"><strong>${item.action_type === 'fix' ? 'Fix' : item.action_type === 'create-script' ? 'Script' : 'Suggestion'}:</strong> ${esc(actionText)}</div>` : '';
  const impactText = item.impact && !isStrength && item.impact !== 'N/A' ? item.impact : '';
  const impact = impactText ? `<div class="item-impact">Impact: ${esc(impactText)}</div>` : '';
  const copyBtn = item.selectable ? `<button class="copy-btn" onclick="copySinglePrompt('${item.id}')" title="Copy prompt for this item">\u2398</button>` : '';

  return `<div class="item">${chk}<div class="item-body">${sev} ${file}<div class="item-title">${esc(item.title)}</div>${desc}${action}${impact}</div><div class="item-actions">${copyBtn}</div></div>`;
}

function renderJourneysSection() {
  let html = `<div class="section"><div class="section-header" onclick="toggleSection(this)">`;
  html += `<span class="arrow">\u25B6</span><span class="label">User Journeys (${DATA.journeys.length})</span>`;
  html += `</div><div class="section-body">`;
  DATA.journeys.forEach(j => {
    html += `<div class="journey"><h4>${esc(j.archetype)}</h4>`;
    html += `<p>${esc(j.journey_summary)}</p>`;
    if (j.friction_points && j.friction_points.length) {
      html += `<ul class="friction">`;
      j.friction_points.forEach(fp => { html += `<li>${esc(fp)}</li>`; });
      html += `</ul>`;
    }
    if (j.bright_spots && j.bright_spots.length) {
      html += `<ul class="bright">`;
      j.bright_spots.forEach(bs => { html += `<li>${esc(bs)}</li>`; });
      html += `</ul>`;
    }
    html += `</div>`;
  });
  html += `</div></div>`;
  return html;
}

function renderAssessmentsSection() {
  let html = `<div class="section"><div class="section-header" onclick="toggleSection(this)">`;
  html += `<span class="arrow">\u25B6</span><span class="label">Assessments & Analysis</span>`;
  html += `</div><div class="section-body">`;

  const ca = DATA.assessments.cohesion_analysis;
  if (ca) {
    html += `<div class="assessment"><h4>Cohesion Analysis</h4><table><tr><th>Dimension</th><th>Score</th><th>Notes</th></tr>`;
    Object.entries(ca).forEach(([dim, val]) => {
      if (typeof val === 'object' && val.score) {
        html += `<tr><td>${esc(dim.replace(/_/g, ' '))}</td><td>${esc(val.score)}</td><td>${esc(val.notes || '')}</td></tr>`;
      }
    });
    html += `</table></div>`;
  }

  const aa = DATA.assessments.autonomous_assessment;
  if (aa) {
    html += `<div class="assessment"><h4>Autonomous Readiness</h4><table>`;
    html += `<tr><td>Overall Potential</td><td>${esc(aa.potential||aa.overall_potential||'')}</td></tr>`;
    html += `<tr><td>HITL Points</td><td>${aa.hitl_points||aa.hitl_interaction_points||0}</td></tr>`;
    html += `<tr><td>Auto-Resolvable</td><td>${aa.auto_resolvable||0}</td></tr>`;
    html += `<tr><td>Needs Input</td><td>${aa.needs_input||0}</td></tr>`;
    if (aa.notes) html += `<tr><td>Notes</td><td>${esc(aa.notes)}</td></tr>`;
    html += `</table></div>`;
  }

  const ti = DATA.assessments.top_insights;
  if (ti && ti.length) {
    html += `<div class="assessment"><h4>Top Insights</h4>`;
    ti.forEach(t => {
      const tiTitle = t.title || t.insight || '';
      const tiDetail = t.detail || t.why_it_matters || '';
      const tiAction = t.action || t.suggestion || '';
      html += `<div style="margin:0.5rem 0"><strong>${esc(tiTitle)}</strong>`;
      if (tiDetail) html += `<br><em>Context:</em> ${esc(tiDetail)}`;
      if (tiAction) html += `<br><em>Suggestion:</em> ${esc(tiAction)}`;
      html += `</div>`;
    });
    html += `</div>`;
  }

  html += `</div></div>`;
  return html;
}

// --- Interactions ---
function toggleSection(el) {
  el.classList.toggle('open');
  el.nextElementSibling.classList.toggle('open');
}

function toggleSelect(id, checked) {
  if (checked) selected.add(id); else selected.delete(id);
  document.getElementById('sel-count').textContent = selected.size;
  document.getElementById('footer').classList.toggle('hidden', selected.size === 0);
}

// --- Prompt Generation ---
function itemById(id) { return DATA.items.find(i => i.id === id); }

function buildPromptForItem(item) {
  let p = '';
  const sev = item.severity.replace('-', ' ').toUpperCase();
  const loc = item.file ? `${item.file}${item.line ? ':'+item.line : ''}` : '';
  p += `**[${sev}] ${item.title}**\n`;
  if (loc) p += `- File: ${loc}\n`;
  if (item.description && item.description !== item.title) p += `- Context: ${item.description}\n`;
  if (item.action) {
    const label = item.action_type === 'fix' ? 'Fix' : item.action_type === 'create-script' ? 'Create script' : 'Suggestion';
    p += `- ${label}: ${item.action}\n`;
  }
  if (item.impact) p += `- Impact: ${item.impact}\n`;
  return p;
}

function buildPrompt(ids) {
  const items = ids.map(itemById).filter(Boolean);
  const fixes = items.filter(i => i.action_type === 'fix');
  const scripts = items.filter(i => i.action_type === 'create-script');
  const enhancements = items.filter(i => i.action_type === 'enhance' || i.action_type === 'refactor');

  let prompt = `## Task: Quality Improvements for ${DATA.meta.skill_name}\nSkill path: ${DATA.meta.skill_path}\n\n`;

  if (fixes.length) {
    prompt += `### Fix These Issues (${fixes.length})\n\n`;
    fixes.forEach((item, i) => { prompt += `${i+1}. ${buildPromptForItem(item)}\n`; });
  }
  if (scripts.length) {
    prompt += `### Create These Scripts (${scripts.length})\n\n`;
    scripts.forEach((item, i) => { prompt += `${i+1}. ${buildPromptForItem(item)}\n`; });
  }
  if (enhancements.length) {
    prompt += `### Implement These Enhancements (${enhancements.length})\n\n`;
    enhancements.forEach((item, i) => { prompt += `${i+1}. ${buildPromptForItem(item)}\n`; });
  }
  return prompt.trim();
}

function copySinglePrompt(id) {
  const item = itemById(id);
  if (!item) return;
  let prompt = `## Task: Quality Fix for ${DATA.meta.skill_name}\nSkill path: ${DATA.meta.skill_path}\n\n`;
  prompt += buildPromptForItem(item);
  navigator.clipboard.writeText(prompt).then(() => {
    const btn = document.querySelector(`[onclick="copySinglePrompt('${id}')"]`);
    if (btn) { btn.classList.add('copied'); btn.textContent = '\u2713'; setTimeout(() => { btn.classList.remove('copied'); btn.textContent = '\u2398'; }, 1500); }
  });
}

function showBatchPrompt() {
  const prompt = buildPrompt([...selected]);
  document.getElementById('modal-content').textContent = prompt;
  document.getElementById('modal').classList.add('visible');
}

function closeModal() { document.getElementById('modal').classList.remove('visible'); }

function copyModal() {
  const text = document.getElementById('modal-content').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.modal-copy');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy to Clipboard'; }, 1500);
  });
}

function esc(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = String(s);
  return d.innerHTML;
}

init();
</script>
</body>
</html>"""


def generate_html(report_data: dict) -> str:
    """Inject report data into the HTML template."""
    data_json = json.dumps(report_data, indent=None, ensure_ascii=False)
    # Embed the JSON as a script tag before the main script
    data_tag = f'<script id="report-data" type="application/json">{data_json}</script>'
    # Insert before the main <script> tag
    html = HTML_TEMPLATE.replace('<script>\nconst DATA', f'{data_tag}\n<script>\nconst DATA')
    html = html.replace('SKILL_NAME_PLACEHOLDER', report_data['meta']['skill_name'])
    return html


# =============================================================================
# CLI
# =============================================================================

def main() -> int:
    parser = argparse.ArgumentParser(
        description='Generate interactive HTML quality report from scanner JSON files',
    )
    parser.add_argument(
        'report_dir',
        type=Path,
        help='Directory containing *-temp.json and *-prepass.json files',
    )
    parser.add_argument(
        '--skill-path',
        help='Path to the skill being scanned (auto-detected from JSON if omitted)',
    )
    parser.add_argument(
        '--open',
        action='store_true',
        help='Open the HTML report in the default browser',
    )
    parser.add_argument(
        '--output', '-o',
        type=Path,
        help='Output HTML file path (default: {report_dir}/quality-report.html)',
    )
    args = parser.parse_args()

    if not args.report_dir.is_dir():
        print(f'Error: {args.report_dir} is not a directory', file=sys.stderr)
        return 2

    report_data = load_report_data(args.report_dir, args.skill_path)

    if not report_data['items']:
        print('Warning: No scanner data found in directory', file=sys.stderr)

    html = generate_html(report_data)

    output_path = args.output or (args.report_dir / 'quality-report.html')
    output_path.write_text(html, encoding='utf-8')
    print(json.dumps({
        'html_report': str(output_path),
        'items': len(report_data['items']),
        'issues': report_data['executive_summary']['total_issues'],
        'grade': report_data['executive_summary']['grade'],
    }))

    if args.open:
        system = platform.system()
        if system == 'Darwin':
            subprocess.run(['open', str(output_path)])
        elif system == 'Linux':
            subprocess.run(['xdg-open', str(output_path)])
        elif system == 'Windows':
            subprocess.run(['start', str(output_path)], shell=True)

    return 0


if __name__ == '__main__':
    sys.exit(main())
