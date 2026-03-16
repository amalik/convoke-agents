#!/usr/bin/env python3
"""BMad manifest CRUD and validation.

All manifest operations go through this script. Validation runs automatically
on every write. Prompts call this instead of touching JSON directly.

Usage:
    python3 scripts/manifest.py create <skill-path> [options]
    python3 scripts/manifest.py add-capability <skill-path> [options]
    python3 scripts/manifest.py update <skill-path> --set key=value [...]
    python3 scripts/manifest.py remove-capability <skill-path> --name <name>
    python3 scripts/manifest.py read <skill-path> [--capabilities|--capability <name>]
    python3 scripts/manifest.py validate <skill-path>
"""

# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "jsonschema>=4.0.0",
# ]
# ///

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

try:
    from jsonschema import Draft7Validator
except ImportError:
    print("Error: jsonschema required. Install with: pip install jsonschema", file=sys.stderr)
    sys.exit(2)

MANIFEST_FILENAME = "bmad-manifest.json"
SCHEMA_FILENAME = "bmad-manifest-schema.json"


def get_schema_path() -> Path:
    """Schema is co-located with this script."""
    return Path(__file__).parent / SCHEMA_FILENAME


def get_manifest_path(skill_path: Path) -> Path:
    return skill_path / MANIFEST_FILENAME


def load_schema() -> dict[str, Any]:
    path = get_schema_path()
    if not path.exists():
        print(f"Error: Schema not found: {path}", file=sys.stderr)
        sys.exit(2)
    with path.open() as f:
        return json.load(f)


def load_manifest(skill_path: Path) -> dict[str, Any]:
    path = get_manifest_path(skill_path)
    if not path.exists():
        return {}
    with path.open() as f:
        try:
            return json.load(f)
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON in {path}: {e}", file=sys.stderr)
            sys.exit(2)


