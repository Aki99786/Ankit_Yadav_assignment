# 🚀 Professional DevOps CI/CD Pipeline & Monitoring Deployment

## DevOps Assignment Submission Report

---

# 1. Project Overview

This project demonstrates the implementation of a complete production-style CI/CD pipeline for a containerized Node.js application using modern DevOps tools and cloud infrastructure.

The solution automates:

* Source code management
* Docker image creation
* Automated CI/CD pipeline execution
* Secure image storage in AWS ECR
* Automated deployment on AWS EC2
* Monitoring and observability using Prometheus and Grafana

---

# 2. Architecture Diagram

```text
Developer
    ↓
Git Push
    ↓
GitHub Repository
    ↓
Jenkins Pipeline
    ↓
Docker Image Build
    ↓
AWS ECR Push
    ↓
Docker Compose Deployment on EC2
    ↓
Prometheus Monitoring
    ↓
Grafana Dashboard Visualization
```

---

# 3. Technology Stack

| Category               | Technology     |
| ---------------------- | -------------- |
| Source Code Management | GitHub         |
| CI/CD Tool             | Jenkins        |
| Containerization       | Docker         |
| Container Registry     | AWS ECR        |
| Cloud Platform         | AWS EC2        |
| Monitoring             | Prometheus     |
| Visualization          | Grafana        |
| Application Runtime    | Node.js        |
| Deployment Tool        | Docker Compose |

---

# 4. Infrastructure Setup

## AWS EC2 Instance

| Configuration    | Value        |
| ---------------- | ------------ |
| Operating System | Ubuntu 22.04 |
| Instance Type    | t2.small     |
| Storage          | 20 GB        |
| Region           | ap-south-1   |

---

## Security Group Configuration

| Port | Purpose             |
| ---- | ------------------- |
| 22   | SSH Access          |
| 3000 | Node.js Application |
| 8080 | Jenkins Dashboard   |
| 9090 | Prometheus          |
| 3001 | Grafana             |

---

# 5. CI/CD Workflow

The CI/CD pipeline is fully automated using Jenkins.

## Pipeline Flow

1. Developer pushes code to GitHub
2. Jenkins webhook automatically triggers the pipeline
3. Jenkins checks out source code
4. Docker image is built
5. Automated tests are executed inside the Docker container
6. Jenkins authenticates with AWS ECR
7. Docker image is pushed to ECR
8. Application container is updated using Docker Compose
9. Monitoring stack remains persistent during deployments

---

# 6. GitHub Repository

## Repository URL

```text
https://github.com/Aki99786/Ankit_Yadav_assignment
```

---

# 7. Application Structure

```text
Ankit_Yadav_assignment/
│
├── app/
│   ├── app.js
│   ├── package.json
│   ├── Dockerfile
│   └── package-lock.json
│
├── Jenkinsfile
├── docker-compose.yml
├── prometheus.yml
└── README.md
```

---

# 8. Dockerfile Configuration

## app/Dockerfile

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

## Dockerfile Optimization Features

* Lightweight Alpine base image
* Reduced image size
* Faster container startup
* Minimal attack surface
* Production-ready containerization

---

# 9. Jenkins Pipeline Configuration

## Jenkinsfile

```groovy
pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        AWS_REGION = 'ap-south-1'
        ECR_REPO = '451712634800.dkr.ecr.ap-south-1.amazonaws.com/sample-devops-app'
        IMAGE_TAG = 'latest'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                url: 'https://github.com/Aki99786/Ankit_Yadav_assignment.git'
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
                docker run --rm $ECR_REPO:$IMAGE_TAG npm test
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



# 10. AWS ECR Integration

AWS ECR is used as the centralized private container registry.

## Benefits

* Secure Docker image storage
* Native AWS integration
* Scalable image management
* Better production practices than public Docker Hub

## ECR Repository

```text
451712634800.dkr.ecr.ap-south-1.amazonaws.com/sample-devops-app
```

---

# 11. Deployment Configuration

## docker-compose.yml

```yaml
version: '3.8'

services:

  nodejs-app:
    image: 451712634800.dkr.ecr.ap-south-1.amazonaws.com/sample-devops-app:latest

    container_name: nodejs-app

    ports:
      - "3000:3000"

    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

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



