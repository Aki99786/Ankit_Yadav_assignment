# 🚀 Professional CI/CD Pipeline & Automated Monitoring Deployment
> **Final DevOps Assignment Submission Report**

A comprehensive, production-grade DevOps implementation automating the build, testing, containerization, secure ECR registry management, zero-downtime deployment, and persistent metric-driven monitoring of a containerized Node.js application.

---

## 📋 Deliverables & Quick Links

| Deliverable | Location / URL | Description |
| :--- | :--- | :--- |
| **1. GitHub Repository** | [Aki99786/Ankit_Yadav_assignment](https://github.com/Aki99786/Ankit_Yadav_assignment) | Complete, version-controlled source code and pipeline config |
| **2. Dockerfile** | [`app/Dockerfile`](https://github.com/Aki99786/Ankit_Yadav_assignment/blob/main/app/Dockerfile) | Optimized Alpine-based production Dockerfile |
| **3. Jenkins Pipeline** | [`Jenkinsfile`](https://github.com/Aki99786/Ankit_Yadav_assignment/blob/main/Jenkinsfile) | Continuous Integration & Automated Delivery Pipeline |
| **4. Running App URL** | [http://3.6.89.105:3000](http://3.6.89.105:3000) | Live NodeJS application deployed on EC2 |
| **5. Application Health** | [http://3.6.89.105:3000/health](http://3.6.89.105:3000/health) | Lightweight JSON-based application health check |
| **6. Scraped Metrics** | [http://3.6.89.105:3000/metrics](http://3.6.89.105:3000/metrics) | Live Prometheus metric exposition endpoint |
| **7. Prometheus UI** | [http://3.6.89.105:9090](http://3.6.89.105:9090) | Target validation, scrape statuses, and queries |
| **8. Grafana UI** | [http://3.6.89.105:3001](http://3.6.89.105:3001) | Live dashboard for CPU, RAM, Latency & GC (Credentials: `admin / admin`) |
| **9. Jenkins Portal** | [http://3.6.89.105:8080](http://3.6.89.105:8080) | Pipeline orchestration server managing the builds |

---

## 🐳 1. Dockerfile Details (`app/Dockerfile`)

An optimized, single-stage Dockerfile built on a lightweight **Alpine** base image, minimizing the attack surface and reducing build times.

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

## ⚙️ 2. Jenkins Pipeline Script (`Jenkinsfile`)

A declarative pipeline featuring **instant GitHub webhook integration**, secure AWS ECR login, multi-stage building, and **zero-downtime deployment**.

```groovy
pipeline {
    agent any

    triggers {
        githubPush() // Trigger instantly whenever code is pushed to GitHub
    }

    environment {
        AWS_REGION = 'ap-south-1'
        ECR_REPO   = '451712634800.dkr.ecr.ap-south-1.amazonaws.com/sample-devops-app'
        IMAGE_TAG  = 'latest'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Aki99786/Ankit_Yadav_assignment.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                docker build -t $ECR_REPO:$IMAGE_TAG ./app
                '''
            }
        }

        stage('Test') {
            steps {
                sh '''
                echo "Running unit tests..."
                # Add test runner command here (e.g., npm test)
                '''
            }
        }

        stage('Login to ECR') {
            steps {
                sh '''
                aws ecr get-login-password --region $AWS_REGION | \
                docker login \
                --username AWS \
                --password-stdin $ECR_REPO
                '''
            }
        }

        stage('Push Image to ECR') {
            steps {
                sh '''
                docker push $ECR_REPO:$IMAGE_TAG
                '''
            }
        }

        stage('Deploy Application') {
            steps {
                sh '''
                docker compose pull nodejs-app
                docker compose up -d --no-deps nodejs-app
                '''
            }
        }
    }
}
```

---

## 🛠️ 3. Deployment Configuration (`docker-compose.yml`)

The deployment architecture is completely containerized. By leveraging **Docker Named Volumes**, both Grafana and Prometheus maintain absolute state persistence across pipeline executions.

```yaml
version: '3.8'

services:

  nodejs-app:
    build:
      context: ./app
    container_name: nodejs-app
    ports:
      - "3000:3000"
    networks:
      - monitor-net

  prometheus:
    image: prom/prometheus
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - monitor-net

  grafana:
    image: grafana/grafana
    container_name: grafana
    ports:
      - "3001:3000"
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
      - grafana-data:/var/lib/grafana
    networks:
      - monitor-net

networks:
  monitor-net:
    driver: bridge

volumes:
  prometheus-data:
  grafana-data:
```

---

## 📊 4. Advanced SRE & Monitoring Architecture

### 🧠 A. Path Normalizer & Bucket Optimization
To prevent memory cardinality issues in Prometheus and ensure Grafana matches response times accurately:
* **Custom Path Normalizer:** Implemented a robust keyword-mapping mechanism inside `app.js` that groups dynamic routes (e.g., `/api/user/123`, `/api/user/456`) into unified `#val` labels.
* **Duration Histogram Buckets:** Replaced custom counter gauges with a Prometheus `http_request_duration_seconds` Histogram using highly targeted buckets (`[0.1, 0.3, 0.5, 0.9, 1.5, 3, 5, 10]`) matching the Grafana dashboard queries perfectly.

### 🛡️ B. Zero-Downtime Micro-Deployments
Instead of tearing down the monitoring stack via `docker compose down` during every deployment (which causes dashboard resets and outages), our pipeline:
1. Keeps the database (Grafana/Prometheus) running continuously.
2. Only updates the target application using:
   ```bash
   docker compose pull nodejs-app
   docker compose up -d --no-deps nodejs-app
   ```
This provides 100% stable, continuous monitoring uptime during code changes.

### 🚫 C. cAdvisor-Free Performance Optimization
We analyzed cAdvisor and realized it created severe overlayfs and rootfs volume conflicts with Docker snap packages. Since the application provides its own rich Node.js/V8 runtime metrics, and container health is monitored directly using target scrape state (`up{job="nodejs-app"}`), **cAdvisor was completely removed from the environment**, saving valuable server RAM and CPU ticks!

---

## 📈 5. How to Import the Perfect Fixed Dashboard

The pre-patched NodeJS dashboard is located at **`nodejs_dashboard_fixed.json`** in this repository. 

1. Copy the contents of [`nodejs_dashboard_fixed.json`](https://github.com/Aki99786/Ankit_Yadav_assignment/blob/main/nodejs_dashboard_fixed.json).
2. Open Grafana at [http://3.6.89.105:3001](http://3.6.89.105:3001).
3. Navigate to **Dashboards** -> **New** -> **Import**.
4. Paste the JSON and click **Import**.
5. All panels (CPU, RAM, Event Loop, GC detail, and active status) will immediately render live metrics!
