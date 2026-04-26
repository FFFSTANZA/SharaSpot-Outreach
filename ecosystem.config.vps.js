const path = require('path');
const baseDir = '/root/SharaSpot';

module.exports = {
    apps: [
        {
            name: "sharaspot-api",
            cwd: path.join(baseDir, 'server'),
            script: "npm",
            args: "run start",
            env: {
                NODE_ENV: "production",
            },
            autorestart: true,
            max_memory_restart: "500M",
        },
        {
            name: "sharaspot-worker",
            cwd: path.join(baseDir, 'server'),
            script: "npm",
            args: "run worker:prod",
            env: {
                NODE_ENV: "production",
            },
            autorestart: true,
            max_memory_restart: "500M",
        },
        {
            name: "sharaspot-frontend",
            cwd: path.join(baseDir, 'client'),
            script: "npm",
            args: "run start",
            env: {
                NODE_ENV: "production",
            },
            autorestart: true,
            max_memory_restart: "1G",
        },
        {
            name: "sharaspot-admin",
            cwd: path.join(baseDir, 'admin-dashboard'),
            script: "npm",
            args: "run start -- -p 3001",
            env: {
                NODE_ENV: "production",
            },
            autorestart: true,
            max_memory_restart: "500M",
        },
    ],
};
