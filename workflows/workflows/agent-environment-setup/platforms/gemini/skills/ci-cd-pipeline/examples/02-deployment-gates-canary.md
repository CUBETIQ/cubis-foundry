# Example: Deployment Pipeline with Canary and Approval Gates

## Prompt

> Create a GitHub Actions deployment workflow that builds a Docker image, pushes to ECR, deploys to staging automatically on merge to main, then promotes to production-canary (10% traffic, 1 approval), and finally production (100% traffic, 2 approvals). Roll back automatically if canary health checks fail.

## Response

### `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  id-token: write   # For OIDC federation with AWS
  contents: read

env:
  ECR_REPO: 123456789.dkr.ecr.us-east-1.amazonaws.com/myapp
  HEALTH_ENDPOINT: /api/health

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11

      - name: Configure AWS credentials via OIDC
        uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-actions-ecr
          aws-region: us-east-1

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@062b18b96a7aff071d4dc91bc00c4c1a7945b076

      - name: Build and push image
        id: meta
        run: |
          IMAGE_TAG="${{ env.ECR_REPO }}:${{ github.sha }}"
          docker build -t "$IMAGE_TAG" .
          docker push "$IMAGE_TAG"
          echo "tags=$IMAGE_TAG" >> "$GITHUB_OUTPUT"

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          aws ecs update-service \
            --cluster myapp-staging \
            --service myapp \
            --force-new-deployment \
            --task-definition "$(aws ecs register-task-definition \
              --cli-input-json file://task-def.json \
              --query 'taskDefinition.taskDefinitionArn' \
              --output text)"

      - name: Verify staging health
        run: |
          for i in $(seq 1 30); do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://staging.myapp.com${HEALTH_ENDPOINT}")
            if [ "$STATUS" = "200" ]; then
              echo "Staging health check passed"
              exit 0
            fi
            echo "Attempt $i: status=$STATUS, retrying in 10s..."
            sleep 10
          done
          echo "Staging health check failed after 30 attempts"
          exit 1

  deploy-canary:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production-canary  # Requires 1 approval
    steps:
      - name: Deploy canary (10% traffic)
        run: |
          # Update the canary target group with the new task definition
          aws ecs update-service \
            --cluster myapp-production \
            --service myapp-canary \
            --force-new-deployment

          # Set ALB traffic weight: 90% stable, 10% canary
          aws elbv2 modify-rule \
            --rule-arn "$CANARY_RULE_ARN" \
            --actions '[{
              "Type": "forward",
              "ForwardConfig": {
                "TargetGroups": [
                  {"TargetGroupArn": "'"$STABLE_TG_ARN"'", "Weight": 90},
                  {"TargetGroupArn": "'"$CANARY_TG_ARN"'", "Weight": 10}
                ]
              }
            }]'

      - name: Verify canary health (5 minutes)
        id: canary-health
        run: |
          FAILURES=0
          for i in $(seq 1 30); do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://canary.myapp.com${HEALTH_ENDPOINT}")
            if [ "$STATUS" != "200" ]; then
              FAILURES=$((FAILURES + 1))
            fi
            if [ "$FAILURES" -gt 3 ]; then
              echo "healthy=false" >> "$GITHUB_OUTPUT"
              echo "Canary health degraded: $FAILURES failures in $i checks"
              exit 1
            fi
            sleep 10
          done
          echo "healthy=true" >> "$GITHUB_OUTPUT"
          echo "Canary health check passed: $FAILURES failures in 30 checks"

      - name: Rollback canary on failure
        if: failure()
        run: |
          echo "Rolling back canary deployment..."
          # Route 100% traffic back to stable
          aws elbv2 modify-rule \
            --rule-arn "$CANARY_RULE_ARN" \
            --actions '[{
              "Type": "forward",
              "ForwardConfig": {
                "TargetGroups": [
                  {"TargetGroupArn": "'"$STABLE_TG_ARN"'", "Weight": 100},
                  {"TargetGroupArn": "'"$CANARY_TG_ARN"'", "Weight": 0}
                ]
              }
            }]'

          # Scale down canary service
          aws ecs update-service \
            --cluster myapp-production \
            --service myapp-canary \
            --desired-count 0
          echo "Rollback complete. All traffic routed to stable."

  deploy-production:
    needs: deploy-canary
    runs-on: ubuntu-latest
    environment: production  # Requires 2 approvals
    steps:
      - name: Promote to full production
        run: |
          # Update the stable service with the new image
          aws ecs update-service \
            --cluster myapp-production \
            --service myapp-stable \
            --force-new-deployment

          # Route 100% traffic to stable (new version)
          aws elbv2 modify-rule \
            --rule-arn "$CANARY_RULE_ARN" \
            --actions '[{
              "Type": "forward",
              "ForwardConfig": {
                "TargetGroups": [
                  {"TargetGroupArn": "'"$STABLE_TG_ARN"'", "Weight": 100},
                  {"TargetGroupArn": "'"$CANARY_TG_ARN"'", "Weight": 0}
                ]
              }
            }]'

      - name: Verify production health
        run: |
          for i in $(seq 1 30); do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://myapp.com${HEALTH_ENDPOINT}")
            if [ "$STATUS" = "200" ]; then
              echo "Production health check passed"
              exit 0
            fi
            sleep 10
          done
          echo "Production health check failed"
          exit 1
```

### Key decisions

1. **OIDC federation** instead of long-lived AWS credentials eliminates static secret rotation and limits token lifetime to the workflow run.
2. **Single image build** ensures the exact artifact that passed staging is promoted to production, preventing "it works in staging" drift.
3. **Canary health check with failure threshold** tolerates transient errors (up to 3) but triggers rollback on sustained degradation.
4. **Automatic rollback** uses `if: failure()` to route all traffic back to stable when the health check step fails, minimizing blast radius.
5. **Environment-scoped approvals** enforce organizational policy: staging is auto-deploy, canary needs one reviewer to validate the change, production needs two for safety.
