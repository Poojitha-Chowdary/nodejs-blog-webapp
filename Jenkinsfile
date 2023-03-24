/* Requires the Docker Pipeline plugin */
pipeline {
    agent any
    stages {
        stage('pre-build') {
            steps {
                echo 'Pre-Build Stage'
                sh 'node --version'
            }
        }
        stage('build') {
            steps {
                echo 'Building...'
                sh 'echo "Build stage started"'
            }
        }
        stage('test') {
            steps {
                echo 'Testing...'
                sh 'echo "Test stage started"'
            }
        }
        stage('deploy') {
            steps {
                echo 'Deploying...'
                sh 'echo "Deploy stage started"'
            }
        }
    }
}
