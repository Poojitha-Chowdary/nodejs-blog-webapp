pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                node {
                    sh 'npm install'
                }
            }
        }

        stage('Build') {
            steps {
                node {
                    sh 'npm run build'
                }
            }
        }

        stage('Test') {
            steps {
                node {
                    sh 'npm run test'
                }
            }
        }

        stage('Deploy') {
            steps {
                node {
                    sh 'npm run deploy'
                }
            }
        }
    }
}
