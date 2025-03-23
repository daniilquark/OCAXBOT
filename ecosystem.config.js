module.exports = {
    apps: [
      {
        name: 'ocaxbot',
        script: 'dist/server.js',
        watch: false,
        instances: 1,
        exec_mode: 'fork',
        env: {
          NODE_ENV: 'production',
        },
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
        restart_delay: 2000
      }
    ]
  };
  