// Dedicated demo job. Never attach this repository to the production job.
pipeline {
    agent any
    options { disableConcurrentBuilds() }
    parameters {
        choice(name: 'ACTION', choices: ['BUILD', 'DEPLOY', 'STOP', 'START'],
               description: 'Build/test the demo, deploy it with Docker Compose, or control its existing container.')
    }
    environment { DEMO_CONTAINER = 'digitalfactory-demo' }
    stages {
        stage('Build Demo') {
            when { expression { (params.ACTION ?: 'BUILD') in ['BUILD', 'DEPLOY'] } }
            tools { nodejs 'Node22' }
            steps {
                dir('frontend') {
                    sh 'pnpm install --frozen-lockfile'
                    sh 'pnpm test'
                    sh 'pnpm build'
                }
                archiveArtifacts artifacts: 'frontend/dist/**', fingerprint: true
            }
        }
        stage('Deploy Demo') {
            when { expression { params.ACTION == 'DEPLOY' } }
            steps {
                sh 'docker compose up -d --build'
                sh 'docker compose ps --status running'
            }
        }
        stage('Control Demo') {
            when { expression { params.ACTION in ['STOP', 'START'] } }
            steps {
                sh 'sh ci/demo-lifecycle.sh "$ACTION" "$DEMO_CONTAINER"'
            }
        }
    }
    post { always { cleanWs() } }
}
