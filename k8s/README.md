# UPSC PrepX-AI - Kubernetes Deployment Guide

## Overview

This directory contains production-ready Kubernetes manifests for deploying UPSC PrepX-AI with:
- **Zero-trust security** (network policies, RBAC, pod security)
- **High availability** (multi-replica, PDBs, anti-affinity)
- **Auto-scaling** (HPA based on CPU, memory, custom metrics)
- **Observability** (Prometheus annotations, health probes)
- **TLS termination** (cert-manager integration)

---

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │         Ingress Controller              │
                    │         (nginx-ingress)                 │
                    └─────────────────┬───────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
    ┌─────────▼─────────┐   ┌─────────▼─────────┐   ┌─────────▼─────────┐
    │   upsc-web        │   │   upsc-api        │   │   upsc-worker     │
    │   Deployment      │   │   Deployment      │   │   Deployment      │
    │   (2-10 pods)     │   │   (2-15 pods)     │   │   (2-20 pods)     │
    │   HPA + PDB       │   │   HPA + PDB       │   │   HPA + PDB       │
    └─────────┬─────────┘   └─────────┬─────────┘   └─────────┬─────────┘
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
    ┌─────────▼─────────┐   ┌─────────▼─────────┐   ┌─────────▼─────────┐
    │   Redis           │   │   Supabase        │   │   AI Providers    │
    │   (External)      │   │   (External)      │   │   (External)      │
    │   :6379           │   │   :5432           │   │   :443            │
    └───────────────────┘   └───────────────────┘   └───────────────────┘
```

---

## Prerequisites

- Kubernetes cluster 1.25+
- kubectl configured
- nginx-ingress controller installed
- cert-manager installed (for TLS)
- metrics-server installed (for HPA)
- Container registry access (GHCR)

---

## Quick Start

### 1. Deploy to Kubernetes

```bash
# Navigate to k8s directory
cd k8s

# Apply all manifests
kubectl apply -k .

# Or apply individual files
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml
kubectl apply -f deployment-web.yaml
kubectl apply -f deployment-api.yaml
kubectl apply -f deployment-worker.yaml
kubectl apply -f services.yaml
kubectl apply -f ingress.yaml
kubectl apply -f hpa.yaml
kubectl apply -f pdb.yaml
kubectl apply -f networkpolicies.yaml
```

### 2. Verify Deployment

```bash
# Check namespace
kubectl get namespace upsc-prepx-ai

# Check deployments
kubectl get deployments -n upsc-prepx-ai

# Check pods
kubectl get pods -n upsc-prepx-ai

# Check services
kubectl get services -n upsc-prepx-ai

# Check ingress
kubectl get ingress -n upsc-prepx-ai

# Check HPA
kubectl get hpa -n upsc-prepx-ai
```

### 3. Monitor Rollout

```bash
# Watch deployment rollout
kubectl rollout status deployment/upsc-web -n upsc-prepx-ai
kubectl rollout status deployment/upsc-api -n upsc-prepx-ai
kubectl rollout status deployment/upsc-worker -n upsc-prepx-ai

# View pod logs
kubectl logs -f deployment/upsc-web -n upsc-prepx-ai
kubectl logs -f deployment/upsc-api -n upsc-prepx-ai
kubectl logs -f deployment/upsc-worker -n upsc-prepx-ai
```

---

## Configuration

### Update Images

Edit `kustomization.yaml`:

```yaml
images:
  - name: ghcr.io/varuniclinic07/upsc_ai-web
    newTag: v1.2.3
```

### Update Replicas

Edit deployment files or add patches to `kustomization.yaml`:

```yaml
patches:
  - patch: |-
      - op: replace
        path: /spec/replicas
        value: 5
    target:
      kind: Deployment
      name: upsc-web
```

### Update Resource Limits

Edit `resources` section in deployment files:

```yaml
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    cpu: "2000m"
    memory: "2Gi"
```

---

## TLS Configuration

### Option 1: cert-manager (Recommended)

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# ClusterIssuer is already defined in tls-secret.yaml
kubectl apply -f tls-secret.yaml
```

### Option 2: Manual TLS

```bash
# Generate certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt \
  -subj "/CN=upscbyvarunsh.aimasteryedu.in"

# Create secret
kubectl create secret tls upsc-tls-secret \
  --cert=tls.crt \
  --key=tls.key \
  -n upsc-prepx-ai
```

---

## Scaling

### Manual Scaling

```bash
kubectl scale deployment upsc-web --replicas=5 -n upsc-prepx-ai
kubectl scale deployment upsc-api --replicas=5 -n upsc-prepx-ai
kubectl scale deployment upsc-worker --replicas=10 -n upsc-prepx-ai
```

### Auto-scaling (HPA)

HPA is already configured. Check status:

```bash
kubectl get hpa -n upsc-prepx-ai
kubectl describe hpa upsc-web-hpa -n upsc-prepx-ai
```

