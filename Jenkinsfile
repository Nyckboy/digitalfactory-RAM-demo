// Dedicated demo job. Never attach this repository to the production job.
pipeline {
    agent any
    options { disableConcurrentBuilds() }
    parameters {
        choice(name: 'ACTION', choices: ['BUILD', 'STOP', 'START'],
               description: 'Build the static demo, or control its separately provisioned container.')
    }
    environment { DEMO_CONTAINER = 'digitalfactory-demo' }
    stages {
        stage('Build Demo') {
            when { expression { (params.ACTION ?: 'BUILD') == 'BUILD' } }
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
        stage('Control Demo') {
            when { expression { params.ACTION in ['STOP', 'START'] } }
            steps {
                sh 'sh ci/demo-lifecycle.sh "$ACTION" "$DEMO_CONTAINER"'
            }
        }
    }
    post { always { cleanWs() } }
}
