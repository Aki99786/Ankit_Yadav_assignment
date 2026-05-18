# 🚀 DevOps CI/CD Pipeline & Monitoring Assignment
> **Final Deliverables & Submission Report**

---

## 📦 1. Key Submission Deliverables

### 🔗 **1. GitHub Repository**
* **Repository Link:** [https://github.com/Aki99786/Ankit_Yadav_assignment](https://github.com/Aki99786/Ankit_Yadav_assignment)

---

### 🐋 **2. Dockerfile**
* **File Location:** [`app/Dockerfile`](https://github.com/Aki99786/Ankit_Yadav_assignment/blob/main/app/Dockerfile)
* **Build Details:** Lightweight Alpine base image optimizing build time and image size.

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

### ⚙️ **3. Jenkins Pipeline Script**
* **File Location:** [`Jenkinsfile`](https://github.com/Aki99786/Ankit_Yadav_assignment/blob/main/Jenkinsfile)
* **Pipeline Highlights:**
  * **Instant Triggers:** Configured with GitHub Webhooks (`githubPush()`) for instant push-to-build execution.
  * **Registry Push:** Automated image build, secure AWS ECR login, and push.
  * **Zero-Downtime deploy:** Targets and redeploys only the Node app container, maintaining continuous monitoring uptime.

---

### 🌐 **4. Running Application URLs**

| Component | Active Live URL | Description |
| :--- | :--- | :--- |
| **NodeJS App** | [http://3.6.89.105:3000](http://3.6.89.105:3000) | Running Node.js application |
| **Health Check** | [http://3.6.89.105:3000/health](http://3.6.89.105:3000/health) | Lightweight JSON application health check |
| **App Metrics** | [http://3.6.89.105:3000/metrics](http://3.6.89.105:3000/metrics) | Scrape endpoint exposing app metrics |
| **Prometheus UI** | [http://3.6.89.105:9090](http://3.6.89.105:9090) | Target scrape status and metrics validation |
| **Grafana UI** | [http://3.6.89.105:3001](http://3.6.89.105:3001) | Live dashboard UI *(Credentials: `admin / admin`)* |
| **Jenkins Portal** | [http://3.6.89.105:8080](http://3.6.89.105:8080) | CI/CD orchestration server dashboard |

---

### 🛠️ **5. Deployment Configuration**
* **Compose Config:** [`docker-compose.yml`](https://github.com/Aki99786/Ankit_Yadav_assignment/blob/main/docker-compose.yml)
* **Scrape Config:** [`prometheus.yml`](https://github.com/Aki99786/Ankit_Yadav_assignment/blob/main/prometheus.yml)
* **Data Persistence:** Integrated persistent **Docker Named Volumes** (`grafana-data` and `prometheus-data`) to prevent dashboard and metrics loss during container recreation.

---

## 🛡️ 2. Core Architecture Highlights

### ⚡ **Zero-Downtime Micro-Deployments**
Our deployment stage is optimized to prevent monitoring downtime. Instead of tearing down the whole stack via `docker compose down`, we only pull and update the Node.js container:
```bash
docker compose pull nodejs-app
docker compose up -d --no-deps nodejs-app
```

### 🧠 **Advanced Path Normalizer & Buckets**
* **Path Normalizer:** Replaces dynamic route parameters (e.g. IDs) with a unified `#val` segment to avoid Prometheus memory exhaust (high cardinality).
* **Target Health State:** Swapped cAdvisor query with Prometheus's built-in target health metric `up{job="nodejs-app"}` to monitor container health cleanly, without requiring deep cgroup file system mounts.
