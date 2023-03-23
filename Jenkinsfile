/* Requires the Docker Pipeline plugin */
pipeline {
    agent { docker { image 'maven:3.9.0-eclipse-temurin-11' } }
    stages {
        stage('pre-build') {
            steps {
                sh 'node --version'
            }
        }
        stage('build') {
            steps {
                sh 'echo "Build stage started"'
            }
        }
        stage('test') {
            steps {
                sh 'echo "Test stage started"'
            }
        }
        stage('deploy') {
            steps {
                sh 'echo "Deploy stage started"'
            }
        }
    }
}
