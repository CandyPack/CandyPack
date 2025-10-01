## 🗑️ Delete a Website

You can delete a website using the `web delete` command. This command will prompt you for the domain name of the website you want to delete.

### Interactive Usage
```bash
candy web delete
```

The command will then ask for the domain name:
```
Enter the domain name: my-website.com
```

### Single-Line Usage with Prefixes
```bash
# Specify domain directly
candy web delete -d my-website.com

# Or use long form prefix
candy web delete --domain my-website.com
```

### Available Prefixes
- `-d`, `--domain`: Domain name of the website to delete

### Important Note

This command only removes the server configuration for the website. It **does not** delete the website's source code directory. If you want to remove the source code as well, you must delete the directory manually.
