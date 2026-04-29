# Cloud Run Deployment

Demo 部署紀錄 — 2026-04-29 第一次上線。

## Live services

| Service  | URL                                                  | Image                                                                       |
| -------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| Frontend | https://frontend-75879180915.asia-east1.run.app      | `asia-east1-docker.pkg.dev/.../nexretail/frontend:v1`                       |
| Backend  | https://backend-75879180915.asia-east1.run.app       | `asia-east1-docker.pkg.dev/.../nexretail/backend:v1`                        |

- **Project**: `nexretail-camera-station-v2`
- **Region**: `asia-east1`
- **Artifact Registry repo**: `nexretail`

## Architecture

```
Browser
  └→ Frontend (Next.js standalone, Cloud Run)
        ├─ static pages / server components
        └─ next.config.ts rewrites:  /api/:path*  →  ${BACKEND_URL}/api/:path*
              └→ Backend (FastAPI, Cloud Run)
                    └─ SQLite at /home/app/dev.db (baked into image by seed.py at build time)
```

- 瀏覽器只跟 frontend 同 origin 對話，無 CORS。
- DB 是 image build 階段跑 `python seed.py` 烤進 layer 的 SQLite — 重置 = 重 build。

## What's NOT used

- Cloud Build（本地 build → 直接 push）
- Cloud SQL（demo 用 baked SQLite）
- Secret Manager（沒 secrets）
- VPC / Load Balancer / 自訂 domain

## Prerequisites

- `gcloud` CLI 已 auth 並 set project
- Docker daemon running，user 在 `docker` group
- 有 GCP project 並啟用 billing

## Initial setup (one-time)

```bash
gcloud config set project nexretail-camera-station-v2
gcloud config set run/region asia-east1
gcloud config set artifacts/location asia-east1

gcloud services enable run.googleapis.com artifactregistry.googleapis.com

gcloud artifacts repositories create nexretail \
  --repository-format=docker \
  --location=asia-east1

gcloud auth configure-docker asia-east1-docker.pkg.dev --quiet
```

## Deploy backend

```bash
cd backend
docker build -t nexretail-backend:test .
docker tag  nexretail-backend:test \
  asia-east1-docker.pkg.dev/nexretail-camera-station-v2/nexretail/backend:v1
docker push \
  asia-east1-docker.pkg.dev/nexretail-camera-station-v2/nexretail/backend:v1

gcloud run deploy backend \
  --image asia-east1-docker.pkg.dev/nexretail-camera-station-v2/nexretail/backend:v1 \
  --region asia-east1 \
  --port 8080 \
  --allow-unauthenticated \
  --max-instances 1 \
  --min-instances 0 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars ENV=prod
```

`DATABASE_URL` 已在 Dockerfile 裡 baked 為 `sqlite:////home/app/dev.db`，部署時不需要再帶。

## Deploy frontend

部 frontend 之前必須先有 backend URL（用來 baked into rewrites）。

```bash
cd frontend
docker build \
  --build-arg BACKEND_URL=https://backend-75879180915.asia-east1.run.app \
  -t nexretail-frontend:v1 .
docker tag  nexretail-frontend:v1 \
  asia-east1-docker.pkg.dev/nexretail-camera-station-v2/nexretail/frontend:v1
docker push \
  asia-east1-docker.pkg.dev/nexretail-camera-station-v2/nexretail/frontend:v1

gcloud run deploy frontend \
  --image asia-east1-docker.pkg.dev/nexretail-camera-station-v2/nexretail/frontend:v1 \
  --region asia-east1 \
  --port 8080 \
  --allow-unauthenticated \
  --max-instances 1 \
  --min-instances 0 \
  --memory 512Mi \
  --cpu 1
```

## Update / redeploy

| 想做的事                            | 操作                                                              |
| ----------------------------------- | ----------------------------------------------------------------- |
| 改 backend code                     | rebuild + push backend image (新 tag) → `gcloud run deploy backend --image ...` |
| 改 frontend code                    | rebuild + push frontend image (新 tag) → `gcloud run deploy frontend --image ...` |
| 重置 demo 資料                      | rebuild backend image (seed.py 會重跑) → push → redeploy          |
| 換 backend URL（換 region / 改名） | 用新 URL 重 build frontend (`--build-arg BACKEND_URL=...`) → push → redeploy |

## Rollback

```bash
gcloud run revisions list --service=backend --region=asia-east1
gcloud run services update-traffic backend --to-revisions=backend-00001-q7k=100 --region=asia-east1
```

## Cost

Demo 流量 (~10k req/月) 完全在 Cloud Run free tier 內：

- Cloud Run free: 200 萬 req + 360k vCPU-s + 180k GiB-s + 1 GB egress
- AR free: 0.5 GB storage（目前用 ~155 MB）
- Logging free: 50 GiB/月

**月成本 ≈ $0**，前提是 `min-instances=0` 不開、不加 Cloud SQL、image 版本不堆積。

成本爆增風險：
- `min-instances=1` 每個 service ≈ **$13/月**
- 加 Cloud SQL Postgres `db-f1-micro` ≈ **$10–15/月**

## Gotchas

- **Frontend `BACKEND_URL` baked at build time** — `next.config.ts` 的 rewrites 在 `next build` 時就決定 destination 字串。換 backend URL 必須重 build frontend image。
- **`max-instances=1`** — SQLite 在 image 裡，多個 instance 會有各自一份 DB（雖然內容相同），且 demo 不需要橫向擴展。
- **DB 隨 redeploy 重置** — 每次 backend image rebuild 都會重跑 `seed.py`，運行時資料不持久。要持久化請改 Cloud SQL。
- **Cold start 1–3 秒** — `min-instances=0` 沒人打時 instance 收掉，再進來會冷啟動。
