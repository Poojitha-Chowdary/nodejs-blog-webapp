/* Requires the Docker Pipeline plugin */
pipeline {
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
