# Helm Charts Reference

## Chart Structure

```
mychart/
  Chart.yaml          # Chart metadata (name, version, dependencies)
  values.yaml         # Default configuration values
  values-staging.yaml # Environment-specific overrides
  values-production.yaml
  templates/          # Kubernetes manifest templates
    _helpers.tpl      # Template helper functions
    deployment.yaml
    service.yaml
    ingress.yaml
    configmap.yaml
    secret.yaml
    hpa.yaml
    pdb.yaml
    serviceaccount.yaml
    NOTES.txt         # Post-install instructions
  charts/             # Dependency charts (subcharts)
  .helmignore         # Files to exclude from packaging
```

## Chart.yaml

```yaml
apiVersion: v2
name: myapp
description: A Helm chart for the myapp microservice
type: application         # 'application' or 'library'
version: 1.2.0           # Chart version (semver)
appVersion: "3.4.1"      # Application version
kubeVersion: ">=1.27.0"  # Supported Kubernetes versions

dependencies:
  - name: postgresql
    version: "13.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled
  - name: redis
    version: "18.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: redis.enabled

maintainers:
  - name: Platform Team
    email: platform@example.com
```

## Values Design

### Principle: Flat and Explicit

```yaml
# GOOD: Clear hierarchy, obvious purpose
replicaCount: 3

image:
  repository: registry.example.com/myapp
  tag: "1.0.0"
  pullPolicy: IfNotPresent

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

# BAD: Deeply nested, unclear semantics
app:
  deployment:
    spec:
      container:
        resources:
          limits: ...
```

### Environment Overrides

```yaml
# values.yaml (defaults for development)
replicaCount: 1
resources:
  limits:
    memory: 256Mi

# values-staging.yaml
replicaCount: 2
resources:
  limits:
    memory: 512Mi

# values-production.yaml
replicaCount: 5
resources:
  limits:
    memory: 1Gi
```

```bash
# Apply with override
helm upgrade --install myapp ./mychart \
  -f ./mychart/values-production.yaml \
  --set image.tag=1.2.3
```

## Template Patterns

### Helper Functions (`_helpers.tpl`)

```yaml
{{/* Generate standard labels */}}
{{- define "myapp.labels" -}}
helm.sh/chart: {{ include "myapp.chart" . }}
app.kubernetes.io/name: {{ include "myapp.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/* Generate selector labels */}}
{{- define "myapp.selectorLabels" -}}
app.kubernetes.io/name: {{ include "myapp.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/* Fullname with release prefix */}}
{{- define "myapp.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
```

### Conditional Resources

```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "myapp.fullname" . }}
  {{- with .Values.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  {{- if .Values.ingress.tls }}
  tls:
    {{- toYaml .Values.ingress.tls | nindent 4 }}
  {{- end }}
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: {{ include "myapp.fullname" $ }}
                port:
                  number: {{ $.Values.service.port }}
          {{- end }}
    {{- end }}
{{- end }}
```

### Config Checksum for Rollout

```yaml
# Trigger pod restart when ConfigMap changes
spec:
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        checksum/secret: {{ include (print $.Template.BasePath "/secret.yaml") . | sha256sum }}
```

## Dependency Management

```bash
# Update dependencies
helm dependency update ./mychart

# List dependencies
helm dependency list ./mychart

# Build dependencies (download to charts/)
helm dependency build ./mychart
```

### Subchart Values

```yaml
# values.yaml
postgresql:
  enabled: true
  auth:
    username: myapp
    database: myappdb
  primary:
    persistence:
      size: 10Gi

redis:
  enabled: true
  architecture: standalone
  auth:
    enabled: false
```

## Chart Testing

### Helm Lint

```bash
helm lint ./mychart
helm lint ./mychart -f values-production.yaml
```

### Template Rendering

```bash
# Render templates without installing
helm template myapp ./mychart -f values-production.yaml

# Render a specific template
helm template myapp ./mychart -s templates/deployment.yaml

# Dry run against the cluster (validates API compatibility)
helm install myapp ./mychart --dry-run --debug
```

### Chart Testing Tool (ct)

```bash
# Lint and install charts that changed in a PR
ct lint-and-install --config ct.yaml

# ct.yaml
target-branch: main
chart-dirs:
  - charts
helm-extra-args: "--timeout 600s"
```

## Release Management

```bash
# Install a release
helm install myapp ./mychart -n production --create-namespace

# Upgrade a release
helm upgrade myapp ./mychart -n production -f values-production.yaml

# Install or upgrade (idempotent)
helm upgrade --install myapp ./mychart -n production

# Rollback to previous release
helm rollback myapp 1 -n production

# View release history
helm history myapp -n production

# Uninstall
helm uninstall myapp -n production
```

### Version Strategy

| Version | When to Bump | Example |
|---------|-------------|---------|
| Chart `version` (MAJOR) | Breaking values schema change | 1.0.0 -> 2.0.0 |
| Chart `version` (MINOR) | New feature (e.g., new template) | 1.0.0 -> 1.1.0 |
| Chart `version` (PATCH) | Bug fix or dependency update | 1.0.0 -> 1.0.1 |
| `appVersion` | New application release | Matches application semver |

## OCI Registry

```bash
# Package chart
helm package ./mychart

# Push to OCI registry
helm push mychart-1.0.0.tgz oci://registry.example.com/charts

# Install from OCI
helm install myapp oci://registry.example.com/charts/mychart --version 1.0.0
```

## Best Practices Checklist

| Practice | Rationale |
|----------|-----------|
| Use `_helpers.tpl` for repeated patterns | DRY templates, consistent naming |
| Always include labels and selector labels | Standard Kubernetes discovery |
| Parameterize everything that differs per env | One chart, many environments |
| Include NOTES.txt | Post-install guidance for operators |
| Pin subchart versions | Reproducible deployments |
| Use `--atomic` for production upgrades | Auto-rollback on failure |
| Include resource requests and limits | Schedulable, predictable pods |
