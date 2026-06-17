# LabLumen — Implementation & Testing Runbook

A phased path from local Docker Compose to a live EKS deployment. Execute phases **in order**;
each ends with a **Definition of Done** gate — don't advance until it's green.

```
Phase 1  Local (docker-compose)      → prove the app boots, DB migrates+seeds, UI renders
Phase 2  Build & push images (ECR)   → publish the three service images
Phase 3  Terraform infra             → VPC, EKS, RDS, S3, Cognito, SQS/SES, Lambda
Phase 4  Cluster bootstrap + GitOps  → ArgoCD, addons, deploy services, ALB
Phase 5  AI pipeline + full E2E       → Bedrock, upload→summary→RAG chat, UI walkthrough
```

> **Read this first — what is real vs. stubbed in the scaffold.**
> - Fully implemented: every `/healthz` + `/readyz`, `GET /api/v1/lab-tests` (public), the report
>   `view` (presign) and `chat` (RAG) endpoints, the Lambda pipeline, the Alembic schema + seed.
> - Returns `501 Not Implemented` (signatures only): booking `POST /appointments`, list appointments,
>   appointment status, create/list patients, list reports. These are intentional next-step work.
> - Needs AWS to exercise: anything behind auth (Cognito JWT), `report` view/chat (S3 + Bedrock),
>   notifications (SQS/SES). Locally you can fully test health, the seeded catalog, and the UI.
> - Known wiring gaps before a clean cloud deploy are listed in **Appendix A**. Skim it now.

---

## Phase 0 — Prerequisites

You already have: **python 3.12, node 22, npm, terraform 1.15, AWS CLI** (account `130290476321`,
region `us-east-1`). Install the rest before the phases that need them:

| Tool | Needed for | Install (Windows) |
|---|---|---|
| **Docker Desktop** | Phase 1, 2 | https://www.docker.com/products/docker-desktop/ |
| **kubectl** | Phase 4, 5 | `winget install Kubernetes.kubectl` |
| **helm** | Phase 4 (ArgoCD/addons) | `winget install Helm.Helm` |
| **eksctl** | Phase 4 (IRSA service accounts) | `winget install Weaveworks.eksctl` |
| pnpm *(optional)* | frontend (npm works too) | `npm i -g pnpm` |

Confirm AWS identity once:

```bash
aws sts get-caller-identity        # should show account 130290476321
```

> PowerShell tip: use `curl.exe` (not `curl`, which is aliased to `Invoke-WebRequest`). The `for`
> loops below are written for **Git Bash**; PowerShell equivalents are noted where they differ.

---

## Phase 1 — Local with Docker Compose

Goal: the full backend boots, Postgres is migrated + seeded, and the SPA renders against the catalog.

### 1.1 Start the stack

```bash
cd "/c/Users/RAPHEL M L/Desktop/LABSYNC"
make up          # = docker compose up --build
```

This builds the three service images and starts: `postgres` (pgvector), `redis`, a one-shot
`migrate` (runs `alembic upgrade head` → schema + seed), then `appointment-service` (**:8001**),
`report-service` (**:8002**), `notification-service` (**:8003**).

Watch for: `migrate` exits `0`, and each service logs `Uvicorn running on http://0.0.0.0:8000`.

> No `make`? Run `docker compose up --build` directly.

### 1.2 Verify migrations + seed

```bash
docker compose exec postgres psql -U lablumen -d lablumen -c "\dt"
docker compose exec postgres psql -U lablumen -d lablumen -c "SELECT count(*) FROM lab_tests;"   # → 9
docker compose exec postgres psql -U lablumen -d lablumen -c "\d report_embeddings"              # embedding = vector(1536)
```

### 1.3 Smoke-test the services

```bash
curl.exe http://localhost:8001/healthz        # {"status":"ok"}
curl.exe http://localhost:8002/healthz
curl.exe http://localhost:8003/healthz
curl.exe http://localhost:8001/api/v1/lab-tests   # JSON array of 9 seeded tests
```

`notification-service` will log SQS poll errors and back off — **expected** locally (placeholder
queue); it stays healthy. Protected/`501` endpoints are not exercised here (see the note at top).

### 1.4 Run the unit/smoke tests

```bash
make test        # pytest in each service (boot + /healthz). Needs local Python deps:
                 # pip install -r backend/appointment-service/requirements-dev.txt  (etc.)
```

