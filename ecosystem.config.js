const path = require('path');
const homeDir = process.env.HOME || '/home/fffstanza';
const baseDir = path.join(homeDir, 'Folonite/SharaSpot-Outreach');

module.exports = {
  apps: [
    {
      name: "sharaspot-api",
      cwd: path.join(baseDir, 'server'),
      script: "npm",
      args: "run start", // Using production build (dist/index.js)
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_memory_restart: "500M",
      error_file: path.join(homeDir, ".pm2/logs/sharaspot-api-error.log"),
      out_file: path.join(homeDir, ".pm2/logs/sharaspot-api-out.log"),
    },
    {
      name: "sharaspot-worker",
      cwd: path.join(baseDir, 'server'),
      script: "npm",
      args: "run worker:prod", // Using production build (dist/worker/index.js)
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_memory_restart: "500M",
      error_file: path.join(homeDir, ".pm2/logs/sharaspot-worker-error.log"),
      out_file: path.join(homeDir, ".pm2/logs/sharaspot-worker-out.log"),
    },
    {
      name: "sharaspot-frontend",
      cwd: path.join(baseDir, 'client'),
      script: "npm",
      args: "run start", // Using production build (next start)
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_memory_restart: "1G",
      error_file: path.join(homeDir, ".pm2/logs/sharaspot-frontend-error.log"),
      out_file: path.join(homeDir, ".pm2/logs/sharaspot-frontend-out.log"),
    },
    {
      name: "sharaspot-admin",
      cwd: path.join(baseDir, 'admin-dashboard'),
      script: "npm",
      args: "run start", // Using production build (next start)
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_memory_restart: "500M",
      error_file: path.join(homeDir, ".pm2/logs/sharaspot-admin-error.log"),
      out_file: path.join(homeDir, ".pm2/logs/sharaspot-admin-out.log"),
    },
  ],
};
