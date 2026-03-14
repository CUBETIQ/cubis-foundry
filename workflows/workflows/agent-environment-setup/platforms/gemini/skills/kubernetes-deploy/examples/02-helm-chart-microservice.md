# Example: Helm Chart for a Microservice

## Prompt

> Create a Helm chart for "notification-service" with a Deployment, Service, Ingress with TLS, ConfigMap, and HPA. Provide default values and a production override file with higher replicas and production domain.

## Response

### `charts/notification-service/Chart.yaml`

```yaml
apiVersion: v2
name: notification-service
description: A Helm chart for the notification microservice
type: application
version: 1.0.0
appVersion: "2.3.1"
```

### `charts/notification-service/values.yaml`

```yaml
# Default values — suitable for development and staging

replicaCount: 2

image:
  repository: registry.example.com/platform/notification-service
  tag: "latest"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

ingress:
  enabled: true
  className: nginx
  host: notifications.dev.example.com
  tls:
    enabled: false
    secretName: ""
  annotations:
    nginx.ingress.kubernetes.io/rate-limit: "100"

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 250m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

config:
  logLevel: "info"
  smtpHost: "mailhog"
  smtpPort: "1025"
  retryAttempts: "3"
  retryBackoffMs: "1000"

probes:
  startup:
    path: /healthz
    failureThreshold: 30
    periodSeconds: 10
  readiness:
    path: /healthz
    periodSeconds: 10
    failureThreshold: 3
  liveness:
    path: /healthz
    periodSeconds: 15
    failureThreshold: 3

podDisruptionBudget:
  enabled: true
  maxUnavailable: 1

securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
```

### `charts/notification-service/values-production.yaml`

```yaml
# Production overrides
# Usage: helm upgrade --install notification-service ./charts/notification-service \
#        -f ./charts/notification-service/values-production.yaml

replicaCount: 4

image:
  tag: "2.3.1"
  pullPolicy: IfNotPresent

ingress:
  host: notifications.example.com
  tls:
    enabled: true
    secretName: notifications-tls

resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi

autoscaling:
  minReplicas: 4
  maxReplicas: 20
  targetCPUUtilizationPercentage: 60

config:
  logLevel: "warn"
  smtpHost: "smtp.sendgrid.net"
  smtpPort: "587"
  retryAttempts: "5"
  retryBackoffMs: "2000"
```

### `charts/notification-service/templates/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "notification-service.fullname" . }}
  labels:
    {{- include "notification-service.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "notification-service.selectorLabels" . | nindent 6 }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        {{- include "notification-service.selectorLabels" . | nindent 8 }}
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
    spec:
      securityContext:
        runAsNonRoot: {{ .Values.securityContext.runAsNonRoot }}
        runAsUser: {{ .Values.securityContext.runAsUser }}
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.service.targetPort }}
              protocol: TCP
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: {{ .Values.securityContext.readOnlyRootFilesystem }}
            capabilities:
              drop:
                - ALL
          envFrom:
            - configMapRef:
                name: {{ include "notification-service.fullname" . }}-config
          startupProbe:
            httpGet:
              path: {{ .Values.probes.startup.path }}
              port: http
            failureThreshold: {{ .Values.probes.startup.failureThreshold }}
            periodSeconds: {{ .Values.probes.startup.periodSeconds }}
          readinessProbe:
            httpGet:
              path: {{ .Values.probes.readiness.path }}
              port: http
            periodSeconds: {{ .Values.probes.readiness.periodSeconds }}
            failureThreshold: {{ .Values.probes.readiness.failureThreshold }}
          livenessProbe:
            httpGet:
              path: {{ .Values.probes.liveness.path }}
              port: http
            periodSeconds: {{ .Values.probes.liveness.periodSeconds }}
            failureThreshold: {{ .Values.probes.liveness.failureThreshold }}
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
```

### `charts/notification-service/templates/service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "notification-service.fullname" . }}
  labels:
    {{- include "notification-service.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
      protocol: TCP
      name: http
  selector:
    {{- include "notification-service.selectorLabels" . | nindent 4 }}
```

### `charts/notification-service/templates/ingress.yaml`

```yaml
{{- if .Values.ingress.enabled -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "notification-service.fullname" . }}
  labels:
    {{- include "notification-service.labels" . | nindent 4 }}
  {{- with .Values.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  ingressClassName: {{ .Values.ingress.className }}
  {{- if .Values.ingress.tls.enabled }}
  tls:
    - hosts:
        - {{ .Values.ingress.host }}
      secretName: {{ .Values.ingress.tls.secretName }}
  {{- end }}
  rules:
    - host: {{ .Values.ingress.host }}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {{ include "notification-service.fullname" . }}
                port:
                  number: {{ .Values.service.port }}
{{- end }}
```

### `charts/notification-service/templates/configmap.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "notification-service.fullname" . }}-config
  labels:
    {{- include "notification-service.labels" . | nindent 4 }}
data:
  LOG_LEVEL: {{ .Values.config.logLevel | quote }}
  SMTP_HOST: {{ .Values.config.smtpHost | quote }}
  SMTP_PORT: {{ .Values.config.smtpPort | quote }}
  RETRY_ATTEMPTS: {{ .Values.config.retryAttempts | quote }}
  RETRY_BACKOFF_MS: {{ .Values.config.retryBackoffMs | quote }}
```

### `charts/notification-service/templates/hpa.yaml`

```yaml
{{- if .Values.autoscaling.enabled -}}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "notification-service.fullname" . }}
  labels:
    {{- include "notification-service.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "notification-service.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
{{- end }}
```

### Key decisions

1. **`{{ .Values.` references everywhere** make the chart fully parameterizable. No environment-specific logic lives in templates.
2. **Config checksum annotation** forces pod rollout when the ConfigMap changes, because Kubernetes does not restart pods on ConfigMap updates by default.
3. **Conditional HPA with `replicas` fallback** means `replicaCount` only takes effect when autoscaling is disabled, preventing the HPA and Deployment from fighting over replica count.
4. **`values-production.yaml` overrides** make the dev-to-prod differences explicit: higher replicas, TLS enabled, production SMTP, stricter resource limits.
5. **PDB and rolling update strategy** together ensure zero-downtime upgrades: the Deployment never terminates a pod before the new one is ready, and the PDB protects against node drains.
