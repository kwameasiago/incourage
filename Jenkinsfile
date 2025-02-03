pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_FILE = "docker-compose.test.yml"
        SSH_USER = credentials('SSH_USER')
        SSH_HOST = credentials('SSH_HOST')
        SSH_KEY= credentials('SSH_KEY')
        DATABASE_URL='postgres://postgres:password@testDb:5432/photo_db'
        POSTGRES_DB='photo_db'
        POSTGRES_USER='postgres'
        POSTGRES_PASSWORD='password'
        POSTGRES_HOST='testDb'
        POSTGRES_TYPE='postgres'
        POSTGRES_PORT=5432

        AWS_ACCESS_KEY='test'
        AWS_SECRET_KEY='test'
        S3_BUCKET_NAME='test'
        NODE_ENV='development'
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
        stage('Build Docker Containers') {
            steps {
                script {
                    echo "Creating a .env"
                    sh "touch .env.test"
                    echo "Building and starting containers..."
                    sh "docker compose -f docker-compose.test.yml build --no-cache"
                }
            }
        }

        stage('Start Docker Containers') {
            steps {
                script {
                    
                    echo "Building and starting containers..."
                    sh "docker compose -f docker-compose.test.yml up -d"
                }
            }
        }

        stage('Run Unit  Tests') {
            steps {
                script {
                    echo "Running Unit Tests..."
                    sh "docker compose -f docker-compose.test.yml exec api-test npm run test -- --detectOpenHandles"
                }
            }
        }

        stage('Run e2e Tests') {
            steps {
                script {
                    echo "Running End-to-End Tests..."
                    sh "docker compose -f docker-compose.test.yml exec api-test npm run test:e2e -- --detectOpenHandles"
                }
            }
        }


        stage('Deploy to DigitalOcean') {   
            steps {
                script {
                    echo "Deploying to DigitalOcean..."
                    sh "ssh -i ${SSH_KEY} ${SSH_USER}@${SSH_HOST} "
                    sh "./sync.sh"
                    sh "exit"
                    sh """
                    ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} << 'EOF'
                    echo "Starting deployment on remote server..."
                    chmod +x sync.sh
                    ./sync.sh
                    echo "Deployment completed."
                    EOF
                    """
                   
                }
            }
        }
    }

    post {
        always {
            echo "Cleaning up workspace..."
            script {
                echo "Building branch: ${env.BRANCH_NAME}"
                sh "docker compose -f docker-compose.test.yml down -v"

            }
        }
        success {
            echo "Deployment successful!"
        }
        failure {
            echo "Deployment failed. Check logs for details."
        }
    }
}
