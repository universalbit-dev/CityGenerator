module.exports = {
  apps: [
    {
      name: "CityGenerator",
      script: "./https_server.js",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
}
