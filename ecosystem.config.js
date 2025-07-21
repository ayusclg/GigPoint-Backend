module.exports = {
  apps: [
    {
      name: "mybackend", // App name
      script: "npm", // Entry point
      args: "run dev",
      env: {
        NODE_ENV: "development",
          PORT: 3000,
      },
    },
  ],
};
