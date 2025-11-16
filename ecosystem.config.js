module.exports = {
    apps: [
        {
            name: "gigpoint",
            script: "dist/index.js",
            args: "",
            watch: false,
            instances: 1,
            exec_mode: "fork",
            autorestart:true,
            restart_delay: 5000,
            min_uptime: "60s",
            max_restarts: 10,
        }
    ]
}