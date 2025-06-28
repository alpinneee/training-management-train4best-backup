module.exports = {
  apps: [
    {
      name: 'train4best-app',
      script: 'cpanel-start.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        UV_THREADPOOL_SIZE: '1',
        NODE_OPTIONS: '--max-old-space-size=256'
      }
    }
  ]
}; 