### Adjust HPA Thresholds

Edit `hpa.yaml`:

```yaml
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # Scale at 70% CPU
```

---

## Security

### Network Policies

Network policies enforce zero-trust:

- Default deny all ingress/egress
- Web only accepts traffic from ingress controller
- API only accepts traffic from web and ingress
- Worker can reach Redis and external services
- Prometheus can scrape metrics

### Pod Security

- Run as non-root (user 1001)
- Read-only root filesystem
- Drop all capabilities
- No privilege escalation
- Seccomp profile: RuntimeDefault

### RBAC

- ServiceAccount with minimal permissions
- Role for pod/configmap/secret read-only
- RoleBinding to service account

---

## Monitoring

### Prometheus Integration

All pods have Prometheus annotations:

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3000"
  prometheus.io/path: "/api/metrics"
```

### Health Endpoints

| Service | Endpoint | Port |
|---------|----------|------|
| Web | /api/health | 3000 |
| API | /api/health | 3001 |
| Worker | /health | 3002 |

### Grafana Dashboards

Import dashboards for:
- Pod CPU/Memory utilization
- Request latency
- Error rates
- Queue depth (worker)

---

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl get pods -n upsc-prepx-ai

# Describe pod for events
kubectl describe pod <pod-name> -n upsc-prepx-ai

# Check logs
kubectl logs <pod-name> -n upsc-prepx-ai
```

### Image Pull Errors

```bash
# Verify registry secret
kubectl get secret ghcr-registry-secret -n upsc-prepx-ai -o yaml

# Re-create if needed
kubectl create secret docker-registry ghcr-registry-secret \
  --docker-server=ghcr.io \
  --docker-username=$GITHUB_ACTOR \
  --docker-password=$GITHUB_TOKEN \
  --docker-email=your@email.com \
  -n upsc-prepx-ai
```

### HPA Not Scaling

```bash
# Check metrics-server
kubectl get pods -n kube-system | grep metrics-server

# Check HPA status
kubectl describe hpa upsc-web-hpa -n upsc-prepx-ai

# Verify metrics available
kubectl top pods -n upsc-prepx-ai
```

### Network Policy Issues

```bash
# Test connectivity from web to api
kubectl run test --rm -it --image=alpine --namespace=upsc-prepx-ai -- sh
# Inside pod:
apk add curl
curl http://upsc-api:80/api/health
```

---

## Rollback

### Rollback Deployment

```bash
# View rollout history
kubectl rollout history deployment/upsc-web -n upsc-prepx-ai

# Rollback to previous
kubectl rollout undo deployment/upsc-web -n upsc-prepx-ai

# Rollback to specific revision
kubectl rollout undo deployment/upsc-web --to-revision=2 -n upsc-prepx-ai
```

### Emergency Rollback

```bash
# Scale down all deployments
kubectl scale deployment upsc-web --replicas=0 -n upsc-prepx-ai
kubectl scale deployment upsc-api --replicas=0 -n upsc-prepx-ai
kubectl scale deployment upsc-worker --replicas=0 -n upsc-prepx-ai

# Apply previous known-good config
kubectl apply -k . --namespace=upsc-prepx-ai

# Scale back up
kubectl scale deployment upsc-web --replicas=3 -n upsc-prepx-ai
```

---

## Environment Promotion

### Staging Environment

```bash
# Create staging namespace
kubectl create namespace upsc-prepx-staging

# Apply with staging overlay
kubectl apply -k overlays/staging
```

### Production Environment

```bash
# Apply with production overlay
kubectl apply -k overlays/production
```

---

## Resource Summary

| Component | Min Replicas | Max Replicas | CPU Request | Memory Request |
|-----------|--------------|--------------|-------------|----------------|
| Web | 2 | 10 | 250m | 512Mi |
| API | 2 | 15 | 250m | 512Mi |
| Worker | 2 | 20 | 500m | 1Gi |

---

## Files Summary

| File | Purpose |
|------|---------|
| `namespace.yaml` | Namespace isolation |
| `serviceaccount.yaml` | Service account + RBAC |
| `configmap.yaml` | Application configuration |
| `secrets.yaml` | Sensitive configuration |
| `tls-secret.yaml` | TLS certificates |
| `deployment-*.yaml` | Deployments with probes |
| `services.yaml` | ClusterIP services |
| `ingress.yaml` | TLS ingress routing |
| `hpa.yaml` | Horizontal pod autoscaler |
| `pdb.yaml` | Pod disruption budgets |
| `networkpolicies.yaml` | Zero-trust network policies |
| `kustomization.yaml` | Kustomize configuration |

---

## Next Steps

1. **Test in staging** before production
2. **Set up monitoring** (Prometheus + Grafana)
3. **Configure alerts** for failures
4. **Test failover** scenarios
5. **Document runbooks** for operations
