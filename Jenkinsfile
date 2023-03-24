/* Requires the Docker Pipeline plugin */
pipeline {
    /* agent { docker { image 'node:16.17.1-alpine' } } */
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
