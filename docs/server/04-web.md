# 🌐 Managing Websites

One of the primary functions of CandyPack is to create and manage websites. The `web` command is your entry point for all website-related operations.

## Create a Website
This command helps you set up a new website on your server. CandyPack will ask for the domain name and the path to the website's files.

### Usage
```bash
candy web create
```
After running the command, you will be prompted to enter the following information:
- **Domain Name:** The primary domain for your website (e.g., `example.com`).
- **Path:** The absolute path to your website's root directory (e.g., `/var/www/example.com`). If you leave this blank, CandyPack will suggest a default path based on the domain name.

### Example
```bash
$ candy web create
> Enter the domain name: example.com
> Enter the path to the website (/home/user/example.com/):
```

## List Websites
To see a list of all websites currently configured on your server, use the `list` command.

### Usage
```bash
candy web list
```

This command will output a table of your websites, showing their status and other relevant details. You can also monitor your websites in real-time with the `candy monit` command.
