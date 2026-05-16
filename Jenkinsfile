// ─────────────────────────────────────────────────────────────────────────────
//  ImmerVerse CI/CD Pipeline — Jenkins Declarative Pipeline
//  Triggers on every push to the 'main' branch via GitHub Webhook
// ─────────────────────────────────────────────────────────────────────────────
pipeline {
    agent any

    // ── Global environment variables ──────────────────────────────────────────
    environment {
        // --- Docker Hub credentials (stored in Jenkins Credentials store) ---
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_USERNAME        = 'your-dockerhub-username'          // ← change this
        IMAGE_NAME             = 'immerverse-cicd-app'
        IMAGE_TAG              = "${env.BUILD_NUMBER}"               // e.g. 42
        FULL_IMAGE             = "${DOCKER_USERNAME}/${IMAGE_NAME}"

        // --- AWS / ECR (uncomment if using ECR instead of Docker Hub) ---
        // AWS_ACCOUNT_ID = credentials('aws-account-id')
        // AWS_REGION     = 'ap-south-1'
        // ECR_REGISTRY   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        // ECR_REPO       = "${ECR_REGISTRY}/${IMAGE_NAME}"

        // --- Kubernetes namespace ---
        K8S_NAMESPACE = 'immerverse'

        // --- Sonar (optional) ---
        // SONAR_HOST_URL = 'http://your-sonar-server:9000'
        // SONAR_TOKEN    = credentials('sonar-token')
    }

    // ── Triggers ──────────────────────────────────────────────────────────────
    triggers {
        githubPush()          // Fires on every GitHub push event via webhook
        // pollSCM('H/5 * * * *')  // Fallback: poll every 5 minutes
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))   // Keep last 10 builds
        timeout(time: 30, unit: 'MINUTES')               // Fail if > 30 min
        disableConcurrentBuilds()                         // Only one at a time
        timestamps()                                      // Prefix logs with time
    }

    // ── Pipeline stages ───────────────────────────────────────────────────────
    stages {

        // ──────────────────────────────────────────────────────────────────────
        //  STAGE 1 – Checkout
        // ──────────────────────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo '🔄 Checking out source code from GitHub...'
                checkout scm
                sh 'git log --oneline -5'       // Print last 5 commits for audit
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        //  STAGE 2 – Install Dependencies
        // ──────────────────────────────────────────────────────────────────────
        stage('Install Dependencies') {
            steps {
                dir('app') {
                    echo '📦 Installing Node.js dependencies...'
                    sh 'npm ci'                 // Clean install (uses package-lock)
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        //  STAGE 3 – Test
        // ──────────────────────────────────────────────────────────────────────
        stage('Test') {
            steps {
                dir('app') {
                    echo '🧪 Running unit tests with Jest...'
                    sh 'npm run test:ci'
                }
            }
            post {
                always {
                    // Publish JUnit-compatible test report
                    junit 'app/junit.xml'
                    // Publish code-coverage HTML report
                    publishHTML(target: [
                        allowMissing         : false,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'app/coverage/lcov-report',
                        reportFiles          : 'index.html',
                        reportName           : 'Coverage Report',
                    ])
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        //  STAGE 4 – Build Docker Image
        // ──────────────────────────────────────────────────────────────────────
        stage('Build Docker Image') {
            steps {
                dir('app') {
                    echo "🐳 Building Docker image: ${FULL_IMAGE}:${IMAGE_TAG}"
                    sh """
                        docker build \
                          --build-arg NODE_ENV=production \
                          --build-arg APP_VERSION=${IMAGE_TAG} \
                          -t ${FULL_IMAGE}:${IMAGE_TAG} \
                          -t ${FULL_IMAGE}:latest \
                          .
                    """
                    sh "docker images ${FULL_IMAGE}"
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        //  STAGE 5 – Security Scan (Trivy)
        // ──────────────────────────────────────────────────────────────────────
        stage('Security Scan') {
            steps {
                echo '🔒 Scanning Docker image for vulnerabilities (Trivy)...'
                sh """
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      aquasec/trivy:latest image \
                        --exit-code 0 \
                        --severity HIGH,CRITICAL \
                        --format table \
                        ${FULL_IMAGE}:${IMAGE_TAG}
                """
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        //  STAGE 6 – Push to Docker Hub
        // ──────────────────────────────────────────────────────────────────────
        stage('Push to Docker Hub') {
            steps {
                echo "📤 Pushing image to Docker Hub..."
                sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                sh "docker push ${FULL_IMAGE}:${IMAGE_TAG}"
                sh "docker push ${FULL_IMAGE}:latest"
            }
        }

        // ── Alternative: Push to Amazon ECR ────────────────────────────────
        // stage('Push to ECR') {
        //     steps {
        //         withAWS(region: "${AWS_REGION}", credentials: 'aws-credentials') {
        //             sh """
        //                 aws ecr get-login-password --region ${AWS_REGION} \
        //                   | docker login --username AWS --password-stdin ${ECR_REGISTRY}
        //                 docker tag ${FULL_IMAGE}:${IMAGE_TAG} ${ECR_REPO}:${IMAGE_TAG}
        //                 docker tag ${FULL_IMAGE}:latest       ${ECR_REPO}:latest
        //                 docker push ${ECR_REPO}:${IMAGE_TAG}
        //                 docker push ${ECR_REPO}:latest
        //             """
        //         }
        //     }
        // }

        // ──────────────────────────────────────────────────────────────────────
        //  STAGE 7 – Deploy to Kubernetes
        // ──────────────────────────────────────────────────────────────────────
        stage('Deploy to Kubernetes') {
            steps {
                echo "🚀 Deploying build #${IMAGE_TAG} to Kubernetes namespace '${K8S_NAMESPACE}'..."
                withKubeConfig([credentialsId: 'kubeconfig-credentials']) {
                    sh """
                        # Ensure namespace exists
                        kubectl get namespace ${K8S_NAMESPACE} 2>/dev/null || \
                          kubectl create namespace ${K8S_NAMESPACE}

                        # Apply manifests
                        kubectl apply -f k8s/ -n ${K8S_NAMESPACE}

                        # Update image tag to the newly built image
                        kubectl set image deployment/immerverse-app \
                          immerverse-app=${FULL_IMAGE}:${IMAGE_TAG} \
                          -n ${K8S_NAMESPACE}

                        # Wait for rollout to complete (timeout 3 min)
                        kubectl rollout status deployment/immerverse-app \
                          -n ${K8S_NAMESPACE} --timeout=180s
                    """
                }
            }
        }

        // ── Alternative: Deploy to EC2 ──────────────────────────────────────
        // stage('Deploy to EC2') {
        //     steps {
        //         sshagent(['ec2-ssh-key']) {
        //             sh """
        //                 ssh -o StrictHostKeyChecking=no ubuntu@<EC2_PUBLIC_IP> '
        //                     docker pull ${FULL_IMAGE}:${IMAGE_TAG}
        //                     docker stop immerverse-app || true
        //                     docker rm   immerverse-app || true
        //                     docker run -d --name immerverse-app \
        //                       -p 80:3000 \
        //                       --restart always \
        //                       ${FULL_IMAGE}:${IMAGE_TAG}
        //                 '
        //             """
        //         }
        //     }
        // }

        // ──────────────────────────────────────────────────────────────────────
        //  STAGE 8 – Smoke Test (post-deploy verification)
        // ──────────────────────────────────────────────────────────────────────
        stage('Smoke Test') {
            steps {
                echo '💨 Running smoke tests against live deployment...'
                withKubeConfig([credentialsId: 'kubeconfig-credentials']) {
                    script {
                        // Wait briefly for pods to stabilise
                        sleep(time: 15, unit: 'SECONDS')
                        def svcIP = sh(
                            script: "kubectl get svc immerverse-service -n ${K8S_NAMESPACE} " +
                                    "-o jsonpath='{.status.loadBalancer.ingress[0].ip}'",
                            returnStdout: true
                        ).trim()
                        sh "curl -sf http://${svcIP}/health || (echo '❌ Smoke test failed!' && exit 1)"
                        echo "✅ Smoke test passed — app is live at http://${svcIP}"
                    }
                }
            }
        }
    }

    // ── Post-build actions ────────────────────────────────────────────────────
    post {
        success {
            echo "✅ Pipeline completed successfully — build #${env.BUILD_NUMBER}"
            // Uncomment to send Slack notification:
            // slackSend channel: '#devops-alerts',
            //            color: 'good',
            //            message: "✅ Build #${env.BUILD_NUMBER} deployed successfully — ${env.JOB_NAME}"
        }
        failure {
            echo "❌ Pipeline FAILED — build #${env.BUILD_NUMBER}"
            // slackSend channel: '#devops-alerts',
            //            color: 'danger',
            //            message: "❌ Build #${env.BUILD_NUMBER} FAILED — ${env.JOB_NAME}"
        }
        always {
            echo '🧹 Cleaning up Docker resources...'
            sh """
                docker rmi ${FULL_IMAGE}:${IMAGE_TAG} || true
                docker rmi ${FULL_IMAGE}:latest       || true
                docker system prune -f                 || true
            """
        }
    }
}
