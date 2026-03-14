# Example: Hardened Rolling Deployment with Health Checks

## Prompt

> Create a Kubernetes Deployment for a Node.js API called "order-api" in the "commerce" namespace. It needs 3 replicas, rolling updates with zero downtime, all three probe types, resource limits, pod anti-affinity, non-root security context, and a PodDisruptionBudget.

## Response

### `manifests/order-api/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-api
  namespace: commerce
  labels:
    app: order-api
    version: v1
spec:
  replicas: 3
  revisionHistoryLimit: 5
  selector:
    matchLabels:
      app: order-api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      # Create one extra pod before removing an old one — ensures zero downtime
      maxSurge: 1
      # Never remove a pod until the new one is ready
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: order-api
        version: v1
      annotations:
        # Force rollout on config changes
        checksum/config: "{{ include (print .Template.BasePath \"/configmap.yaml\") . | sha256sum }}"
    spec:
      serviceAccountName: order-api
      terminationGracePeriodSeconds: 30

      # --- Security hardening ---
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault

      # --- Spread replicas across nodes ---
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - order-api
                topologyKey: kubernetes.io/hostname

      # --- Topology spread for even zone distribution ---
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: order-api

      containers:
        - name: order-api
          image: registry.example.com/commerce/order-api:1.4.2
          ports:
            - name: http
              containerPort: 3000
              protocol: TCP

          # --- Resource management ---
          resources:
            requests:
              memory: 256Mi
              cpu: 250m
            limits:
              memory: 512Mi
              cpu: 500m

          # --- Container security ---
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL

          # --- Environment ---
          envFrom:
            - configMapRef:
                name: order-api-config
            - secretRef:
                name: order-api-secrets

          # --- Probes ---
          # Startup probe: tolerant during initial boot (up to 5 minutes)
          startupProbe:
            httpGet:
              path: /healthz
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
            failureThreshold: 30
            timeoutSeconds: 3

          # Readiness probe: controls traffic routing
          readinessProbe:
            httpGet:
              path: /healthz
              port: http
            periodSeconds: 10
            failureThreshold: 3
            successThreshold: 1
            timeoutSeconds: 3

          # Liveness probe: restarts stuck containers
          livenessProbe:
            httpGet:
              path: /healthz
              port: http
            periodSeconds: 15
            failureThreshold: 3
            timeoutSeconds: 3

          # --- Volume mounts ---
          volumeMounts:
            - name: tmp
              mountPath: /tmp
            - name: cache
              mountPath: /app/.cache

      volumes:
        # Writable tmp directory for read-only root filesystem
        - name: tmp
          emptyDir:
            sizeLimit: 100Mi
        - name: cache
          emptyDir:
            sizeLimit: 200Mi
```

### `manifests/order-api/pdb.yaml`

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: order-api
  namespace: commerce
  labels:
    app: order-api
spec:
  # Allow at most 1 pod to be unavailable during voluntary disruptions
  maxUnavailable: 1
  selector:
    matchLabels:
      app: order-api
```

### `manifests/order-api/service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: order-api
  namespace: commerce
  labels:
    app: order-api
spec:
  type: ClusterIP
  selector:
    app: order-api
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
```

### Key decisions

1. **`maxSurge: 1` with `maxUnavailable: 0`** ensures at least 3 replicas are always serving traffic during updates. A new pod must pass readiness before an old pod is terminated.
2. **Startup probe with 30 failure threshold** gives the container up to 5 minutes to initialize (30 x 10s) without the liveness probe killing it during cold start, database migration, or cache warming.
3. **`readOnlyRootFilesystem: true`** with explicit `emptyDir` mounts for `/tmp` and `/app/.cache` provides writable space only where needed, hardening against filesystem-based attacks.
4. **Pod anti-affinity + topology spread** ensures replicas are distributed across nodes and availability zones, so a single node or zone failure does not take down all replicas.
5. **PDB with `maxUnavailable: 1`** guarantees that cluster operations (node drain, upgrade) never evict more than one pod at a time, maintaining 2/3 capacity during maintenance.
