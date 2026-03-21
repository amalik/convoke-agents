---
step: 3
workflow: gap-analysis
title: Deployment Analysis
---

# Step 3: Deployment Analysis

For each deployment, reliability, and security capability, search the filesystem for implementation evidence.

## MANDATORY EXECUTION RULES

- Same rules as observability analysis: use tools, search for existence, cite methods, no file contents
- This step covers three GC2 categories: deployment, reliability, and security
- Finding IDs use prefix "DEP-" for all three categories in this domain

## ANALYSIS PATTERN

Same progressive search strategy as Step 2, applied to deployment-related capabilities.

### Capability-Specific Search Patterns

**Deployment:**

| Capability Pattern | Glob For | Grep For |
|-------------------|----------|----------|
| CI/CD pipeline | `.github/workflows/*`, `.gitlab-ci.yml`, `Jenkinsfile` | `deploy`, `release`, `publish`, `build` |
| Container config | `Dockerfile*`, `docker-compose*`, `*.dockerfile` | `HEALTHCHECK`, `EXPOSE`, `multi-stage` |
| K8s manifests | `k8s/**`, `manifests/**`, `helm/**` | `deployment`, `service`, `ingress`, `configmap` |
| Rollback strategy | `k8s/**`, `.github/workflows/*` | `rollback`, `revision`, `undo`, `canary`, `blue-green` |
| IaC | `terraform/**`, `*.tf`, `cloudformation/**`, `cdk.json` | `resource`, `module`, `stack` |
| Environment config | `**/.env*`, `**/config/**` | `environment`, `config`, `secret`, `env_var` |
| Deployment strategy | `k8s/**`, `.github/workflows/*` | `rollingUpdate`, `canary`, `blue-green`, `maxSurge` |

**Reliability:**

| Capability Pattern | Glob For | Grep For |
|-------------------|----------|----------|
| Graceful shutdown | `**/*shutdown*`, `**/*signal*` | `SIGTERM`, `SIGINT`, `graceful`, `drain` |
| Circuit breakers | `**/*circuit*`, `**/*retry*` | `circuit`, `breaker`, `retry`, `backoff`, `resilience` |
| Rate limiting | `**/*rate*limit*`, `**/*throttle*` | `rateLimit`, `throttle`, `rate_limit` |
| Dependency health | `**/*health*`, `**/*ping*` | `dependency.*check`, `upstream.*health`, `ping` |

**Security:**

| Capability Pattern | Glob For | Grep For |
|-------------------|----------|----------|
| Secrets management | `**/*secret*`, `**/*vault*` | `vault`, `secrets-manager`, `KMS`, `sealed-secret` |
| Vulnerability scanning | `.github/workflows/*`, `**/*security*` | `snyk`, `trivy`, `dependabot`, `renovate`, `audit` |
| Network policies | `k8s/**/*network*`, `**/*firewall*` | `NetworkPolicy`, `security-group`, `firewall` |
| Auth patterns | `**/*auth*`, `**/*jwt*`, `**/*oauth*` | `authentication`, `authorization`, `jwt`, `oauth`, `rbac` |
| Image scanning | `.github/workflows/*`, `**/*scan*` | `trivy`, `snyk container`, `docker.*scan`, `ecr.*scan` |

### Finding Classification and Tagging

Same as observability analysis (Step 2):
- Classify: present / absent / partial
- Tag with: id (DEP-NNN), domain, severity, source, confidence, capability_ref, description, evidence_summary, severity_rationale
- Source: `static-analysis` or `contextual-model`

### Severity Guidelines (Deployment Domain)

- `blocker`: Missing capability that creates deployment risk (e.g., no rollback mechanism, no graceful shutdown on K8s)
- `recommended`: Missing capability that reduces deployment safety or velocity (e.g., no canary strategy, no IaC)
- `nice-to-have`: Missing capability that would improve deployment hygiene (e.g., no image scanning, no network policies for non-sensitive service)

## OUTPUT

Store deployment findings in working memory alongside observability findings. Present brief progress:

```
Deployment analysis complete:
- [N] capabilities checked (deployment + reliability + security)
- [P] present (no gaps)
- [A] absent (gaps found)
- [R] partial (incomplete implementation)

**Combined findings so far:** [total] findings across both domains

Proceeding to cross-domain correlation...
```

---

## NEXT STEP

Load step: {project-root}/_bmad/bme/_gyre/workflows/gap-analysis/steps/step-04-cross-domain-correlation.md
