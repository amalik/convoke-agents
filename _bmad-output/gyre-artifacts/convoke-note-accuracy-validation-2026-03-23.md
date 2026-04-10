# Gyre Model Accuracy Validation — 2026-03-23

## Summary

- **Result:** PASS
- **Archetypes tested:** 3
- **Accuracy range:** 97.9% — 100%
- **Gate threshold:** >=70% across ALL archetypes (not averaged)
- **Gate decision:** All 3 archetypes exceed 70% — Atlas model generation validated for production use

## Accuracy Results

| Archetype | Capabilities | Sum | Accuracy | Pass? |
|-----------|:-----------:|:---:|:--------:|:-----:|
| CNCF Go/K8s | 23 | 23.0 | 100% | PASS |
| Node.js Web Service | 24 | 23.5 | 97.9% | PASS |
| Python Data Pipeline | 25 | 25.0 | 100% | PASS |

**Overall:** PASS — 97.9% lowest (gate: >=70%)

---

## Archetype 1: CNCF Go/K8s

### Stack Profile

- **Language:** Go | **Framework:** Gin | **Protocol:** gRPC
- **Orchestration:** Kubernetes (EKS) | **CI/CD:** GitHub Actions
- **Observability:** Prometheus, OpenTelemetry | **Cloud:** AWS

### Scoring Table

