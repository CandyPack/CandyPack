# Getting Started

This guide covers the core concepts of the CandyPack server and its basic command-line interface (CLI) commands.

## Core Concepts 🧠

CandyPack is designed to be a powerful, developer-first toolkit that runs as a persistent background service on your server. Here’s how it works:

- **Background Service:** Once started, CandyPack runs continuously in the background, managing all your configured websites and services. You don't need to manually keep it active.
- **CLI Control:** You interact with and control the CandyPack server through the `candy` command-line tool. This tool allows you to start, stop, monitor, and manage your applications.
- **Automation:** The primary goal of CandyPack is to automate common server management tasks, such as SSL certificate renewal, service monitoring, and application deployment, allowing you to focus on development.

## Basic Commands 💻

These are the most common commands for interacting with the CandyPack server.

### Check Status
To see the current status of the CandyPack server, including uptime and the number of running services, simply run the `candy` command with no arguments:
```bash
candy
```

### Restart the Server
If you need to apply new configurations or restart all services, you can use the `restart` command:
```bash
candy restart
```

### Monitor Services
To get a real-time, interactive view of your running websites and services, use the `monit` command:
```bash
candy monit
```

### View Live Logs
For debugging purposes, you can view a live stream of all server and application logs with the `debug` command:
```bash
candy debug
```

### Get Help
To see a list of all available commands, use the `help` command:
```bash
candy help
```

---

**Next Steps:** For more advanced topics, such as managing websites, services, SSL certificates, and mail accounts, please refer to the upcoming documentation files.
