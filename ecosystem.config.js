module.exports = {
  apps: [
    {
      name: 'tos-api',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // 자동 재시작 설정
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // 로그 설정
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 에러 발생 시 재시작 설정
      min_uptime: '10s',
      max_restarts: 10,
      
      // 환경변수 파일 로드
      env_file: '.env'
    },
    {
      name: 'pm2-discord-monitor',
      script: 'pm2-discord-monitor.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_file: '.env'
    }
  ]
};
