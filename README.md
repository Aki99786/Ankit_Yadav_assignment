# 🚀 ImmerVerse CI/CD Pipeline Assignment

> **DevOps Assignment (2–3 Years Experience)**
> Complete CI/CD pipeline using Git · Jenkins · Docker · AWS · Kubernetes · Prometheus · Grafana

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Step 1 — Source Code Management (GitHub)](#step-1--source-code-management-github)
4. [Step 2 — Dockerize the Application](#step-2--dockerize-the-application)
5. [Step 3 — Jenkins CI Pipeline Setup](#step-3--jenkins-ci-pipeline-setup)
6. [Step 4 — Container Registry (Docker Hub / ECR)](#step-4--container-registry)
7. [Step 5 — Deployment (Kubernetes / EC2)](#step-5--deployment)
8. [Step 6 — Monitoring (Prometheus + Grafana)](#step-6--monitoring)
9. [CI/CD Flow Diagram](#cicd-flow-diagram)
10. [Local Development](#local-development)
11. [Deliverables Checklist](#deliverables-checklist)

---

## Project Overview

This project demonstrates a **production-grade CI/CD pipeline** that automatically builds, tests, and deploys a containerized Node.js application whenever code is pushed to the GitHub repository.

| Component | Technology |
|-----------|-----------|
| Application | Node.js 18 + Express |
| Containerization | Docker (multi-stage build) |
| CI/CD | Jenkins Declarative Pipeline |
| Container Registry | Docker Hub **or** Amazon ECR |
| Orchestration | Kubernetes (EKS or local) |
| Monitoring | Prometheus + Grafana |
| Cloud | Amazon Web Services (EC2 / EKS) |

---

## Project Structure

```
immerverse-cicd/
├── app/
│   ├── app.js             # Node.js Express application
│   ├── app.test.js        # Jest unit tests
│   ├── package.json       # Dependencies and scripts
│   ├── Dockerfile         # Multi-stage Docker build
│   ├── .dockerignore      # Files excluded from Docker build
│   └── .env.example       # Environment variable template
├── k8s/
│   ├── namespace.yaml     # Kubernetes Namespace
│   ├── deployment.yaml    # Kubernetes Deployment (3 replicas)
│   ├── service.yaml       # Kubernetes LoadBalancer Service
│   ├── hpa.yaml           # HorizontalPodAutoscaler
│   ├── configmap.yaml     # Application ConfigMap
│   └── ingress.yaml       # Ingress with TLS
├── monitoring/
│   ├── prometheus.yaml         # Prometheus K8s manifests
│   ├── prometheus-local.yml    # Prometheus config (local compose)
│   ├── grafana.yaml            # Grafana K8s manifests
│   └── grafana-datasources.yml # Grafana datasource (local compose)
├── Jenkinsfile            # Jenkins Declarative Pipeline
├── docker-compose.yml     # Local dev environment
├── .gitignore
└── README.md
```

---

## Step 1 — Source Code Management (GitHub)

### 1.1 Create GitHub Repository

```bash
# Initialize local repository
git init
git add .
git commit -m "feat: initial CI/CD pipeline setup"

# Create repo on GitHub (via gh CLI or GitHub UI), then:
git remote add origin https://github.com/<your-username>/immerverse-cicd.git
git branch -M main
git push -u origin main
```

### 1.2 Configure GitHub Webhook for Jenkins

1. Go to **GitHub repo → Settings → Webhooks → Add webhook**
2. Set **Payload URL**: `http://<jenkins-url>:8080/github-webhook/`
3. Set **Content type**: `application/json`
4. Select **Just the push event**
5. Click **Add webhook**

> **Why?** Every `git push` to `main` will automatically trigger the Jenkins pipeline.

### 1.3 Application Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Application info & version |
| `GET /health` | Health check (used by K8s probes) |
| `GET /api/info` | Pipeline configuration info |
| `GET /metrics` | Prometheus-format metrics |

---

## Step 2 — Dockerize the Application

### 2.1 Understanding the Dockerfile

The Dockerfile uses a **multi-stage build**:

```
Stage 1 (builder)  → Installs all dependencies
Stage 2 (production) → Copies only what's needed → lean, secure image
```

Key features:
- **Base image**: `node:18-alpine` (small, ~50MB vs ~300MB full)
- **Non-root user**: Runs as `appuser` (security best practice)
- **Layer caching**: `package.json` copied before source code
- **Health check**: Built into the image for orchestrator compatibility

### 2.2 Build and Test Locally

```bash
# Navigate to app directory
cd app

# Build the Docker image
docker build -t immerverse-cicd-app:latest .

# Verify the image was created
docker images immerverse-cicd-app

# Run the container locally
docker run -d \
  --name immerverse-test \
  -p 3000:3000 \
  -e NODE_ENV=development \
  immerverse-cicd-app:latest

# Test the endpoints
curl http://localhost:3000/
curl http://localhost:3000/health
curl http://localhost:3000/metrics

# Check container logs
docker logs immerverse-test

# Stop and remove
docker stop immerverse-test && docker rm immerverse-test
```

### 2.3 Run Tests Inside Docker

```bash
# Run tests in a temporary container
docker run --rm immerverse-cicd-app:latest npm test
```

---

## Step 3 — Jenkins CI Pipeline Setup

### 3.1 Install Jenkins (on EC2 / VM)

```bash
# ── On Ubuntu/Debian ──────────────────────────────────────────────────────────
# Install Java (Jenkins requires JDK 17+)
sudo apt update && sudo apt install -y openjdk-17-jdk

# Add Jenkins repository
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key \
  | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/" \
  | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt update && sudo apt install -y jenkins

# Start Jenkins
sudo systemctl enable jenkins && sudo systemctl start jenkins

# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### 3.2 Install Required Jenkins Plugins

Go to **Manage Jenkins → Plugins → Available** and install:

| Plugin | Purpose |
|--------|---------|
| Git Plugin | Clone GitHub repositories |
| Docker Pipeline | Build and push Docker images |
| Kubernetes CLI Plugin | `kubectl` commands in pipeline |
| Pipeline | Declarative pipeline support |
| GitHub Integration | Webhook trigger support |
| HTML Publisher | Publish test coverage reports |
| JUnit | Publish test results |

### 3.3 Configure Jenkins Credentials

Go to **Manage Jenkins → Credentials → System → Global credentials**:

| ID | Type | Description |
|----|------|-------------|
| `dockerhub-credentials` | Username + Password | Docker Hub login |
| `kubeconfig-credentials` | Secret File | `~/.kube/config` file |
| `aws-credentials` | AWS Credentials | AWS access key + secret (for ECR) |
| `ec2-ssh-key` | SSH Username with private key | EC2 deployment SSH key |

### 3.4 Create Jenkins Pipeline Job

1. **New Item** → Enter name: `immerverse-cicd` → Select **Pipeline** → OK
2. Under **General**: ✅ Check **GitHub project** → enter repo URL
3. Under **Build Triggers**: ✅ Check **GitHub hook trigger for GITScm polling**
4. Under **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/<your-username>/immerverse-cicd.git`
   - Credentials: *(add GitHub PAT credentials)*
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
5. Click **Save**

### 3.5 Pipeline Stages Explained

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Jenkins Pipeline Stages                           │
├──────────────────┬──────────────────────────────────────────────────┤
│ Stage            │ What Happens                                      │
├──────────────────┼──────────────────────────────────────────────────┤
│ Checkout         │ git clone from GitHub                            │
│ Install Deps     │ npm ci (clean install from package-lock.json)    │
│ Test             │ Jest unit tests + coverage report                │
│ Build Docker     │ docker build with build number as tag            │
│ Security Scan    │ Trivy scans for HIGH/CRITICAL CVEs               │
│ Push to Registry │ docker push to Docker Hub (or ECR)               │
│ Deploy to K8s    │ kubectl apply + rolling update                   │
│ Smoke Test       │ HTTP health check against live service           │
└──────────────────┴──────────────────────────────────────────────────┘
```

### 3.6 Install Docker on Jenkins Server

```bash
# Install Docker
sudo apt install -y docker.io
sudo systemctl enable docker && sudo systemctl start docker

# Add jenkins user to docker group
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins

# Verify
docker --version
```

---

## Step 4 — Container Registry

### Option A: Docker Hub

```bash
# Tag image for Docker Hub
docker tag immerverse-cicd-app:latest \
  your-dockerhub-username/immerverse-cicd-app:latest

# Login
docker login -u your-dockerhub-username

# Push
docker push your-dockerhub-username/immerverse-cicd-app:latest
docker push your-dockerhub-username/immerverse-cicd-app:1.0.0
```

### Option B: Amazon ECR

```bash
# Set variables
AWS_ACCOUNT_ID=123456789012
AWS_REGION=ap-south-1
ECR_REPO=immerverse-cicd-app

# Create ECR repository
aws ecr create-repository \
  --repository-name $ECR_REPO \
  --region $AWS_REGION

# Authenticate Docker to ECR
aws ecr get-login-password --region $AWS_REGION \
  | docker login \
    --username AWS \
    --password-stdin \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Tag and push
ECR_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO
docker tag immerverse-cicd-app:latest $ECR_URI:latest
docker push $ECR_URI:latest
```

---

## Step 5 — Deployment

### Option A: Deploy to EC2

```bash
# ── On your local machine / Jenkins agent ────────────────────────────────────
# SSH into EC2 instance
ssh -i "your-key.pem" ubuntu@<EC2_PUBLIC_IP>

# ── On the EC2 instance ──────────────────────────────────────────────────────
# Install Docker
sudo apt update && sudo apt install -y docker.io
sudo systemctl start docker && sudo systemctl enable docker

# Pull and run the application
docker pull your-dockerhub-username/immerverse-cicd-app:latest

docker run -d \
  --name immerverse-app \
  --restart always \
  -p 80:3000 \
  -e NODE_ENV=production \
  your-dockerhub-username/immerverse-cicd-app:latest

# Verify
curl http://localhost/health
```

> **EC2 Security Group**: Open inbound port **80** (HTTP) and **22** (SSH).

### Option B: Deploy to Kubernetes (EKS)

#### 5.1 Create EKS Cluster

```bash
# Install eksctl
curl --silent --location \
  "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" \
  | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Create cluster (takes ~15 minutes)
eksctl create cluster \
  --name immerverse-cluster \
  --region ap-south-1 \
  --nodegroup-name immerverse-nodes \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5 \
  --managed

# Verify
kubectl get nodes
```

#### 5.2 Deploy Application to Kubernetes

```bash
# Apply all Kubernetes manifests
kubectl apply -f k8s/

# Verify deployment
kubectl get pods -n immerverse
kubectl get services -n immerverse
kubectl get hpa -n immerverse

# Watch rollout
kubectl rollout status deployment/immerverse-app -n immerverse

# Get LoadBalancer URL
kubectl get svc immerverse-service -n immerverse \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

#### 5.3 Update Image (Rolling Update)

```bash
# Update to a new image version (Jenkins does this automatically)
kubectl set image deployment/immerverse-app \
  immerverse-app=your-dockerhub-username/immerverse-cicd-app:42 \
  -n immerverse

# Rollback if something goes wrong
kubectl rollout undo deployment/immerverse-app -n immerverse
```

---

## Step 6 — Monitoring

### 6.1 Deploy Prometheus and Grafana to Kubernetes

```bash
# Deploy monitoring stack
kubectl apply -f monitoring/prometheus.yaml
kubectl apply -f monitoring/grafana.yaml

# Wait for pods to be ready
kubectl get pods -n immerverse -l app=prometheus
kubectl get pods -n immerverse -l app=grafana

# Get Grafana external URL
kubectl get svc grafana-service -n immerverse \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

### 6.2 Access Grafana Dashboard

1. Open the Grafana URL in your browser (port 80)
2. Login: **admin / ImmerVerse@2024** *(change this in production!)*
3. The **ImmerVerse App Overview** dashboard is auto-provisioned

### 6.3 Metrics Available

| Metric | Description |
|--------|-------------|
| `http_requests_total` | Total HTTP request count |
| `nodejs_heap_size_bytes` | Node.js heap memory (bytes) |
| `nodejs_rss_bytes` | Resident Set Size memory |
| `http_request_duration_avg_ms` | Average request duration |
| `process_uptime_seconds` | Process uptime |

### 6.4 Alerts Configured

| Alert | Condition | Severity |
|-------|-----------|----------|
| `HighCPUUsage` | CPU > 80% for 2min | Warning |
| `HighMemoryUsage` | Heap > 200MB for 5min | Warning |
| `PodDown` | Pod not reachable for 1min | Critical |

---

## CI/CD Flow Diagram

```
Developer
    │
    │  git push origin main
    ▼
GitHub Repository
    │
    │  Webhook (POST /github-webhook/)
    ▼
Jenkins Pipeline
    │
    ├─ Stage 1: Checkout ──────────── git clone
    │
    ├─ Stage 2: Install Deps ──────── npm ci
    │
    ├─ Stage 3: Test ──────────────── Jest → JUnit report
    │
    ├─ Stage 4: Build Docker ──────── docker build
    │
    ├─ Stage 5: Security Scan ─────── Trivy vulnerability scan
    │
    ├─ Stage 6: Push Registry ─────── docker push → Docker Hub / ECR
    │
    ├─ Stage 7: Deploy K8s ────────── kubectl apply + kubectl set image
    │                                 (Rolling update: 0 downtime)
    │
    └─ Stage 8: Smoke Test ────────── curl /health → pass/fail
         │
         ├─ ✅ SUCCESS → Slack notification "Build #N deployed"
         └─ ❌ FAILURE → Slack alert + automatic rollback
```

---

## Local Development

### Run with Docker Compose (recommended)

```bash
# Start all services (app + Prometheus + Grafana)
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f app

# Access services:
#   Application: http://localhost:3000
#   Prometheus:  http://localhost:9090
#   Grafana:     http://localhost:3001  (admin/admin123)

# Stop everything
docker compose down
```

### Run Locally (without Docker)

```bash
cd app

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

---

## Deliverables Checklist

| Deliverable | Status | Details |
|-------------|--------|---------|
| ✅ GitHub Repository | Done | Push code to GitHub and share link |
| ✅ Dockerfile | Done | `app/Dockerfile` (multi-stage, non-root) |
| ✅ Jenkins Pipeline Script | Done | `Jenkinsfile` (8 stages) |
| ✅ Running Application URL | Done | `http://<LoadBalancer-IP>/` |
| ✅ Kubernetes Deployment Config | Done | `k8s/` directory (6 manifests) |
| ✅ Monitoring Setup | Done | `monitoring/` (Prometheus + Grafana) |
| ✅ Unit Tests | Done | `app/app.test.js` (Jest + Supertest) |
| ✅ Docker Compose (local) | Done | `docker-compose.yml` |

---

## Useful Commands Reference

```bash
# ── Docker ───────────────────────────────────────────────────────────────────
docker build -t immerverse-cicd-app .        # Build image
docker run -p 3000:3000 immerverse-cicd-app  # Run container
docker ps                                     # List running containers
docker logs immerverse-app                    # View logs

# ── Kubernetes ───────────────────────────────────────────────────────────────
kubectl get pods -n immerverse               # List pods
kubectl get svc -n immerverse                # List services
kubectl describe pod <pod-name> -n immerverse  # Pod details
kubectl logs <pod-name> -n immerverse        # Pod logs
kubectl rollout undo deployment/immerverse-app -n immerverse  # Rollback

# ── Jenkins ──────────────────────────────────────────────────────────────────
# Trigger build manually via CLI
curl -X POST http://<jenkins-url>:8080/job/immerverse-cicd/build \
  --user admin:<api-token>

# ── AWS EKS ──────────────────────────────────────────────────────────────────
aws eks update-kubeconfig \
  --region ap-south-1 \
  --name immerverse-cluster
```

---

*Assignment completed by: DevOps Engineer*
*Tools: Git · Jenkins · Docker · AWS (EC2/EKS/ECR) · Kubernetes · Prometheus · Grafana*
