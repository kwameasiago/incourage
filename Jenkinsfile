pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_FILE = "docker-compose.prod.yml"
        SSH_USER = "deploy"
        SSH_HOST = credentials('DO_SSH_HOST')  // Stored in Jenkins credentials
        SSH_KEY = credentials('DO_SSH_KEY')  // Stored in Jenkins credentials
    }

    stages {
        stage('Checkout Code') {
            steps {
                script {
                    echo "Checking out repository..."
                    checkout scm
                }
            }
        }

        stage('Build and Start Docker Containers') {
            steps {
                script {
                    echo "Building and starting containers..."
                    sh "docker compose -f ${DOCKER_COMPOSE_FILE} up --build -d"
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    echo "Running Unit Tests..."
                    sh "docker compose -f ${DOCKER_COMPOSE_FILE} exec api-test npm run test"

                    echo "Running End-to-End Tests..."
                    sh "docker compose -f ${DOCKER_COMPOSE_FILE} exec api-test npm run test:e2e"
                }
            }
        }

        stage('Stop and Remove Containers') {
            steps {
                script {
                    echo "Stopping and removing containers..."
                    sh "docker compose -f ${DOCKER_COMPOSE_FILE} down -v"
                }
            }
        }

        stage('Deploy to DigitalOcean') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "Deploying to DigitalOcean..."
                    sh """
                        ssh -i ${SSH_KEY} ${SSH_USER}@${SSH_HOST} << EOF
                            cd incourage
                            git pull origin main
                            docker compose -f ${DOCKER_COMPOSE_FILE} up --build -d
                            docker system prune -af
                        EOF
                    """
                }
            }
        }
    }

    post {
        always {
            echo "Cleaning up workspace..."
            sh "docker system prune -af"
        }
        success {
            echo "Deployment successful!"
        }
        failure {
            echo "Deployment failed. Check logs for details."
        }
    }
}