### 1.5 Run the frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173   (or: make fe-dev, if pnpm installed)
```

Open http://localhost:5173 →
- **Patient** dashboard: Bento grid renders; "Test Catalog" card fills from `:8001/api/v1/lab-tests`
  (proves SPA→API wiring). Click **Preview** → the diagnostic modal opens.
- **Staff** tab: counters + operations cards render.

> If the catalog card says "start the backend," confirm `VITE_APPOINTMENT_API` (default
> `http://localhost:8001`) and that `:8001` is up. CORS is already allowed for `:5173`.

### ✅ Definition of Done — Phase 1
- [ ] `migrate` completed; `lab_tests` has 9 rows; `report_embeddings.embedding` is `vector(1536)`.
- [ ] All three `/healthz` return `200`; `/api/v1/lab-tests` returns the catalog.
- [ ] SPA renders both dashboards and the preview modal; catalog card is populated.

Tear down when done: `make down` (removes volumes).

---

## Phase 2 — Build & push images to ECR

### 2.1 Create the repositories (once)

```bash
for s in appointment-service report-service notification-service; do
  aws ecr create-repository --repository-name "lablumen/$s" --region us-east-1 \
    --image-scanning-configuration scanOnPush=true || true
done
```

### 2.2 Authenticate Docker to ECR

```bash
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin 130290476321.dkr.ecr.us-east-1.amazonaws.com
```

### 2.3 Build, tag, push

```bash
REG=130290476321.dkr.ecr.us-east-1.amazonaws.com
for s in appointment-service report-service notification-service; do
  docker build -t "$REG/lablumen/$s:latest" "backend/$s"
  docker push  "$REG/lablumen/$s:latest"
done
```

> This mirrors `.github/workflows/build-push-ecr.yml`. Once the repo is on GitHub with an OIDC role
> (`lablumen-gh-actions`), pushes to `main` do this automatically and bump the k8s image tags.

### ✅ Definition of Done — Phase 2
- [ ] `aws ecr list-images --repository-name lablumen/appointment-service` shows a `latest` image (×3).

---

## Phase 3 — Provision infrastructure with Terraform

### 3.1 Pre-flight

1. **Enable Bedrock model access** (one-time, console): Bedrock → *Model access* → enable
   **Titan Text Embeddings** (`amazon.titan-embed-text-v1`) and **Nova 2 Lite**
   (`amazon.nova-2-lite-v1:0`) in **us-east-1**.
2. Set a **globally-unique bucket name** in [terraform/terraform.tfvars](terraform/terraform.tfvars):
   `reports_bucket_name = "lablumen-reports-130290476321"` (or your choice).
3. Review **Appendix A** — add Lambda `VpcConfig`/`DATABASE_URL` and extra IRSA roles now if you want
   a hands-off deploy; otherwise you'll wire them in Phase 4/5.

### 3.2 Apply

```bash
cd terraform
terraform init
terraform plan -out tfplan        # review: ~VPC, EKS, RDS, S3, Cognito, SQS, SES, Lambda
terraform apply tfplan            # ~15–25 min (EKS + RDS dominate)
```

> If the Lambda module errors while packaging Python deps, it's the `psycopg` build — set
> `build_in_docker = true` on the `ai_lambda` module (needs Docker running) or deploy the function
> via the SAM template in Phase 5 instead.

### 3.3 Capture outputs

```bash
terraform output                  # cluster_name, rds_endpoint, reports_bucket,
                                  # notifications_queue_url, cognito_user_pool_id, cognito_app_client_id,
                                  # rds_master_user_secret_arn
```

### ✅ Definition of Done — Phase 3
- [ ] `terraform apply` succeeds; `terraform output` shows all values.
- [ ] `aws eks describe-cluster --name lablumen-eks` is `ACTIVE`; RDS instance is `available`.

---

## Phase 4 — Cluster bootstrap, GitOps, and deploy

### 4.1 Connect kubectl

```bash
aws eks update-kubeconfig --name lablumen-eks --region us-east-1
kubectl get nodes                 # managed node group nodes are Ready
```

### 4.2 Service-account IAM (IRSA) for addons — see Appendix A

The AWS Load Balancer Controller and the services expect IRSA-backed service accounts. Create them
with `eksctl` (example for the LB controller):

```bash
eksctl create iamserviceaccount --cluster lablumen-eks --namespace kube-system \
  --name aws-load-balancer-controller --attach-policy-arn arn:aws:iam::130290476321:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve --region us-east-1
```

