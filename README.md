# CI/CD Pipeline Assignment

> Complete CI/CD pipeline using GitHub · Jenkins · Docker · AWS ECR · EC2 · Prometheus · Grafana

---

## Stack

| Component        | Tool                              |
| ---------------- | --------------------------------- |
| Source Code      | GitHub                            |
| CI/CD            | Jenkins                           |
| Containerization | Docker                            |
| Registry         | Amazon Elastic Container Registry |
| Server           | Amazon EC2                        |
| Monitoring       | Prometheus + Grafana              |

---

## Project Structure

```
sample-devops-app/
├── app/
│   ├── app.js          # Node.js Express application
│   ├── package.json    # Dependencies and scripts
│   └── Dockerfile      # Docker build
├── Jenkinsfile         # Jenkins Declarative Pipeline
├── docker-compose.yml  # App + Prometheus + Grafana
├── prometheus.yml      # Prometheus scrape config
└── README.md
```

---

## Application Endpoints

| Endpoint  | Description           |
| --------- | --------------------- |
| `GET /`   | Returns pipeline status message |
| `GET /health` | Health check       |

---

## Setup Steps

### 1. EC2 Instance

- AMI: Ubuntu 22.04
- Type: t2.medium
- Storage: 20 GB

**Security Group Ports:**

| Port | Purpose    |
| ---- | ---------- |
| 22   | SSH        |
| 80   | HTTP       |
| 8080 | Jenkins    |
| 3000 | Node App   |
| 3001 | Grafana    |
| 9090 | Prometheus |

### 2. Install Docker

```bash
sudo apt install docker.io -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu
```

### 3. Install Jenkins

```bash
sudo apt install openjdk-17-jdk -y

curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
/usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
/etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt update && sudo apt install jenkins -y
sudo systemctl enable jenkins
sudo systemctl start jenkins
```

Give Jenkins Docker access:

```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### 4. Configure ECR

```bash
sudo apt install awscli -y
aws configure
```

Login Docker to ECR:

```bash
aws ecr get-login-password --region ap-south-1 | \
docker login --username AWS --password-stdin YOUR_ECR_URI
```

### 5. Jenkins Pipeline

1. **New Item** → Pipeline
2. Pipeline script from SCM → Git
3. Add your GitHub repo URL
4. Save and **Build Now**

Pipeline stages:

```
Checkout → Build Docker Image → Test → Tag → Login to ECR → Push → Deploy
```

---

## Monitoring

Start with Docker Compose:

```bash
docker compose up -d
```

| Service    | URL                           |
| ---------- | ----------------------------- |
| App        | http://YOUR_PUBLIC_IP:3000    |
| Prometheus | http://YOUR_PUBLIC_IP:9090    |
| Grafana    | http://YOUR_PUBLIC_IP:3001    |

Grafana login: `admin / admin`

Check container health:

```bash
docker stats
```

---

## Deliverables

| Item                   | File                  |
| ---------------------- | --------------------- |
| GitHub Repo            | This repository       |
| Running App URL        | `http://YOUR_PUBLIC_IP:3000` |
| Jenkinsfile            | `Jenkinsfile`         |
| Dockerfile             | `app/Dockerfile`      |
| Docker Compose         | `docker-compose.yml`  |
| Prometheus Config      | `prometheus.yml`      |

---

> Built a complete CI/CD pipeline using Jenkins, Docker, AWS ECR, and EC2 with automated deployment and monitoring using Prometheus and Grafana.