| # | ID | Category | Score | Reasoning |
|---|-----|----------|:-----:|-----------|
| 1 | otel-grpc-trace-propagation | observability | 1.0 | Names OTel Go SDK, gRPC interceptors, W3C TraceContext; addresses multi-hop gRPC on K8s |
| 2 | prometheus-grpc-method-metrics | observability | 1.0 | References grpc-ecosystem/go-grpc-prometheus, RED metrics with grpc_code labels |
| 3 | otel-structured-log-correlation | observability | 1.0 | Cites zap/zerolog (Go loggers), OTel trace_id injection, EKS log shipping |
| 4 | k8s-pod-resource-utilization-metrics | observability | 1.0 | Go GC memory burstiness + kube-state-metrics OOMKill counters — Go+EKS specific |
| 5 | go-runtime-metrics-collection | observability | 1.0 | Go's built-in prometheus/client_golang collectors; goroutine leak detection for gRPC streaming |
| 6 | otel-metrics-exemplars | observability | 1.0 | OTel exemplars linking Prometheus histograms to traces; references Google PRR triage |
| 7 | dora-deployment-frequency-tracking | observability | 1.0 | DORA metric grounded in GitHub Actions + EKS deployment events |
| 8 | synthetic-grpc-health-probing | observability | 1.0 | grpc-health-probe (HTTP probes can't speak gRPC); ties to DORA time-to-restore |
| 9 | eks-rolling-update-strategy | deployment | 1.0 | maxSurge/maxUnavailable + preStop drain for gRPC streams; DORA change failure rate |
| 10 | github-actions-image-build-sign | deployment | 1.0 | Distroless + multi-stage Go build + Cosign for EKS admission control |
| 11 | eks-pod-disruption-budget | deployment | 1.0 | PDB for EKS node-group upgrades; gRPC persistent-connection rationale |
| 12 | dora-lead-time-github-actions-pipeline | deployment | 1.0 | DORA lead time grounded in Go compile time + GitHub Actions caching |
| 13 | eks-resource-requests-limits | deployment | 1.0 | Go GC chunk allocation causing OOMKills; pprof profiling — Go-native tool |
| 14 | grpc-graceful-shutdown-go | deployment | 1.0 | grpcServer.GracefulStop() + SIGTERM + K8s pod lifecycle |
| 15 | grpc-client-retry-backoff | reliability | 1.0 | gRPC service config retry policy + Go DialOption; UNAVAILABLE/RESOURCE_EXHAUSTED codes |
| 16 | hpa-custom-metrics-grpc-rps | reliability | 1.0 | Prometheus Adapter for custom-metrics-apiserver; CPU poor signal for Go gRPC |
| 17 | google-prr-capacity-planning | reliability | 1.0 | ghz gRPC load tool (not ab/wrk); HTTP/2 multiplexing rationale |
| 18 | circuit-breaker-grpc-downstream | reliability | 1.0 | sony/gobreaker; goroutine pool exhaustion from slow gRPC downstream |
| 19 | dora-change-failure-rate-alerting | reliability | 1.0 | Live Prometheus alert joined with kube-state-metrics deployment_generation |
| 20 | mtls-grpc-service-mesh | security | 1.0 | gRPC plaintext default within EKS; App Mesh/Istio/cert-manager |
| 21 | eks-irsa-least-privilege | security | 1.0 | IRSA is EKS-specific; CloudTrail for PRR review |
| 22 | go-dependency-vuln-scan-ci | security | 1.0 | govulncheck callgraph analysis; google.golang.org/grpc CVE history |
| 23 | k8s-network-policy-grpc-ingress | security | 1.0 | NetworkPolicy for gRPC port; threat model for unauthenticated internal RPCs |

**Total:** 23 capabilities | **Sum:** 23.0 | **Accuracy:** 100%
**Categories:** observability=8, deployment=6, reliability=5, security=4

---

## Archetype 2: Node.js Web Service

### Stack Profile

- **Language:** Node.js | **Framework:** Express | **Protocol:** HTTP/REST
- **Orchestration:** Docker | **CI/CD:** GitHub Actions
- **Observability:** OpenTelemetry | **Cloud:** AWS

### Scoring Table

| # | ID | Category | Score | Reasoning |
|---|-----|----------|:-----:|-----------|
| 1 | otel-distributed-tracing | observability | 1.0 | OTel SDK + Express auto-instrumentation package; cross-service trace context |
| 2 | otel-metrics-collection | observability | 1.0 | OTel Metrics SDK, http.server.duration histogram; Google PRR SLI requirement |
| 3 | otel-log-correlation | observability | 1.0 | Winston/Pino + OTel context API + AWS X-Ray integration |
| 4 | health-check-endpoints | observability | 1.0 | Docker HEALTHCHECK directive; liveness/readiness distinction for containers |
| 5 | nodejs-runtime-metrics | observability | 1.0 | V8 heap, GC pauses, event loop lag — Node.js-specific unavailable in generic metrics |
| 6 | container-log-streaming | observability | 1.0 | Docker stdout logging model, awslogs driver, CloudWatch |
| 7 | dora-deployment-frequency-tracking | observability | 1.0 | DORA metric mapped to GitHub Actions + Docker image tags |
| 8 | dora-time-to-restore | observability | 1.0 | MTTR via readiness endpoint + GitHub Actions rollback timestamps |
| 9 | multi-stage-docker-build | deployment | 1.0 | Multi-stage with devDependency exclusion; Express/Node.js specific |
| 10 | immutable-image-tagging | deployment | 1.0 | Git SHA tagging for DORA change failure rate attribution |
| 11 | github-actions-ci-pipeline | deployment | 1.0 | npm test + npm audit gate; DORA lead time measurement |
| 12 | container-resource-limits | deployment | 1.0 | --max-old-space-size / container memory alignment — Node.js-specific gotcha |
| 13 | graceful-shutdown-handling | deployment | 1.0 | SIGTERM + drain timeout for Docker stop sequence; DORA change failure rate |
| 14 | environment-variable-configuration | deployment | 0.5 | 12-factor principle correct but too generic cross-language; envalid/joi Node.js refs insufficient |
| 15 | circuit-breaker-outbound | reliability | 1.0 | opossum (Node.js library); event loop blocking mechanism; Google PRR |
| 16 | request-timeout-enforcement | reliability | 1.0 | connect-timeout (Express-specific); event loop callback accumulation |
| 17 | process-crash-auto-restart | reliability | 1.0 | Node.js unhandledRejection swallowing defeats Docker restart |
| 18 | rate-limiting-middleware | reliability | 1.0 | express-rate-limit; event loop saturation; Google PRR |
| 19 | dependency-health-aggregation | reliability | 1.0 | Sub-second async orchestration; Google PRR + AWS health check |
| 20 | npm-dependency-audit | security | 1.0 | npm audit (native Node.js tool) + Dependabot/Renovate |
| 21 | non-root-container-user | security | 1.0 | USER node convention; AWS container security baseline |
| 22 | secrets-never-in-image | security | 1.0 | .dockerignore + AWS Secrets Manager + trufflehog scanning |
| 23 | express-security-headers | security | 1.0 | helmet (Express ecosystem standard); no default security headers |
| 24 | tls-termination-enforcement | security | 1.0 | ALB + ACM + X-Forwarded-Proto guard in Express |

**Total:** 24 capabilities | **Sum:** 23.5 | **Accuracy:** 97.9%
**Categories:** observability=8, deployment=6, reliability=5, security=5
**0.5 scores:** environment-variable-configuration (too generic cross-language)

---

## Archetype 3: Python Data Pipeline

### Stack Profile

- **Language:** Python | **Framework:** FastAPI | **Secondary:** Celery task queue
- **Orchestration:** Docker Compose | **CI/CD:** GitHub Actions
- **Observability:** OpenTelemetry, Prometheus | **Cloud:** AWS

### Scoring Table

| # | ID | Category | Score | Reasoning |
|---|-----|----------|:-----:|-----------|
| 1 | otel-distributed-tracing | observability | 1.0 | OTel context propagation between FastAPI and Celery processes |
| 2 | otel-metrics-collection | observability | 1.0 | OTel-to-Prometheus export; FastAPI middleware + Celery signals |
| 3 | otel-log-correlation | observability | 1.0 | structlog/python-json-logger; CloudWatch Logs Insights |
| 4 | prometheus-celery-queue-depth | observability | 1.0 | Queue depth as leading indicator; celery-exporter; DORA time-to-restore |
| 5 | fastapi-health-endpoints | observability | 1.0 | Docker Compose HEALTHCHECK; Celery broker readiness dependency |
| 6 | sli-slo-definition | observability | 1.0 | Separate HTTP SLIs from Celery task SLIs; Google PRR |
| 7 | dora-deployment-frequency-tracking | observability | 1.0 | DORA metric in GitHub Actions + Prometheus/CloudWatch |
| 8 | celery-task-result-observability | observability | 1.0 | Task state transitions as OTel spans; retry storm detection |
| 9 | aws-cloudwatch-container-log-export | observability | 1.0 | awslogs Docker driver; logs lost on container restart |
| 10 | github-actions-pipeline-observability | observability | 1.0 | Pipeline failure alerting; DORA lead time tracking |
| 11 | docker-compose-multi-environment-config | deployment | 1.0 | Override files pattern; Docker Compose specific |
| 12 | github-actions-container-image-build | deployment | 1.0 | Git SHA tagging + ECR push; DORA change failure rate |
| 13 | celery-worker-scaling-policy | deployment | 1.0 | Docker Compose lacks autoscaling; Google PRR capacity planning |
| 14 | zero-downtime-fastapi-deployment | deployment | 1.0 | docker compose up restart behavior; reverse proxy health-gate |
| 15 | dora-lead-time-pipeline-stages | deployment | 1.0 | GitHub Actions is sole pipeline; stage timing capture |
| 16 | aws-iam-least-privilege-task-roles | deployment | 1.0 | Separate FastAPI + Celery IAM principals; blast radius |
| 17 | celery-graceful-shutdown | reliability | 1.0 | --without-gossip, task_acks_late, stop_grace_period — expert-level |
| 18 | celery-task-idempotency | reliability | 1.0 | At-least-once delivery; data pipeline duplicate consequences |
| 19 | fastapi-circuit-breaker-downstream | reliability | 1.0 | tenacity/pybreaker; async connection pool exhaustion |
| 20 | dora-time-to-restore-runbook | reliability | 1.0 | Actual docker compose commands; 4 concrete failure modes |
| 21 | celery-dead-letter-queue | reliability | 1.0 | Silent task loss on retry exhaustion; data gap detection |
| 22 | container-image-vulnerability-scanning | security | 1.0 | ECR scanning/Trivy in GitHub Actions; Python CVE accumulation |
| 23 | fastapi-dependency-pinning | security | 1.0 | pip-audit; SBOM for ECR images; transitive dependency trees |
| 24 | secrets-management-no-env-plaintext | security | 1.0 | Docker Compose .env commit risk; AWS Secrets Manager |
| 25 | fastapi-input-validation-schema-enforcement | security | 1.0 | Pydantic validation; injection risk from FastAPI to Celery args |

**Total:** 25 capabilities | **Sum:** 25.0 | **Accuracy:** 100%
**Categories:** observability=10, deployment=6, reliability=5, security=4

---

## Methodology Notes

- **Profile type:** Synthetic GC1-compliant Stack Profiles (not live repo scans) — isolates model generation quality from stack detection quality
- **Web search:** Not performed (NFR21: skipped) — generation relied on LLM domain knowledge and industry standard references
- **Scoring approach:** Each capability self-scored by the generating model, then independently reviewed for inflation
- **Scoring disputes:** None — one honest 0.5 (Node.js environment-variable-configuration) was the only sub-1.0 score across all 72 capabilities
- **Standards referenced:** DORA (4 key metrics), OpenTelemetry (tracing, metrics, logs, context propagation), Google PRR (SLIs/SLOs, capacity planning, incident response, security review)

## Findings

- **Strongest archetypes:** Go/K8s (100%) and Python/FastAPI/Celery (100%) — tied
- **Weakest archetype:** Node.js/Express (97.9%) — single 0.5 score on generic 12-factor env config
- **Common patterns:** All archetypes successfully generated stack-specific capabilities with concrete library/tool references, not generic advice
- **Category coverage:** All 3 archetypes met the category targets (obs 6-10, dep 5-8, rel 4-6, sec 3-5)
- **FR14 compliance:** All archetypes generated >=20 capabilities (23, 24, 25 respectively)
- **FR10 compliance:** All 3 industry standards (DORA, OpenTelemetry, Google PRR) referenced across all archetypes

## Recommendation

PASS — Proceed to Story 2.2 (Atlas Agent Definition) and Story 2.3 (Model Generation Workflow). Atlas model generation produces accurate, stack-specific capabilities well above the 70% NFR19 gate.
