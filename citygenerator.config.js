module.exports = {
  apps: [
    {
      name: "CityGenerator",
      script: "./https_server.js",
      instances: "2",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
}
