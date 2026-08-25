# Security Policy

## Supported versions

Only the latest published release receives security fixes. There are no maintenance branches and no backports.

| Version | Supported |
|---------|-----------|
| 4.0.x   | ✅ |
| < 4.0   | ❌ — upgrade to the latest release |

If you are on an older version, `npx -p convoke-agents convoke-update` will bring you current. See the [Update Guide](UPDATE-GUIDE.md).

Convoke requires **Node.js 18 or later**. Vulnerabilities that only reproduce on an unsupported Node version are out of scope.

## Reporting a vulnerability

**Do not open a public issue.**

Report privately through GitHub: **[Report a vulnerability](https://github.com/amalik/convoke-agents/security/advisories/new)** — this opens a draft security advisory visible only to you and the maintainer.

Please include:

- The version of Convoke and of Node.js
- What an attacker can do — the impact, not just the flaw
- Steps to reproduce, ideally a minimal case
- Any suggested fix, if you have one

**What to expect:** an acknowledgement within 7 days, and an assessment within 21. If the report is accepted, you will be credited in the advisory and the changelog unless you ask not to be. If it is declined, you will be told why rather than left waiting.

## Scope

Convoke installs agent definitions, workflows, and CLI scripts into a project directory. Reports in scope include:

- Path traversal or arbitrary write during install, update, migration, or export
- Command injection through any `convoke-*` CLI argument or configuration value
- Supply-chain issues in published artifacts — tampered tarball contents, missing or invalid provenance
- Credential or token exposure in scripts, logs, or published files

Out of scope:

- Vulnerabilities in [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD) itself — report those upstream
- The behaviour of any language model an agent is run against
- Advisories in `devDependencies`, which are not shipped (CI audits with `npm audit --omit=dev`)
