const fs = require('fs');
const path = require('path');

// .env 파일 파싱
const envFile = path.join(__dirname, '.env');
const envVars = {};
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf-8').split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && key.trim() && !key.startsWith('#')) {
      envVars[key.trim()] = vals.join('=').trim();
    }
  });
}

module.exports = {
  apps: [{
    name: 'ihavenomenu',
    script: '.output/server/index.mjs',
    cwd: '/var/www/ihavenomenu',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    max_memory_restart: '300M',
    env: envVars
  }]
}
