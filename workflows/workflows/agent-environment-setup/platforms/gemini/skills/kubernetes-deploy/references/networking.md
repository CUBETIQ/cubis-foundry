# Kubernetes Networking Reference

## Service Types

### ClusterIP (Default)

Internal-only service accessible within the cluster.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
    - name: http
      port: 80           # Service port (what clients connect to)
      targetPort: 8080   # Container port (where the app listens)
      protocol: TCP
```

### NodePort

Exposes the service on a static port on every node. Useful for development or when a load balancer is not available.

```yaml
spec:
  type: NodePort
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30080    # Accessible on <node-ip>:30080
```

### LoadBalancer

Provisions a cloud load balancer (AWS ALB/NLB, GCP LB, Azure LB).

```yaml
spec:
  type: LoadBalancer
  ports:
    - port: 443
      targetPort: 8080
  annotations:
    # AWS-specific
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
    service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing
```

### Headless Service

Returns individual pod IPs instead of a single virtual IP. Used by StatefulSets.

```yaml
spec:
  type: ClusterIP
  clusterIP: None        # Headless
  selector:
    app: myapp-db
```

## Ingress

### NGINX Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - myapp.example.com
      secretName: myapp-tls
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: myapp-api
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp-frontend
                port:
                  number: 80
```

### Multiple Hosts

```yaml
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

## Gateway API

The successor to Ingress, providing more expressive routing.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: main-gateway
spec:
  gatewayClassName: nginx
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      tls:
        mode: Terminate
        certificateRefs:
          - name: myapp-tls
      allowedRoutes:
        namespaces:
          from: All
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: myapp
spec:
  parentRefs:
    - name: main-gateway
  hostnames:
    - myapp.example.com
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: myapp-api
          port: 80
          weight: 100
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: myapp-frontend
          port: 80
```

## NetworkPolicy

### Default Deny All

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}          # Applies to all pods in namespace
  policyTypes:
    - Ingress
    - Egress
```

### Allow Specific Traffic

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-to-db
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: api         # Only API pods can reach Postgres
      ports:
        - protocol: TCP
          port: 5432
```

### Allow DNS

When using default-deny, you must explicitly allow DNS:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
```

## TLS and Certificate Management

### cert-manager with Let's Encrypt

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: platform@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            ingressClassName: nginx
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: myapp-tls
spec:
  secretName: myapp-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - myapp.example.com
    - api.example.com
```

## DNS and Service Discovery

### Internal DNS Format

```
<service>.<namespace>.svc.cluster.local

# Examples:
myapp.production.svc.cluster.local
postgres.database.svc.cluster.local

# Short form (within same namespace):
myapp
postgres
```

### Debugging DNS

```bash
# Run a debug pod
kubectl run dns-debug --image=alpine --restart=Never -it --rm -- sh

# Inside the pod:
nslookup myapp.production.svc.cluster.local
nslookup kubernetes.default.svc.cluster.local
cat /etc/resolv.conf
```

## Troubleshooting Network Issues

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| Connection refused | Service selector mismatch | Verify labels match between Service and Pod |
| Connection timeout | NetworkPolicy blocking | Check NetworkPolicy rules, allow DNS |
| 502 Bad Gateway | Pod not ready | Check readiness probe, verify targetPort |
| DNS resolution failed | CoreDNS issue | `kubectl logs -n kube-system -l k8s-app=kube-dns` |
| Intermittent failures | Pod being terminated | Add preStop hook, increase terminationGracePeriod |

```bash
# Check Service endpoints (should list pod IPs)
kubectl get endpoints myapp -n production

# If endpoints are empty, the Service selector does not match any pods
kubectl get pods -n production -l app=myapp --show-labels
```