# 12. Monitoring Setup

Monitoring is implemented using Prometheus and Grafana.

---

## Prometheus Responsibilities

* Metric collection
* Metric scraping
* Time-series storage
* Monitoring target management

---

## Grafana Responsibilities

* Dashboard visualization
* Real-time graphs
* Metric analytics
* Monitoring dashboards

---

# 13. Prometheus Configuration

## prometheus.yml

```yaml
global:
  scrape_interval: 15s

scrape_configs:

  - job_name: 'prometheus'

    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'nodejs-app'

    static_configs:
      - targets: ['nodejs-app:3000']
```

---

# 14. Application Metrics Endpoint

The Node.js application exposes metrics through:

```text
/metrics
```

using:

```text
prom-client
```

This allows Prometheus to collect:

* CPU usage
* Memory usage
* Process metrics
* Event loop metrics
* Application uptime

---

# 15. Health Monitoring

Docker health checks are implemented for container monitoring.

## Health Endpoint

```text
/health
```

## Docker Healthcheck

```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

---

# 16. Metrics Monitored

| Metric             | Monitoring Tool    |
| ------------------ | ------------------ |
| CPU Usage          | Prometheus         |
| Memory Usage       | Prometheus         |
| Application Health | Docker Healthcheck |
| Container Status   | Docker             |
| Application Uptime | Prometheus         |
| Request Metrics    | Prometheus         |

---

# 17. Persistent Monitoring Storage

Docker named volumes are used to persist monitoring data.

## Benefits

* Grafana dashboards persist after restart
* Prometheus metrics persist after restart
* Monitoring configuration remains intact
* Prevents dashboard reset during deployments

---

# 18. Application URLs

| Service          | URL                                                              |
| ---------------- | ---------------------------------------------------------------- |
| Application      | [http://3.6.89.105:3000](http://3.6.89.105:3000)                 |
| Health Check     | [http://3.6.89.105:3000/health](http://3.6.89.105:3000/health)   |
| Metrics Endpoint | [http://3.6.89.105:3000/metrics](http://3.6.89.105:3000/metrics) |
| Jenkins          | [http://3.6.89.105:8080](http://3.6.89.105:8080)                 |
| Prometheus       | [http://3.6.89.105:9090](http://3.6.89.105:9090)                 |
| Grafana          | [http://3.6.89.105:3001](http://3.6.89.105:3001)                 |

---

# 19. Grafana Credentials

```text
Username: admin
Password: admin
```



# 20. Scalability Considerations

The architecture is designed for future scalability.

## Future Scaling Options

* ECS Fargate migration
* Kubernetes deployment
* Auto-scaling implementation
* Load balancer integration
* Blue/Green deployment
* Canary deployment



# 21. Key DevOps Concepts Implemented

* CI/CD Pipeline Automation
* Containerization
* Infrastructure Monitoring
* Health Checks
* AWS Cloud Integration
* Persistent Storage
* Automated Deployment
* Docker Networking
* Secure Registry Authentication
* Observability

---

# 22. Conclusion

This project successfully demonstrates the implementation of a complete DevOps CI/CD pipeline using Jenkins, Docker, AWS ECR, AWS EC2, Prometheus, and Grafana.

The solution automates:

* Build
* Test
* Containerization
* Registry push
* Deployment
* Monitoring

while maintaining:

* scalability
* automation
* persistence
* monitoring continuity
* infrastructure optimization

The overall architecture follows production-oriented DevOps practices with a focus on automation, monitoring, maintainability, and operational stability.

---

# 23. Final Deliverables

| Deliverable                 | Status    |
| --------------------------- | --------- |
| GitHub Repository           | Completed |
| Dockerfile                  | Completed |
| Jenkins Pipeline            | Completed |
| AWS ECR Integration         | Completed |
| Automated Deployment        | Completed |
| Monitoring Setup            | Completed |
| CPU & Memory Metrics        | Completed |
| Container Health Monitoring | Completed |
| Prometheus Integration      | Completed |
| Grafana Dashboard           | Completed |

---

