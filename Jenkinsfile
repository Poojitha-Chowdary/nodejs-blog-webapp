/* Requires the Docker Pipeline plugin */
pipeline {
    agent any
    stages {
        stage('pre-build') {
            steps {
                echo 'Pre-Build Stage'
            }
        }
        stage('build') {
            steps {
                echo 'Building...'
            }
        }
        stage('test') {
            steps {
                echo 'Testing...'
            }
        }
        stage('deploy') {
            steps {
                echo 'Deploying...'
            }
        }
    }
}
