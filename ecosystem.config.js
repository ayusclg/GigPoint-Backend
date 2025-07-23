module.exports = {
  apps: [
    {
      name: "mybackend", // App name
      script: ".dist/index.js", // Entry point
      watch:false,
      env: {
        NODE_ENV: "development",
          PORT: 3000,
      },
    },
  ],
};