(Repeat for `lablumen/appointment-service`, `report-service`, `notification-service` SAs, or extend
the Terraform `identity` module — Appendix A.)

### 4.3 Install ArgoCD, then apply the app-of-apps

GitOps pulls from GitHub, so **push the repo first** (`git push origin main`).

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl -n argocd rollout status deploy/argocd-server

kubectl apply -f k8s/root-app.yaml          # registers all apps + platform-addons
kubectl -n argocd get applications          # watch them sync
```

### 4.4 Create per-service secrets + run DB migration

The deployments mount `envFrom: secretRef: <svc>-secrets`. For a first deploy, create plain secrets
(production path = Secrets Store CSI + Secrets Manager). Build `DATABASE_URL` from the RDS endpoint
and the managed password:

```bash
PW=$(aws secretsmanager get-secret-value --secret-id "$(terraform -chdir=terraform output -raw rds_master_user_secret_arn)" \
      --query SecretString --output text | python -c "import sys,json;print(json.load(sys.stdin)['password'])")
RDS=$(terraform -chdir=terraform output -raw rds_endpoint)        # host:5432
DB_URL="postgresql+asyncpg://lablumen:${PW}@${RDS%:*}:5432/lablumen"

kubectl create namespace lablumen 2>/dev/null || true
kubectl -n lablumen create secret generic appointment-service-secrets \
  --from-literal=DATABASE_URL="$DB_URL" \
  --from-literal=REDIS_URL="redis://redis.lablumen.svc.cluster.local:6379/0" \
  --from-literal=AWS_REGION=us-east-1 \
  --from-literal=COGNITO_USER_POOL_ID="$(terraform -chdir=terraform output -raw cognito_user_pool_id)" \
  --from-literal=COGNITO_APP_CLIENT_ID="$(terraform -chdir=terraform output -raw cognito_app_client_id)"
# repeat for report-service-secrets (add REPORTS_S3_BUCKET, model IDs) and notification-service-secrets
# (add NOTIFICATIONS_QUEUE_URL, SES_SENDER_EMAIL).
```

Run migrations against RDS once (one-off Job using the published image):

```bash
kubectl -n lablumen run migrate --rm -i --restart=Never \
  --image=130290476321.dkr.ecr.us-east-1.amazonaws.com/lablumen/appointment-service:latest \
  --env="DATABASE_URL=$DB_URL" --command -- alembic upgrade head
```

### 4.5 Verify

```bash
kubectl -n lablumen get pods                 # all Running/Ready
kubectl -n lablumen get ingress              # ALB address appears once the LB controller reconciles
```

Point Route 53 `api.lablumen...` at the ALB (or test via the ALB DNS), then:
`curl.exe http://<alb-dns>/api/v1/lab-tests`.

### ✅ Definition of Done — Phase 4
- [ ] All ArgoCD Applications are `Synced/Healthy`; service pods Running.
- [ ] Migration Job succeeded against RDS; `/api/v1/lab-tests` returns the catalog through the ALB.

---

## Phase 5 — AI pipeline + full end-to-end

### 5.1 Confirm the Lambda + S3 trigger

Terraform created the function, S3 bucket, and `s3:ObjectCreated` notification. Ensure the function
has **`DATABASE_URL`** set and **VpcConfig** to reach RDS (Appendix A). Quick check:

```bash
aws lambda get-function-configuration --function-name lablumen-ai-processing \
  --query "{vpc:VpcConfig.SubnetIds, env:Environment.Variables}"
```

### 5.2 Create a Cognito test user + token

```bash
POOL=$(terraform -chdir=terraform output -raw cognito_user_pool_id)
CLIENT=$(terraform -chdir=terraform output -raw cognito_app_client_id)
aws cognito-idp admin-create-user --user-pool-id "$POOL" --username patient@example.com
aws cognito-idp admin-set-user-password --user-pool-id "$POOL" --username patient@example.com \
  --password 'Test12345!' --permanent
aws cognito-idp admin-add-user-to-group --user-pool-id "$POOL" --username patient@example.com --group-name PATIENT
# Get a JWT (USER_PASSWORD_AUTH must be enabled on the client for this CLI flow):
aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH --client-id "$CLIENT" \
  --auth-parameters USERNAME=patient@example.com,PASSWORD='Test12345!' \
  --query 'AuthenticationResult.IdToken' --output text
```

