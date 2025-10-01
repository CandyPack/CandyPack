## 💻 Basic Commands

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

### Using Prefix Arguments
Many CandyPack commands support prefix arguments that allow you to provide values directly in the command line, avoiding interactive prompts. This is especially useful for automation and scripting.

**Common Prefixes:**
- `-d`, `--domain`: Specify domain name
- `-e`, `--email`: Specify email address  
- `-p`, `--password`: Specify password
- `-s`, `--subdomain`: Specify subdomain
- `-i`, `--id`: Specify service ID
- `-k`, `--key`: Specify authentication key

**Example:**
```bash
# Interactive mode (prompts for input)
candy web create

# Single-line mode with prefix
candy web create -d example.com
```

---

**Next Steps:** For more advanced topics, such as managing websites, services, SSL certificates, and mail accounts, please refer to the upcoming documentation files.
