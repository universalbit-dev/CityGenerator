module.exports = {
  apps: [
    {
      name: "CityGenerator",
      script: "./https_server.js",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "1G",
      listen_timeout: 8000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
}