Use the token as `Authorization: Bearer <token>` against protected endpoints.

### 5.3 Exercise the RAG pipeline

1. Seed a `lab_reports` row whose `s3_url` equals the object key you'll upload (the Lambda matches on
   it), via a real appointment→mapping, or a manual insert for testing.
2. Upload a single-page report PDF/PNG:
   `aws s3 cp sample-report.pdf s3://<reports_bucket>/reports/sample-report.pdf`
3. The S3 event triggers `lablumen-ai-processing` → Textract → Nova summary → Titan embeddings.
   Verify: `ai_layman_summary` populated and `report_embeddings` rows created for that `report_id`.
4. Chat (scoped RAG):
   ```bash
   curl.exe -X POST http://<alb-dns>/api/v1/reports/<report_id>/chat \
     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
     -d '{"question":"What does my cholesterol result mean?"}'
   ```
   Expect an answer grounded in that report's chunks + the not-medical-advice disclaimer.

### 5.4 UI walkthrough
Build/host the SPA (S3 + CloudFront per the blueprint, or `npm run preview`), set its `VITE_*` env to
the ALB + Cognito values, log in, and click through Patient → preview modal → chat.

### ✅ Definition of Done — Phase 5
- [ ] Upload produces a summary + embeddings; scoped `chat` returns a grounded answer.
- [ ] An authenticated user completes the journey in the UI.

---

## Teardown

```bash
kubectl delete -f k8s/root-app.yaml                     # remove apps (ALBs) before infra
cd terraform && terraform destroy                       # empty the S3 bucket first if not force_destroy
for s in appointment-service report-service notification-service; do
  aws ecr delete-repository --repository-name "lablumen/$s" --force --region us-east-1; done
```

---

## Appendix A — Known wiring gaps (complete these for a clean cloud run)

The scaffold is intentionally lean; these are the deliberate next-step items:

1. **Lambda → RDS**: add `vpc_config` (private subnets + a SG allowed into RDS:5432) and
   `DATABASE_URL` to the `ai_lambda` module in [terraform/modules/storage/main.tf](terraform/modules/storage/main.tf).
   Without VpcConfig the function cannot reach private RDS.
2. **IRSA for all services**: the `identity` module creates only the `report-service` role. Add roles
   for `appointment-service` (SQS publish), `notification-service` (SQS consume + SES), the
   **AWS Load Balancer Controller**, and the **Karpenter** controller SA, then put each role ARN into
   the chart's `serviceAccount.annotations` (`k8s/apps/<svc>/values.yaml`).
3. **Secrets via CSI**: replace the plain `kubectl create secret` (Phase 4.4) with a
   `SecretProviderClass` per service so Secrets Manager values mount automatically.
4. **Image tags**: charts default to `:latest`. For real GitOps rollouts, let the CI tag-bump commit
   pin a SHA (already in [.github/workflows/build-push-ecr.yml](.github/workflows/build-push-ecr.yml)),
   which requires the `lablumen-gh-actions` OIDC role + an ECR push policy.
5. **Cognito client auth flow**: enable `ALLOW_USER_PASSWORD_AUTH` on the app client if you use the
   CLI token flow in 5.2 (Hosted UI / SRP needs no change).
6. **Stubbed endpoints**: implement the `501` routes (booking with the Redis slot-lock + SQS event,
   patients, report listing) — this is the planned post-scaffold work.

## Appendix B — Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `migrate` exits non-zero | DB not ready — Compose waits on health, but on first run retry `make migrate`. |
| Catalog card empty in UI | `:8001` down or `VITE_APPOINTMENT_API` wrong; check browser console/CORS. |
| Service pod `CreateContainerConfigError` | `<svc>-secrets` missing in `lablumen` ns (Phase 4.4). |
| Ingress has no address | LB controller not installed or its IRSA SA missing (Appendix A.2). |
| Chat returns 404 | No `lab_reports` row for that `report_id`, or user isn't owner/staff. |
| Bedrock `AccessDenied` | Model access not enabled (Phase 3.1) or missing `bedrock:InvokeModel` IAM. |
| Lambda times out on DB | Missing VpcConfig/SG to RDS (Appendix A.1). |
| ArgoCD app `OutOfSync`/`Unknown` | Repo not pushed to GitHub, or `repoURL`/`targetRevision` mismatch. |
