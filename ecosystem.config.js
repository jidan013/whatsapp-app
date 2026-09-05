module.exports = {
  apps: [
    {
      name: "agenda-web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "512M",
      error_file: "./logs/web-error.log",
      out_file: "./logs/web-out.log",
      merge_logs: true,
      time: true,
    },
    {
      name: "agenda-bot",
      script: "dist/bot/index.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "512M",
      error_file: "./logs/bot-error.log",
      out_file: "./logs/bot-out.log",
      merge_logs: true,
      time: true,
      // Bot melakukan reconnect sendiri (lihat bot/connection.ts), tapi PM2 tetap
      // jadi jaring pengaman kedua jika process benar-benar crash (uncaught exception fatal).
      autorestart: true,
      restart_delay: 5000,
    },
  ],
};
