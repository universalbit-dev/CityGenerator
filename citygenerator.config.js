module.exports = {
  apps: [
    {
      name: "CityGenerator",
      script: "./https_server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
}