def save_manifest(skill_path: Path, data: dict[str, Any]) -> bool:
    """Save manifest after validation. Returns True if valid and saved."""
    errors = validate(data)
    if errors:
        print(f"Validation failed with {len(errors)} error(s):", file=sys.stderr)
        for err in errors:
            print(f"  [{err['path']}] {err['message']}", file=sys.stderr)
        return False

    path = get_manifest_path(skill_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    return True


def validate(data: dict[str, Any]) -> list[dict[str, Any]]:
    """Validate manifest against schema. Returns list of errors."""
    schema = load_schema()
    validator = Draft7Validator(schema)
    errors = []
    for error in validator.iter_errors(data):
        errors.append({
            "path": ".".join(str(p) for p in error.path) if error.path else "root",
            "message": error.message,
        })
    return errors


def validate_extras(data: dict[str, Any]) -> list[str]:
    """Additional checks beyond schema validation."""
    warnings = []
    capabilities = data.get("capabilities", [])

    if not capabilities:
        warnings.append("No capabilities defined — every skill needs at least one")
        return warnings

    menu_codes: dict[str, str] = {}
    for i, cap in enumerate(capabilities):
        name = cap.get("name", f"<capability-{i}>")

        # Duplicate menu-code check
        mc = cap.get("menu-code", "")
        if mc and mc in menu_codes:
            warnings.append(f"Duplicate menu-code '{mc}' in '{menu_codes[mc]}' and '{name}'")
        elif mc:
            menu_codes[mc] = name

        # Both prompt and skill-name
        if "prompt" in cap and "skill-name" in cap:
            warnings.append(f"Capability '{name}' has both 'prompt' and 'skill-name' — pick one")

    return warnings


# --- Commands ---

def cmd_create(args: argparse.Namespace) -> int:
    skill_path = Path(args.skill_path).resolve()
    existing = load_manifest(skill_path)
    if existing:
        print(f"Error: Manifest already exists at {get_manifest_path(skill_path)}", file=sys.stderr)
        print("Use 'update' to modify or delete the file first.", file=sys.stderr)
        return 1

    data: dict[str, Any] = {}

    if args.module_code:
        data["module-code"] = args.module_code
    if args.replaces_skill:
        data["replaces-skill"] = args.replaces_skill
    if args.persona:
        data["persona"] = args.persona
    if args.has_memory:
        data["has-memory"] = True

    data["capabilities"] = []

    if save_manifest(skill_path, data):
        print(f"Created {get_manifest_path(skill_path)}")
        return 0
    return 1


def cmd_add_capability(args: argparse.Namespace) -> int:
    skill_path = Path(args.skill_path).resolve()
    data = load_manifest(skill_path)
    if not data:
        print("Error: No manifest found. Run 'create' first.", file=sys.stderr)
        return 1

    capabilities = data.setdefault("capabilities", [])

    # Check for duplicate name
    for cap in capabilities:
        if cap.get("name") == args.name:
            print(f"Error: Capability '{args.name}' already exists. Use 'update' to modify.", file=sys.stderr)
            return 1

    cap: dict[str, Any] = {
        "name": args.name,
        "menu-code": args.menu_code,
        "description": args.description,
    }

    if args.supports_autonomous:
        cap["supports-headless"] = True
    if args.prompt:
        cap["prompt"] = args.prompt
    if args.skill_name:
        cap["skill-name"] = args.skill_name
    if args.phase_name:
        cap["phase-name"] = args.phase_name
    if args.after:
        cap["after"] = args.after
    if args.before:
        cap["before"] = args.before
    if args.is_required:
        cap["is-required"] = True
    if args.output_location:
        cap["output-location"] = args.output_location

    capabilities.append(cap)

    if save_manifest(skill_path, data):
        print(f"Added capability '{args.name}' [{args.menu_code}]")
        return 0
    return 1


def cmd_update(args: argparse.Namespace) -> int:
    skill_path = Path(args.skill_path).resolve()
    data = load_manifest(skill_path)
    if not data:
        print("Error: No manifest found. Run 'create' first.", file=sys.stderr)
        return 1

    # Parse --set key=value pairs
    for pair in args.set:
        if "=" not in pair:
            print(f"Error: Invalid --set format '{pair}'. Use key=value.", file=sys.stderr)
            return 1
        key, value = pair.split("=", 1)

        # Handle boolean values
        if value.lower() == "true":
            value = True
        elif value.lower() == "false":
            value = False

        # Handle capability updates: capability.name.field=value
        if key.startswith("capability."):
            parts = key.split(".", 2)
            if len(parts) != 3:
                print(f"Error: Capability update format: capability.<name>.<field>=<value>", file=sys.stderr)
                return 1
            cap_name, field = parts[1], parts[2]
            found = False
            for cap in data.get("capabilities", []):
                if cap.get("name") == cap_name:
                    cap[field] = value
                    found = True
                    break
            if not found:
                print(f"Error: Capability '{cap_name}' not found.", file=sys.stderr)
                return 1
        else:
            # Handle removing fields with empty value
            if value == "":
                data.pop(key, None)
            else:
                data[key] = value

    if save_manifest(skill_path, data):
        print(f"Updated {get_manifest_path(skill_path)}")
        return 0
    return 1


def cmd_remove_capability(args: argparse.Namespace) -> int:
    skill_path = Path(args.skill_path).resolve()
    data = load_manifest(skill_path)
    if not data:
        print("Error: No manifest found.", file=sys.stderr)
        return 1

    capabilities = data.get("capabilities", [])
    original_len = len(capabilities)
    data["capabilities"] = [c for c in capabilities if c.get("name") != args.name]

    if len(data["capabilities"]) == original_len:
        print(f"Error: Capability '{args.name}' not found.", file=sys.stderr)
        return 1

    if save_manifest(skill_path, data):
        print(f"Removed capability '{args.name}'")
        return 0
    return 1


def cmd_read(args: argparse.Namespace) -> int:
    skill_path = Path(args.skill_path).resolve()
    data = load_manifest(skill_path)
    if not data:
        print("Error: No manifest found.", file=sys.stderr)
        return 1

    if args.capabilities:
        caps = data.get("capabilities", [])
        if args.json:
            print(json.dumps(caps, indent=2))
        else:
            for cap in caps:
                prompt_or_skill = cap.get("prompt", cap.get("skill-name", "(SKILL.md)"))
                auto = " [autonomous]" if cap.get("supports-headless") else ""
                print(f"  [{cap.get('menu-code', '??')}] {cap['name']} — {cap.get('description', '')}{auto}")
                print(f"       → {prompt_or_skill}")
        return 0

    if args.capability:
        for cap in data.get("capabilities", []):
            if cap.get("name") == args.capability:
                print(json.dumps(cap, indent=2))
                return 0
        print(f"Error: Capability '{args.capability}' not found.", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(data, indent=2))
    else:
        # Summary view
        is_agent = "persona" in data
        print(f"Type: {'Agent' if is_agent else 'Workflow/Skill'}")
        if data.get("module-code"):
            print(f"Module: {data['module-code']}")
        if is_agent:
            print(f"Persona: {data['persona'][:80]}...")
        if data.get("has-memory"):
            print("Memory: enabled")
        caps = data.get("capabilities", [])
        print(f"Capabilities: {len(caps)}")
        for cap in caps:
            prompt_or_skill = cap.get("prompt", cap.get("skill-name", "(SKILL.md)"))
            auto = " [autonomous]" if cap.get("supports-headless") else ""
            print(f"  [{cap.get('menu-code', '??')}] {cap['name']}{auto} → {prompt_or_skill}")
    return 0


def cmd_validate(args: argparse.Namespace) -> int:
    skill_path = Path(args.skill_path).resolve()
    data = load_manifest(skill_path)
    if not data:
        print("Error: No manifest found.", file=sys.stderr)
        return 1

    errors = validate(data)
    warnings = validate_extras(data)

    if args.json:
        print(json.dumps({
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
        }, indent=2))
    else:
        if not errors:
            print("✓ Manifest is valid")
        else:
            print(f"✗ {len(errors)} error(s):", file=sys.stderr)
            for err in errors:
                print(f"  [{err['path']}] {err['message']}", file=sys.stderr)

        if warnings:
            print(f"\n⚠ {len(warnings)} warning(s):", file=sys.stderr)
            for w in warnings:
                print(f"  {w}", file=sys.stderr)

    return 0 if not errors else 1


def main() -> int:
    parser = argparse.ArgumentParser(
        description="BMad manifest CRUD and validation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # create
    p_create = sub.add_parser("create", help="Create a new manifest")
    p_create.add_argument("skill_path", type=str, help="Path to skill directory")
    p_create.add_argument("--module-code", type=str)
    p_create.add_argument("--replaces-skill", type=str)
    p_create.add_argument("--persona", type=str)
    p_create.add_argument("--has-memory", action="store_true")

    # add-capability
    p_add = sub.add_parser("add-capability", help="Add a capability")
    p_add.add_argument("skill_path", type=str, help="Path to skill directory")
    p_add.add_argument("--name", required=True, type=str)
    p_add.add_argument("--menu-code", required=True, type=str)
    p_add.add_argument("--description", required=True, type=str)
    p_add.add_argument("--supports-autonomous", action="store_true")
    p_add.add_argument("--prompt", type=str, help="Relative path to prompt file")
    p_add.add_argument("--skill-name", type=str, help="External skill name")
    p_add.add_argument("--phase-name", type=str)
    p_add.add_argument("--after", nargs="*", help="Skill names that should run before this")
    p_add.add_argument("--before", nargs="*", help="Skill names this should run before")
    p_add.add_argument("--is-required", action="store_true")
    p_add.add_argument("--output-location", type=str)

    # update
    p_update = sub.add_parser("update", help="Update manifest fields")
    p_update.add_argument("skill_path", type=str, help="Path to skill directory")
    p_update.add_argument("--set", nargs="+", required=True, help="key=value pairs")

    # remove-capability
    p_remove = sub.add_parser("remove-capability", help="Remove a capability")
    p_remove.add_argument("skill_path", type=str, help="Path to skill directory")
    p_remove.add_argument("--name", required=True, type=str)

    # read
    p_read = sub.add_parser("read", help="Read manifest")
    p_read.add_argument("skill_path", type=str, help="Path to skill directory")
    p_read.add_argument("--capabilities", action="store_true", help="List capabilities only")
    p_read.add_argument("--capability", type=str, help="Show specific capability")
    p_read.add_argument("--json", action="store_true", help="JSON output")

    # validate
    p_validate = sub.add_parser("validate", help="Validate manifest")
    p_validate.add_argument("skill_path", type=str, help="Path to skill directory")
    p_validate.add_argument("--json", action="store_true", help="JSON output")

    args = parser.parse_args()

    commands = {
        "create": cmd_create,
        "add-capability": cmd_add_capability,
        "update": cmd_update,
        "remove-capability": cmd_remove_capability,
        "read": cmd_read,
        "validate": cmd_validate,
    }

    return commands[args.command](args)


if __name__ == "__main__":
    sys.exit(main())
