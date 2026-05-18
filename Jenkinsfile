pipeline {

    agent any

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
                docker build -t sample-devops-app ./app
                '''
            }
        }

        stage('Test') {
            steps {
                sh '''
                cd app
                npm install
                npm test
                '''
            }
        }

        stage('Tag Docker Image') {
            steps {
                sh '''
                docker tag sample-devops-app:latest $ECR_REPO:$IMAGE_TAG
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
                docker compose down || true

                docker compose pull

                docker compose up -d
                '''
            }
        }
    }
}
